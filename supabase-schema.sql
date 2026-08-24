-- Corre este script inteiro no Supabase: Dashboard > SQL Editor > New query > Run

create extension if not exists "pgcrypto";

-- Exercícios personalizados criados por cada utilizador
-- (os exercícios "de fábrica" continuam a viver no código da app)
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  created_at timestamptz not null default now()
);

-- Sessões de treino. "entries" guarda os exercícios/sets dessa sessão em JSON,
-- na mesma forma que a app já usava localmente.
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  entries jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Registo de peso corporal (um valor por dia e por utilizador)
create table if not exists public.bodyweight (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight numeric not null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- Row Level Security: cada pessoa só vê e altera os seus próprios dados
alter table public.exercises enable row level security;
alter table public.sessions enable row level security;
alter table public.bodyweight enable row level security;

create policy "Users manage own exercises" on public.exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own sessions" on public.sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own bodyweight" on public.bodyweight
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
