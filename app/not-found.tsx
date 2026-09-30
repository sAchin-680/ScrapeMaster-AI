import Link from 'next/link';
import { PackageX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center py-32 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-surface">
        <PackageX className="size-7 text-muted" aria-hidden />
      </span>
      <p className="num mt-6 text-sm text-muted">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        This product slipped off the radar
      </h1>
      <p className="mt-3 max-w-md text-muted">
        It may have been removed, or the link is incorrect.
      </p>
      <Link href="/#track" className="btn-primary mt-8">
        Track a product
      </Link>
    </div>
  );
}
