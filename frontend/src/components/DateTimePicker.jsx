// DateTimePicker.jsx
// A calendar-grid + time popover, styled to match the rest of the app,
// used in place of the bare native <input type="datetime-local"> (which
// renders very differently — and not always nicely — across browsers).
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

// value <-> {date, time} — value stays "YYYY-MM-DDTHH:mm" (same shape the
// native datetime-local input produced) so nothing downstream (TasksContext,
// the backend's free-text dueDate field) needs to change.
function parseValue(value) {
  if (!value) return { date: null, time: "09:00" };
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = (datePart || "").split("-").map(Number);
  if (!y || !m || !d) return { date: null, time: timePart || "09:00" };
  return { date: new Date(y, m - 1, d), time: timePart || "09:00" };
}

function toValue(date, time) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}T${time || "00:00"}`;
}

function isSameDay(a, b) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildGrid(viewMonth) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ muted: true, date: new Date(year, month - 1, daysInPrevMonth - i) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ muted: false, date: new Date(year, month, d) });
  }
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ muted: true, date: new Date(year, month + 1, nextDay) });
    nextDay++;
  }
  return cells;
}

function formatDisplay(date, time) {
  if (!date) return "";
  const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const [h, m] = (time || "09:00").split(":").map(Number);
  const timeDate = new Date();
  timeDate.setHours(h, m, 0, 0);
  const timeStr = timeDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dateStr} · ${timeStr}`;
}

function DateTimePicker({ value, onChange, placeholder = "Pick a due date & time" }) {
  const { date: initialDate, time: initialTime } = parseValue(value);
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(initialDate || new Date());
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const today = new Date();

  // Stay in sync if the parent resets the field (e.g. the modal reopening).
  useEffect(() => {
    const parsed = parseValue(value);
    setSelectedDate(parsed.date);
    setTime(parsed.time);
    if (parsed.date) setViewMonth(parsed.date);
  }, [value]);

  // The popover is rendered via a portal (see below) so it can't get
  // clipped by the modal's scrollable body — position it "manually"
  // against the trigger button's on-screen position instead of relying
  // on normal document flow. Flips above the trigger (and caps its own
  // height with internal scrolling) whenever there isn't enough room
  // below, so it always stays fully on-screen and reachable.
  useLayoutEffect(() => {
    if (!isOpen) return;
    function place() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const margin = 8;
      const popoverWidth = 296;
      const preferredHeight = 420;

      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - margin) {
        left = window.innerWidth - popoverWidth - margin;
      }
      left = Math.max(margin, left);

      const spaceBelow = window.innerHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin;

      let top;
      let maxHeight;
      if (spaceBelow >= preferredHeight || spaceBelow >= spaceAbove) {
        // Enough room below (or more room below than above) — normal drop-down.
        top = rect.bottom + 6;
        maxHeight = Math.max(180, Math.min(preferredHeight, window.innerHeight - top - margin));
      } else {
        // Not enough room below — flip it above the trigger instead.
        maxHeight = Math.max(180, Math.min(preferredHeight, spaceAbove));
        top = Math.max(margin, rect.top - 6 - maxHeight);
      }

      setCoords({ top, left, maxHeight });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (triggerRef.current?.contains(e.target)) return;
      if (popoverRef.current?.contains(e.target)) return;
      setIsOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function commit(nextDate, nextTime) {
    onChange(toValue(nextDate, nextTime));
  }

  function pickDay(date) {
    setSelectedDate(date);
    commit(date, time);
  }

  function changeTime(nextTime) {
    setTime(nextTime);
    if (selectedDate) commit(selectedDate, nextTime);
  }

  function pickToday() {
    const d = new Date();
    setViewMonth(d);
    setSelectedDate(d);
    commit(d, time);
  }

  function pickTomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setViewMonth(d);
    setSelectedDate(d);
    commit(d, time);
  }

  function clear() {
    setSelectedDate(null);
    onChange("");
    setIsOpen(false);
  }

  function shiftMonth(delta) {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  const grid = buildGrid(viewMonth);

  const popover = isOpen && coords && (
    <div
      className="dtp__popover"
      ref={popoverRef}
      style={{ position: "fixed", top: coords.top, left: coords.left, maxHeight: coords.maxHeight }}
    >
      <div className="dtp__quick">
        <button type="button" className="dtp__quick-btn" onClick={pickToday}>Today</button>
        <button type="button" className="dtp__quick-btn" onClick={pickTomorrow}>Tomorrow</button>
        <button type="button" className="dtp__quick-btn dtp__quick-btn--clear" onClick={clear}>Clear</button>
      </div>

      <div className="dtp__nav">
        <button type="button" className="dtp__nav-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="dtp__nav-label">
          {viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </span>
        <button type="button" className="dtp__nav-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      <div className="dtp__weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w} className="dtp__weekday">{w}</span>
        ))}
      </div>

      <div className="dtp__grid">
        {grid.map(({ date, muted }, i) => {
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          return (
            <button
              type="button"
              key={i}
              className={[
                "dtp__day",
                muted && "dtp__day--muted",
                isToday && "dtp__day--today",
                isSelected && "dtp__day--selected",
              ].filter(Boolean).join(" ")}
              onClick={() => pickDay(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="dtp__time-row">
        <span className="dtp__time-label">Time</span>
        <input
          type="time"
          className="dtp__time-input"
          value={time}
          onChange={(e) => changeTime(e.target.value)}
        />
      </div>

      <button type="button" className="dtp__done" onClick={() => setIsOpen(false)}>
        Done
      </button>
    </div>
  );

  return (
    <div className="dtp">
      <button
        type="button"
        className="dtp__trigger"
        ref={triggerRef}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="16" y1="2" x2="16" y2="6" />
        </svg>
        <span className={selectedDate ? "dtp__trigger-value" : "dtp__trigger-placeholder"}>
          {selectedDate ? formatDisplay(selectedDate, time) : placeholder}
        </span>
      </button>

      {popover && createPortal(popover, document.body)}
    </div>
  );
}

export default DateTimePicker;