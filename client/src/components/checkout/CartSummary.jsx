import { rupee } from '../../utils/format.js';

export default function CartSummary({ items, quote, loading, coupon }) {
  const row = (l, v, cls = '') => <div className={`flex justify-between ${cls}`}><dt>{l}</dt><dd>{v}</dd></div>;
  return (
    <aside className="card p-5" aria-label="Order summary">
      <h2 className="font-display text-xl font-bold text-brand-heading">Order Summary</h2>
      <ul className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">
        {items.map((it) => (
          <li key={it.product._id} className="flex gap-3 text-[13px]">
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-beige">
              {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
              <span className="absolute -right-0 -top-0 rounded-bl bg-brand-brown px-1 text-[10px] text-white">{it.quantity}</span>
            </span>
            <span className="min-w-0 flex-1"><span className="line-clamp-2 block">{it.product.name}</span><span className="text-brand-muted">Qty {it.quantity}</span></span>
            <b>{rupee((it.product.finalPrice || it.product.price) * it.quantity)}</b>
          </li>
        ))}
      </ul>
      <dl className={`mt-4 space-y-1.5 border-t border-beige-dark pt-4 text-[14px] ${loading ? 'opacity-50' : ''}`}>
        {row('Subtotal (incl. taxes)', rupee(quote?.subtotal))}
        {quote?.discount > 0 && row(`Discount${coupon ? ` (${coupon})` : ''}`, `− ${rupee(quote.discount)}`, 'text-emerald-700')}
        {row('Shipping', quote?.shippingFee ? rupee(quote.shippingFee) : 'Free')}
        {row('Tax included in price', rupee(quote?.tax), 'text-[12px] text-brand-muted')}
        {row('Total', rupee(quote?.total), 'mt-2 border-t border-beige-dark pt-3 text-lg font-black')}
      </dl>
    </aside>
  );
}
