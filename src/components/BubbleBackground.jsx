import { useEffect, useRef } from "react";

function BubbleBackground({ interactive = true, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!interactive) return;
    const el = ref.current;
    if (!el) return;

    function handleMove(e) {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
    }

    el.addEventListener("mousemove", handleMove);
    return () => el.removeEventListener("mousemove", handleMove);
  }, [interactive]);

  return (
    <div ref={ref} className={`bubble-bg ${className}`} aria-hidden="true">
      <span className="bubble bubble--1" />
      <span className="bubble bubble--2" />
      <span className="bubble bubble--3" />
      {interactive && <span className="bubble bubble--cursor" />}
    </div>
  );
}

export default BubbleBackground;