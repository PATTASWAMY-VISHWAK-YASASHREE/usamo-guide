-- Fix "Database error saving new user" on first OAuth (e.g. Google) sign-in.
--
-- Root cause: the AFTER INSERT trigger on auth.users (trigger_increment_num_users)
-- could throw while incrementing the metrics counter, which rolls back the
-- auth.users insert and makes GoTrue return `server_error / Database error
-- saving new user`. A metrics counter must never be able to block sign-in.

-- Ensure the metrics table + counter row exist (guards against schema drift).
create table if not exists public.app_metrics (
  key text primary key,
  value bigint not null default 0
);

insert into public.app_metrics (key, value)
  values ('num_users', 0)
  on conflict (key) do nothing;

-- Make the counter trigger non-blocking: any failure is swallowed so it can
-- never roll back user creation. search_path is pinned per Supabase guidance
-- for SECURITY DEFINER functions.
create or replace function public.increment_num_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    update public.app_metrics set value = value + 1 where key = 'num_users';
  exception when others then
    -- never let a metrics update roll back user creation
    null;
  end;
  return NEW;
end;
$$;

-- Latent bug: profiles has RLS enabled with SELECT/UPDATE policies but no
-- INSERT policy, so the client-side profile upsert after login is blocked.
-- (Idempotent: drop-if-exists then create.)
drop policy if exists "Users can create their profile" on public.profiles;
create policy "Users can create their profile"
  on public.profiles for insert
  with check (auth.uid() = id);
