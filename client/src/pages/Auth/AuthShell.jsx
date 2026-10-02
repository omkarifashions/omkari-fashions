import Seo from '../../components/common/Seo.jsx';

export default function AuthShell({ title, subtitle, children, seoTitle }) {
  return (
    <div className="relative overflow-hidden py-8 sm:py-12">
      <Seo title={seoTitle || title} noindex />
      <img src="/images/deity-frame.png" alt="" aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 w-[1100px] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[.28]" />
      <div className="container-x relative">
        <div className="mx-auto w-full max-w-md rounded-lg bg-white/90 p-6 shadow-card backdrop-blur sm:p-8">
          <img src="/images/logo.png" alt="" className="mx-auto h-16 w-16" />
          <h1 className="mt-3 text-center font-display text-[26px] font-bold text-brand-heading">{title}</h1>
          {subtitle && <p className="mt-1 text-center text-sm text-brand-text">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
