import mongoose from 'mongoose';

// Generic editable content block: policy pages, About Us, walk-in experience, etc.
const cmsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '' },
    content: { type: String, default: '' },
    image: { type: String, default: '' },
    items: [{ title: String, text: String, image: String, _id: false }],
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('CMSPage', cmsSchema);
