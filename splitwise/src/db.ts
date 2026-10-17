import { createClient, type Session } from '@supabase/supabase-js';
import type { Database } from './database.types';
import type { Currency } from './types';

/** The single account guarding the app; only its password is typed by people. */
const LOGIN_EMAIL = 'splitwise@khateev.com';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
if (!url || !anonKey) throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');

const supabase = createClient<Database>(url, anonKey);

type Tables = Database['public']['Tables'];
type EntryRow = Tables['entries']['Row'];

export type Member = Tables['members']['Row'];
export type EntryKind = 'expense' | 'settlement';
export type Entry = Omit<EntryRow, 'kind' | 'currency'> & { kind: EntryKind; currency: Currency };
export type EntryInput = Pick<Entry, 'kind' | 'description' | 'amount' | 'currency' | 'paid_by' | 'payer_share' | 'spent_on'>;

export class DbError extends Error {
  constructor(message: string, readonly isAuth = false) {
    super(message);
    this.name = 'DbError';
  }
}

function fail(error: { message: string; code?: string; status?: number }): never {
  // PGRST301 = expired JWT, 42501 = RLS / missing grant: both mean "log in again".
  const isAuth = error.status === 401 || error.code === 'PGRST301' || error.code === '42501';
  throw new DbError(isAuth ? 'Сессия истекла, войдите снова' : error.message, isAuth);
}

export async function signIn(password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: LOGIN_EMAIL, password });
  if (error) throw new DbError(error.status === 400 ? 'Неверный пароль' : error.message, true);
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(cb: (session: Session | null) => void): void {
  supabase.auth.onAuthStateChange((_event, session) => cb(session));
}

export async function listMembers(): Promise<Member[]> {
  const { data, error } = await supabase.from('members').select('*').order('position');
  if (error) fail(error);
  return data;
}

export async function listEntries(): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('spent_on', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) fail(error);
  return data as Entry[];
}

export async function addEntry(input: EntryInput): Promise<Entry> {
  const { data, error } = await supabase.from('entries').insert(input).select().single();
  if (error) fail(error);
  return data as Entry;
}

export async function updateEntry(id: string, input: EntryInput): Promise<Entry> {
  const { data, error } = await supabase.from('entries').update(input).eq('id', id).select().single();
  if (error) fail(error);
  return data as Entry;
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('entries').delete().eq('id', id);
  if (error) fail(error);
}
