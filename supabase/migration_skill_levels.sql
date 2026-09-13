-- Each person's self-reported skill level, per sport (someone might be
-- great at basketball but a beginner at volleyball). Set once, reused
-- across every future session of that sport — not asked again once set.
create table if not exists player_skill_levels (
  user_id uuid references profiles(id) on delete cascade,
  sport text not null check (sport in ('volleyball', 'soccer', 'basketball', 'football')),
  level integer not null default 3 check (level between 1 and 5),
  updated_at timestamptz default now(),
  primary key (user_id, sport)
);

alter table player_skill_levels enable row level security;

-- Visible to any authenticated user — needed so a session's creator can
-- read everyone's level to run the auto-balance calculation. Same
-- openness level already used for display names/avatars in profiles.
create policy "Skill levels are viewable by authenticated users"
  on player_skill_levels for select
  using (auth.role() = 'authenticated');

create policy "Users can set their own skill level"
  on player_skill_levels for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own skill level"
  on player_skill_levels for update
  using (auth.uid() = user_id);
