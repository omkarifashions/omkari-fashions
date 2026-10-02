import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../../api/services.js';
import Seo from '../../components/common/Seo.jsx';
import { ErrorState, PageLoader } from '../../components/common/Feedback.jsx';
import NotFoundPage from './NotFoundPage.jsx';

export default function CmsPage({ pageKey }) {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['cms', pageKey], queryFn: () => catalogApi.cms(pageKey), retry: false });
  if (isLoading) return <PageLoader />;
  if (isError) return error?.status === 404 ? <NotFoundPage /> : <ErrorState message={error?.userMessage} onRetry={refetch} />;
  const p = data.page;
  return (
    <div className="container-x max-w-[820px] pb-8 pt-8">
      <Seo title={p.seoTitle || p.title} description={p.seoDescription || p.content?.slice(0, 160)} path={`/${pageKey}`} />
      <h1 className="text-center font-display text-[28px] font-bold text-brand-heading">{p.title}</h1>
      {p.subtitle && <p className="mt-1 text-center text-brand-text">{p.subtitle}</p>}
      <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-brand-ink">{p.content?.split('\n\n').map((para, i) => <p key={i} className="whitespace-pre-line">{para}</p>)}</div>
      {p.items?.length > 0 && <ul className="mt-6 space-y-3">{p.items.map((it, i) => <li key={i} className="card p-4"><b>{it.title}</b><p className="text-sm text-brand-text">{it.text}</p></li>)}</ul>}
    </div>
  );
}
