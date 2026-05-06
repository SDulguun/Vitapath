import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLatestResultsForUser } from "@/lib/results/data";
import { ResultsView } from "./_components/ResultsView";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const supabase = await createClient();
  const results = await getLatestResultsForUser(supabase);

  if (!results) {
    return (
      <main className="min-h-screen bg-stone-50 text-stone-900">
        <section className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="text-3xl">No results yet</h1>
          <p className="mt-2 text-stone-600">
            Take the quiz to get your first set of recommendations.
          </p>
          <Link
            href="/quiz/1"
            className="mt-8 inline-block rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-stone-50"
          >
            Start the quiz
          </Link>
        </section>
      </main>
    );
  }

  return <ResultsView results={results} />;
}
