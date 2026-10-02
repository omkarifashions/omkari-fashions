import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const STYLES = {
  success: { bar: 'bg-emerald-600', icon: '✓' },
  error: { bar: 'bg-red-600', icon: '!' },
  warning: { bar: 'bg-amber-500', icon: '⚠' },
  info: { bar: 'bg-brand-orange', icon: 'i' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (type, message, ms = 3500) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((t) => [...t.slice(-3), { id, type, message }]);
      setTimeout(() => dismiss(id), ms);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m, 5000),
      warning: (m) => push('warning', m, 4500),
      info: (m) => push('info', m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:items-end sm:pr-5" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role="status" className="pointer-events-auto flex w-full max-w-sm animate-toastIn items-stretch overflow-hidden rounded-md bg-white shadow-xl ring-1 ring-black/10">
            <span className={`flex w-10 shrink-0 items-center justify-center text-lg font-bold text-white ${STYLES[t.type].bar}`}>{STYLES[t.type].icon}</span>
            <p className="flex-1 px-3 py-3 text-sm text-brand-ink">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="px-3 text-lg text-brand-muted hover:text-brand-ink">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
