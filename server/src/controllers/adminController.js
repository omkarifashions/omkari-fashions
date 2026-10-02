import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import ContactMessage from '../models/ContactMessage.js';
import ReturnRequest from '../models/ReturnRequest.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/helpers.js';

const PAID_FILTER = { orderStatus: { $ne: 'cancelled' }, $or: [{ paymentMethod: 'cod' }, { paymentStatus: 'paid' }] };

export const dashboard = asyncHandler(async (req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);
  const [sales, orders, customers, products, pendingOrders, returnRequests, reviews, messages, daily, byStatus, lowStock, recent, topProducts] = await Promise.all([
    Order.aggregate([{ $match: PAID_FILTER }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.countDocuments({ $nor: [{ paymentMethod: 'razorpay', paymentStatus: 'pending', orderStatus: 'placed' }] }),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments(),
    Order.countDocuments({ orderStatus: { $in: ['placed', 'confirmed', 'packed'] }, $nor: [{ paymentMethod: 'razorpay', paymentStatus: 'pending' }] }),
    ReturnRequest.countDocuments({ status: { $in: ['requested', 'under_review', 'info_requested'] } }),
    Review.countDocuments({ status: 'pending' }),
    ContactMessage.countDocuments({ isRead: false }),
    Order.aggregate([
      { $match: { ...PAID_FILTER, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, sales: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    Product.find({ stock: { $lte: 3 }, isActive: true }).select('name sku stock').sort({ stock: 1 }).limit(6).lean(),
    Order.find().populate('user', 'name').sort({ createdAt: -1 }).limit(6).select('orderNumber total orderStatus createdAt user').lean(),
    Product.find({ soldCount: { $gt: 0 } }).sort({ soldCount: -1 }).limit(5).select('name soldCount').lean(),
  ]);

  // Fill missing days with zeros so the chart is continuous.
  const map = Object.fromEntries(daily.map((d) => [d._id, d]));
  const series = [];
  for (let i = 0; i < 14; i += 1) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, sales: map[key]?.sales || 0, orders: map[key]?.orders || 0 });
  }
  res.json({
    success: true,
    stats: { totalSales: sales[0]?.total || 0, orders, customers, products, pendingOrders, returnRequests, reviews, messages },
    series,
    byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
    lowStock,
    recent,
    topProducts,
  });
});

export const customers = asyncHandler(async (req, res) => {
  const filter = { role: 'customer' };
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const users = await User.find(filter).select('name email phone isActive createdAt lastLoginAt').sort({ createdAt: -1 }).limit(300).lean();
  const stats = await Order.aggregate([
    { $match: { user: { $in: users.map((u) => u._id) } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: { $cond: [{ $and: [{ $ne: ['$orderStatus', 'cancelled'] }, { $or: [{ $eq: ['$paymentMethod', 'cod'] }, { $eq: ['$paymentStatus', 'paid'] }] }] }, '$total', 0] } } } },
  ]);
  const byUser = Object.fromEntries(stats.map((s) => [String(s._id), s]));
  res.json({ success: true, customers: users.map((u) => ({ ...u, orders: byUser[String(u._id)]?.orders || 0, totalSpent: byUser[String(u._id)]?.spent || 0 })) });
});

export const setCustomerStatus = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'customer' });
  if (!user) throw new ApiError(404, 'Customer not found');
  user.isActive = Boolean(req.body.isActive);
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, customer: { _id: user._id, isActive: user.isActive } });
});

export const customerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 }).select('orderNumber total orderStatus paymentMethod paymentStatus createdAt').limit(50).lean();
  res.json({ success: true, orders });
});

export const deleteCustomerData = async (userId) => {
  await Promise.all([Cart.deleteOne({ user: userId }), Wishlist.deleteOne({ user: userId })]);
};
