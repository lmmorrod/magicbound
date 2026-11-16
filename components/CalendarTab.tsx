"use client";
import { Info } from "./Info";
import { useEffect, useRef } from "react";
import { PARK_BG, byTime, dayName, dropItem, hh, hourRange, isLL, parkKey, shortDate, weekday } from "@/lib/plan";
import type { Day, Item } from "@/lib/types";
import { useStore } from "./store";
import { CrTag } from "./DaysTab";

interface Drag {
  src?: HTMLElement; id?: string; x: number; y: number; sx: number; sy: number; dx: number; dy: number;
  touch?: boolean; on?: boolean; cancel?: boolean; t?: ReturnType<typeof setTimeout>; raf?: number;
  ghost?: HTMLElement; over?: HTMLElement | null;
}

export function CalendarTab() {
  const { data, canWrite, update, openDialog, toast } = useStore();
  const { days, items } = data;
  const wrap = useRef<HTMLDivElement>(null);
  const DR = useRef<Drag>({ x: 0, y: 0, sx: 0, sy: 0, dx: 0, dy: 0 });
  const justDragged = useRef(false);
  // Latest data for the window listeners, which are bound once.
  const live = useRef({ items, days, update, toast });
  live.current = { items, days, update, toast };

  useEffect(() => {
    const w = wrap.current;
    if (!w || !canWrite) return;
    const D = DR.current;
    const end = () => {
      clearTimeout(D.t);
      D.ghost?.remove();
      D.over?.classList.remove("dropon");
      D.src?.classList.remove("dragging");
      document.body.classList.remove("isdrag");
      if (D.raf) cancelAnimationFrame(D.raf);
      Object.assign(D, { src: undefined, id: undefined, on: false, cancel: false, ghost: undefined, over: null, raf: undefined, touch: false });
    };
    const move = () => {
      if (!D.on || !D.ghost) return;
      D.ghost.style.transform = `translate(${D.x - D.dx}px,${D.y - D.dy}px)`;
      D.ghost.style.visibility = "hidden";
      const el = document.elementFromPoint(D.x, D.y);
      D.ghost.style.visibility = "";
      const td = el?.closest<HTMLElement>(".cal td[data-at]") ?? null;
      if (td !== D.over) { D.over?.classList.remove("dropon"); D.over = td; td?.classList.add("dropon"); }
    };
    const scroll = () => {
      if (!D.on) return;
      const r = w.getBoundingClientRect(), e = 50, sp = 14;
      let dx = 0, dy = 0;
      if (D.x < r.left + e + 78) dx = -sp; else if (D.x > r.right - e) dx = sp;
      if (D.y < r.top + e) dy = -sp; else if (D.y > r.bottom - e) dy = sp;
      if (dx || dy) { w.scrollLeft += dx; w.scrollTop += dy; move(); }
      D.raf = requestAnimationFrame(scroll);
    };
    const start = () => {
      if (!D.src) return;
      D.on = true;
      const r = D.src.getBoundingClientRect();
      const g = D.src.cloneNode(true) as HTMLElement;
      g.className += " ghost"; g.style.width = r.width + "px";
      document.body.appendChild(g);
      D.ghost = g; D.dx = D.x - r.left; D.dy = D.y - r.top;
      D.src.classList.add("dragging"); document.body.classList.add("isdrag");
      if (D.touch && navigator.vibrate) navigator.vibrate(15);
      move(); scroll();
    };
    const drop = (id: string, target: string) => {
      const { items, days, update, toast } = live.current;
      const it = items.find((i) => i.id === id);
      if (!it) return;
      const next = dropItem(it, target);
      if (!next) return;
      update("items", id, next);
      const d = days.find((x) => x.id === next.day_id);
      toast(`Moved to ${d ? dayName(d) : ""}${next.time ? " · " + next.time : ""}`);
    };

    const down = (e: PointerEvent) => {
      if (e.button > 0) return;
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-ev]");
      if (!b) return;
      end();
      Object.assign(D, { src: b, id: b.dataset.ev, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, touch: e.pointerType !== "mouse" });
      if (D.touch) D.t = setTimeout(() => { if (D.src && !D.cancel) start(); }, 350);
    };
    const pmove = (e: PointerEvent) => {
      if (!D.src) return;
      D.x = e.clientX; D.y = e.clientY;
      const moved = Math.hypot(D.x - D.sx, D.y - D.sy);
      if (!D.on) {
        if (D.touch) { if (moved > 8) { D.cancel = true; end(); } }
        else if (moved > 5) start();
        return;
      }
      move();
    };
    const tmove = (e: TouchEvent) => { if (D.on) e.preventDefault(); };
    const up = () => {
      if (!D.src) return;
      if (D.on) {
        const t = D.over, id = D.id;
        justDragged.current = true; setTimeout(() => (justDragged.current = false), 50);
        end();
        if (t && id) drop(id, t.dataset.at!);
      } else end();
    };
    const cancel = () => { if (!D.on) end(); };
    const ctx = (e: MouseEvent) => { if ((e.target as HTMLElement).closest("[data-ev]") && (D.src || D.on)) e.preventDefault(); };

    w.addEventListener("pointerdown", down);
    w.addEventListener("contextmenu", ctx);
    window.addEventListener("pointermove", pmove);
    window.addEventListener("touchmove", tmove, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      end();
      w.removeEventListener("pointerdown", down);
      w.removeEventListener("contextmenu", ctx);
      window.removeEventListener("pointermove", pmove);
      window.removeEventListener("touchmove", tmove);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [canWrite]);

  const onClick = (e: React.MouseEvent) => {
    if (!canWrite || justDragged.current) return;
    const t = e.target as HTMLElement;
    const b = t.closest<HTMLElement>("[data-ev]");
    if (b) { const it = items.find((i) => i.id === b.dataset.ev); if (it) openDialog({ kind: "item", item: it }); return; }
    const h = t.closest<HTMLElement>("[data-dayhd]");
    if (h) { const d = days.find((x) => x.id === h.dataset.dayhd); if (d) openDialog({ kind: "day", day: d }); return; }
    const c = t.closest<HTMLElement>("[data-at]");
    if (c) {
      const [day_id, time] = c.dataset.at!.split("|");
      openDialog(time === "LL"
        ? { kind: "item", item: null, preset: { day_id, time: "", text: "Lightning Lane Multi Pass", res: "todo" } }
        : { kind: "item", item: null, preset: { day_id, time } });
    }
  };

  const its = items.filter((i) => i.day_id !== null);
  const [h0, h1] = hourRange(items);
  const at = (d: Day, f: (i: Item) => boolean) => its.filter((i) => i.day_id === d.id && f(i)).sort(byTime);
  const ev = (i: Item) => (
    <button key={i.id} type="button" className={`ev ${isLL(i) ? "LL" : i.credit || ""}${i.used ? " done" : ""}`}
      data-ev={i.id} tabIndex={canWrite ? undefined : -1}>
      {i.time && i.time.slice(3) !== "00" && <small>{i.time}</small>}
      {i.text || <i>Untitled</i>}<CrTag i={i} />
    </button>
  );
  const cell = (d: Day, list: Item[], slot: string) => (
    <td key={d.id} className={canWrite ? "hc" : undefined} data-at={canWrite ? `${d.id}|${slot}` : undefined}>{list.map(ev)}</td>
  );
  const anyTime = canWrite || its.some((i) => !i.time && !isLL(i));
  const hours: number[] = [];
  for (let h = h0; h <= h1; h++) hours.push(h);

  return (
    <section id="cal">
      <h2>Calendar</h2>
      <p className="sub">
        The whole trip as a spreadsheet: one column per day, one row per hour, like a planning sheet. Same plan as Day
        by day, so changes in either show up in both.
        {canWrite && <> <b>Drag</b> anything to move it (on a phone, press and hold first). Tap an empty cell to add, or tap anything to change it.</>}
      </p>
      <div className="calkey">
        <span><i style={{ background: "var(--ts-bg)" }} />Table service</span>
        <span><i style={{ background: "var(--qs-bg)" }} />Quick service</span>
        <span><i style={{ background: "var(--sn-bg)" }} />Snack</span>
        <span><i style={{ background: "var(--surface)" }} />Everything else</span>
      </div>
      <div className="cal" ref={wrap} onClick={onClick}>
        {!days.length ? <p className="loading" style={{ padding: 20 }}>No days in the plan yet.</p> : (
          <table>
            <thead>
              <tr>
                <th className="rh" scope="col">Date</th>
                {days.map((d) => <th key={d.id} scope="col"><small>{weekday(d.date)}</small>{shortDate(d.date)}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr className="park">
                <th scope="row" className="rh">Park</th>
                {days.map((d) => (
                  <td key={d.id} className={canWrite ? "hc" : undefined} data-dayhd={canWrite ? d.id : undefined}
                    style={{ "--pb": `var(${PARK_BG[parkKey(d.park)]})` } as React.CSSProperties}>{d.label}</td>
                ))}
              </tr>
              <tr className="evrow">
                <th scope="row" className="rh">Special event</th>
                {days.map((d) => <td key={d.id} className={canWrite ? "hc" : undefined} data-dayhd={canWrite ? d.id : undefined}>{d.event}</td>)}
              </tr>
              <tr>
                <th scope="row" className="rh">LL pass<Info id="lightning-lane" /></th>
                {days.map((d) => cell(d, at(d, isLL), "LL"))}
              </tr>
              {anyTime && (
                <tr>
                  <th scope="row" className="rh">Any time</th>
                  {days.map((d) => cell(d, at(d, (i) => !i.time && !isLL(i)), ""))}
                </tr>
              )}
              <tr className="div"><th scope="row" className="rh" />{days.map((d) => <td key={d.id} />)}</tr>
              {hours.map((h) => (
                <tr key={h} className="hr">
                  <th scope="row" className="rh">{hh(h)}</th>
                  {days.map((d) => cell(d, at(d, (i) => !!i.time && !isLL(i) && parseInt(i.time, 10) === h), hh(h)))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
