import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = { title: 'Terms of Use' };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="30 September 2026">
      <section>
        <h2>What {siteConfig.name} is</h2>
        <p>
          {siteConfig.name} is an informational price tracking tool. It reads publicly
          available product pages, records prices over time and can notify you when a
          price changes. We do not sell products, process payments or act on behalf of any
          retailer.
        </p>
      </section>
      <section>
        <h2>Prices and accuracy</h2>
        <p>
          Prices, stock and offers shown here may be delayed, incomplete or wrong, and
          converted currencies are approximate. Always confirm the final price, seller and
          terms on the retailer&apos;s website before buying. Deal ratings and sale dates
          are estimates, not guarantees.
        </p>
      </section>
      <section>
        <h2>No affiliation and trademarks</h2>
        <p>
          {siteConfig.name} is independent and not affiliated with, endorsed by or
          sponsored by Amazon, Flipkart or any other retailer. Store names, logos and
          product names are trademarks of their respective owners and are used only to
          identify where a listing comes from.
        </p>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <ul>
          <li>
            Do not use the service to overload retailer websites or to bypass their access
            controls.
          </li>
          <li>Do not submit links to private, illegal or harmful content.</li>
          <li>
            Do not attempt to access other users&apos; alerts or the admin interfaces.
          </li>
        </ul>
      </section>
      <section>
        <h2>Liability</h2>
        <p>
          The service is provided &quot;as is&quot; without warranties of any kind. To the
          extent permitted by law, we are not liable for purchasing decisions made using
          information from the service.
        </p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>
          We may update these terms. Continued use after changes means you accept the
          updated terms.
        </p>
      </section>
    </LegalPage>
  );
}
