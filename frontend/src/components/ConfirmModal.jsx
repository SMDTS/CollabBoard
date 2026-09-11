// ConfirmModal.jsx
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AUTH_BG } from "../assets/cdn.js";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = true,
  isLoading = false,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="bp2-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
          />
          <div className="bp2-modal" role="dialog" aria-modal="true">
            <motion.div
              className="bp2-modal__card"
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ maxWidth: 440 }}
            >
              <div className="bp2-modal__card-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
              <div className="bp2-modal__card-overlay" aria-hidden="true" />
              <div className="bp2-modal__card-glow" style={{ background: danger ? "rgba(242, 85, 92, 0.25)" : "rgba(139, 111, 242, 0.25)" }} aria-hidden="true" />

              <div className="bp2-modal__header">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: danger ? "rgba(242, 85, 92, 0.15)" : "rgba(139, 111, 242, 0.15)",
                      border: `1px solid ${danger ? "rgba(242, 85, 92, 0.3)" : "rgba(139, 111, 242, 0.3)"}`,
                      color: danger ? "#f2555c" : "#8b6ff2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <h2 className="bp2-modal__title">{title}</h2>
                </div>
                {!isLoading && (
                  <button type="button" className="bp2-modal__close" onClick={onClose} aria-label="Close">
                    ×
                  </button>
                )}
              </div>

              <div className="bp2-modal__body" style={{ padding: "16px 24px 20px" }}>
                <p style={{ color: "var(--bp-text-dim, #cbd5e1)", fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
                  {message}
                </p>
              </div>

              <div className="bp2-modal__footer">
                <button
                  type="button"
                  className="bp2-modal__btn bp2-modal__btn--ghost"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  className={`bp2-modal__btn ${danger ? "bp2-panel__delete" : "bp2-modal__btn--primary"}`}
                  style={danger ? { marginTop: 0 } : undefined}
                  onClick={onConfirm}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing…" : confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
