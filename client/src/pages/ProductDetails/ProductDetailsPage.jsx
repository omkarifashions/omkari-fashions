import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "../../api/services.js";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import useRecentlyViewed from "../../hooks/useRecentlyViewed.js";
import Seo from "../../components/common/Seo.jsx";
import SafeImage from "../../components/common/SafeImage.jsx";
import Carousel from "../../components/common/Carousel.jsx";
import QuantitySelector from "../../components/common/QuantitySelector.jsx";
import ProductCard from "../../components/product/ProductCard.jsx";
import ReviewSection from "../../components/product/ReviewSection.jsx";
import WishlistButton from "../../components/product/WishlistButton.jsx";
import {
  Breadcrumb,
  EmptyState,
  ErrorState,
  LoadingSpinner,
  Skeleton,
} from "../../components/common/Feedback.jsx";
import { StarIcon } from "../../components/common/Icons.jsx";
import {
  discountPct,
  fmtDeliveryDate,
  imgUrl,
  rupee,
  siteUrl,
} from "../../utils/format.js";

const SWATCH = {
  pink: "#F4A6B8",
  red: "#E5322D",
  blue: "#15B5E8",
  magenta: "#F011A6",
  grey: "#8B9A94",
  green: "#66DB0A",
  gold: "#D4A017",
  white: "#FFFFFF",
  black: "#111111",
  maroon: "#7A1414",
  antique: "#A98252",
  silver: "#C4C7CB",
  orange: "#F28C28",
  yellow: "#F4D03F",
};

function Gallery({ product }) {
  const imgs = product.images?.length ? product.images : [{ url: "" }];
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [product._id]);
  return (
    <div>
      <div className="aspect-[1/1] overflow-hidden rounded-[2px] border border-[#B89B8C]/40 bg-white">
        <SafeImage
          src={imgUrl(imgs[i]?.url)}
          alt={`${product.name} - view ${i + 1}`}
          eager
          className="h-full w-full object-cover"
        />
      </div>
      <div
        className="mt-2.5 grid grid-cols-4 gap-2.5"
        role="tablist"
        aria-label="Product images"
      >
        {imgs.slice(0, 8).map((im, idx) => (
          <button
            key={idx}
            type="button"
            role="tab"
            aria-selected={idx === i}
            aria-label={`Show image ${idx + 1}`}
            onClick={() => setI(idx)}
            className={`aspect-square overflow-hidden rounded-[2px] border ${idx === i ? "border-[#9A3B00] ring-1 ring-[#9A3B00]" : "border-[#B89B8C]/50 hover:opacity-100 opacity-80"}`}
          >
            <SafeImage
              src={imgUrl(im.url)}
              alt=""
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function PincodeCheck({ deliveryDays }) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const check = async (e) => {
    e.preventDefault();
    if (!/^[1-9]\d{5}$/.test(pin))
      return setResult({ error: "Enter a valid 6 digit pincode" });
    setBusy(true);
    try {
      const r = await catalogApi.delivery(pin);
      setResult({ date: r.estimatedDate });
    } catch (err) {
      setResult({ error: err.userMessage });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <form
        onSubmit={check}
        className="mt-2 flex h-8 max-w-[340px] items-center overflow-hidden rounded-[2px] border border-[#B89B8C] bg-white"
        noValidate
      >
        <label htmlFor="pincode" className="sr-only">
          Pincode
        </label>
        <input
          id="pincode"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ""));
            setResult(null);
          }}
          placeholder="Enter Your Pincode"
          className="min-w-0 flex-1 bg-transparent px-3 text-[12px] text-stone-800 placeholder-stone-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="h-full border-l border-[#B89B8C] bg-white px-4 text-[11px] font-medium text-stone-800 hover:bg-stone-50"
        >
          {busy ? "…" : "Check"}
        </button>
      </form>
      {result?.error && (
        <p role="alert" className="mt-1 text-xs font-bold text-red-700">
          {result.error}
        </p>
      )}
      {result?.date && (
        <p className="mt-1 text-xs font-bold text-emerald-700">
          Delivery available - get it by {fmtDeliveryDate(result.date)}
        </p>
      )}
      {!result && deliveryDays && null}
    </div>
  );
}

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { add, busyId } = useCart();
  const recent = useRecentlyViewed();
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState(null);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => catalogApi.product(slug),
    retry: (n, e) => e.status !== 404 && n < 1,
  });
  const product = data?.product;
  const settingsQ = useQuery({
    queryKey: ["settings"],
    queryFn: catalogApi.settings,
  });
  const deliveryDays = settingsQ.data?.settings?.deliveryDays || 5;

  useEffect(() => {
    setQty(1);
    setColor(null);
  }, [slug]);
  useEffect(() => {
    if (product?._id) recent.push(product._id);
  }, [product?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const recentIds = recent.ids.filter((id) => id !== product?._id);
  const recentQ = useQuery({
    queryKey: ["recent", recentIds.join(",")],
    queryFn: () => catalogApi.byIds(recentIds),
    enabled: recentIds.length > 0,
  });

  const jsonLd = useMemo(() => {
    if (!product) return null;
    const url = `${siteUrl()}/products/${product.slug}`;
    return [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        sku: product.sku,
        image: (product.images || []).map((i) =>
          i.url.startsWith("http") ? i.url : `${siteUrl()}${imgUrl(i.url)}`,
        ),
        description: product.description?.slice(0, 500),
        brand: { "@type": "Brand", name: "Omkari Fashions" },
        url,
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          price: product.finalPrice,
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          url,
        },
        ...(product.ratingCount
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.ratingAvg,
                reviewCount: product.ratingCount,
              },
            }
          : {}),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { name: "Home", item: `${siteUrl()}/` },
          {
            name: product.category?.name,
            item: `${siteUrl()}/category/${product.category?.slug}`,
          },
          { name: product.name, item: url },
        ].map((x, i) => ({ "@type": "ListItem", position: i + 1, ...x })),
      },
    ];
  }, [product]);

  if (isLoading) {
    return (
      <div className="container-x grid gap-8 pt-10 md:grid-cols-[minmax(0,380px)_1fr]">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }
  if (isError) {
    return error?.status === 404 ? (
      <EmptyState
        title="Product not found"
        message="This product may have been removed or the link is incorrect."
        actionLabel="Continue shopping"
        to="/products"
      />
    ) : (
      <ErrorState message={error?.userMessage} onRetry={refetch} />
    );
  }

  const out = product.stock < 1;
  const pct = discountPct(product);
  const spec = product.specifications || {};
  const colors = product.colors?.length ? product.colors : [];
  const details = [
    ["Size (cm)", spec.size],
    ["Colour", spec.colour || product.colors?.join(", ")],
    ["Design No", spec.designNo],
    ["Base Metal", spec.baseMetal || product.metalType],
    ["Craftsmanship", product.craftsmanship],
    ["Occasion", product.occasion?.join(", ")],
    ["Stone Type", product.stoneType],
    ["SKU", product.sku],
  ];

  const buyNow = () => {
    if (!user) {
      toast.info("Please log in to place your order");
      return navigate("/login", {
        state: { from: `/checkout?buyNow=${product._id}&qty=${qty}` },
      });
    }
    return navigate(`/checkout?buyNow=${product._id}&qty=${qty}`);
  };

  return (
    <div className="bg-[#FDF8F3] min-h-screen text-[#3A2D28] pb-12">
      <Seo
        title={product.name}
        description={product.shortDescription || product.description}
        path={`/products/${product.slug}`}
        image={product.images?.[0]?.url}
        type="product"
        jsonLd={jsonLd}
      />

      <div className="container-x pt-4">
        <Breadcrumb
          items={[
            { label: "Home", to: "/" },
            {
              label: product.category?.name,
              to: `/category/${product.category?.slug}`,
            },
            { label: product.name },
          ]}
        />

        <div className="mt-4 grid gap-8 md:grid-cols-[minmax(0,360px)_1fr] lg:gap-12">
          {/* Left Column: Gallery, Color Swatches, Additional Info */}
          <div>
            <Gallery product={product} />

            {colors.length > 0 && (
              <div className="mt-5">
                <p className="text-[13px] font-[#3A2D28]">
                  Stone Color:{" "}
                  <span className="font-semibold">
                    {color || product.stoneColor || colors[0]}
                  </span>
                </p>
                <div
                  className="mt-2 flex flex-wrap gap-2"
                  role="radiogroup"
                  aria-label="Stone color"
                >
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={(color || colors[0]) === c}
                      aria-label={c}
                      title={c}
                      onClick={() => setColor(c)}
                      className={`h-4 w-4 rounded-full border border-black/20 ${(color || colors[0]) === c ? "ring-2 ring-[#9A3B00] ring-offset-1" : ""}`}
                      style={{ background: SWATCH[c.toLowerCase()] || "#ccc" }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 rounded-[2px] border border-[#B89B8C] bg-[#FAF3EC] p-3 text-[11px] leading-relaxed text-[#5C4D44]">
              <p className="mb-1 text-[12px] font-bold text-[#3A2D28]">
                Additional Information
              </p>
              <p>Country Of Origin: {spec.countryOfOrigin || "India"}</p>
              <p>
                Brand Owned And Marketed By:{" "}
                <span className="font-bold text-[#3A2D28]">
                  {spec.brand || "Omkari Fashions"}
                </span>
              </p>
            </div>
          </div>

          {/* Right Column: Title, Ratings, Pricing, Buy/Bag buttons, Specs */}
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-[13px]">
              <StarIcon size={14} className="fill-[#F5A623] text-[#F5A623]" />
              <span className="font-bold text-[#3A2D28]">
                {product.ratingAvg ? product.ratingAvg.toFixed(1) : "4.9"}
              </span>
              {product.ratingCount > 0 && (
                <a href="#reviews" className="text-xs text-[#7A6B63] underline">
                  ({product.ratingCount})
                </a>
              )}
            </div>

            <h1 className="mt-1 font-serif text-[22px] font-bold tracking-tight text-[#3A2D28] sm:text-[26px]">
              {product.name}
            </h1>

            <div className="mt-3">
              <span className="text-[11px] font-medium text-[#7A6B63]">
                MRP
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-[20px] font-bold text-[#3A2D28]">
                  {rupee(product.finalPrice)}
                </span>
                {pct > 0 && (
                  <>
                    <span className="text-[13px] text-[#7A6B63] line-through">
                      {rupee(product.price)}
                    </span>
                    <span className="text-[12px] font-bold text-emerald-700">
                      {pct}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-[#7A6B63]">(Incl. Of All Taxes)</p>
              {out ? (
                <p className="mt-1 text-xs font-bold text-red-700">
                  Currently out of stock
                </p>
              ) : (
                product.stock <= 5 && (
                  <p className="mt-1 text-xs font-bold text-amber-700">
                    Only {product.stock} left in stock
                  </p>
                )
              )}
            </div>

            {/* Quantity and Add to Bag Row */}
            <div className="mt-5 grid grid-cols-1 items-end gap-4 sm:grid-cols-[120px_1fr]">
              <div>
                <p className="mb-1 text-[11px] font-medium text-[#3A2D28]">
                  Quantity
                </p>
                <QuantitySelector
                  value={qty}
                  onChange={setQty}
                  max={Math.max(1, Math.min(product.stock, 10))}
                  disabled={out}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={out || busyId === product._id}
                  onClick={() => add(product, qty)}
                  className="flex h-10 flex-1 items-center justify-center rounded-[2px] bg-[#9A3B00] text-[15px] font-bold text-white shadow-sm transition hover:bg-[#833200] disabled:opacity-60"
                >
                  {busyId === product._id ? (
                    <LoadingSpinner
                      size="sm"
                      className="border-white border-t-transparent"
                    />
                  ) : out ? (
                    "Out of Stock"
                  ) : (
                    "Add To Bag"
                  )}
                </button>
                <button
                  type="button"
                  disabled={out}
                  onClick={buyNow}
                  className="h-10 rounded-[2px] border border-[#9A3B00] px-4 text-[13px] font-bold text-[#9A3B00] hover:bg-[#9A3B00] hover:text-white disabled:opacity-50"
                >
                  Buy Now
                </button>
                <WishlistButton
                  product={product}
                  size={20}
                  className="h-10 w-10 shrink-0 border border-[#B89B8C] bg-white"
                />
              </div>
            </div>

            <div className="mt-6 border-t border-[#E8DDD5] pt-4">
              <h2 className="text-[12px] font-bold text-[#3A2D28]">
                Delivery &amp; Shipping
              </h2>
              <p className="mt-1 text-[11px] text-[#5C4D44]">
                Order Now &amp; Get It By{" "}
                <span className="font-bold text-[#1E5B94]">
                  {fmtDeliveryDate(new Date(Date.now() + deliveryDays * 864e5))}
                </span>
              </p>
              <PincodeCheck deliveryDays={deliveryDays} />
              <p className="mt-2 text-[10px] text-[#7A6B63]">
                {product.isReturnable
                  ? `Easy returns within ${data.returnWindowDays} days of delivery.`
                  : "This product is non-returnable."}{" "}
                Free shipping on orders above{" "}
                {rupee(settingsQ.data?.settings?.freeShippingAbove ?? 2000)}.
              </p>
            </div>

            <div className="mt-6 border-t border-[#E8DDD5] pt-4">
              <h2 className="text-[12px] font-bold text-[#3A2D28]">
                Product Description
              </h2>
              <p className="mt-1 text-[11px] font-bold text-[#3A2D28]">
                {product.shortDescription ||
                  `Omkari Fashions Jewellery ${product.name}`}
              </p>
              <p className="mt-1 whitespace-pre-line text-[11px] leading-[1.6] text-[#5C4D44]">
                {product.description}
              </p>

              <dl className="mt-4 space-y-0.5 text-[11px]">
                {details
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="w-24 text-[#7A6B63]">{k}:</dt>
                      <dd className="font-medium text-[#3A2D28]">{v}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Similar Styles Section */}
      {data.related?.length > 0 && (
        <section className="container-x pt-12" aria-label="Similar styles">
          <div className="mb-4 flex items-center justify-center gap-4">
            <span className="h-px flex-1 bg-[#B89B8C]/40" aria-hidden="true" />
            <h2 className="font-serif text-[18px] font-bold text-[#3A2D28]">
              Shop Similar Styles
            </h2>
            <span className="h-px flex-1 bg-[#B89B8C]/40" aria-hidden="true" />
          </div>
          <Carousel ariaLabel="Similar products">
            {data.related.map((p) => (
              <div
                key={p._id}
                className="w-[42%] shrink-0 snap-start sm:w-[22%] lg:w-[15.5%]"
              >
                <ProductCard product={p} showCart={false} />
              </div>
            ))}
          </Carousel>
        </section>
      )}

      {/* Recently Viewed Section */}
      {recentQ.data?.products?.length > 0 && (
        <section className="container-x pt-10" aria-label="Recently viewed">
          <div className="mb-4 flex items-center justify-center gap-4">
            <span className="h-px flex-1 bg-[#B89B8C]/40" aria-hidden="true" />
            <h2 className="font-serif text-[18px] font-bold text-[#3A2D28]">
              {user
                ? `${user.name.split(" ")[0]}, You Recently Viewed`
                : "You Recently Viewed"}
            </h2>
            <span className="h-px flex-1 bg-[#B89B8C]/40" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {recentQ.data.products.map((p) => (
              <ProductCard key={p._id} product={p} showCart={false} />
            ))}
          </div>
        </section>
      )}

      <ReviewSection product={product} />
      <p className="mt-6 text-center text-xs text-[#7A6B63]">
        <Link
          to={`/category/${product.category?.slug}`}
          className="underline hover:text-[#3A2D28]"
        >
          More from {product.category?.name}
        </Link>
      </p>
    </div>
  );
}
