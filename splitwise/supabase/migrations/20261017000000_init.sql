-- Two fixed members and their shared expenses. Only the single authenticated user may touch anything.

create table public.members (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  position smallint not null unique check (position in (1, 2))
);

create table public.entries (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('expense', 'settlement')),
  description text not null default '',
  amount      bigint not null check (amount > 0),
  currency    text not null check (currency in ('USD', 'GEL', 'TRY')),
  paid_by     uuid not null references public.members (id),
  payer_share numeric(5, 4) not null check (payer_share >= 0 and payer_share <= 1),
  spent_on    date not null default current_date,
  created_at  timestamptz not null default now(),
  check (kind = 'expense' or payer_share = 0)
);

create index entries_spent_on_idx on public.entries (spent_on desc, created_at desc);

alter table public.members enable row level security;
alter table public.entries enable row level security;

create policy "authenticated full access" on public.members
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.entries
  for all to authenticated using (true) with check (true);

revoke all on public.members, public.entries from anon;

insert into public.members (name, position) values ('Никита', 1), ('Партнёр', 2);
