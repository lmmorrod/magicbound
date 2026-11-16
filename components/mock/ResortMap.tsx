"use client";
// Our own simplified diagram of the resort: not to scale, not traced from any official map.
// Parks as soft shapes, hotels as dots, the sky-ride and monorail as lines, and journey
// times from your hotel to each park.
import { useState } from "react";
import type { Hotel } from "@/lib/types";

type P = { x: number; y: number };
const PARKS: Record<"MK" | "EP" | "HS" | "AK", P & { name: string; c: string }> = {
  MK: { x: 160, y: 86, name: "Magic Kingdom", c: "var(--mk)" },
  EP: { x: 440, y: 196, name: "EPCOT", c: "var(--ep)" },
  HS: { x: 300, y: 332, name: "Hollywood Studios", c: "var(--hs)" },
  AK: { x: 90, y: 330, name: "Animal Kingdom", c: "var(--ak)" },
};
/** Where each park's journey-time chip sits, relative to the park, so chips don't collide. */
const CHIP: Record<keyof typeof PARKS, P> = { MK: { x: 30, y: -16 }, EP: { x: -66, y: -74 }, HS: { x: -66, y: 54 }, AK: { x: -66, y: -76 } };
const SPRINGS: P = { x: 548, y: 318 };
const HOTEL_POS: Record<string, P> = {
  poly: { x: 104, y: 130 }, gf: { x: 112, y: 100 }, ct: { x: 214, y: 100 }, akl: { x: 40, y: 280 },
  bc: { x: 400, y: 236 }, ywc: { x: 388, y: 224 }, rr: { x: 384, y: 270 }, cbr: { x: 410, y: 300 },
  pop: { x: 476, y: 372 }, aoa: { x: 456, y: 352 }, pofq: { x: 528, y: 170 }, cs: { x: 190, y: 372 }, asm: { x: 150, y: 396 },
};

export function ResortMap({ hotels, stayKeys }: { hotels: Hotel[]; stayKeys: string[] }) {
  const mine = stayKeys.filter((k) => HOTEL_POS[k]);
  const [sel, setSel] = useState<string>(mine[0] || "");
  const hotel = hotels.find((h) => h.id === sel);

  return (
    <figure className="dm-map">
      <svg viewBox="0 0 600 440" role="img" aria-label={`Simplified resort map${hotel ? `, showing journey times from ${hotel.name}` : ""}`}>
        <defs>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2" /></filter>
        </defs>
        <rect width="600" height="440" rx="18" fill="var(--map-land)" />
        {/* lakes */}
        <path d="M120 40 C170 20 230 34 222 60 C214 84 170 86 140 80 C104 72 92 54 120 40Z" fill="var(--map-water)" />
        <path d="M380 150 C420 130 480 140 488 166 C494 186 460 192 420 186 C384 180 362 166 380 150Z" fill="var(--map-water)" opacity=".8" />
        <path d="M500 350 C530 336 586 344 590 366 C594 384 556 392 524 386 C494 380 480 364 500 350Z" fill="var(--map-water)" />
        {/* roads (buses) */}
        <g stroke="var(--map-road)" strokeWidth="6" fill="none" strokeLinecap="round" opacity=".9">
          <path d="M90 330 C160 310 230 312 300 332" /><path d="M300 332 C350 290 400 240 440 196" />
          <path d="M440 196 C500 230 530 270 548 318" /><path d="M160 86 C170 180 220 270 300 332" />
          <path d="M90 330 C100 230 120 150 160 86" /><path d="M548 318 C540 250 530 200 528 170" />
        </g>
        {/* monorail loop + line to EPCOT */}
        <g stroke="var(--map-mono)" strokeWidth="4" fill="none" strokeLinecap="round">
          <path d="M104 130 C100 100 130 86 160 86 C190 86 214 92 214 100 C200 140 140 150 104 130Z" />
          <path d="M180 138 C260 160 360 180 440 196" />
        </g>
        {/* Skyliner */}
        <g stroke="var(--map-sky)" strokeWidth="3" fill="none" strokeDasharray="2 6" strokeLinecap="round">
          <path d="M440 196 L384 270 L410 300" /><path d="M410 300 L300 332" /><path d="M410 300 L456 352 L476 372" />
        </g>
        {/* parks */}
        {(Object.keys(PARKS) as (keyof typeof PARKS)[]).map((k) => {
          const p = PARKS[k], t = hotel?.times[k];
          return (
            <g key={k}>
              <circle cx={p.x} cy={p.y} r="30" fill={p.c} opacity=".18" filter="url(#soft)" />
              <circle cx={p.x} cy={p.y} r="20" fill={p.c} opacity=".9" />
              <text x={p.x} y={p.y + 44} textAnchor="middle" className="mlabel">{p.name}</text>
              {t && (
                <g transform={`translate(${p.x + CHIP[k].x} ${p.y + CHIP[k].y})`}>
                  <rect width="132" height="32" rx="16" fill="var(--surface)" stroke={p.c} strokeWidth="2" />
                  <text x="66" y="21" textAnchor="middle" className="mtime">~{t[0]} min · {t[1]}</text>
                </g>
              )}
            </g>
          );
        })}
        <circle cx={SPRINGS.x} cy={SPRINGS.y} r="11" fill="var(--accent)" opacity=".8" />
        <text x={SPRINGS.x + 24} y={SPRINGS.y + 34} textAnchor="end" className="mlabel">Disney Springs</text>
        {/* hotels */}
        {Object.entries(HOTEL_POS).map(([k, p]) => {
          const on = k === sel, yours = mine.includes(k);
          return (
            <g key={k} className={`mhotel${yours ? " yours" : ""}`} onClick={() => yours && setSel(k)}>
              <circle cx={p.x} cy={p.y} r={on ? 10 : yours ? 8 : 5} fill={on || yours ? "var(--ink)" : "var(--map-dot)"} stroke="var(--surface)" strokeWidth={on ? 3 : 1.5} />
              {on && <circle cx={p.x} cy={p.y} r="17" fill="none" stroke="var(--accent)" strokeWidth="3" />}
            </g>
          );
        })}
      </svg>
      <figcaption className="dm-key">
        <span><i className="k-mono" />Monorail</span><span><i className="k-sky" />Skyliner</span><span><i className="k-road" />Buses</span>
        {hotel ? <span className="dm-from"><i className="k-you" />Times from <b>{hotel.name}</b></span> : <span className="dm-from">Add your hotel to see journey times</span>}
      </figcaption>
      <p className="note" style={{ margin: "6px 0 0" }}>Our own simplified diagram, not to scale. Times are typical door-to-gate estimates.</p>
    </figure>
  );
}
