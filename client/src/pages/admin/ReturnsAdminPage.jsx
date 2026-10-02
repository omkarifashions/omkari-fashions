import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/services.js';
import { useToast } from '../../context/ToastContext.jsx';
import Modal from '../../components/common/Modal.jsx';
import FormField from '../../components/common/FormField.jsx';
import { EmptyState, ErrorState, LoadingSpinner, PageLoader } from '../../components/common/Feedback.jsx';
import { PageHeader, SelectBox, TableWrap, Td, Th, Toolbar } from '../../components/admin/AdminUI.jsx';
import { ReturnTimeline, StatusBadge } from '../../components/orders/Timelines.jsx';
import useDebounce from '../../hooks/useDebounce.js';
import { fmtDate, fmtDateTime, imgUrl, label, rupee } from '../../utils/format.js';

const NEXT = {
  requested: ['under_review', 'approved', 'rejected', 'info_requested'],
  under_review: ['approved', 'rejected', 'info_requested'],
  info_requested: ['approved', 'rejected'],
  approved: ['pickup_scheduled'],
  pickup_scheduled: ['item_received'],
  item_received: ['refund_processing'],
  refund_processing: ['refund_completed'],
};
const ACTION = { under_review: 'Mark Under Review', approved: 'Approve Return', rejected: 'Reject Return', info_requested: 'Request More Info', pickup_scheduled: 'Schedule Pickup', item_received: 'Mark Item Received', refund_processing: 'Process Refund', refund_completed: 'Complete Refund' };
const NOTE_REQUIRED = ['rejected', 'info_requested'];

function Detail({ id, onClose }) {
  const toast = useToast();
  const qc = useQueryClient();
  const [action, setAction] = useState(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [ref, setRef] = useState('');
  const [adminNotes, setAdminNotes] = useState(null);
  const [busy, setBusy] = useState(false);
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['admin', 'return', id], queryFn: () => adminApi.getOne('returns', id) });

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorState message={error?.userMessage} onRetry={refetch} />;
  const r = data.returnRequest;
  const o = data.order;
  const next = NEXT[r.status] || [];
  const refresh = () => { refetch(); qc.invalidateQueries({ queryKey: ['admin', 'returns'] }); qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] }); };

  const run = async (status) => {
    setBusy(true);
    try {
      await adminApi.updateReturn(r._id, { status, note, pickupDate: date || undefined, refundReference: ref || undefined });
      toast.success(`Return ${label(status).toLowerCase()}`);
      setAction(null); setNote(''); setDate(''); setRef('');
      refresh();
    } catch (e) { toast.error(e.userMessage); } finally { setBusy(false); }
  };
  const saveNotes = async () => {
    setBusy(true);
    try { await adminApi.updateReturn(r._id, { adminNotes }); toast.success('Admin notes saved'); setAdminNotes(null); refresh(); } catch (e) { toast.error(e.userMessage); } finally { setBusy(false); }
  };

  const Row = ({ k, v }) => <div className="flex justify-between gap-3 border-b border-beige py-1.5 text-[13px]"><dt className="text-brand-muted">{k}</dt><dd className="text-right font-bold">{v}</dd></div>;
  const eligibleNow = r.eligibleTill ? new Date(r.eligibleTill) >= new Date(r.createdAt) : true;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-3"><img src={imgUrl(r.item.image)} alt="" className="h-14 w-14 rounded object-cover" /><div><p className="font-bold">{r.item.name}</p><p className="text-xs text-brand-muted">{r.returnNumber}</p></div></div><StatusBadge status={r.status} /></div>
      <ReturnTimeline ret={r} />
      <div className="grid gap-x-8 sm:grid-cols-2">
        <dl>
          <Row k="Customer" v={`${r.user?.name || ''}`} /><Row k="Email / phone" v={`${r.user?.email || ''} · ${r.user?.phone || ''}`} />
          <Row k="Order number" v={r.orderNumber} /><Row k="Order date" v={fmtDate(o?.createdAt)} /><Row k="Delivery date" v={fmtDate(r.deliveredAt || o?.deliveredAt)} /><Row k="Return requested" v={fmtDateTime(r.createdAt)} />
          <Row k="Eligibility" v={<span className={eligibleNow ? 'text-emerald-700' : 'text-red-700'}>{eligibleNow ? `Eligible (window till ${fmtDate(r.eligibleTill)})` : 'Outside window'}</span>} />
        </dl>
        <dl>
          <Row k="Reason" v={r.reason} /><Row k="Refund amount" v={rupee(r.refundAmount)} />
          <Row k="Refund method" v={r.refundMethod === 'upi' ? 'UPI (COD order)' : 'Original payment account'} />
          {r.refundMethod === 'upi' && <Row k="Customer UPI ID" v={<span className="select-all">{r.upiId}</span>} />}
          {r.refundMethod === 'original_payment' && <Row k="Original payment ref" v={<span className="break-all">{o?.razorpay?.paymentId || '-'}</span>} />}
          {r.refundReference && <Row k="Refund reference" v={r.refundReference} />}
          {r.pickupDate && <Row k="Pickup date" v={fmtDate(r.pickupDate)} />}
        </dl>
      </div>
      {r.description && <p className="rounded bg-cream p-3 text-sm"><b>Customer notes:</b> {r.description}</p>}
      {r.customerNotes?.length > 0 && <ul className="space-y-1 text-sm">{r.customerNotes.map((n, i) => <li key={i} className="rounded bg-cream p-2"><b>Customer reply ({fmtDateTime(n.timestamp)}):</b> {n.message}</li>)}</ul>}
      {r.images?.length > 0 && <div><p className="label">Proof images</p><div className="flex flex-wrap gap-2">{r.images.map((im) => <a key={im.url} href={imgUrl(im.url)} target="_blank" rel="noreferrer"><img src={imgUrl(im.url)} alt="Return proof" className="h-24 w-24 rounded border object-cover" /></a>)}</div></div>}

      <div>
        <label htmlFor="an" className="label">Admin notes (private)</label>
        <textarea id="an" rows={2} className="input" value={adminNotes ?? r.adminNotes ?? ''} onChange={(e) => setAdminNotes(e.target.value)} />
        {adminNotes !== null && adminNotes !== r.adminNotes && <button type="button" onClick={saveNotes} disabled={busy} className="btn-outline mt-2 !py-1.5 text-sm">Save notes</button>}
      </div>

      {next.length > 0 ? (
        <div className="border-t border-beige-dark pt-4">
          <p className="label">Actions</p>
          <div className="flex flex-wrap gap-2">{next.map((s) => <button key={s} type="button" onClick={() => setAction(s)} className={`rounded-[4px] px-4 py-2 text-sm font-bold ${s === 'rejected' ? 'border border-red-700 text-red-700 hover:bg-red-700 hover:text-white' : 'bg-btn text-white'}`}>{ACTION[s]}</button>)}</div>
        </div>
      ) : <p className="text-sm text-brand-muted">This return is closed.</p>}

      <Modal open={Boolean(action)} onClose={() => setAction(null)} title={ACTION[action] || ''} locked={busy}>
        <div className="space-y-4">
          {action === 'pickup_scheduled' && <FormField id="pd" type="date" label="Pickup date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)} />}
          {action === 'refund_completed' && r.refundMethod === 'upi' && <FormField id="rf" label="UPI transaction reference" value={ref} onChange={(e) => setRef(e.target.value)} hint={`Refund ${rupee(r.refundAmount)} to ${r.upiId}`} />}
          {action === 'refund_completed' && r.refundMethod !== 'upi' && <FormField id="rf" label="Refund reference (optional)" value={ref} onChange={(e) => setRef(e.target.value)} hint="Refund the original Razorpay payment from your Razorpay dashboard, then complete here." />}
          <FormField as="textarea" rows={3} id="nt" label={NOTE_REQUIRED.includes(action) ? 'Message to customer (required)' : 'Note (optional)'} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setAction(null)} disabled={busy} className="rounded-[4px] border border-brand-muted/50 px-5 py-2.5 font-bold">Cancel</button>
            <button type="button" disabled={busy || (NOTE_REQUIRED.includes(action) && note.trim().length < 3) || (action === 'pickup_scheduled' && !date) || (action === 'refund_completed' && r.refundMethod === 'upi' && !ref.trim())} onClick={() => run(action)} className="btn-primary">{busy ? <LoadingSpinner size="sm" className="border-white border-t-transparent" /> : 'Confirm'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function ReturnsAdminPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(null);
  const dq = useDebounce(q, 350);
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['admin', 'returns', dq, status], queryFn: () => adminApi.list('returns', { q: dq, status }) });
  return (
    <div>
      <PageHeader title="Returns" subtitle="Review and process customer return requests" />
      <Toolbar value={q} onChange={setQ} placeholder="Return ID, order no, product…"><SelectBox label="Status" value={status} onChange={setStatus} options={[['', 'All statuses'], ...Object.keys(ACTION).concat(['requested']).map((s) => [s, label(s)])]} /></Toolbar>
      {isLoading ? <PageLoader /> : isError ? <ErrorState message={error?.userMessage} onRetry={refetch} /> : data.returns.length === 0 ? <EmptyState image={false} title="No return requests" /> : (
        <TableWrap>
          <thead><tr><Th>Return ID</Th><Th>Order</Th><Th>Customer</Th><Th>Product</Th><Th>Reason</Th><Th>Requested</Th><Th>Refund</Th><Th>Status</Th><Th className="text-right">Action</Th></tr></thead>
          <tbody>{data.returns.map((r) => (
            <tr key={r._id}>
              <Td><b>{r.returnNumber}</b>{r.images?.length > 0 && <span className="ml-1 text-xs text-brand-muted">📷{r.images.length}</span>}</Td><Td>{r.orderNumber}</Td><Td>{r.user?.name}</Td><Td className="max-w-[180px]"><span className="line-clamp-2">{r.item.name}</span></Td><Td>{r.reason}</Td><Td>{fmtDate(r.createdAt)}</Td>
              <Td>{rupee(r.refundAmount)}<div className="text-[11px] text-brand-muted">{r.refundMethod === 'upi' ? 'UPI' : 'Original'}</div></Td><Td><StatusBadge status={r.status} /></Td>
              <Td className="text-right"><button type="button" onClick={() => setOpen(r._id)} className="font-bold text-brand-orange hover:underline">Open</button></Td>
            </tr>))}</tbody>
        </TableWrap>
      )}
      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title="Return Request" wide>{open && <Detail id={open} onClose={() => setOpen(null)} />}</Modal>
    </div>
  );
}
