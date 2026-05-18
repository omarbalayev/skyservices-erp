import type { NextAuthConfig } from "next-auth";

// Edge-safe config — used by middleware. No DB, no bcrypt, no Node-only deps.
// The full config in src/lib/auth.ts extends this with the Credentials provider
// and the Prisma adapter (which both require Node runtime).
export const authConfig = {
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id?: string; role?: string };
        if (u.id) token.id = u.id;
        if (u.role) token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        if (typeof token.id === "string") session.user.id = token.id;
        if (typeof token.role === "string") {
          // role is widened to string here — the full app code uses the UserRole enum
          (session.user as unknown as { role: string }).role = token.role;
        }
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
