import type { MetadataRoute } from 'next';
import { getAllProducts } from '@/lib/data/products';
import { siteConfig } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts(500);
  return [
    { url: siteConfig.url, changeFrequency: 'hourly', priority: 1 },
    ...products.map((product) => ({
      url: `${siteConfig.url}/products/${product._id}`,
      lastModified: product.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ];
}
