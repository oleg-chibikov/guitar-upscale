// While auth is off, everyone gets the Composer tier and no sign-in UI shows.
export const isAuthEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";
