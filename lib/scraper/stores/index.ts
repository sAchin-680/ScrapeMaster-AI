import { amazon } from './amazon';
import { flipkart } from './flipkart';
import { generic } from './generic';
import type { StoreAdapter } from './types';

/** Dedicated adapters first; the generic structured-data adapter handles everything else. */
export const adapters: StoreAdapter[] = [amazon, flipkart];

export function resolveStore(url: URL): StoreAdapter {
  return adapters.find((adapter) => adapter.matches(url)) ?? generic;
}

export { amazon, flipkart, generic };
export type { Region, StoreAdapter } from './types';
