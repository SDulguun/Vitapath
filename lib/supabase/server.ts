import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * Reads/writes session cookies via Next.js's async cookies() API.
 *
 * In Server Components the cookieStore is read-only — the try/catch silently
 * ignores write failures there because the proxy.ts session refresher will
 * pick up any pending cookie updates on the next request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component context — proxy.ts handles refresh.
          }
        },
      },
    },
  );
}
