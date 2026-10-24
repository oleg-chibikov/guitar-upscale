import { useEffect } from "react";

export function useWakeLock() {
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | undefined;
    let pending = false;
    let disposed = false;

    async function acquire() {
      if (
        disposed ||
        pending ||
        sentinel ||
        document.visibilityState !== "visible"
      )
        return;
      pending = true;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (disposed) {
          await lock.release();
          return;
        }
        sentinel = lock;
        lock.addEventListener("release", () => {
          sentinel = undefined;
        });
      } catch {
        // Safari rejects the request until the person touches the page, so the gesture listeners retry.
      } finally {
        pending = false;
      }
    }

    const events = ["visibilitychange", "pointerdown", "keydown"] as const;
    events.forEach((e) => document.addEventListener(e, acquire));
    void acquire();

    return () => {
      disposed = true;
      events.forEach((e) => document.removeEventListener(e, acquire));
      void sentinel?.release();
    };
  }, []);
}
