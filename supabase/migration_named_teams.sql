-- Lets the session creator name teams (not just "A"/"B") and add more
-- than 2 if they want. Every session gets 2 default teams automatically
-- when created; the creator can rename them or add up to 4 more.

create table if not exists session_teams (
  session_id uuid references sessions(id) on delete cascade,
  team_key text not null check (team_key in ('A', 'B', 'C', 'D', 'E', 'F')),
  name text not null,
  created_at timestamptz default now(),
  primary key (session_id, team_key)
);

alter table session_teams enable row level security;

create policy "Group members can view session teams"
  on session_teams for select
  using (
    exists (
      select 1 from sessions
      where sessions.id = session_teams.session_id
      and public.is_group_member(sessions.group_id, auth.uid())
    )
  );

create policy "Session creator can add teams"
  on session_teams for insert
  with check (
    exists (
      select 1 from sessions
      where sessions.id = session_teams.session_id
      and sessions.created_by = auth.uid()
    )
  );

create policy "Session creator can rename teams"
  on session_teams for update
  using (
    exists (
      select 1 from sessions
      where sessions.id = session_teams.session_id
      and sessions.created_by = auth.uid()
    )
  );

create policy "Session creator can remove teams"
  on session_teams for delete
  using (
    exists (
      select 1 from sessions
      where sessions.id = session_teams.session_id
      and sessions.created_by = auth.uid()
    )
  );

-- Auto-create the two default teams the moment a session is posted, so
-- there's always something to assign to without an extra setup step.
create or replace function public.create_default_session_teams()
returns trigger as $$
begin
  insert into session_teams (session_id, team_key, name)
  values (new.id, 'A', 'Team A'), (new.id, 'B', 'Team B');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_session_created on sessions;
create trigger on_session_created
  after insert on sessions
  for each row execute procedure public.create_default_session_teams();

-- Loosen rsvps.team from a hardcoded A/B-only check to a proper foreign
-- key against whatever teams actually exist for that session — this is
-- what lets more than 2 teams work at all.
alter table rsvps drop constraint if exists rsvps_team_check;

-- Backfill default teams for any sessions that existed before this
-- migration ran (new sessions already get them via the trigger above) —
-- otherwise the foreign key below fails against that old data.
insert into session_teams (session_id, team_key, name)
select id, 'A', 'Team A' from sessions
where not exists (
  select 1 from session_teams st where st.session_id = sessions.id and st.team_key = 'A'
);
insert into session_teams (session_id, team_key, name)
select id, 'B', 'Team B' from sessions
where not exists (
  select 1 from session_teams st where st.session_id = sessions.id and st.team_key = 'B'
);

alter table rsvps add constraint rsvps_team_fk
  foreign key (session_id, team) references session_teams(session_id, team_key)
  on delete set null;

-- Anyone can set their OWN team (not just the session creator) — this
-- already worked under the existing "Users can update their own RSVP"
-- policy (no column restriction), so no new policy is needed for that;
-- it's purely a UI change to actually expose it to non-creators too.