import Link from 'next/link';
import Logo from '@/components/ui/Logo';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="max-w-sm text-sm text-muted">
            Price history, store comparison and drop alerts for any online store. Not
            affiliated with any retailer.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <nav aria-label="Legal" className="flex gap-4 text-sm">
            <Link href="/privacy" className="text-muted hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="text-muted hover:text-ink">
              Terms
            </Link>
            <Link href="/bot" className="text-muted hover:text-ink">
              Our crawler
            </Link>
          </nav>
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} ScrapeMaster. Store names and logos are
            trademarks of their owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
