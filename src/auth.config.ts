import type { NextAuthConfig } from "next-auth";

export const publicPaths = ["/user/login", "/user/register"];

const authConfig = {
  providers: [],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/user/login",
  },
} satisfies NextAuthConfig;

export default authConfig;
