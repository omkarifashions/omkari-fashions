import { useEffect, useState, useRef } from "react";
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
    <div className="mb-6 text-center">
      <div className="flex items-center justify-center gap-3 sm:gap-5">
        <span className="h-[1px] w-24 bg-gradient-to-r from-transparent to-[#8a533c] opacity-60 sm:w-40 lg:w-60" />
        <Tag className="font-serif text-[22px] font-bold text-[#3e160a] sm:text-[28px]">
          {title}
        </Tag>
        <span className="h-[1px] w-24 bg-gradient-to-l from-transparent to-[#8a533c] opacity-60 sm:w-40 lg:w-60" />
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
  const [activeIndex, setActiveIndex] = useState(1);
  const scrollRef = useRef(null);

  if (!items?.length) return null;

  const handlePrev = () => {
    const nextIdx = activeIndex > 0 ? activeIndex - 1 : items.length - 1;
    setActiveIndex(nextIdx);
    scrollToCard(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = activeIndex < items.length - 1 ? activeIndex + 1 : 0;
    setActiveIndex(nextIdx);
    scrollToCard(nextIdx);
  };

  const handleDotClick = (index) => {
    setActiveIndex(index);
    scrollToCard(index);
  };

  const scrollToCard = (index) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cardWidth = container.children[0]?.offsetWidth || 0;
    const gap = 20;
    container.scrollTo({
      left: index * (cardWidth + gap),
      behavior: "smooth",
    });
  };

  return (
    <section
      className="bg-[#faf1e8] py-10 sm:py-14"
      aria-label="Customer testimonials"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
        <SectionHeading title="Customer Testimonials" />

        <div className="relative mt-8 flex items-center justify-center">
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous testimonial"
            className="absolute left-0 z-10 flex h-8 w-8 -translate-x-2 items-center justify-center rounded-full bg-[#7a2c0d] text-white shadow transition-all hover:bg-[#5f2108] sm:left-2 sm:h-9 sm:w-9 sm:translate-x-0"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Testimonial Cards Carousel Container */}
          <div
            ref={scrollRef}
            className="no-scrollbar flex w-full items-stretch justify-start gap-5 overflow-x-auto scroll-smooth px-8 py-2 sm:px-12"
          >
            {items.map((t) => (
              <figure
                key={t._id}
                className="flex w-[85%] shrink-0 flex-col items-center justify-between rounded-[8px] bg-white px-6 py-6 text-center shadow-sm sm:w-[48%] lg:w-[31.5%]"
              >
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 overflow-hidden rounded-full sm:h-20 sm:w-20">
                    <SafeImage
                      src={imgUrl(t.image)}
                      alt={t.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <h3 className="mt-4 font-serif text-[16px] font-bold text-[#2a1309] sm:text-[17px]">
                    {t.heading || "Loved it..!"}
                  </h3>

                  <blockquote className="mt-2 text-[12px] leading-relaxed text-[#555555] sm:text-[13px]">
                    “{t.message}”
                  </blockquote>
                </div>

                <div className="mt-4 flex flex-col items-center gap-1.5">
                  <RatingStars value={t.rating || 5} size={15} />

                  <figcaption className="text-[12px] font-semibold text-[#a8583d] sm:text-[13px]">
                    - {t.name}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next testimonial"
            className="absolute right-0 z-10 flex h-8 w-8 translate-x-2 items-center justify-center rounded-full bg-[#7a2c0d] text-white shadow transition-all hover:bg-[#5f2108] sm:right-2 sm:h-9 sm:w-9 sm:translate-x-0"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Bottom Navigation Dots */}
        <div className="mt-6 flex justify-center gap-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleDotClick(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                idx === activeIndex
                  ? "w-2.5 border border-[#8a4227] bg-[#f2cca6]"
                  : "w-2.5 bg-[#2b2b2b]"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

const SLOTS = [
  "left-[14%] top-[20%] w-[18%] z-[2] -rotate-1",
  "left-[30%] top-[2%] w-[13.5%] z-[1]",
  "left-[41%] top-[17%] w-[16.5%] z-[4]",
  "left-[56%] top-[4%] w-[14%] z-[1]",
  "left-[63.5%] top-[30%] w-[16%] z-[2]",
];

export function BestSellers({ page }) {
  const items = page?.items?.filter((i) => i.image) || [];
  if (!items.length) return null;

  return (
    <section
      className="relative mt-12 bg-gradient-to-b from-[#f2dac8] via-[#ebd2bf] to-[#e5c9b3] pt-10 sm:mt-16 sm:pt-14"
      aria-label="Best sellers"
    >
      <div className="relative mx-auto hidden h-[520px] w-full max-w-[1280px] sm:block">
        <div
          className="pointer-events-none absolute left-[10%] top-[18%] h-[280px] w-[20%] border border-[#c4a48b]/50"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-[15%] top-[28%] h-[260px] w-[18%] border border-[#c4a48b]/50"
          aria-hidden="true"
        />

        {items.slice(0, 5).map((it, i) => (
          <SafeImage
            key={i}
            src={imgUrl(it.image)}
            alt="Best selling Omkari Fashions jewellery"
            className={`absolute aspect-[3/4] border-[4px] border-white bg-white object-cover shadow-xl transition-transform duration-300 hover:scale-105 ${SLOTS[i]}`}
          />
        ))}
      </div>

      <div className="relative p-4 sm:hidden">
        <div className="grid grid-cols-3 gap-2 pb-10">
          {items.slice(0, 3).map((it, i) => (
            <SafeImage
              key={i}
              src={imgUrl(it.image)}
              alt="Best selling Omkari Fashions jewellery"
              className="aspect-[3/4] w-full border-2 border-white object-cover shadow-md"
            />
          ))}
        </div>
      </div>

      <div className="relative z-20 mt-4 bg-white py-4 sm:mt-0 sm:py-6">
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 sm:-top-8">
          <Link
            to="/products?bestseller=true"
            className="
              inline-block
              rounded-[4px]
              bg-gradient-to-b from-[#b84400] via-[#631e00] to-[#3a0d00]
              px-8
              py-2.5
              font-serif
              text-[15px]
              font-bold
              uppercase
              tracking-[0.2em]
              text-[#ffffff]
              shadow-md
              transition-all
              hover:brightness-110
              sm:px-12
              sm:py-3
              sm:text-[18px]
            "
          >
            BEST SELLERS
          </Link>
        </div>
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

          <div className="mt-6 flex items-center justify-between gap-5 border-t border-brand-brown/10 pt-3">
            <Link
              to="/about"
              className="btn-primary shrink-0 !px-7 !py-3 text-[13px] font-bold uppercase tracking-wide sm:!px-8"
            >
              Know more about us
            </Link>

            {badge && (
              <div className="flex items-center gap-2.5 text-brand-text">
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
