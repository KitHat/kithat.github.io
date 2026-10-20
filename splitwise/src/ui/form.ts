import type { Balance } from '../balance';
import type { Entry, EntryInput, EntryKind, Member } from '../db';
import { formatAmount, parseAmount, toInputValue } from '../money';
import { formatPercent, parsePercent } from '../percent';
import { CURRENCIES, DEFAULT_CURRENCY, type Currency } from '../types';
import { h } from './dom';

export interface FormActions {
  onSave(input: EntryInput): Promise<void>;
  onDelete?(): Promise<void>;
  onCancel(): void;
}

const LAST_CURRENCY_KEY = 'splitwise:currency';

function lastCurrency(): Currency {
  try {
    const v = localStorage.getItem(LAST_CURRENCY_KEY);
    if (v && (CURRENCIES as readonly string[]).includes(v)) return v as Currency;
  } catch { /* storage unavailable */ }
  return DEFAULT_CURRENCY;
}

function rememberCurrency(c: Currency): void {
  try { localStorage.setItem(LAST_CURRENCY_KEY, c); } catch { /* storage unavailable */ }
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Form for a new or existing entry. For a new settlement, `debt` prefills who pays whom and how much. */
export function entryFormView(
  kind: EntryKind,
  members: [Member, Member],
  actions: FormActions,
  existing?: Entry,
  debt?: Balance,
): HTMLElement {
  const isExpense = kind === 'expense';
  const initialCurrency = existing?.currency ?? debt?.currency ?? lastCurrency();
  const initialPayer = existing?.paid_by ?? debt?.debtor ?? members[0].id;
  let share = existing?.payer_share ?? 0.5;

  const amount = h('input', {
    type: 'text', inputmode: 'decimal', name: 'amount', required: true, autocomplete: 'off', placeholder: '0.00',
    value: existing ? toInputValue(existing.amount) : debt ? toInputValue(debt.amount) : undefined,
  });
  const currency = h('select', { name: 'currency' }, ...CURRENCIES.map((c) => h('option', { value: c }, c)));
  currency.value = initialCurrency;
  const description = h('input', { type: 'text', name: 'description', value: existing?.description, placeholder: 'Ужин, такси…', maxlength: 200 });
  const payer = h('select', { name: 'paid_by' }, ...members.map((m) => h('option', { value: m.id }, m.name)));
  payer.value = initialPayer;
  const shareRange = h('input', { type: 'range', min: 0, max: 100, step: 1, value: share * 100, 'aria-label': 'Доля плательщика' });
  const shareNumber = h('input', { type: 'text', inputmode: 'decimal', value: formatPercent(share), class: 'share-number', 'aria-label': 'Доля плательщика, %' });
  const date = h('input', { type: 'date', name: 'spent_on', required: true, value: existing?.spent_on ?? today() });
  const hint = h('p', { class: 'hint muted', 'aria-live': 'polite' });
  const error = h('p', { class: 'field-error', 'aria-live': 'polite' });
  const save = h('button', { type: 'submit', class: 'btn primary' }, 'Сохранить');

  const otherName = () => members.find((m) => m.id !== payer.value)!.name;
  const payerName = () => members.find((m) => m.id === payer.value)!.name;

  function updateHint(): void {
    const minor = parseAmount(amount.value);
    if (!isExpense) {
      hint.textContent = `${payerName()} отдаёт ${otherName()}`;
      return;
    }
    if (minor === null) { hint.textContent = ''; return; }
    const owed = minor - Math.round(minor * share);
    hint.textContent = `${otherName()} должен ${payerName()} ${formatAmount(owed, currency.value as Currency)}`;
  }

  // The slider moves in whole percents; the text field takes up to two decimals (33.33).
  shareRange.addEventListener('input', () => {
    share = Number(shareRange.value) / 100;
    shareNumber.value = formatPercent(share);
    shareNumber.removeAttribute('aria-invalid');
    updateHint();
  });
  shareNumber.addEventListener('input', () => {
    const parsed = parsePercent(shareNumber.value);
    shareNumber.toggleAttribute('aria-invalid', parsed === null);
    if (parsed === null) return;
    share = parsed;
    shareRange.value = String(share * 100);
    updateHint();
  });
  for (const el of [amount, currency, payer]) el.addEventListener('input', updateHint);

  const form = h('form', {
    class: 'card form',
    onsubmit: async (ev: Event) => {
      ev.preventDefault();
      error.textContent = '';
      const minor = parseAmount(amount.value);
      if (minor === null) {
        error.textContent = 'Введите сумму больше нуля, например 12.50';
        amount.focus();
        return;
      }
      if (isExpense && parsePercent(shareNumber.value) === null) {
        error.textContent = 'Доля — число от 0 до 100, не больше двух знаков после точки';
        shareNumber.focus();
        return;
      }
      const input: EntryInput = {
        kind,
        description: isExpense ? description.value.trim() : '',
        amount: minor,
        currency: currency.value as Currency,
        paid_by: payer.value,
        payer_share: isExpense ? share : 0,
        spent_on: date.value,
      };
      save.disabled = true;
      try {
        rememberCurrency(input.currency);
        await actions.onSave(input);
      } catch (e) {
        error.textContent = (e as Error).message;
      } finally {
        save.disabled = false;
      }
    },
  },
    h('div', { class: 'row' }, h('label', { class: 'grow' }, 'Сумма', amount), h('label', {}, 'Валюта', currency)),
    isExpense && h('label', {}, 'Описание', description),
    h('label', {}, isExpense ? 'Кто платил' : 'Кто отдаёт', payer),
    isExpense && h('label', {}, 'Доля плательщика, %', h('div', { class: 'share' }, shareRange, shareNumber)),
    h('label', {}, 'Дата', date),
    hint,
    error,
    h('div', { class: 'actions' },
      save,
      h('button', { type: 'button', class: 'btn', onclick: actions.onCancel }, 'Отмена'),
      actions.onDelete && h('button', {
        type: 'button', class: 'btn danger',
        onclick: async () => {
          error.textContent = '';
          try { await actions.onDelete!(); } catch (e) { error.textContent = (e as Error).message; }
        },
      }, 'Удалить'),
    ),
  );

  updateHint();
  const title = existing
    ? (isExpense ? 'Изменить расход' : 'Изменить возврат')
    : (isExpense ? 'Новый расход' : 'Вернуть долг');
  return h('main', { class: 'wrap narrow' }, h('header', { class: 'topbar' }, h('h1', {}, title)), form);
}
