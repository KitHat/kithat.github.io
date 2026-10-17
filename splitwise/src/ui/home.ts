import { computeBalances } from '../balance';
import type { Entry, Member } from '../db';
import { formatAmount } from '../money';
import { h } from './dom';

export interface HomeActions {
  onAdd(): void;
  onSettle(): void;
  onEdit(entry: Entry): void;
  onSignOut(): void;
}

const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });

export function homeView(members: [Member, Member], entries: Entry[], actions: HomeActions): HTMLElement {
  const name = (id: string) => members.find((m) => m.id === id)?.name ?? '?';
  const other = (id: string) => members.find((m) => m.id !== id)!;
  const balances = computeBalances(entries, [members[0].id, members[1].id]);

  const summary = h('section', { class: 'card balance' },
    balances.length === 0
      ? h('p', { class: 'settled' }, 'Всё в расчёте')
      : h('ul', {}, ...balances.map((b) =>
          h('li', {},
            h('span', {}, `${name(b.debtor)} должен ${name(b.creditor)}`),
            h('strong', {}, formatAmount(b.amount, b.currency)),
          ))),
  );

  const list = entries.length === 0
    ? h('p', { class: 'muted empty' }, 'Пока ни одной записи')
    : h('ul', { class: 'entries' }, ...entries.map((e) => {
        const title = e.kind === 'settlement'
          ? `${name(e.paid_by)} → ${other(e.paid_by).name}`
          : e.description || 'Без описания';
        const meta = e.kind === 'settlement'
          ? 'возврат долга'
          : `платил(а) ${name(e.paid_by)} · ${Math.round(e.payer_share * 100)}/${100 - Math.round(e.payer_share * 100)}`;
        return h('li', {},
          h('button', { type: 'button', class: `entry ${e.kind}`, onclick: () => actions.onEdit(e) },
            h('span', { class: 'entry-date' }, dateFmt.format(new Date(e.spent_on + 'T00:00:00'))),
            h('span', { class: 'entry-main' }, h('span', { class: 'entry-title' }, title), h('span', { class: 'entry-meta' }, meta)),
            h('span', { class: 'entry-amount' }, formatAmount(e.amount, e.currency)),
          ));
      }));

  return h('main', { class: 'wrap narrow' },
    h('header', { class: 'topbar' },
      h('h1', {}, 'Splitwise'),
      h('button', { type: 'button', class: 'btn ghost', onclick: actions.onSignOut }, 'Выйти'),
    ),
    summary,
    h('div', { class: 'actions' },
      h('button', { type: 'button', class: 'btn primary', onclick: actions.onAdd }, '+ Расход'),
      h('button', { type: 'button', class: 'btn', onclick: actions.onSettle, disabled: balances.length === 0 }, 'Вернуть долг'),
    ),
    list,
  );
}
