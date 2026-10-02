import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi, returnApi } from '../../api/services.js';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import useDownload from '../../hooks/useDownload.js';
import Seo from '../../components/common/Seo.jsx';
import SafeImage from '../../components/common/SafeImage.jsx';
import { OrderTimeline, ReturnTimeline, StatusBadge } from '../../components/orders/Timelines.jsx';
import ReturnModal from '../../components/orders/ReturnModal.jsx';
import { ErrorState, LoadingSpinner, PageLoader } from '../../components/common/Feedback.jsx';
import { fmtDate, imgUrl, rupee, label } from '../../utils/format.js';

export function ReturnCard({ ret, onChanged }) {
  const toast = useToast();
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const respond = async () => {
    if (reply.trim().length < 3) return toast.error('Please enter your reply');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('message', reply.trim());
      await returnApi.respond(ret._id, fd);
      toast.success('Thanks, we have received your reply');
      setReply('');
      onChanged();
    } catch (e) { toast.error(e.userMessage); } finally { setBusy(false); }
  };
  const last = ret.statusHistory?.[ret.statusHistory.length - 1];
  return (
    <div className="card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-brand-heading">Return {ret.returnNumber}</h3>
        <StatusBadge status={ret.status} />
      </div>
      <p className="mb-4 text-sm text-brand-text">{ret.item.name} · Refund {rupee(ret.refundAmount)} · {ret.reason}</p>
      <ReturnTimeline ret={ret} />
      <div className="mt-5 grid gap-2 border-t border-beige-dark pt-4 text-[13px] sm:grid-cols-2">
        <p><b>Refund method:</b> {ret.refundMethod === 'upi' ? `UPI (${ret.upiMasked || ''})` : 'Original payment account'}</p>
        {ret.refundMethod === 'original_payment' && <p className="text-emerald-800">Refund will be processed to the original payment account.</p>}
        {ret.refundReference && <p><b>Refund reference:</b> {ret.refundReference}</p>}
        {last?.note && ['rejected', 'info_requested', 'approved'].includes(ret.status) && <p className="sm:col-span-2 rounded bg-amber-50 p-2"><b>Message from Omkari Fashions:</b> {last.note}</p>}
      </div>
      {ret.images?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{ret.images.map((im) => <a key={im.url} href={imgUrl(im.url)} target="_blank" rel="noreferrer"><SafeImage src={imgUrl(im.url)} alt="Return proof" className="h-14 w-14 rounded object-cover" /></a>)}</div>}
      {ret.status === 'info_requested' && (
        <div className="mt-4">
          <label htmlFor={`reply-${ret._id}`} className="label">Your reply</label>
          <textarea id={`reply-${ret._id}`} rows={2} value={reply} onChange={(e) => setReply(e.target.value)} className="input" />
          <button type="button" onClick={respond} disabled={busy} className="btn-primary mt-2 !py-2">{busy ? <LoadingSpinner size="sm" className="border-white border-t-transparent" /> : 'Send reply'}</button>
        </div>
      )}
    </div>
  );
}

export default function OrderDetailsPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const toast = useToast();
  const dl = useDownload();
  const [returnItem, setReturnItem] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const order = useQuery({ queryKey: ['order', id], queryFn: () => orderApi.get(id) });
  const returns = useQuery({ queryKey: ['returns'], queryFn: returnApi.list });
  const refetchAll = () => { qc.invalidateQueries({ queryKey: ['order', id] }); qc.invalidateQueries({ queryKey: ['returns'] }); qc.invalidateQueries({ queryKey: ['orders'] }); };

  if (order.isLoading) return <PageLoader />;
  if (order.isError) return <ErrorState message={order.error?.userMessage} onRetry={order.refetch} />;
  const o = order.data.order;
  const myReturns = (returns.data?.returns || []).filter((r) => r.order === o._id);
  const activeReturn = myReturns.find((r) => !['refund_completed', 'rejected'].includes(r.status)) || myReturns[0];

  const cancel = async () => {
    const reason = await confirm({ title: 'Cancel this order?', message: `Order ${o.orderNumber} will be cancelled. This cannot be undone.`, confirmText: 'Yes, cancel order', cancelText: 'Keep order', tone: 'danger', withReason: true, reasonLabel: 'Reason for cancellation' });
    if (!reason) return;
    setCancelling(true);
    try { await orderApi.cancel(o._id, reason === true ? undefined : reason); toast.success('Order cancelled successfully'); } catch (e) { toast.error(e.userMessage); } finally { setCancelling(false); refetchAll(); }
  };

  const a = o.shippingAddress;
  return (
    <div className="space-y-5">
      <Seo title={`Order ${o.orderNumber}`} noindex />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><Link to="/orders" className="text-xs font-bold text-brand-orange hover:underline">‹ Back to orders</Link><h2 className="font-display text-xl font-bold text-brand-heading">Order {o.orderNumber}</h2><p className="text-xs text-brand-muted">Placed on {fmtDate(o.createdAt)}</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => dl.run('inv', () => orderApi.invoice(o._id), `invoice-${o.orderNumber}.pdf`)} disabled={dl.busy === 'inv'} className="btn-outline !py-2 text-[13px]">{dl.busy === 'inv' ? <LoadingSpinner size="sm" /> : 'Download Invoice'}</button>
          {o.canCancel && <button type="button" onClick={cancel} disabled={cancelling} className="rounded-[4px] border border-red-700 px-4 py-2 text-[13px] font-bold text-red-700 hover:bg-red-700 hover:text-white disabled:opacity-60">{cancelling ? <LoadingSpinner size="sm" /> : 'Cancel Order'}</button>}
        </div>
      </div>

      {activeReturn ? (
        <>
          <ReturnCard ret={activeReturn} onChanged={refetchAll} />
          <details className="card p-4"><summary className="cursor-pointer text-sm font-bold text-brand-text">Delivery timeline</summary><div className="mt-4"><OrderTimeline order={o} /></div></details>
        </>
      ) : (
        <section className="card p-5" aria-label="Delivery timeline"><h3 className="mb-4 font-display text-lg font-bold text-brand-heading">Order Status <StatusBadge status={o.orderStatus} /></h3><OrderTimeline order={o} />
          {o.orderStatus === 'cancelled' && o.paymentStatus === 'refund_pending' && <p className="mt-4 rounded bg-amber-50 p-3 text-sm">Your refund will be processed to the original payment account.</p>}
        </section>
      )}

      <section className="card divide-y divide-beige-dark" aria-label="Items">
        {o.items.map((it) => {
          const r = myReturns.find((x) => x.product === it.product);
          const el = it.returnEligibility;
          return (
            <div key={it.product} className="flex gap-3 p-4">
              <Link to={`/products/${it.slug}`}><SafeImage src={imgUrl(it.image)} alt={it.name} className="h-20 w-20 rounded object-cover" /></Link>
              <div className="min-w-0 flex-1 text-[14px]">
                <Link to={`/products/${it.slug}`} className="font-bold hover:text-brand-orange">{it.name}</Link>
                <p className="text-brand-muted">Qty {it.quantity} × {rupee(it.price)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {el?.eligible && <button type="button" onClick={() => setReturnItem(it)} className="rounded-[4px] bg-brand-brown px-4 py-1.5 text-[13px] font-bold text-white">Return Product</button>}
                  {o.orderStatus === 'delivered' && <Link to={`/products/${it.slug}#reviews`} className="text-[13px] font-bold text-brand-orange hover:underline">Write a review</Link>}
                  {!el?.eligible && o.orderStatus === 'delivered' && !r && <span className="text-xs text-brand-muted">{el?.reason}</span>}
                  {el?.eligible && el.eligibleTill && <span className="text-xs text-brand-muted">Return till {fmtDate(el.eligibleTill)}</span>}
                  {r && <StatusBadge status={r.status} />}
                </div>
              </div>
              <b className="text-[15px]">{rupee(it.price * it.quantity)}</b>
            </div>
          );
        })}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="card p-5 text-[14px]" aria-label="Shipping address"><h3 className="mb-2 font-display text-lg font-bold text-brand-heading">Shipping Address</h3><p className="font-bold">{a.name}</p><p>{a.address}</p><p>{a.city}, {a.state} - {a.pincode}</p><p className="text-brand-muted">{a.phone}</p>{o.trackingId && <p className="mt-2 text-xs"><b>Tracking:</b> {o.courier} · {o.trackingId}</p>}</section>
        <section className="card p-5 text-[14px]" aria-label="Payment summary"><h3 className="mb-2 font-display text-lg font-bold text-brand-heading">Payment</h3>
          <dl className="space-y-1">
            <div className="flex justify-between"><dt>Method</dt><dd>{o.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)'}</dd></div>
            <div className="flex justify-between"><dt>Status</dt><dd>{label(o.paymentStatus)}</dd></div>
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{rupee(o.subtotal)}</dd></div>
            {o.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount</dt><dd>− {rupee(o.discount)}</dd></div>}
            <div className="flex justify-between"><dt>Shipping</dt><dd>{o.shippingFee ? rupee(o.shippingFee) : 'Free'}</dd></div>
            <div className="flex justify-between text-brand-muted"><dt>Tax included</dt><dd>{rupee(o.tax)}</dd></div>
            <div className="flex justify-between border-t border-beige-dark pt-2 text-lg font-black"><dt>Total</dt><dd>{rupee(o.total)}</dd></div>
          </dl></section>
      </div>

      <ReturnModal open={Boolean(returnItem)} onClose={() => setReturnItem(null)} order={o} item={returnItem} onDone={() => { setReturnItem(null); refetchAll(); }} />
    </div>
  );
}
