'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { ArrowRight, ClipboardPaste, Link2, Loader2 } from 'lucide-react';
import { scrapeAndStoreProduct } from '@/lib/actions';
import { usePreferences } from '@/components/PreferencesProvider';
import { getCountry } from '@/lib/locale';
import { cn, isValidProductURL } from '@/lib/utils';

const STEPS = ['Fetching page', 'Reading price', 'Saving snapshot'];

export default function Searchbar() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const country = getCountry(usePreferences().preferences.country);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isValidProductURL(url)) {
      setError('Paste the full link of a product page, starting with https://');
      return;
    }

    setStep(0);
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2200);

    startTransition(async () => {
      const result = await scrapeAndStoreProduct(url);
      clearInterval(timer);
      if (result.ok) {
        router.push(`/products/${result.data.id}`);
      } else {
        setError(result.error);
      }
    });
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text.trim());
      setError(null);
    } catch {
      // Clipboard permission denied; the user can still paste manually.
    }
  };

  return (
    <form onSubmit={submit} className="w-full" noValidate>
      <div
        className={cn(
          'group relative flex items-center gap-2 rounded-xl border bg-surface p-1.5 shadow-sm transition focus-within:ring-4 focus-within:ring-accent/10',
          error ? 'border-up/60' : 'border-line focus-within:border-accent/60',
        )}
      >
        <Link2 className="ml-2 size-5 shrink-0 text-muted" aria-hidden />
        <label htmlFor="product-url" className="sr-only">
          Product link
        </label>
        <input
          id="product-url"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Paste a product link from any store"
          aria-invalid={Boolean(error)}
          aria-describedby="product-url-status"
          disabled={isPending}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] outline-none placeholder:text-muted/80"
        />
        {!url && !isPending && (
          <button
            type="button"
            onClick={paste}
            className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted transition hover:bg-paper hover:text-ink sm:inline-flex"
          >
            <ClipboardPaste className="size-3.5" aria-hidden />
            Paste
          </button>
        )}
        <button type="submit" className="btn-accent shrink-0" disabled={!url || isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <ArrowRight className="size-4" aria-hidden />
          )}
          <span className="hidden sm:inline">{isPending ? 'Tracking' : 'Track price'}</span>
        </button>
      </div>

      <p id="product-url-status" role="status" aria-live="polite" className="mt-3 min-h-5 text-sm">
        {isPending ? (
          <span className="inline-flex items-center gap-2 text-muted">
            <span className="size-1.5 animate-pulse-dot rounded-full bg-accent" />
            <span className="num text-xs">
              {step + 1}/{STEPS.length}
            </span>
            {STEPS[step]}…
          </span>
        ) : error ? (
          <span className="text-up">{error}</span>
        ) : (
          <span className="text-muted">
            {country.flag} Works with {country.stores.slice(0, 3).join(', ')} and any store with product
            pages.
          </span>
        )}
      </p>
    </form>
  );
}
