import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cartApi } from "../api/services.js";
import { useAuth } from "./AuthContext.jsx";
import { useToast } from "./ToastContext.jsx";

const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

const KEY = "omkari_guest_cart";

const readGuest = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};

const writeGuest = (items) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable
  }
};

const snapshot = (p) => ({
  _id: p._id,
  name: p.name,
  slug: p.slug,
  price: p.price,
  salePrice: p.salePrice,
  finalPrice: p.finalPrice,
  stock: p.stock,
  images: p.images?.slice(0, 1) || [],
  stoneColor: p.stoneColor,
  specifications: p.specifications,
});

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [items, setItems] = useState(readGuest);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const mergedFor = useRef(null);

  /*
   * Sync customer cart after authentication.
   *
   * IMPORTANT:
   * - Admin pages never call /api/cart.
   * - Initial cart loading errors are silent.
   * - Cart action errors (add/update/remove) still show toasts.
   */
  useEffect(() => {
    if (authLoading) return;

    const isAdminArea = window.location.pathname.startsWith("/admin");

    // Admin panel does not need the customer cart.
    if (isAdminArea) {
      mergedFor.current = null;
      setItems([]);
      setLoading(false);
      return;
    }

    // Guest user
    if (!user) {
      mergedFor.current = null;
      setItems(readGuest());
      setLoading(false);
      return;
    }

    // Already synced this user
    if (mergedFor.current === user._id) {
      return;
    }

    mergedFor.current = user._id;
    setLoading(true);

    const guest = readGuest();

    const req = guest.length
      ? cartApi.merge(
          guest.map((item) => ({
            productId: item.product._id,
            quantity: item.quantity,
          })),
        )
      : cartApi.get();

    req
      .then((r) => {
        setItems(r?.items || []);

        // Guest cart successfully merged
        if (guest.length) {
          writeGuest([]);
        }
      })
      .catch(() => {
        /*
         * Do NOT show a toast here.
         *
         * This prevents:
         * "Could not load your cart. Please refresh."
         *
         * from appearing on admin pages or during authentication.
         */
        setItems([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, authLoading]);

  /*
   * Save guest cart.
   */
  const persistGuest = useCallback((next) => {
    setItems(next);
    writeGuest(next);
  }, []);

  /*
   * Add product to cart.
   */
  const add = useCallback(
    async (product, quantity = 1, { silent = false } = {}) => {
      if (!product) {
        toast.error("Invalid product");
        return false;
      }

      if (product.stock < 1) {
        toast.error("This product is out of stock");
        return false;
      }

      setBusyId(product._id);

      try {
        if (user) {
          const r = await cartApi.add(product._id, quantity);

          setItems(r?.items || []);
        } else {
          const cur = readGuest();

          const line = cur.find((item) => item.product._id === product._id);

          const nextQty = (line?.quantity || 0) + quantity;

          if (nextQty > product.stock) {
            throw Object.assign(new Error("stock"), {
              userMessage: `Only ${product.stock} left in stock`,
            });
          }

          const next = line
            ? cur.map((item) =>
                item.product._id === product._id
                  ? {
                      ...item,
                      quantity: nextQty,
                    }
                  : item,
              )
            : [
                ...cur,
                {
                  product: snapshot(product),
                  quantity,
                },
              ];

          persistGuest(next);
        }

        if (!silent) {
          toast.success("Product added to cart");
        }

        return true;
      } catch (e) {
        toast.error(e?.userMessage || "Could not add to cart");

        return false;
      } finally {
        setBusyId(null);
      }
    },
    [user, toast, persistGuest],
  );

  /*
   * Update cart quantity.
   */
  const setQty = useCallback(
    async (productId, quantity) => {
      if (quantity < 1) return;

      setBusyId(productId);

      try {
        if (user) {
          const r = await cartApi.setQty(productId, quantity);

          setItems(r?.items || []);
        } else {
          const cur = readGuest();

          const line = cur.find((item) => item.product._id === productId);

          if (line && quantity > line.product.stock) {
            throw Object.assign(new Error("stock"), {
              userMessage: `Only ${line.product.stock} left in stock`,
            });
          }

          const next = cur.map((item) =>
            item.product._id === productId
              ? {
                  ...item,
                  quantity,
                }
              : item,
          );

          persistGuest(next);
        }

        toast.success("Cart updated");
      } catch (e) {
        toast.error(e?.userMessage || "Could not update cart");
      } finally {
        setBusyId(null);
      }
    },
    [user, toast, persistGuest],
  );

  /*
   * Remove product from cart.
   */
  const remove = useCallback(
    async (productId) => {
      setBusyId(productId);

      try {
        if (user) {
          const r = await cartApi.remove(productId);

          setItems(r?.items || []);
        } else {
          const next = readGuest().filter(
            (item) => item.product._id !== productId,
          );

          persistGuest(next);
        }

        toast.success("Product removed from cart");
      } catch (e) {
        toast.error(e?.userMessage || "Could not remove item");
      } finally {
        setBusyId(null);
      }
    },
    [user, toast, persistGuest],
  );

  /*
   * Clear local cart state.
   */
  const resetLocal = useCallback(() => {
    setItems([]);
  }, []);

  /*
   * Manually refresh customer cart.
   */
  const refresh = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const r = await cartApi.get();

      setItems(r?.items || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /*
   * Total item count.
   */
  const count = useMemo(
    () =>
      items.reduce((total, item) => total + (Number(item.quantity) || 0), 0),
    [items],
  );

  /*
   * Cart subtotal.
   */
  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        const price =
          item.product.finalPrice ??
          item.product.salePrice ??
          item.product.price ??
          0;

        return total + Number(price) * (Number(item.quantity) || 0);
      }, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      count,
      subtotal,
      loading,
      busyId,
      add,
      setQty,
      remove,
      resetLocal,
      refresh,
    }),
    [
      items,
      count,
      subtotal,
      loading,
      busyId,
      add,
      setQty,
      remove,
      resetLocal,
      refresh,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
