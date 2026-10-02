import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "../../api/services.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useWishlist } from "../../context/WishlistContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import {
  CartIcon,
  ChevronDown,
  CloseIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "../common/Icons.jsx";
import SearchBar from "./SearchBar.jsx";

const NAV = [
  { label: "New Arrivals", to: "/new-arrivals" },
  { label: "Necklaces", slug: "necklaces" },
  { label: "Earrings", slug: "earrings" },
  { label: "Pendants", slug: "pendants" },
  { label: "Maangtika", slug: "maangtika" },
  { label: "Bangles", slug: "bangles" },
  { label: "Collections", collections: true },
];

const ORNAMENT =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='9'%3E%3Cpath d='M0 4.500Q11 0 22 4.500T44 4.500' fill='none' stroke='%23e0b070' stroke-width='1.100'/%3E%3Ccircle cx='22' cy='4.500' r='1.400' fill='%23e0b070'/%3E%3C/svg%3E\")";

function useNavData() {
  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: catalogApi.categories,
    staleTime: 5 * 60_000,
  });
  const cols = useQuery({
    queryKey: ["collections"],
    queryFn: catalogApi.collections,
    staleTime: 5 * 60_000,
  });
  const bySlug = Object.fromEntries(
    (cats.data?.items || []).map((c) => [c.slug, c]),
  );
  const build = (n) => {
    if (n.to) return { ...n, children: null };
    if (n.collections)
      return {
        ...n,
        all: "/products",
        children: (cols.data?.items || []).map((c) => ({
          label: c.title,
          to: `/collections/${c.slug}`,
        })),
      };
    const c = bySlug[n.slug];
    return {
      ...n,
      all: `/category/${n.slug}`,
      children: (c?.subcategories || []).map((s) => ({
        label: s,
        to: `/category/${n.slug}?subcategory=${encodeURIComponent(s)}`,
      })),
    };
  };
  return NAV.map(build);
}

const linkCls =
  "whitespace-nowrap font-logo text-[15px] font-semibold tracking-wide text-white/95 transition hover:text-[#f5c98a]";

function DesktopNav({ items }) {
  const [openIdx, setOpenIdx] = useState(null);
  const timer = useRef(null);
  const show = (i) => {
    clearTimeout(timer.current);
    setOpenIdx(i);
  };
  const hide = () => {
    timer.current = setTimeout(() => setOpenIdx(null), 120);
  };
  return (
    <nav
      aria-label="Main"
      className="relative z-30 hidden flex-1 items-center justify-center gap-5 xl:flex xl:gap-8"
    >
      {items.map((it, i) => (
        <div
          key={it.label}
          className="relative"
          onMouseEnter={() => show(i)}
          onMouseLeave={hide}
          onFocus={() => show(i)}
          onBlur={hide}
        >
          {it.to ? (
            <NavLink to={it.to} className={linkCls}>
              {it.label}
            </NavLink>
          ) : (
            <>
              <Link
                to={it.all}
                className={`${linkCls} inline-flex items-center gap-1`}
                aria-haspopup="true"
                aria-expanded={openIdx === i}
              >
                {it.label}
                <ChevronDown size={12} className="opacity-80" />
              </Link>
              {openIdx === i && (
                <div className="absolute left-1/2 top-full z-50 min-w-[210px] -translate-x-1/2 pt-3">
                  <ul className="rounded-md bg-cream py-2 shadow-xl ring-1 ring-black/10">
                    <li>
                      <Link
                        to={it.all}
                        className="block px-4 py-2 text-sm font-bold text-brand-orange hover:bg-beige"
                        onClick={() => setOpenIdx(null)}
                      >
                        All {it.label}
                      </Link>
                    </li>
                    {it.children.map((c) => (
                      <li key={c.label}>
                        <Link
                          to={c.to}
                          className="block px-4 py-2 text-sm text-brand-ink hover:bg-beige"
                          onClick={() => setOpenIdx(null)}
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </nav>
  );
}

function MobileDrawer({ open, onClose, items }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  const row =
    "flex w-full items-center justify-between px-5 py-3.5 text-left text-[15px] font-bold text-brand-ink";
  return (
    <div className="fixed inset-0 z-[70] xl:hidden">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute inset-y-0 left-0 flex w-[85%] max-w-[330px] flex-col bg-cream shadow-2xl"
      >
        <div className="flex items-center justify-between bg-header px-5 py-4">
          <Link to="/" onClick={onClose} className="flex items-center gap-2">
            <img
              src="/images/logo.png"
              alt=""
              className="h-10 w-10 rounded-full bg-white"
            />
            <span className="font-logo text-lg font-bold text-white">
              Omkari Fashions
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="text-white"
          >
            <CloseIcon size={24} />
          </button>
        </div>
        <nav
          aria-label="Mobile"
          className="flex-1 overflow-y-auto divide-y divide-beige-dark"
        >
          {items.map((it) => (
            <div key={it.label}>
              {it.to ? (
                <Link to={it.to} onClick={onClose} className={row}>
                  {it.label}
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    className={row}
                    aria-expanded={expanded === it.label}
                    onClick={() =>
                      setExpanded(expanded === it.label ? null : it.label)
                    }
                  >
                    {it.label}
                    <ChevronDown
                      size={16}
                      className={`transition ${expanded === it.label ? "rotate-180" : ""}`}
                    />
                  </button>
                  {expanded === it.label && (
                    <ul className="bg-beige/60 pb-2">
                      <li>
                        <Link
                          to={it.all}
                          onClick={onClose}
                          className="block px-8 py-2 text-sm font-bold text-brand-orange"
                        >
                          All {it.label}
                        </Link>
                      </li>
                      {it.children.map((c) => (
                        <li key={c.label}>
                          <Link
                            to={c.to}
                            onClick={onClose}
                            className="block px-8 py-2 text-sm text-brand-ink"
                          >
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          ))}
          <div className="py-2">
            <Link to="/wishlist" onClick={onClose} className={row}>
              Wishlist
            </Link>
            <Link to="/cart" onClick={onClose} className={row}>
              Cart
            </Link>
            {user ? (
              <>
                <Link to="/profile" onClick={onClose} className={row}>
                  My Profile
                </Link>
                <Link to="/orders" onClick={onClose} className={row}>
                  My Orders
                </Link>
                <button
                  type="button"
                  className={`${row} text-red-700`}
                  onClick={async () => {
                    await logout();
                    toast.info("You have been logged out");
                    onClose();
                    navigate("/");
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={onClose} className={row}>
                  Login
                </Link>
                <Link to="/register" onClick={onClose} className={row}>
                  Create account
                </Link>
              </>
            )}
          </div>
        </nav>
      </aside>
    </div>
  );
}

function Badge({ n }) {
  if (!n) return null;
  return (
    <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#f5c04a] px-1 text-[10px] font-black text-brand-brown">
      {n > 99 ? "99+" : n}
    </span>
  );
}

export default function Header() {
  const items = useNavData();
  const { user, logout } = useAuth();
  const { count } = useCart();
  const wl = useWishlist();
  const toast = useToast();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const close = (e) =>
      menuRef.current && !menuRef.current.contains(e.target) && setMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const iconBtn =
    "relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center text-white transition hover:text-[#f5c98a]";

  return (
    <header className="relative z-40 mb-5">
      <div className="relative bg-header pb-16 pt-5 sm:pb-16 sm:pt-6">
        <div className="relative z-30 mx-auto flex w-full max-w-[1320px] items-center gap-2 px-3 sm:px-8">
          <button
            type="button"
            className={`${iconBtn} xl:hidden`}
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
          >
            <MenuIcon size={26} />
          </button>

          <Link
            to="/"
            aria-label="Omkari Fashions home"
            className="flex min-w-0 shrink items-center gap-2 sm:gap-2.5 xl:flex-col xl:gap-0.5 xl:pl-3"
          >
            <img
              src="/images/logo.png"
              alt=""
              width="64"
              height="64"
              className="h-10 w-10 rounded-full bg-white object-contain sm:h-11 sm:w-11 xl:h-16 xl:w-16"
            />
            <span className="font-logo text-[16px] font-bold leading-none tracking-wide text-white sm:text-[19px] xl:text-[17px]">
              Omkari Fashions
            </span>
          </Link>

          <DesktopNav items={items} />

          <div className="ml-auto flex items-center gap-0.5 sm:gap-2 xl:ml-0">
            <button
              type="button"
              className={`${iconBtn} !hidden sm:!flex`}
              aria-label="Search"
              onClick={() => {
                searchRef.current?.focus();
                searchRef.current?.scrollIntoView({
                  block: "center",
                  behavior: "smooth",
                });
              }}
            >
              <SearchIcon size={24} />
            </button>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className={iconBtn}
                aria-label="Account"
                aria-haspopup="true"
                aria-expanded={menu}
                onClick={() => setMenu((m) => !m)}
              >
                <UserIcon size={24} />
              </button>
              {menu && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-md bg-cream py-1 shadow-xl ring-1 ring-black/10">
                  {user ? (
                    <>
                      <p className="border-b border-beige-dark px-4 py-2 text-sm font-bold text-brand-heading">
                        Hi, {user.name.split(" ")[0]}
                      </p>
                      {[
                        ["/profile", "My Profile"],
                        ["/orders", "My Orders"],
                        ["/wishlist", "Wishlist"],
                      ].map(([to, l]) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setMenu(false)}
                          className="block px-4 py-2 text-sm hover:bg-beige"
                        >
                          {l}
                        </Link>
                      ))}
                      <button
                        type="button"
                        className="block w-full px-4 py-2 text-left text-sm font-bold text-red-700 hover:bg-beige"
                        onClick={async () => {
                          setMenu(false);
                          await logout();
                          toast.info("You have been logged out");
                          navigate("/");
                        }}
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setMenu(false)}
                        className="block px-4 py-2 text-sm font-bold hover:bg-beige"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setMenu(false)}
                        className="block px-4 py-2 text-sm hover:bg-beige"
                      >
                        Create account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
            <Link
              to="/wishlist"
              className={iconBtn}
              aria-label={`Wishlist${wl.count ? `, ${wl.count} items` : ""}`}
            >
              <HeartIcon size={24} />
              <Badge n={wl.count} />
            </Link>
            <Link
              to="/cart"
              className={iconBtn}
              aria-label={`Cart${count ? `, ${count} items` : ""}`}
            >
              <CartIcon size={24} />
              <Badge n={count} />
            </Link>
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[120px] opacity-35"
          style={{
            backgroundImage: "url('/images/paisley.png')",
            backgroundRepeat: "repeat-x",
            backgroundPosition: "center bottom",
            backgroundSize: "auto 120px",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[9px] bg-repeat-x"
          style={{ backgroundImage: ORNAMENT }}
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 z-10 translate-y-1/2 px-3 sm:px-8">
          <div className="mx-auto w-full max-w-[1040px]">
            <SearchBar inputRef={searchRef} />
          </div>
        </div>
      </div>
      <MobileDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        items={items}
      />
    </header>
  );
}
