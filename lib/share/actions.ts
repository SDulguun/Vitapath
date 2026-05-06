"use server";

import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export type CreateShareTokenResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

/**
 * Mint a 32-char URL-safe random token bound to a quiz the caller owns.
 * RLS policy share_tokens_self_insert enforces ownership server-side.
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

  const { error } = await supabase.from("share_tokens").insert({
    quiz_id: quizId,
    token,
  });

  if (error) {
    // Most likely RLS denial (user trying to share someone else's quiz)
    return { ok: false, error: error.message };
  }

  return { ok: true, token };
}
