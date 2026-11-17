-- Run this once in Supabase: SQL Editor -> New query -> paste everything -> Run.
-- Result: anyone can create an account, but starts as "pending" (cannot edit).
-- Admins approve people (member) or promote them (admin) on the edit page.

-- 1. profiles: remember the email and allow a "pending" role
alter table profiles add column if not exists email text;
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('admin', 'member', 'pending'));
alter table profiles alter column role set default 'pending';

-- 2. every new sign-up automatically gets a pending profile
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email, role)
  values (new.id, new.email, 'pending')
  on conflict (user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. fill in the email of accounts that already exist (your admin account)
update profiles p set email = u.email from auth.users u where u.id = p.user_id and p.email is null;

-- 4. helper: the role of the person making the request
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where user_id = auth.uid()
$$;

-- 5. rules: admins and members may edit videos; only admins see everyone and change roles
drop policy if exists "admins write overrides" on video_overrides;
drop policy if exists "editors write overrides" on video_overrides;
create policy "editors write overrides" on video_overrides
  for all
  using (public.my_role() in ('admin', 'member'))
  with check (public.my_role() in ('admin', 'member'));

drop policy if exists "read own profile" on profiles;
drop policy if exists "read profiles" on profiles;
create policy "read profiles" on profiles
  for select using (user_id = auth.uid() or public.my_role() = 'admin');

drop policy if exists "admin updates roles" on profiles;
create policy "admin updates roles" on profiles
  for update using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
