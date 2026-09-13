-- groups never had a DELETE policy — only admins should be able to
-- delete the group entirely. All related data (memberships, sessions,
-- rsvps, messages, read-state) cascades automatically since those
-- tables were already set up with "on delete cascade" back to groups.
create policy "Group admins can delete their group"
  on groups for delete
  using (public.is_group_admin(id, auth.uid()));
