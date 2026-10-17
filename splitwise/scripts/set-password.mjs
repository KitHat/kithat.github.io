// Creates or updates the single login user. Run locally; the password is typed, never stored in files.
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/set-password.mjs
import { createClient } from '@supabase/supabase-js';
import { createInterface } from 'node:readline';

const EMAIL = 'splitwise@khateev.com';
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.startsWith(question)) rl.output.write(s); };
    rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); });
  });
}

const password = await askHidden('New password: ');
if (password.length < 10) { console.error('Use at least 10 characters'); process.exit(1); }
if (password !== await askHidden('Repeat: ')) { console.error('Passwords differ'); process.exit(1); }

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }).auth.admin;
const { data, error } = await admin.listUsers({ perPage: 1000 });
if (error) throw error;
const user = data.users.find((u) => u.email === EMAIL);
const result = user
  ? await admin.updateUserById(user.id, { password })
  : await admin.createUser({ email: EMAIL, password, email_confirm: true });
if (result.error) throw result.error;
console.log(user ? 'Password updated' : 'User created');
