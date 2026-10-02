import { useQuery, useQueryClient } from '@tanstack/react-query';
import { returnApi } from '../../api/services.js';
import Seo from '../../components/common/Seo.jsx';
import { EmptyState, ErrorState, PageLoader } from '../../components/common/Feedback.jsx';
import { ReturnCard } from './OrderDetailsPage.jsx';

export default function ReturnsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['returns'], queryFn: returnApi.list });
  return (
    <div>
      <Seo title="My Returns" noindex />
      <h2 className="mb-4 font-display text-xl font-bold text-brand-heading">My Returns</h2>
      {isLoading ? <PageLoader /> : isError ? <ErrorState message={error?.userMessage} onRetry={refetch} />
        : data.returns.length === 0 ? <EmptyState title="No return requests" message="Eligible delivered orders can be returned from the order details page." actionLabel="View my orders" to="/orders" />
        : <div className="space-y-4">{data.returns.map((r) => <ReturnCard key={r._id} ret={r} onChanged={() => qc.invalidateQueries({ queryKey: ['returns'] })} />)}</div>}
    </div>
  );
}
