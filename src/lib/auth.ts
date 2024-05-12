import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";

export const getAuthConfig = () => {
  const clientId = "TODO";
  const clientSecret = "TODO";

  if (!clientId || !clientSecret) {
    throw new Error("No keys detected. Developer to fix");
  }

  // You'll need to import and pass this
  // to `NextAuth` in `app/api/auth/[...nextauth]/route.ts`
  return {
    callbacks: {
      async session({ session, token, user }) {
        //console.log("session", user, token);
        (session as any).user.id = token.id;
        (session as any).accessToken = token.accessToken;
        return session;
      },
      async jwt({ token, user, account, profile, isNewUser }) {
        //console.log("jwt", user, account, profile);
        if (user) {
          token.id = user.id;
        }
        if (account) {
          token.accessToken = account.access_token;
        }
        return token;
      },
    },
    providers: [],
  } satisfies NextAuthOptions;
};

// Use it in server contexts
export function auth() {
  const config = getAuthConfig();
  return getServerSession(config);
}
