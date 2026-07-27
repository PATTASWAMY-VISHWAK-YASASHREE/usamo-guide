do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'user_data'
  ) then
    update public.user_data
    set data = jsonb_set(
      jsonb_set(
        coalesce(data, '{}'::jsonb),
        '{problemTaggingStats}',
        coalesce(data->'problemTaggingStats', '{"problemsTagged":0,"taggedProblemIds":[]}'::jsonb)
      ),
      '{problemDifficultyStats}',
      coalesce(data->'problemDifficultyStats', '{"problemsRated":0,"ratedProblemIds":[]}'::jsonb)
    )
    where coalesce(data, '{}'::jsonb) -> 'problemTaggingStats' is null
       or coalesce(data, '{}'::jsonb) -> 'problemDifficultyStats' is null;
  end if;
end $$;
