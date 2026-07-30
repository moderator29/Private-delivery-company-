import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Keeps the operator session fresh and keeps unauthenticated visitors out of
 * /admin.
 *
 * Two deliberate constraints, both learned from taking the production site down:
 *
 * 1. It runs on /admin only. Public pages have no session, so refreshing one
 *    there bought nothing and cost an auth round trip on every request. Worse,
 *    it put a network call to a third party service in the path of every page
 *    on the site.
 *
 * 2. Every Supabase interaction is wrapped. If the auth service is slow,
 *    unreachable, or configured with a bad URL or key, this must degrade to
 *    "nobody is signed in" rather than throwing. An uncaught throw here becomes
 *    MIDDLEWARE_INVOCATION_FAILED, which is a 500 on the whole route, not a
 *    graceful failure.
 *
 * This redirect is a convenience, never the security boundary. Every admin page
 * calls requireAdmin() in the request that actually reads data, and Row Level
 * Security sits underneath that, so a bypassed redirect still yields nothing.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login";

  const toLogin = () => {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    // Preserve the destination so sign-in can return them there.
    if (!isLoginPage) redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Without Supabase configured nobody can be signed in. The login page still
  // renders and explains itself; everything else in /admin bounces there.
  if (!supabaseUrl || !supabaseKey) {
    return isLoginPage ? NextResponse.next({ request }) : toLogin();
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
    });

    // getUser validates the token with the auth server rather than trusting the
    // cookie contents, which is what makes this check meaningful.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isLoginPage) return toLogin();

    if (user && isLoginPage) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  } catch (cause) {
    // Auth is unavailable or misconfigured. Treat it as signed out rather than
    // returning a 500: the page behind this still enforces access itself.
    console.error("Middleware auth check failed", cause);
    return isLoginPage ? NextResponse.next({ request }) : toLogin();
  }
}

export const config = {
  /*
   * Scoped to the operations area on purpose. The public site, its static
   * assets and the tracking pages never invoke this, so nothing about auth can
   * affect whether they render.
   */
  matcher: ["/admin/:path*"],
};
