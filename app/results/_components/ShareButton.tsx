"use client";

import { useState, useTransition } from "react";
import { Button, ShareDialog } from "@/app/_components";
import { createShareToken } from "@/lib/share/actions";

type Minted =
  | { ok: true; token: string; expires_at: string }
  | null;

/** Server-action trigger + ShareDialog opener. Splits the token-minting
 *  call from the modal UI so the dialog can stay closed until the action
 *  resolves (the brief wants a clean "click → modal opens with URL"). */
export function ShareButton({ quizId }: { quizId: string }) {
  const [minted, setMinted] = useState<Minted>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onShare() {
    setError(null);
    startTransition(async () => {
      const r = await createShareToken(quizId);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setMinted(r);
      setOpen(true);
    });
  }

  const url =
    minted && typeof window !== "undefined"
      ? `${window.location.origin}/r/${minted.token}`
      : minted
        ? `/r/${minted.token}`
        : "";

  return (
    <>
      <Button
        variant="secondary"
        onClick={onShare}
        disabled={pending}
        data-testid="share-button"
      >
        {pending ? "Creating link…" : "Share this result"}
      </Button>
      {error && (
        <p role="alert" className="basis-full text-sm text-rose">
          {error}
        </p>
      )}
      {minted && (
        <ShareDialog
          open={open}
          url={url}
          token={minted.token}
          expiresAt={minted.expires_at}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
