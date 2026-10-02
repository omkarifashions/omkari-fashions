import { Link } from 'react-router-dom';

export function LoadingSpinner({ size = 'md', className = '', label = 'Loading' }) {
  const s = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-[3px]', lg: 'h-12 w-12 border-4' }[size];
  return <span role="status" aria-label={label} className={`inline-block animate-spin rounded-full border-brand-orange border-t-transparent ${s} ${className}`} />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-brand-text">
      <LoadingSpinner size="lg" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded ${className}`} aria-hidden="true" />;
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[2/3] w-full rounded-[4px]" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-1.5 h-4 w-1/3" />
    </div>
  );
}

export function EmptyState({ title, message, actionLabel, to, onAction, image = true }) {
  return (
    <div className="flex flex-col items-center px-4 py-14 text-center">
      {image && <img src="/images/logo.png" alt="" className="mb-4 h-16 w-16 opacity-80" />}
      <h2 className="font-display text-xl font-bold text-brand-heading">{title}</h2>
      {message && <p className="mt-1 max-w-md text-brand-text">{message}</p>}
      {actionLabel && (to ? <Link to={to} className="btn-primary mt-5">{actionLabel}</Link> : <button type="button" onClick={onAction} className="btn-primary mt-5">{actionLabel}</button>)}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong while loading this section.', onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center px-4 py-12 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-700">!</span>
      <p className="max-w-md text-brand-text">{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="btn-outline mt-4">Try again</button>}
    </div>
  );
}

export function RatingStars({ value = 0, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" fill={n <= Math.round(value) ? '#F2B01E' : '#D8C9BE'} aria-hidden="true">
          <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
        </svg>
      ))}
    </span>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  const nums = [];
  for (let i = 1; i <= pages; i += 1) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
  const withGaps = nums.reduce((acc, n, i) => (i && n - nums[i - 1] > 1 ? [...acc, '…' + n, n] : [...acc, n]), []);
  const base = 'flex h-9 min-w-9 items-center justify-center rounded px-2 text-sm font-bold';
  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className={`${base} bg-beige text-brand-text disabled:opacity-40`} aria-label="Previous page">‹</button>
      {withGaps.map((n) => (typeof n === 'string' ? <span key={n} className="px-1 text-brand-muted">…</span> : (
        <button key={n} type="button" onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined} className={`${base} ${n === page ? 'bg-btn text-white' : 'bg-beige text-brand-text hover:bg-beige-dark'}`}>{n}</button>
      )))}
      <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} className={`${base} bg-beige text-brand-text disabled:opacity-40`} aria-label="Next page">›</button>
    </nav>
  );
}

export function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-xs text-brand-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center gap-1.5">
            {it.to && i < items.length - 1 ? <Link to={it.to} className="hover:text-brand-orange">{it.label}</Link> : <span className="text-brand-text">{it.label}</span>}
            {i < items.length - 1 && <span aria-hidden="true">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
