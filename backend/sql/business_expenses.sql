create extension if not exists pgcrypto;

create table if not exists public.business_expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 90),
  category text not null default 'Other',
  amount numeric(12, 2) not null check (amount > 0),
  spent_at timestamptz not null default now(),
  note text check (note is null or char_length(note) <= 260),
  created_by_uid text,
  created_by_email text,
  created_at timestamptz not null default now()
);

alter table public.business_expenses enable row level security;

create index if not exists business_expenses_spent_at_idx
  on public.business_expenses (spent_at desc);

create index if not exists business_expenses_category_idx
  on public.business_expenses (category);
