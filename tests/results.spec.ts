import { test, expect } from "@playwright/test";
import {
  adminClient,
  deleteUser,
  signInAs,
  uniqueEmail,
} from "./helpers/test-env";

const TEST_EMAIL = uniqueEmail("results");

// Helper: minimal but engine-friendly quiz walk that triggers several rules
// (low sun → vitamin D, vegan → B12, low fish → omega-3, female 19-30 → iron).
async function completeQuizAsVeganLowSunFemale(page: import("@playwright/test").Page) {
  await page.goto("/quiz/1");
  await page.selectOption('select[name="age_band"]', "19-30");
  await page.selectOption('select[name="sex_at_birth"]', "female");
  await page.selectOption('select[name="pregnancy_status"]', "no");
  await page.getByTestId("quiz-next").click();
  await expect(page).toHaveURL(/\/quiz\/2/);

  await page.selectOption('select[name="dietary_pattern"]', "vegan");
  await page.fill('input[name="fruits_veggies_per_day"]', "5");
  await page.selectOption('select[name="fish_per_week"]', "never");
  await page.selectOption('select[name="dairy_per_week"]', "never");
  await page.getByTestId("quiz-next").click();
  await expect(page).toHaveURL(/\/quiz\/3/);

  await page.fill('input[name="sleep_hours"]', "7");
  await page.fill('input[name="sleep_quality"]', "4");
  await page.selectOption('select[name="trouble_falling_asleep"]', "rarely");
  await page.getByTestId("quiz-next").click();
  await expect(page).toHaveURL(/\/quiz\/4/);

  await page.fill('input[name="stress_level"]', "3");
  await page.selectOption('select[name="exercise_per_week"]', "3-4");
  await page.selectOption('select[name="sun_exposure"]', "minimal");
  await page.getByTestId("quiz-next").click();
  await expect(page).toHaveURL(/\/quiz\/5/);

  await page.selectOption('select[name="alcohol_per_week"]', "0");
  // 'none' stays default-checked for medications and conditions
  await page.getByTestId("quiz-next").click();
  await expect(page).toHaveURL(/\/results/, { timeout: 15_000 });
}

test.describe.serial("results page", () => {
  test.afterAll(async () => {
    await deleteUser(TEST_EMAIL);
  });

  test("anonymous /results redirects to /login", async ({ page }) => {
    await page.goto("/results");
    await expect(page).toHaveURL(/\/login/);
  });

  test("results page renders score, recommendations, and citations after a full quiz", async ({
    page,
  }) => {
    await signInAs(page, TEST_EMAIL);

    // Wipe any prior rows so the latest-quiz fetch is unambiguous
    const admin = adminClient();
    const { data: usersData } = await admin.auth.admin.listUsers();
    const userId = usersData?.users?.find((u) => u.email === TEST_EMAIL)?.id;
    expect(userId).toBeTruthy();
    await admin.from("quizzes").delete().eq("user_id", userId!);

    await completeQuizAsVeganLowSunFemale(page);

    // Score section visible with a numeric value in [0, 100]
    await expect(page.getByTestId("score-section")).toBeVisible();
    const scoreText = await page.getByTestId("score-value").textContent();
    const scoreNum = Number(scoreText?.trim());
    expect(Number.isFinite(scoreNum)).toBe(true);
    expect(scoreNum).toBeGreaterThanOrEqual(0);
    expect(scoreNum).toBeLessThanOrEqual(100);

    // Recommendation list shows expected slugs for this profile
    const list = page.getByTestId("rec-list");
    await expect(list).toBeVisible();
    await expect(page.getByTestId("rec-vitamin_d")).toBeVisible();
    await expect(page.getByTestId("rec-vitamin_b12")).toBeVisible();
    await expect(page.getByTestId("rec-omega_3")).toBeVisible();
    await expect(page.getByTestId("rec-iron")).toBeVisible();

    // Each visible rec card carries at least one evidence citation with year
    const recSlugs = ["vitamin_d", "vitamin_b12", "omega_3", "iron"];
    for (const slug of recSlugs) {
      const evidence = page.getByTestId(`evidence-${slug}`);
      await expect(evidence).toBeVisible();
      // At least one bullet with a 4-digit year in parentheses
      await expect(evidence).toContainText(/\(\d{4}\)/);
    }

    // Disclaimer is present on the page
    await expect(
      page.getByText(/general dietary guidance, not medical advice/i),
    ).toBeVisible();

    // DB sanity: a recommendations row exists per visible card
    const { data: recRows } = await admin
      .from("recommendations")
      .select("supplement_slug, dose")
      .in(
        "quiz_id",
        (
          await admin.from("quizzes").select("id").eq("user_id", userId!)
        ).data?.map((q) => q.id) ?? [],
      );
    const dbSlugs = new Set((recRows ?? []).map((r) => r.supplement_slug));
    for (const slug of recSlugs) expect(dbSlugs.has(slug)).toBe(true);
  });
});
