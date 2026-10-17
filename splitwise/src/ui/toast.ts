import { h } from './dom';

let current: HTMLElement | undefined;

export function toast(message: string): void {
  current?.remove();
  current = h('div', { class: 'toast', role: 'alert' }, message);
  document.body.append(current);
  const el = current;
  setTimeout(() => el.remove(), 4000);
}
