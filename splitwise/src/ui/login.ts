import { signIn } from '../db';
import { h } from './dom';

export function loginView(): HTMLElement {
  const password = h('input', { type: 'password', name: 'password', autocomplete: 'current-password', required: true, autofocus: true });
  const error = h('p', { class: 'field-error', 'aria-live': 'polite' });
  const button = h('button', { type: 'submit', class: 'btn primary' }, 'Войти');

  const form = h('form', {
    class: 'card login',
    onsubmit: async (ev: Event) => {
      ev.preventDefault();
      error.textContent = '';
      button.disabled = true;
      try {
        await signIn(password.value);
        // main.ts reacts to the auth change and renders the home view.
      } catch (e) {
        error.textContent = (e as Error).message;
        password.select();
      } finally {
        button.disabled = false;
      }
    },
  },
    h('h1', {}, 'Splitwise'),
    h('label', {}, 'Пароль', password),
    error,
    button,
  );
  return h('main', { class: 'wrap narrow' }, form);
}
