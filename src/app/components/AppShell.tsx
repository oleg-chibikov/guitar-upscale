import { FC } from "react";

// Static stand-in while redux-persist loads the saved state. The saved theme
// isn't known yet, so the colors follow the OS setting.
export const AppShell: FC = () => (
  <main
    aria-busy="true"
    className="flex items-center justify-center bg-background-light dark:bg-background-dark"
  >
    <div className="fixed top-1 left-1 h-11 w-64 max-w-[calc(100vw-8px)] rounded-xl border border-bar_border-light bg-bar-light dark:border-bar_border-dark dark:bg-bar-dark" />
    <div
      role="status"
      aria-label="Loading"
      className="size-10 animate-spin rounded-full border-4 border-accent-light border-t-transparent dark:border-accent-dark dark:border-t-transparent"
    />
  </main>
);
