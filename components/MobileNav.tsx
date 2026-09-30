'use client';

import Link from 'next/link';
import {
  CloseButton,
  Popover,
  PopoverBackdrop,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { NAV_LINKS, REPO_URL } from '@/components/nav-links';

/** Section menu for screens too narrow for the inline links. */
export default function MobileNav() {
  return (
    <Popover className="lg:hidden">
      {({ open }) => (
        <>
          <PopoverButton
            className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-paper hover:text-ink data-[open]:bg-paper data-[open]:text-ink"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
          </PopoverButton>

          <PopoverBackdrop
            transition
            className="fixed inset-0 top-16 z-30 bg-ink/20 backdrop-blur-[2px] transition duration-200 data-[closed]:opacity-0"
          />
          <PopoverPanel
            transition
            className="absolute inset-x-0 top-full z-40 border-b border-line bg-surface shadow-xl transition duration-200 ease-out data-[closed]:-translate-y-2 data-[closed]:opacity-0"
          >
            <nav aria-label="Sections" className="container py-3">
              <ul className="flex flex-col">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <CloseButton
                      as={Link}
                      href={link.href}
                      className="flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium transition hover:bg-paper"
                    >
                      {link.label}
                    </CloseButton>
                  </li>
                ))}
                <li className="mt-1 border-t border-line pt-1">
                  <a
                    href={REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg px-3 py-3 text-[15px] text-muted transition hover:bg-paper hover:text-ink"
                  >
                    Source on GitHub <ArrowUpRight className="size-4" aria-hidden />
                  </a>
                </li>
              </ul>
            </nav>
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
}
