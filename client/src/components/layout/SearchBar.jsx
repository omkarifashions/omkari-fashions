import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../../api/services.js';
import useDebounce from '../../hooks/useDebounce.js';
import { SearchIcon } from '../common/Icons.jsx';
import { imgUrl, rupee } from '../../utils/format.js';

export default function SearchBar({ inputRef }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const debounced = useDebounce(q.trim(), 250);

  useEffect(() => {
    setQ(location.pathname === '/search' ? params.get('q') || '' : '');
    setOpen(false);
  }, [location.pathname, location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const close = (e) => wrap.current && !wrap.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const { data } = useQuery({ queryKey: ['suggest', debounced], queryFn: () => catalogApi.suggest(debounced), enabled: debounced.length >= 2, staleTime: 30_000 });

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div ref={wrap} className="relative w-full">
      <form onSubmit={submit} role="search" className="flex h-9 items-center gap-2 rounded-[6px] border border-brand-brown/70 bg-white px-3 shadow-sm sm:h-[34px]">
        <SearchIcon size={16} className="shrink-0 text-brand-muted" />
        <label htmlFor="global-search" className="sr-only">Search products</label>
        <input
          id="global-search"
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search"
          autoComplete="off"
          className="w-full bg-transparent text-[13px] font-bold text-brand-ink placeholder:font-bold placeholder:text-[#8a8a8a] focus:outline-none"
        />
      </form>
      {open && debounced.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md bg-white shadow-xl ring-1 ring-black/10">
          {data?.products?.length ? (
            <>
              <ul>
                {data.products.map((p) => (
                  <li key={p._id}>
                    <button type="button" onClick={() => { setOpen(false); navigate(`/products/${p.slug}`); }} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-cream">
                      <img src={imgUrl(p.images?.[0]?.url)} alt="" className="h-10 w-10 rounded object-cover" />
                      <span className="flex-1 truncate text-sm text-brand-ink">{p.name}</span>
                      <span className="text-sm font-bold">{rupee(p.finalPrice)}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={submit} className="w-full border-t border-beige px-3 py-2 text-left text-sm font-bold text-brand-orange hover:bg-cream">See all results for “{q.trim()}”</button>
            </>
          ) : (
            <p className="px-3 py-3 text-sm text-brand-muted">{data ? 'No matching products found' : 'Searching…'}</p>
          )}
        </div>
      )}
    </div>
  );
}
