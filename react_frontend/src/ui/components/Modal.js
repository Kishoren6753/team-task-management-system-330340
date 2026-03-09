import React, { useEffect } from "react";

// PUBLIC_INTERFACE
export function Modal({ title, open, onClose, children, footer }) {
  /** Accessible modal dialog with overlay and Escape-to-close behavior. */
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal">
        <div className="modalHeader">
          <h3 className="modalTitle">{title}</h3>
          <button className="btn btnGhost" onClick={onClose} aria-label="Close dialog">
            Close
          </button>
        </div>
        <div className="modalBody">{children}</div>
        {footer ? <div className="modalFooter">{footer}</div> : null}
      </div>
    </div>
  );
}
