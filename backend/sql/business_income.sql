create extension if not exists pgcrypto;

create table if not exists public.business_income (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 90),
  source text not null default 'Other',
  amount numeric(12, 2) not null check (amount > 0),
  received_at timestamptz not null default now(),
  note text check (note is null or char_length(note) <= 260),
  created_by_uid text,
  created_by_email text,
  created_at timestamptz not null default now()
);

alter table public.business_income enable row level security;

create index if not exists business_income_received_at_idx
  on public.business_income (received_at desc);

create index if not exists business_income_source_idx
  on public.business_income (source);
