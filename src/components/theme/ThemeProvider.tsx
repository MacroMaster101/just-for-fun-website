"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolved: Resolved;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = "jff-theme";

const getSystem = (): Resolved =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";

const resolve = (t: Theme): Resolved => (t === "system" ? getSystem() : t);

const applyTheme = (r: Resolved) => {
  const root = document.documentElement;
  root.classList.toggle("dark", r === "dark");
  root.classList.toggle("light", r === "light");
  root.style.colorScheme = r;
};

const readStoredTheme = (): Theme => {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
};

// Apply theme synchronously when this client module loads — runs before
// the first React render, so the page paints with the correct theme class
// already on <html>. Avoids the inline <script> tag that React 19 rejects.
if (typeof document !== "undefined") {
  try {
    const stored = readStoredTheme();
    const r = resolve(stored);
    const root = document.documentElement;
    if (!root.classList.contains(r)) {
      root.classList.remove("light", "dark");
      root.classList.add(r);
      root.style.colorScheme = r;
    }
  } catch {
    document.documentElement.classList.add("dark");
  }
}

const computeInitialResolved = (t: Theme): Resolved => {
  if (typeof window === "undefined") return "dark";
  return resolve(t);
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);
  const [resolved, setResolved] = useState<Resolved>(() =>
    computeInitialResolved(readStoredTheme())
  );

  useEffect(() => {
    applyTheme(resolved);
    // applyTheme touches the DOM; deps intentionally minimal so it only
    // re-fires when resolved changes.
  }, [resolved]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      const r = getSystem();
      setResolved(r);
      applyTheme(r);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    const r = resolve(t);
    setResolved(r);
    applyTheme(r);
  }, []);

  const value = useMemo(
    () => ({ theme, resolved, setTheme }),
    [theme, resolved, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};
