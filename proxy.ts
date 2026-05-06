// Next.js 16 renamed `middleware.ts` → `proxy.ts`. Same role: runs before each
// matched request. Here we (1) refresh Supabase auth cookies on every request
// so server components always see fresh user state, and (2) gate /history.
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANT: getUser() refreshes the access token if needed. Don't remove.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /history, /quiz, and /results
  const path = request.nextUrl.pathname;
  if (
    !user &&
    (path.startsWith("/history") ||
      path.startsWith("/quiz") ||
      path.startsWith("/results"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Disclaimer gate: authed users must acknowledge before entering /quiz/*.
  if (
    user &&
    path.startsWith("/quiz") &&
    !request.cookies.has("vitapath_disclaimer_v1")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/disclaimer";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on every path except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
