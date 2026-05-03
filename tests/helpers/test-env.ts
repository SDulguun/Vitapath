// Shared helpers for Playwright specs: load .env.local + admin Supabase client +
// signInAs() that uses an admin-minted magic link to drop a session cookie.
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

const envPath = resolve(process.cwd(), ".env.local");
if (!existsSync(envPath)) {
  throw new Error("tests/helpers/test-env.ts: .env.local not found");
}
const env = Object.fromEntries(
  readFileSync(envPath, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

export const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL!;
export const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY!;

export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function uniqueEmail(prefix = "e2e"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@vitapath.test`;
}

/** Ensure user exists, mint a magic-link token via admin, visit our callback. */
export async function signInAs(page: Page, email: string): Promise<void> {
  const admin = adminClient();
  const { data: usersData } = await admin.auth.admin.listUsers();
  if (!usersData?.users?.some((u) => u.email === email)) {
    await admin.auth.admin.createUser({ email, email_confirm: true });
  }
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error || !data?.properties?.hashed_token) {
    throw error ?? new Error("generateLink: missing hashed_token");
  }
  await page.goto(
    `/auth/callback?token_hash=${data.properties.hashed_token}&type=magiclink&next=/history`,
  );
  // Land on /history → confirms session is established
  await page.waitForURL(/\/history/);
}

export async function deleteUser(email: string): Promise<void> {
  const admin = adminClient();
  const { data } = await admin.auth.admin.listUsers();
  const u = data?.users?.find((x) => x.email === email);
  if (u) await admin.auth.admin.deleteUser(u.id);
}
