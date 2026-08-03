import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isAuth = Boolean(session?.user);
  const isAdmin = session?.user?.role === "ADMIN";

  if (pathname.startsWith("/admin")) {
    if (!isAuth) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/mis-cursos", req.url));
    }
  }

  if (
    pathname.startsWith("/mis-cursos") ||
    pathname.startsWith("/aprender") ||
    pathname.startsWith("/checkout")
  ) {
    if (!isAuth) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/mis-cursos/:path*",
    "/aprender/:path*",
    "/checkout/:path*",
  ],
};
