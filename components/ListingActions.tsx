import { ExternalLink } from 'lucide-react';
import TrackButton from '@/components/TrackButton';

/** Track button plus a compact link out to the store, for store listings. */
export default function ListingActions({
  url,
  storeName,
}: {
  url: string;
  storeName: string;
}) {
  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <TrackButton url={url} label="Track price" variant="soft" />
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="btn-ghost shrink-0 px-2.5 py-2"
        aria-label={`View on ${storeName}`}
        title={`View on ${storeName}`}
      >
        <ExternalLink className="size-4" aria-hidden />
      </a>
    </div>
  );
}
