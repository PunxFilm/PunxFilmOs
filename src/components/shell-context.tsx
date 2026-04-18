"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
type Density = "compact" | "normal";

interface ShellState {
  theme: Theme;
  toggleTheme: () => void;
  density: Density;
  setDensity: (d: Density) => void;
  cmdOpen: boolean;
  setCmdOpen: (v: boolean) => void;
  aiOn: boolean;
  setAiOn: (v: boolean) => void;
}

const ShellContext = createContext<ShellState | null>(null);

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [density, setDensityState] = useState<Density>("compact");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [aiOn, setAiOn] = useState(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const t = (localStorage.getItem("pf-theme") as Theme | null) || "dark";
      const d = (localStorage.getItem("pf-density") as Density | null) || "compact";
      setTheme(t);
      setDensityState(d);
      document.documentElement.setAttribute("data-theme", t);
      document.documentElement.setAttribute("data-density", d);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("pf-theme", next);
      } catch {
        /* ignore */
      }
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }, []);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
    try {
      localStorage.setItem("pf-density", d);
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute("data-density", d);
  }, []);

  // Cmd-K shortcut
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <ShellContext.Provider
      value={{ theme, toggleTheme, density, setDensity, cmdOpen, setCmdOpen, aiOn, setAiOn }}
    >
      {children}
    </ShellContext.Provider>
  );
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used within ShellProvider");
  return ctx;
}
