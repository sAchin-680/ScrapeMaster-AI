import mongoose, { type InferSchemaType, type Model } from 'mongoose';

/** Last successful result of a live store feed, served when stores can't be reached. */
const feedSnapshotSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true, minimize: false },
);

export type FeedSnapshotDocument = InferSchemaType<typeof feedSnapshotSchema>;

const FeedSnapshot: Model<FeedSnapshotDocument> =
  (mongoose.models.FeedSnapshot as Model<FeedSnapshotDocument>) ||
  mongoose.model<FeedSnapshotDocument>('FeedSnapshot', feedSnapshotSchema);

export default FeedSnapshot;
