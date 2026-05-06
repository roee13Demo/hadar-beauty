/**
 * Brand color tokens for charts. We expose two flavours:
 *
 *  1. Static fallbacks (light mode) — used during SSR / before hydration
 *     where `getComputedStyle` is unavailable.
 *  2. CSS-variable references via `useChartColors()` — resolved on the client
 *     so charts re-paint when the user switches between light and dark mode.
 *
 * Recharts can render most properties using CSS-var strings (e.g.
 * `"hsl(var(--card))"`), but `stroke`/`fill` SVG attributes occasionally
 * break across browser versions, so the hook reads the resolved values
 * once and returns plain hex/HSL strings.
 */

import { useEffect, useState } from "react";

export const CHART_COLORS_LIGHT = {
  primary: "#9C7A6F",
  success: "#5B8C7B",
  accent: "#C9A96E",
  destructive: "#B85450",
  muted: "#7A6F66",
  background: "#FFFCF9",
  card: "#FFFFFF",
  border: "#E5DCD3",
};

export const CHART_COLORS_DARK = {
  primary: "#C49E92",
  success: "#7BAF99",
  accent: "#D4B374",
  destructive: "#D87873",
  muted: "#A89C90",
  background: "#1A1614",
  card: "#26201D",
  border: "#3A3330",
};

export type ChartColorTokens = typeof CHART_COLORS_LIGHT;

/** Backwards-compatible export — kept as the light palette so static
 *  imports don't break. UI code should prefer `useChartColors()` so it
 *  re-renders on theme change. */
export const CHART_COLORS: ChartColorTokens = CHART_COLORS_LIGHT;

export const PIE_PALETTE = [
  CHART_COLORS_LIGHT.primary,
  CHART_COLORS_LIGHT.accent,
  CHART_COLORS_LIGHT.success,
  CHART_COLORS_LIGHT.destructive,
  "#A4866E",
  "#7C9A88",
  "#D4B896",
  "#A57068",
];

export const PIE_PALETTE_DARK = [
  CHART_COLORS_DARK.primary,
  CHART_COLORS_DARK.accent,
  CHART_COLORS_DARK.success,
  CHART_COLORS_DARK.destructive,
  "#C19476",
  "#94B5A2",
  "#D9C39C",
  "#B98A82",
];

/**
 * Returns the chart palette for the currently active theme.
 * Re-runs whenever the `dark` class is toggled on `<html>`.
 */
export function useChartColors(): {
  colors: ChartColorTokens;
  pie: string[];
  isDark: boolean;
} {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return {
    colors: isDark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT,
    pie: isDark ? PIE_PALETTE_DARK : PIE_PALETTE,
    isDark,
  };
}
