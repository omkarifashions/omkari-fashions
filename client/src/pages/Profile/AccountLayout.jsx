import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Seo from '../../components/common/Seo.jsx';

const LINKS = [['/profile', 'My Profile', true], ['/orders', 'My Orders'], ['/returns', 'My Returns'], ['/wishlist', 'Wishlist']];

export default function AccountLayout() {
  const { user } = useAuth();
  return (
    <div className="container-x max-w-[1050px] pb-8 pt-6">
      <Seo title="My Account" noindex />
      <h1 className="font-display text-[26px] font-bold text-brand-heading">Hello, {user?.name?.split(' ')[0]}</h1>
      <div className="mt-4 grid gap-6 md:grid-cols-[210px_1fr]">
        <nav aria-label="Account" className="no-scrollbar flex gap-2 overflow-x-auto md:flex-col md:gap-1">
          {LINKS.map(([to, l, end]) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `whitespace-nowrap rounded px-4 py-2.5 text-[14px] font-bold ${isActive ? 'bg-btn text-white' : 'bg-white/70 text-brand-text hover:bg-white'}`}>{l}</NavLink>
          ))}
        </nav>
        <div className="min-w-0"><Outlet /></div>
      </div>
    </div>
  );
}
