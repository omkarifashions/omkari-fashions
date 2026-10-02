import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Banner title is required'], trim: true },
    subtitle: { type: String, default: '' },
    image: { type: String, required: [true, 'Banner image is required'] },
    mobileImage: { type: String, default: '' },
    showText: { type: Boolean, default: true },
    buttonText: { type: String, default: 'Shop Now' },
    buttonUrl: { type: String, default: '/products' },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

bannerSchema.index({ displayOrder: 1 });

export default mongoose.model('Banner', bannerSchema);
