# Omkari Fashions – MERN E-commerce

Premium traditional Indian jewellery store (since 1975) built with **React + Vite + Tailwind** and **Node + Express + MongoDB**.
The UI recreates the supplied Omkari Fashions designs (header, search bar, category circles, banners, product grid + filters, product page, cart, wishlist, About, Contact, newsletter, footer).

## Features
- **Storefront:** homepage driven by MongoDB/CMS, category & collection pages, real server-side filters (category, price, style, craftsmanship, occasion, colours, metal, stone, out-of-stock), sorting, pagination, global search with suggestions, product details (gallery, pincode check, reviews, similar & recently viewed), wishlist, persistent cart (guest cart merges on login).
- **Accounts:** register, login, logout, forgot/reset password, profile, addresses – JWT in HTTP-only cookies. Guests can browse and add to cart; checkout and orders require login (you return to the intended page after login).
- **Checkout & payments:** COD and Razorpay (server-created order, HMAC signature verification on the backend, duplicate-order protection via idempotency key, atomic stock reservation, abandoned-payment cleanup), coupons, animated order confirmation.
- **Orders:** status timeline from `statusHistory`, cancellation (rejected by the backend once shipped; the button is not rendered), invoice PDF (customer + admin), shipping label PDF (admin).
- **Returns & refunds:** admin-configurable return window (global + per product) and returnable flag, eligibility from delivery date, reasons with **mandatory photo proof** for Damaged/Wrong product, separate return timeline, admin workflow (approve / reject / request info / pickup / received / refund / complete). Online orders refund to the original payment; COD returns collect a UPI ID (masked for customers, visible to admin).
- **Reviews:** only for delivered purchases, admin moderation, feature on homepage.
- **Admin panel** (`/admin`): dashboard with live charts, products (image upload with progress + reorder), categories, collections, orders, returns, customers, reviews, messages, newsletter, banners, coupons, Homepage CMS (content blocks, FAQs, testimonials), settings, email settings, profile. Admin auth uses a **separate cookie** and every admin API re-checks the role in the database.
- **SEO / performance:** per-page titles, meta, canonical, Open Graph, Twitter, Product / Organization / Breadcrumb / FAQ JSON-LD, slug URLs, dynamic `/sitemap.xml`, `robots.txt`, lazy routes, lazy images, server-side pagination.
- **Security:** bcrypt, helmet, CORS allow-list, rate limiting, Mongo operator stripping, XSS sanitising, zod validation, upload type/size/count validation.

## Tech stack
React 18, Vite, React Router 6, Tailwind CSS 3, Axios, TanStack Query, Framer Motion · Node 18+, Express 4, Mongoose 8, JWT, bcryptjs, multer, Cloudinary, Razorpay, Resend, PDFKit, zod.

## Folder structure
```
omkari/
├─ client/                  React app
│  ├─ public/images/        logo, paisley, deity frame, banners
│  └─ src/ api/ context/ hooks/ utils/
│         components/{common,layout,product,checkout,orders,home,admin}
│         pages/{Home,Products,ProductDetails,Cart,Checkout,Auth,Profile,Orders,Content,Wishlist,admin}
└─ server/
   ├─ scripts/              seed.js, createAdmin.js
   ├─ uploads/seed/         demo product images (taken from the supplied designs)
   └─ src/ config/ controllers/ middleware/ models/ routes/ services/ utils/ validators/ app.js server.js
```

## Installation
Requirements: Node 18+ and a MongoDB instance (local or Atlas).
```bash
npm run install:all
cp server/.env.example server/.env      # then edit the values
cp client/.env.example client/.env      # optional in development
```

### Environment variables (`server/.env`)
`MONGO_URI, JWT_SECRET, CLIENT_URL, SERVER_URL, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, RESEND_API_KEY, EMAIL_FROM, EMAIL_HOST/PORT/USER/PASSWORD (optional), ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD`.
Never commit `.env`. The client only needs `VITE_API_URL` in production.

### MongoDB
Local: `mongodb://127.0.0.1:27017/omkari_fashions`. Atlas: create a free cluster, allow your IP, copy the connection string into `MONGO_URI`.

### Cloudinary
Create an account → Dashboard → copy cloud name, API key and secret. If empty, uploads are stored on local disk in `server/uploads` (fine for development; use Cloudinary in production).

### Razorpay
Dashboard → Settings → API Keys (Test mode) → set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. Without keys, “Pay Online” shows a clear message and COD still works.

### Email (Resend)
Create a key at resend.com → `RESEND_API_KEY`; verify your domain and set `EMAIL_FROM`. Without a key, emails are logged to the console. Toggle each email type in **Admin → Email Settings**.

### Seed the database
```bash
npm run seed
```
Creates 10 categories, 4 collections, about 45 products (with images), banners, FAQs, testimonials, CMS pages, coupons (`WELCOME10`, `FESTIVE200`) and the admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. **Seeding clears the catalogue collections** (categories, products, banners, FAQs, CMS, coupons) but not users or orders.

### Admin setup
Log in at `/admin/login` with the seeded admin. Create or reset the admin at any time with `npm run seed:admin --prefix server`. Change the password under **Admin → Profile**.

## Run
```bash
npm run dev:server    # http://localhost:5000
npm run dev:client    # http://localhost:5173 (proxies /api and /uploads)
```

## Production build & deployment
```bash
npm run build                      # outputs client/dist
NODE_ENV=production npm start      # API
```
- Host `client/dist` on any static host (Netlify / Vercel / S3) with an SPA fallback to `index.html`; set `VITE_API_URL=https://api.yourdomain.com` at build time.
- Deploy `server/` to Render / Railway / a VPS. Set `NODE_ENV=production`, `CLIENT_URL` (your site URL), `SERVER_URL` and a long random `JWT_SECRET`. Cookies are `Secure; SameSite=None` in production, so serve both apps over HTTPS.
- Update the sitemap URL in `client/public/robots.txt` to your API domain and set `VITE_SITE_URL` for canonical links.

## Notes
- Prices are tax-inclusive; the tax shown is the included portion (configurable in Settings).
- Online-paid returns are refunded from your Razorpay dashboard; complete the return in the admin panel afterwards to record the refund.
