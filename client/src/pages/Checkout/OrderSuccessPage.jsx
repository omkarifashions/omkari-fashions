import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { orderApi } from '../../api/services.js';
import Seo from '../../components/common/Seo.jsx';
import { ErrorState, PageLoader } from '../../components/common/Feedback.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { fmtDeliveryDate, rupee } from '../../utils/format.js';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const s = useSettings();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['order', id], queryFn: () => orderApi.get(id) });
  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorState message={error?.userMessage} onRetry={refetch} />;
  const o = data.order;
  const eta = new Date(new Date(o.createdAt).getTime() + (s.deliveryDays || 5) * 864e5);
  return (
    <div className="container-x max-w-xl py-10 text-center">
      <Seo title="Order Confirmed" path={`/order-success/${id}`} noindex />
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }} className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-600 shadow-lg">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <motion.path d="m5 12.5 4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.5 }} />
        </svg>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <h1 className="mt-5 font-display text-[28px] font-bold text-brand-heading">Order placed successfully!</h1>
        <p className="mt-1 text-brand-text">Thank you for shopping with Omkari Fashions. A confirmation has been emailed to you.</p>
        <dl className="card mt-6 divide-y divide-beige-dark text-left text-[15px]">
          {[['Order number', <b key="n">{o.orderNumber}</b>], ['Order total', <b key="t">{rupee(o.total)}</b>], ['Payment method', o.paymentMethod === 'cod' ? 'Cash on Delivery' : `Online payment (${o.paymentStatus})`], ['Estimated delivery', `By ${fmtDeliveryDate(eta)}`], ['Delivering to', `${o.shippingAddress.name}, ${o.shippingAddress.city} - ${o.shippingAddress.pincode}`]].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-3"><dt className="text-brand-muted">{k}</dt><dd className="text-right">{v}</dd></div>
          ))}
        </dl>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to={`/orders/${o._id}`} className="btn-primary">View Order</Link>
          <Link to="/products" className="btn-outline">Continue Shopping</Link>
        </div>
      </motion.div>
    </div>
  );
}
