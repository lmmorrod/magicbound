"use client";
import { useEffect, useState } from "react";

type Mode = "system" | "light" | "dark";
const KEY = "mb-theme";
const NEXT: Record<Mode, Mode> = { system: "light", light: "dark", dark: "system" };
const PATHS: Record<Mode, string> = {
  system: "M12 3a9 9 0 1 0 0 18zM12 3a9 9 0 0 1 0 18",
  light: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  dark: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z",
};
const LABEL: Record<Mode, string> = { system: "Theme: match device", light: "Theme: light", dark: "Theme: dark" };

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");
  useEffect(() => {
    // The inline script in the layout already applied any saved theme before paint.
    const m = document.documentElement.getAttribute("data-theme");
    if (m === "light" || m === "dark") setMode(m);
  }, []);
  const next = () => {
    const m = NEXT[mode];
    setMode(m);
    const r = document.documentElement;
    if (m === "system") r.removeAttribute("data-theme");
    else r.setAttribute("data-theme", m);
    try { m === "system" ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, m); } catch { /* storage blocked */ }
  };
  return (
    <button type="button" className="themebtn" onClick={next} aria-label={`${LABEL[mode]}. Change theme`} title={LABEL[mode]}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={PATHS[mode]} />
      </svg>
    </button>
  );
}
