import ContactMessage from '../models/ContactMessage.js';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import Banner from '../models/Banner.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import FAQ from '../models/FAQ.js';
import Testimonial from '../models/Testimonial.js';
import CMSPage from '../models/CMSPage.js';
import Collection from '../models/Collection.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getSettings } from '../services/settingsService.js';
import { mail } from '../services/emailService.js';
import { storeImage } from '../services/uploadService.js';

export const submitContact = asyncHandler(async (req, res) => {
  const msg = await ContactMessage.create(req.body);
  mail.adminContact(msg);
  res.status(201).json({ success: true, message: 'Thank you! Your message has been sent. We will get back to you soon.' });
});

export const subscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const existing = await NewsletterSubscriber.findOne({ email });
  if (existing) {
    if (existing.isActive) throw new ApiError(409, 'This email is already subscribed');
    existing.isActive = true;
    await existing.save();
  } else {
    await NewsletterSubscriber.create({ email });
  }
  res.status(201).json({ success: true, message: 'Thanks for subscribing!' });
});

const PRODUCT_CARD = 'name slug price salePrice finalPrice stock images isBestseller category';

export const homeData = asyncHandler(async (req, res) => {
  const [banners, circles, sectionCats, newArrivals, faqs, testimonials, walkin, about] = await Promise.all([
    Banner.find({ isActive: true }).sort({ displayOrder: 1 }).lean(),
    Category.find({ isActive: true, showInCircles: true }).sort({ displayOrder: 1 }).lean(),
    Category.find({ isActive: true, showOnHome: true }).sort({ displayOrder: 1 }).lean(),
    Product.find({ isActive: true, isNewArrival: true, stock: { $gt: 0 } }).select(PRODUCT_CARD).sort({ createdAt: -1 }).limit(5).lean(),
    FAQ.find({ isActive: true }).sort({ displayOrder: 1 }).lean(),
    Testimonial.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 }).limit(12).lean(),
    CMSPage.findOne({ key: 'walkin', isActive: true }).lean(),
    CMSPage.findOne({ key: 'home-about', isActive: true }).lean(),
  ]);
  const sections = await Promise.all(
    sectionCats.map(async (c) => ({
      category: c,
      products: await Product.find({ category: c._id, isActive: true }).select(PRODUCT_CARD).sort({ isBestseller: -1, soldCount: -1 }).limit(10).lean(),
    }))
  );
  res.json({ success: true, banners, circles, newArrivals, sections, faqs, testimonials, walkin, about });
});

export const publicSettings = asyncHandler(async (req, res) => {
  const s = (await getSettings()).toObject();
  delete s.email_settings;
  res.json({ success: true, settings: s });
});

export const getCmsPage = asyncHandler(async (req, res) => {
  const page = await CMSPage.findOne({ key: req.params.key, isActive: true }).lean();
  if (!page) throw new ApiError(404, 'Page not found');
  res.json({ success: true, page });
});

export const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw new ApiError(400, 'Please choose at least one image');
  const folder = ['products', 'categories', 'collections', 'banners', 'cms', 'testimonials'].includes(req.query.folder) ? req.query.folder : 'misc';
  const images = [];
  for (const f of req.files) {
    // eslint-disable-next-line no-await-in-loop
    images.push(await storeImage(f, folder));
  }
  res.status(201).json({ success: true, images });
});

// ---------------- Admin content ----------------
export const adminListCms = asyncHandler(async (req, res) => res.json({ success: true, pages: await CMSPage.find().sort({ key: 1 }).lean() }));

export const adminSaveCms = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const body = { ...req.body };
  delete body._id;
  delete body.key;
  const page = await CMSPage.findOneAndUpdate({ key: key.toLowerCase() }, { $set: body, $setOnInsert: { key: key.toLowerCase() } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
  res.json({ success: true, page });
});

export const adminSettings = asyncHandler(async (req, res) => res.json({ success: true, settings: await getSettings() }));

export const adminUpdateSettings = asyncHandler(async (req, res) => {
  const s = await getSettings();
  const body = { ...req.body };
  ['_id', 'key', 'createdAt', 'updatedAt', '__v'].forEach((k) => delete body[k]);
  ['returnWindowDays', 'shippingFee', 'freeShippingAbove', 'taxPercent', 'deliveryDays'].forEach((k) => {
    if (body[k] !== undefined) body[k] = Number(body[k]);
  });
  s.set(body);
  await s.save();
  res.json({ success: true, settings: s });
});

export const adminMessages = asyncHandler(async (req, res) => res.json({ success: true, messages: await ContactMessage.find().sort({ createdAt: -1 }).limit(300).lean() }));
export const adminMessageRead = asyncHandler(async (req, res) => {
  const m = await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: req.body.isRead !== false }, { new: true });
  if (!m) throw new ApiError(404, 'Message not found');
  res.json({ success: true, message: m });
});
export const adminMessageDelete = asyncHandler(async (req, res) => {
  await ContactMessage.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
export const adminSubscribers = asyncHandler(async (req, res) => res.json({ success: true, subscribers: await NewsletterSubscriber.find().sort({ createdAt: -1 }).lean() }));
export const adminSubscriberDelete = asyncHandler(async (req, res) => {
  await NewsletterSubscriber.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export const collectionBySlug = asyncHandler(async (req, res) => {
  const c = await Collection.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!c) throw new ApiError(404, 'Collection not found');
  res.json({ success: true, collection: c });
});
