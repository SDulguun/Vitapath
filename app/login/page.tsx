"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "./actions";

const initialState: SignInState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-24">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
          VitaPath
        </p>
        <h1 className="mt-3 text-3xl">Sign in</h1>
        <p className="mt-2 text-center text-stone-600">
          We&apos;ll email you a magic link. No password required.
        </p>

        {state.sent ? (
          <div
            role="status"
            data-testid="login-sent"
            className="mt-8 w-full rounded-2xl border border-stone-200 bg-white p-6 text-center"
          >
            <p className="font-medium">Check your inbox.</p>
            <p className="mt-1 text-sm text-stone-600">
              Click the link in the email to finish signing in.
            </p>
          </div>
        ) : (
          <form action={formAction} className="mt-8 w-full space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-full border border-stone-300 bg-white px-5 py-3 text-stone-900 outline-none focus:border-stone-900"
              />
            </div>
            {state.error && (
              <p role="alert" className="text-sm text-red-700">
                {state.error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-stone-50 transition hover:bg-stone-700 disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
