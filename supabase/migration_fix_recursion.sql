-- Fixes "infinite recursion detected in policy for relation group_members".
-- The original policies checked group membership by querying group_members
-- from within a group_members policy (and from policies on other tables
-- that reference group_members) — which forces Postgres to re-evaluate
-- that same policy on every row check, looping forever.
--
-- The fix: move the membership check into a SECURITY DEFINER function.
-- Such a function runs with elevated privileges that bypass Row Level
-- Security internally, so it can safely check group_members without
-- triggering its own policies again.

create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members
    where group_members.group_id = p_group_id
      and group_members.user_id = p_user_id
  );
$$;

create or replace function public.is_group_admin(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members
    where group_members.group_id = p_group_id
      and group_members.user_id = p_user_id
      and group_members.role = 'admin'
  );
$$;

-- group_members
drop policy if exists "Members can view membership of their groups" on group_members;
create policy "Members can view membership of their groups"
  on group_members for select
  using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "Admins or self can remove membership" on group_members;
create policy "Admins or self can remove membership"
  on group_members for delete
  using (
    auth.uid() = user_id
    or public.is_group_admin(group_id, auth.uid())
  );

-- groups
drop policy if exists "Members can view their groups" on groups;
create policy "Members can view their groups"
  on groups for select
  using (public.is_group_member(id, auth.uid()));

drop policy if exists "Group admins can update their group" on groups;
create policy "Group admins can update their group"
  on groups for update
  using (public.is_group_admin(id, auth.uid()));

-- sessions
drop policy if exists "Group members can view sessions" on sessions;
create policy "Group members can view sessions"
  on sessions for select
  using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "Group members can create sessions" on sessions;
create policy "Group members can create sessions"
  on sessions for insert
  with check (public.is_group_member(group_id, auth.uid()));

drop policy if exists "Creator or admin can update a session" on sessions;
create policy "Creator or admin can update a session"
  on sessions for update
  using (
    auth.uid() = created_by
    or public.is_group_admin(group_id, auth.uid())
  );

drop policy if exists "Creator or admin can delete a session" on sessions;
create policy "Creator or admin can delete a session"
  on sessions for delete
  using (
    auth.uid() = created_by
    or public.is_group_admin(group_id, auth.uid())
  );

-- rsvps
drop policy if exists "Group members can view RSVPs" on rsvps;
create policy "Group members can view RSVPs"
  on rsvps for select
  using (
    exists (
      select 1 from sessions
      where sessions.id = rsvps.session_id
      and public.is_group_member(sessions.group_id, auth.uid())
    )
  );

-- messages
drop policy if exists "Group members can view messages" on messages;
create policy "Group members can view messages"
  on messages for select
  using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "Group members can post messages" on messages;
create policy "Group members can post messages"
  on messages for insert
  with check (
    auth.uid() = user_id
    and public.is_group_member(group_id, auth.uid())
  );
