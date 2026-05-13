"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { error?: string; sent?: boolean; email?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Magic-link sign-in. The previous draft derived the redirect from
 *  `Host` plus a localhost-vs-https guess, which silently fell back to
 *  Supabase's dashboard Site URL when the request lacked a Host header,
 *  baking `localhost:3000` into production emails (see v2 brief §9).
 *
 *  Resolution order is now:
 *    1. `Origin` header from the current request (always set for the POST
 *       that fires a server action).
 *    2. `NEXT_PUBLIC_SITE_URL` env var (per-environment).
 *    3. A hardcoded production URL as a last-resort safety net.
 *
 *  Both env vars + the Supabase dashboard Site URL + Redirect URLs list
 *  must be updated alongside this change. README has the checklist; see
 *  v2 §9.1 + §9.2. */
export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const headerList = await headers();
  const origin =
    headerList.get("origin")?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://vitamin-chi.vercel.app";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) return { error: error.message };
  return { sent: true, email };
}
