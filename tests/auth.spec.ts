import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// ── Read .env.local without dotenv ─────────────────────────────────────────
const envPath = resolve(process.cwd(), ".env.local");
if (!existsSync(envPath)) {
  throw new Error("tests/auth.spec.ts: .env.local not found");
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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY!;
const TEST_EMAIL = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@vitapath.test`;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

test.describe.serial("magic-link auth round-trip", () => {
  test.afterAll(async () => {
    const { data } = await admin.auth.admin.listUsers();
    const u = data?.users?.find((x) => x.email === TEST_EMAIL);
    if (u) await admin.auth.admin.deleteUser(u.id);
  });

  test("anonymous /history redirects to /login", async ({ page }) => {
    await page.goto("/history");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page renders the magic-link form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send magic link" }),
    ).toBeVisible();
  });

  test("admin-minted magic link logs in, sees /history, can sign out", async ({
    page,
  }) => {
    // Ensure the user exists & is confirmed (signInWithOtp from previous test
    // may have created a row but we don't want to depend on email delivery)
    const { data: usersData } = await admin.auth.admin.listUsers();
    if (!usersData?.users?.some((u) => u.email === TEST_EMAIL)) {
      await admin.auth.admin.createUser({
        email: TEST_EMAIL,
        email_confirm: true,
      });
    }

    // Mint a magic-link token via admin API (bypasses email delivery).
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: TEST_EMAIL,
    });
    expect(error, "generateLink should succeed").toBeFalsy();
    const tokenHash = data?.properties?.hashed_token;
    expect(tokenHash, "hashed_token should be present").toBeTruthy();

    // Visit our callback with the token_hash flow.
    await page.goto(
      `/auth/callback?token_hash=${tokenHash}&type=magiclink&next=/history`,
    );
    await expect(page).toHaveURL(/\/history/);
    await expect(page.getByTestId("history-greeting")).toContainText(TEST_EMAIL);

    // Sign out → land on /
    await page.getByTestId("signout-button").click();
    await expect(page).toHaveURL(new RegExp("^http://localhost:3000/?$"));

    // /history again should redirect back to /login
    await page.goto("/history");
    await expect(page).toHaveURL(/\/login/);
  });
});
