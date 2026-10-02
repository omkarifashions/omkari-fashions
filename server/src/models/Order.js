import mongoose from 'mongoose';
import { orderItemSchema } from './OrderItem.js';

export const ORDER_STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

const addressSchema = new mongoose.Schema(
  { name: String, phone: String, address: String, city: String, state: String, pincode: String },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    shippingAddress: { type: addressSchema, required: true },
    billingAddress: addressSchema,
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: String,
    tax: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['cod', 'razorpay'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refund_pending', 'refunded'], default: 'pending' },
    razorpay: { orderId: String, paymentId: String, signature: String },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'placed' },
    statusHistory: [{ status: String, timestamp: { type: Date, default: Date.now }, note: String, _id: false }],
    cancellation: { reason: String, cancelledAt: Date, cancelledBy: { type: String, enum: ['customer', 'admin', 'system'] } },
    courier: String,
    trackingId: String,
    deliveredAt: Date,
    returnStatus: { type: String, default: 'none' },
    stockRestored: { type: Boolean, default: false },
    idempotencyKey: { type: String },
    notes: String,
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } });

export default mongoose.model('Order', orderSchema);
