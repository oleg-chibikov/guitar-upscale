import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import PatreonProvider from "next-auth/providers/patreon";

// https://www.patreon.com/portal/registration/register-clients
// set the callback uris to http://localhost:3000/api/auth/callback/patreon https://guitar-upscale.org.uk/api/auth/callback/patreon

export const getAuthConfig = () => {
  const clientId = process.env.PATREON_CLIENT_ID;
  const clientSecret = process.env.PATREON_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log("No patreon keys detected. Developer to fix");
    return undefined;
  }

  const patreonProvider = PatreonProvider({
    clientId,
    clientSecret,
    authorization: { params: { scope: "identity" } }, // as a fallback we can ask for identity.memberships which is all the memberships of the user
  });

  // You'll need to import and pass this
  // to `NextAuth` in `app/api/auth/[...nextauth]/route.ts`
  return {
    callbacks: {
      async signIn({ user, account, profile, email, credentials }) {
        //console.log("signin", user, account, profile, email, credentials);
        return true;
      },
      async redirect({ url, baseUrl }) {
        //console.log("redirect", url, baseUrl);
        return baseUrl;
      },
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
    providers: [patreonProvider], // rest of your config
  } satisfies NextAuthOptions;
};

// Use it in server contexts
export function auth() {
  const config = getAuthConfig();
  if (!config) {
    return null;
  }
  return getServerSession(config);
}
