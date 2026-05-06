import { test, expect } from "@playwright/test";
import {
  adminClient,
  deleteUser,
  signInAs,
  uniqueEmail,
} from "./helpers/test-env";

const TEST_EMAIL = uniqueEmail("gating");

test.describe.serial("disclaimer & age gating", () => {
  test.afterAll(async () => {
    await deleteUser(TEST_EMAIL);
  });

  test("authed user without disclaimer cookie is redirected to /disclaimer when visiting /quiz/1", async ({
    page,
  }) => {
    await signInAs(page, TEST_EMAIL);
    // Make sure the cookie is absent at the start of this test
    await page.context().clearCookies({ name: "vitapath_disclaimer_v1" });

    await page.goto("/quiz/1");
    await expect(page).toHaveURL(/\/disclaimer\?next=%2Fquiz%2F1/);
    await expect(page.getByTestId("disclaimer-body")).toBeVisible();
  });

  test("acknowledging disclaimer drops the cookie and lands on /quiz/1", async ({
    page,
  }) => {
    await signInAs(page, TEST_EMAIL);
    await page.context().clearCookies({ name: "vitapath_disclaimer_v1" });

    await page.goto("/quiz/1");
    await expect(page).toHaveURL(/\/disclaimer/);
    await page.getByTestId("disclaimer-accept").click();
    await expect(page).toHaveURL(/\/quiz\/1/);

    const cookies = await page.context().cookies();
    expect(
      cookies.some((c) => c.name === "vitapath_disclaimer_v1"),
    ).toBe(true);
  });

  test("selecting 13-18 on step 1 routes to /under-18", async ({ page }) => {
    await signInAs(page, TEST_EMAIL);
    // Cookie was set in the previous test (serial run) — just go to /quiz/1
    await page.goto("/quiz/1");
    await expect(page).toHaveURL(/\/quiz\/1/);

    await page.selectOption('select[name="age_band"]', "13-18");
    await page.selectOption('select[name="sex_at_birth"]', "prefer_not_to_say");
    await page.selectOption('select[name="pregnancy_status"]', "not_applicable");
    await page.getByTestId("quiz-next").click();
    await expect(page).toHaveURL(/\/under-18/);
    await expect(page.getByTestId("under-18-page")).toBeVisible();
  });

  test("pregnancy=yes flows through to engine: DB row has pregnancy_status='yes' AND a folate recommendation row exists", async ({
    page,
  }) => {
    await signInAs(page, TEST_EMAIL);
    // wipe prior rows so we read the right one
    const admin = adminClient();
    const { data: usersData } = await admin.auth.admin.listUsers();
    const userId = usersData?.users?.find((u) => u.email === TEST_EMAIL)?.id;
    expect(userId).toBeTruthy();
    await admin.from("quizzes").delete().eq("user_id", userId!);

    await page.goto("/quiz/1");
    await expect(page).toHaveURL(/\/quiz\/1/);

    await page.selectOption('select[name="age_band"]', "19-30");
    await page.selectOption('select[name="sex_at_birth"]', "female");
    await page.selectOption('select[name="pregnancy_status"]', "yes");
    await page.getByTestId("quiz-next").click();
    await expect(page).toHaveURL(/\/quiz\/2/);

    await page.selectOption('select[name="dietary_pattern"]', "omnivore");
    await page.fill('input[name="fruits_veggies_per_day"]', "4");
    await page.selectOption('select[name="fish_per_week"]', "1-2");
    await page.selectOption('select[name="dairy_per_week"]', "few");
    await page.getByTestId("quiz-next").click();

    await page.fill('input[name="sleep_hours"]', "7");
    await page.fill('input[name="sleep_quality"]', "4");
    await page.selectOption('select[name="trouble_falling_asleep"]', "rarely");
    await page.getByTestId("quiz-next").click();

    await page.fill('input[name="stress_level"]', "3");
    await page.selectOption('select[name="exercise_per_week"]', "1-2");
    await page.selectOption('select[name="sun_exposure"]', "moderate");
    await page.getByTestId("quiz-next").click();

    await page.selectOption('select[name="alcohol_per_week"]', "0");
    await page.getByTestId("quiz-next").click();
    await expect(page).toHaveURL(/\/results/, { timeout: 15_000 });

    // Quiz row carries pregnancy_status=yes
    const { data: quizzes } = await admin
      .from("quizzes")
      .select("id, answers")
      .eq("user_id", userId!);
    expect(quizzes?.length).toBe(1);
    const row = quizzes![0];
    type QuizAnswerSnapshot = { pregnancy_status?: string };
    expect((row.answers as QuizAnswerSnapshot).pregnancy_status).toBe("yes");

    // Engine fired the pregnancy → folate rule
    const { data: recRows } = await admin
      .from("recommendations")
      .select("supplement_slug")
      .eq("quiz_id", row.id);
    const slugs = (recRows ?? []).map((r) => r.supplement_slug);
    expect(slugs).toContain("folate");
  });
});
