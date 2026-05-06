import { test, expect } from "@playwright/test";
import {
  adminClient,
  deleteUser,
  signInAs,
  uniqueEmail,
} from "./helpers/test-env";

const TEST_EMAIL = uniqueEmail("history");

async function fillStep1(page: import("@playwright/test").Page) {
  await page.selectOption('select[name="age_band"]', "19-30");
  await page.selectOption('select[name="sex_at_birth"]', "female");
  await page.selectOption('select[name="pregnancy_status"]', "no");
  await page.getByTestId("quiz-next").click();
}
async function fillStep2(page: import("@playwright/test").Page) {
  await page.selectOption('select[name="dietary_pattern"]', "vegan");
  await page.fill('input[name="fruits_veggies_per_day"]', "5");
  await page.selectOption('select[name="fish_per_week"]', "never");
  await page.selectOption('select[name="dairy_per_week"]', "never");
  await page.getByTestId("quiz-next").click();
}
async function fillStep3(
  page: import("@playwright/test").Page,
  hours = "7",
  quality = "4",
) {
  await page.fill('input[name="sleep_hours"]', hours);
  await page.fill('input[name="sleep_quality"]', quality);
  await page.selectOption('select[name="trouble_falling_asleep"]', "rarely");
  await page.getByTestId("quiz-next").click();
}
async function fillStep4(
  page: import("@playwright/test").Page,
  stress = "3",
  exercise = "3-4",
  sun = "minimal",
) {
  await page.fill('input[name="stress_level"]', stress);
  await page.selectOption('select[name="exercise_per_week"]', exercise);
  await page.selectOption('select[name="sun_exposure"]', sun);
  await page.getByTestId("quiz-next").click();
}
async function fillStep5AndSubmit(page: import("@playwright/test").Page) {
  await page.selectOption('select[name="alcohol_per_week"]', "0");
  await page.getByTestId("quiz-next").click();
  await expect(page).toHaveURL(/\/results/, { timeout: 15_000 });
}

async function takeQuiz(
  page: import("@playwright/test").Page,
  variant: "first" | "second",
) {
  await page.goto("/quiz/1");
  await fillStep1(page);
  await fillStep2(page);
  // Vary sleep hours so the two quizzes produce different scores
  await fillStep3(page, variant === "first" ? "5" : "8");
  await fillStep4(
    page,
    variant === "first" ? "5" : "2",
    variant === "first" ? "0" : "3-4",
    "minimal",
  );
  await fillStep5AndSubmit(page);
}

test.describe.serial("history page", () => {
  test.afterAll(async () => {
    await deleteUser(TEST_EMAIL);
  });

  test("after 2 quizzes, /history shows 2 rows + trend chart, deep-link works", async ({
    page,
  }) => {
    await signInAs(page, TEST_EMAIL);

    // Wipe any prior rows so the two we make are the only ones
    const admin = adminClient();
    const { data: usersData } = await admin.auth.admin.listUsers();
    const userId = usersData?.users?.find((u) => u.email === TEST_EMAIL)?.id;
    expect(userId).toBeTruthy();
    await admin.from("quizzes").delete().eq("user_id", userId!);

    // Take first quiz
    await takeQuiz(page, "first");
    // Take second quiz (slightly different answers → different score)
    await takeQuiz(page, "second");

    // Visit /history
    await page.goto("/history");
    await expect(page.getByTestId("history-list")).toBeVisible();

    // Two rows present
    const rows = page.getByTestId("history-list").locator("> li");
    await expect(rows).toHaveCount(2);

    // Trend chart is visible (>= 2 quizzes)
    await expect(page.getByTestId("trend-section")).toBeVisible();
    await expect(page.getByTestId("score-trend-chart")).toBeVisible();

    // Click first row → deep-links to /results/[id]
    const firstRow = rows.first();
    const href = await firstRow.locator("a").getAttribute("href");
    expect(href).toMatch(/^\/results\/[0-9a-fA-F-]{36}$/);
    await firstRow.locator("a").click();
    await expect(page).toHaveURL(/\/results\/[0-9a-fA-F-]{36}/);

    // The frozen result page renders with the same building blocks
    await expect(page.getByTestId("score-section")).toBeVisible();
    await expect(page.getByTestId("rec-list")).toBeVisible();
  });
});
