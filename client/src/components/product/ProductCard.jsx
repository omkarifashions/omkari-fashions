import { Link } from "react-router-dom";
import SafeImage from "../common/SafeImage.jsx";
import WishlistButton from "./WishlistButton.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { productImage, rupee } from "../../utils/format.js";
import { LoadingSpinner } from "../common/Feedback.jsx";

export function Ribbon({ children = "Bestseller" }) {
  return (
    <span
      className="absolute left-0 top-2 z-10 bg-[#B04400] py-[3px] pl-2 pr-3 text-[10px] font-semibold text-white"
      style={{
        clipPath: "polygon(0 0,100% 0,91% 50%,100% 100%,0 100%)",
      }}
    >
      {children}
    </span>
  );
}

export default function ProductCard({
  product,
  showCart = true,
  priority = false,
}) {
  const { add, busyId } = useCart();

  const out = product.stock < 1;

  const onSale = product.salePrice > 0 && product.salePrice < product.price;

  return (
    <article className="group">
      <div className="relative">
        <Link
          to={`/products/${product.slug}`}
          className="block"
          aria-label={product.name}
          tabIndex={-1}
        >
          {/* SQUARE PRODUCT IMAGE */}
          <div className="relative aspect-square overflow-hidden rounded-[4px] bg-brand-brown/10">
            <SafeImage
              src={productImage(product)}
              alt={`${product.name} - Omkari Fashions`}
              eager={priority}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />

            {out && (
              <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-white">
                Out of Stock
              </span>
            )}
          </div>
        </Link>

        {product.isBestseller && <Ribbon />}

        <WishlistButton
          product={product}
          className="absolute right-1.5 top-1.5 z-10 h-7 w-7 bg-white/40 hover:bg-white/80"
          size={18}
        />

        {showCart && !out && (
          <button
            type="button"
            disabled={busyId === product._id}
            onClick={() => add(product, 1)}
            className="absolute inset-x-2 bottom-2 z-10 flex h-8 items-center justify-center gap-2 rounded-[3px] bg-white/95 text-[12px] font-bold text-brand-orange shadow transition hover:bg-brand-orange hover:text-white disabled:opacity-70 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus:translate-y-0 sm:focus:opacity-100"
          >
            {busyId === product._id ? (
              <LoadingSpinner size="sm" />
            ) : (
              "Add to Cart"
            )}
          </button>
        )}
      </div>

      <Link to={`/products/${product.slug}`} className="block">
        <h3 className="mt-1.5 line-clamp-2 font-sans text-[13px] font-normal leading-snug text-brand-ink">
          {product.name}
        </h3>

        <p className="mt-0.5 flex items-baseline gap-1.5 text-[13px] font-bold text-brand-ink">
          {onSale && (
            <span className="text-[11px] font-normal text-brand-muted line-through">
              {rupee(product.price)}
            </span>
          )}

          {rupee(product.finalPrice ?? product.price)}
        </p>
      </Link>
    </article>
  );
}
