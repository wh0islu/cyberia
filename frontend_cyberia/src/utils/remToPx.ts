/**
 * Converts a rem value to pixels using the root font size the browser is
 * actually applying. Canvas-based libraries (Chart.js) need pixel sizes, so
 * this keeps chart text in step with the user's browser font-size setting.
 */
export function remToPx(rem: number): number {
  if (typeof window === "undefined") return rem * 10;
  const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return rem * (Number.isFinite(rootSize) ? rootSize : 10);
}
