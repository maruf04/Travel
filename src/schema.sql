-- =====================================================================
-- Vlogger World Tracker: complete database setup (everything in one file)
--
-- How to use: Supabase dashboard -> SQL Editor -> New query -> paste this
-- whole file -> Run. It is safe to run again; it will not delete any data.
--
-- What it creates
--   profiles          who can do what (admin / member / pending / declined)
--   video_overrides   corrections to the country/place of videos in public/data
--   categories        the topics (travel, history, ...). Add one with a new row, no code or JSON needed
--   channels          YouTube channels
--   videos            all videos
--   profiles.username unique usernames: people can sign in with a username or an email
--   contributor_profiles  how each editor appears in the site footer (name, icon, contact link)
--   public_contributors   a view listing people who added videos, for the footer
--   channels_extra    older table for channels added on the edit page (kept so nothing breaks; replaced by channels)
-- plus the rules (Row Level Security) that decide who can read and write.
--
-- NEVER put a secret key (service_role / sb_secret_...) in this file or in the repo.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

create table if not exists profiles (
  user_id uuid primary key references auth.users on delete cascade,
  email text,
  role text not null default 'pending'
);

-- (for databases created by the older, smaller setup: bring them up to date)
alter table profiles add column if not exists email text;
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('admin', 'member', 'pending', 'declined'));
alter table profiles alter column role set default 'pending';

-- unique usernames (stored in lowercase; "Rafi_99" and "rafi_99" are the same name)
alter table profiles add column if not exists username text;
alter table profiles drop constraint if exists profiles_username_format;
alter table profiles add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9_]{3,20}$');
create unique index if not exists profiles_username_key on profiles (lower(username));

create table if not exists video_overrides (
  video_id text primary key,                 -- the YouTube video ID
  countries text[] not null default '{}',    -- ISO codes such as TR, or EARTH
  place_name text,
  lat double precision,
  lng double precision,
  updated_by uuid references auth.users,
  updated_at timestamptz default now()
);

create table if not exists categories (
  id text primary key,                       -- short name used in videos, e.g. travel
  name text not null,                        -- what visitors see, e.g. Travel
  icon text,                                 -- an emoji
  color text,                                -- e.g. #ff7a50
  sort integer not null default 0            -- tab order (smallest first)
);

create table if not exists channels (
  id text primary key,
  name text not null,
  country text,                              -- ISO code of the channel's home country
  url text,
  youtube_id text,
  logo text,                                 -- a file under public/ or a full https:// link
  logo_credit text,
  added_by uuid default auth.uid(),
  created_at timestamptz default now()
);

create table if not exists contributor_profiles (
  user_id uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  icon text,                                  -- an emoji
  contact_url text check (contact_url is null or contact_url ~* '^(https?://|mailto:|tel:)'),
  updated_at timestamptz default now()
);

create table if not exists channels_extra (
  id text primary key,
  name text not null,
  country text,
  url text,
  added_by uuid default auth.uid(),
  created_at timestamptz default now()
);

create table if not exists videos (
  id text primary key,                       -- the YouTube video ID
  channel text not null,                     -- a channel id (channels.json or channels_extra)
  title text not null,
  categories text[] not null default '{}',   -- e.g. {travel,culture}
  countries text[] not null default '{}',    -- ISO codes, or EARTH
  place_name text,
  lat double precision,
  lng double precision,
  era_from integer,                          -- History only: years covered (negative = BC)
  era_to integer,
  added_by uuid default auth.uid(),
  created_at timestamptz default now()
);


-- The footer's list: people who have added at least one video, most videos first.
-- (security_invoker: it follows the normal rules of the tables it reads, nothing is bypassed)
create or replace view public.public_contributors with (security_invoker = true) as
select cp.user_id, cp.display_name, cp.icon, cp.contact_url, count(v.id)::int as videos
from public.contributor_profiles cp
join public.videos v on v.added_by = cp.user_id
group by cp.user_id, cp.display_name, cp.icon, cp.contact_url
order by count(v.id) desc, cp.display_name;

-- Channels added earlier on the edit page move into the new channels table.
do $$
begin
  if to_regclass('public.channels_extra') is not null then
    insert into public.channels (id, name, country, url)
    select id, name, country, url from public.channels_extra
    on conflict (id) do nothing;
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 2. Helper functions
-- ---------------------------------------------------------------------

-- The role of the person making the request ('admin', 'member', ...).
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where user_id = auth.uid()
$$;

-- Every new sign-up automatically gets a "pending" profile (no access until an admin approves).
-- The username typed on the sign-up form arrives in the account's metadata.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  u text := lower(trim(coalesce(new.raw_user_meta_data->>'username', '')));
begin
  if u !~ '^[a-z0-9_]{3,20}$' or exists (select 1 from public.profiles where lower(username) = u) then
    u := null; -- invalid or taken: the account is still created; the person can pick a username later
  end if;
  insert into public.profiles (user_id, email, role, username)
  values (new.id, new.email, 'pending', u)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Keep profiles.email in step when someone changes their email address.
create or replace function public.sync_profile_email() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set email = new.email where user_id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

-- Is this username free? (used by the sign-up form)
create or replace function public.username_available(p_username text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(trim(p_username)))
$$;

-- Which email belongs to this username? (used to sign in with a username)
-- Note: this lets anyone who knows a username find that account's email address.
create or replace function public.login_email(p_username text) returns text
language sql stable security definer set search_path = public as $$
  select email from public.profiles where lower(username) = lower(trim(p_username)) limit 1
$$;

-- Change my own username (checks the format and that it is free).
create or replace function public.set_my_username(p_username text) returns void
language plpgsql security definer set search_path = public as $$
declare
  u text := lower(trim(p_username));
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  if u !~ '^[a-z0-9_]{3,20}$' then
    raise exception 'Usernames are 3 to 20 characters: lowercase letters, numbers and underscores.';
  end if;
  if exists (select 1 from public.profiles where lower(username) = u and user_id <> auth.uid()) then
    raise exception 'That username is already taken.';
  end if;
  update public.profiles set username = u where user_id = auth.uid();
end;
$$;

grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.login_email(text) to anon, authenticated;
grant execute on function public.set_my_username(text) to authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------
-- 3. Rules: who can read and write what
-- ---------------------------------------------------------------------

alter table profiles enable row level security;
alter table video_overrides enable row level security;
alter table categories enable row level security;
alter table channels enable row level security;
alter table contributor_profiles enable row level security;
alter table channels_extra enable row level security;
alter table videos enable row level security;

-- profiles: you can see your own; admins see everyone and change roles
drop policy if exists "read own profile" on profiles;
drop policy if exists "read profiles" on profiles;
create policy "read profiles" on profiles
  for select using (user_id = auth.uid() or public.my_role() = 'admin');

drop policy if exists "admin updates roles" on profiles;
create policy "admin updates roles" on profiles
  for update using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- video_overrides: everyone reads; members and admins write
drop policy if exists "anyone can read overrides" on video_overrides;
create policy "anyone can read overrides" on video_overrides
  for select using (true);

drop policy if exists "admins write overrides" on video_overrides;
drop policy if exists "editors write overrides" on video_overrides;
create policy "editors write overrides" on video_overrides
  for all
  using (public.my_role() in ('admin', 'member'))
  with check (public.my_role() in ('admin', 'member'));

-- contributor_profiles: everyone can read (it is shown in the footer); you write only your own, and only as member/admin
drop policy if exists "anyone reads contributor profiles" on contributor_profiles;
create policy "anyone reads contributor profiles" on contributor_profiles
  for select using (true);

drop policy if exists "editors add own contributor profile" on contributor_profiles;
create policy "editors add own contributor profile" on contributor_profiles
  for insert with check (user_id = auth.uid() and public.my_role() in ('admin', 'member'));

drop policy if exists "editors update own contributor profile" on contributor_profiles;
create policy "editors update own contributor profile" on contributor_profiles
  for update
  using (user_id = auth.uid() and public.my_role() in ('admin', 'member'))
  with check (user_id = auth.uid() and public.my_role() in ('admin', 'member'));

drop policy if exists "delete own contributor profile" on contributor_profiles;
create policy "delete own contributor profile" on contributor_profiles
  for delete using (user_id = auth.uid());

grant select on public.public_contributors to anon, authenticated;

-- categories: everyone reads; only admins add, change or delete topics
drop policy if exists "anyone reads categories" on categories;
create policy "anyone reads categories" on categories
  for select using (true);

drop policy if exists "admins write categories" on categories;
create policy "admins write categories" on categories
  for all using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- channels: everyone reads; members and admins add/change; only admins delete
drop policy if exists "anyone reads channels table" on channels;
create policy "anyone reads channels table" on channels
  for select using (true);

drop policy if exists "editors add channels table" on channels;
create policy "editors add channels table" on channels
  for insert with check (public.my_role() in ('admin', 'member'));

drop policy if exists "editors update channels table" on channels;
create policy "editors update channels table" on channels
  for update
  using (public.my_role() in ('admin', 'member'))
  with check (public.my_role() in ('admin', 'member'));

drop policy if exists "admins delete channels table" on channels;
create policy "admins delete channels table" on channels
  for delete using (public.my_role() = 'admin');

-- channels_extra (older table): everyone reads; members and admins add/change; only admins delete
drop policy if exists "anyone reads channels" on channels_extra;
create policy "anyone reads channels" on channels_extra
  for select using (true);

drop policy if exists "editors add channels" on channels_extra;
create policy "editors add channels" on channels_extra
  for insert with check (public.my_role() in ('admin', 'member'));

drop policy if exists "editors update channels" on channels_extra;
create policy "editors update channels" on channels_extra
  for update
  using (public.my_role() in ('admin', 'member'))
  with check (public.my_role() in ('admin', 'member'));

drop policy if exists "admins delete channels" on channels_extra;
create policy "admins delete channels" on channels_extra
  for delete using (public.my_role() = 'admin');

-- videos: everyone reads; members and admins add/change; only admins delete
drop policy if exists "anyone reads videos" on videos;
create policy "anyone reads videos" on videos
  for select using (true);

drop policy if exists "editors add videos" on videos;
create policy "editors add videos" on videos
  for insert with check (public.my_role() in ('admin', 'member'));

drop policy if exists "editors update videos" on videos;
create policy "editors update videos" on videos
  for update
  using (public.my_role() in ('admin', 'member'))
  with check (public.my_role() in ('admin', 'member'));

drop policy if exists "admins delete videos" on videos;
create policy "admins delete videos" on videos
  for delete using (public.my_role() = 'admin');


-- ---------------------------------------------------------------------
-- 4. Tidy up accounts that already exist
-- ---------------------------------------------------------------------

-- Accounts created before the sign-up helper existed get a pending profile.
-- (This never changes someone who already has a profile, so admins stay admins.)
insert into profiles (user_id, email, role)
select u.id, u.email, 'pending'
from auth.users u
where u.id not in (select user_id from profiles);

-- Fill in the email for profiles that don't have it yet.
update profiles p
set email = u.email
from auth.users u
where u.id = p.user_id and p.email is null;


-- ---------------------------------------------------------------------
-- 5. Make yourself the admin (run this ONCE, separately, after the above)
--
-- 1) Create your account: Authentication -> Users -> Add user.
-- 2) Copy its "User UID".
-- 3) Remove the two dashes in front of the lines below, paste your UID, and run them.
-- ---------------------------------------------------------------------

-- update profiles set role = 'admin' where user_id = 'PASTE-YOUR-USER-UID-HERE';
