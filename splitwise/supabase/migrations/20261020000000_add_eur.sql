alter table public.entries drop constraint entries_currency_check;
alter table public.entries add constraint entries_currency_check
  check (currency in ('TRY', 'USD', 'EUR', 'GEL'));
