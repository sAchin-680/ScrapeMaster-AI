'use client';

import { useEffect } from 'react';

/**
 * Scroll to the URL hash once the page's real content has mounted. Next.js
 * tries to scroll while the loading skeleton is showing, when anchors like
 * #deals don't exist yet, so links from other pages would land at the top.
 */
export default function HashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return null;
}
