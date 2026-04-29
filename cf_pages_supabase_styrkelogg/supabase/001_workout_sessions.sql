-- Supabase schema for the strength log app
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.workout_sessions (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null,
  workout_key text not null,
  notes text not null default '',
  payload_json jsonb not null default '{"exerciseLogs":[]}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_workout_sessions_user_date
  on public.workout_sessions (user_id, session_date, created_at);

drop trigger if exists trg_workout_sessions_updated_at on public.workout_sessions;
create trigger trg_workout_sessions_updated_at
before update on public.workout_sessions
for each row
execute function public.set_updated_at();

alter table public.workout_sessions enable row level security;

drop policy if exists "Users can view own workout sessions" on public.workout_sessions;
create policy "Users can view own workout sessions"
on public.workout_sessions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own workout sessions" on public.workout_sessions;
create policy "Users can insert own workout sessions"
on public.workout_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own workout sessions" on public.workout_sessions;
create policy "Users can update own workout sessions"
on public.workout_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own workout sessions" on public.workout_sessions;
create policy "Users can delete own workout sessions"
on public.workout_sessions
for delete
to authenticated
using (auth.uid() = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.workout_sessions to authenticated;
