import Order from '../models/Order.js';
import ReturnRequest, { RETURN_REASONS } from '../models/ReturnRequest.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateReturnNumber, escapeRegex } from '../utils/helpers.js';
import { findOwnedOrder, itemReturnEligibility } from '../services/orderService.js';
import { storeImage } from '../services/uploadService.js';
import { mail } from '../services/emailService.js';
import { upiRegex } from '../validators/schemas.js';
import User from '../models/User.js';

const PROOF_REQUIRED = ['Damaged Product', 'Wrong Product'];

const maskUpi = (upi) => (upi ? upi.replace(/^(.{2}).*(@.+)$/, '$1****$2') : undefined);
const forCustomer = (r) => {
  const o = r.toObject ? r.toObject() : r;
  o.upiMasked = maskUpi(o.upiId);
  delete o.upiId;
  delete o.adminNotes;
  return o;
};

export const createReturn = asyncHandler(async (req, res) => {
  const { orderId, productId, reason, description = '', upiId } = req.body;
  if (!RETURN_REASONS.includes(reason)) throw new ApiError(400, 'Please select a valid return reason');
  const order = await findOwnedOrder(orderId, req.user._id);
  const item = order.items.find((i) => String(i.product) === String(productId));
  if (!item) throw new ApiError(404, 'Product not found in this order');

  const elig = await itemReturnEligibility(order, item);
  if (!elig.eligible) throw new ApiError(400, elig.reason);

  const files = req.files || [];
  if (PROOF_REQUIRED.includes(reason) && files.length === 0) throw new ApiError(400, 'Please upload at least one photo as proof for this return reason');
  if (reason === 'Other' && description.trim().length < 5) throw new ApiError(400, 'Please describe the reason for return');

  const refundMethod = order.paymentMethod === 'cod' ? 'upi' : 'original_payment';
  if (refundMethod === 'upi' && !upiRegex.test(String(upiId || '').trim())) throw new ApiError(400, 'Enter a valid UPI ID (for example name@bank) to receive your refund');

  const images = [];
  for (const f of files) {
    // eslint-disable-next-line no-await-in-loop
    images.push(await storeImage(f, 'returns'));
  }

  const ret = await ReturnRequest.create({
    returnNumber: generateReturnNumber(),
    order: order._id,
    orderNumber: order.orderNumber,
    user: req.user._id,
    product: item.product,
    item: { name: item.name, image: item.image, price: item.price, quantity: item.quantity },
    reason,
    description: description.trim(),
    images,
    refundMethod,
    upiId: refundMethod === 'upi' ? String(upiId).trim() : undefined,
    refundAmount: item.price * item.quantity,
    status: 'requested',
    statusHistory: [{ status: 'requested', note: 'Return requested by customer', timestamp: new Date() }],
    deliveredAt: order.deliveredAt,
    eligibleTill: elig.eligibleTill,
  });
  item.returnStatus = 'requested';
  order.returnStatus = 'requested';
  await order.save();
  mail.returnReceived(req.user, ret);
  mail.adminReturn(ret, req.user);
  res.status(201).json({ success: true, returnRequest: forCustomer(ret) });
});

export const myReturns = asyncHandler(async (req, res) => {
  const rets = await ReturnRequest.find({ user: req.user._id }).select('+upiId').sort({ createdAt: -1 });
  res.json({ success: true, returns: rets.map(forCustomer) });
});

export const getMyReturn = asyncHandler(async (req, res) => {
  const ret = await ReturnRequest.findOne({ _id: req.params.id, user: req.user._id }).select('+upiId');
  if (!ret) throw new ApiError(404, 'Return request not found');
  res.json({ success: true, returnRequest: forCustomer(ret) });
});

// Customer answers an "additional information" request.
export const respondToReturn = asyncHandler(async (req, res) => {
  const ret = await ReturnRequest.findOne({ _id: req.params.id, user: req.user._id });
  if (!ret) throw new ApiError(404, 'Return request not found');
  if (ret.status !== 'info_requested') throw new ApiError(400, 'No additional information was requested');
  const message = String(req.body.message || '').trim();
  if (message.length < 3) throw new ApiError(400, 'Please enter your reply');
  ret.customerNotes.push({ message: message.slice(0, 1000) });
  for (const f of req.files || []) {
    // eslint-disable-next-line no-await-in-loop
    ret.images.push(await storeImage(f, 'returns'));
  }
  ret.status = 'under_review';
  ret.statusHistory.push({ status: 'under_review', note: 'Customer provided additional information', timestamp: new Date() });
  await ret.save();
  res.json({ success: true, returnRequest: forCustomer(ret) });
});

// ---------------- Admin ----------------
const TRANSITIONS = {
  requested: ['under_review', 'approved', 'rejected', 'info_requested'],
  under_review: ['approved', 'rejected', 'info_requested'],
  info_requested: ['approved', 'rejected'],
  approved: ['pickup_scheduled'],
  pickup_scheduled: ['item_received'],
  item_received: ['refund_processing'],
  refund_processing: ['refund_completed'],
  rejected: [],
  refund_completed: [],
};

export const adminListReturns = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ returnNumber: rx }, { orderNumber: rx }, { 'item.name': rx }];
  }
  const rets = await ReturnRequest.find(filter).populate('user', 'name email phone').select('+upiId').sort({ createdAt: -1 }).limit(200).lean();
  res.json({ success: true, returns: rets });
});

export const adminGetReturn = asyncHandler(async (req, res) => {
  const ret = await ReturnRequest.findById(req.params.id).populate('user', 'name email phone').select('+upiId');
  if (!ret) throw new ApiError(404, 'Return request not found');
  const order = await Order.findById(ret.order).select('orderNumber createdAt deliveredAt paymentMethod paymentStatus razorpay total');
  res.json({ success: true, returnRequest: ret, order });
});

export const adminUpdateReturn = asyncHandler(async (req, res) => {
  const ret = await ReturnRequest.findById(req.params.id).select('+upiId');
  if (!ret) throw new ApiError(404, 'Return request not found');
  const { status, note, adminNotes, pickupDate, refundReference } = req.body;
  if (adminNotes !== undefined) ret.adminNotes = String(adminNotes).slice(0, 2000);

  if (status && status !== ret.status) {
    if (!(TRANSITIONS[ret.status] || []).includes(status)) throw new ApiError(400, `Cannot move a return from "${ret.status.replace(/_/g, ' ')}" to "${status.replace(/_/g, ' ')}"`);
    if (['rejected', 'info_requested'].includes(status) && !String(note || '').trim()) throw new ApiError(400, 'Please add a note for the customer');
    if (status === 'pickup_scheduled') {
      if (!pickupDate) throw new ApiError(400, 'Please select a pickup date');
      ret.pickupDate = new Date(pickupDate);
    }
    if (status === 'refund_completed') {
      if (ret.refundMethod === 'upi' && !String(refundReference || '').trim()) throw new ApiError(400, 'Enter the UPI transaction reference for this refund');
      if (refundReference) ret.refundReference = refundReference;
    }
    ret.status = status;
    ret.statusHistory.push({ status, note: note || undefined, timestamp: new Date() });

    const order = await Order.findById(ret.order);
    if (order) {
      const item = order.items.find((i) => String(i.product) === String(ret.product));
      if (item) item.returnStatus = status;
      order.returnStatus = status;
      if (status === 'refund_completed' && ret.refundAmount >= order.total && order.paymentMethod === 'razorpay') order.paymentStatus = 'refunded';
      await order.save();
    }
    const user = await User.findById(ret.user);
    if (user) mail.returnStatus(user, ret);
  }
  await ret.save();
  res.json({ success: true, returnRequest: ret });
});
