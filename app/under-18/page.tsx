import Link from "next/link";

export const dynamic = "force-static";

export default function Under18Page() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section
        data-testid="under-18-page"
        className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-24"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
          VitaPath
        </p>
        <h1 className="mt-3 text-3xl">For people under 18</h1>
        <p className="mt-4 text-stone-700">
          Supplement needs in childhood and adolescence depend on growth,
          maturation, and pediatric drug interactions that this app
          intentionally does not model.
        </p>
        <p className="mt-3 text-stone-700">
          Please talk to a pediatrician or registered dietitian. They can
          assess your specific situation safely.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-stone-300 px-5 py-2 text-sm transition hover:border-stone-500"
          >
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
