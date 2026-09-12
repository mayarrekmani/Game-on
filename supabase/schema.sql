-- ============================================================
-- League Booking App — Supabase schema
-- Run this in Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- ---------- TABLES ----------

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  avatar_shape text default 'circle' check (avatar_shape in ('circle', 'square', 'hex', 'shield')),
  avatar_color text default '#d9531e',
  avatar_icon text,
  onboarded boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport text,
  icon_emoji text not null default '🏆',
  color text not null default '#d9531e',
  avatar_url text, -- if set, shown instead of icon_emoji/color
  created_by uuid references profiles(id) on delete set null,
  invite_code text unique not null,
  created_at timestamptz default now()
);

create table if not exists group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  title text,
  sport text not null default 'soccer' check (sport in ('volleyball', 'soccer', 'basketball', 'football')),
  format_label text not null default '7v7', -- e.g. '6v6', '7v7', '11v11', '5v5'
  per_side integer not null default 7,       -- players per side, drives court capacity
  venue text,                                 -- 'Beach' or 'Gym' (volleyball only), null otherwise
  fields_count integer not null default 1,    -- how many fields/courts booked side by side
  location text not null,
  starts_at timestamptz not null,
  max_players integer,
  total_cost numeric not null default 0,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists rsvps (
  session_id uuid references sessions(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  status text not null default 'in' check (status in ('in', 'out', 'maybe')),
  paid boolean not null default false, -- only meaningful when the session has a cost; toggled by the session creator
  responded_at timestamptz default now(),
  primary key (session_id, user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz default now()
);

-- Tracks the last time each person viewed a group's Sessions tab and Chat
-- tab, so the dashboard can show a "new" badge without a separate
-- notifications table to clean up. Defaults to epoch (never seen).
create table if not exists group_reads (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  last_seen_sessions_at timestamptz not null default 'epoch',
  last_seen_chat_at timestamptz not null default 'epoch',
  primary key (group_id, user_id)
);

-- ---------- HELPER: auto-create a profile row on signup ----------

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- ROW LEVEL SECURITY ----------

alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table sessions enable row level security;
alter table rsvps enable row level security;
alter table messages enable row level security;
alter table group_reads enable row level security;

-- profiles: anyone signed in can read basic profile info (needed to show
-- names in member lists); users can only edit their own row.
create policy "Profiles are viewable by authenticated users"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Column-level lock: even though the profiles row is visible to any
-- authenticated user (needed to show names in member lists), nobody's
-- email should be readable from the browser. Only the service-role
-- client (used server-side to send session invite emails) can see it.
revoke select (email) on profiles from authenticated, anon;

-- groups: visible only to members; any authenticated user can create one.
create policy "Members can view their groups"
  on groups for select
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = groups.id
      and group_members.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create groups"
  on groups for insert
  with check (auth.uid() = created_by);

create policy "Group admins can update their group"
  on groups for update
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = groups.id
      and group_members.user_id = auth.uid()
      and group_members.role = 'admin'
    )
  );

-- group_members: members can see who else is in their groups; users can
-- add themselves (join via invite code, validated in application code).
create policy "Members can view membership of their groups"
  on group_members for select
  using (
    exists (
      select 1 from group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
    )
  );

create policy "Users can add themselves to a group"
  on group_members for insert
  with check (auth.uid() = user_id);

create policy "Admins or self can remove membership"
  on group_members for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
    )
  );

-- sessions: visible to group members only; any group member can create one.
create policy "Group members can view sessions"
  on sessions for select
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = sessions.group_id
      and group_members.user_id = auth.uid()
    )
  );

create policy "Group members can create sessions"
  on sessions for insert
  with check (
    exists (
      select 1 from group_members
      where group_members.group_id = sessions.group_id
      and group_members.user_id = auth.uid()
    )
  );

create policy "Creator or admin can update a session"
  on sessions for update
  using (
    auth.uid() = created_by
    or exists (
      select 1 from group_members
      where group_members.group_id = sessions.group_id
      and group_members.user_id = auth.uid()
      and group_members.role = 'admin'
    )
  );

create policy "Creator or admin can delete a session"
  on sessions for delete
  using (
    auth.uid() = created_by
    or exists (
      select 1 from group_members
      where group_members.group_id = sessions.group_id
      and group_members.user_id = auth.uid()
      and group_members.role = 'admin'
    )
  );

-- rsvps: visible to fellow group members; users manage only their own RSVP.
create policy "Group members can view RSVPs"
  on rsvps for select
  using (
    exists (
      select 1 from sessions
      join group_members on group_members.group_id = sessions.group_id
      where sessions.id = rsvps.session_id
      and group_members.user_id = auth.uid()
    )
  );

create policy "Users can upsert their own RSVP"
  on rsvps for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own RSVP"
  on rsvps for update
  using (auth.uid() = user_id);

create policy "Users can delete their own RSVP"
  on rsvps for delete
  using (auth.uid() = user_id);

-- Only the person who created the session can mark someone as paid —
-- this is the "red ring becomes green" toggle, and it's deliberately not
-- self-service so people can't mark themselves paid without actually paying.
create policy "Session creator can update payment status"
  on rsvps for update
  using (
    exists (
      select 1 from sessions
      where sessions.id = rsvps.session_id
      and sessions.created_by = auth.uid()
    )
  );

-- messages: only group members can read or post to a group's chat.
create policy "Group members can view messages"
  on messages for select
  using (
    exists (
      select 1 from group_members
      where group_members.group_id = messages.group_id
      and group_members.user_id = auth.uid()
    )
  );

create policy "Group members can post messages"
  on messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from group_members
      where group_members.group_id = messages.group_id
      and group_members.user_id = auth.uid()
    )
  );

create policy "Users can delete their own messages"
  on messages for delete
  using (auth.uid() = user_id);

-- group_reads: purely personal — each person only ever reads/writes their
-- own row, used to compute "new" badges on the dashboard.
create policy "Users can view their own read-state"
  on group_reads for select
  using (auth.uid() = user_id);

create policy "Users can upsert their own read-state"
  on group_reads for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own read-state"
  on group_reads for update
  using (auth.uid() = user_id);

-- ---------- REALTIME ----------
-- Enable realtime so the session page can live-update RSVP counts, and
-- the group chat updates for everyone without refreshing.
alter publication supabase_realtime add table rsvps;
alter publication supabase_realtime add table messages;
