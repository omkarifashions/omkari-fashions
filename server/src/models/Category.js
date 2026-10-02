import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Category name is required'], trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    subcategories: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    showInCircles: { type: Boolean, default: false },
    showOnHome: { type: Boolean, default: false },
    homeTitle: { type: String, default: '' },
    homeSubtitle: { type: String, default: 'Finding eternal beauty in every priceless stone' },
  },
  { timestamps: true }
);

categorySchema.index({ displayOrder: 1 });

export default mongoose.model('Category', categorySchema);
