begin;

create unique index if not exists quests_progress_user_quest_unique
  on public.quests_progress (user_id, quest_id);

commit;
