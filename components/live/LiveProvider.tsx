'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { LiveProductUpdate } from '@/types';

export type LiveStatus = 'connecting' | 'live' | 'offline';

type LiveContextValue = {
  status: LiveStatus;
  updates: Record<string, LiveProductUpdate>;
  lastEventAt: number | null;
};

const LiveContext = createContext<LiveContextValue>({ status: 'connecting', updates: {}, lastEventAt: null });

type Props = {
  children: ReactNode;
  /** Restrict the stream to these products; omit to receive every change. */
  productIds?: string[];
  /** Re-render server components when a change arrives. */
  refreshOnUpdate?: boolean;
};

export function LiveProvider({ children, productIds, refreshOnUpdate = true }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<LiveStatus>('connecting');
  const [updates, setUpdates] = useState<Record<string, LiveProductUpdate>>({});
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>();
  const idsKey = productIds?.join(',') ?? '';

  useEffect(() => {
    let source: EventSource | null = null;
    let cursor = new Date().toISOString();

    const connect = () => {
      const params = new URLSearchParams({ since: cursor });
      if (idsKey) params.set('ids', idsKey);
      source = new EventSource(`/api/stream?${params}`);
      setStatus('connecting');

      source.addEventListener('ready', () => setStatus('live'));
      source.addEventListener('product', (event) => {
        const update = JSON.parse((event as MessageEvent).data) as LiveProductUpdate;
        cursor = update.updatedAt;
        setUpdates((prev) => ({ ...prev, [update.id]: update }));
        setLastEventAt(Date.now());

        if (refreshOnUpdate) {
          clearTimeout(refreshTimer.current);
          refreshTimer.current = setTimeout(() => router.refresh(), 800);
        }
      });
      // The browser retries automatically; reflect that in the UI.
      source.onerror = () => setStatus(source?.readyState === EventSource.CLOSED ? 'offline' : 'connecting');
    };

    const disconnect = () => {
      source?.close();
      source = null;
    };

    // Don't hold a connection open for background tabs.
    const onVisibility = () => {
      if (document.hidden) {
        disconnect();
        setStatus('offline');
      } else if (!source) {
        connect();
        router.refresh();
      }
    };

    connect();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearTimeout(refreshTimer.current);
      disconnect();
    };
  }, [idsKey, refreshOnUpdate, router]);

  return <LiveContext.Provider value={{ status, updates, lastEventAt }}>{children}</LiveContext.Provider>;
}

export function useLive() {
  return useContext(LiveContext);
}

export function useLiveProduct(id: string) {
  return useContext(LiveContext).updates[id];
}
