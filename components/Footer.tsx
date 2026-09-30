import Logo from '@/components/ui/Logo';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="max-w-sm text-sm text-muted">
            Price history and drop alerts for Amazon products. Not affiliated with Amazon.
          </p>
        </div>
        <p className="eyebrow">© {new Date().getFullYear()} ScrapeMaster</p>
      </div>
    </footer>
  );
}
