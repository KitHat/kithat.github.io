import './style.css';
import { computeBalances } from './balance';
import * as db from './db';
import { mount } from './ui/dom';
import { entryFormView } from './ui/form';
import { homeView } from './ui/home';
import { loginView } from './ui/login';
import { toast } from './ui/toast';

let members: [db.Member, db.Member] | undefined;
let entries: db.Entry[] = [];

function handle(e: unknown): void {
  if (e instanceof db.DbError && e.isAuth) {
    void db.signOut();
    return;
  }
  toast((e as Error).message || 'Что-то пошло не так');
}

async function load(): Promise<void> {
  const [m, list] = await Promise.all([db.listMembers(), db.listEntries()]);
  if (m.length !== 2) throw new Error('В базе должно быть ровно два участника');
  members = [m[0]!, m[1]!];
  entries = list;
}

function showHome(): void {
  if (!members) return;
  const ms = members;
  mount(homeView(ms, entries, {
    onAdd: () => showForm('expense'),
    onSettle: () => {
      const [debt] = computeBalances(entries, [ms[0].id, ms[1].id]);
      showForm('settlement', undefined, debt);
    },
    onEdit: (entry) => showForm(entry.kind, entry),
    onSignOut: () => void db.signOut(),
  }));
}

function showForm(kind: db.EntryKind, existing?: db.Entry, debt?: Parameters<typeof entryFormView>[4]): void {
  if (!members) return;
  const done = async () => { await load(); showHome(); };
  mount(entryFormView(kind, members, {
    onSave: async (input) => {
      try {
        await (existing ? db.updateEntry(existing.id, input) : db.addEntry(input));
        await done();
      } catch (e) {
        if (e instanceof db.DbError && e.isAuth) handle(e);
        throw e; // keep the form open and show the message inline
      }
    },
    onDelete: existing && (async () => {
      if (!window.confirm('Удалить запись?')) return;
      await db.deleteEntry(existing.id);
      await done();
    }),
    onCancel: showHome,
  }, existing, debt));
}

async function render(session: unknown): Promise<void> {
  if (!session) {
    members = undefined;
    mount(loginView());
    return;
  }
  try {
    await load();
    showHome();
  } catch (e) {
    handle(e);
  }
}

let lastSessionId: string | undefined | null = null;
db.onAuthChange((session) => {
  // Token refreshes fire too; re-render only when someone logs in or out.
  const id = session?.user.id;
  if (id === lastSessionId) return;
  lastSessionId = id;
  // Defer: supabase-js holds an auth lock while running this callback, and render() queries the DB.
  setTimeout(() => void render(session), 0);
});
