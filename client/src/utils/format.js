import { API_ORIGIN } from '../api/http.js';

export const rupee = (n) => `₹ ${Number(n || 0).toLocaleString('en-IN')}`;

export const fmtDate = (d, opts = { day: '2-digit', month: 'short', year: 'numeric' }) => (d ? new Date(d).toLocaleDateString('en-IN', opts) : '');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
export const fmtDeliveryDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' });

export const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

export const label = (s = '') => String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const FALLBACK_IMG = '/images/logo.png';

// Turns a stored image path (/uploads/...) into a loadable URL.
export const imgUrl = (url) => {
  if (!url) return FALLBACK_IMG;
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith('/uploads')) return `${API_ORIGIN}${url}`;
  return url;
};

export const productImage = (p, i = 0) => imgUrl(p?.images?.[i]?.url);

export const siteUrl = () => (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');

export const discountPct = (p) => (p.salePrice > 0 && p.salePrice < p.price ? Math.round(((p.price - p.salePrice) / p.price) * 100) : 0);

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
