begin;

-- Ensure UUID generation helpers are available
create extension if not exists pgcrypto;

-- Domain-specific enums
create type public.chat_message_role as enum ('user', 'assistant', 'system');
create type public.quest_progress_status as enum ('available', 'in_progress', 'completed');

-- Generic updated_at trigger function (reusable across tables)
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- User profile metadata (supplements auth.users)
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  legal_acceptance_at timestamptz,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_profiles_touch_updated_at
before update on public.profiles
for each row
execute function public.touch_updated_at();

-- Chat session header (single-thread MVP but future friendly)
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_chat_sessions_touch_updated_at
before update on public.chat_sessions
for each row
execute function public.touch_updated_at();

create index chat_sessions_user_created_idx
  on public.chat_sessions (user_id, created_at desc);

-- Individual chat messages (streamed content)
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  role public.chat_message_role not null,
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index chat_messages_session_created_idx
  on public.chat_messages (session_id, created_at desc);

create index chat_messages_user_created_idx
  on public.chat_messages (user_id, created_at desc);

-- Onboarding assessment payloads
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  payload jsonb not null,
  completed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index assessments_user_completed_idx
  on public.assessments (user_id, completed_at desc);

-- Personal insight / quest reports
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  report_type text not null,
  title text,
  content jsonb not null,
  generated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index reports_user_type_unique
  on public.reports (user_id, report_type);

create index reports_user_generated_idx
  on public.reports (user_id, generated_at desc);

-- Quest completion tracking
create table public.quests_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  quest_id text not null,
  status public.quest_progress_status not null default 'completed',
  answer jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index quests_progress_user_quest_idx
  on public.quests_progress (user_id, quest_id);

create index quests_progress_user_status_idx
  on public.quests_progress (user_id, status, created_at desc);

-- Row Level Security policies
alter table public.profiles enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.assessments enable row level security;
alter table public.reports enable row level security;
alter table public.quests_progress enable row level security;

-- Profiles policies
create policy "Users can select their profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Chat session policies
create policy "Users can manage their chat sessions"
  on public.chat_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Chat message policies
create policy "Users can view chat messages in their sessions"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert chat messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

create policy "Users can update their chat messages"
  on public.chat_messages for update
  using (auth.uid() = user_id);

-- Assessments policies
create policy "Users can manage their assessments"
  on public.assessments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Reports policies
create policy "Users can view their reports"
  on public.reports for select
  using (auth.uid() = user_id);

create policy "Users can insert reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

create policy "Users can update reports"
  on public.reports for update
  using (auth.uid() = user_id);

-- Quests progress policies
create policy "Users can manage their quest progress"
  on public.quests_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;
