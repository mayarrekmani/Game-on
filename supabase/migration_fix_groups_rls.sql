-- Fixes "new row violates row-level security policy for table groups".
--
-- Cause #1: creating a group inserts the row, then immediately reads it
-- back (INSERT ... RETURNING). Postgres enforces the SELECT policy on
-- that returned row too — but the creator isn't added to group_members
-- until a second, separate insert right after, so at the moment of
-- creation they don't yet count as a "member" and the read is denied.
-- Fix: let the creator always see a group they created, membership row
-- or not.
--
-- Cause #2: joining a group by invite code needs to look the group up
-- by its code *before* you're a member — which the membership-only
-- policy also blocks (silently returns zero rows, so "join" always
-- fails with "no group found"). Fix: a narrow, safe lookup function
-- that only returns a group's id for a given invite code, without
-- exposing the whole groups table to non-members.

drop policy if exists "Members can view their groups" on groups;
create policy "Members can view their groups"
  on groups for select
  using (
    public.is_group_member(id, auth.uid())
    or created_by = auth.uid()
  );

create or replace function public.group_id_from_invite_code(p_code text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from groups where invite_code = p_code;
$$;
