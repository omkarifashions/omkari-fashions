import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({ url: { type: String, required: true }, publicId: String }, { _id: false });

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sku: { type: String, required: [true, 'SKU is required'], unique: true, trim: true, uppercase: true },
    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    salePrice: { type: Number, min: 0, default: 0 },
    finalPrice: { type: Number, min: 0, default: 0 },
    stock: { type: Number, default: 0, min: 0 },
    images: [imageSchema],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'] },
    collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
    subcategory: { type: String, default: '', trim: true },
    craftsmanship: { type: String, default: '', trim: true },
    occasion: [{ type: String, trim: true }],
    colors: [{ type: String, trim: true }],
    metalType: { type: String, default: '', trim: true },
    stoneType: { type: String, default: '', trim: true },
    stoneColor: { type: String, default: '', trim: true },
    tags: [{ type: String, lowercase: true, trim: true }],
    specifications: {
      size: { type: String, default: '' },
      colour: { type: String, default: '' },
      designNo: { type: String, default: '' },
      baseMetal: { type: String, default: '' },
      countryOfOrigin: { type: String, default: 'India' },
      brand: { type: String, default: 'Omkari Fashions' },
    },
    isBestseller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isReturnable: { type: Boolean, default: true },
    returnWindowDays: { type: Number, default: null, min: 0 },
    soldCount: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.pre('validate', function setFinal(next) {
  this.finalPrice = this.salePrice > 0 && this.salePrice < this.price ? this.salePrice : this.price;
  next();
});

productSchema.index({ name: 'text', sku: 'text', tags: 'text', description: 'text' }, { weights: { name: 10, sku: 8, tags: 5, description: 1 } });
productSchema.index({ category: 1, isActive: 1, finalPrice: 1 });
productSchema.index({ isBestseller: -1, soldCount: -1 });
productSchema.index({ isNewArrival: 1, createdAt: -1 });
productSchema.index({ collections: 1 });

export default mongoose.model('Product', productSchema);
