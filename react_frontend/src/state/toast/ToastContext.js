import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

function nextId() {
  return `toast_${Math.random().toString(16).slice(2, 10)}`;
}

// PUBLIC_INTERFACE
export function ToastProvider({ children }) {
  /** Toast provider to show success/error messages in a consistent way. */
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    ({ title, description, variant = "info", ttlMs = 3500 }) => {
      const id = nextId();
      const toast = { id, title, description, variant };
      setToasts((prev) => [toast, ...prev].slice(0, 4));
      const timer = setTimeout(() => remove(id), ttlMs);
      timers.current.set(id, timer);
      return id;
    },
    [remove]
  );

  const api = useMemo(
    () => ({
      push,
      success: (title, description) => push({ title, description, variant: "success" }),
      error: (title, description) => push({ title, description, variant: "error" }),
      info: (title, description) => push({ title, description, variant: "info" }),
      remove
    }),
    [push, remove]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toastStack" aria-live="polite" aria-relevant="additions removals">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.variant === "error" ? "toastError" : ""} ${
              t.variant === "success" ? "toastSuccess" : ""
            }`}
            role="status"
          >
            <p className="toastTitle">{t.title}</p>
            {t.description ? <p className="toastDesc">{t.description}</p> : null}
            <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btnGhost" onClick={() => remove(t.id)}>
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useToast() {
  /** Hook to push/remove toast notifications. */
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
