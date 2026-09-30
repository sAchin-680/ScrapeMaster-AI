'use client';

import { Clock, Search } from 'lucide-react';
import Money from '@/components/ui/Money';
import ProductImage from '@/components/ui/ProductImage';
import type { ProductSuggestion } from '@/lib/data/products';
import { cn } from '@/lib/utils';

export type SuggestionItem =
  | { kind: 'query'; value: string }
  | { kind: 'recent'; value: string }
  | { kind: 'product'; product: ProductSuggestion };

export const suggestionId = (index: number) => `search-suggestion-${index}`;

/** Google-style emphasis: what you typed stays regular, the completion is bold. */
function Completion({ text, typed }: { text: string; typed: string }) {
  const prefix = typed.trim().toLowerCase();
  if (prefix && text.startsWith(prefix)) {
    return (
      <span>
        {text.slice(0, prefix.length)}
        <strong className="font-semibold">{text.slice(prefix.length)}</strong>
      </span>
    );
  }
  return <span>{text}</span>;
}

type Props = {
  items: SuggestionItem[];
  activeIndex: number;
  typed: string;
  onPick: (item: SuggestionItem) => void;
  onHover: (index: number) => void;
  onClearRecent: () => void;
};

export default function SuggestionList({
  items,
  activeIndex,
  typed,
  onPick,
  onHover,
  onClearRecent,
}: Props) {
  const showingRecent = items.length > 0 && items.every((i) => i.kind === 'recent');
  const firstQuery = items.findIndex((i) => i.kind === 'query');

  return (
    <div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-line bg-surface shadow-xl shadow-indigo-950/10">
      {showingRecent && (
        <div className="flex items-center justify-between px-4 pb-1 pt-3 text-xs text-muted">
          <span>Recent searches</span>
          <button
            type="button"
            // Keep focus in the input so the list doesn't close before the click lands.
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClearRecent}
            className="rounded px-1.5 py-0.5 hover:bg-paper hover:text-ink"
          >
            Clear
          </button>
        </div>
      )}

      <ul
        id="search-suggestions"
        role="listbox"
        aria-label="Search suggestions"
        className="py-1.5"
      >
        {items.map((item, index) => {
          const active = index === activeIndex;
          const base = cn(
            'flex cursor-pointer items-center gap-3 px-4 py-2 text-sm',
            active ? 'bg-accent-soft/70' : 'hover:bg-paper',
          );
          const common = {
            id: suggestionId(index),
            role: 'option' as const,
            'aria-selected': active,
            className: base,
            onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
            onMouseEnter: () => onHover(index),
            onClick: () => onPick(item),
          };

          if (item.kind === 'product') {
            const p = item.product;
            return (
              <li key={`p-${p._id}`} {...common}>
                <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-line">
                  <ProductImage
                    resize={120}
                    src={p.image ?? ''}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-contain p-1"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{p.title}</span>
                  <span className="text-xs text-muted">Tracked on {p.storeName}</span>
                </span>
                <Money
                  amount={p.currentPrice}
                  currency={p.currency}
                  className="num shrink-0 font-semibold"
                />
              </li>
            );
          }

          return (
            <li key={`${item.kind}-${item.value}`} {...common}>
              {index === firstQuery && index > 0 && (
                <span className="sr-only">Suggested searches</span>
              )}
              {item.kind === 'recent' ? (
                <Clock className="size-4 shrink-0 text-muted" aria-hidden />
              ) : (
                <Search className="size-4 shrink-0 text-muted" aria-hidden />
              )}
              <span className="min-w-0 flex-1 truncate">
                {item.kind === 'recent' ? (
                  item.value
                ) : (
                  <Completion text={item.value} typed={typed} />
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
