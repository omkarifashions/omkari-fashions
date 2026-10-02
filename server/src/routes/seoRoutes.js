import { Router } from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import env from '../config/env.js';
import asyncHandler from '../utils/asyncHandler.js';

const r = Router();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

r.get('/sitemap.xml', asyncHandler(async (req, res) => {
  const [products, cats] = await Promise.all([Product.find({ isActive: true }).select('slug updatedAt').lean(), Category.find({ isActive: true }).select('slug updatedAt').lean()]);
  const base = env.clientUrl.replace(/\/$/, '');
  const urls = [
    ...['', '/about', '/contact', '/products', '/new-arrivals'].map((p) => ({ loc: `${base}${p}` })),
    ...cats.map((c) => ({ loc: `${base}/category/${c.slug}`, lastmod: c.updatedAt })),
    ...products.map((p) => ({ loc: `${base}/products/${p.slug}`, lastmod: p.updatedAt })),
  ];
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}</url>`).join('')}</urlset>`);
}));

r.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /checkout\nDisallow: /profile\nSitemap: ${env.serverUrl}/sitemap.xml\n`);
});
export default r;
