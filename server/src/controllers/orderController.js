import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateOrderNumber, escapeRegex } from '../utils/helpers.js';
import { computeTotals, reserveStock, restoreStock, pushStatus, CANCELLABLE, FLOW, decorateOrder, findOwnedOrder } from '../services/orderService.js';
import { mail } from '../services/emailService.js';
import { buildInvoice, buildShippingLabel } from '../services/pdfService.js';
import { getSettings } from '../services/settingsService.js';

const razorpayClient = () => {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) throw new ApiError(503, 'Online payments are not configured yet. Please choose Cash on Delivery.');
  return new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret });
};

export async function validateCoupon(code, subtotal) {
  if (!code) return null;
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase(), isActive: true });
  if (!coupon) throw new ApiError(400, 'Invalid coupon code');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError(400, 'This coupon has expired');
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'This coupon has reached its usage limit');
  if (subtotal < coupon.minOrderValue) throw new ApiError(400, `Add items worth Rs. ${coupon.minOrderValue} to use this coupon`);
  return coupon;
}

const razorpayPayload = (order) => ({ keyId: env.razorpayKeyId, razorpayOrderId: order.razorpay.orderId, amount: Math.round(order.total * 100), currency: 'INR' });

export const applyCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'finalPrice');
  const subtotal = (cart?.items || []).reduce((s, i) => s + (i.product?.finalPrice || 0) * i.quantity, 0);
  const coupon = await validateCoupon(req.body.code, subtotal);
  const totals = await computeTotals([{ price: subtotal, quantity: 1 }], coupon);
  res.json({ success: true, code: coupon.code, discount: totals.discount, description: coupon.description });
});

export const quote = asyncHandler(async (req, res) => {
  const { items } = await lineItems(req.user._id, req.query.buyNowProduct, req.query.buyNowQty);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const coupon = req.query.couponCode ? await validateCoupon(req.query.couponCode, subtotal).catch(() => null) : null;
  const t = await computeTotals(items, coupon);
  res.json({ success: true, subtotal: t.subtotal, discount: t.discount, shippingFee: t.shippingFee, tax: t.tax, total: t.total, deliveryDays: t.settings.deliveryDays, codEnabled: t.settings.codEnabled });
});

async function lineItems(userId, buyNowProduct, buyNowQty) {
  const settings = await getSettings();
  const build = (product, quantity) => {
    if (!product || !product.isActive) throw new ApiError(409, 'One of the products is no longer available');
    if (product.stock < quantity) throw new ApiError(409, `"${product.name}" only has ${product.stock} left in stock`);
    return {
      product: product._id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      image: product.images?.[0]?.url || '',
      price: product.finalPrice,
      mrp: product.price,
      quantity,
      isReturnable: product.isReturnable,
      returnWindowDays: product.returnWindowDays ?? settings.returnWindowDays,
    };
  };
  if (buyNowProduct) {
    const product = await Product.findById(buyNowProduct);
    return { items: [build(product, Math.max(1, Math.min(20, Number(buyNowQty) || 1)))], fromCart: false };
  }
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Your cart is empty');
  return { items: cart.items.map((i) => build(i.product, i.quantity)), fromCart: true };
}

export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, couponCode, idempotencyKey, buyNowProduct, buyNowQty } = req.body;
  const settings = await getSettings();
  if (paymentMethod === 'cod' && !settings.codEnabled) throw new ApiError(400, 'Cash on Delivery is currently unavailable');

  // Repeated clicks / retries with the same key return the same order instead of creating a duplicate.
  const existing = await Order.findOne({ user: req.user._id, idempotencyKey });
  if (existing) {
    return res.json({ success: true, order: existing, duplicate: true, ...(existing.paymentMethod === 'razorpay' && existing.paymentStatus === 'pending' ? { payment: razorpayPayload(existing) } : {}) });
  }

  const { items, fromCart } = await lineItems(req.user._id, buyNowProduct, buyNowQty);
  const rawSubtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const coupon = await validateCoupon(couponCode, rawSubtotal);
  const totals = await computeTotals(items, coupon);

  await reserveStock(items);

  let order;
  try {
    order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: req.user._id,
      items,
      shippingAddress,
      billingAddress: shippingAddress,
      subtotal: totals.subtotal,
      discount: totals.discount,
      couponCode: coupon?.code,
      tax: totals.tax,
      shippingFee: totals.shippingFee,
      total: totals.total,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'placed',
      statusHistory: [{ status: 'placed', note: 'Order placed', timestamp: new Date() }],
      idempotencyKey,
    });

    if (paymentMethod === 'razorpay') {
      const rp = await razorpayClient().orders.create({ amount: Math.round(order.total * 100), currency: 'INR', receipt: order.orderNumber, notes: { orderId: String(order._id) } });
      order.razorpay = { orderId: rp.id };
      await order.save();
    }
  } catch (err) {
    if (order) await Order.deleteOne({ _id: order._id });
    await Promise.all(items.map((it) => Product.updateOne({ _id: it.product }, { $inc: { stock: it.quantity, soldCount: -it.quantity } })));
    throw err;
  }

  if (coupon) await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } });

  if (paymentMethod === 'cod') {
    if (fromCart) await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
    mail.orderConfirmation(req.user, order);
    mail.adminNewOrder(order, req.user);
    return res.status(201).json({ success: true, order });
  }
  return res.status(201).json({ success: true, order, payment: razorpayPayload(order), fromCart });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id: rpOrder, razorpay_payment_id: rpPayment, razorpay_signature: rpSig } = req.body;
  const order = await findOwnedOrder(orderId, req.user._id);
  if (order.paymentMethod !== 'razorpay') throw new ApiError(400, 'This order is not an online payment order');
  if (order.paymentStatus === 'paid') return res.json({ success: true, order });
  if (order.orderStatus === 'cancelled') throw new ApiError(400, 'This order was cancelled');
  if (!rpOrder || !rpPayment || !rpSig || rpOrder !== order.razorpay.orderId) throw new ApiError(400, 'Invalid payment details');

  const expected = crypto.createHmac('sha256', env.razorpayKeySecret).update(`${rpOrder}|${rpPayment}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(rpSig));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    order.paymentStatus = 'failed';
    await order.save();
    throw new ApiError(400, 'Payment verification failed. If money was deducted it will be refunded automatically.');
  }
  order.paymentStatus = 'paid';
  order.razorpay = { orderId: rpOrder, paymentId: rpPayment, signature: rpSig };
  order.statusHistory.push({ status: 'payment_received', note: 'Online payment received', timestamp: new Date() });
  await order.save();
  await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
  mail.paymentReceived(req.user, order);
  mail.orderConfirmation(req.user, order);
  mail.adminNewOrder(order, req.user);
  res.json({ success: true, order });
});

export const paymentFailed = asyncHandler(async (req, res) => {
  const order = await findOwnedOrder(req.body.orderId, req.user._id);
  if (order.paymentMethod === 'razorpay' && order.paymentStatus === 'pending' && order.orderStatus === 'placed') {
    order.paymentStatus = 'failed';
    pushStatus(order, 'cancelled', 'Payment failed or was cancelled');
    order.cancellation = { reason: 'Payment failed', cancelledAt: new Date(), cancelledBy: 'system' };
    await restoreStock(order);
    await order.save();
  }
  res.json({ success: true, order });
});

export const myOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 10;
  // Unpaid online orders are hidden until payment succeeds or fails.
  const filter = { user: req.user._id, $nor: [{ paymentMethod: 'razorpay', paymentStatus: 'pending' }] };
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, orders: await Promise.all(orders.map(decorateOrder)), total, pages: Math.ceil(total / limit), page });
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await findOwnedOrder(req.params.id, req.user._id);
  res.json({ success: true, order: await decorateOrder(order) });
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await findOwnedOrder(req.params.id, req.user._id);
  if (!CANCELLABLE.includes(order.orderStatus)) throw new ApiError(400, order.orderStatus === 'cancelled' ? 'This order is already cancelled' : 'This order can no longer be cancelled because it has been shipped');
  const reason = String(req.body.reason || 'Cancelled by customer').slice(0, 300);
  pushStatus(order, 'cancelled', reason);
  order.cancellation = { reason, cancelledAt: new Date(), cancelledBy: 'customer' };
  if (order.paymentStatus === 'paid') order.paymentStatus = 'refund_pending';
  await restoreStock(order);
  await order.save();
  mail.orderStatus(req.user, order);
  res.json({ success: true, order: await decorateOrder(order) });
});

export const myInvoice = asyncHandler(async (req, res) => {
  const order = await findOwnedOrder(req.params.id, req.user._id);
  await sendPdf(res, `invoice-${order.orderNumber}.pdf`, (doc) => buildInvoice(doc, order, req.user));
});

async function sendPdf(res, filename, build) {
  const PDFDocument = (await import('pdfkit')).default;
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  await build(doc);
  doc.end();
}

// ---------------- Admin ----------------
export const adminOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const filter = { $nor: [{ paymentMethod: 'razorpay', paymentStatus: 'pending', orderStatus: 'placed' }] };
  if (req.query.status) filter.orderStatus = req.query.status;
  if (req.query.payment) filter.paymentMethod = req.query.payment;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(`${req.query.to}T23:59:59`);
  }
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ orderNumber: rx }, { 'shippingAddress.name': rx }, { 'shippingAddress.phone': rx }, { 'items.name': rx }];
  }
  const [orders, total] = await Promise.all([
    Order.find(filter).populate('user', 'name email phone').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, orders, total, pages: Math.ceil(total / limit), page });
});

export const adminGetOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ success: true, order: await decorateOrder(order) });
});

export const adminUpdateStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');
  const { status, note, courier, trackingId } = req.body;
  if (order.orderStatus === 'cancelled') throw new ApiError(400, 'Cancelled orders cannot be updated');
  if (order.orderStatus === 'delivered') throw new ApiError(400, 'Delivered orders cannot be updated');

  if (status === 'cancelled') {
    pushStatus(order, 'cancelled', note || 'Cancelled by admin');
    order.cancellation = { reason: note || 'Cancelled by admin', cancelledAt: new Date(), cancelledBy: 'admin' };
    if (order.paymentStatus === 'paid') order.paymentStatus = 'refund_pending';
    await restoreStock(order);
  } else {
    const from = FLOW.indexOf(order.orderStatus);
    const to = FLOW.indexOf(status);
    if (to === -1) throw new ApiError(400, 'Invalid status');
    if (to <= from) throw new ApiError(400, 'Order status can only move forward');
    if (order.paymentMethod === 'razorpay' && order.paymentStatus !== 'paid') throw new ApiError(400, 'Online payment has not been received for this order');
    pushStatus(order, status, note || undefined);
    if (courier !== undefined) order.courier = courier;
    if (trackingId !== undefined) order.trackingId = trackingId;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
      if (order.paymentMethod === 'cod') order.paymentStatus = 'paid';
    }
  }
  await order.save();
  mail.orderStatus(order.user, order);
  res.json({ success: true, order: await decorateOrder(order) });
});

export const adminMarkRefunded = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.paymentStatus !== 'refund_pending') throw new ApiError(400, 'No refund is pending for this order');
  order.paymentStatus = 'refunded';
  order.statusHistory.push({ status: 'refunded', note: req.body.note || 'Refund completed', timestamp: new Date() });
  await order.save();
  res.json({ success: true, order });
});

export const adminInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) throw new ApiError(404, 'Order not found');
  await sendPdf(res, `invoice-${order.orderNumber}.pdf`, (doc) => buildInvoice(doc, order, order.user));
});

export const adminShippingLabel = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) throw new ApiError(404, 'Order not found');
  const doc = new (await import('pdfkit')).default({ size: [298, 420], margin: 16 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="label-${order.orderNumber}.pdf"`);
  doc.pipe(res);
  await buildShippingLabel(doc, order);
  doc.end();
});
