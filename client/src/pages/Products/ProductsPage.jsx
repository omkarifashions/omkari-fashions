import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "../../api/services.js";
import Seo from "../../components/common/Seo.jsx";
import ProductGrid from "../../components/product/ProductGrid.jsx";
import FilterSidebar, {
  FILTER_KEYS,
  countApplied,
} from "../../components/product/FilterSidebar.jsx";
import {
  EmptyState,
  ErrorState,
  Pagination,
} from "../../components/common/Feedback.jsx";
import {
  ChevronDown,
  ChevronRight,
  CloseIcon,
  FilterIcon,
  SortIcon,
} from "../../components/common/Icons.jsx";

const SORTS = [
  ["best_selling", "Best Selling"],
  ["newest", "Newest First"],
  ["price_asc", "Price: Low to High"],
  ["price_desc", "Price: High to Low"],
  ["name_asc", "Name: A to Z"],
];
const MULTI = [
  "category",
  "subcategory",
  "craftsmanship",
  "occasion",
  "colors",
  "metalType",
  "stoneType",
];

function TitleRule({ children }) {
  return (
    <div className="mb-6 flex items-center gap-3 sm:gap-5">
      <span className="h-px flex-1 bg-rule" aria-hidden="true" />
      <h1 className="text-center font-display text-[22px] font-bold tracking-wide text-brand-heading sm:text-[28px]">
        {children}
      </h1>
      <span className="h-px flex-1 bg-rule" aria-hidden="true" />
    </div>
  );
}

export default function ProductsPage({ mode = "all" }) {
  const { slug } = useParams();
  const location = useLocation();
  const [sp, setSp] = useSearchParams();
  const [showFilters, setShowFilters] = useState(true);
  const [drawer, setDrawer] = useState(false);
  useEffect(() => {
    if (drawer) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  const page = Math.max(1, Number(sp.get("page")) || 1);
  const sort = sp.get("sort") || "best_selling";
  const q = mode === "search" ? sp.get("q") || "" : "";

  const applied = useMemo(() => {
    const a = {};
    MULTI.forEach((k) => {
      a[k] = sp.get(k) ? sp.get(k).split(",") : [];
    });
    a.minPrice = sp.get("minPrice") || "";
    a.maxPrice = sp.get("maxPrice") || "";
    a.includeOutOfStock = sp.get("includeOutOfStock") === "true";
    return a;
  }, [sp]);
  const appliedCount = countApplied(applied);

  const base = useMemo(() => {
    const b = {};
    if (mode === "category") b.category = slug;
    if (mode === "collection") b.collection = slug;
    if (mode === "new") b.newArrival = "true";
    if (mode === "search") b.q = q;
    if (mode === "all" && sp.get("bestseller") === "true")
      b.bestseller = "true";
    return b;
  }, [mode, slug, q, sp]);

  const query = useMemo(() => {
    const p = { ...base, page, limit: 20, sort };
    MULTI.forEach((k) => {
      if (applied[k].length) p[k] = applied[k].join(",");
    });
    if (mode === "category") p.category = slug; // route category always wins
    if (applied.minPrice) p.minPrice = applied.minPrice;
    if (applied.maxPrice) p.maxPrice = applied.maxPrice;
    if (applied.includeOutOfStock) p.includeOutOfStock = "true";
    return p;
  }, [base, page, sort, applied, mode, slug]);

  const products = useQuery({
    queryKey: ["products", query],
    queryFn: () => catalogApi.products(query),
    keepPreviousData: true,
    placeholderData: (prev) => prev,
  });
  const facets = useQuery({
    queryKey: ["filters", base],
    queryFn: () => catalogApi.filters(base),
    staleTime: 120_000,
  });
  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: catalogApi.categories,
    staleTime: 300_000,
  });
  const col = useQuery({
    queryKey: ["collection", slug],
    queryFn: () => catalogApi.collection(slug),
    enabled: mode === "collection",
  });

  const category =
    mode === "category"
      ? (cats.data?.items || []).find((c) => c.slug === slug)
      : null;
  const titles = {
    category: category
      ? `${category.name} Designs & Sets`
      : "Jewellery Designs & Sets",
    collection: col.data?.collection?.title || "Collection",
    new: "New Arrivals",
    search: q ? `Search results for “${q}”` : "Search",
    all: sp.get("bestseller") === "true" ? "Best Sellers" : "All Jewellery",
  };
  const title = titles[mode];

  const update = (patch, resetPage = true) => {
    const next = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => {
      if (
        v === "" ||
        v === undefined ||
        v === null ||
        (Array.isArray(v) && !v.length) ||
        v === false
      )
        next.delete(k);
      else next.set(k, Array.isArray(v) ? v.join(",") : String(v));
    });
    if (resetPage) next.delete("page");
    setSp(next);
  };
  const onApply = (d) =>
    update({
      ...Object.fromEntries(FILTER_KEYS.map((k) => [k, d[k]])),
      includeOutOfStock: d.includeOutOfStock ? "true" : "",
    });
  const onClear = () =>
    update(Object.fromEntries(FILTER_KEYS.map((k) => [k, ""])));

  const data = products.data;
  const total = data?.total ?? 0;
  const subTabs = facets.data?.filters?.subcategory || [];
  const activeSub =
    applied.subcategory.length === 1 ? applied.subcategory[0] : null;
  const subCount = subTabs.reduce((n, s) => n + s.count, 0);

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${window.location.origin}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: title,
          item: window.location.href,
        },
      ],
    }),
    [title],
  );

  const sidebar = (onDone) => (
    <FilterSidebar
      facets={facets.data?.filters}
      applied={applied}
      onApply={onApply}
      onClear={onClear}
      hideKeys={mode === "category" ? ["category"] : []}
      onDone={onDone}
    />
  );

  return (
    <div className="container-x pt-8 sm:pt-10">
      <Seo
        title={title.replace(/[“”]/g, '"')}
        description={
          category?.description ||
          `Shop ${title} at Omkari Fashions - premium traditional Indian jewellery.`
        }
        path={location.pathname + (mode === "search" ? location.search : "")}
        noindex={mode === "search"}
        jsonLd={jsonLd}
      />
      <TitleRule>{title}</TitleRule>

      <div className="mb-5">
        <div className="grid grid-cols-2 items-center gap-3 lg:grid-cols-[240px_1fr_auto]">
          {/* Filter */}
          <div>
            {/* Desktop Filter */}
            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              className="hidden h-10 w-full items-center gap-2 text-left lg:flex"
              aria-expanded={showFilters}
            >
              <FilterIcon size={20} />

              <span className="text-[17px] text-brand-ink">
                Filter
                <span className="ml-1 text-[13px] text-brand-muted">
                  {appliedCount} Applied
                </span>
              </span>

              <ChevronRight
                size={17}
                className={`ml-auto transition-transform duration-200 ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Mobile Filter */}
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="
          flex h-10 w-full
          items-center justify-center gap-2
          rounded-[4px]
          border border-brand-orange
          bg-transparent
          px-3
          text-[14px]
          font-semibold
          text-brand-orange
          transition
          hover:bg-brand-orange
          hover:text-white
          lg:hidden
        "
            >
              <FilterIcon size={17} />
              <span>Filter</span>

              <span className="text-[12px] font-normal text-brand-muted">
                {appliedCount} Applied
              </span>
            </button>
          </div>

          {/* Product Count - Desktop only */}
          <p
            className="
        hidden
        text-[15px]
        text-brand-ink
        lg:block
      "
            aria-live="polite"
          >
            ({total.toLocaleString("en-IN")} Products Found)
          </p>

          {/* Sort */}
          <div
            className="
        col-span-1
        flex
        justify-end
        lg:col-span-1
      "
          >
            <div className="flex w-full items-center justify-end gap-2">
              {/* Desktop Sort Label */}
              <label
                htmlFor="sort"
                className="
            hidden
            items-center
            gap-1.5
            text-[14px]
            text-brand-ink
            sm:flex
          "
              >
                <SortIcon size={17} />
                <span>Sort By</span>
              </label>

              <div className="relative w-full sm:w-auto">
                <select
                  id="sort"
                  value={sort}
                  onChange={(e) =>
                    update({
                      sort:
                        e.target.value === "best_selling" ? "" : e.target.value,
                    })
                  }
                  className="
              h-10
              w-full
              cursor-pointer
              appearance-none
              rounded-[4px]
              border
              border-[#b9a69a]
              bg-white
              py-1
              pl-3
              pr-9
              text-[14px]
              text-brand-ink
              outline-none
              transition
              focus:border-brand-orange
              focus:ring-1
              focus:ring-brand-orange/30
              sm:w-[210px]
            "
                >
                  {SORTS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={16}
                  className="
              pointer-events-none
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              text-brand-ink
            "
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-5">
        {showFilters && (
          <aside
            aria-label="Filters"
            className="sticky top-3 hidden h-[calc(100vh-40px)] max-h-[640px] w-[240px] shrink-0 self-start lg:block"
          >
            {sidebar()}
          </aside>
        )}

        <section className="min-w-0 flex-1">
          {subTabs.length > 0 && (
            <div
              className="mb-4 overflow-x-auto bg-[#EFE1D7] no-scrollbar"
              role="tablist"
              aria-label="Sub categories"
            >
              <div className="flex min-w-max border-b border-[#d8c4b6] px-1 pt-1.5">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!applied.subcategory.length}
                  onClick={() => update({ subcategory: "" })}
                  className={`rounded-t px-4 py-1.5 text-[14px] ${!applied.subcategory.length ? "bg-white text-brand-ink" : "text-brand-text hover:bg-white/50"}`}
                >
                  All
                </button>
                {subTabs.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    role="tab"
                    aria-selected={activeSub === s.value}
                    onClick={() => update({ subcategory: s.value })}
                    className={`rounded-t px-4 py-1.5 text-[14px] ${activeSub === s.value ? "bg-white text-brand-ink" : "text-brand-text hover:bg-white/50"}`}
                  >
                    {s.value} ({s.count})
                  </button>
                ))}
                {subCount === 0 && null}
              </div>
            </div>
          )}

          {products.isError ? (
            <ErrorState
              message={products.error?.userMessage}
              onRetry={() => products.refetch()}
            />
          ) : !products.isLoading && data?.products.length === 0 ? (
            <EmptyState
              title="No products found"
              message={
                appliedCount
                  ? "Try removing some filters to see more designs."
                  : "New designs are on their way. Please check back soon."
              }
              actionLabel={appliedCount ? "Clear filters" : "Continue shopping"}
              onAction={appliedCount ? onClear : undefined}
              to={appliedCount ? undefined : "/"}
            />
          ) : (
            <>
              <div
                className={
                  products.isFetching && !products.isLoading
                    ? "opacity-60 transition"
                    : "transition"
                }
              >
                <ProductGrid
                  products={data?.products || []}
                  loading={products.isLoading}
                  skeletons={8}
                  cols={
                    showFilters
                      ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
                      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                  }
                />
              </div>
              <Pagination
                page={data?.page || page}
                pages={data?.pages || 1}
                onChange={(n) => {
                  update({ page: n === 1 ? "" : n }, false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          )}
        </section>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-[75] lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawer(false)}
            aria-hidden="true"
          />

          {/* Filter Drawer */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="
        absolute inset-x-0 bottom-0
        flex max-h-[88vh] flex-col
        overflow-hidden
        rounded-t-xl
        bg-cream
        shadow-2xl
      "
          >
            {/* Fixed Header */}
            <div
              className="
          flex shrink-0 items-center justify-between
          border-b border-brand-brown/10
          px-4 py-3
        "
            >
              <h2 className="font-display text-lg font-bold text-brand-heading">
                Filters{" "}
                <span className="text-sm font-normal text-brand-muted">
                  {appliedCount} Applied
                </span>
              </h2>

              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="Close filters"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5"
              >
                <CloseIcon size={22} />
              </button>
            </div>

            {/* SCROLLABLE FILTER CONTENT */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
              {sidebar(() => setDrawer(false))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
