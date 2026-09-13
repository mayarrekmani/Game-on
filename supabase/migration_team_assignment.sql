-- Lets the session creator assign confirmed players to Team A or Team B
-- (e.g. "I know my 7 for soccer"). Nullable — unassigned players just
-- fill remaining slots in RSVP order, same as before this feature existed.
alter table rsvps add column if not exists team text check (team in ('A', 'B'));

-- No new RLS policy needed: the existing "Session creator can update
-- payment status" policy already lets the session's creator update any
-- column on that session's rsvps rows, which covers this new column too.
