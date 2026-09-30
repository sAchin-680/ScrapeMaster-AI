'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { ArrowRight, ClipboardPaste, Link2, Loader2 } from 'lucide-react';
import { scrapeAndStoreProduct } from '@/lib/actions';
import { cn, isValidAmazonProductURL } from '@/lib/utils';

const STEPS = ['Fetching page', 'Reading price', 'Saving snapshot'];

export default function Searchbar() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isValidAmazonProductURL(url)) {
      setError('Paste a full Amazon product link, e.g. amazon.com/dp/B0CHX1W1XY');
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
          'group relative flex items-center gap-2 rounded-2xl border bg-surface p-2 shadow-[0_1px_0_rgb(var(--line)),0_20px_40px_-24px_rgb(var(--ink)/.25)] transition',
          error ? 'border-up/60' : 'border-line focus-within:border-ink/40',
        )}
      >
        <Link2 className="ml-2 size-5 shrink-0 text-muted" aria-hidden />
        <label htmlFor="product-url" className="sr-only">
          Amazon product link
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
          placeholder="Paste an Amazon product link"
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
        <button type="submit" className="btn-accent shrink-0 rounded-xl" disabled={!url || isPending}>
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
            <span className="size-1.5 animate-pulse-dot rounded-full bg-accent-ink dark:bg-accent" />
            <span className="num text-xs">
              {step + 1}/{STEPS.length}
            </span>
            {STEPS[step]}…
          </span>
        ) : error ? (
          <span className="text-up">{error}</span>
        ) : (
          <span className="text-muted">Works with amazon.com, .in, .co.uk, .de and more.</span>
        )}
      </p>
    </form>
  );
}
