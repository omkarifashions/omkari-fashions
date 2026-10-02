import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { authApi, orderApi, catalogApi } from "../../api/services.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Seo from "../../components/common/Seo.jsx";
import AddressForm, {
  EMPTY_ADDRESS,
  validateAddress,
} from "../../components/checkout/AddressForm.jsx";
import PaymentSelector from "../../components/checkout/PaymentSelector.jsx";
import CartSummary from "../../components/checkout/CartSummary.jsx";
import {
  EmptyState,
  LoadingSpinner,
  PageLoader,
} from "../../components/common/Feedback.jsx";
import { rupee } from "../../utils/format.js";

const newKey = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
    return undefined;
  });
}

export default function CheckoutPage() {
  const { user, setUser } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const buyNow = sp.get("buyNow");
  const buyQty = Number(sp.get("qty")) || 1;

  const [address, setAddress] = useState({
    ...EMPTY_ADDRESS,
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [errors, setErrors] = useState({});
  const [payment, setPayment] = useState("razorpay");
  const [saveAddr, setSaveAddr] = useState(true);
  const [selectedSaved, setSelectedSaved] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const idem = useRef(newKey());
  const submitting = useRef(false);

  const buyProduct = useQuery({
    queryKey: ["buynow", buyNow],
    queryFn: () => catalogApi.byIds([buyNow]),
    enabled: Boolean(buyNow),
  });
  const items = useMemo(() => {
    if (buyNow) {
      const p = buyProduct.data?.products?.[0];
      return p
        ? [{ product: p, quantity: buyQty, image: p.images?.[0]?.url }]
        : [];
    }
    return cart.items.map((i) => ({ ...i, image: i.product.images?.[0]?.url }));
  }, [buyNow, buyProduct.data, buyQty, cart.items]);

  const quoteParams = {
    ...(buyNow ? { buyNowProduct: buyNow, buyNowQty: buyQty } : {}),
    ...(coupon ? { couponCode: coupon } : {}),
  };
  const quote = useQuery({
    queryKey: [
      "quote",
      quoteParams,
      items.map((i) => `${i.product._id}:${i.quantity}`).join(),
    ],
    queryFn: () => orderApi.quote(quoteParams),
    enabled: items.length > 0,
    retry: false,
  });

  useEffect(() => {
    const d = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];
    if (d) {
      setSelectedSaved(d._id);
      setAddress({
        name: d.name,
        phone: d.phone,
        address: d.address,
        city: d.city,
        state: d.state,
        pincode: d.pincode,
      });
    }
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (quote.data && !quote.data.codEnabled && payment === "cod")
      setPayment("razorpay");
  }, [quote.data, payment]);

  const pickSaved = (id) => {
    setSelectedSaved(id);
    const a = user.addresses.find((x) => x._id === id);
    if (a) {
      setAddress({
        name: a.name,
        phone: a.phone,
        address: a.address,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
      });
      setErrors({});
    } else
      setAddress({
        ...EMPTY_ADDRESS,
        name: user.name,
        phone: user.phone || "",
      });
  };

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponBusy(true);
    try {
      const r = await orderApi.coupon(code);
      setCoupon(r.code);
      toast.success(`Coupon ${r.code} applied - you save ${rupee(r.discount)}`);
    } catch (e) {
      toast.error(e.userMessage);
    } finally {
      setCouponBusy(false);
    }
  };

  const finish = (order) => {
    if (!buyNow) cart.resetLocal();
    navigate(`/order-success/${order._id}`, { replace: true });
  };

  const payOnline = async (order, payInfo) => {
    const ok = await loadRazorpay();
    if (!ok) {
      await orderApi.failed({ orderId: order._id }).catch(() => {});
      idem.current = newKey();
      throw Object.assign(new Error("sdk"), {
        userMessage:
          "Could not load the payment window. Check your connection and try again.",
      });
    }
    await new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: payInfo.keyId,
        amount: payInfo.amount,
        currency: payInfo.currency,
        order_id: payInfo.razorpayOrderId,
        name: "Omkari Fashions",
        description: `Order ${order.orderNumber}`,
        image: `${window.location.origin}/images/logo.png`,
        prefill: {
          name: address.name,
          email: user.email,
          contact: address.phone,
        },
        theme: { color: "#A84300" },
        handler: async (resp) => {
          try {
            const r = await orderApi.verify({ orderId: order._id, ...resp });
            resolve(r.order);
          } catch (e) {
            reject(e);
          }
        },
        modal: {
          ondismiss: async () => {
            await orderApi.failed({ orderId: order._id }).catch(() => {});
            idem.current = newKey();
            reject(
              Object.assign(new Error("dismissed"), {
                userMessage:
                  "Payment was cancelled. You have not been charged.",
              }),
            );
          },
        },
      });
      rzp.on("payment.failed", async (r) => {
        await orderApi.failed({ orderId: order._id }).catch(() => {});
        idem.current = newKey();
        reject(
          Object.assign(new Error("failed"), {
            userMessage:
              r?.error?.description || "Payment failed. Please try again.",
          }),
        );
      });
      rzp.open();
    }).then(finish);
  };

  const placeOrder = async () => {
    if (submitting.current) return; // hard guard against double clicks
    const errs = validateAddress(address);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Please fix the highlighted address fields");
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      const body = {
        shippingAddress: address,
        paymentMethod: payment,
        couponCode: coupon || "",
        idempotencyKey: idem.current,
        ...(buyNow ? { buyNowProduct: buyNow, buyNowQty: buyQty } : {}),
      };
      const r = await orderApi.create(body);
      if (saveAddr && !selectedSaved && (user.addresses?.length || 0) < 10) {
        authApi
          .addAddress(address)
          .then((u) => setUser(u.user))
          .catch(() => {});
      }
      if (payment === "cod") {
        toast.success("Order placed successfully");
        finish(r.order);
      } else if (r.order.paymentStatus === "paid") finish(r.order);
      else await payOnline(r.order, r.payment);
    } catch (e) {
      toast.error(e.userMessage || "Could not place your order");
      cart.refresh?.().catch(() => {});
      quote.refetch();
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  if (cart.loading || (buyNow && buyProduct.isLoading)) return <PageLoader />;
  if (items.length === 0)
    return (
      <EmptyState
        title="Nothing to checkout"
        message="Your cart is empty. Add some jewellery first."
        actionLabel="Continue Shopping"
        to="/products"
      />
    );

  return (
    <div className="container-x max-w-[1050px] px-4 py-6 sm:py-10">
      <Seo title="Checkout" path="/checkout" noindex />
      <h1 className="mb-6 text-center font-display text-2xl sm:text-[28px] font-bold text-brand-heading leading-tight">
        Checkout
      </h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_380px] lg:items-start">
        {/* Left Column: Form Controls */}
        <div className="space-y-6">
          {/* Shipping Address Card */}
          <section
            className="card p-4 sm:p-6 shadow-sm rounded-lg"
            aria-labelledby="ship-h"
          >
            <h2
              id="ship-h"
              className="mb-4 font-display text-lg sm:text-xl font-bold text-brand-heading border-b border-brand-brown/10 pb-2"
            >
              Shipping Address
            </h2>
            {user.addresses?.length > 0 && (
              <div className="mb-5">
                <label
                  htmlFor="saved"
                  className="label mb-1.5 block text-xs sm:text-sm font-semibold"
                >
                  Saved addresses
                </label>
                <select
                  id="saved"
                  value={selectedSaved}
                  onChange={(e) => pickSaved(e.target.value)}
                  className="input w-full transition duration-150"
                >
                  {user.addresses.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name} - {a.address.slice(0, 40)}, {a.city} {a.pincode}
                    </option>
                  ))}
                  <option value="">+ Use a new address</option>
                </select>
              </div>
            )}
            <AddressForm
              value={address}
              onChange={(v) => {
                setAddress(v);
                if (selectedSaved) setSelectedSaved("");
              }}
              errors={errors}
            />

            {!selectedSaved && (
              <label className="mt-4 flex items-center gap-2.5 text-xs sm:text-sm text-brand-text select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAddr}
                  onChange={(e) => setSaveAddr(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#A84300] focus:ring-1 focus:ring-[#A84300]"
                />
                Save this address for next time
              </label>
            )}
            <p className="mt-3 text-xs text-brand-muted">
              Order updates will be sent to{" "}
              <span className="font-medium text-brand-text">{user.email}</span>
            </p>
          </section>

          {/* Payment Method Card */}
          <section
            className="card p-4 sm:p-6 shadow-sm rounded-lg"
            aria-labelledby="pay-h"
          >
            <h2
              id="pay-h"
              className="mb-4 font-display text-lg sm:text-xl font-bold text-brand-heading border-b border-brand-brown/10 pb-2"
            >
              Payment Method
            </h2>
            <PaymentSelector
              value={payment}
              onChange={setPayment}
              codEnabled={quote.data?.codEnabled !== false}
            />
          </section>

          {/* Coupon Code Card */}
          <section
            className="card p-4 sm:p-6 shadow-sm rounded-lg"
            aria-labelledby="coupon-h"
          >
            <h2
              id="coupon-h"
              className="mb-3 font-display text-base sm:text-lg font-bold text-brand-heading"
            >
              Have a coupon?
            </h2>
            {coupon ? (
              <p className="flex items-center justify-between rounded-md bg-emerald-50 border border-emerald-200/60 px-3.5 py-2.5 text-xs sm:text-sm text-emerald-800">
                <span>
                  Coupon <b className="font-bold">{coupon}</b> applied
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCoupon("");
                    setCouponInput("");
                  }}
                  className="font-bold underline hover:text-emerald-900 transition"
                >
                  Remove
                </button>
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2.5">
                <label htmlFor="coupon" className="sr-only">
                  Coupon code
                </label>
                <input
                  id="coupon"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="input flex-1 !py-2.5 uppercase tracking-wide text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponBusy || !couponInput.trim()}
                  className="btn-outline h-[42px] px-6 text-xs sm:text-sm font-semibold whitespace-nowrap transition disabled:opacity-50"
                >
                  {couponBusy ? <LoadingSpinner size="sm" /> : "Apply"}
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Order Summary & Place Order Action */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <CartSummary
            items={items}
            quote={quote.data}
            loading={quote.isFetching}
            coupon={coupon}
          />

          {quote.isError && (
            <p
              role="alert"
              className="rounded-md bg-red-50 border border-red-200 p-3 text-xs sm:text-sm text-red-800"
            >
              {quote.error?.userMessage}
            </p>
          )}

          <button
            type="button"
            onClick={placeOrder}
            disabled={busy || quote.isError || quote.isLoading}
            className="btn-primary w-full h-12 sm:h-14 text-base sm:text-[18px] font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? (
              <>
                <LoadingSpinner
                  size="sm"
                  className="border-white border-t-transparent"
                />
                <span>Processing…</span>
              </>
            ) : payment === "cod" ? (
              `Place Order · ${rupee(quote.data?.total)}`
            ) : (
              `Pay ${rupee(quote.data?.total)}`
            )}
          </button>

          <p className="text-center text-[11px] sm:text-xs text-brand-muted px-2 leading-relaxed">
            By placing this order you agree to our{" "}
            <Link
              to="/terms-of-use"
              className="underline hover:text-brand-heading transition"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              to="/return-and-refund-policy"
              className="underline hover:text-brand-heading transition"
            >
              Return Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
