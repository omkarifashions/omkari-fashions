import mongoose from 'mongoose';

// OrderItem is embedded in Order so each purchase is a permanent snapshot
// (price / name never change if the product is edited later).
export const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  slug: String,
  sku: String,
  image: String,
  price: { type: Number, required: true },
  mrp: Number,
  quantity: { type: Number, required: true, min: 1 },
  isReturnable: { type: Boolean, default: true },
  returnWindowDays: { type: Number, default: 7 },
  returnStatus: { type: String, default: 'none' },
});

export default orderItemSchema;
