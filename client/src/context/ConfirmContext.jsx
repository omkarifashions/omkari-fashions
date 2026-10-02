import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ConfirmContext = createContext(null);
export const useConfirm = () => useContext(ConfirmContext);

/**
 * confirm({ title, message, confirmText, cancelText, tone: 'danger'|'primary', withReason, reasonLabel })
 * resolves to false (cancelled) or true / the typed reason when withReason is set.
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const [reason, setReason] = useState('');
  const resolver = useRef(null);
  const confirmBtn = useRef(null);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setReason('');
        setState(opts);
      }),
    []
  );

  const close = (value) => {
    resolver.current?.(value);
    resolver.current = null;
    setState(null);
  };

  useEffect(() => {
    if (!state) return undefined;
    const onKey = (e) => e.key === 'Escape' && close(false);
    document.addEventListener('keydown', onKey);
    confirmBtn.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [state]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-lg bg-cream p-6 shadow-2xl">
            <h2 id="confirm-title" className="font-display text-xl font-bold text-brand-heading">{state.title || 'Are you sure?'}</h2>
            {state.message && <p className="mt-2 text-[15px] text-brand-text">{state.message}</p>}
            {state.withReason && (
              <div className="mt-4">
                <label htmlFor="confirm-reason" className="label">{state.reasonLabel || 'Reason'}</label>
                <textarea id="confirm-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="input" placeholder={state.reasonPlaceholder || ''} />
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => close(false)} className="rounded-[4px] border border-brand-muted/50 px-5 py-2.5 font-bold text-brand-text hover:bg-beige">
                {state.cancelText || 'Cancel'}
              </button>
              <button
                ref={confirmBtn}
                type="button"
                disabled={state.withReason && state.reasonRequired && reason.trim().length < 3}
                onClick={() => close(state.withReason ? reason.trim() || 'No reason provided' : true)}
                className={`rounded-[4px] px-5 py-2.5 font-bold text-white disabled:opacity-50 ${state.tone === 'danger' ? 'bg-red-700 hover:bg-red-800' : 'bg-btn'}`}
              >
                {state.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
