import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="mx-auto max-w-3xl px-6 py-24">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
          VitaPath · History
        </p>
        <h1 className="mt-3 text-4xl">Your quiz history</h1>
        <p
          className="mt-2 text-stone-600"
          data-testid="history-greeting"
        >
          Signed in as {user.email}
        </p>
        <p className="mt-10 text-stone-500">
          Quiz history will appear here once you complete the first quiz.
        </p>
        <form action="/auth/signout" method="post" className="mt-10">
          <button
            type="submit"
            data-testid="signout-button"
            className="rounded-full border border-stone-300 px-5 py-2 text-sm transition hover:border-stone-500"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
