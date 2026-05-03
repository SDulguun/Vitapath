import { test, expect } from "@playwright/test";
import { adminClient, deleteUser, signInAs, uniqueEmail } from "./helpers/test-env";

const TEST_EMAIL = uniqueEmail("quiz");

test.describe.serial("multi-step quiz", () => {
  test.afterAll(async () => {
    await deleteUser(TEST_EMAIL);
  });

  test("anonymous /quiz/1 redirects to /login", async ({ page }) => {
    await page.goto("/quiz/1");
    await expect(page).toHaveURL(/\/login/);
  });

  test("draft persists across refresh and back navigation", async ({ page }) => {
    await signInAs(page, TEST_EMAIL);

    // Step 1
    await page.goto("/quiz/1");
    await page.selectOption('select[name="age_band"]', "19-30");
    await page.selectOption('select[name="sex_at_birth"]', "female");
    await page.selectOption('select[name="pregnancy_status"]', "no");
    await page.getByTestId("quiz-next").click();
    await expect(page).toHaveURL(/\/quiz\/2/);

    // Step 2
    await page.selectOption('select[name="dietary_pattern"]', "vegan");
    await page.fill('input[name="fruits_veggies_per_day"]', "5");
    await page.selectOption('select[name="fish_per_week"]', "never");
    await page.selectOption('select[name="dairy_per_week"]', "never");
    await page.getByTestId("quiz-next").click();
    await expect(page).toHaveURL(/\/quiz\/3/);

    // On step 3, refresh
    await page.reload();
    await expect(page.getByTestId("progress-step")).toContainText("Step 3 of 5");

    // Navigate back to step 1 — answers must still be there
    await page.getByTestId("quiz-back").click(); // → step 2
    await expect(page).toHaveURL(/\/quiz\/2/);
    // Wait for hydration before clicking again (loading state hides back btn)
    await expect(page.getByTestId("quiz-back")).toBeVisible();
    await page.getByTestId("quiz-back").click(); // → step 1
    await expect(page).toHaveURL(/\/quiz\/1/);
    await expect(page.locator('select[name="age_band"]')).toHaveValue("19-30");
    await expect(page.locator('select[name="sex_at_birth"]')).toHaveValue("female");

    // Forward again — step 2's answers should still be there
    await page.getByTestId("quiz-next").click();
    await expect(page).toHaveURL(/\/quiz\/2/);
    await expect(page.locator('select[name="dietary_pattern"]')).toHaveValue("vegan");
    await expect(page.locator('input[name="fruits_veggies_per_day"]')).toHaveValue("5");
  });

  test("complete all 5 steps, final submit creates a quizzes row", async ({ page }) => {
    await signInAs(page, TEST_EMAIL);

    // Get user id for the row check at the end
    const admin = adminClient();
    const { data: usersData } = await admin.auth.admin.listUsers();
    const userId = usersData?.users?.find((u) => u.email === TEST_EMAIL)?.id;
    expect(userId, "test user should exist").toBeTruthy();

    // Wipe any pre-existing rows from earlier test runs
    await admin.from("quizzes").delete().eq("user_id", userId!);

    // Walk all 5 steps from /quiz/1
    await page.goto("/quiz/1");

    // Step 1 (may be pre-filled from previous test's localStorage; force values)
    await page.selectOption('select[name="age_band"]', "19-30");
    await page.selectOption('select[name="sex_at_birth"]', "female");
    await page.selectOption('select[name="pregnancy_status"]', "no");
    await page.getByTestId("quiz-next").click();

    // Step 2
    await page.selectOption('select[name="dietary_pattern"]', "vegan");
    await page.fill('input[name="fruits_veggies_per_day"]', "5");
    await page.selectOption('select[name="fish_per_week"]', "never");
    await page.selectOption('select[name="dairy_per_week"]', "never");
    await page.getByTestId("quiz-next").click();

    // Step 3
    await page.fill('input[name="sleep_hours"]', "6");
    await page.fill('input[name="sleep_quality"]', "3");
    await page.selectOption('select[name="trouble_falling_asleep"]', "sometimes");
    await page.getByTestId("quiz-next").click();

    // Step 4
    await page.fill('input[name="stress_level"]', "4");
    await page.selectOption('select[name="exercise_per_week"]', "1-2");
    await page.selectOption('select[name="sun_exposure"]', "minimal");
    await page.getByTestId("quiz-next").click();

    // Step 5
    await page.selectOption('select[name="alcohol_per_week"]', "1-3");
    // medications: none + ssri
    await page.locator('input[name="medications"][value="ssri"]').check();
    // (none is already pre-checked from default)
    await page.getByTestId("quiz-next").click();

    // After final submit, we navigate to /results
    await expect(page).toHaveURL(/\/results/, { timeout: 15_000 });

    // Verify a quizzes row was created for this user with a computed score
    const { data: rows, error: rowsErr } = await admin
      .from("quizzes")
      .select("id, answers, health_score, user_id")
      .eq("user_id", userId!);
    expect(rowsErr, "row fetch should succeed").toBeFalsy();
    expect(rows?.length, "exactly one row created").toBe(1);
    const row = rows![0];
    expect(typeof row.health_score, "score populated by goal 8").toBe("number");
    expect(row.health_score).toBeGreaterThanOrEqual(0);
    expect(row.health_score).toBeLessThanOrEqual(100);
    expect(row.answers).toMatchObject({
      age_band: "19-30",
      sex_at_birth: "female",
      pregnancy_status: "no",
      dietary_pattern: "vegan",
      fruits_veggies_per_day: 5,
      sleep_hours: 6,
      stress_level: 4,
      sun_exposure: "minimal",
      alcohol_per_week: "1-3",
      smoker: false,
    });
    expect(row.answers.medications).toContain("ssri");
  });
});
