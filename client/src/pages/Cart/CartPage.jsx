import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "../../api/services.js";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useConfirm } from "../../context/ConfirmContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import Seo from "../../components/common/Seo.jsx";
import SafeImage from "../../components/common/SafeImage.jsx";
import QuantitySelector from "../../components/common/QuantitySelector.jsx";
import { PageLoader } from "../../components/common/Feedback.jsx";
import { TrashIcon } from "../../components/common/Icons.jsx";
import { fmtDeliveryDate, productImage, rupee } from "../../utils/format.js";

const strip =
  "bg-gradient-to-r from-[#4A1D00] via-[#8A3600] to-[#B64500] py-[6px] text-center text-[13px] font-bold text-white";

export default function CartPage() {
  const { items, count, subtotal, loading, busyId, setQty, remove } = useCart();

  const { user } = useAuth();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const s = useSettings();

  const cats = useQuery({
    queryKey: ["home-suggest"],
    queryFn: () =>
      catalogApi.products({
        bestseller: "true",
        limit: 4,
      }),
    staleTime: 120_000,
  });

  const askRemove = async (it) => {
    const ok = await confirm({
      title: "Remove this item?",
      message: `“${it.product.name}” will be removed from your cart.`,
      confirmText: "Remove",
      tone: "danger",
    });

    if (ok) {
      remove(it.product._id);
    }
  };

  const checkout = () => {
    if (user) {
      navigate("/checkout");
    } else {
      navigate("/login", {
        state: { from: "/checkout" },
      });
    }
  };

  const shipping =
    subtotal >= s.freeShippingAbove || subtotal === 0 ? 0 : s.shippingFee;

  const delivery = new Date(Date.now() + (s.deliveryDays || 5) * 864e5);

  return (
    <div className={items.length ? "pb-28 min-h-[60vh]" : "min-h-[70vh] pb-12"}>
      <Seo title="Your Cart" path="/cart" noindex />

      {/* ================= TITLE ================= */}
      <h1 className="pt-4 text-center font-sans text-[22px] font-bold leading-tight text-black sm:text-[24px]">
        Cart <span className="text-brand-rust">({count})</span>
      </h1>

      {/* ================= DELIVERY BAR ================= */}
      <div className={`${strip} mt-4`}>
        {items.length ? (
          <>
            Get it by <b>{fmtDeliveryDate(delivery)}</b>
          </>
        ) : (
          "Your Cart Is Currently Empty"
        )}
      </div>

      {/* ================= LOADING ================= */}
      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        /* ================= EMPTY CART ================= */
        <div className="w-full flex-1" />
      ) : (
        <div className="mx-auto max-w-[860px] px-4">
          {/* ================= CART ITEMS ================= */}
          <ul className="w-full divide-y divide-brand-brown/10 pt-4">
            {items.map((it) => {
              const p = it.product;
              const price = p.finalPrice || p.price;
              const busy = busyId === p._id;

              return (
                <li
                  key={p._id}
                  className={`flex gap-4 sm:gap-8 py-5 ${busy ? "opacity-60" : ""}`}
                >
                  {/* PRODUCT IMAGE */}
                  <Link
                    to={`/products/${p.slug}`}
                    className="
                      h-[120px]
                      w-[120px]
                      sm:h-[152px]
                      sm:w-[152px]
                      shrink-0
                      overflow-hidden
                      bg-brand-brown/10
                    "
                  >
                    <SafeImage
                      src={productImage(p)}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  {/* PRODUCT DETAILS */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      {/* NAME + DELETE */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <Link
                            to={`/products/${p.slug}`}
                            className="
                              block
                              truncate
                              text-[16px]
                              sm:text-[18px]
                              leading-tight
                              text-black
                              hover:text-brand-orange
                            "
                          >
                            {p.name}
                          </Link>

                          <p className="mt-1 text-[13px] sm:text-[14px] text-[#777]">
                            Polish:{" "}
                            {p.specifications?.colour?.split(",")[0] || "Gold"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => askRemove(it)}
                          disabled={busy}
                          aria-label={`Remove ${p.name}`}
                          className="
                            shrink-0
                            p-1
                            text-black
                            transition
                            hover:text-red-700
                            disabled:cursor-not-allowed
                          "
                        >
                          <TrashIcon size={20} />
                        </button>
                      </div>

                      {/* QUANTITY */}
                      <div className="mt-3">
                        <QuantitySelector
                          value={it.quantity}
                          max={Math.min(p.stock, 20)}
                          disabled={busy}
                          onChange={(n) => setQty(p._id, n)}
                          size="sm"
                        />
                      </div>

                      {p.stock < it.quantity && (
                        <p className="mt-1 text-[11px] font-bold text-red-700">
                          Only {p.stock} available
                        </p>
                      )}
                    </div>

                    {/* PRICE */}
                    <p className="mt-2 text-[20px] sm:text-[24px] font-black leading-none">
                      {rupee(price * it.quantity)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* ================= SUMMARY ================= */}
          <section
            className="w-full pt-6 mt-6 border-t border-brand-brown/10"
            aria-label="Cart summary"
          >
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-sans text-[17px] font-normal leading-tight">
                  Cart Summary
                </h2>

                <p className="mt-1 text-[15px] text-[#777]">
                  Item Total (Inclusive of Taxes)
                </p>
              </div>

              <p className="text-[20px] font-black text-black">
                {rupee(subtotal)}
              </p>
            </div>

            <div className="hidden">
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping ? rupee(shipping) : "Free"}</span>
              </div>

              <div className="flex justify-between">
                <span>Coupons & discounts</span>
                <span>Apply at checkout</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ================= FIXED BOTTOM BAR ================= */}
      {items.length > 0 && (
        <div
          className="
            fixed
            inset-x-0
            bottom-0
            z-30
            border-t
            border-black/5
            bg-white
            shadow-bar
          "
        >
          <div
            className="
              mx-auto
              flex
              max-w-[860px]
              items-center
              justify-between
              gap-4
              px-4
              py-3
            "
          >
            {/* TOTAL */}
            <span className="text-[22px] sm:text-[26px] font-black leading-none">
              {rupee(subtotal + shipping)}
            </span>

            {/* ORDER BUTTON */}
            <button
              type="button"
              onClick={checkout}
              className="
                h-[48px]
                sm:h-[54px]
                w-full
                max-w-[305px]
                rounded-[3px]
                bg-btn
                text-[18px]
                sm:text-[22px]
                font-black
                text-white
                transition
                hover:brightness-110
              "
            >
              Order Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
