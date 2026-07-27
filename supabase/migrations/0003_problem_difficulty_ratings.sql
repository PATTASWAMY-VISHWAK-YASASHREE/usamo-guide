create table if not exists public.problem_difficulty_ratings (
  problem_id text not null,
  user_id uuid null references auth.users on delete set null,
  rating numeric not null,
  created_at timestamptz not null default now(),
  primary key (problem_id, user_id)
);

create index if not exists problem_difficulty_ratings_problem_id_idx
  on public.problem_difficulty_ratings (problem_id);

alter table public.problem_difficulty_ratings enable row level security;

create policy "Problem difficulty ratings are readable by everyone"
  on public.problem_difficulty_ratings for select
  using (true);

create policy "Problem difficulty ratings can be created by everyone"
  on public.problem_difficulty_ratings for insert
  with check (true);

create policy "Problem difficulty ratings can be updated by everyone"
  on public.problem_difficulty_ratings for update
  using (true)
  with check (true);
