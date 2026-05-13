"use server";

import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreateShareTokenResult =
  | { ok: true; token: string; expires_at: string }
  | { ok: false; error: string };

/**
 * Mint a 32-char URL-safe random token bound to a quiz the caller owns.
 * RLS policy share_tokens_self_insert enforces ownership server-side.
 * Returns the new token + its expires_at so the ShareDialog can render
 * the "Link expires {date}" line without a second query.
 */
export async function createShareToken(
  quizId: string,
): Promise<CreateShareTokenResult> {
  if (!/^[0-9a-fA-F-]{36}$/.test(quizId)) {
    return { ok: false, error: "Invalid quiz id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, error: "You must be signed in to share a result." };
  }

  const token = randomBytes(24).toString("base64url");

  const { data, error } = await supabase
    .from("share_tokens")
    .insert({ quiz_id: quizId, token })
    .select("token, expires_at")
    .single();

  if (error || !data) {
    // Most likely RLS denial (user trying to share someone else's quiz)
    return { ok: false, error: error?.message ?? "Insert failed." };
  }

  return { ok: true, token: data.token, expires_at: data.expires_at };
}

export type RevokeShareTokenResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Delete a share token the caller owns. The 0001_init.sql migration does
 * not include a DELETE policy on share_tokens (the migration file is
 * out-of-scope per the redesign brief), so we:
 *   1. Pre-check ownership via the user-scoped client (RLS limits the
 *      SELECT to tokens whose parent quiz belongs to auth.uid()).
 *   2. If the SELECT returns the row, issue the DELETE via the admin
 *      client to bypass the missing policy.
 *
 * This authorizes the mutation server-side without needing a schema
 * change. If you'd rather add a proper share_tokens_self_delete policy,
 * a new migration (e.g. 0002_share_tokens_delete.sql) is the cleaner
 * long-term fix.
 */
export async function revokeShareToken(
  token: string,
): Promise<RevokeShareTokenResult> {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) {
    return { ok: false, error: "Invalid token." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false, error: "You must be signed in to revoke." };
  }

  // Ownership pre-check via RLS-scoped client.
  const { data: row, error: selectError } = await supabase
    .from("share_tokens")
    .select("id")
    .eq("token", token)
    .maybeSingle();
  if (selectError || !row) {
    return { ok: false, error: "Token not found or already revoked." };
  }

  const admin = createAdminClient();
  const { error: deleteError } = await admin
    .from("share_tokens")
    .delete()
    .eq("id", row.id);
  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }
  return { ok: true };
}
