import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Carousel from "../common/Carousel.jsx";
import SafeImage from "../common/SafeImage.jsx";
import ProductCard, { Ribbon } from "../product/ProductCard.jsx";
import WishlistButton from "../product/WishlistButton.jsx";
import { ArrowRight } from "../common/Icons.jsx";
import { RatingStars } from "../common/Feedback.jsx";
import { imgUrl, productImage, rupee } from "../../utils/format.js";

export function SectionHeading({ title, subtitle, as: Tag = "h2" }) {
  return (
    <div className="mb-5 text-center">
      <div className="flex items-center gap-3 sm:gap-5">
        <span className="h-px flex-1 bg-rule" aria-hidden="true" />
        <Tag className="font-display text-[20px] font-bold tracking-wide text-brand-heading sm:text-[26px]">
          {title}
        </Tag>
        <span className="h-px flex-1 bg-rule" aria-hidden="true" />
      </div>
      {subtitle && (
        <p className="mt-1 text-[11px] text-brand-text sm:text-[12px]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function ExploreButton({ to }) {
  return (
    <div className="mt-5 flex justify-center">
      <Link
        to={to}
        className="inline-flex h-[34px] min-w-[136px] items-center justify-center gap-2 rounded-[3px] bg-btn px-5 text-[13px] font-bold uppercase tracking-wide text-white shadow transition hover:brightness-110"
      >
        Explore <ArrowRight size={18} />
      </Link>
    </div>
  );
}

export function CategoryCircles({ items }) {
  if (!items?.length) return null;

  return (
    <nav
      aria-label="Shop by category"
      className="w-full overflow-hidden pt-10 sm:pt-12"
    >
      {/* Mobile horizontal scroller */}
      <div
        className="
          w-full
          max-w-full
          overflow-x-auto
          overflow-y-hidden
          overscroll-x-contain
          touch-pan-x
          no-scrollbar
          sm:overflow-visible
        "
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorX: "contain",
        }}
      >
        <ul
          className="
            flex
            w-max
            items-start
            justify-start
            gap-5
            px-5
            pb-4

            sm:w-full
            sm:justify-center
            sm:gap-12
            sm:px-0
          "
        >
          {items.map((c) => (
            <li key={c._id} className="w-[72px] shrink-0 sm:w-[165px]">
              <Link
                to={
                  c.slug === "new-arrivals"
                    ? "/new-arrivals"
                    : `/category/${c.slug}`
                }
                className="group flex w-full flex-col items-center"
              >
                {/* Circle */}
                <span
                  className="
                    block
                    h-[66px]
                    w-[66px]
                    shrink-0
                    overflow-hidden
                    rounded-full
                    border-[2px]
                    border-brand-brown/80
                    bg-brand-brown
                    shadow-md
                    transition-all
                    duration-300
                    group-hover:-translate-y-1
                    group-hover:shadow-xl

                    sm:h-[150px]
                    sm:w-[150px]
                    sm:border-[3px]
                  "
                >
                  <SafeImage
                    src={imgUrl(c.image)}
                    alt={c.name}
                    className="
                      h-full
                      w-full
                      object-cover
                      transition-transform
                      duration-500
                      group-hover:scale-110
                    "
                  />
                </span>

                {/* Category name */}
                <span
                  className="
                    mt-2
                    w-[72px]
                    text-center
                    text-[11px]
                    font-medium
                    leading-[1.15]
                    text-brand-ink

                    sm:mt-4
                    sm:w-[165px]
                    sm:text-[15px]
                  "
                >
                  {c.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function BannerCarousel({ banners }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!banners || banners.length < 2) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % banners.length), 5500);
    return () => clearInterval(t);
  }, [banners]);
  if (!banners?.length) return null;
  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collections"
      className="mt-4 sm:mt-6"
    >
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${i * 100}%)` }}
        >
          {banners.map((b, idx) => (
            <Link
              key={b._id}
              to={b.buttonUrl || "/products"}
              aria-label={`${b.title} - ${b.buttonText || "Shop Now"}`}
              tabIndex={idx === i ? 0 : -1}
              className="relative block w-full shrink-0"
              aria-hidden={idx !== i}
            >
              <picture>
                {b.mobileImage && (
                  <source
                    media="(max-width: 639px)"
                    srcSet={imgUrl(b.mobileImage)}
                  />
                )}
                <img
                  src={imgUrl(b.image)}
                  alt={b.title}
                  loading={idx === 0 ? "eager" : "lazy"}
                  fetchpriority={idx === 0 ? "high" : undefined}
                  className="aspect-[900/720] w-full object-cover sm:aspect-[3/1] xl:aspect-[2000/667]"
                />
              </picture>
              {b.showText !== false && (
                <span className="absolute inset-0 flex flex-col items-start justify-center bg-gradient-to-r from-black/55 via-black/10 to-transparent px-6 sm:px-14">
                  <span className="max-w-[70%] font-display text-2xl font-bold text-[#ffd9b8] drop-shadow sm:text-5xl">
                    {b.title}
                  </span>
                  {b.subtitle && (
                    <span className="mt-1 max-w-[70%] text-sm text-white sm:text-lg">
                      {b.subtitle}
                    </span>
                  )}
                  <span className="mt-3 inline-flex items-center gap-2 rounded-[4px] border border-[#e09a68] bg-btn px-5 py-2 text-sm font-bold text-white sm:mt-5 sm:px-8 sm:py-3">
                    {b.buttonText || "Shop Now"} <ArrowRight size={18} />
                  </span>
                </span>
              )}
            </Link>
          ))}
        </div>
        {banners.length > 1 && (
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {banners.map((b, idx) => (
              <button
                key={b._id}
                type="button"
                aria-label={`Show banner ${idx + 1}`}
                aria-current={idx === i}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function NewArrivals({ products }) {
  if (!products?.length) return null;
  const tile = (p, extra = "") => (
    <Link
      key={p._id}
      to={`/products/${p.slug}`}
      className={`group relative block overflow-hidden rounded-[6px] bg-brand-brown/10 ${extra}`}
      aria-label={p.name}
    >
      <SafeImage
        src={productImage(p)}
        alt={`${p.name} - Omkari Fashions`}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-[12px] text-white sm:p-3 sm:text-sm">
        {p.name}
        <br />
        <b>{rupee(p.finalPrice)}</b>
      </span>
    </Link>
  );
  const [first, ...rest] = products;
  return (
    <section className="container-x pt-10 sm:pt-12" aria-label="New arrivals">
      <SectionHeading
        title="New Arrivals"
        subtitle="Finding eternal beauty in every priceless stone"
      />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[1.05fr_1fr_1fr] sm:gap-3.5">
        {tile(
          first,
          "col-span-2 aspect-[4/3] sm:col-span-1 sm:row-span-2 sm:aspect-auto sm:min-h-[430px]",
        )}
        {rest
          .slice(0, 4)
          .map((p) => tile(p, "aspect-square sm:aspect-auto sm:min-h-[205px]"))}
      </div>
      <ExploreButton to="/new-arrivals" />
    </section>
  );
}

export function ProductRow({ category, products }) {
  if (!products?.length) return null;
  return (
    <section
      className="container-x pt-10 sm:pt-12"
      aria-label={category.homeTitle || category.name}
    >
      <SectionHeading
        title={category.homeTitle || category.name}
        subtitle={category.homeSubtitle}
      />
      <Carousel ariaLabel={`${category.name} products`}>
        {products.map((p) => (
          <div
            key={p._id}
            className="w-[46%] shrink-0 snap-start sm:w-[23.5%] lg:w-[18.6%]"
          >
            <ProductCard product={p} showCart={false} />
          </div>
        ))}
      </Carousel>
      <ExploreButton to={`/category/${category.slug}`} />
    </section>
  );
}

export function FaqCarousel({ faqs }) {
  if (!faqs?.length) return null;
  return (
    <section
      className="container-x pt-12 sm:pt-14"
      aria-label="Frequently asked questions"
    >
      <SectionHeading title="Frequently Answered Questions" />
      <Carousel ariaLabel="FAQs">
        {faqs.map((f) => (
          <article
            key={f._id}
            className="flex min-h-[150px] w-[88%] shrink-0 snap-start flex-col justify-center rounded-[6px] bg-[#DADADA]/60 p-5 sm:w-[48.5%] lg:w-[32%]"
          >
            <h3 className="font-sans text-[15px] font-black text-brand-heading">
              {f.question}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-brand-text">
              {f.answer}
            </p>
          </article>
        ))}
      </Carousel>
      <p className="mt-3 text-center">
        <Link
          to="/faq"
          className="text-sm font-bold text-brand-orange underline"
        >
          View all FAQs
        </Link>
      </p>
    </section>
  );
}

export function WalkIn({ page }) {
  if (!page?.items?.length) return null;
  return (
    <section className="container-x pt-10 sm:pt-12" aria-label={page.title}>
      <SectionHeading title={page.title} />
      <Carousel ariaLabel="Walk-in customer experiences">
        {page.items.map((it, i) => (
          <figure
            key={i}
            className="relative h-[130px] w-[46%] shrink-0 snap-start overflow-hidden rounded-[6px] bg-[#DADADA]/60 sm:h-[150px] sm:w-[23.5%]"
          >
            {it.image && (
              <SafeImage
                src={imgUrl(it.image)}
                alt={it.title || "Walk-in customer"}
                className="h-full w-full object-cover"
              />
            )}
            {it.title && (
              <figcaption className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1 text-[11px] text-white">
                {it.title}
              </figcaption>
            )}
          </figure>
        ))}
      </Carousel>
    </section>
  );
}

export function Testimonials({ items }) {
  if (!items?.length) return null;
  return (
    <section
      className="container-x pt-10 sm:pt-12"
      aria-label="Customer testimonials"
    >
      <SectionHeading title="Customer Testimonials" />
      <Carousel ariaLabel="Customer testimonials" dark>
        {items.map((t) => (
          <figure
            key={t._id}
            className="flex w-[88%] shrink-0 snap-start flex-col items-center rounded-[4px] bg-white px-5 py-4 text-center shadow-card sm:w-[48.5%] lg:w-[32%]"
          >
            <SafeImage
              src={imgUrl(t.image)}
              alt={t.name}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-gold/40"
            />
            <p className="mt-2 text-[13px] font-black">
              {t.heading || "Loved it..!"}
            </p>
            <RatingStars value={t.rating} size={12} />
            <blockquote className="mt-1.5 text-[12px] leading-snug text-brand-text">
              “{t.message}”
            </blockquote>
            <figcaption className="mt-2 text-[11px] font-bold text-brand-orange">
              - {t.name}
            </figcaption>
          </figure>
        ))}
      </Carousel>
    </section>
  );
}

const SLOTS = [
  "left-[2%] top-[16%] w-[24%] -rotate-2",
  "left-[27%] top-[0%] w-[17%] rotate-1",
  "left-[45%] top-[8%] w-[15%] -rotate-1",
  "left-[61%] top-[2%] w-[15%] rotate-2",
  "left-[77%] top-[12%] w-[21%] -rotate-1",
];

export function BestSellers({ page }) {
  const items = page?.items?.filter((i) => i.image) || [];
  if (!items.length) return null;
  return (
    <section
      className="relative mt-12 overflow-hidden bg-gradient-to-b from-[#f4dcc9] to-[#eac9b1] sm:mt-14"
      aria-label="Best sellers"
    >
      <div className="relative mx-auto hidden h-[400px] max-w-[1180px] sm:block">
        {items.slice(0, 5).map((it, i) => (
          <SafeImage
            key={i}
            src={imgUrl(it.image)}
            alt="Best selling Omkari Fashions jewellery"
            className={`absolute aspect-[3/4] border-[5px] border-white object-cover shadow-xl ${SLOTS[i]}`}
          />
        ))}
        <Link
          to="/products?bestseller=true"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-[3px] bg-btn px-9 py-2 font-display text-lg font-bold uppercase tracking-wider text-white shadow-lg ring-2 ring-white/60"
        >
          Best Sellers
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2 p-4 sm:hidden">
        {items.slice(0, 3).map((it, i) => (
          <SafeImage
            key={i}
            src={imgUrl(it.image)}
            alt="Best selling Omkari Fashions jewellery"
            className="aspect-[3/4] w-full border-4 border-white object-cover shadow"
          />
        ))}
        <Link
          to="/products?bestseller=true"
          className="col-span-3 mt-2 rounded-[3px] bg-btn py-2.5 text-center font-display font-bold uppercase tracking-wider text-white"
        >
          Best Sellers
        </Link>
      </div>
    </section>
  );
}
export function AboutBlock({ page }) {
  if (!page) return null;

  const [headline, badge] = page.items || [];

  return (
    <section
      className="container-x pt-10 sm:pt-12"
      aria-label="About Omkari Fashions"
    >
      <SectionHeading title={page.title} />

      <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
        {/* LEFT CONTENT */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[.35em] text-brand-text">
            {page.subtitle}
          </p>

          <h3 className="font-display text-[26px] font-bold leading-[1.25] text-brand-heading sm:text-[32px]">
            {headline?.title}
          </h3>

          <p className="mt-4 max-w-[650px] text-[14px] leading-[1.7] text-brand-text sm:text-[15px]">
            {page.content}
          </p>

          {/* BUTTON + HANDCRAFTED BADGE */}
          <div className="mt-6 flex items-center justify-between gap-5 border-t border-brand-brown/10 pt-3">
            <Link
              to="/about"
              className="btn-primary shrink-0 !px-7 !py-3 text-[13px] font-bold uppercase tracking-wide sm:!px-8"
            >
              Know more about us
            </Link>

            {badge && (
              <div className="flex items-center gap-2.5 text-brand-text">
                {/* Shield / handcrafted icon */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3l7 3v5c0 4.7-2.9 8.4-7 10-4.1-1.6-7-5.3-7-10V6l7-3z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>

                <div className="whitespace-nowrap">
                  <b className="block text-[10px] font-bold uppercase tracking-wide text-brand-ink sm:text-[11px]">
                    {badge.title || "100% Handcrafted"}
                  </b>

                  <span className="block text-[8px] leading-tight text-brand-muted sm:text-[9px]">
                    {badge.text ||
                      "With Exceptional Craftsmanship & Finest Gold"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div className="relative overflow-hidden rounded-[6px] border border-brand-brown/30 bg-brand-brown/10">
          <SafeImage
            src={imgUrl(page.image)}
            alt="Statement Chandbali earrings by Omkari Fashions"
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
