import { test, expect } from "@playwright/test";
import {
  adminClient,
  deleteUser,
  signInAs,
  uniqueEmail,
} from "./helpers/test-env";

const TEST_EMAIL = uniqueEmail("share");

async function takeAQuiz(page: import("@playwright/test").Page) {
  await page.goto("/quiz/1");
  await page.selectOption('select[name="age_band"]', "19-30");
  await page.selectOption('select[name="sex_at_birth"]', "female");
  await page.selectOption('select[name="pregnancy_status"]', "no");
  await page.getByTestId("quiz-next").click();

  await page.selectOption('select[name="dietary_pattern"]', "vegan");
  await page.fill('input[name="fruits_veggies_per_day"]', "5");
  await page.selectOption('select[name="fish_per_week"]', "never");
  await page.selectOption('select[name="dairy_per_week"]', "never");
  await page.getByTestId("quiz-next").click();

  await page.fill('input[name="sleep_hours"]', "7");
  await page.fill('input[name="sleep_quality"]', "4");
  await page.selectOption('select[name="trouble_falling_asleep"]', "rarely");
  await page.getByTestId("quiz-next").click();

  await page.fill('input[name="stress_level"]', "3");
  await page.selectOption('select[name="exercise_per_week"]', "3-4");
  await page.selectOption('select[name="sun_exposure"]', "minimal");
  await page.getByTestId("quiz-next").click();

  await page.selectOption('select[name="alcohol_per_week"]', "0");
  await page.getByTestId("quiz-next").click();
  await expect(page).toHaveURL(/\/results/, { timeout: 15_000 });
}

test.describe.serial("share flow", () => {
  test.afterAll(async () => {
    await deleteUser(TEST_EMAIL);
  });

  test("authed user mints a share link, anon visits it and sees the result; expired token shows expired state", async ({
    page,
    browser,
  }) => {
    await signInAs(page, TEST_EMAIL);

    // Wipe prior data
    const admin = adminClient();
    const { data: usersData } = await admin.auth.admin.listUsers();
    const userId = usersData?.users?.find((u) => u.email === TEST_EMAIL)?.id;
    expect(userId).toBeTruthy();
    await admin.from("quizzes").delete().eq("user_id", userId!);

    await takeAQuiz(page);

    // Click share, capture URL
    await page.getByTestId("share-button").click();
    await expect(page.getByTestId("share-link-box")).toBeVisible({
      timeout: 10_000,
    });
    const url = await page.getByTestId("share-url").inputValue();
    expect(url).toMatch(/\/r\/[A-Za-z0-9_-]{16,}$/);

    // Anon visit in a fresh context — must render without auth.
    const anonContext = await browser.newContext();
    const anonPage = await anonContext.newPage();
    await anonPage.goto(url);
    // Should NOT have been redirected to /login
    expect(anonPage.url()).toBe(url);
    await expect(anonPage.getByTestId("score-section")).toBeVisible();
    await expect(anonPage.getByTestId("rec-list")).toBeVisible();
    // Personal-mode controls (history/share button) should not be shown
    await expect(anonPage.getByTestId("share-button")).toHaveCount(0);
    await anonContext.close();

    // Expired-token path: insert an expired share_token directly via admin
    // and visit a brand-new URL. The page must render the expired state.
    const { data: quizzes } = await admin
      .from("quizzes")
      .select("id")
      .eq("user_id", userId!);
    const quizId = quizzes?.[0]?.id;
    expect(quizId).toBeTruthy();
    const expiredToken = `expired-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const { error: insertErr } = await admin.from("share_tokens").insert({
      quiz_id: quizId,
      token: expiredToken,
      expires_at: new Date(Date.now() - 60_000).toISOString(),
    });
    expect(insertErr, "expired token insert should succeed").toBeFalsy();

    const expiredContext = await browser.newContext();
    const expiredPage = await expiredContext.newPage();
    await expiredPage.goto(`/r/${expiredToken}`);
    await expect(expiredPage.getByTestId("share-expired")).toBeVisible();
    await expiredContext.close();
  });
});
