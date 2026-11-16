// Our own illustrations: soft, dreamy, pastel. No Disney imagery: generic Florida
// holiday motifs (sunset, lagoon, palms, fireworks, suitcase, sky train).
// Colours come from --art-* tokens so they shift for dark mode.

/** Round to 2 dp so server and browser render identical SVG (trig differs in the last digits). */
const r2 = (n: number) => Math.round(n * 100) / 100;

export function SunsetScene({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1200 380" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--art-sky1)" />
          <stop offset=".55" stopColor="var(--art-sky2)" />
          <stop offset="1" stopColor="var(--art-sky3)" />
        </linearGradient>
        <radialGradient id="sunglow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="var(--art-sun)" stopOpacity=".9" />
          <stop offset="1" stopColor="var(--art-sun)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--art-water1)" />
          <stop offset="1" stopColor="var(--art-water2)" />
        </linearGradient>
      </defs>
      <rect width="1200" height="380" fill="url(#sky)" />
      {/* stars and tiny fireworks, brighter at night */}
      <g fill="var(--art-star)" opacity="var(--art-star-o)">
        {[[90, 40], [210, 80], [380, 30], [520, 70], [700, 36], [880, 60], [1010, 28], [1120, 90], [640, 110], [300, 120]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y - 5}l1.4 3.6 3.6 1.4-3.6 1.4L${x} ${y + 5}l-1.4-3.6-3.6-1.4 3.6-1.4z`} />
        ))}
      </g>
      <g stroke="var(--art-firework)" strokeWidth="2" strokeLinecap="round" opacity="var(--art-fw-o)" fill="none">
        {[[930, 70, 26], [1030, 120, 18], [170, 95, 20]].map(([cx, cy, r], i) => (
          <g key={i}>{Array.from({ length: 12 }, (_, k) => {
            const a = (k / 12) * Math.PI * 2;
            return <line key={k} x1={r2(cx + Math.cos(a) * r * 0.35)} y1={r2(cy + Math.sin(a) * r * 0.35)} x2={r2(cx + Math.cos(a) * r)} y2={r2(cy + Math.sin(a) * r)} />;
          })}</g>
        ))}
      </g>
      {/* sun and soft clouds */}
      <circle cx="760" cy="245" r="62" fill="var(--art-sun)" />
      <g fill="var(--art-cloud)" opacity=".75">
        <ellipse cx="300" cy="170" rx="150" ry="22" />
        <ellipse cx="380" cy="152" rx="90" ry="18" />
        <ellipse cx="980" cy="200" rx="170" ry="20" />
        <ellipse cx="1060" cy="184" rx="80" ry="15" />
        <ellipse cx="620" cy="130" rx="110" ry="14" />
      </g>
      {/* distant shoreline */}
      <path d="M0 262 C120 250 200 256 300 250 S520 240 640 254 S880 246 1000 252 S1150 246 1200 250 V285 H0Z" fill="var(--art-land)" />
      {/* lagoon with sun reflection */}
      <rect y="278" width="1200" height="102" fill="url(#water)" />
      <g fill="var(--art-sun)" opacity=".55">
        <rect x="712" y="292" width="96" height="4" rx="2" />
        <rect x="726" y="306" width="68" height="4" rx="2" />
        <rect x="738" y="320" width="44" height="3" rx="1.5" />
        <rect x="748" y="333" width="24" height="3" rx="1.5" />
      </g>
      {/* sky train gliding across */}
      <g transform="translate(850 214)" fill="var(--art-train)">
        <rect x="0" y="0" width="150" height="16" rx="8" />
        <rect x="-60" y="18" width="320" height="3" rx="1.5" opacity=".6" />
        {[16, 46, 76, 106].map((x) => <rect key={x} x={x} y="4" width="18" height="6" rx="3" fill="var(--art-window)" />)}
      </g>
      {/* palms, left and right */}
      <Palm x={70} y={380} s={1.15} />
      <Palm x={150} y={380} s={0.8} flip />
      <Palm x={1110} y={380} s={1.05} flip />
    </svg>
  );
}

function Palm({ x, y, s = 1, flip = false }: { x: number; y: number; s?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} fill="var(--art-palm)">
      <path d="M-4 0 C-2 -60 6 -120 22 -170 L28 -168 C14 -118 8 -60 6 0Z" />
      <path d="M24 -170 C-10 -186 -50 -178 -78 -150 C-44 -168 -10 -168 22 -160Z" />
      <path d="M24 -170 C10 -206 -16 -220 -48 -222 C-18 -208 4 -192 20 -164Z" />
      <path d="M26 -172 C46 -206 76 -214 104 -206 C72 -200 50 -188 30 -164Z" />
      <path d="M26 -170 C64 -180 100 -168 118 -140 C88 -158 58 -162 28 -162Z" />
      <path d="M24 -168 C30 -140 22 -112 4 -92 C14 -118 16 -142 20 -164Z" />
    </g>
  );
}

/** Small spot illustrations for cards and empty states. */
export function Suitcase({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="42" r="34" fill="var(--art-blob)" />
      <rect x="22" y="28" width="36" height="32" rx="7" fill="var(--art-case)" />
      <rect x="32" y="20" width="16" height="10" rx="4" fill="none" stroke="var(--art-case-d)" strokeWidth="3" />
      <rect x="22" y="40" width="36" height="4" fill="var(--art-case-d)" opacity=".5" />
      <circle cx="29" cy="62" r="2.5" fill="var(--art-case-d)" /><circle cx="51" cy="62" r="2.5" fill="var(--art-case-d)" />
      <path d="M58 22l1.4 3.6 3.6 1.4-3.6 1.4L58 32l-1.4-3.6-3.6-1.4 3.6-1.4z" fill="var(--art-star-spot)" />
    </svg>
  );
}

export function Fireworks({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="34" fill="var(--art-blob)" />
      {[[40, 34, 16, "var(--art-fw1)"], [25, 50, 9, "var(--art-fw2)"], [56, 52, 10, "var(--art-fw3)"]].map(([cx, cy, r, c], i) => (
        <g key={i} stroke={c as string} strokeWidth="2.4" strokeLinecap="round">
          {Array.from({ length: 10 }, (_, k) => {
            const a = (k / 10) * Math.PI * 2, R = r as number, X = cx as number, Y = cy as number;
            return <line key={k} x1={r2(X + Math.cos(a) * R * 0.3)} y1={r2(Y + Math.sin(a) * R * 0.3)} x2={r2(X + Math.cos(a) * R)} y2={r2(Y + Math.sin(a) * R)} />;
          })}
        </g>
      ))}
    </svg>
  );
}

export function Plate({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="34" fill="var(--art-blob)" />
      <circle cx="40" cy="42" r="18" fill="var(--art-plate)" />
      <circle cx="40" cy="42" r="11" fill="none" stroke="var(--art-case-d)" strokeWidth="2" opacity=".35" />
      <path d="M16 26v14M13 26v8M19 26v8M16 40v12" stroke="var(--art-case-d)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M64 26c-4 4-4 12 0 14v12" stroke="var(--art-case-d)" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}
