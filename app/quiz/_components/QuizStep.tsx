"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  STEP_SCHEMAS,
  TOTAL_STEPS,
  type DraftAnswers,
  type QuizAnswers,
} from "@/lib/quiz/schemas";
import { loadDraft, saveDraft, clearDraft } from "@/lib/quiz/storage";
import { saveQuiz } from "../actions";
import { Progress } from "./Progress";

const stepTitles: Record<number, { eyebrow: string; title: string; subtitle: string }> = {
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

// Read FormData → plain object that matches the per-step Zod schema input shape.
// Multi-select checkboxes are read as arrays via getAll().
function formDataToObject(form: FormData, multiKeys: string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(form.keys())) {
    if (multiKeys.includes(key)) {
      out[key] = form.getAll(key).map(String);
    } else {
      out[key] = form.get(key);
    }
  }
  // Ensure multi-keys appear even when no boxes are checked.
  for (const k of multiKeys) if (!(k in out)) out[k] = [];
  // Checkbox-as-boolean: if a checkbox isn't checked it's absent. Default false.
  if ("smoker" in out === false) out.smoker = "off";
  out.smoker = out.smoker === "on" || out.smoker === true ? true : false;
  return out;
}

export function QuizStep({ step }: { step: number }) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftAnswers | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Load draft from localStorage after mount (SSR-safe).
  useEffect(() => {
    setDraft(loadDraft());
  }, []);

  if (!draft) {
    return (
      <main className="min-h-screen bg-stone-50 text-stone-900">
        <section className="mx-auto max-w-xl px-6 py-24 text-stone-500" data-testid="quiz-loading">
          Loading…
        </section>
      </main>
    );
  }

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
    setDraft(merged);

    if (!isFinal) {
      router.push(`/quiz/${step + 1}`);
      return;
    }

    // Final step → server action
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
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="mx-auto max-w-xl px-6 py-16">
        <Progress step={step} />
        <p className="mt-10 text-xs uppercase tracking-[0.2em] text-stone-500">
          {meta.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl">{meta.title}</h1>
        <p className="mt-2 text-stone-600">{meta.subtitle}</p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-8"
          data-testid={`quiz-form-${step}`}
        >
          {step === 1 && <Step1 draft={draft} />}
          {step === 2 && <Step2 draft={draft} />}
          {step === 3 && <Step3 draft={draft} />}
          {step === 4 && <Step4 draft={draft} />}
          {step === 5 && <Step5 draft={draft} />}

          {error && (
            <p role="alert" className="text-sm text-red-700" data-testid="quiz-error">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => router.push(`/quiz/${step - 1}`)}
                className="text-sm text-stone-600 underline-offset-4 hover:underline"
                data-testid="quiz-back"
              >
                ← Back
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={pending}
              data-testid="quiz-next"
              className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-stone-50 transition hover:bg-stone-700 disabled:opacity-50"
            >
              {isFinal ? (pending ? "Saving…" : "See results") : "Continue"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

// ─── Per-step field components ─────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-800">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

const select =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none focus:border-stone-900";

function Step1({ draft }: { draft: DraftAnswers }) {
  return (
    <div className="space-y-6">
      <Field label="Age band">
        <select name="age_band" required defaultValue={draft.age_band ?? ""} className={select}>
          <option value="" disabled>Select…</option>
          <option value="13-18">13–18</option>
          <option value="19-30">19–30</option>
          <option value="31-50">31–50</option>
          <option value="51-70">51–70</option>
          <option value="71+">71+</option>
        </select>
      </Field>
      <Field label="Sex at birth">
        <select name="sex_at_birth" required defaultValue={draft.sex_at_birth ?? ""} className={select}>
          <option value="" disabled>Select…</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="intersex">Intersex</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
      </Field>
      <Field label="Pregnancy status">
        <select
          name="pregnancy_status"
          required
          defaultValue={draft.pregnancy_status ?? "not_applicable"}
          className={select}
        >
          <option value="not_applicable">Not applicable</option>
          <option value="no">No</option>
          <option value="yes">Yes</option>
          <option value="unsure">Unsure</option>
        </select>
      </Field>
    </div>
  );
}

function Step2({ draft }: { draft: DraftAnswers }) {
  return (
    <div className="space-y-6">
      <Field label="Dietary pattern">
        <select name="dietary_pattern" required defaultValue={draft.dietary_pattern ?? ""} className={select}>
          <option value="" disabled>Select…</option>
          <option value="omnivore">Omnivore</option>
          <option value="pescatarian">Pescatarian</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="vegan">Vegan</option>
          <option value="keto">Keto</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field label="Servings of fruits and vegetables per day">
        <input
          name="fruits_veggies_per_day"
          type="number"
          min={0}
          max={10}
          required
          defaultValue={draft.fruits_veggies_per_day ?? 3}
          className={select}
        />
      </Field>
      <Field label="Fish meals per week">
        <select name="fish_per_week" required defaultValue={draft.fish_per_week ?? ""} className={select}>
          <option value="" disabled>Select…</option>
          <option value="never">Rarely / never</option>
          <option value="1-2">1–2</option>
          <option value="3+">3+</option>
        </select>
      </Field>
      <Field label="Dairy intake">
        <select name="dairy_per_week" required defaultValue={draft.dairy_per_week ?? ""} className={select}>
          <option value="" disabled>Select…</option>
          <option value="never">Rarely / never</option>
          <option value="few">A few times a week</option>
          <option value="daily">Daily</option>
        </select>
      </Field>
    </div>
  );
}

function Step3({ draft }: { draft: DraftAnswers }) {
  return (
    <div className="space-y-6">
      <Field label="Average sleep (hours per night)">
        <input
          name="sleep_hours"
          type="number"
          step={0.5}
          min={3}
          max={12}
          required
          defaultValue={draft.sleep_hours ?? 7}
          className={select}
        />
      </Field>
      <Field label="Sleep quality (1 = poor, 5 = great)">
        <input
          name="sleep_quality"
          type="number"
          min={1}
          max={5}
          required
          defaultValue={draft.sleep_quality ?? 3}
          className={select}
        />
      </Field>
      <Field label="Trouble falling asleep">
        <select name="trouble_falling_asleep" required defaultValue={draft.trouble_falling_asleep ?? ""} className={select}>
          <option value="" disabled>Select…</option>
          <option value="rarely">Rarely</option>
          <option value="sometimes">Sometimes</option>
          <option value="often">Often</option>
        </select>
      </Field>
    </div>
  );
}

function Step4({ draft }: { draft: DraftAnswers }) {
  return (
    <div className="space-y-6">
      <Field label="Stress level (1 = calm, 5 = burnt out)">
        <input
          name="stress_level"
          type="number"
          min={1}
          max={5}
          required
          defaultValue={draft.stress_level ?? 3}
          className={select}
        />
      </Field>
      <Field label="Workouts per week">
        <select name="exercise_per_week" required defaultValue={draft.exercise_per_week ?? ""} className={select}>
          <option value="" disabled>Select…</option>
          <option value="0">0</option>
          <option value="1-2">1–2</option>
          <option value="3-4">3–4</option>
          <option value="5+">5+</option>
        </select>
      </Field>
      <Field label="Daily sun exposure">
        <select name="sun_exposure" required defaultValue={draft.sun_exposure ?? ""} className={select}>
          <option value="" disabled>Select…</option>
          <option value="minimal">Minimal (mostly indoors)</option>
          <option value="moderate">Moderate (some time outdoors)</option>
          <option value="lots">Lots (mostly outdoors)</option>
        </select>
      </Field>
    </div>
  );
}

function Step5({ draft }: { draft: DraftAnswers }) {
  const meds = draft.medications ?? ["none"];
  const conds = draft.conditions ?? ["none"];
  const checkbox = (k: string, group: string[]) =>
    group.includes(k) ? { defaultChecked: true } : {};
  return (
    <div className="space-y-6">
      <Field label="Alcoholic drinks per week">
        <select name="alcohol_per_week" required defaultValue={draft.alcohol_per_week ?? ""} className={select}>
          <option value="" disabled>Select…</option>
          <option value="0">0</option>
          <option value="1-3">1–3</option>
          <option value="4-7">4–7</option>
          <option value="8+">8+</option>
        </select>
      </Field>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="smoker"
          defaultChecked={draft.smoker === true}
          className="h-4 w-4 rounded border-stone-300"
        />
        <span className="text-sm text-stone-800">I currently smoke or vape</span>
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-stone-800">
          Medications you take regularly
        </legend>
        {(["none", "ssri", "warfarin", "anticoagulant", "levodopa", "tetracycline"] as const).map((slug) => (
          <label key={slug} className="flex items-center gap-3 text-sm text-stone-700">
            <input
              type="checkbox"
              name="medications"
              value={slug}
              {...checkbox(slug, meds)}
              className="h-4 w-4 rounded border-stone-300"
            />
            <span>{slug.replace(/_/g, " ")}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-stone-800">
          Relevant conditions
        </legend>
        {(["none", "hemochromatosis", "liver_disease", "anticoagulant_use"] as const).map((slug) => (
          <label key={slug} className="flex items-center gap-3 text-sm text-stone-700">
            <input
              type="checkbox"
              name="conditions"
              value={slug}
              {...checkbox(slug, conds)}
              className="h-4 w-4 rounded border-stone-300"
            />
            <span>{slug.replace(/_/g, " ")}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
