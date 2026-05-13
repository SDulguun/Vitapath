"use client";

import { useEffect, useRef, useState, useTransition, type MouseEvent } from "react";
import { Button } from "./Button";
import { CopyIcon } from "./icons";
import { cx } from "./_cx";
import { revokeShareToken } from "@/lib/share/actions";

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Modal that surfaces a freshly-minted share link. Built on the native
 *  <dialog> element (Esc + focus trap come for free; we add a backdrop
 *  click handler for tap-outside-to-close). Exposes Copy + Revoke
 *  actions. State (URL, copied flag, revoked flag) lives here; the
 *  parent (<ShareButton>) only decides when to open/close. */
export function ShareDialog({
  open,
  url,
  token,
  expiresAt,
  onClose,
}: {
  open: boolean;
  url: string;
  token: string;
  expiresAt: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Sync the dialog's open state with the `open` prop. showModal() is the
  // accessible variant (vs .show()) — adds the backdrop + traps focus.
  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
      setCopied(false);
      setRevoked(false);
      setRevokeError(null);
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  // Wire native dialog close → parent state.
  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    const handler = () => onClose();
    dlg.addEventListener("close", handler);
    return () => dlg.removeEventListener("close", handler);
  }, [onClose]);

  // Click on the backdrop (the dialog element itself, not its child) closes.
  function onBackdropClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === ref.current) ref.current?.close();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard denied — selecting the input is still possible */
    }
  }

  function revoke() {
    setRevokeError(null);
    startTransition(async () => {
      const result = await revokeShareToken(token);
      if (!result.ok) {
        setRevokeError(result.error);
        return;
      }
      setRevoked(true);
    });
  }

  return (
    <dialog
      ref={ref}
      onClick={onBackdropClick}
      data-testid="share-dialog"
      className={cx(
        // Centered card, no native dialog default chrome.
        "m-0 fixed inset-0 max-h-[90vh] max-w-md w-full rounded-lg",
        "border border-sage-soft/60 bg-surface p-6 shadow-lg",
        "backdrop:bg-ink/30 backdrop:backdrop-blur-sm",
        // Center vertically + horizontally via auto margins inside the
        // viewport — native dialog uses these by default.
        "open:my-auto open:mx-auto",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">
            Share this result
          </p>
          <h2 className="mt-1 font-serif text-2xl text-ink">Read-only link</h2>
        </div>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="Close dialog"
          className="rounded-pill p-1 text-ink-muted transition-colors hover:bg-surface-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
            <path d="m6 6 12 12M6 18 18 6" />
          </svg>
        </button>
      </div>

      {revoked ? (
        <div
          data-testid="share-revoked"
          className="mt-6 rounded-md border border-amber/30 bg-amber-soft p-4 text-sm text-ink"
        >
          <p className="font-medium">Link revoked.</p>
          <p className="mt-1 text-ink-soft">
            This link no longer works — anyone who saved it will see the
            expired state.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-ink-soft">
            Anyone with this link can see your stack — but not edit it.
            They&apos;ll see a banner explaining it&apos;s a shared view.
          </p>

          <div
            data-testid="share-link-box"
            className="mt-5 flex items-center gap-2"
          >
            <input
              data-testid="share-url"
              type="text"
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 truncate rounded-md border border-sage-soft bg-surface-soft px-3 py-2 text-xs text-ink-soft outline-none focus:border-sage focus:outline-2 focus:outline-offset-2 focus:outline-sage"
            />
            <Button
              variant="secondary"
              size="md"
              onClick={copy}
              data-testid="share-copy"
              className="shrink-0 text-xs"
            >
              <CopyIcon className="size-4" aria-hidden />
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <p className="mt-3 text-xs text-ink-muted">
            Link expires {formatExpiry(expiresAt)}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-sage-soft/60 pt-4">
            <Button
              variant="ghost"
              size="md"
              onClick={() => ref.current?.close()}
            >
              Done
            </Button>
            <div className="flex items-center gap-3">
              {revokeError && (
                <span className="text-xs text-rose">{revokeError}</span>
              )}
              <Button
                variant="ghost"
                size="md"
                onClick={revoke}
                disabled={pending}
                data-testid="share-revoke"
                className="text-rose hover:bg-rose-soft hover:text-rose"
              >
                {pending ? "Revoking…" : "Revoke link"}
              </Button>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
