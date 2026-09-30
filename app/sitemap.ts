import type { MetadataRoute } from 'next';
import { getAllProducts } from '@/lib/data/products';
import { siteConfig } from '@/lib/site';

// Rendered per request so builds never need a database connection.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts(500);
  return [
    { url: siteConfig.url, changeFrequency: 'hourly', priority: 1 },
    { url: `${siteConfig.url}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteConfig.url}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    ...products.map((product) => ({
      url: `${siteConfig.url}/products/${product._id}`,
      lastModified: product.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ];
}
