import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

contactSchema.index({ isRead: 1, createdAt: -1 });

export default mongoose.model('ContactMessage', contactSchema);
