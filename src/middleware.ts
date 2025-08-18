import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = req.cookies.get(name);
          return cookie ? cookie.value : null;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = req.nextUrl;

  // Home: si loggé -> route selon rôle
  if (pathname === "/") {
    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();
      const target = profile?.role === "ADMIN" ? "/admin/interventions" : "/tech/interventions";
      return NextResponse.redirect(new URL(target, req.url));
    }
    return res;
  }

  // Zones protégées
  const isProtected = pathname.startsWith("/tech") || pathname.startsWith("/admin");
  if (isProtected && !session?.user) {
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Empêcher l’accès aux pages d’auth quand loggé
  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  if (isAuthPage && session?.user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets).*)"],
};
