import type { Currency } from './types';

const SYMBOLS: Record<Currency, { sign: string; prefix: boolean }> = {
  USD: { sign: '$', prefix: true },
  GEL: { sign: '₾', prefix: false },
  TRY: { sign: '₺', prefix: false },
  EUR: { sign: '€', prefix: false },
};

/** Parses user input like "12,5" or "1 200.50" into minor units. Returns null for anything invalid or not positive. */
export function parseAmount(input: string): number | null {
  const s = input.replace(/\s/g, '').replace(',', '.');
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const minor = Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
  return minor > 0 && Number.isSafeInteger(minor) ? minor : null;
}

/** Plain decimal string for an input field, e.g. 1250 → "12.50". */
export function toInputValue(minor: number): string {
  return (minor / 100).toFixed(2);
}

export function formatAmount(minor: number, currency: Currency): string {
  const whole = Math.floor(minor / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const value = `${whole}.${String(minor % 100).padStart(2, '0')}`;
  const { sign, prefix } = SYMBOLS[currency];
  return prefix ? `${sign}${value}` : `${value} ${sign}`;
}
