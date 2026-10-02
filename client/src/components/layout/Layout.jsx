import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import Newsletter from "./Newsletter.jsx";

export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  const hideBottomSections = ["/cart", "/checkout"].includes(pathname);

  return (
    <div className="flex min-h-screen min-w-0 w-full flex-col overflow-x-clip">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:rounded focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <div className="min-w-0 w-full overflow-x-clip">
        <Header />
      </div>

      <main id="main" className="min-w-0 w-full flex-1 overflow-x-clip pt-3">
        <Outlet />
      </main>

      {!hideBottomSections && (
        <div className="min-w-0 w-full overflow-x-clip">
          <Newsletter />
        </div>
      )}

      {!hideBottomSections && (
        <div className="min-w-0 w-full overflow-x-clip">
          <Footer />
        </div>
      )}
    </div>
  );
}
