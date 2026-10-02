import { useEffect, useState } from 'react';
import { ChevronDown } from '../common/Icons.jsx';
import { rupee } from '../../utils/format.js';

const GROUPS = [
  { key: 'category', label: 'Category', multi: true },
  { key: 'price', label: 'Price' },
  { key: 'subcategory', label: 'Style/Subcategory', multi: true },
  { key: 'craftsmanship', label: 'Craftsmanship', multi: true },
  { key: 'occasion', label: 'Occasion', multi: true },
  { key: 'colors', label: 'Colors', multi: true },
  { key: 'metalType', label: 'Metal Type', multi: true },
  { key: 'stoneType', label: 'Stone Type', multi: true },
];

export const FILTER_KEYS = ['category', 'subcategory', 'craftsmanship', 'occasion', 'colors', 'metalType', 'stoneType', 'minPrice', 'maxPrice', 'includeOutOfStock'];

export function countApplied(applied) {
  let n = 0;
  ['category', 'subcategory', 'craftsmanship', 'occasion', 'colors', 'metalType', 'stoneType'].forEach((k) => { n += applied[k]?.length || 0; });
  if (applied.minPrice || applied.maxPrice) n += 1;
  if (applied.includeOutOfStock) n += 1;
  return n;
}

function Accordion({ label, children, badge }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex h-10 w-full items-center justify-between rounded-[3px] bg-[#E8D7CB] px-3 text-left text-[14px] text-brand-ink transition hover:bg-[#e2cfc1]">
        <span>{label}{badge ? <span className="ml-1.5 rounded-full bg-brand-orange px-1.5 text-[10px] font-bold text-white">{badge}</span> : null}</span>
        <ChevronDown size={16} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="max-h-56 overflow-y-auto bg-[#f3e6dc] px-3 py-2.5">{children}</div>}
    </div>
  );
}

/** Draft-based filter panel: nothing is queried until "Apply" is pressed. */
export default function FilterSidebar({ facets, applied, onApply, onClear, hideKeys = [], onDone }) {
  const [draft, setDraft] = useState(applied);
  useEffect(() => setDraft(applied), [applied]);

  const toggle = (key, value) => setDraft((d) => {
    const cur = d[key] || [];
    return { ...d, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
  });

  const options = (key) => (key === 'category' ? (facets?.category || []).map((c) => ({ value: c.value, label: c.label, count: c.count })) : (facets?.[key] || []).map((o) => ({ value: o.value, label: o.value, count: o.count })));

  return (
    <div className="flex h-full flex-col">
      <label className="mb-3 flex cursor-pointer items-center justify-between text-[15px] text-brand-ink">
        <span>Out of Stock</span>
        <span className="relative">
          <input type="checkbox" role="switch" checked={Boolean(draft.includeOutOfStock)} onChange={(e) => setDraft((d) => ({ ...d, includeOutOfStock: e.target.checked }))} className="peer sr-only" />
          <span className="block h-5 w-9 rounded-full bg-[#c7b7ab] transition peer-checked:bg-brand-orange peer-focus-visible:ring-2 peer-focus-visible:ring-brand-gold" />
          <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
        </span>
      </label>
      <p className="-mt-2 mb-3 text-[11px] text-brand-muted">Show out of stock products too</p>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {GROUPS.filter((g) => !hideKeys.includes(g.key)).map((g) => {
          if (g.key === 'price') {
            const range = facets?.price;
            return (
              <Accordion key="price" label="Price" badge={draft.minPrice || draft.maxPrice ? 1 : 0}>
                <div className="flex items-center gap-2">
                  <input aria-label="Minimum price" inputMode="numeric" placeholder={range?.min ? String(range.min) : 'Min'} value={draft.minPrice || ''} onChange={(e) => setDraft((d) => ({ ...d, minPrice: e.target.value.replace(/\D/g, '') }))} className="w-full rounded border border-brand-muted/40 bg-white px-2 py-1.5 text-sm" />
                  <span>–</span>
                  <input aria-label="Maximum price" inputMode="numeric" placeholder={range?.max ? String(range.max) : 'Max'} value={draft.maxPrice || ''} onChange={(e) => setDraft((d) => ({ ...d, maxPrice: e.target.value.replace(/\D/g, '') }))} className="w-full rounded border border-brand-muted/40 bg-white px-2 py-1.5 text-sm" />
                </div>
                {range?.max > 0 && <p className="mt-2 text-[11px] text-brand-muted">Available: {rupee(range.min)} – {rupee(range.max)}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[[0, 1500], [1500, 3000], [3000, 6000], [6000, 0]].map(([a, b]) => (
                    <button key={a} type="button" onClick={() => setDraft((d) => ({ ...d, minPrice: a ? String(a) : '', maxPrice: b ? String(b) : '' }))} className="rounded-full border border-brand-orange/50 px-2 py-0.5 text-[11px] text-brand-orange hover:bg-brand-orange hover:text-white">
                      {b ? `${a ? `${a}–` : 'Under '}${b}` : `${a}+`}
                    </button>
                  ))}
                </div>
              </Accordion>
            );
          }
          const opts = options(g.key);
          return (
            <Accordion key={g.key} label={g.label} badge={draft[g.key]?.length || 0}>
              {opts.length === 0 ? <p className="text-xs text-brand-muted">No options</p> : opts.map((o) => (
                <label key={o.value} className="flex cursor-pointer items-center gap-2 py-1 text-[13px]">
                  <input type="checkbox" checked={(draft[g.key] || []).includes(o.value)} onChange={() => toggle(g.key, o.value)} className="h-4 w-4 accent-[#A84300]" />
                  <span className="flex-1">{o.label}</span>
                  <span className="text-[11px] text-brand-muted">{o.count}</span>
                </label>
              ))}
            </Accordion>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2 border-t border-brand-muted/30 pt-3">
        <button type="button" onClick={() => { onClear(); onDone?.(); }} className="btn-dark flex-1 !rounded-[2px] !py-2">Clear All</button>
        <button type="button" onClick={() => { onApply(draft); onDone?.(); }} className="flex-1 rounded-[2px] bg-btn py-2 text-[13px] font-bold text-white">Apply</button>
      </div>
    </div>
  );
}
