import { CloudOff } from 'lucide-react';

/** Shown when live store data couldn't be fetched (blocked, slow or offline). */
export default function FeedUnavailable({ what }: { what: string }) {
  return (
    <div className="card flex items-center gap-3 p-5 text-sm text-muted">
      <CloudOff className="size-5 shrink-0 text-accent" aria-hidden />
      <p>
        Couldn&apos;t reach the stores for {what} right now. This usually clears up within
        a few minutes. Search above still works for any product link.
      </p>
    </div>
  );
}
