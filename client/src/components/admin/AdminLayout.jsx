import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

import { CloseIcon, MenuIcon } from "../common/Icons.jsx";
import { PageLoader } from "../common/Feedback.jsx";
import Seo from "../common/Seo.jsx";

import useAdminNotifications from "../../hooks/useAdminNotifications.js";

/* =========================================================
   NAVIGATION
========================================================= */

const NAV = [
  ["/admin", "Dashboard", true],
  ["/admin/products", "Products"],
  ["/admin/categories", "Categories"],
  ["/admin/collections", "Collections"],
  ["/admin/orders", "Orders"],
  ["/admin/returns", "Returns"],
  ["/admin/customers", "Customers"],
  ["/admin/reviews", "Reviews"],
  ["/admin/messages", "Messages"],
  ["/admin/newsletter", "Newsletter"],
  ["/admin/banners", "Banners"],
  ["/admin/coupons", "Coupons"],
  ["/admin/cms", "Homepage CMS"],
  ["/admin/settings", "Settings"],
  ["/admin/email-settings", "Email Settings"],
  ["/admin/profile", "Profile"],
];

/* =========================================================
   ADMIN GUARD
========================================================= */

export function AdminGuard() {
  const { admin, loading, ensureAdmin } = useAuth();
  const location = useLocation();

  const [checked, setChecked] = useState(false);

  useEffect(() => {
    ensureAdmin().finally(() => {
      setChecked(true);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !checked) {
    return <PageLoader />;
  }

  if (!admin) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <AdminLayout />;
}

/* =========================================================
   NOTIFICATION BADGE
========================================================= */

function NotificationBadge({ count }) {
  if (!count || count <= 0) {
    return null;
  }

  return (
    <span
      className="
        ml-auto
        flex
        h-[19px]
        min-w-[19px]
        shrink-0
        items-center
        justify-center
        rounded-full
        bg-[#C94B00]
        px-1.5
        text-[10px]
        font-bold
        leading-none
        text-white
        shadow-sm
      "
      aria-label={`${count} new`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({ onNavigate }) {
  const { adminLogout } = useAuth();

  const toast = useToast();
  const navigate = useNavigate();

  const {
    orders: newOrders,
    customers: newCustomers,
    reviews: newReviews,
    returns: newReturns,
    messages: newMessages,
    newsletters: newNewsletters,

    markOrdersSeen,
    markCustomersSeen,
    markReviewsSeen,
    markReturnsSeen,
    markMessagesSeen,
    markNewslettersSeen,
  } = useAdminNotifications();

  /*
   * Map each admin route to:
   * - notification count
   * - function to mark that section as seen
   */
  const notificationMap = {
    "/admin/orders": {
      count: newOrders,
      markSeen: markOrdersSeen,
    },

    "/admin/returns": {
      count: newReturns,
      markSeen: markReturnsSeen,
    },

    "/admin/customers": {
      count: newCustomers,
      markSeen: markCustomersSeen,
    },

    "/admin/reviews": {
      count: newReviews,
      markSeen: markReviewsSeen,
    },

    "/admin/messages": {
      count: newMessages,
      markSeen: markMessagesSeen,
    },

    "/admin/newsletter": {
      count: newNewsletters,
      markSeen: markNewslettersSeen,
    },
  };

  return (
    <div className="flex h-full flex-col bg-brand-brown text-white">
      {/* ===================================================
          LOGO
      =================================================== */}

      <Link
        to="/admin"
        onClick={onNavigate}
        className="
          flex
          items-center
          gap-3
          border-b
          border-white/10
          px-5
          py-4
        "
      >
        <img
          src="/images/logo.png"
          alt="Omkari Fashions"
          className="h-10 w-10 rounded-full bg-white"
        />

        <span>
          <b className="block font-logo text-lg leading-none">
            Omkari Fashions
          </b>

          <span className="text-[11px] text-white/60">Admin Panel</span>
        </span>
      </Link>

      {/* ===================================================
          NAVIGATION
      =================================================== */}

      <nav
        aria-label="Admin"
        className="
          flex-1
          space-y-0.5
          overflow-y-auto
          px-3
          py-3
        "
      >
        {NAV.map(([to, label, end]) => {
          const notification = notificationMap[to];

          const notificationCount = notification?.count || 0;

          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => {
                /*
                 * Mark notifications as seen when
                 * the admin opens that section.
                 */
                if (notification?.markSeen) {
                  notification.markSeen();
                }

                onNavigate?.();
              }}
              className={({ isActive }) =>
                `
                  flex
                  min-h-[36px]
                  w-full
                  items-center
                  gap-2
                  rounded
                  px-3
                  py-2
                  text-[14px]
                  transition
                  ${
                    isActive
                      ? "bg-brand-orange font-bold text-white"
                      : "text-white/80 hover:bg-white/10"
                  }
                `
              }
            >
              {/* Menu label */}

              <span className="min-w-0 truncate">{label}</span>

              {/* Notification */}

              <NotificationBadge count={notificationCount} />
            </NavLink>
          );
        })}
      </nav>

      {/* ===================================================
          BOTTOM
      =================================================== */}

      <div className="border-t border-white/10 p-3">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="
            mb-1
            block
            rounded
            px-3
            py-2
            text-[13px]
            text-white/80
            hover:bg-white/10
          "
        >
          View website ↗
        </a>

        <button
          type="button"
          onClick={async () => {
            await adminLogout();

            toast.info("Logged out");

            navigate("/login");
          }}
          className="
            block
            w-full
            rounded
            px-3
            py-2
            text-left
            text-[14px]
            font-bold
            text-[#ffb59a]
            hover:bg-white/10
          "
        >
          Logout
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN LAYOUT
========================================================= */

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  const { admin } = useAuth();
  const { pathname } = useLocation();

  /*
   * Close mobile sidebar whenever route changes.
   */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#f6ede6] lg:flex">
      <Seo title="Admin" noindex />

      {/* =================================================
          DESKTOP SIDEBAR
      ================================================= */}

      <aside
        className="
          fixed
          inset-y-0
          left-0
          z-30
          hidden
          w-[230px]
          lg:block
        "
      >
        <Sidebar />
      </aside>

      {/* =================================================
          MOBILE SIDEBAR
      ================================================= */}

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}

          <div
            className="
              absolute
              inset-0
              bg-black/50
            "
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Sidebar */}

          <div
            className="
              absolute
              inset-y-0
              left-0
              w-[260px]
            "
          >
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* =================================================
          MAIN
      ================================================= */}

      <div
        className="
          min-w-0
          flex-1
          lg:pl-[230px]
        "
      >
        {/* ===============================================
            HEADER
        =============================================== */}

        <header
          className="
            sticky
            top-0
            z-20
            flex
            h-14
            items-center
            justify-between
            border-b
            border-beige-dark
            bg-white
            px-4
          "
        >
          {/* Mobile menu */}

          <button
            type="button"
            className="lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
          </button>

          {/* Welcome */}

          <p
            className="
              hidden
              text-sm
              text-brand-muted
              lg:block
            "
          >
            Welcome back
          </p>

          {/* Admin profile */}

          <Link
            to="/admin/profile"
            className="
              flex
              items-center
              gap-2
              text-sm
            "
          >
            <span
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                bg-brand-orange
                font-bold
                text-white
              "
            >
              {admin?.name?.[0]}
            </span>

            <span className="hidden sm:inline">{admin?.name}</span>
          </Link>
        </header>

        {/* ===============================================
            PAGE
        =============================================== */}

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
