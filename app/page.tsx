import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
          VitaPath
        </p>
        <h1 className="mt-6 text-5xl leading-tight sm:text-6xl">
          Vitamins built around your day —{" "}
          <span className="italic text-stone-700">not</span> a marketing funnel.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-stone-600">
          A short quiz. An explainable health score. Recommendations cited
          against real evidence, with warnings before they collide with your
          medications.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/quiz/1"
            className="rounded-full bg-stone-900 px-8 py-3 text-sm font-medium text-stone-50 transition hover:bg-stone-700"
          >
            Start the quiz
          </Link>
          <a
            href="#how"
            className="rounded-full border border-stone-300 px-8 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-500"
          >
            How it works
          </a>
        </div>
        <p className="mt-16 max-w-md text-xs text-stone-500">
          VitaPath provides general dietary guidance, not medical advice. Talk to
          a clinician before starting any supplement.
        </p>
      </section>
    </main>
  );
}
