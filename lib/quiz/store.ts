// useSyncExternalStore-friendly draft store. Replaces the simpler
// loadDraft/saveDraft/clearDraft helpers from phase 1.
//
// Why this shape:
//   - getSnapshot must return a STABLE reference until state actually
//     changes; otherwise React will think state changed every render and
//     loop forever. We cache in module scope (`cache`).
//   - getServerSnapshot returns null so SSR + hydration agree (no DOM
//     access on the server). The hook re-renders once on the client when
//     getSnapshot returns the real draft, which is when the form mounts
//     with its localStorage-backed defaultValues.
//   - save / clear update the cache and notify all subscribed listeners
//     synchronously, so the next React render sees the new snapshot.

import type { DraftAnswers } from "./schemas";

const STORAGE_KEY = "vitapath_quiz_draft_v1";
const EMPTY: DraftAnswers = Object.freeze({}) as DraftAnswers;

let cache: DraftAnswers | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function readFromStorage(): DraftAnswers {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as DraftAnswers) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function notify(): void {
  for (const cb of listeners) cb();
}

export function subscribeDraft(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Client snapshot. Lazy-init from localStorage on first call; stable
 *  reference thereafter until save()/clear() is invoked. */
export function getDraftSnapshot(): DraftAnswers | null {
  if (typeof window === "undefined") return null;
  if (!initialized) {
    cache = readFromStorage();
    initialized = true;
  }
  return cache;
}

/** Server snapshot. Always null so SSR renders the loading shell rather
 *  than the form (which depends on client-only localStorage). */
export function getServerDraftSnapshot(): null {
  return null;
}

/** Persist next draft and notify subscribers. Pass a fully-merged object —
 *  the store does no shallow merging itself. */
export function saveDraft(next: DraftAnswers): void {
  cache = next;
  initialized = true;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* quota exceeded — best-effort, in-memory cache still updated */
    }
  }
  notify();
}

export function clearDraft(): void {
  cache = EMPTY;
  initialized = true;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  notify();
}
