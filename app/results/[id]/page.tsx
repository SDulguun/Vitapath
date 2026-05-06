import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getResultsByQuizId } from "@/lib/results/data";
import { ResultsView } from "../_components/ResultsView";

export const dynamic = "force-dynamic";

export default async function FrozenResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const results = await getResultsByQuizId(supabase, id);
  if (!results) notFound();
  return <ResultsView results={results} isHistorical />;
}
