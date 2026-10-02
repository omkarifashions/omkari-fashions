import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/services.js';
import { ErrorState, PageLoader } from '../../components/common/Feedback.jsx';
import { PageHeader, TableWrap, Td, Th } from '../../components/admin/AdminUI.jsx';
import { StatusBadge } from '../../components/orders/Timelines.jsx';
import { fmtDate, label, rupee } from '../../utils/format.js';

function Card({ title, value, to, tone = 'text-brand-heading' }) {
  return (
    <Link to={to} className="rounded-lg bg-white p-4 shadow-card transition hover:shadow-lg">
      <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">{title}</p>
      <p className={`mt-1 text-2xl font-black ${tone}`}>{value}</p>
    </Link>
  );
}

function BarChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.sales));
  const w = 700, h = 200, pad = 26, bw = (w - pad * 2) / data.length;
  return (
    <div className="overflow-x-auto"><svg viewBox={`0 0 ${w} ${h + 30}`} className="min-w-[520px] w-full" role="img" aria-label="Sales for the last 14 days">
      {[0, 0.5, 1].map((t) => <g key={t}><line x1={pad} x2={w - 4} y1={h - t * (h - 20)} y2={h - t * (h - 20)} stroke="#ead6c8" /><text x={0} y={h - t * (h - 20) + 4} fontSize="9" fill="#7B6558">{t ? `${Math.round((max * t) / 1000)}k` : '0'}</text></g>)}
      {data.map((d, i) => {
        const bh = (d.sales / max) * (h - 20);
        return (
          <g key={d.date}>
            <rect x={pad + i * bw + 4} y={h - bh} width={bw - 8} height={bh} rx="3" fill="#A84300"><title>{`${d.date}: ${rupee(d.sales)} (${d.orders} orders)`}</title></rect>
            <text x={pad + i * bw + bw / 2} y={h + 14} fontSize="9" textAnchor="middle" fill="#7B6558">{d.date.slice(8)}</text>
          </g>
        );
      })}
    </svg></div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: adminApi.dashboard });
  if (isLoading) return <PageLoader />;
  if (isError) return <ErrorState message={error?.userMessage} onRetry={refetch} />;
  const s = data.stats;
  const totalStatus = Math.max(1, data.byStatus.reduce((n, x) => n + x.count, 0));
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Live overview of your store" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card title="Total Sales" value={rupee(s.totalSales)} to="/admin/orders" tone="text-emerald-700" />
        <Card title="Orders" value={s.orders} to="/admin/orders" />
        <Card title="Customers" value={s.customers} to="/admin/customers" />
        <Card title="Products" value={s.products} to="/admin/products" />
        <Card title="Pending Orders" value={s.pendingOrders} to="/admin/orders" tone="text-amber-700" />
        <Card title="Return Requests" value={s.returnRequests} to="/admin/returns" tone="text-red-700" />
        <Card title="Reviews to Approve" value={s.reviews} to="/admin/reviews" />
        <Card title="Unread Messages" value={s.messages} to="/admin/messages" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-lg bg-white p-4 shadow-card"><h2 className="mb-2 font-display text-lg font-bold">Sales - last 14 days</h2><BarChart data={data.series} /></section>
        <section className="rounded-lg bg-white p-4 shadow-card"><h2 className="mb-3 font-display text-lg font-bold">Orders by status</h2>
          {data.byStatus.length === 0 ? <p className="text-sm text-brand-muted">No orders yet</p> : <ul className="space-y-2">{data.byStatus.map((x) => <li key={x.status} className="text-[13px]"><div className="flex justify-between"><span>{label(x.status)}</span><b>{x.count}</b></div><div className="mt-0.5 h-2 rounded bg-beige"><div className="h-2 rounded bg-brand-orange" style={{ width: `${(x.count / totalStatus) * 100}%` }} /></div></li>)}</ul>}
        </section>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section><h2 className="mb-2 font-display text-lg font-bold">Recent orders</h2>
          <TableWrap><thead><tr><Th>Order</Th><Th>Customer</Th><Th>Total</Th><Th>Status</Th></tr></thead><tbody>
            {data.recent.map((o) => <tr key={o._id}><Td><Link to={`/admin/orders/${o._id}`} className="font-bold text-brand-orange">{o.orderNumber}</Link><div className="text-[11px] text-brand-muted">{fmtDate(o.createdAt)}</div></Td><Td>{o.user?.name}</Td><Td>{rupee(o.total)}</Td><Td><StatusBadge status={o.orderStatus} /></Td></tr>)}
            {data.recent.length === 0 && <tr><Td className="text-brand-muted" colSpan={4}>No orders yet</Td></tr>}
          </tbody></TableWrap></section>
        <section><h2 className="mb-2 font-display text-lg font-bold">Low stock & top sellers</h2>
          <TableWrap><thead><tr><Th>Product</Th><Th>Info</Th></tr></thead><tbody>
            {data.lowStock.map((p) => <tr key={p._id}><Td>{p.name}</Td><Td><span className="badge bg-red-100 text-red-800">{p.stock} left</span></Td></tr>)}
            {data.topProducts.map((p) => <tr key={p._id}><Td>{p.name}</Td><Td><span className="badge bg-emerald-100 text-emerald-800">{p.soldCount} sold</span></Td></tr>)}
            {!data.lowStock.length && !data.topProducts.length && <tr><Td colSpan={2} className="text-brand-muted">Nothing to show yet</Td></tr>}
          </tbody></TableWrap></section>
      </div>
    </div>
  );
}
