/**
 * Wraps a dynamic import so it runs once. A failed load tries again on the next call.
 */
export const loadOnce = <T>(load: () => Promise<T>) => {
  let loading: Promise<T> | undefined;
  return () =>
    (loading ??= load().catch((error: unknown) => {
      loading = undefined;
      throw error;
    }));
};
