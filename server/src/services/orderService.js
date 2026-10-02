import Product from '../models/Product.js';
import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import { addDays } from '../utils/helpers.js';
import { getSettings } from './settingsService.js';

export const CANCELLABLE = ['placed', 'confirmed', 'packed'];
export const FLOW = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

export async function computeTotals(cartItems, coupon) {
  const settings = await getSettings();
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  let discount = 0;
  if (coupon) {
    discount = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
    if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
    discount = Math.min(Math.round(discount), subtotal);
  }
  const afterDiscount = subtotal - discount;
  const shippingFee = afterDiscount >= settings.freeShippingAbove || afterDiscount === 0 ? 0 : settings.shippingFee;
  // Prices are inclusive of taxes: show the tax portion contained in the amount.
  const tax = Math.round(afterDiscount - afterDiscount / (1 + settings.taxPercent / 100));
  return { subtotal, discount, shippingFee, tax, total: afterDiscount + shippingFee, settings };
}

/** Atomically reserves stock. Rolls back anything reserved if one line fails. */
export async function reserveStock(items) {
  const done = [];
  try {
    for (const it of items) {
      // eslint-disable-next-line no-await-in-loop
      const res = await Product.updateOne({ _id: it.product, isActive: true, stock: { $gte: it.quantity } }, { $inc: { stock: -it.quantity, soldCount: it.quantity } });
      if (res.modifiedCount !== 1) throw new ApiError(409, `Sorry, "${it.name}" does not have enough stock`);
      done.push(it);
    }
  } catch (e) {
    await Promise.all(done.map((it) => Product.updateOne({ _id: it.product }, { $inc: { stock: it.quantity, soldCount: -it.quantity } })));
    throw e;
  }
}

export async function restoreStock(order) {
  if (order.stockRestored) return;
  await Promise.all(order.items.map((it) => Product.updateOne({ _id: it.product }, { $inc: { stock: it.quantity, soldCount: -it.quantity } })));
  order.stockRestored = true;
}

export const pushStatus = (order, status, note) => {
  order.orderStatus = status;
  order.statusHistory.push({ status, note, timestamp: new Date() });
};

/** Computes return eligibility for a delivered order line. */
export async function itemReturnEligibility(order, item) {
  const settings = await getSettings();
  if (!settings.returnsEnabled) return { eligible: false, reason: 'Returns are currently disabled' };
  if (order.orderStatus !== 'delivered' || !order.deliveredAt) return { eligible: false, reason: 'Return is available only after delivery' };
  if (!item.isReturnable) return { eligible: false, reason: 'This product is non-returnable' };
  const days = item.returnWindowDays ?? settings.returnWindowDays;
  const till = addDays(order.deliveredAt, days);
  if (new Date() > till) return { eligible: false, reason: `Return window of ${days} days has ended`, eligibleTill: till };
  if (item.returnStatus && item.returnStatus !== 'none') return { eligible: false, reason: 'A return has already been requested', eligibleTill: till };
  return { eligible: true, eligibleTill: till, windowDays: days };
}

export async function decorateOrder(orderDoc) {
  const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
  order.canCancel = CANCELLABLE.includes(order.orderStatus);
  order.items = await Promise.all(
    order.items.map(async (it) => ({ ...it, returnEligibility: await itemReturnEligibility(order, it) }))
  );
  return order;
}

export const findOwnedOrder = async (id, userId) => {
  const order = await Order.findOne({ _id: id, user: userId });
  if (!order) throw new ApiError(404, 'Order not found');
  return order;
};
