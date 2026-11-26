import { useSyncExternalStore } from "react";

export type ActiveTheme = "dark" | "light";

// Reads the theme already applied to <html> (by useTheme) and re-renders when it
// changes. Canvas charts need this: their colours are JS values, not CSS, so they
// don't follow the theme on their own.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getSnapshot = (): ActiveTheme =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

export function useActiveTheme() {
  return useSyncExternalStore(subscribe, getSnapshot, () => "dark" as const);
}
