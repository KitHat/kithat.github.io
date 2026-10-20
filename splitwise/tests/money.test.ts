import { describe, expect, it } from 'vitest';
import { formatAmount, parseAmount } from '../src/money';

describe('parseAmount', () => {
  it('parses integers and decimals into minor units', () => {
    expect(parseAmount('12')).toBe(1200);
    expect(parseAmount('12.5')).toBe(1250);
    expect(parseAmount('12.05')).toBe(1205);
    expect(parseAmount('0.01')).toBe(1);
  });

  it('accepts a comma as decimal separator and ignores spaces', () => {
    expect(parseAmount('12,5')).toBe(1250);
    expect(parseAmount(' 1 200,50 ')).toBe(120050);
  });

  it('rejects junk, zero, negatives and too many decimals', () => {
    for (const bad of ['', 'abc', '0', '0.00', '-5', '1.234', '1.2.3', '1e3', '.']) {
      expect(parseAmount(bad), bad).toBeNull();
    }
  });
});

describe('formatAmount', () => {
  it('formats with two decimals and the currency symbol', () => {
    expect(formatAmount(1250, 'USD')).toBe('$12.50');
    expect(formatAmount(120050, 'GEL')).toBe('1 200.50 ₾');
    expect(formatAmount(5, 'TRY')).toBe('0.05 ₺');
    expect(formatAmount(99900, 'EUR')).toBe('999.00 €');
  });
});
