'use client';

import { useEffect } from 'react';

const SETTLE_MS = 4_000;

/**
 * Scroll to the URL hash once the page's real content has mounted, and keep
 * it aligned while streamed sections above it finish loading. Next.js scrolls
 * while the loading skeleton is showing, when anchors like #deals don't exist
 * yet, so links from other pages would otherwise land in the wrong place.
 * Stops as soon as the visitor scrolls themselves.
 */
export default function HashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;

    const align = () => document.getElementById(id)?.scrollIntoView({ block: 'start' });
    const observer = new ResizeObserver(align);
    const stop = () => {
      observer.disconnect();
      clearTimeout(timer);
      for (const event of ['wheel', 'touchstart', 'keydown'] as const) {
        window.removeEventListener(event, stop);
      }
    };

    requestAnimationFrame(align);
    observer.observe(document.body);
    const timer = setTimeout(stop, SETTLE_MS);
    for (const event of ['wheel', 'touchstart', 'keydown'] as const) {
      window.addEventListener(event, stop, { passive: true });
    }
    return stop;
  }, []);

  return null;
}
