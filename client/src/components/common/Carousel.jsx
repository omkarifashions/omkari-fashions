import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "./Icons.jsx";

/** Scroll-snap carousel with arrows and dots. Children must be fixed-width flex items. */
export default function Carousel({
  children,
  className = "",
  showDots = true,
  arrows = true,
  dark = false,
  ariaLabel = "carousel",
}) {
  const ref = useRef(null);
  const [state, setState] = useState({
    pages: 1,
    page: 0,
    atStart: true,
    atEnd: true,
  });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    // Prevent invalid calculations when the carousel has no width yet
    if (el.clientWidth <= 0) return;

    const pages = Math.max(
      1,
      Math.ceil(el.scrollWidth / el.clientWidth - 0.05),
    );

    const page = Math.min(
      pages - 1,
      Math.round(el.scrollLeft / el.clientWidth),
    );

    setState({
      pages: Number.isFinite(pages) ? pages : 1,
      page: Number.isFinite(page) ? page : 0,
      atStart: el.scrollLeft <= 2,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, children]);

  const go = (dir) =>
    ref.current?.scrollBy({
      left: dir * ref.current.clientWidth * 0.85,
      behavior: "smooth",
    });
  const btn = `absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition disabled:opacity-0 sm:flex ${dark ? "bg-brand-orange text-white" : "bg-white/90 text-brand-brown hover:bg-white"}`;

  return (
    <div className={`relative ${className}`}>
      {arrows && (
        <>
          <button
            type="button"
            aria-label="Previous"
            disabled={state.atStart}
            onClick={() => go(-1)}
            className={`${btn} -left-3`}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next"
            disabled={state.atEnd}
            onClick={() => go(1)}
            className={`${btn} -right-3`}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
      <div
        ref={ref}
        onScroll={measure}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 sm:gap-4"
      >
        {children}
      </div>
      {showDots && state.pages > 1 && (
        <div className="mt-4 flex justify-center gap-1.5" aria-hidden="true">
          {Array.from({ length: state.pages }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === state.page ? "w-4 bg-brand-orange" : "w-1.5 bg-brand-muted/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
