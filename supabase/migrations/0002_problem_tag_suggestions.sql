create table if not exists public.problem_tag_suggestions (
  id uuid primary key default gen_random_uuid(),
  problem_id text not null,
  tag text not null,
  user_id uuid null references auth.users on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.problem_tag_approvals (
  problem_id text not null,
  tag text not null,
  approved_at timestamptz not null default now(),
  primary key (problem_id, tag)
);

create index if not exists problem_tag_suggestions_problem_id_tag_idx
  on public.problem_tag_suggestions (problem_id, tag);

alter table public.problem_tag_suggestions enable row level security;
alter table public.problem_tag_approvals enable row level security;

create policy "Problem tag suggestions are readable by everyone"
  on public.problem_tag_suggestions for select
  using (true);

create policy "Problem tag suggestions can be created by everyone"
  on public.problem_tag_suggestions for insert
  with check (true);

create policy "Approved problem tags are readable by everyone"
  on public.problem_tag_approvals for select
  using (true);

create policy "Approved problem tags can be created by everyone"
  on public.problem_tag_approvals for insert
  with check (true);
