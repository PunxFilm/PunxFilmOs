import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/privacy", "/terms"];
const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/cron/"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Always allow static assets and Next internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Public pages
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Public API routes (NextAuth handlers)
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Require authentication for everything else
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Match all routes except static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
