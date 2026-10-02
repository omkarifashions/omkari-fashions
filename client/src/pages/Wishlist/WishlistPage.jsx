import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import Seo from '../../components/common/Seo.jsx';
import SafeImage from '../../components/common/SafeImage.jsx';
import { LoadingSpinner, PageLoader } from '../../components/common/Feedback.jsx';
import { TrashIcon } from '../../components/common/Icons.jsx';
import { productImage, rupee } from '../../utils/format.js';

function Empty({ loggedIn }) {
  const navigate = useNavigate();
  return (
    <div className="relative mx-auto flex min-h-[420px] max-w-[1000px] items-center justify-center overflow-hidden py-10 sm:min-h-[520px]">
      <img src="/images/deity-frame.png" alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-contain sm:object-fill" />
      <div className="relative z-10 px-6 text-center">
        <h1 className="font-sans text-[20px] font-black text-black sm:text-[22px]">Your Wishlist Is Empty</h1>
        <p className="mt-1 text-[16px] text-black sm:text-[18px]">The Pieces You Love Deserve A Place Here.</p>
        <button type="button" onClick={() => navigate(loggedIn ? '/products' : '/login', { state: { from: '/wishlist' } })} className="mt-9 h-[34px] min-w-[195px] rounded-[3px] bg-btn px-6 text-[20px] text-white transition hover:brightness-110">{loggedIn ? 'Start Wishlisting' : 'Login to Wishlist'}</button>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { user } = useAuth();
  const { products, loading, remove, busyId } = useWishlist();
  const { add, busyId: cartBusy } = useCart();

  const moveToCart = async (p) => { if (await add(p, 1)) await remove(p._id); };

  return (
    <div className="pb-10">
      <Seo title="Wishlist" path="/wishlist" noindex />
      {!user ? <Empty loggedIn={false} /> : loading ? <PageLoader /> : products.length === 0 ? <Empty loggedIn /> : (
        <div className="container-x max-w-[1050px] pt-6">
          <h1 className="mb-6 text-center font-display text-[26px] font-bold text-brand-heading">My Wishlist ({products.length})</h1>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => {
              const out = p.stock < 1;
              const sale = p.salePrice > 0 && p.salePrice < p.price;
              return (
                <li key={p._id} className="bg-white pb-4 shadow-card">
                  <div className="relative">
                    <Link to={`/products/${p.slug}`}><SafeImage src={productImage(p)} alt={p.name} className="aspect-square w-full object-cover" /></Link>
                    <button type="button" onClick={() => remove(p._id)} disabled={busyId === p._id} aria-label={`Remove ${p.name} from wishlist`} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow disabled:opacity-60"><TrashIcon size={18} /></button>
                  </div>
                  <div className="px-3 pt-3 text-center">
                    <Link to={`/products/${p.slug}`} className="line-clamp-2 min-h-[2.4em] text-[12px] text-[#12332d] hover:text-brand-orange">{p.name}</Link>
                    <p className="mt-3 text-[13px]">{sale && <span className="mr-1.5 text-[#888] line-through">{rupee(p.price)}</span>}<b>{rupee(p.finalPrice)}</b></p>
                    <button type="button" disabled={out || cartBusy === p._id} onClick={() => moveToCart(p)} className="mt-3 flex h-[38px] w-full items-center justify-center rounded-[3px] bg-btn text-[12px] font-bold uppercase text-white disabled:opacity-50">{cartBusy === p._id ? <LoadingSpinner size="sm" className="border-white border-t-transparent" /> : out ? 'Out of stock' : 'Add to cart'}</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
