// Shares are stored as numeric(5,4), i.e. percents with at most two decimals.
// Work in integer hundredths of a percent so 33.33% is exactly 3333 / 10000.

/** "33,33" → 0.3333. Returns null unless the value is 0–100 with at most two decimals. */
export function parsePercent(input: string): number | null {
  const m = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(input.replace(/\s/g, '').replace(',', '.'));
  if (!m) return null;
  const hundredths = Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
  return hundredths <= 10000 ? hundredths / 10000 : null;
}

/** 0.3333 → "33.33", 0.5 → "50". */
export function formatPercent(share: number): string {
  return String(Math.round(share * 10000) / 100);
}
