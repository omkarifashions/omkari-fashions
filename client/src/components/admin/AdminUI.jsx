import { useRef, useState } from 'react';
import { adminApi } from '../../api/services.js';
import { useToast } from '../../context/ToastContext.jsx';
import { imgUrl } from '../../utils/format.js';
import { LoadingSpinner } from '../common/Feedback.jsx';
import { UploadIcon } from '../common/Icons.jsx';

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="font-display text-2xl font-bold text-brand-heading">{title}</h1>{subtitle && <p className="text-sm text-brand-muted">{subtitle}</p>}</div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function TableWrap({ children }) {
  return <div className="overflow-x-auto rounded-lg bg-white shadow-card"><table className="w-full min-w-[640px] text-left text-[13px]">{children}</table></div>;
}
export const Th = ({ children, className = '' }) => <th className={`whitespace-nowrap bg-beige px-3 py-2.5 text-[12px] font-black uppercase tracking-wide text-brand-text ${className}`}>{children}</th>;
export const Td = ({ children, className = '' }) => <td className={`border-t border-beige px-3 py-2.5 align-middle ${className}`}>{children}</td>;

export function Toolbar({ value, onChange, placeholder = 'Search…', children }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="admin-search">Search</label>
      <input id="admin-search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input !w-full !py-2 sm:!w-72" />
      {children}
    </div>
  );
}

export const SelectBox = ({ value, onChange, options, label, className = '' }) => (
  <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={`input !w-auto !py-2 ${className}`}>
    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
  </select>
);

export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" role="switch" checked={Boolean(checked)} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="relative block h-5 w-9 rounded-full bg-[#c7b7ab] transition peer-checked:bg-brand-orange peer-focus-visible:ring-2 peer-focus-visible:ring-brand-gold"><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} /></span>
      {label && <span>{label}</span>}
    </label>
  );
}

/** Multi/single image uploader with progress + previews. value: string (single) or [{url,publicId}] (multi) */
export function ImageUploader({ value, onChange, folder = 'misc', multiple = false, label = 'Images' }) {
  const toast = useToast();
  const ref = useRef(null);
  const [progress, setProgress] = useState(null);
  const list = multiple ? value || [] : value ? [{ url: value }] : [];

  const pick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const bad = files.find((f) => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > 5 * 1024 * 1024);
    if (bad) return toast.error('Only JPG, PNG or WEBP images up to 5 MB are allowed');
    setProgress(0);
    try {
      const r = await adminApi.upload(multiple ? files : files.slice(0, 1), folder, setProgress);
      onChange(multiple ? [...list, ...r.images] : r.images[0].url);
      toast.success(`${r.images.length} image${r.images.length > 1 ? 's' : ''} uploaded`);
    } catch (err) {
      toast.error(err.userMessage || 'Image upload failed');
    } finally {
      setProgress(null);
    }
  };
  const move = (i, d) => { const n = [...list]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  const remove = (i) => onChange(multiple ? list.filter((_, k) => k !== i) : '');

  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-3">
        {list.map((im, i) => (
          <div key={im.url + i} className="w-24">
            <div className="relative"><img src={imgUrl(im.url)} alt={`Uploaded ${i + 1}`} className="h-24 w-24 rounded border border-beige-dark object-cover" />{multiple && i === 0 && <span className="absolute left-0 top-0 rounded-br bg-brand-orange px-1 text-[9px] font-bold text-white">MAIN</span>}</div>
            <div className="mt-1 flex justify-between">
              {multiple && <><button type="button" aria-label="Move image left" disabled={i === 0} onClick={() => move(i, -1)} className="rounded bg-beige px-1.5 text-xs disabled:opacity-30">←</button><button type="button" aria-label="Move image right" disabled={i === list.length - 1} onClick={() => move(i, 1)} className="rounded bg-beige px-1.5 text-xs disabled:opacity-30">→</button></>}
              <button type="button" aria-label="Remove image" onClick={() => remove(i)} className="rounded bg-red-100 px-1.5 text-xs font-bold text-red-700">✕</button>
            </div>
          </div>
        ))}
        {(multiple || list.length === 0) && (
          <button type="button" disabled={progress !== null} onClick={() => ref.current?.click()} className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded border-2 border-dashed border-brand-orange/60 text-xs text-brand-orange hover:bg-white disabled:opacity-60">
            {progress !== null ? <><LoadingSpinner size="sm" /><span>{progress}%</span></> : <><UploadIcon size={22} />Upload</>}
          </button>
        )}
      </div>
      {progress !== null && <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded bg-beige-dark" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-brand-orange transition-all" style={{ width: `${progress}%` }} /></div>}
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} hidden onChange={pick} />
    </div>
  );
}
