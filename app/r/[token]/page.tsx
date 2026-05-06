import Link from "next/link";
import { getSharedResult } from "@/lib/share/data";
import { ResultsView } from "@/app/results/_components/ResultsView";

export const dynamic = "force-dynamic";

export default async function SharedResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getSharedResult(token);

  if (result.kind === "expired_or_unknown") {
    return (
      <main className="min-h-screen bg-stone-50 text-stone-900">
        <section
          data-testid="share-expired"
          className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-24 text-center"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            VitaPath
          </p>
          <h1 className="mt-3 text-3xl">Link expired</h1>
          <p className="mt-3 text-stone-600">
            Shared results stay live for 30 days. Ask the person who shared
            this with you for a fresh link, or take your own quiz.
          </p>
          <Link
            href="/quiz/1"
            className="mt-8 rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-stone-50"
          >
            Take the quiz
          </Link>
        </section>
      </main>
    );
  }

  return <ResultsView results={result.results} mode="shared" />;
}
