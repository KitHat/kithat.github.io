import { describe, expect, it } from 'vitest';
import { formatPercent, parsePercent } from '../src/percent';

describe('parsePercent', () => {
  it('turns a percent with up to two decimals into a share with four', () => {
    expect(parsePercent('50')).toBe(0.5);
    expect(parsePercent('33.33')).toBe(0.3333);
    expect(parsePercent('33,3')).toBe(0.333);
    expect(parsePercent(' 0 ')).toBe(0);
    expect(parsePercent('100')).toBe(1);
    expect(parsePercent('12.34')).toBe(0.1234);
  });

  it('rejects junk, out-of-range values and extra precision', () => {
    for (const bad of ['', 'abc', '-1', '100.01', '101', '33.333', '1e2', '.']) {
      expect(parsePercent(bad), bad).toBeNull();
    }
  });
});

describe('formatPercent', () => {
  it('drops trailing zeros', () => {
    expect(formatPercent(0.5)).toBe('50');
    expect(formatPercent(0.3333)).toBe('33.33');
    expect(formatPercent(0.333)).toBe('33.3');
    expect(formatPercent(0.6667)).toBe('66.67');
    expect(formatPercent(1 - 0.3333)).toBe('66.67');
  });
});
