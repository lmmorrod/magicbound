"use client";
import { useEffect, useState } from "react";

type Mode = "system" | "light" | "dark";
const KEY = "mb-theme";
const NEXT: Record<Mode, Mode> = { system: "light", light: "dark", dark: "system" };
const ICON: Record<Mode, string> = { system: "◐", light: "☀", dark: "☾" };
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
      {ICON[mode]}
    </button>
  );
}
