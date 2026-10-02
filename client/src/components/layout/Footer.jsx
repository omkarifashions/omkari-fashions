import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext.jsx';
import { FacebookIcon, InstagramIcon, PinterestIcon, YoutubeIcon } from '../common/Icons.jsx';

const INFO = [['About Us', '/about'], ['Contact Us', '/contact'], ['Store Locator', '/store-locator'], ['FAQ', '/faq']];
const LEGAL = [['Privacy Policy', '/privacy-policy'], ['Terms of Use', '/terms-of-use'], ['Shipping Policy', '/shipping-policy'], ['Return and refund policy', '/return-and-refund-policy'], ['Track Orders', '/orders']];

export default function Footer() {
  const s = useSettings();
  const social = s.social || {};
  const icons = [[FacebookIcon, 'Facebook', social.facebook], [PinterestIcon, 'Pinterest', social.pinterest], [InstagramIcon, 'Instagram', social.instagram], [YoutubeIcon, 'YouTube', social.youtube]];
  const head = 'mb-5 text-[13px] font-black uppercase tracking-wide text-brand-text';
  return (
    <footer className="bg-cream text-brand-text">
      <div className="mx-auto grid w-full max-w-[1000px] gap-10 px-6 py-10 sm:grid-cols-2 md:grid-cols-[1.1fr_1.7fr_1fr_1fr] md:gap-6 md:py-12">
        <div className="flex flex-col items-center md:items-start">
          <Link to="/" aria-label="Omkari Fashions home" className="flex flex-col items-center">
            <img src="/images/logo.png" alt="Omkari Fashions" width="80" height="80" loading="lazy" className="h-20 w-20 rounded-full border border-brand-orange bg-white object-contain" />
            <span className="mt-2 font-display text-[17px] font-bold text-brand-orange">Omkari Fashions</span>
          </Link>
          <div className="mt-4 flex gap-5 text-brand-rust">
            {icons.map(([Icon, name, href]) => (
              <a key={name} href={href || '#'} target="_blank" rel="noopener noreferrer" aria-label={name} className="transition hover:text-brand-orange"><Icon size={20} /></a>
            ))}
          </div>
        </div>

        <div>
          <h2 className={`${head} font-sans`}>Get in Touch with</h2>
          <ul className="space-y-4 text-[12px] leading-relaxed">
            <li>Phone / WhatsApp: <strong>{s.phone}</strong></li>
            <li>Email: <strong><a href={`mailto:${s.email}`} className="hover:text-brand-orange">{s.email}</a></strong></li>
            <li>Live Chat Support: <strong>{s.supportHours}</strong></li>
            <li>Call Support: <strong>{s.supportHours}</strong></li>
          </ul>
        </div>

        <div>
          <h2 className={`${head} font-sans`}>Information</h2>
          <ul className="space-y-3 text-[12px]">{INFO.map(([l, to]) => <li key={l}><Link to={to} className="hover:text-brand-orange">{l}</Link></li>)}</ul>
        </div>

        <div>
          <h2 className={`${head} font-sans`}>Legal Policy</h2>
          <ul className="space-y-3 text-[12px]">{LEGAL.map(([l, to]) => <li key={l}><Link to={to} className="hover:text-brand-orange">{l}</Link></li>)}</ul>
        </div>
      </div>
      <p className="border-t border-beige-dark py-4 text-center text-[11px] text-brand-muted">© {new Date().getFullYear()} Omkari Fashions. All rights reserved.</p>
    </footer>
  );
}
