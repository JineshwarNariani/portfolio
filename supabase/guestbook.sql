-- Leave-a-feather guestbook. Run once in Supabase → SQL Editor → New query → Run.
--
-- Security model: Row Level Security is ON with NO policies, so the public
-- (anon/publishable) key can neither read nor write this table. Only the
-- site's server, using the SECRET key, touches it — and it only ever serves
-- notes whose status is 'approved'.

create table if not exists public.guestbook_entries (
  id             uuid primary key default gen_random_uuid(),
  name           text check (char_length(name) <= 40),
  message        text not null check (char_length(message) between 1 and 240),
  url            text check (char_length(url) <= 200 and url ~* '^https?://'),
  status         text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at     timestamptz not null default now(),
  moderated_at   timestamptz,
  -- One-way HMAC of the writer's network address, used only to limit spam while
  -- the note is pending. Cleared as soon as the note is approved or rejected.
  submitter_hash text
);

alter table public.guestbook_entries enable row level security;

create index if not exists guestbook_status_created_idx on public.guestbook_entries (status, created_at desc);
create index if not exists guestbook_submitter_idx on public.guestbook_entries (submitter_hash, created_at desc);
