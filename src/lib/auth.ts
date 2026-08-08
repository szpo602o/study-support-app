import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        const password = credentials?.password;
        const expected = process.env.APP_PASSWORD;
        const email = process.env.APP_EMAIL;

        if (!expected || !email) {
          throw new Error("APP_PASSWORD / APP_EMAIL が未設定です");
        }
        if (typeof password !== "string" || password !== expected) {
          return null;
        }

        const db = getDb();
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        let user = existing[0];
        if (!user) {
          const inserted = await db
            .insert(users)
            .values({ email })
            .returning();
          user = inserted[0];
        }

        return { id: user.id, email: user.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  trustHost: true,
});
