'use client';

import { useMoney } from '@/components/PreferencesProvider';

type Props = { amount: number | undefined; currency: string; className?: string };

/** Price in the viewer's preferred currency; hover shows the store price. */
export default function Money({ amount, currency, className }: Props) {
  const money = useMoney()(amount, currency);
  return (
    <span className={className} title={money.converted ? `${money.original} at the store` : undefined}>
      {money.converted && <span className="mr-0.5 opacity-60">≈</span>}
      {money.text}
    </span>
  );
}
