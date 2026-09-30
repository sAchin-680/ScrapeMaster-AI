'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Bell, Check, Loader2, Mail, X } from 'lucide-react';
import { addUserEmailToProduct } from '@/lib/actions';

type Status =
  | { type: 'idle' }
  | { type: 'error'; message: string }
  | { type: 'done'; already: boolean };

export default function TrackModal({
  productId,
  title,
}: {
  productId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>({ type: 'idle' });
  const [isPending, startTransition] = useTransition();

  const close = () => {
    setOpen(false);
    // Reset after the exit transition so content doesn't flash.
    setTimeout(() => setStatus({ type: 'idle' }), 200);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await addUserEmailToProduct(productId, email);
      if (result.ok) {
        setStatus({ type: 'done', already: result.data.alreadyTracking });
        setEmail('');
      } else {
        setStatus({ type: 'error', message: result.error });
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary w-full py-3.5 text-[15px]"
      >
        <Bell className="size-4" aria-hidden />
        Alert me on price drops
      </button>

      <Dialog open={open} onClose={close} className="relative z-50">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition duration-200 data-[closed]:opacity-0"
        />
        <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
          <DialogPanel
            transition
            className="card w-full max-w-md rounded-b-none p-6 shadow-2xl transition duration-300 ease-out data-[closed]:translate-y-8 data-[closed]:opacity-0 sm:rounded-2xl sm:data-[closed]:scale-95 sm:data-[closed]:translate-y-0"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-ink">
                <Bell className="size-5" aria-hidden />
              </span>
              <button
                type="button"
                onClick={close}
                className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-paper hover:text-ink"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {status.type === 'done' ? (
              <div className="mt-5">
                <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Check className="size-5 text-down" aria-hidden />
                  {status.already ? 'Already on your watchlist' : 'You are all set'}
                </DialogTitle>
                <p className="mt-2 text-sm text-muted">
                  {status.already
                    ? 'This email is already tracking this product.'
                    : 'Check your inbox for a confirmation. We will email you when the price moves.'}
                </p>
                <button type="button" onClick={close} className="btn-ghost mt-6 w-full">
                  Done
                </button>
              </div>
            ) : (
              <>
                <DialogTitle className="mt-5 text-lg font-semibold">
                  Get price drop alerts
                </DialogTitle>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted">
                  We will email you when <span className="text-ink">{title}</span> hits a
                  new low, drops 40%+, or comes back in stock.
                </p>

                <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
                  <label htmlFor="alert-email" className="text-sm font-medium">
                    Email address
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 focus-within:border-ink/40">
                    <Mail className="size-4 text-muted" aria-hidden />
                    <input
                      id="alert-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="min-w-0 flex-1 bg-transparent py-3 text-[15px] outline-none"
                    />
                  </div>
                  {status.type === 'error' && (
                    <p role="alert" className="text-sm text-up">
                      {status.message}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="btn-primary mt-2 py-3.5"
                    disabled={isPending || !email}
                  >
                    {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    {isPending ? 'Saving' : 'Track this product'}
                  </button>
                  <p className="text-center text-xs text-muted">
                    No spam. One email per price event.
                  </p>
                </form>
              </>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
