"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyThemePreference,
  readStoredTheme,
  resolveDarkMode,
  type ThemePreference,
} from "@/lib/theme-preference";

const THEME_COLOR_LIGHT = "#312e81";
const THEME_COLOR_DARK = "#050508";

function updateThemeColorMeta(dark: boolean) {
  const color = dark ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", color);
}

interface ThemeContextValue {
  preference: ThemePreference;
  isDark: boolean;
  setPreference: (preference: ThemePreference) => void;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    setPreferenceState(stored);
    setIsDark(resolveDarkMode(stored));
    applyThemePreference(stored);
    updateThemeColorMeta(resolveDarkMode(stored));
  }, []);

  useEffect(() => {
    if (preference !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange() {
      const dark = resolveDarkMode("system");
      setIsDark(dark);
      document.documentElement.classList.toggle("dark", dark);
      updateThemeColorMeta(dark);
    }

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    const dark = resolveDarkMode(next);
    setPreferenceState(next);
    setIsDark(dark);
    applyThemePreference(next);
    updateThemeColorMeta(dark);
  }, []);

  const toggleDark = useCallback(() => {
    setPreference(isDark ? "light" : "dark");
  }, [isDark, setPreference]);

  const value = useMemo(
    () => ({ preference, isDark, setPreference, toggleDark }),
    [preference, isDark, setPreference, toggleDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
