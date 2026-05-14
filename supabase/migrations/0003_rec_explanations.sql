-- VitaPath migration 0003 — rec_explanations cache table
-- Caches LLM-generated "Why this for me?" explanations keyed by
-- (quiz_id, supplement_slug). First click on an expander costs an
-- LLM call; every subsequent click on the same recommendation reads
-- from this table for free.
--
-- RLS: only the quiz owner can read or insert. Shared-link viewers
-- (/r/[token]) do not see explanations in this iteration.
--
-- Apply this migration ONCE in the Supabase SQL Editor:
--   Supabase dashboard → SQL Editor → New query → paste this file → Run.
-- Then run `npm run verify:db` from the repo root.

create table if not exists public.rec_explanations (
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  supplement_slug text not null,
  explanation text not null,
  generated_at timestamptz not null default now(),
  primary key (quiz_id, supplement_slug)
);

alter table public.rec_explanations enable row level security;

drop policy if exists rec_explanations_self_select on public.rec_explanations;
drop policy if exists rec_explanations_self_insert on public.rec_explanations;

create policy rec_explanations_self_select on public.rec_explanations
  for select using (
    exists (
      select 1 from public.quizzes q
      where q.id = rec_explanations.quiz_id and q.user_id = auth.uid()
    )
  );

create policy rec_explanations_self_insert on public.rec_explanations
  for insert with check (
    exists (
      select 1 from public.quizzes q
      where q.id = rec_explanations.quiz_id and q.user_id = auth.uid()
    )
  );

-- ─── Extend _verify_init to cover the new table ──────────────────────────
-- The RPC in 0001 hardcodes a table allow-list. Replace it with a version
-- that also reports rec_explanations so `npm run verify:db` sees policies
-- and RLS for all five tables in one round-trip.

create or replace function public._verify_init()
returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
  with tables as (
    select c.relname as table_name, c.relrowsecurity as rls_enabled
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'profiles', 'quizzes', 'recommendations', 'share_tokens',
        'rec_explanations'
      )
  ),
  policies as (
    select tablename as table_name, count(*)::int as policy_count
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles', 'quizzes', 'recommendations', 'share_tokens',
        'rec_explanations'
      )
    group by tablename
  ),
  fn_shared as (
    select count(*) > 0 as exists
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_shared_result'
  )
  select jsonb_build_object(
    'tables', coalesce(
      (select jsonb_object_agg(table_name, jsonb_build_object('rls', rls_enabled)) from tables),
      '{}'::jsonb
    ),
    'policies', coalesce(
      (select jsonb_object_agg(table_name, policy_count) from policies),
      '{}'::jsonb
    ),
    'get_shared_result_exists', (select exists from fn_shared)
  );
$$;
grant execute on function public._verify_init() to anon, authenticated, service_role;
