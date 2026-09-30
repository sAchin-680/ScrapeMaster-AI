'use client';

import { useMoney } from '@/components/PreferencesProvider';

type Props = {
  amount: number | undefined;
  currency: string;
  className?: string;
  /** Hide the ≈ marker, e.g. for illustrative figures. */
  approximate?: boolean;
};

/** Price in the viewer's preferred currency; hover shows the store price. */
export default function Money({ amount, currency, className, approximate = true }: Props) {
  const money = useMoney()(amount, currency);
  return (
    <span className={className} title={money.converted ? `${money.original} at the store` : undefined}>
      {money.converted && approximate && <span className="mr-0.5 opacity-60">≈</span>}
      {money.text}
    </span>
  );
}
