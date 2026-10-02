import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/services.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import useDebounce from '../../hooks/useDebounce.js';
import useDownload from '../../hooks/useDownload.js';
import { EmptyState, ErrorState, LoadingSpinner, PageLoader, Pagination } from '../../components/common/Feedback.jsx';
import { PageHeader, SelectBox, TableWrap, Td, Th, Toolbar } from '../../components/admin/AdminUI.jsx';
import FormField from '../../components/common/FormField.jsx';
import { OrderTimeline, StatusBadge } from '../../components/orders/Timelines.jsx';
import { fmtDate, fmtDateTime, imgUrl, label, rupee } from '../../utils/format.js';

const STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

export function OrdersAdminPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounce(q, 350);
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['admin', 'orders', dq, status, payment, from, to, page], queryFn: () => adminApi.list('orders', { q: dq, status, payment, from, to, page, limit: 15 }), placeholderData: (p) => p });
  const reset = (fn) => (v) => { fn(v); setPage(1); };
  return (
    <div>
      <PageHeader title="Orders" subtitle={data ? `${data.total} orders` : ''} />
      <Toolbar value={q} onChange={reset(setQ)} placeholder="Order no, customer, phone, product…">
        <SelectBox label="Status" value={status} onChange={reset(setStatus)} options={[['', 'All statuses'], ...STATUSES.map((s) => [s, label(s)])]} />
        <SelectBox label="Payment" value={payment} onChange={reset(setPayment)} options={[['', 'All payments'], ['cod', 'COD'], ['razorpay', 'Online']]} />
        <input type="date" aria-label="From date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} className="input !w-auto !py-2" />
        <input type="date" aria-label="To date" value={to} onChange={(e) => reset(setTo)(e.target.value)} className="input !w-auto !py-2" />
      </Toolbar>
      {isLoading ? <PageLoader /> : isError ? <ErrorState message={error?.userMessage} onRetry={refetch} /> : data.orders.length === 0 ? <EmptyState image={false} title="No orders found" /> : (
        <>
          <TableWrap>
            <thead><tr><Th>Order</Th><Th>Customer</Th><Th>Date</Th><Th>Total</Th><Th>Payment</Th><Th>Status</Th><Th className="text-right">Action</Th></tr></thead>
            <tbody>{data.orders.map((o) => (
              <tr key={o._id}>
                <Td><b>{o.orderNumber}</b>{o.returnStatus && o.returnStatus !== 'none' && <span className="ml-1 badge bg-red-100 text-red-800">Return</span>}</Td>
                <Td>{o.user?.name || o.shippingAddress?.name}<div className="text-[11px] text-brand-muted">{o.user?.email}</div></Td>
                <Td>{fmtDate(o.createdAt)}</Td><Td><b>{rupee(o.total)}</b></Td>
                <Td>{o.paymentMethod === 'cod' ? 'COD' : 'Online'} <StatusBadge status={o.paymentStatus} /></Td>
                <Td><StatusBadge status={o.orderStatus} /></Td>
                <Td className="text-right"><Link to={`/admin/orders/${o._id}`} className="font-bold text-brand-orange hover:underline">Open</Link></Td>
              </tr>))}</tbody>
          </TableWrap>
          <Pagination page={page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

export function OrderAdminDetail() {
  const { id } = useParams();
  const toast = useToast();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const dl = useDownload();
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [courier, setCourier] = useState('');
  const [tracking, setTracking] = useState('');
  const [busy, setBusy] = useState(false);
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['admin', 'order', id], queryFn: () => adminApi.getOne('orders', id) });
  const returns = useQuery({ queryKey: ['admin', 'returns', 'order', id], queryFn: () => adminApi.list('returns') });

  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorState message={error?.userMessage} onRetry={refetch} />;
  const o = data.order;
  const idx = STATUSES.indexOf(o.orderStatus);
  const locked = ['delivered', 'cancelled'].includes(o.orderStatus);
  const nextOpts = STATUSES.filter((s, i) => s !== 'cancelled' && i > idx);
  const orderReturns = (returns.data?.returns || []).filter((r) => r.order === o._id);

  const refresh = () => { refetch(); qc.invalidateQueries({ queryKey: ['admin', 'orders'] }); qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] }); };
  const update = async (target) => {
    setBusy(true);
    try { await adminApi.updateOrderStatus(o._id, { status: target, note, courier: courier || undefined, trackingId: tracking || undefined }); toast.success(`Order marked as ${label(target)}`); setStatus(''); setNote(''); refresh(); } catch (e) { toast.error(e.userMessage); } finally { setBusy(false); }
  };
  const cancel = async () => {
    const reason = await confirm({ title: 'Cancel this order?', message: 'Stock will be restored and the customer will be notified.', confirmText: 'Cancel order', cancelText: 'Keep order', tone: 'danger', withReason: true, reasonLabel: 'Reason', reasonRequired: true });
    if (!reason) return;
    setBusy(true);
    try { await adminApi.updateOrderStatus(o._id, { status: 'cancelled', note: reason }); toast.success('Order cancelled'); refresh(); } catch (e) { toast.error(e.userMessage); } finally { setBusy(false); }
  };
  const markRefunded = async () => {
    if (!(await confirm({ title: 'Mark refund as completed?', message: `Confirm that ${rupee(o.total)} has been refunded to the customer.`, confirmText: 'Mark refunded' }))) return;
    setBusy(true);
    try { await adminApi.markRefunded(o._id, {}); toast.success('Refund marked as completed'); refresh(); } catch (e) { toast.error(e.userMessage); } finally { setBusy(false); }
  };
  const a = o.shippingAddress;

  return (
    <div className="space-y-5">
      <PageHeader title={`Order ${o.orderNumber}`} subtitle={`Placed ${fmtDateTime(o.createdAt)}`}>
        <Link to="/admin/orders" className="btn-outline !py-2">← Orders</Link>
        <button type="button" onClick={() => dl.run('inv', () => adminApi.file(`/orders/${o._id}/invoice`), `invoice-${o.orderNumber}.pdf`)} disabled={dl.busy === 'inv'} className="btn-outline !py-2">{dl.busy === 'inv' ? <LoadingSpinner size="sm" /> : 'Invoice PDF'}</button>
        <button type="button" onClick={() => dl.run('lbl', () => adminApi.file(`/orders/${o._id}/shipping-label`), `label-${o.orderNumber}.pdf`)} disabled={dl.busy === 'lbl'} className="btn-outline !py-2">{dl.busy === 'lbl' ? <LoadingSpinner size="sm" /> : 'Shipping Label'}</button>
      </PageHeader>

      <section className="rounded-lg bg-white p-5 shadow-card"><h2 className="mb-4 font-display text-lg font-bold">Timeline <StatusBadge status={o.orderStatus} /></h2><OrderTimeline order={o} /></section>

      {!locked && (
        <section className="rounded-lg bg-white p-5 shadow-card">
          <h2 className="mb-3 font-display text-lg font-bold">Update status</h2>
          {o.paymentMethod === 'razorpay' && o.paymentStatus !== 'paid' && <p className="mb-3 rounded bg-amber-50 p-2 text-sm text-amber-900">Online payment is not confirmed yet - status cannot be advanced.</p>}
          <div className="grid gap-3 sm:grid-cols-4">
            <FormField as="select" id="ns" label="New status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Select…</option>{nextOpts.map((s) => <option key={s} value={s}>{label(s)}</option>)}</FormField>
            <FormField id="nc" label="Courier (optional)" value={courier} onChange={(e) => setCourier(e.target.value)} />
            <FormField id="nt" label="Tracking ID (optional)" value={tracking} onChange={(e) => setTracking(e.target.value)} />
            <FormField id="nn" label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" disabled={!status || busy} onClick={() => update(status)} className="btn-primary !py-2.5">{busy ? <LoadingSpinner size="sm" className="border-white border-t-transparent" /> : 'Update Status'}</button>
            <button type="button" disabled={busy} onClick={cancel} className="rounded-[4px] border border-red-700 px-5 py-2.5 font-bold text-red-700 hover:bg-red-700 hover:text-white disabled:opacity-50">Cancel Order</button>
          </div>
        </section>
      )}

      {o.paymentStatus === 'refund_pending' && (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-4"><p className="font-bold text-amber-900">Refund pending - {rupee(o.total)} to the original payment account (Razorpay payment {o.razorpay?.paymentId || '-'})</p><button type="button" disabled={busy} onClick={markRefunded} className="btn-primary mt-3 !py-2">Mark refund completed</button></section>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-lg bg-white p-5 text-[14px] shadow-card"><h2 className="mb-2 font-display text-lg font-bold">Customer</h2><p className="font-bold">{o.user?.name}</p><p>{o.user?.email}</p><p>{o.user?.phone}</p></section>
        <section className="rounded-lg bg-white p-5 text-[14px] shadow-card"><h2 className="mb-2 font-display text-lg font-bold">Shipping</h2><p className="font-bold">{a.name}</p><p>{a.address}</p><p>{a.city}, {a.state} - {a.pincode}</p><p>{a.phone}</p>{o.trackingId && <p className="mt-1 text-xs">{o.courier} · {o.trackingId}</p>}</section>
        <section className="rounded-lg bg-white p-5 text-[14px] shadow-card"><h2 className="mb-2 font-display text-lg font-bold">Payment</h2>
          <p>{o.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'} · <StatusBadge status={o.paymentStatus} /></p>
          {o.razorpay?.paymentId && <p className="mt-1 break-all text-xs">Payment ID: {o.razorpay.paymentId}<br />Order ID: {o.razorpay.orderId}</p>}
          <dl className="mt-2 space-y-0.5 text-[13px]"><div className="flex justify-between"><dt>Subtotal</dt><dd>{rupee(o.subtotal)}</dd></div>{o.discount > 0 && <div className="flex justify-between"><dt>Discount {o.couponCode && `(${o.couponCode})`}</dt><dd>− {rupee(o.discount)}</dd></div>}<div className="flex justify-between"><dt>Shipping</dt><dd>{rupee(o.shippingFee)}</dd></div><div className="flex justify-between"><dt>Tax incl.</dt><dd>{rupee(o.tax)}</dd></div><div className="flex justify-between border-t pt-1 text-base font-black"><dt>Total</dt><dd>{rupee(o.total)}</dd></div></dl></section>
      </div>

      <section><h2 className="mb-2 font-display text-lg font-bold">Items</h2>
        <TableWrap><thead><tr><Th>Product</Th><Th>SKU</Th><Th>Qty</Th><Th>Price</Th><Th>Total</Th><Th>Returnable</Th></tr></thead><tbody>{o.items.map((it) => <tr key={it.product}><Td><div className="flex items-center gap-2"><img src={imgUrl(it.image)} alt="" className="h-10 w-10 rounded object-cover" />{it.name}</div></Td><Td>{it.sku}</Td><Td>{it.quantity}</Td><Td>{rupee(it.price)}</Td><Td>{rupee(it.price * it.quantity)}</Td><Td>{it.isReturnable ? `${it.returnWindowDays} days` : 'No'}</Td></tr>)}</tbody></TableWrap></section>

      {orderReturns.length > 0 && <section><h2 className="mb-2 font-display text-lg font-bold">Return requests</h2><ul className="space-y-2">{orderReturns.map((r) => <li key={r._id} className="flex items-center justify-between rounded bg-white p-3 shadow-card"><span>{r.returnNumber} · {r.item.name} · {r.reason}</span><span className="flex items-center gap-3"><StatusBadge status={r.status} /><Link to="/admin/returns" className="text-sm font-bold text-brand-orange">Manage</Link></span></li>)}</ul></section>}

      <section className="rounded-lg bg-white p-5 shadow-card"><h2 className="mb-3 font-display text-lg font-bold">Status history</h2><ul className="space-y-1.5 text-[13px]">{[...o.statusHistory].reverse().map((h, i) => <li key={i} className="flex flex-wrap gap-x-3"><b>{label(h.status)}</b><span className="text-brand-muted">{fmtDateTime(h.timestamp)}</span>{h.note && <span>- {h.note}</span>}</li>)}</ul></section>
    </div>
  );
}
