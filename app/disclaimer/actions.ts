"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// NOTE: "use server" files may only export async functions. The cookie name
// "vitapath_disclaimer_v1" is also referenced verbatim in proxy.ts — keep
// them in sync.
export async function acceptDisclaimer(formData: FormData) {
  const next = String(formData.get("next") ?? "/quiz/1");
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/quiz/1";

  const store = await cookies();
  store.set("vitapath_disclaimer_v1", new Date().toISOString(), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false,
    sameSite: "lax",
  });

  redirect(safeNext);
}
