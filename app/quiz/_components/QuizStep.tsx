"use client";

import {
  useState,
  useSyncExternalStore,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  BackButton,
  Button,
  Card,
  Container,
  Eyebrow,
  Field,
  PageHeading,
  Select,
  Stepper,
  TextInput,
  cx,
} from "@/app/_components";
import {
  STEP_SCHEMAS,
  TOTAL_STEPS,
  type DraftAnswers,
  type QuizAnswers,
} from "@/lib/quiz/schemas";
import {
  clearDraft,
  getDraftSnapshot,
  getServerDraftSnapshot,
  saveDraft,
  subscribeDraft,
} from "@/lib/quiz/store";
import { saveQuiz } from "../actions";

const stepTitles: Record<
  number,
  { eyebrow: string; title: string; subtitle: string }
> = {
  1: {
    eyebrow: "About you",
    title: "The basics",
    subtitle: "These shape every recommendation that follows.",
  },
  2: {
    eyebrow: "Diet",
    title: "What you eat",
    subtitle: "Helps us spot likely shortfalls.",
  },
  3: {
    eyebrow: "Sleep",
    title: "How you rest",
    subtitle: "Sleep quality drives a surprising amount of supplement choice.",
  },
  4: {
    eyebrow: "Stress & movement",
    title: "Daily load",
    subtitle: "Stress and exercise both bias what we suggest.",
  },
  5: {
    eyebrow: "Lifestyle",
    title: "A few last things",
    subtitle: "These let us flag interactions before they happen.",
  },
};

const MEDICATION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "ssri", label: "SSRI" },
  { value: "warfarin", label: "Warfarin" },
  { value: "anticoagulant", label: "Anticoagulant" },
  { value: "levodopa", label: "Levodopa" },
  { value: "tetracycline", label: "Tetracycline" },
] as const;

const CONDITION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "hemochromatosis", label: "Hemochromatosis" },
  { value: "liver_disease", label: "Liver disease" },
  { value: "anticoagulant_use", label: "Anticoagulant use" },
] as const;

/** Read FormData → plain object that matches the per-step Zod schema input
 *  shape. Multi-select checkboxes are read as arrays via getAll(). */
function formDataToObject(
  form: FormData,
  multiKeys: string[] = [],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(form.keys())) {
    if (multiKeys.includes(key)) {
      out[key] = form.getAll(key).map(String);
    } else {
      out[key] = form.get(key);
    }
  }
  for (const k of multiKeys) if (!(k in out)) out[k] = [];
  if (!("smoker" in out)) out.smoker = "off";
  out.smoker = out.smoker === "on" || out.smoker === true;
  return out;
}

function LoadingShell({ step }: { step: number }) {
  const meta = stepTitles[step] ?? stepTitles[1];
  return (
    <main className="py-12 md:py-16">
      <Container className="max-w-2xl">
        <Stepper
          currentStep={step}
          totalSteps={TOTAL_STEPS}
          stepName={meta.eyebrow}
        />
        <Card className="mt-10 p-8 text-sm text-ink-muted" data-testid="quiz-loading">
          Loading your draft…
        </Card>
      </Container>
    </main>
  );
}

export function QuizStep({ step }: { step: number }) {
  const router = useRouter();
  const draft = useSyncExternalStore(
    subscribeDraft,
    getDraftSnapshot,
    getServerDraftSnapshot,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (draft === null) return <LoadingShell step={step} />;

  const meta = stepTitles[step];
  const schema = STEP_SCHEMAS[step - 1];
  const isFinal = step === TOTAL_STEPS;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = formDataToObject(
      new FormData(e.currentTarget),
      step === 5 ? ["medications", "conditions"] : [],
    );
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      setError(
        parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      );
      return;
    }
    const merged = { ...draft, ...parsed.data } as DraftAnswers;
    saveDraft(merged);

    if (step === 1 && merged.age_band === "13-18") {
      clearDraft();
      router.push(`/under-18`);
      return;
    }

    if (!isFinal) {
      router.push(`/quiz/${step + 1}`);
      return;
    }

    startTransition(async () => {
      const result = await saveQuiz(merged as QuizAnswers);
      if (result.error) {
        setError(result.error);
        return;
      }
      clearDraft();
      router.push(`/results`);
    });
  }

  return (
    <main className="py-12 md:py-16">
      <Container className="max-w-2xl">
        <Stepper
          currentStep={step}
          totalSteps={TOTAL_STEPS}
          stepName={meta.eyebrow}
        />

        <header className="mt-10">
          <Eyebrow>{meta.eyebrow}</Eyebrow>
          <PageHeading className="mt-3" subtitle={meta.subtitle}>
            {meta.title}
          </PageHeading>
        </header>

        <Card className="mt-8 p-6 sm:p-8">
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            data-testid={`quiz-form-${step}`}
            noValidate
          >
            {step === 1 && <Step1 draft={draft} />}
            {step === 2 && <Step2 draft={draft} />}
            {step === 3 && <Step3 draft={draft} />}
            {step === 4 && <Step4 draft={draft} />}
            {step === 5 && <Step5 draft={draft} />}

            {error && (
              <p
                role="alert"
                data-testid="quiz-error"
                className="rounded-md border border-rose/30 bg-rose-soft px-3 py-2 text-sm text-rose"
              >
                {error}
              </p>
            )}

            {/* Action row. On mobile: stacks vertically with the primary
                CTA on top (flex-col-reverse). On sm+: side-by-side with
                Back left, primary right. Per v2 §2.4. */}
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              {step > 1 ? (
                <BackButton
                  onClick={() => router.push(`/quiz/${step - 1}`)}
                  data-testid="quiz-back"
                  className="self-start -ml-2 sm:self-auto"
                />
              ) : (
                <span className="hidden sm:block" />
              )}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={pending}
                data-testid="quiz-next"
                className="w-full sm:w-auto"
              >
                {isFinal ? (pending ? "Saving…" : "See results") : "Continue"}
              </Button>
            </div>
          </form>
        </Card>
      </Container>
    </main>
  );
}

// ─── Per-step field components ────────────────────────────────────────────

function Step1({ draft }: { draft: DraftAnswers }) {
  return (
    <div className="space-y-6">
      <Field label="Age band" htmlFor="age_band">
        <Select
          id="age_band"
          name="age_band"
          required
          defaultValue={draft.age_band ?? ""}
        >
          <option value="" disabled>
            Select…
          </option>
          <option value="13-18">13–18</option>
          <option value="19-30">19–30</option>
          <option value="31-50">31–50</option>
          <option value="51-70">51–70</option>
          <option value="71+">71+</option>
        </Select>
      </Field>
      <Field label="Sex at birth" htmlFor="sex_at_birth">
        <Select
          id="sex_at_birth"
          name="sex_at_birth"
          required
          defaultValue={draft.sex_at_birth ?? ""}
        >
          <option value="" disabled>
            Select…
          </option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="intersex">Intersex</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </Select>
      </Field>
      <Field
        label="Pregnancy status"
        htmlFor="pregnancy_status"
        helper="Used for safety gating — pregnancy excludes some supplements entirely."
      >
        <Select
          id="pregnancy_status"
          name="pregnancy_status"
          required
          defaultValue={draft.pregnancy_status ?? "not_applicable"}
        >
          <option value="not_applicable">Not applicable</option>
          <option value="no">No</option>
          <option value="yes">Yes</option>
          <option value="unsure">Unsure</option>
        </Select>
      </Field>
    </div>
  );
}

function Step2({ draft }: { draft: DraftAnswers }) {
  return (
    <div className="space-y-6">
      <Field label="Dietary pattern" htmlFor="dietary_pattern">
        <Select
          id="dietary_pattern"
          name="dietary_pattern"
          required
          defaultValue={draft.dietary_pattern ?? ""}
        >
          <option value="" disabled>
            Select…
          </option>
          <option value="omnivore">Omnivore</option>
          <option value="pescatarian">Pescatarian</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="vegan">Vegan</option>
          <option value="keto">Keto</option>
          <option value="other">Other</option>
        </Select>
      </Field>
      <Field
        label="Servings of fruits and vegetables per day"
        htmlFor="fruits_veggies_per_day"
        helper="Aim for 5+. We'll dock or boost the score accordingly."
      >
        <TextInput
          id="fruits_veggies_per_day"
          name="fruits_veggies_per_day"
          type="number"
          min={0}
          max={10}
          required
          defaultValue={draft.fruits_veggies_per_day ?? 3}
        />
      </Field>
      <Field label="Fish meals per week" htmlFor="fish_per_week">
        <Select
          id="fish_per_week"
          name="fish_per_week"
          required
          defaultValue={draft.fish_per_week ?? ""}
        >
          <option value="" disabled>
            Select…
          </option>
          <option value="never">Rarely / never</option>
          <option value="1-2">1–2</option>
          <option value="3+">3+</option>
        </Select>
      </Field>
      <Field label="Dairy intake" htmlFor="dairy_per_week">
        <Select
          id="dairy_per_week"
          name="dairy_per_week"
          required
          defaultValue={draft.dairy_per_week ?? ""}
        >
          <option value="" disabled>
            Select…
          </option>
          <option value="never">Rarely / never</option>
          <option value="few">A few times a week</option>
          <option value="daily">Daily</option>
        </Select>
      </Field>
    </div>
  );
}

function Step3({ draft }: { draft: DraftAnswers }) {
  return (
    <div className="space-y-6">
      <Field
        label="Average sleep (hours per night)"
        htmlFor="sleep_hours"
        helper="Healthy adult range is roughly 7–9 hours."
      >
        <TextInput
          id="sleep_hours"
          name="sleep_hours"
          type="number"
          step={0.5}
          min={3}
          max={12}
          required
          defaultValue={draft.sleep_hours ?? 7}
        />
      </Field>
      <Field
        label="Sleep quality"
        htmlFor="sleep_quality"
        helper="1 = poor, 5 = great."
      >
        <TextInput
          id="sleep_quality"
          name="sleep_quality"
          type="number"
          min={1}
          max={5}
          required
          defaultValue={draft.sleep_quality ?? 3}
        />
      </Field>
      <Field
        label="Trouble falling asleep"
        htmlFor="trouble_falling_asleep"
      >
        <Select
          id="trouble_falling_asleep"
          name="trouble_falling_asleep"
          required
          defaultValue={draft.trouble_falling_asleep ?? ""}
        >
          <option value="" disabled>
            Select…
          </option>
          <option value="rarely">Rarely</option>
          <option value="sometimes">Sometimes</option>
          <option value="often">Often</option>
        </Select>
      </Field>
    </div>
  );
}

function Step4({ draft }: { draft: DraftAnswers }) {
  return (
    <div className="space-y-6">
      <Field
        label="Stress level"
        htmlFor="stress_level"
        helper="1 = calm, 5 = burnt out."
      >
        <TextInput
          id="stress_level"
          name="stress_level"
          type="number"
          min={1}
          max={5}
          required
          defaultValue={draft.stress_level ?? 3}
        />
      </Field>
      <Field label="Workouts per week" htmlFor="exercise_per_week">
        <Select
          id="exercise_per_week"
          name="exercise_per_week"
          required
          defaultValue={draft.exercise_per_week ?? ""}
        >
          <option value="" disabled>
            Select…
          </option>
          <option value="0">0</option>
          <option value="1-2">1–2</option>
          <option value="3-4">3–4</option>
          <option value="5+">5+</option>
        </Select>
      </Field>
      <Field
        label="Daily sun exposure"
        htmlFor="sun_exposure"
        helper="Drives the vitamin D recommendation."
      >
        <Select
          id="sun_exposure"
          name="sun_exposure"
          required
          defaultValue={draft.sun_exposure ?? ""}
        >
          <option value="" disabled>
            Select…
          </option>
          <option value="minimal">Minimal (mostly indoors)</option>
          <option value="moderate">Moderate (some time outdoors)</option>
          <option value="lots">Lots (mostly outdoors)</option>
        </Select>
      </Field>
    </div>
  );
}

/** "None" is mutually exclusive with the other items. Picking any
 *  non-"none" auto-unchecks "none"; checking "none" wipes the others.
 *  Renders controlled checkboxes so the visual disabled state is
 *  consistent with FormData on submit. */
function ExclusiveCheckboxGroup({
  legend,
  name,
  options,
  initial,
  helperWhenNoneOn,
}: {
  legend: string;
  name: "medications" | "conditions";
  options: ReadonlyArray<{ value: string; label: string }>;
  initial: string[];
  helperWhenNoneOn: string;
}) {
  const safeInitial = initial.length > 0 ? initial : ["none"];
  const [selected, setSelected] = useState<string[]>(safeInitial);
  const noneOn = selected.includes("none");

  function toggle(value: string, checked: boolean) {
    setSelected((prev) => {
      if (value === "none") return checked ? ["none"] : [];
      const next = prev.filter((v) => v !== value && v !== "none");
      if (checked) next.push(value);
      return next.length === 0 ? ["none"] : next;
    });
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-ink">{legend}</legend>
      <div className="space-y-2">
        {options.map((opt) => {
          const isNone = opt.value === "none";
          const disabled = noneOn && !isNone;
          const checked = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={cx(
                "flex items-center gap-3 text-sm transition-opacity duration-fast",
                disabled
                  ? "pointer-events-none text-ink-muted opacity-50"
                  : "text-ink-soft",
              )}
            >
              <input
                type="checkbox"
                name={name}
                value={opt.value}
                checked={checked}
                disabled={disabled}
                aria-disabled={disabled || undefined}
                onChange={(e) => toggle(opt.value, e.target.checked)}
                className="h-4 w-4 rounded border-sage-soft accent-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>
      {noneOn && (
        <p className="text-xs text-ink-muted">{helperWhenNoneOn}</p>
      )}
    </fieldset>
  );
}

function Step5({ draft }: { draft: DraftAnswers }) {
  const initialMeds = draft.medications ?? ["none"];
  const initialConds = draft.conditions ?? ["none"];

  return (
    <div className="space-y-7">
      <Field label="Alcoholic drinks per week" htmlFor="alcohol_per_week">
        <Select
          id="alcohol_per_week"
          name="alcohol_per_week"
          required
          defaultValue={draft.alcohol_per_week ?? ""}
        >
          <option value="" disabled>
            Select…
          </option>
          <option value="0">0</option>
          <option value="1-3">1–3</option>
          <option value="4-7">4–7</option>
          <option value="8+">8+</option>
        </Select>
      </Field>

      <label className="flex items-center gap-3 text-sm text-ink-soft">
        <input
          type="checkbox"
          name="smoker"
          defaultChecked={draft.smoker === true}
          className="h-4 w-4 rounded border-sage-soft accent-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
        />
        <span>I currently smoke or vape</span>
      </label>

      <ExclusiveCheckboxGroup
        legend="Medications you take regularly"
        name="medications"
        options={MEDICATION_OPTIONS}
        initial={initialMeds}
        helperWhenNoneOn="Uncheck 'None' to add specific medications."
      />

      <ExclusiveCheckboxGroup
        legend="Relevant conditions"
        name="conditions"
        options={CONDITION_OPTIONS}
        initial={initialConds}
        helperWhenNoneOn="Uncheck 'None' to add specific conditions."
      />
    </div>
  );
}
