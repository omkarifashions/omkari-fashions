import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../../api/services.js';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Seo from '../../components/common/Seo.jsx';
import SafeImage from '../../components/common/SafeImage.jsx';
import { StatusBadge } from '../../components/orders/Timelines.jsx';
import { EmptyState, ErrorState, LoadingSpinner, Pagination, Skeleton } from '../../components/common/Feedback.jsx';
import { fmtDate, imgUrl, rupee } from '../../utils/format.js';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const confirm = useConfirm();
  const toast = useToast();
  const [busyId, setBusyId] = useState(null);
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['orders', page], queryFn: () => orderApi.list(page), placeholderData: (p) => p });

  const cancel = async (o) => {
    const reason = await confirm({ title: 'Cancel this order?', message: `Order ${o.orderNumber} will be cancelled. This cannot be undone.`, confirmText: 'Yes, cancel order', cancelText: 'Keep order', tone: 'danger', withReason: true, reasonLabel: 'Reason for cancellation', reasonPlaceholder: 'Tell us why you are cancelling (optional)' });
    if (!reason) return;
    setBusyId(o._id);
    try {
      await orderApi.cancel(o._id, reason === true ? undefined : reason);
      toast.success('Order cancelled successfully');
      qc.invalidateQueries({ queryKey: ['orders'] });
    } catch (e) {
      toast.error(e.userMessage);
      qc.invalidateQueries({ queryKey: ['orders'] });
    } finally { setBusyId(null); }
  };

  return (
    <div>
      <Seo title="My Orders" path="/orders" noindex />
      <h2 className="mb-4 font-display text-xl font-bold text-brand-heading">My Orders</h2>
      {isLoading ? <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
        : isError ? <ErrorState message={error?.userMessage} onRetry={refetch} />
        : data.orders.length === 0 ? <EmptyState title="No orders yet" message="When you place an order it will appear here." actionLabel="Start Shopping" to="/products" />
        : (
          <>
            <ul className="space-y-4">
              {data.orders.map((o) => (
                <li key={o._id} className="card overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-beige px-4 py-2.5 text-[13px]">
                    <div><b>{o.orderNumber}</b><span className="ml-2 text-brand-muted">{fmtDate(o.createdAt)}</span></div>
                    <div className="flex items-center gap-2"><StatusBadge status={o.orderStatus} />{o.returnStatus && o.returnStatus !== 'none' && <StatusBadge status={`return ${o.returnStatus}`.replace(/ /g, '_')} />}</div>
                  </div>
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="flex flex-1 gap-2 overflow-hidden">
                      {o.items.slice(0, 4).map((it) => <SafeImage key={it.product} src={imgUrl(it.image)} alt={it.name} className="h-16 w-16 shrink-0 rounded object-cover" />)}
                      <p className="min-w-0 self-center text-[14px]"><span className="line-clamp-2">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}</span></p>
                    </div>
                    <div className="text-[13px] sm:text-right"><p className="text-lg font-black">{rupee(o.total)}</p><p className="text-brand-muted">{o.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'} · {o.paymentStatus.replace('_', ' ')}</p></div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 border-t border-beige px-4 py-3">
                    <Link to={`/orders/${o._id}`} className="btn-outline !px-4 !py-1.5 text-[13px]">View Order</Link>
                    {o.canCancel && <button type="button" onClick={() => cancel(o)} disabled={busyId === o._id} className="rounded-[4px] border border-red-700 px-4 py-1.5 text-[13px] font-bold text-red-700 hover:bg-red-700 hover:text-white disabled:opacity-60">{busyId === o._id ? <LoadingSpinner size="sm" /> : 'Cancel Order'}</button>}
                    {o.items.some((i) => i.returnEligibility?.eligible) && <Link to={`/orders/${o._id}`} className="rounded-[4px] bg-brand-brown px-4 py-1.5 text-[13px] font-bold text-white">Return</Link>}
                  </div>
                </li>
              ))}
            </ul>
            <Pagination page={page} pages={data.pages} onChange={(n) => { setPage(n); window.scrollTo({ top: 0 }); }} />
          </>
        )}
    </div>
  );
}
