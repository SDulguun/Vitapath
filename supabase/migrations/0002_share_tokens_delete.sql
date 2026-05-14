-- VitaPath migration 0002 — share_tokens self-delete policy
-- Adds the missing DELETE policy on public.share_tokens so the quiz
-- owner can revoke their own share link via the user-scoped client.
-- Mirrors the ownership check used by share_tokens_self_select /
-- share_tokens_self_insert in 0001_init.sql.
--
-- Apply this migration ONCE in the Supabase SQL Editor:
--   Supabase dashboard → SQL Editor → New query → paste this file → Run.
-- Then run `npm run verify:db` from the repo root. The share_tokens
-- policy count should bump from 2 to 3.

drop policy if exists share_tokens_self_delete on public.share_tokens;

create policy share_tokens_self_delete on public.share_tokens
  for delete using (
    exists (
      select 1 from public.quizzes q
      where q.id = share_tokens.quiz_id and q.user_id = auth.uid()
    )
  );
