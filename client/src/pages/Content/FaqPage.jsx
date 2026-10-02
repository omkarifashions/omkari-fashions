import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../../api/services.js';
import Seo from '../../components/common/Seo.jsx';
import { EmptyState, ErrorState, PageLoader } from '../../components/common/Feedback.jsx';
import { ChevronDown } from '../../components/common/Icons.jsx';

export default function FaqPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['faqs'], queryFn: catalogApi.faqs });
  const [open, setOpen] = useState(null);
  const faqs = data?.items || [];
  const ld = faqs.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) } : undefined;
  return (
    <div className="container-x max-w-[820px] pb-8 pt-8">
      <Seo title="FAQ" description="Answers to common questions about Omkari Fashions jewellery, delivery, returns and payments." path="/faq" jsonLd={ld} />
      <h1 className="mb-6 text-center font-display text-[28px] font-bold text-brand-heading">Frequently Asked Questions</h1>
      {isLoading ? <PageLoader /> : isError ? <ErrorState message={error?.userMessage} onRetry={refetch} /> : faqs.length === 0 ? <EmptyState title="No FAQs yet" /> : (
        <div className="space-y-2">
          {faqs.map((f) => (
            <div key={f._id} className="card">
              <h2><button type="button" aria-expanded={open === f._id} onClick={() => setOpen(open === f._id ? null : f._id)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left font-sans text-[15px] font-bold text-brand-heading">{f.question}<ChevronDown size={18} className={`shrink-0 transition ${open === f._id ? 'rotate-180' : ''}`} /></button></h2>
              {open === f._id && <p className="px-4 pb-4 text-[14px] text-brand-text">{f.answer}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
