import { fmtDateTime, label } from '../../utils/format.js';

function Step({ done, current, failed, last, title, time, note }) {
  const dot = failed ? 'border-red-600 bg-red-600 text-white' : done ? 'border-emerald-600 bg-emerald-600 text-white' : current ? 'border-brand-orange bg-white text-brand-orange' : 'border-[#cbbcb1] bg-white text-transparent';
  return (
    <li className="relative flex gap-3 pb-6 last:pb-0 sm:pb-0 sm:flex-1 sm:flex-col sm:items-center sm:text-center">
      {!last && <span aria-hidden="true" className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5 sm:left-1/2 sm:top-[13px] sm:h-0.5 sm:w-full ${done ? 'bg-emerald-600' : 'bg-[#d9cbc0]'}`} />}
      <span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black ${dot} ${current && !done ? 'ring-4 ring-brand-orange/20' : ''}`}>{failed ? '✕' : done ? '✓' : '●'}</span>
      <div className="sm:mt-2 sm:px-1">
        <p className={`text-[14px] font-bold leading-tight ${done || current ? 'text-brand-ink' : 'text-brand-muted'} ${failed ? 'text-red-700' : ''}`}>{title}</p>
        {time && <p className="text-[11px] text-brand-muted">{fmtDateTime(time)}</p>}
        {note && <p className="mt-0.5 max-w-[240px] text-[12px] text-brand-text">{note}</p>}
      </div>
    </li>
  );
}

const DELIVERY = [['placed', 'Order Placed'], ['confirmed', 'Confirmed'], ['packed', 'Packed'], ['shipped', 'Shipped'], ['out_for_delivery', 'Out for Delivery'], ['delivered', 'Delivered']];

export function OrderTimeline({ order }) {
  const hist = Object.fromEntries((order.statusHistory || []).map((h) => [h.status, h]));
  if (order.orderStatus === 'cancelled') {
    const reached = DELIVERY.filter(([k]) => hist[k]).slice(0, 1);
    return (
      <ol aria-label="Order timeline" className="flex flex-col sm:flex-row">
        {reached.map(([k, t], i) => <Step key={k} done title={t} time={hist[k]?.timestamp} last={false} />)}
        <Step failed title="Cancelled" time={order.cancellation?.cancelledAt || hist.cancelled?.timestamp} note={order.cancellation?.reason} last />
      </ol>
    );
  }
  const idx = DELIVERY.findIndex(([k]) => k === order.orderStatus);
  return (
    <ol aria-label="Order timeline" className="flex flex-col sm:flex-row">
      {DELIVERY.map(([k, t], i) => (
        <Step key={k} title={t} done={i < idx || (k === 'delivered' && idx === i)} current={i === idx} time={hist[k]?.timestamp || (k === 'placed' ? order.createdAt : null)} note={k === 'shipped' && order.trackingId ? `${order.courier || 'Courier'} · ${order.trackingId}` : hist[k]?.note && !['Order placed'].includes(hist[k].note) && k !== 'delivered' ? hist[k].note : null} last={i === DELIVERY.length - 1} />
      ))}
    </ol>
  );
}

export function ReturnTimeline({ ret }) {
  const hist = {};
  (ret.statusHistory || []).forEach((h) => { hist[h.status] = h; });
  const rejected = ret.status === 'rejected';
  const steps = [
    ['requested', 'Return Requested'],
    ['under_review', 'Return Under Review'],
    [rejected ? 'rejected' : 'approved', rejected ? 'Return Rejected' : 'Return Approved'],
    ...(rejected ? [] : [['pickup_scheduled', 'Pickup Scheduled'], ['item_received', 'Item Received'], ['refund_processing', 'Refund Processing'], ['refund_completed', 'Refund Completed']]),
  ];
  const order = ['requested', 'under_review', 'info_requested', 'approved', 'rejected', 'pickup_scheduled', 'item_received', 'refund_processing', 'refund_completed'];
  const cur = order.indexOf(ret.status);
  return (
    <ol aria-label="Return timeline" className="flex flex-col sm:flex-row">
      {steps.map(([k, t], i) => {
        const pos = order.indexOf(k);
        const isCurrent = ret.status === k || (ret.status === 'info_requested' && k === 'under_review');
        const done = k !== 'rejected' && ((ret.status === 'refund_completed' && k === 'refund_completed') || (!isCurrent && pos < cur));
        const current = isCurrent && !done;
        return <Step key={k} title={t} failed={k === 'rejected'} done={done} current={current} time={hist[k]?.timestamp} note={hist[k]?.note && !['Return requested by customer'].includes(hist[k].note) ? hist[k].note : k === 'pickup_scheduled' && ret.pickupDate ? `Pickup on ${new Date(ret.pickupDate).toLocaleDateString('en-IN')}` : null} last={i === steps.length - 1} />;
      })}
    </ol>
  );
}

export function StatusBadge({ status }) {
  const good = ['delivered', 'refund_completed', 'approved', 'paid', 'refunded'];
  const bad = ['cancelled', 'rejected', 'failed'];
  const cls = good.includes(status) ? 'bg-emerald-100 text-emerald-800' : bad.includes(status) ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800';
  return <span className={`badge ${cls}`}>{label(status)}</span>;
}
