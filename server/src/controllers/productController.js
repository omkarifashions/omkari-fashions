import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Collection from '../models/Collection.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uniqueSlug, escapeRegex, toArray } from '../utils/helpers.js';
import { removeImage } from '../services/uploadService.js';
import { getSettings } from '../services/settingsService.js';
import { addDays } from '../utils/helpers.js';

const SORTS = {
  best_selling: { isBestseller: -1, soldCount: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  price_asc: { finalPrice: 1 },
  price_desc: { finalPrice: -1 },
  name_asc: { name: 1 },
};

async function buildFilter(q) {
  const filter = { isActive: true };
  const and = [];

  if (q.category) {
    const slugs = toArray(q.category);
    const cats = await Category.find({ slug: { $in: slugs } }).select('_id');
    filter.category = { $in: cats.map((c) => c._id) };
  }
  if (q.collection) {
    const col = await Collection.findOne({ slug: q.collection });
    filter._id = { $in: col ? col.products : [] };
  }
  if (q.subcategory) filter.subcategory = { $in: toArray(q.subcategory) };
  if (q.craftsmanship) filter.craftsmanship = { $in: toArray(q.craftsmanship) };
  if (q.occasion) filter.occasion = { $in: toArray(q.occasion) };
  if (q.colors) filter.colors = { $in: toArray(q.colors) };
  if (q.metalType) filter.metalType = { $in: toArray(q.metalType) };
  if (q.stoneType) filter.stoneType = { $in: toArray(q.stoneType) };
  if (q.bestseller === 'true') filter.isBestseller = true;
  if (q.newArrival === 'true') filter.isNewArrival = true;
  if (q.minPrice || q.maxPrice) {
    filter.finalPrice = {};
    if (q.minPrice) filter.finalPrice.$gte = Number(q.minPrice);
    if (q.maxPrice) filter.finalPrice.$lte = Number(q.maxPrice);
  }
  if (q.includeOutOfStock !== 'true') filter.stock = { $gt: 0 };

  if (q.q) {
    const term = String(q.q).trim().slice(0, 80);
    const rx = new RegExp(escapeRegex(term), 'i');
    const [cats, cols] = await Promise.all([
      Category.find({ name: rx }).select('_id'),
      Collection.find({ title: rx }).select('products'),
    ]);
    and.push({
      $or: [
        { name: rx },
        { sku: rx },
        { tags: rx },
        { subcategory: rx },
        { category: { $in: cats.map((c) => c._id) } },
        { _id: { $in: cols.flatMap((c) => c.products) } },
      ],
    });
  }
  if (and.length) filter.$and = and;
  return filter;
}

const LIST_FIELDS = 'name slug sku price salePrice finalPrice stock images isBestseller isNewArrival category subcategory ratingAvg ratingCount';

export const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const filter = await buildFilter(req.query);
  const sort = SORTS[req.query.sort] || SORTS.best_selling;
  const [products, total] = await Promise.all([
    Product.find(filter).select(LIST_FIELDS).populate('category', 'name slug').sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, products, total, page, pages: Math.ceil(total / limit) });
});

// Facet values for the filter sidebar, scoped to the current category/search.
export const productFilters = asyncHandler(async (req, res) => {
  const base = await buildFilter({ category: req.query.category, collection: req.query.collection, q: req.query.q, newArrival: req.query.newArrival, includeOutOfStock: 'true' });
  const [facets] = await Product.aggregate([
    { $match: base },
    {
      $facet: {
        price: [{ $group: { _id: null, min: { $min: '$finalPrice' }, max: { $max: '$finalPrice' } } }],
        subcategory: [{ $match: { subcategory: { $ne: '' } } }, { $group: { _id: '$subcategory', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        craftsmanship: [{ $match: { craftsmanship: { $ne: '' } } }, { $group: { _id: '$craftsmanship', count: { $sum: 1 } } }],
        occasion: [{ $unwind: '$occasion' }, { $group: { _id: '$occasion', count: { $sum: 1 } } }],
        colors: [{ $unwind: '$colors' }, { $group: { _id: '$colors', count: { $sum: 1 } } }],
        metalType: [{ $match: { metalType: { $ne: '' } } }, { $group: { _id: '$metalType', count: { $sum: 1 } } }],
        stoneType: [{ $match: { stoneType: { $ne: '' } } }, { $group: { _id: '$stoneType', count: { $sum: 1 } } }],
        categories: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
      },
    },
  ]);
  const shape = (arr = []) => arr.map((x) => ({ value: x._id, count: x.count }));
  const cats = await Category.find({ _id: { $in: (facets.categories || []).map((c) => c._id) } }).select('name slug');
  res.json({
    success: true,
    filters: {
      price: facets.price[0] ? { min: facets.price[0].min, max: facets.price[0].max } : { min: 0, max: 0 },
      subcategory: shape(facets.subcategory),
      craftsmanship: shape(facets.craftsmanship),
      occasion: shape(facets.occasion),
      colors: shape(facets.colors),
      metalType: shape(facets.metalType),
      stoneType: shape(facets.stoneType),
      category: cats.map((c) => ({ value: c.slug, label: c.name, count: facets.categories.find((f) => String(f._id) === String(c._id))?.count || 0 })),
    },
  });
});

export const suggest = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 60);
  if (q.length < 2) return res.json({ success: true, products: [] });
  const rx = new RegExp(escapeRegex(q), 'i');
  const products = await Product.find({ isActive: true, $or: [{ name: rx }, { sku: rx }, { tags: rx }] }).select('name slug finalPrice images').limit(6).lean();
  return res.json({ success: true, products });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate('category', 'name slug').populate('collections', 'title slug');
  if (!product) throw new ApiError(404, 'Product not found');
  const related = await Product.find({ category: product.category._id, _id: { $ne: product._id }, isActive: true, stock: { $gt: 0 } })
    .select(LIST_FIELDS).populate('category', 'name slug').sort({ isBestseller: -1, soldCount: -1 }).limit(12).lean();
  const settings = await getSettings();
  res.json({ success: true, product, related, returnWindowDays: product.returnWindowDays ?? settings.returnWindowDays });
});

export const productsByIds = asyncHandler(async (req, res) => {
  const ids = toArray(req.query.ids).slice(0, 20).filter((i) => /^[a-f\d]{24}$/i.test(i));
  const products = await Product.find({ _id: { $in: ids }, isActive: true }).select(LIST_FIELDS).populate('category', 'name slug').lean();
  res.json({ success: true, products });
});

export const deliveryEstimate = asyncHandler(async (req, res) => {
  const pin = String(req.query.pincode || '');
  if (!/^[1-9]\d{5}$/.test(pin)) throw new ApiError(400, 'Enter a valid 6 digit pincode');
  const s = await getSettings();
  res.json({ success: true, pincode: pin, deliverable: true, estimatedDate: addDays(new Date(), s.deliveryDays) });
});

// ---------------- Admin ----------------
export const adminList = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const filter = {};
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: rx }, { sku: rx }, { tags: rx }];
  }
  if (req.query.category) filter.category = req.query.category;
  if (req.query.stock === 'out') filter.stock = 0;
  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, products, total, page, pages: Math.ceil(total / limit) });
});

export const adminGet = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, product });
});

const clean = (body) => {
  const b = { ...body };
  ['occasion', 'colors', 'tags'].forEach((k) => {
    if (b[k] !== undefined) b[k] = toArray(b[k]);
  });
  ['price', 'salePrice', 'stock'].forEach((k) => {
    if (b[k] !== undefined && b[k] !== '') b[k] = Number(b[k]);
  });
  if (b.returnWindowDays === '' || b.returnWindowDays === undefined) b.returnWindowDays = null;
  else b.returnWindowDays = Number(b.returnWindowDays);
  delete b._id;
  delete b.slug;
  delete b.finalPrice;
  delete b.soldCount;
  delete b.ratingAvg;
  delete b.ratingCount;
  return b;
};

const syncCollections = async (productId, ids = []) => {
  await Collection.updateMany({ products: productId, _id: { $nin: ids } }, { $pull: { products: productId } });
  if (ids.length) await Collection.updateMany({ _id: { $in: ids } }, { $addToSet: { products: productId } });
};

export const createProduct = asyncHandler(async (req, res) => {
  const body = clean(req.body);
  if (body.salePrice && body.salePrice >= body.price) throw new ApiError(400, 'Sale price must be lower than the price');
  const slug = await uniqueSlug(Product, req.body.slug || body.name);
  const product = await Product.create({ ...body, slug });
  await syncCollections(product._id, body.collections);
  res.status(201).json({ success: true, product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  const body = clean(req.body);
  if (body.salePrice && body.price !== undefined && body.salePrice >= body.price) throw new ApiError(400, 'Sale price must be lower than the price');
  const removed = (product.images || []).filter((im) => !(body.images || []).some((n) => n.url === im.url));
  product.set(body);
  if (req.body.name && req.body.name !== product.name) product.slug = await uniqueSlug(Product, req.body.name, product._id);
  await product.save();
  if (body.images) await Promise.all(removed.map((im) => removeImage(im.publicId)));
  if (body.collections) await syncCollections(product._id, body.collections);
  res.json({ success: true, product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  await Promise.all((product.images || []).map((im) => removeImage(im.publicId)));
  await syncCollections(product._id, []);
  await product.deleteOne();
  res.json({ success: true });
});
