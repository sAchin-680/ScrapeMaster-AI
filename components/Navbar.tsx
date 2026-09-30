import Link from 'next/link';
import { Github } from 'lucide-react';
import Logo from '@/components/ui/Logo';

const links = [
  { href: '/#track', label: 'Track' },
  { href: '/#trending', label: 'Trending' },
  { href: '/#how', label: 'How it works' },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/75 backdrop-blur-xl">
      <nav className="container flex h-16 items-center justify-between" aria-label="Main">
        <Link href="/" aria-label="ScrapeMaster home">
          <Logo />
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-full px-4 py-2 text-sm text-muted transition hover:bg-surface hover:text-ink"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/sAchin-680/ScrapeMaster-AI"
            target="_blank"
            rel="noreferrer"
            className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-ink"
            aria-label="Source code on GitHub"
          >
            <Github className="size-[18px]" />
          </a>
          <Link href="/#track" className="btn-primary py-2">
            Start tracking
          </Link>
        </div>
      </nav>
    </header>
  );
}
