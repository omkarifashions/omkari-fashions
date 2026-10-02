import { useWishlist } from '../../context/WishlistContext.jsx';
import { HeartIcon } from '../common/Icons.jsx';

export default function WishlistButton({ product, className = '', size = 20 }) {
  const { ids, toggle, busyId } = useWishlist();
  const active = ids.has(product._id);
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product); }}
      disabled={busyId === product._id}
      aria-pressed={active}
      aria-label={active ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      className={`flex items-center justify-center rounded-full transition disabled:opacity-60 ${active ? 'text-red-600' : 'text-brand-brown'} ${className}`}
    >
      <HeartIcon size={size} filled={active} />
    </button>
  );
}
