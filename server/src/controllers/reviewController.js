import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Testimonial from '../models/Testimonial.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { removeImage } from '../services/uploadService.js';

export async function recalcRating(productId) {
  const [agg] = await Review.aggregate([{ $match: { product: productId, status: 'approved' } }, { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } }]);
  await Product.updateOne({ _id: productId }, { ratingAvg: agg ? Math.round(agg.avg * 10) / 10 : 0, ratingCount: agg ? agg.count : 0 });
}

const deliveredOrder = (userId, productId) => Order.findOne({ user: userId, orderStatus: 'delivered', 'items.product': productId }).sort({ deliveredAt: -1 });

export const productReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, status: 'approved' }).populate('user', 'name').sort({ createdAt: -1 }).limit(50).lean();
  res.json({ success: true, reviews: reviews.map((r) => ({ ...r, user: { name: r.user?.name?.split(' ')[0] || 'Customer' } })) });
});

export const eligibility = asyncHandler(async (req, res) => {
  const order = await deliveredOrder(req.user._id, req.params.productId);
  const existing = await Review.findOne({ user: req.user._id, product: req.params.productId });
  res.json({ success: true, canReview: Boolean(order) && !existing, purchased: Boolean(order), reviewed: Boolean(existing), status: existing?.status });
});

export const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment } = req.body;
  const order = await deliveredOrder(req.user._id, productId);
  if (!order) throw new ApiError(403, 'You can review a product only after it has been delivered to you');
  if (await Review.exists({ user: req.user._id, product: productId })) throw new ApiError(409, 'You have already reviewed this product');
  const { storeImage } = await import('../services/uploadService.js');
  const images = [];
  for (const f of req.files || []) {
    // eslint-disable-next-line no-await-in-loop
    images.push(await storeImage(f, 'reviews'));
  }
  const review = await Review.create({ user: req.user._id, product: productId, order: order._id, rating: Number(rating), comment, images });
  res.status(201).json({ success: true, review });
});

// Admin
export const adminReviews = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const reviews = await Review.find(filter).populate('user', 'name email').populate('product', 'name slug images').sort({ createdAt: -1 }).limit(200).lean();
  res.json({ success: true, reviews });
});

export const adminSetReviewStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) throw new ApiError(400, 'Invalid status');
  const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!review) throw new ApiError(404, 'Review not found');
  await recalcRating(review.product);
  res.json({ success: true, review });
});

export const adminDeleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');
  await Promise.all((review.images || []).map((i) => removeImage(i.publicId)));
  await review.deleteOne();
  await recalcRating(review.product);
  res.json({ success: true });
});

export const adminFeatureReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id).populate('user', 'name');
  if (!review) throw new ApiError(404, 'Review not found');
  if (review.status !== 'approved') throw new ApiError(400, 'Approve the review before featuring it on the homepage');
  const t = await Testimonial.create({ name: review.user?.name || 'Customer', message: review.comment, rating: review.rating, heading: 'Loved it..!' });
  res.status(201).json({ success: true, testimonial: t });
});
