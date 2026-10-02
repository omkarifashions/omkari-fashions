import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import { PageLoader } from './components/common/Feedback.jsx';
import { AdminGuard } from './components/admin/AdminLayout.jsx';

const HomePage = lazy(() => import('./pages/Home/HomePage.jsx'));
const ProductsPage = lazy(() => import('./pages/Products/ProductsPage.jsx'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetails/ProductDetailsPage.jsx'));
const CartPage = lazy(() => import('./pages/Cart/CartPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/Checkout/CheckoutPage.jsx'));
const OrderSuccessPage = lazy(() => import('./pages/Checkout/OrderSuccessPage.jsx'));
const LoginPage = lazy(() => import('./pages/Auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/Auth/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/Auth/ResetPasswordPage.jsx'));
const AccountLayout = lazy(() => import('./pages/Profile/AccountLayout.jsx'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage.jsx'));
const OrdersPage = lazy(() => import('./pages/Orders/OrdersPage.jsx'));
const OrderDetailsPage = lazy(() => import('./pages/Orders/OrderDetailsPage.jsx'));
const ReturnsPage = lazy(() => import('./pages/Orders/ReturnsPage.jsx'));
const WishlistPage = lazy(() => import('./pages/Wishlist/WishlistPage.jsx'));
const AboutPage = lazy(() => import('./pages/Content/AboutPage.jsx'));
const ContactPage = lazy(() => import('./pages/Content/ContactPage.jsx'));
const FaqPage = lazy(() => import('./pages/Content/FaqPage.jsx'));
const CmsPage = lazy(() => import('./pages/Content/CmsPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/Content/NotFoundPage.jsx'));

const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage.jsx'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage.jsx'));
const ProductsAdminPage = lazy(() => import('./pages/admin/ProductsAdminPage.jsx'));
const ProductFormPage = lazy(() => import('./pages/admin/ProductFormPage.jsx'));
const OrdersAdmin = lazy(() => import('./pages/admin/OrdersAdminPage.jsx').then((m) => ({ default: m.OrdersAdminPage })));
const OrderAdminDetail = lazy(() => import('./pages/admin/OrdersAdminPage.jsx').then((m) => ({ default: m.OrderAdminDetail })));
const ReturnsAdminPage = lazy(() => import('./pages/admin/ReturnsAdminPage.jsx'));
const misc = (name) => lazy(() => import('./pages/admin/MiscAdminPages.jsx').then((m) => ({ default: m[name] })));
const CustomersPage = misc('CustomersPage');
const ReviewsPage = misc('ReviewsPage');
const MessagesPage = misc('MessagesPage');
const NewsletterPage = misc('NewsletterPage');
const CategoriesPage = misc('CategoriesPage');
const CollectionsPage = misc('CollectionsPage');
const BannersPage = misc('BannersPage');
const CouponsPage = misc('CouponsPage');
const CmsAdminPage = misc('CmsPage');
const SettingsPage = misc('SettingsPage');
const EmailSettingsPage = misc('EmailSettingsPage');
const AdminProfilePage = misc('AdminProfilePage');

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage mode="all" />} />
          <Route path="products/:slug" element={<ProductDetailsPage />} />
          <Route path="category/:slug" element={<ProductsPage mode="category" />} />
          <Route path="collections/:slug" element={<ProductsPage mode="collection" />} />
          <Route path="new-arrivals" element={<ProductsPage mode="new" />} />
          <Route path="search" element={<ProductsPage mode="search" />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="store-locator" element={<CmsPage pageKey="store-locator" />} />
          <Route path="privacy-policy" element={<CmsPage pageKey="privacy-policy" />} />
          <Route path="terms-of-use" element={<CmsPage pageKey="terms-of-use" />} />
          <Route path="shipping-policy" element={<CmsPage pageKey="shipping-policy" />} />
          <Route path="return-and-refund-policy" element={<CmsPage pageKey="return-and-refund-policy" />} />

          <Route element={<ProtectedRoute />}>
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="order-success/:id" element={<OrderSuccessPage />} />
            <Route element={<AccountLayout />}>
              <Route path="profile" element={<ProfilePage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailsPage />} />
              <Route path="returns" element={<ReturnsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route path="admin" element={<AdminGuard />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsAdminPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id" element={<ProductFormPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="orders" element={<OrdersAdmin />} />
          <Route path="orders/:id" element={<OrderAdminDetail />} />
          <Route path="returns" element={<ReturnsAdminPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="newsletter" element={<NewsletterPage />} />
          <Route path="banners" element={<BannersPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="cms" element={<CmsAdminPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="email-settings" element={<EmailSettingsPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
