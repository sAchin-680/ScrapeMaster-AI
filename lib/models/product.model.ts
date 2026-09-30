import mongoose, { type InferSchemaType, type Model } from 'mongoose';

const priceHistorySchema = new mongoose.Schema(
  {
    price: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  { email: { type: String, required: true, lowercase: true, trim: true } },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, unique: true },
    currency: { type: String, required: true },
    image: { type: String, required: true },
    title: { type: String, required: true },
    currentPrice: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    priceHistory: { type: [priceHistorySchema], default: [] },
    lowestPrice: Number,
    highestPrice: Number,
    averagePrice: Number,
    discountRate: { type: Number, default: 0 },
    description: String,
    category: String,
    reviewsCount: Number,
    stars: Number,
    isOutOfStock: { type: Boolean, default: false },
    users: { type: [userSchema], default: [] },
  },
  { timestamps: true },
);

productSchema.index({ updatedAt: -1 });
// Serves the similar products query (category match, newest first).
productSchema.index({ category: 1, updatedAt: -1 });

export type ProductDocument = InferSchemaType<typeof productSchema>;

const Product: Model<ProductDocument> =
  (mongoose.models.Product as Model<ProductDocument>) ||
  mongoose.model<ProductDocument>('Product', productSchema);

export default Product;
