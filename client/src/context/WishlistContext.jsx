import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { wishlistApi } from '../api/services.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const WishlistContext = createContext(null);
export const useWishlist = () => useContext(WishlistContext);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!user) {
      setProducts([]);
      return;
    }
    setLoading(true);
    wishlistApi.get().then((r) => setProducts(r.products)).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const ids = useMemo(() => new Set(products.map((p) => p._id)), [products]);

  const toggle = useCallback(
    async (product) => {
      if (!user) {
        toast.info('Please log in to save items to your wishlist');
        navigate('/login', { state: { from: location.pathname + location.search } });
        return;
      }
      setBusyId(product._id);
      try {
        if (ids.has(product._id)) {
          const r = await wishlistApi.remove(product._id);
          setProducts(r.products);
          toast.info('Removed from wishlist');
        } else {
          const r = await wishlistApi.add(product._id);
          setProducts(r.products);
          toast.success('Added to wishlist');
        }
      } catch (e) {
        toast.error(e.userMessage || 'Could not update wishlist');
      } finally {
        setBusyId(null);
      }
    },
    [user, ids, toast, navigate, location]
  );

  const remove = useCallback(
    async (id) => {
      setBusyId(id);
      try {
        const r = await wishlistApi.remove(id);
        setProducts(r.products);
        toast.info('Removed from wishlist');
      } catch (e) {
        toast.error(e.userMessage || 'Could not update wishlist');
      } finally {
        setBusyId(null);
      }
    },
    [toast]
  );

  const value = useMemo(() => ({ products, ids, loading, busyId, toggle, remove, count: products.length }), [products, ids, loading, busyId, toggle, remove]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
