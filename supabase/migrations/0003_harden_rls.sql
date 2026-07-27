-- Security hardening for RLS, privilege escalation, and SECURITY DEFINER functions.
--
-- Addresses issues found in an audit of 0001_init.sql / 0002_fix_signup.sql:
--   1. profiles: a user could set is_admin/can_moderate/can_create_groups on
--      their own row (self-service privilege escalation).
--   2. app_metrics: RLS was never enabled, leaving it world-readable/writable
--      through the Data API.
--   3. The post/problem ordering SECURITY DEFINER functions had no authorization
--      check and were EXECUTE-able by anyone (incl. anon), bypassing group RLS.
--   4. group_problem_submissions: any authenticated user could insert a
--      submission into any group (no membership check).
--   5. Most SECURITY DEFINER functions did not pin search_path.
--
-- Everything here is idempotent so it can be re-applied safely.

-- ---------------------------------------------------------------------------
-- 1. Prevent self-service privilege escalation on profiles.
--
-- RLS policies cannot compare OLD vs NEW columns, so we use column-level
-- privileges. NOTE: a table-level INSERT/UPDATE grant (which Supabase's default
-- grants hand to anon/authenticated) covers every column, so a column-level
-- REVOKE on top of it does nothing. We must drop the blanket table grant and
-- re-grant only the safe columns. SELECT is left intact (the app reads its own
-- is_admin), and the service_role key used by the admin edge function keeps its
-- own table-level grant, so admin permission changes still work.
-- ---------------------------------------------------------------------------
revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, display_name, avatar_url) on public.profiles to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Enable RLS on app_metrics. No policies -> no direct client access.
-- The increment_num_users() trigger is SECURITY DEFINER and bypasses RLS,
-- so the counter keeps working; nothing client-side reads this table.
-- ---------------------------------------------------------------------------
alter table public.app_metrics enable row level security;

-- ---------------------------------------------------------------------------
-- 3. Require group membership to insert submissions (and only as yourself).
-- ---------------------------------------------------------------------------
drop policy if exists "Members can insert submissions"
  on public.group_problem_submissions;
create policy "Members can insert submissions"
  on public.group_problem_submissions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.groups g
      where g.id = group_id
        and (
          auth.uid() = any(g.owner_ids)
          or auth.uid() = any(g.admin_ids)
          or auth.uid() = any(g.member_ids)
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Authorization helper: is the caller an owner/admin of the group?
-- SECURITY DEFINER so it can read groups regardless of the caller's RLS view;
-- auth.uid() still reflects the calling user inside a definer function.
-- ---------------------------------------------------------------------------
create or replace function public.is_group_manager(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.groups g
    where g.id = p_group_id
      and (auth.uid() = any(g.owner_ids) or auth.uid() = any(g.admin_ids))
  );
$$;

-- ---------------------------------------------------------------------------
-- 5. Add authorization guards + pinned search_path to the ordering / points
-- functions. Signatures and parameter names are unchanged so existing RPC
-- calls keep working; only unauthorized callers now get an error.
-- ---------------------------------------------------------------------------
create or replace function public.groups_append_post_ordering(group_id uuid, post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_group_manager(group_id) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  update public.groups
    set post_ordering = array_append(post_ordering, post_id)
  where id = group_id;
end;
$$;

create or replace function public.groups_remove_post_ordering(group_id uuid, post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_group_manager(group_id) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  update public.groups
    set post_ordering = array_remove(post_ordering, post_id)
  where id = group_id;
end;
$$;

create or replace function public.posts_append_problem_ordering(post_id uuid, problem_id uuid, points integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  select group_id into v_group_id from public.group_posts where id = post_id;
  if v_group_id is null or not public.is_group_manager(v_group_id) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  update public.group_posts
    set problem_ordering = array_append(problem_ordering, problem_id),
        points_per_problem = jsonb_set(
          coalesce(points_per_problem, '{}'::jsonb),
          array[problem_id::text],
          to_jsonb(points),
          true
        )
  where id = post_id;
end;
$$;

create or replace function public.posts_remove_problem_ordering(post_id uuid, problem_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  select group_id into v_group_id from public.group_posts where id = post_id;
  if v_group_id is null or not public.is_group_manager(v_group_id) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  update public.group_posts
    set problem_ordering = array_remove(problem_ordering, problem_id),
        points_per_problem = points_per_problem - problem_id::text
  where id = post_id;
end;
$$;

create or replace function public.posts_update_problem_points(post_id uuid, problem_id uuid, points integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  select group_id into v_group_id from public.group_posts where id = post_id;
  if v_group_id is null or not public.is_group_manager(v_group_id) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  update public.group_posts
    set points_per_problem = jsonb_set(
      coalesce(points_per_problem, '{}'::jsonb),
      array[problem_id::text],
      to_jsonb(points),
      true
    )
  where id = post_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Pin search_path on the remaining SECURITY DEFINER functions whose bodies
-- we are not otherwise changing (ALTER avoids re-declaring the whole body).
-- ---------------------------------------------------------------------------
alter function public.upvote_user_problem_solution(uuid) set search_path = public;
alter function public.remove_upvote_user_problem_solution(uuid) set search_path = public;
alter function public.groups_leave(uuid) set search_path = public;
alter function public.groups_remove_member(uuid, uuid) set search_path = public;
alter function public.groups_update_member_permissions(uuid, uuid, text) set search_path = public;

-- update_group_leaderboard is rewritten (not just ALTERed) to fix a pre-existing
-- bug: the local variable `total_points` collided with the group_leaderboard
-- column of the same name, raising "column reference total_points is ambiguous"
-- on every submission insert. Renamed to v_total_points; behavior is otherwise
-- identical, plus search_path is now pinned.
create or replace function public.update_group_leaderboard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  problem_points integer;
  computed_points numeric;
  existing_best numeric;
  v_post_scores jsonb;
  v_details jsonb;
  post_total numeric;
  v_total_points numeric;
  profile record;
begin
  if NEW.score is null then
    return NEW;
  end if;

  select points into problem_points from public.group_problems where id = NEW.problem_id;
  if problem_points is null then
    return NEW;
  end if;

  computed_points := NEW.score * problem_points;

  insert into public.group_leaderboard (group_id, user_id)
    values (NEW.group_id, NEW.user_id)
    on conflict do nothing;

  select * into profile from public.profiles where id = NEW.user_id;

  select post_scores, details into v_post_scores, v_details
    from public.group_leaderboard
    where group_id = NEW.group_id and user_id = NEW.user_id
    for update;

  v_post_scores := coalesce(v_post_scores, '{}'::jsonb);
  v_details := coalesce(v_details, '{}'::jsonb);

  -- jsonb_set cannot create missing parent keys, so nested writes into a
  -- not-yet-existing per-post object were silently dropped, leaving the
  -- leaderboard permanently empty (total_points stuck at 0). Seed the per-post
  -- object first so the nested jsonb_set calls below actually take effect.
  if not (v_post_scores ? NEW.post_id::text) then
    v_post_scores := jsonb_set(v_post_scores, array[NEW.post_id::text], '{}'::jsonb, true);
  end if;
  if not (v_details ? NEW.post_id::text) then
    v_details := jsonb_set(v_details, array[NEW.post_id::text], '{}'::jsonb, true);
  end if;

  existing_best := (v_details #>> array[NEW.post_id::text, NEW.problem_id::text, 'bestScore'])::numeric;
  if existing_best is null or computed_points >= existing_best then
    v_details := jsonb_set(
      v_details,
      array[NEW.post_id::text, NEW.problem_id::text],
      jsonb_build_object(
        'bestScore', computed_points,
        'bestScoreStatus', NEW.verdict,
        'bestScoreTimestamp', NEW.timestamp,
        'bestScoreSubmissionId', NEW.submission_id
      ),
      true
    );
  end if;

  v_post_scores := jsonb_set(
    v_post_scores,
    array[NEW.post_id::text, NEW.problem_id::text],
    to_jsonb(computed_points),
    true
  );

  select sum((value)::numeric) into post_total
    from jsonb_each_text(v_post_scores -> NEW.post_id::text)
    where key <> 'totalPoints';

  v_post_scores := jsonb_set(
    v_post_scores,
    array[NEW.post_id::text, 'totalPoints'],
    to_jsonb(coalesce(post_total, 0)),
    true
  );

  select sum((value ->> 'totalPoints')::numeric) into v_total_points
    from jsonb_each(v_post_scores)
    where key <> 'totalPoints';

  update public.group_leaderboard
    set post_scores = v_post_scores,
        details = v_details,
        total_points = coalesce(v_total_points, 0),
        user_info = jsonb_build_object(
          'uid', NEW.user_id,
          'displayName', coalesce(profile.display_name, ''),
          'photoURL', profile.avatar_url
        )
  where group_id = NEW.group_id and user_id = NEW.user_id;

  return NEW;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Lock down EXECUTE. Functions default to EXECUTE for PUBLIC (incl. anon);
-- revoke that and grant only to the roles that should call each function.
-- ---------------------------------------------------------------------------
-- App RPCs: authenticated callers (service_role for any backend use).
revoke execute on function public.is_group_manager(uuid) from public;
revoke execute on function public.upvote_user_problem_solution(uuid) from public;
revoke execute on function public.remove_upvote_user_problem_solution(uuid) from public;
revoke execute on function public.groups_append_post_ordering(uuid, uuid) from public;
revoke execute on function public.groups_remove_post_ordering(uuid, uuid) from public;
revoke execute on function public.posts_append_problem_ordering(uuid, uuid, integer) from public;
revoke execute on function public.posts_remove_problem_ordering(uuid, uuid) from public;
revoke execute on function public.posts_update_problem_points(uuid, uuid, integer) from public;
revoke execute on function public.groups_leave(uuid) from public;
revoke execute on function public.groups_remove_member(uuid, uuid) from public;
revoke execute on function public.groups_update_member_permissions(uuid, uuid, text) from public;

grant execute on function public.is_group_manager(uuid) to authenticated, service_role;
grant execute on function public.upvote_user_problem_solution(uuid) to authenticated, service_role;
grant execute on function public.remove_upvote_user_problem_solution(uuid) to authenticated, service_role;
grant execute on function public.groups_append_post_ordering(uuid, uuid) to authenticated, service_role;
grant execute on function public.groups_remove_post_ordering(uuid, uuid) to authenticated, service_role;
grant execute on function public.posts_append_problem_ordering(uuid, uuid, integer) to authenticated, service_role;
grant execute on function public.posts_remove_problem_ordering(uuid, uuid) to authenticated, service_role;
grant execute on function public.posts_update_problem_points(uuid, uuid, integer) to authenticated, service_role;
grant execute on function public.groups_leave(uuid) to authenticated, service_role;
grant execute on function public.groups_remove_member(uuid, uuid) to authenticated, service_role;
grant execute on function public.groups_update_member_permissions(uuid, uuid, text) to authenticated, service_role;

-- Trigger functions are invoked by the trigger mechanism, not called directly;
-- no role needs EXECUTE on them.
revoke execute on function public.update_group_leaderboard() from public;
revoke execute on function public.increment_num_users() from public;
