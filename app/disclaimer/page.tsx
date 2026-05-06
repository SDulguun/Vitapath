import { acceptDisclaimer } from "./actions";

export const dynamic = "force-dynamic";

export default async function DisclaimerPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/quiz/1";

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-24">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
          VitaPath
        </p>
        <h1 className="mt-3 text-3xl">Before you start</h1>
        <div
          data-testid="disclaimer-body"
          className="mt-6 space-y-4 rounded-3xl border border-stone-200 bg-white p-6 text-sm text-stone-700"
        >
          <p>
            VitaPath is a coursework project that produces general dietary
            guidance. It is <strong>not medical advice</strong>, not a
            diagnosis, and not a substitute for talking to a clinician.
          </p>
          <p>
            Please consult a doctor or registered dietitian before starting,
            stopping, or combining any supplement — especially if you take
            prescription medication, have a medical condition, are pregnant,
            or are nursing.
          </p>
          <p>
            By continuing you acknowledge that you understand these limits and
            will not act on the recommendations without professional review.
          </p>
        </div>
        <form action={acceptDisclaimer} className="mt-6">
          <input type="hidden" name="next" value={safeNext} />
          <button
            type="submit"
            data-testid="disclaimer-accept"
            className="w-full rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-stone-50 transition hover:bg-stone-700"
          >
            I understand — continue
          </button>
        </form>
      </section>
    </main>
  );
}
