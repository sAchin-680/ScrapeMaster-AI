import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import Navbar from '@/components/Navbar';
import AnnouncementBar from '@/components/AnnouncementBar';
import Footer from '@/components/Footer';
import { PreferencesProvider } from '@/components/PreferencesProvider';
import { getRates } from '@/lib/fx';
import { getPreferences } from '@/lib/preferences';
import { buildAnnouncements } from '@/lib/announcements';
import { getActiveSales } from '@/lib/data/sales';
import { getPriceSignals } from '@/lib/data/signals';
import { CURRENCIES, getCountry, regionForCountry } from '@/lib/locale';
import { saleSignalFeed } from '@/lib/services/store-feed';
import { filterSalesFor } from '@/lib/sales';
import { siteConfig } from '@/lib/site';
import './globals.css';

const sans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-sans',
  weight: '100 900',
  display: 'swap',
});

const mono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-mono',
  weight: '100 900',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} · ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const preferences = await getPreferences();
  const country = getCountry(preferences.country);
  const [rates, sales, signals] = await Promise.all([
    getRates(),
    getActiveSales(),
    getPriceSignals(CURRENCIES[country.currency].symbol.trim()),
  ]);
  // peek() never blocks rendering; banners appear once the feed has loaded.
  const announcements = buildAnnouncements(
    filterSalesFor(sales, country.code, Date.now(), 21),
    signals,
    saleSignalFeed(regionForCountry(country.code)).peek()?.signals ?? [],
  );

  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        <PreferencesProvider preferences={preferences} rates={rates}>
          <AnnouncementBar items={announcements} />
          <Navbar />
          <main id="content" className="flex-1">
            {children}
          </main>
          <Footer />
        </PreferencesProvider>
      </body>
    </html>
  );
}
