'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex flex-col items-center py-32 text-center">
      <p className="eyebrow">Something broke</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">We could not load this page</h1>
      <p className="mt-3 max-w-md text-muted">
        This is usually temporary. Try again, and if it keeps happening check back in a few minutes.
      </p>
      {error.digest && <p className="num mt-4 text-xs text-muted">Ref: {error.digest}</p>}
      <button type="button" onClick={reset} className="btn-primary mt-8">
        <RotateCcw className="size-4" aria-hidden /> Try again
      </button>
    </div>
  );
}
