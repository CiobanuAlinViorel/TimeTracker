import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig, { publicPaths } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (!req.auth && !isPublicPath) {
    return NextResponse.redirect(new URL("/user/login", req.url));
  }

  if (req.auth && isPublicPath) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
