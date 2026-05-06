"use client";

import { useState, useTransition } from "react";
import { createShareToken } from "@/lib/share/actions";

export function ShareButton({ quizId }: { quizId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function onShare() {
    setError(null);
    startTransition(async () => {
      const r = await createShareToken(quizId);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setToken(r.token);
    });
  }

  if (token) {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/r/${token}`
        : `/r/${token}`;
    return (
      <div
        data-testid="share-link-box"
        className="basis-full rounded-2xl border border-stone-200 bg-white p-4"
      >
        <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
          Share link · expires in 30 days
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            data-testid="share-url"
            type="text"
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 truncate rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700"
          />
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                /* clipboard denied — user can still copy by selecting */
              }
            }}
            className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-500"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onShare}
        disabled={pending}
        data-testid="share-button"
        className="rounded-full border border-stone-300 px-5 py-2 text-sm transition hover:border-stone-500 disabled:opacity-50"
      >
        {pending ? "Creating link…" : "Share this result"}
      </button>
      {error && (
        <p role="alert" className="basis-full text-sm text-red-700">
          {error}
        </p>
      )}
    </>
  );
}
