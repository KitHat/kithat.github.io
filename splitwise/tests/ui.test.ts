// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/db', () => import('./mock-db'));
vi.mock('../src/style.css', () => ({}));

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const tick = () => new Promise((r) => setTimeout(r, 0));
const flush = async () => { for (let i = 0; i < 5; i++) await tick(); };
const text = () => document.getElementById('app')!.textContent!;
const button = (label: string) =>
  [...document.querySelectorAll('button')].find((b) => b.textContent === label)!;

function set(sel: string, value: string) {
  const el = $<HTMLInputElement | HTMLSelectElement>(sel);
  el.value = value;
  el.dispatchEvent(new Event('input'));
  el.dispatchEvent(new Event('change'));
}

async function submit() {
  $('form').dispatchEvent(new Event('submit', { cancelable: true }));
  await flush();
}

describe('UI', () => {
  beforeEach(async () => {
    vi.resetModules();
    // Reset through the same mocked module instance the app imports.
    ((await import('../src/db')) as unknown as typeof import('./mock-db')).reset();
    document.body.innerHTML = '<div id="app"></div>';
    await import('../src/main');
    await flush();
  });

  it('rejects a wrong password inline and logs in with the right one', async () => {
    set('input[type=password]', 'wrong');
    await submit();
    expect($('.field-error').textContent).toBe('Неверный пароль');

    set('input[type=password]', 'ok');
    await submit();
    expect(text()).toContain('Всё в расчёте');
  });

  it('adds a 60/40 expense, shows the debt, and settles it with a prefilled form', async () => {
    set('input[type=password]', 'ok');
    await submit();

    button('+ Расход').click();
    set('input[name=amount]', '100,00');
    set('select[name=currency]', 'GEL');
    set('input[name=description]', 'Ужин');
    set('.share-number', '60');
    expect($('.hint').textContent).toBe('Михаил должен Никита 40.00 ₾');
    await submit();

    expect($('.balance').textContent).toContain('Михаил должен Никита');
    expect($('.balance').textContent).toContain('40.00 ₾');
    expect(text()).toContain('Ужин');

    button('Вернуть долг').click();
    expect($<HTMLInputElement>('input[name=amount]').value).toBe('40.00');
    expect($<HTMLSelectElement>('select[name=currency]').value).toBe('GEL');
    expect($<HTMLSelectElement>('select[name=paid_by]').selectedOptions[0]!.textContent).toBe('Михаил');
    await submit();

    expect(text()).toContain('Всё в расчёте');
  });

  it('accepts a fractional payer share and rejects one with too many decimals', async () => {
    set('input[type=password]', 'ok');
    await submit();
    button('+ Расход').click();
    set('input[name=amount]', '100');
    set('select[name=currency]', 'USD');
    set('.share-number', '33,333');
    await submit();
    expect($('.field-error').textContent).toContain('Доля');

    set('.share-number', '33,33');
    expect($('.hint').textContent).toBe('Михаил должен Никита $66.67');
    await submit();
    expect($('.balance').textContent).toContain('$66.67');
    expect($('.entry-meta').textContent).toContain('33.33/66.67');
  });

  it('refuses an invalid amount without leaving the form', async () => {
    set('input[type=password]', 'ok');
    await submit();
    button('+ Расход').click();
    set('input[name=amount]', 'abc');
    await submit();
    expect($('.field-error').textContent).toContain('Введите сумму');
    expect(text()).toContain('Новый расход');
  });
});
