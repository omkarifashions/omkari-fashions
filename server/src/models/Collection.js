import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Collection title is required'], trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

collectionSchema.index({ displayOrder: 1 });

export default mongoose.model('Collection', collectionSchema);
