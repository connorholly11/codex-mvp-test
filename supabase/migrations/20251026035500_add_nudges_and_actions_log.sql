begin;

create table public.nudges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  kind text not null,
  scheduled_for timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index nudges_user_status_idx
  on public.nudges (user_id, status, scheduled_for);

create index nudges_kind_idx
  on public.nudges (kind);

create trigger trg_nudges_touch_updated_at
before update on public.nudges
for each row
execute function public.touch_updated_at();

create table public.actions_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index actions_log_user_created_idx
  on public.actions_log (user_id, created_at desc);

alter table public.nudges enable row level security;
alter table public.actions_log enable row level security;

create policy "Users can view their nudges"
  on public.nudges for select
  using (auth.uid() = user_id);

create policy "Users can update their nudges"
  on public.nudges for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can view their actions log"
  on public.actions_log for select
  using (auth.uid() = user_id);

create policy "Users can insert their actions log entries"
  on public.actions_log for insert
  with check (auth.uid() = user_id);

commit;
