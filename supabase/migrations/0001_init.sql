-- VitaPath initial schema
-- Tables: profiles, quizzes, recommendations, share_tokens
-- All tables have RLS enabled and per-user policies.
-- A security-definer function (get_shared_result) allows public reads of shared results.
-- A second security-definer function (_verify_init) is used by scripts/verify-db.mjs.
--
-- Apply this migration ONCE in the Supabase SQL Editor:
--   Supabase dashboard → SQL Editor → New query → paste this file → Run.
-- Then run `npm run verify:db` from the repo root.

-- ─── Tables ────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  dob date,
  sex_at_birth text check (sex_at_birth in ('male','female','intersex','prefer_not_to_say')),
  pregnancy_status text check (pregnancy_status in ('not_applicable','no','yes','unsure')),
  created_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null,
  health_score int,
  created_at timestamptz not null default now()
);
create index if not exists quizzes_user_id_idx on public.quizzes(user_id);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  supplement_slug text not null,
  dose text,
  rationale jsonb,
  evidence_refs jsonb,
  created_at timestamptz not null default now()
);
create index if not exists recommendations_quiz_id_idx on public.recommendations(quiz_id);

create table if not exists public.share_tokens (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  token text unique not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);
create index if not exists share_tokens_token_idx on public.share_tokens(token);

-- ─── RLS ───────────────────────────────────────────────────────────────────

alter table public.profiles        enable row level security;
alter table public.quizzes         enable row level security;
alter table public.recommendations enable row level security;
alter table public.share_tokens    enable row level security;

-- profiles: a user owns their own row
drop policy if exists profiles_self_select on public.profiles;
drop policy if exists profiles_self_insert on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_select on public.profiles
  for select using (auth.uid() = id);
create policy profiles_self_insert on public.profiles
  for insert with check (auth.uid() = id);
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id);

-- quizzes: a user owns their own quizzes
drop policy if exists quizzes_self_select on public.quizzes;
drop policy if exists quizzes_self_insert on public.quizzes;
create policy quizzes_self_select on public.quizzes
  for select using (auth.uid() = user_id);
create policy quizzes_self_insert on public.quizzes
  for insert with check (auth.uid() = user_id);

-- recommendations: visible/creatable iff parent quiz belongs to the user
drop policy if exists recommendations_self_select on public.recommendations;
drop policy if exists recommendations_self_insert on public.recommendations;
create policy recommendations_self_select on public.recommendations
  for select using (
    exists (
      select 1 from public.quizzes q
      where q.id = recommendations.quiz_id and q.user_id = auth.uid()
    )
  );
create policy recommendations_self_insert on public.recommendations
  for insert with check (
    exists (
      select 1 from public.quizzes q
      where q.id = recommendations.quiz_id and q.user_id = auth.uid()
    )
  );

-- share_tokens: only the quiz owner can create/list
drop policy if exists share_tokens_self_select on public.share_tokens;
drop policy if exists share_tokens_self_insert on public.share_tokens;
create policy share_tokens_self_select on public.share_tokens
  for select using (
    exists (
      select 1 from public.quizzes q
      where q.id = share_tokens.quiz_id and q.user_id = auth.uid()
    )
  );
create policy share_tokens_self_insert on public.share_tokens
  for insert with check (
    exists (
      select 1 from public.quizzes q
      where q.id = share_tokens.quiz_id and q.user_id = auth.uid()
    )
  );

-- ─── Security-definer RPC: public read of a shared result by token ────────

create or replace function public.get_shared_result(p_token text)
returns table (
  quiz_id uuid,
  health_score int,
  answers jsonb,
  recommendations jsonb,
  shared_at timestamptz,
  expires_at timestamptz
)
language sql
security definer
set search_path = public, pg_catalog
as $$
  select
    q.id as quiz_id,
    q.health_score,
    q.answers,
    coalesce(
      (select jsonb_agg(to_jsonb(r) order by r.created_at)
         from public.recommendations r
         where r.quiz_id = q.id),
      '[]'::jsonb
    ) as recommendations,
    s.created_at as shared_at,
    s.expires_at
  from public.share_tokens s
  join public.quizzes q on q.id = s.quiz_id
  where s.token = p_token
    and s.expires_at > now();
$$;
revoke all on function public.get_shared_result(text) from public;
grant execute on function public.get_shared_result(text) to anon, authenticated;

-- ─── Verification helper used by scripts/verify-db.mjs ────────────────────
-- Returns a JSON snapshot of the schema state so the verify script can assert.

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
      and c.relname in ('profiles', 'quizzes', 'recommendations', 'share_tokens')
  ),
  policies as (
    select tablename as table_name, count(*)::int as policy_count
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'quizzes', 'recommendations', 'share_tokens')
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
