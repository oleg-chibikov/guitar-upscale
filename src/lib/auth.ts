import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import PatreonProvider from "next-auth/providers/patreon";

// https://www.patreon.com/portal/registration/register-clients
// set the callback uris to http://localhost:3000/api/auth/callback/patreon https://guitar-upscale.org.uk/api/auth/callback/patreon

export const getAuthConfig = () => {
  const clientId = process.env.PATREON_CLIENT_ID;
  const clientSecret = process.env.PATREON_CLIENT_SECRET;

  if (clientId === undefined || clientSecret === undefined) {
    throw new Error("No Patreon keys detected. Developer to fix");
  }

  const patreonProvider = PatreonProvider({
    clientId,
    clientSecret,
    authorization: {
      params: {}, // setting a scope to identity here leads to 403 from Patreon in some cases
    },
  });

  // You'll need to import and pass this
  // to `NextAuth` in `app/api/auth/[...nextauth]/route.ts`
  return {
    callbacks: {
      async session({ session, token }) {
        //console.log("session", user, token);
        if (session.user) {
          (session.user as { id: unknown }).id = token.id;
          session.accessToken = token.accessToken;
        }
        return session;
      },
      async jwt({ token, user, account }) {
        //console.log("jwt", user, account, profile);
        if (user !== null && user !== undefined) {
          token.id = user.id;
        }
        if (account !== null && account !== undefined) {
          token.accessToken = account.access_token;
        }
        return token;
      },
    },
    providers: [patreonProvider], // rest of your config
  } satisfies NextAuthOptions;
};

// Use it in server contexts
export function auth() {
  const config = getAuthConfig();
  return getServerSession(config);
}
