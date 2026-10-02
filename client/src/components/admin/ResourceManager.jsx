import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/services.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import Modal from '../common/Modal.jsx';
import FormField from '../common/FormField.jsx';
import { EmptyState, ErrorState, LoadingSpinner, PageLoader } from '../common/Feedback.jsx';
import { ImageUploader, PageHeader, TableWrap, Td, Th, Toggle } from './AdminUI.jsx';
import useDebounce from '../../hooks/useDebounce.js';
import { imgUrl } from '../../utils/format.js';

function ProductPicker({ value, onChange }) {
  const [q, setQ] = useState('');
  const dq = useDebounce(q, 300);
  const res = useQuery({ queryKey: ['picker', dq], queryFn: () => adminApi.list('products', { q: dq, limit: 8 }), enabled: dq.length > 1 });
  const add = (p) => !value.some((v) => v._id === p._id) && onChange([...value, { _id: p._id, name: p.name }]);
  return (
    <div>
      <p className="label">Products ({value.length})</p>
      <div className="mb-2 flex flex-wrap gap-1.5">{value.map((p) => <span key={p._id} className="inline-flex items-center gap-1 rounded-full bg-beige px-2.5 py-1 text-xs">{p.name}<button type="button" aria-label={`Remove ${p.name}`} onClick={() => onChange(value.filter((v) => v._id !== p._id))} className="font-bold text-red-700">×</button></span>)}</div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products to add…" aria-label="Search products" className="input !py-2" />
      {res.data?.products?.length > 0 && <ul className="mt-1 max-h-40 overflow-y-auto rounded border border-beige-dark bg-white">{res.data.products.map((p) => <li key={p._id}><button type="button" onClick={() => add(p)} className="block w-full px-3 py-1.5 text-left text-sm hover:bg-cream">{p.name} <span className="text-xs text-brand-muted">{p.sku}</span></button></li>)}</ul>}
    </div>
  );
}

const toForm = (fields, item) => {
  const f = {};
  fields.forEach((fd) => {
    let v = item?.[fd.key];
    if (fd.type === 'tags') v = (v || []).join(', ');
    if (fd.type === 'bool') v = v === undefined ? fd.default ?? true : v;
    if (fd.type === 'products') v = (v || []).map((p) => (typeof p === 'string' ? { _id: p, name: p } : { _id: p._id, name: p.name }));
    if (fd.type === 'date') v = v ? String(v).slice(0, 10) : '';
    if (v === undefined || v === null) v = fd.type === 'number' ? 0 : '';
    f[fd.key] = v;
  });
  return f;
};

/** Generic CRUD screen for simple content resources. */
export default function ResourceManager({ resource, title, subtitle, columns, fields, itemName = 'item', defaults = {} }) {
  const toast = useToast();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [delId, setDelId] = useState(null);
  const q = useQuery({ queryKey: ['admin', resource], queryFn: () => adminApi.list(resource) });

  useEffect(() => { if (editing) { setForm({ ...toForm(fields, editing === 'new' ? defaults : editing) }); setErrors({}); } }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (e) => {
    e.preventDefault();
    const er = {};
    fields.forEach((f) => { if (f.required && !String(form[f.key] ?? '').trim()) er[f.key] = `${f.label} is required`; });
    setErrors(er);
    if (Object.keys(er).length) return;
    const body = {};
    fields.forEach((f) => {
      let v = form[f.key];
      if (f.type === 'tags') v = String(v).split(',').map((s) => s.trim()).filter(Boolean);
      if (f.type === 'number') v = Number(v) || 0;
      if (f.type === 'products') v = v.map((p) => p._id);
      if (f.type === 'date' && !v) v = null;
      body[f.key] = v;
    });
    setBusy(true);
    try {
      if (editing === 'new') await adminApi.create(resource, body); else await adminApi.update(resource, editing._id, body);
      toast.success(`${title.replace(/s$/, '')} ${editing === 'new' ? 'created' : 'updated'} successfully`);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['admin', resource] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['collections'] });
      qc.invalidateQueries({ queryKey: ['home'] });
    } catch (err) { toast.error(err.userMessage); } finally { setBusy(false); }
  };

  const del = async (item) => {
    const label = item.name || item.title || item.code || item.question || itemName;
    if (!(await confirm({ title: `Delete ${itemName}?`, message: `“${label}” will be permanently deleted.`, confirmText: 'Delete', tone: 'danger' }))) return;
    setDelId(item._id);
    try { await adminApi.remove(resource, item._id); toast.success(`${itemName[0].toUpperCase()}${itemName.slice(1)} deleted`); qc.invalidateQueries({ queryKey: ['admin', resource] }); qc.invalidateQueries({ queryKey: ['home'] }); } catch (err) { toast.error(err.userMessage); } finally { setDelId(null); }
  };

  const toggleActive = async (item) => {
    try { await adminApi.update(resource, item._id, { isActive: !item.isActive }); qc.invalidateQueries({ queryKey: ['admin', resource] }); qc.invalidateQueries({ queryKey: ['home'] }); } catch (err) { toast.error(err.userMessage); }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const items = q.data?.items || [];

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle}><button type="button" className="btn-primary !py-2" onClick={() => setEditing('new')}>+ Add {itemName}</button></PageHeader>
      {q.isLoading ? <PageLoader /> : q.isError ? <ErrorState message={q.error?.userMessage} onRetry={q.refetch} /> : items.length === 0 ? <EmptyState image={false} title={`No ${title.toLowerCase()} yet`} actionLabel={`Add ${itemName}`} onAction={() => setEditing('new')} /> : (
        <TableWrap>
          <thead><tr>{columns.map((c) => <Th key={c.key}>{c.label}</Th>)}<Th className="text-right">Actions</Th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                {columns.map((c) => (
                  <Td key={c.key}>
                    {c.type === 'image' ? <img src={imgUrl(it[c.key])} alt="" className="h-10 w-10 rounded object-cover" />
                      : c.type === 'bool' ? <Toggle checked={it[c.key]} onChange={() => toggleActive(it)} label={<span className="sr-only">Toggle</span>} />
                      : c.type === 'count' ? (it[c.key] || []).length
                      : c.type === 'date' ? (it[c.key] ? new Date(it[c.key]).toLocaleDateString('en-IN') : '-')
                      : <span className="line-clamp-2 max-w-[280px]">{String(it[c.key] ?? '')}</span>}
                  </Td>
                ))}
                <Td className="whitespace-nowrap text-right">
                  <button type="button" onClick={() => setEditing(it)} className="mr-3 font-bold text-brand-orange hover:underline">Edit</button>
                  <button type="button" onClick={() => del(it)} disabled={delId === it._id} className="font-bold text-red-700 hover:underline disabled:opacity-50">{delId === it._id ? '…' : 'Delete'}</button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={`${editing === 'new' ? 'Add' : 'Edit'} ${itemName}`} wide locked={busy}>
        <form onSubmit={save} noValidate className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className={f.full || ['textarea', 'image', 'products', 'tags'].includes(f.type) ? 'sm:col-span-2' : ''}>
              {f.type === 'image' ? <ImageUploader label={f.label} folder={f.folder || resource} value={form[f.key]} onChange={(v) => setForm((x) => ({ ...x, [f.key]: v }))} />
                : f.type === 'products' ? <ProductPicker value={form[f.key] || []} onChange={(v) => setForm((x) => ({ ...x, [f.key]: v }))} />
                : f.type === 'bool' ? <Toggle checked={form[f.key]} onChange={(v) => setForm((x) => ({ ...x, [f.key]: v }))} label={f.label} />
                : f.type === 'select' ? <FormField as="select" id={`f-${f.key}`} label={f.label} value={form[f.key]} onChange={set(f.key)}>{f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</FormField>
                : <FormField id={`f-${f.key}`} label={f.label} as={f.type === 'textarea' ? 'textarea' : 'input'} rows={f.type === 'textarea' ? 4 : undefined} type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} min={f.type === 'number' ? 0 : undefined} step={f.type === 'number' ? 'any' : undefined} value={form[f.key] ?? ''} onChange={set(f.key)} error={errors[f.key]} hint={f.hint} placeholder={f.placeholder} />}
            </div>
          ))}
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button type="button" onClick={() => setEditing(null)} disabled={busy} className="rounded-[4px] border border-brand-muted/50 px-5 py-2.5 font-bold">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary">{busy ? <><LoadingSpinner size="sm" className="border-white border-t-transparent" /> Saving…</> : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
