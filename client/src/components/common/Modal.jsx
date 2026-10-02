import { useEffect } from 'react';
import { CloseIcon } from './Icons.jsx';

export default function Modal({ open, onClose, title, children, wide = false, locked = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && !locked && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, locked]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && !locked && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`flex max-h-[92vh] w-full flex-col rounded-t-xl bg-cream shadow-2xl sm:rounded-xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}>
        <div className="flex items-center justify-between border-b border-beige-dark px-5 py-4">
          <h2 className="font-display text-xl font-bold text-brand-heading">{title}</h2>
          <button type="button" onClick={onClose} disabled={locked} aria-label="Close" className="rounded p-1 text-brand-text hover:bg-beige disabled:opacity-40"><CloseIcon size={22} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
