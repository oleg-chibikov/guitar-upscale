// Playback and strumming log on every beat, which costs time on phones.
export const debugLog: (...args: unknown[]) => void =
  process.env.NODE_ENV === "production" ? () => {} : console.log.bind(console);
