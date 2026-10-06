import mongoose, { type InferSchemaType, type Model } from 'mongoose';

/** Persisted health of one data source (store + page kind). */
const sourceHealthSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, unique: true },
    store: { type: String, required: true },
    storeName: { type: String, required: true },
    kind: { type: String, required: true },
    recent: { type: [Boolean], default: [] },
    consecutiveFailures: { type: Number, default: 0 },
    lastSuccessAt: Date,
    lastFailureAt: Date,
    lastError: String,
    openUntil: Date,
  },
  { timestamps: true },
);

export type SourceHealthDocument = InferSchemaType<typeof sourceHealthSchema>;

const SourceHealthModel: Model<SourceHealthDocument> =
  (mongoose.models.SourceHealth as Model<SourceHealthDocument>) ||
  mongoose.model<SourceHealthDocument>('SourceHealth', sourceHealthSchema);

export default SourceHealthModel;
