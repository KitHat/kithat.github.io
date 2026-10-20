export const CURRENCIES = ['TRY', 'USD', 'EUR', 'GEL'] as const;
export type Currency = (typeof CURRENCIES)[number];
export const DEFAULT_CURRENCY: Currency = 'TRY';
