// In-memory stand-in for src/db.ts used by the UI smoke test.
export class DbError extends Error { constructor(m: string, readonly isAuth = false) { super(m); } }
export type Member = { id: string; name: string; position: number };
export type EntryKind = 'expense' | 'settlement';
export type Entry = { id: string; kind: EntryKind; description: string; amount: number; currency: any; paid_by: string; payer_share: number; spent_on: string; created_at: string };
export type EntryInput = Omit<Entry, 'id' | 'created_at'>;
let session: any = null; let cb: (s: any) => void = () => {};
const members: Member[] = [{ id: 'm1', name: 'Никита', position: 1 }, { id: 'm2', name: 'Партнёр', position: 2 }];
let entries: Entry[] = [];
export async function signIn(p: string) { if (p !== 'ok') throw new DbError('Неверный пароль', true); session = { user: { id: 'u' } }; cb(session); }
export async function signOut() { session = null; cb(null); }
export async function getSession() { return session; }
export function onAuthChange(f: (s: any) => void) { cb = f; setTimeout(() => f(session), 0); }
export async function listMembers() { return members; }
export async function listEntries() { return [...entries].sort((a, b) => b.spent_on.localeCompare(a.spent_on) || b.created_at.localeCompare(a.created_at)); }
export async function addEntry(i: EntryInput) { const e = { ...i, id: crypto.randomUUID(), created_at: new Date().toISOString() }; entries.push(e); return e; }
export async function updateEntry(id: string, i: EntryInput) { const e = entries.find((x) => x.id === id)!; Object.assign(e, i); return e; }
export async function deleteEntry(id: string) { entries = entries.filter((x) => x.id !== id); }
export function reset() { session = null; entries = []; }
