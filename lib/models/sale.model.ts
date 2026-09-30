import mongoose, { type InferSchemaType, type Model } from 'mongoose';

const saleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    store: { type: String, required: true, trim: true },
    countries: { type: [String], default: [] },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    url: { type: String, required: true },
    tagline: { type: String, default: '' },
    // False until the retailer officially announces the dates.
    confirmed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

saleSchema.index({ end: 1 });

export type SaleDocument = InferSchemaType<typeof saleSchema>;

const Sale: Model<SaleDocument> =
  (mongoose.models.Sale as Model<SaleDocument>) || mongoose.model<SaleDocument>('Sale', saleSchema);

export default Sale;
