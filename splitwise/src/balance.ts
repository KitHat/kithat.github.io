import { CURRENCIES, type Currency } from './types';

export interface BalanceEntry {
  amount: number;
  currency: Currency;
  paid_by: string;
  payer_share: number;
}

export interface Balance {
  currency: Currency;
  debtor: string;
  creditor: string;
  amount: number;
}

/** How much the member who did not pay owes the payer for one entry, in minor units. */
export function owedByOther(entry: BalanceEntry): number {
  return entry.amount - Math.round(entry.amount * entry.payer_share);
}

/** Net debt per currency between the two members; settled currencies are omitted. */
export function computeBalances(entries: BalanceEntry[], [first, second]: [string, string]): Balance[] {
  // Positive net means `second` owes `first`.
  const net = new Map<Currency, number>();
  for (const entry of entries) {
    const owed = owedByOther(entry);
    net.set(entry.currency, (net.get(entry.currency) ?? 0) + (entry.paid_by === first ? owed : -owed));
  }
  return CURRENCIES.flatMap((currency) => {
    const n = net.get(currency) ?? 0;
    if (n === 0) return [];
    return [n > 0
      ? { currency, debtor: second, creditor: first, amount: n }
      : { currency, debtor: first, creditor: second, amount: -n }];
  });
}
