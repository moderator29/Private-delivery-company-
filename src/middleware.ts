import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Runs on every request. Two jobs.
 *
 * 1. Refresh the Supabase session so an operator is not signed out mid task.
 *    Server components cannot write cookies, so the refreshed tokens have to be
 *    attached here.
 *
 * 2. Keep unauthenticated visitors out of /admin.
 *
 * This redirect is a convenience, not the security boundary. Every admin page
 * calls requireAdmin() in the request that actually reads data, and Row Level
 * Security sits underneath that, so bypassing this middleware yields nothing.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Without Supabase configured there is no session to refresh and nobody can
  // be signed in. Public pages still render; /admin sends visitors to the login
  // page, which explains what is missing. Failing hard here would take the
  // whole site down over a misconfigured operations area.
  if (!supabaseUrl || !supabaseKey) {
    const { pathname } = request.nextUrl;
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/login";
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
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

  // getUser validates the token with the auth server rather than trusting the
  // cookie contents, which is what makes this check meaningful.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminArea = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";

  if (isAdminArea && !isLoginPage && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    // Preserve where they were going so sign-in can return them there.
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isLoginPage && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except Next.js internals and static assets. Images and fonts
     * do not need a session check, and running one would add a round trip to
     * every asset request.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
