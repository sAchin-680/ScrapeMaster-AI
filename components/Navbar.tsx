import Link from 'next/link';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import MobileNav from '@/components/MobileNav';
import { NAV_LINKS, REPO_URL } from '@/components/nav-links';
import Logo from '@/components/ui/Logo';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/80 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/70">
      <nav className="container flex h-16 items-center justify-between" aria-label="Main">
        <Link href="/" aria-label="ScrapeMaster home">
          <Logo />
        </Link>
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-md px-3.5 py-2 text-sm text-muted transition hover:text-ink"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1 sm:gap-2">
          <LocaleSwitcher />
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden size-9 place-items-center rounded-lg text-muted sm:grid transition hover:bg-paper hover:text-ink"
            aria-label="Source code on GitHub"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-[18px]"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
            </svg>
          </a>
          {/* On the narrowest phones the menu carries "Track", so the button makes room. */}
          <Link
            href="/#track"
            className="btn-primary whitespace-nowrap px-3 max-[359px]:hidden sm:px-4"
          >
            <span className="sm:hidden">Track</span>
            <span className="hidden sm:inline">Start tracking</span>
          </Link>
          <MobileNav />
        </div>
      </nav>
    </header>
  );
}
