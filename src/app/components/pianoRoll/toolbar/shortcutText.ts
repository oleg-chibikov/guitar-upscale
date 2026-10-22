const isMac = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export const modKey = () => (isMac() ? "⌘" : "Ctrl");

export const altKey = () => (isMac() ? "⌥" : "Alt");
