import mongoose from 'mongoose';

export const RETURN_REASONS = ['Damaged Product', 'Wrong Product', 'Product Not as Expected', 'Quality Issue', 'Other'];
export const RETURN_STATUSES = [
  'requested',
  'under_review',
  'info_requested',
  'approved',
  'rejected',
  'pickup_scheduled',
  'item_received',
  'refund_processing',
  'refund_completed',
];

const returnSchema = new mongoose.Schema(
  {
    returnNumber: { type: String, required: true, unique: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderNumber: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    item: { name: String, image: String, price: Number, quantity: Number },
    reason: { type: String, enum: RETURN_REASONS, required: true },
    description: { type: String, default: '', maxlength: 1000 },
    images: [{ url: String, publicId: String, _id: false }],
    refundMethod: { type: String, enum: ['original_payment', 'upi'], required: true },
    upiId: { type: String, select: false },
    refundAmount: { type: Number, required: true },
    refundReference: String,
    status: { type: String, enum: RETURN_STATUSES, default: 'requested' },
    statusHistory: [{ status: String, timestamp: { type: Date, default: Date.now }, note: String, _id: false }],
    adminNotes: { type: String, default: '' },
    customerNotes: [{ message: String, timestamp: { type: Date, default: Date.now }, _id: false }],
    pickupDate: Date,
    deliveredAt: Date,
    eligibleTill: Date,
  },
  { timestamps: true }
);

returnSchema.index({ status: 1, createdAt: -1 });
returnSchema.index({ order: 1, product: 1 });

export default mongoose.model('ReturnRequest', returnSchema);
