-- Run once in Supabase: SQL Editor -> New query -> paste everything -> Run.
-- (Run step6-members.sql first if you haven't: it creates the my_role() function used below.)

-- 1. a new role for people you decline
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('admin', 'member', 'pending', 'declined'));

-- 2. channels added on the edit page (for YouTubers that are not in channels.json)
create table if not exists channels_extra (
  id text primary key,
  name text not null,
  country text,
  url text,
  added_by uuid default auth.uid(),
  created_at timestamptz default now()
);

-- 3. videos added on the edit page (same fields as the videos in public/data)
create table if not exists videos (
  id text primary key,                      -- the YouTube video ID
  channel text not null,                    -- a channel id (from channels.json or channels_extra)
  title text not null,
  categories text[] not null default '{}',  -- e.g. {travel,culture}
  countries text[] not null default '{}',   -- ISO codes, or EARTH
  place_name text,
  lat double precision,
  lng double precision,
  era_from integer,                         -- History only: years covered (negative = BC)
  era_to integer,
  added_by uuid default auth.uid(),
  created_at timestamptz default now()
);

alter table channels_extra enable row level security;
alter table videos enable row level security;

-- 4. rules: everyone can read; members and admins can add and change; only admins can delete
drop policy if exists "anyone reads channels" on channels_extra;
create policy "anyone reads channels" on channels_extra for select using (true);
drop policy if exists "editors add channels" on channels_extra;
create policy "editors add channels" on channels_extra for insert
  with check (public.my_role() in ('admin', 'member'));
drop policy if exists "editors update channels" on channels_extra;
create policy "editors update channels" on channels_extra for update
  using (public.my_role() in ('admin', 'member')) with check (public.my_role() in ('admin', 'member'));
drop policy if exists "admins delete channels" on channels_extra;
create policy "admins delete channels" on channels_extra for delete
  using (public.my_role() = 'admin');

drop policy if exists "anyone reads videos" on videos;
create policy "anyone reads videos" on videos for select using (true);
drop policy if exists "editors add videos" on videos;
create policy "editors add videos" on videos for insert
  with check (public.my_role() in ('admin', 'member'));
drop policy if exists "editors update videos" on videos;
create policy "editors update videos" on videos for update
  using (public.my_role() in ('admin', 'member')) with check (public.my_role() in ('admin', 'member'));
drop policy if exists "admins delete videos" on videos;
create policy "admins delete videos" on videos for delete
  using (public.my_role() = 'admin');
