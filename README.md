# Game On

Create a league/group, let anyone suggest a session (volleyball, soccer,
basketball, or flag football with the right formats for each), RSVP with a
live virtual court/field showing who's confirmed, and see the cost split
automatically — plus one-click Yes/No/Not-sure from an email, no login
required. Built with Next.js + Supabase + Resend.

## What's built

- Google sign-in (Supabase Auth) — first login routes to a real
  **onboarding page** (`/onboarding`) to pick a username, avatar shape,
  color, icon, or an uploaded photo
- A **Settings page** (`/settings`, reachable by tapping your avatar in
  the top-right corner anywhere in the app) to change all of that later
- **Groups** (not "leagues") — each with its own icon, color, or uploaded
  image, created on a dedicated full page (`/groups/new`), joinable via a
  short invite code
- **Group chat**: a live, realtime chat thread per group
- **Suggest a session**: pick a sport (each with its own valid formats —
  volleyball 6v6 beach/gym, soccer 7v7/11v11, basketball 5v5, flag
  football 7v7/11v11), size, how many fields/courts, location, price
- **Virtual court/field**: as people RSVP "Yes", their avatar fills a
  spot on a live-updating court/field visualization — with real markings
  per sport — split into two sides. Going over the booked capacity
  doesn't block anyone; the counter turns red and the session creator
  gets an email nudging them to book another field/court.
- **Payment tracking**: when a session has a cost, everyone who RSVPs
  "Yes" gets a red ring around their avatar (unpaid). Only the session
  creator can tap someone to mark them paid, turning the ring green.
- **Notifications**: an email goes out to the whole group the moment a
  session is posted (with one-click Yes/No/Not-sure links, no login
  needed). In-app, the dashboard shows a **"New"** badge on any group
  with an unread session or chat message, and the group page shows a red
  dot on whichever tab (Sessions/Chat) has something new — both clear as
  soon as you open that tab.
- Mobile-first layout throughout — single-column, thumb-sized buttons,
  no horizontal scrolling, tested down to a 375px-wide screen
- Row Level Security so people only ever see groups/sessions they belong to

## 1. Set up Supabase (5 min)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL Editor, paste and run everything in `supabase/schema.sql`.
3. Go to **Authentication → Providers → Google**, enable it, and create a
   Google OAuth client ID/secret in Google Cloud Console. Set the
   authorized redirect URI to the one Supabase shows you.
4. Go to **Project Settings → API** and copy the `Project URL`, the
   `anon public` key (or the newer "Publishable key" — both work), and
   the **secret/service_role key** (keep this one secret — it bypasses
   all security rules).
5. Go to **Database → Replication** and confirm `messages` and `rsvps`
   are enabled for realtime (the schema script does this automatically,
   but it's worth a glance if chat doesn't update live).

**Already ran schema.sql before this update?** Also run
`supabase/migration_add_onboarded.sql` — it adds one new column
(`profiles.onboarded`) that the onboarding flow needs.

## 2. Set up Resend (2 min, free)

1. Create a free account at [resend.com](https://resend.com).
2. Create an API key (Dashboard → API Keys).
3. For testing, you can send from their shared `onboarding@resend.dev`
   address with no extra setup. To send from your own domain later,
   verify it under Resend → Domains.

## 3. Run locally

```bash
npm install
cp .env.local.example .env.local
# fill in Supabase URL/anon key/service role key, Resend API key,
# and generate a random RSVP_TOKEN_SECRET with: openssl rand -hex 32
npm run dev
```

Open http://localhost:3000.

## 4. Deploy for free

1. Push this repo to GitHub, import it on [vercel.com](https://vercel.com).
2. Add all the variables from `.env.local` in the Vercel project settings
   — update `NEXT_PUBLIC_SITE_URL` to your real deployed URL, since it's
   used to build the links inside emails.
3. Deploy, then add your Vercel URL to Supabase's allowed redirect URLs
   and the Google OAuth client's authorized redirect URIs.

## Project structure

```
app/
  login/page.tsx                      Google sign-in
  onboarding/page.tsx                 (add this next: username + avatar picker)
  auth/callback/route.ts              OAuth code exchange
  api/sessions/notify/route.ts        sends the invite email to the group
  api/sessions/check-overflow/route.ts emails the creator if bookings are oversubscribed
  api/rsvp/route.ts                   one-click email RSVP (no login needed)
  rsvp-confirmed/page.tsx             public confirmation page after clicking an email link
  page.tsx                            Dashboard — group cards with "New" badges
  groups/new/page.tsx                 dedicated Create Group page (icon/color/photo)
  groups/[groupId]/page.tsx           Group page: tabs for Sessions / Chat / Members
  groups/[groupId]/sessions/[sessionId]/page.tsx   Session + virtual court + RSVP
components/
  Header, JoinGroupForm,
  GroupIconPicker.tsx        icon/color/photo picker, shared by group creation (and future editing)
  CreateGroupPageForm.tsx    the /groups/new form
  GroupTabs.tsx              Sessions/Chat/Members tab switcher + marks read-state
  GroupChat.tsx              realtime group chat
  SuggestSessionForm.tsx     sport → format → venue → fields → location/price
  VirtualCourt.tsx           renders the court/field with player avatars
  RsvpPanel.tsx              Yes/Not sure/Can't-make-it + overflow handling
lib/
  sports.ts                  sport/format/venue config shared by form + court
  rsvpToken.ts               signed token for one-click email links
  email/sendSessionInvite.ts Resend email template + sending
  supabase/admin.ts          service-role client (server-only)
  supabase/{client,server}.ts, types.ts
supabase/schema.sql          run this once in Supabase SQL editor
```

## Not built yet (ideas for next milestones)

- Uploaded group/profile images are currently stored as base64 data URIs
  directly in the database (`avatar_url` / `groups.avatar_url`) — simple
  and works, but for a lot of large images you'd want to move to actual
  **Supabase Storage** (a bucket + signed URLs) instead, to keep the
  database itself small and fast.
- Waitlist auto-promotion when someone in "Extra confirmed" gets bumped
  into an open spot after a drop.
- Recurring sessions, itemized/uneven cost splits.
- Chat: read receipts, photo attachments, per-session pinned chat.
