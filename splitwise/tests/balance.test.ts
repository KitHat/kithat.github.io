import { describe, expect, it } from 'vitest';
import { computeBalances, owedByOther, type BalanceEntry } from '../src/balance';

const A = 'a';
const B = 'b';
const members: [string, string] = [A, B];

const e = (amount: number, paid_by: string, payer_share: number, currency: BalanceEntry['currency'] = 'USD'): BalanceEntry =>
  ({ amount, paid_by, payer_share, currency });

describe('owedByOther', () => {
  it('rounds the payer share to the nearest minor unit', () => {
    expect(owedByOther(e(1001, A, 0.3333))).toBe(1001 - 334);
    expect(owedByOther(e(1000, A, 0.5))).toBe(500);
    expect(owedByOther(e(1000, A, 1))).toBe(0);
    expect(owedByOther(e(1000, A, 0))).toBe(1000);
  });
});

describe('computeBalances', () => {
  it('returns nothing when there are no entries', () => {
    expect(computeBalances([], members)).toEqual([]);
  });

  it('makes the non-payer the debtor', () => {
    expect(computeBalances([e(1000, A, 0.5)], members)).toEqual([
      { currency: 'USD', debtor: B, creditor: A, amount: 500 },
    ]);
  });

  it('nets expenses paid by both members', () => {
    const r = computeBalances([e(1000, A, 0.5), e(3000, B, 0.5)], members);
    expect(r).toEqual([{ currency: 'USD', debtor: A, creditor: B, amount: 1000 }]);
  });

  it('drops a currency once a settlement covers the debt exactly', () => {
    const r = computeBalances([e(1001, A, 0.3333), e(667, B, 0)], members);
    expect(r).toEqual([]);
  });

  it('keeps currencies independent and in a stable order', () => {
    const r = computeBalances(
      [e(2000, A, 0.5, 'TRY'), e(1000, B, 0.5, 'USD'), e(400, A, 0.25, 'GEL'), e(600, B, 0.5, 'EUR')],
      members,
    );
    expect(r).toEqual([
      { currency: 'TRY', debtor: B, creditor: A, amount: 1000 },
      { currency: 'USD', debtor: A, creditor: B, amount: 500 },
      { currency: 'EUR', debtor: A, creditor: B, amount: 300 },
      { currency: 'GEL', debtor: B, creditor: A, amount: 300 },
    ]);
  });
});
