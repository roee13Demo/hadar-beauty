"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

const STORAGE_KEY = "hadar-beauty-theme";

interface ThemeContextValue {
  /** The actual theme being applied (light/dark), with system resolved. */
  theme: Theme;
  /** What the user picked. `"system"` follows the OS setting. */
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
  /** Cycle through light → dark → system on each call. */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Reads the user preference from localStorage and applies the matching
 * `dark` class to <html>. Listens for system colour-scheme changes when
 * preference is "system". The companion no-flash script in `app/layout.tsx`
 * applies the class synchronously before hydration to avoid a flash.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [theme, setTheme] = useState<Theme>("light");

  // Initial read from localStorage
  useEffect(() => {
    const stored = readStoredPreference();
    setPreferenceState(stored);
    setTheme(resolveTheme(stored));
  }, []);

  // React to preference changes (and to OS scheme changes when "system")
  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(preference);
      setTheme(resolved);
      const root = document.documentElement;
      root.classList.toggle("dark", resolved === "dark");
    };
    apply();

    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore quota / privacy-mode errors */
    }
    setPreferenceState(next);
  }, []);

  const toggle = useCallback(() => {
    setPreference(
      preference === "light"
        ? "dark"
        : preference === "dark"
          ? "system"
          : "light",
    );
  }, [preference, setPreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, preference, setPreference, toggle }),
    [theme, preference, setPreference, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Safe fallback during SSR or before provider mounts
    return {
      theme: "light",
      preference: "system",
      setPreference: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}

// ─── helpers ───────────────────────────────────────────────────────────────

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return "system";
}

function resolveTheme(pref: ThemePreference): Theme {
  if (pref === "light") return "light";
  if (pref === "dark") return "dark";
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Inline script (stringified) that runs before React hydrates.
 * Eliminates the flash of light theme on initial paint.
 */
export const NO_FLASH_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var dark = stored === 'dark' || (
      (!stored || stored === 'system') &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;
