import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieUpdate = { name: string; value: string; options: Parameters<NextResponse["cookies"]["set"]>[2] };

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !request.nextUrl.pathname.startsWith("/admin")) return response;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: CookieUpdate[]) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.app_metadata?.role === "admin";
  if (!isAdmin && !request.nextUrl.pathname.startsWith("/admin/login")) {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    return NextResponse.redirect(login);
  }
  if (isAdmin && request.nextUrl.pathname === "/admin/login") {
    const admin = request.nextUrl.clone();
    admin.pathname = "/admin";
    return NextResponse.redirect(admin);
  }
  return response;
}

export const config = { matcher: ["/admin/:path*"] };
