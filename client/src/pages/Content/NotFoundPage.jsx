import { Link } from 'react-router-dom';
import Seo from '../../components/common/Seo.jsx';

export default function NotFoundPage() {
  return (
    <div className="container-x flex flex-col items-center py-16 text-center">
      <Seo title="Page not found" noindex />
      <img src="/images/logo.png" alt="" className="h-20 w-20" />
      <p className="mt-4 font-display text-6xl font-bold text-brand-orange">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-brand-heading">We couldn’t find that page</h1>
      <p className="mt-2 max-w-md text-brand-text">The link may be broken or the page may have been moved.</p>
      <div className="mt-6 flex gap-3"><Link to="/" className="btn-primary">Go to Home</Link><Link to="/products" className="btn-outline">Browse Jewellery</Link></div>
    </div>
  );
}
