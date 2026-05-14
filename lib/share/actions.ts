"use server";

import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

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
 * Delete a share token the caller owns. Migration 0002 added the
 * share_tokens_self_delete RLS policy, so the user-scoped client can
 * issue the DELETE directly — Postgres enforces ownership.
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

  const { error, count } = await supabase
    .from("share_tokens")
    .delete({ count: "exact" })
    .eq("token", token);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (count === 0) {
    return { ok: false, error: "Token not found or already revoked." };
  }
  return { ok: true };
}
