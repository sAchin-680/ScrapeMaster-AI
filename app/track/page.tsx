import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import OpenProduct from '@/components/OpenProduct';

export const metadata: Metadata = { title: 'Opening product', robots: { index: false } };

type Props = { searchParams: Promise<{ url?: string }> };

/**
 * Landing page for store listings clicked on the site. Tracking runs from the
 * client, so crawlers following these links never trigger store requests.
 */
export default async function TrackPage({ searchParams }: Props) {
  const { url } = await searchParams;
  if (!url || !/^https?:\/\//i.test(url)) redirect('/');
  return <OpenProduct url={url} />;
}
