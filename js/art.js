// Illustrated backdrops for each place, map buildings and flags, all as SVG.

const W = 400, H = 260;
const svg = (body, cls = "") =>
  `<svg class="${cls}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}</svg>`;

function windowsGrid(x, y, cols, rows, w, h, gap, lit = "#fde68a", dark = "#1e293b", seed = 1) {
  let s = "";
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const on = ((r * 7 + c * 3 + seed) % 5) > 1;
      s += `<rect x="${x + c * (w + gap)}" y="${y + r * (h + gap)}" width="${w}" height="${h}" rx="1.5" fill="${on ? lit : dark}" opacity="${on ? 0.9 : 0.6}"/>`;
    }
  return s;
}

function skyline(base, color, lit, seed = 1) {
  const blds = [[0, 70, 40], [44, 110, 34], [82, 60, 46], [132, 130, 30], [166, 90, 44], [214, 150, 36], [254, 80, 48], [306, 120, 34], [344, 70, 56]];
  return blds
    .map(([x, h, w], i) => `<rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="${color}"/>${windowsGrid(x + 5, base - h + 8, Math.floor((w - 6) / 9), Math.floor((h - 12) / 12), 5, 6, 4, lit, color, seed + i)}`)
    .join("");
}

const BACKDROPS = {
  cafe: () => svg(`
    <rect width="400" height="260" fill="#fde7c8"/>
    <rect y="0" width="400" height="8" fill="#e9c896"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<rect x="${i * 44}" y="0" width="22" height="190" fill="#f8dcb2" opacity=".55"/>`).join("")}
    <rect x="24" y="36" width="130" height="86" rx="6" fill="#244c3b" stroke="#8b5a2b" stroke-width="6"/>
    <text x="40" y="58" fill="#fef3c7" font-family="cursive, sans-serif" font-size="13">☕ MENU</text>
    ${[72, 86, 100].map((y, i) => `<path d="M38 ${y} H${110 - i * 14}" stroke="#fef3c7" stroke-width="2" stroke-linecap="round" opacity=".7"/><text x="124" y="${y + 3}" fill="#fde68a" font-size="9" font-family="sans-serif">${["3.5", "4.0", "4.5"][i]}</text>`).join("")}
    <rect x="250" y="70" width="130" height="6" rx="2" fill="#8b5a2b"/>
    ${[262, 290, 318, 346].map((x, i) => `<path d="M${x} 70 v-16 h18 v16 Z" fill="${["#f59e0b", "#ef4444", "#3b82f6", "#22c55e"][i]}"/><path d="M${x + 18} 58 q7 0 7 6 q0 6 -7 6" stroke="${["#f59e0b", "#ef4444", "#3b82f6", "#22c55e"][i]}" stroke-width="3" fill="none"/>`).join("")}
    ${[200, 320].map((x) => `<path d="M${x} 0 V24" stroke="#5b3a1a" stroke-width="2"/><path d="M${x - 18} 40 Q${x} 18 ${x + 18} 40 Z" fill="#1f2937"/><ellipse cx="${x}" cy="42" rx="12" ry="5" fill="#fde68a"/><ellipse cx="${x}" cy="60" rx="40" ry="22" fill="#fde68a" opacity=".18"/>`).join("")}
    <rect x="0" y="190" width="400" height="70" fill="#7c3f12"/>
    <rect x="0" y="186" width="400" height="10" fill="#a0561e"/>
    <rect x="300" y="140" width="64" height="50" rx="6" fill="#9ca3af"/><rect x="306" y="148" width="52" height="16" rx="3" fill="#374151"/><rect x="318" y="168" width="10" height="14" fill="#1f2937"/><rect x="336" y="168" width="10" height="14" fill="#1f2937"/>
    <ellipse cx="50" cy="186" rx="26" ry="6" fill="#d97706"/><path d="M30 186 Q50 160 70 186" fill="#f59e0b"/>`),
  market: () => svg(`
    <defs><linearGradient id="mk-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#e0f2fe"/></linearGradient></defs>
    <rect width="400" height="260" fill="url(#mk-sky)"/>
    <circle cx="340" cy="44" r="22" fill="#fde047"/>
    <ellipse cx="80" cy="40" rx="34" ry="12" fill="#fff" opacity=".9"/><ellipse cx="220" cy="28" rx="26" ry="9" fill="#fff" opacity=".8"/>
    ${skyline(150, "#94a3b8", "#e2e8f0", 3)}
    <rect y="150" width="400" height="110" fill="#e7d3b0"/>
    ${[[10, "#ef4444"], [140, "#22c55e"], [270, "#3b82f6"]].map(([x, c]) => `
      <rect x="${x + 6}" y="100" width="6" height="110" fill="#8b5a2b"/><rect x="${x + 112}" y="100" width="6" height="110" fill="#8b5a2b"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${x + i * 20.6} 96 h20.6 v20 q-10.3 10 -20.6 0 Z" fill="${i % 2 ? "#fff" : c}"/>`).join("")}
      <rect x="${x}" y="160" width="124" height="40" rx="4" fill="#b7793a"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<circle cx="${x + 12 + i * 14}" cy="158" r="8" fill="${[c === "#22c55e" ? "#84cc16" : "#ef4444", "#f97316", "#facc15", "#ef4444"][i % 4]}"/>`).join("")}`).join("")}`),
  taxi: () => svg(`
    <defs><linearGradient id="tx-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fb923c"/><stop offset="1" stop-color="#fde68a"/></linearGradient></defs>
    <rect width="400" height="260" fill="url(#tx-sky)"/>
    ${skyline(180, "#475569", "#fde68a", 5)}
    <rect y="176" width="400" height="20" fill="#334155"/>
    <path d="M0 0 H400 V30 Q200 6 0 30 Z" fill="#111827"/>
    <path d="M0 0 V260 H40 L60 30 Z M400 0 V260 H360 L340 30 Z" fill="#1f2937"/>
    <rect x="170" y="22" width="60" height="18" rx="6" fill="#111827"/><rect x="174" y="25" width="52" height="12" rx="4" fill="#64748b"/>
    <path d="M200 40 V64" stroke="#111827" stroke-width="1.5"/><path d="M193 64 L200 82 L207 64 Z" fill="#22c55e"/>
    <path d="M0 200 Q200 170 400 200 V260 H0 Z" fill="#111827"/>
    <rect x="270" y="196" width="70" height="26" rx="5" fill="#0f172a" stroke="#facc15" stroke-width="2"/><text x="305" y="214" text-anchor="middle" fill="#facc15" font-family="monospace" font-size="13">18.00</text>`),
  restaurant: () => svg(`
    <rect width="400" height="260" fill="#3f1d2b"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => `<path d="M${i * 40} 0 V200" stroke="#4c2434" stroke-width="14"/>`).join("")}
    <rect x="240" y="28" width="120" height="110" rx="60" fill="#0f172a" stroke="#a16207" stroke-width="6"/>
    <circle cx="320" cy="62" r="14" fill="#fef9c3"/><circle cx="314" cy="58" r="13" fill="#0f172a"/>
    ${[[262, 70], [282, 100], [300, 50], [340, 110], [270, 120]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#fff"/>`).join("")}
    <path d="M300 28 V138 M240 84 H360" stroke="#a16207" stroke-width="4"/>
    <rect x="40" y="46" width="60" height="44" fill="#a16207"/><rect x="46" y="52" width="48" height="32" fill="#7c2d12"/><circle cx="70" cy="68" r="10" fill="#fbbf24" opacity=".7"/>
    <path d="M0 14 Q100 34 200 14 T400 14" stroke="#78350f" stroke-width="1.5" fill="none"/>
    ${[20, 60, 100, 140, 180, 220, 260, 300, 340, 380].map((x, i) => `<circle cx="${x}" cy="${20 + Math.sin(i) * 6}" r="4" fill="#fde68a"/><circle cx="${x}" cy="${20 + Math.sin(i) * 6}" r="10" fill="#fde68a" opacity=".15"/>`).join("")}
    <rect y="196" width="400" height="64" fill="#fafaf9"/><rect y="192" width="400" height="8" fill="#e7e5e4"/>
    <rect x="62" y="166" width="8" height="28" rx="2" fill="#fef3c7"/><path d="M66 166 q-5 -8 0 -14 q5 6 0 14" fill="#f59e0b"/><circle cx="66" cy="158" r="22" fill="#fbbf24" opacity=".18"/>
    <path d="M320 160 q12 34 0 34 h-2 q-12 0 2 -34 Z" fill="#7f1d1d" opacity=".9"/>`),
  hotel: () => svg(`
    <rect width="400" height="260" fill="#ede9fe"/>
    ${[50, 150, 250, 350].map((x) => `<rect x="${x - 6}" y="0" width="12" height="190" fill="#ddd6fe"/>`).join("")}
    <path d="M200 0 V20" stroke="#a16207" stroke-width="2"/><path d="M170 20 H230 L220 44 H180 Z" fill="#fbbf24"/>
    ${[176, 188, 200, 212, 224].map((x) => `<path d="M${x} 44 v10" stroke="#fde68a" stroke-width="2"/><circle cx="${x}" cy="56" r="2.5" fill="#fef9c3"/>`).join("")}
    <rect x="26" y="50" width="90" height="84" rx="6" fill="#7c3aed"/>
    ${[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => `<circle cx="${44 + c * 27}" cy="${70 + r * 24}" r="4" fill="#fde68a"/><rect x="${42 + c * 27}" y="${74 + r * 24}" width="4" height="10" fill="#fde68a"/>`)).join("")}
    <rect x="320" y="120" width="40" height="70" rx="4" fill="#a78bfa"/><path d="M340 120 C300 80 320 60 340 90 C360 60 380 80 340 120" fill="#16a34a"/><circle cx="330" cy="92" r="16" fill="#22c55e"/><circle cx="352" cy="100" r="14" fill="#15803d"/>
    <rect y="190" width="400" height="70" fill="#4c1d95"/><rect y="186" width="400" height="8" fill="#6d28d9"/>
    <text x="200" y="230" text-anchor="middle" fill="#ddd6fe" font-family="Georgia, serif" font-size="16" letter-spacing="4">GRAND HOTEL</text>
    <circle cx="300" cy="180" r="8" fill="#fbbf24"/><rect x="292" y="180" width="16" height="4" fill="#b45309"/>`),
  doctor: () => svg(`
    <rect width="400" height="260" fill="#e0f2fe"/>
    <rect y="170" width="400" height="90" fill="#bae6fd"/>
    <rect x="26" y="30" width="110" height="90" rx="6" fill="#fff" stroke="#94a3b8" stroke-width="4"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="30" y="${36 + i * 12}" width="102" height="6" fill="#cbd5e1"/>`).join("")}
    <rect x="300" y="26" width="64" height="88" rx="4" fill="#fff"/>
    ${["E", "F P", "T O Z", "L P E D"].map((t, i) => `<text x="332" y="${46 + i * 18}" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="${16 - i * 3}" fill="#0f172a">${t}</text>`).join("")}
    <rect x="176" y="34" width="48" height="48" rx="10" fill="#fff"/><path d="M196 46 h8 v10 h10 v8 h-10 v10 h-8 v-10 h-10 v-8 h10 Z" fill="#ef4444"/>
    <rect x="20" y="150" width="90" height="70" rx="6" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="3"/><path d="M65 150 V220 M20 185 H110" stroke="#cbd5e1" stroke-width="3"/>
    <rect x="290" y="186" width="110" height="20" rx="8" fill="#38bdf8"/>`),
  airport: () => svg(`
    <defs><linearGradient id="ap-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#dbeafe"/></linearGradient></defs>
    <rect width="400" height="260" fill="url(#ap-sky)"/>
    <ellipse cx="300" cy="50" rx="40" ry="12" fill="#fff" opacity=".9"/>
    <g transform="translate(70 70) rotate(-8)"><path d="M0 20 Q10 10 120 12 Q140 14 150 20 Q140 26 120 28 L10 28 Q0 26 0 20 Z" fill="#f8fafc"/>
      <path d="M50 18 L90 -16 L104 -16 L80 18 Z M60 26 L92 56 L106 56 L84 26 Z M4 18 L-6 -6 L6 -6 L22 16 Z" fill="#3b82f6"/>
      ${[30, 42, 54, 66, 78, 90, 102].map((x) => `<circle cx="${x}" cy="18" r="2.2" fill="#1e293b"/>`).join("")}</g>
    ${[0, 100, 200, 300].map((x) => `<rect x="${x}" y="0" width="8" height="160" fill="#64748b"/>`).join("")}
    <rect y="156" width="400" height="8" fill="#64748b"/>
    <rect x="236" y="96" width="150" height="58" rx="4" fill="#0f172a"/>
    <text x="244" y="110" fill="#fbbf24" font-family="monospace" font-size="8">DEPARTURES</text>
    ${["LONDON   B12  DELAYED", "TOKYO    C04  ON TIME", "NEW YORK A07  BOARDING"].map((t, i) => `<text x="244" y="${124 + i * 11}" fill="${i === 0 ? "#f87171" : "#fde68a"}" font-family="monospace" font-size="8">${t}</text>`).join("")}
    <rect y="164" width="400" height="96" fill="#cbd5e1"/>
    <rect y="196" width="400" height="64" fill="#1e3a8a"/><rect y="192" width="400" height="8" fill="#1d4ed8"/>`),
  office: () => svg(`
    <rect width="400" height="260" fill="#f1f5f9"/>
    <rect x="0" y="0" width="400" height="150" fill="#e2e8f0"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${i * 100 + 6}" y="10" width="88" height="130" fill="#bae6fd" opacity=".55"/>`).join("")}
    ${skyline(140, "#cbd5e1", "#f8fafc", 2)}
    <rect x="30" y="40" width="130" height="80" rx="4" fill="#fff" stroke="#94a3b8" stroke-width="3"/>
    ${[[42, 52, "#fde047"], [70, 52, "#f9a8d4"], [98, 52, "#86efac"], [42, 82, "#93c5fd"], [70, 82, "#fde047"]].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="22" height="22" fill="${c}" transform="rotate(${(x % 7) - 3} ${x + 11} ${y + 11})"/>`).join("")}
    <path d="M128 100 l10 -20 l10 14 l8 -24" stroke="#ef4444" stroke-width="3" fill="none"/>
    <rect x="330" y="120" width="34" height="70" fill="#78716c"/><circle cx="347" cy="104" r="26" fill="#22c55e"/><circle cx="332" cy="116" r="16" fill="#16a34a"/>
    <rect y="190" width="400" height="70" fill="#e7e5e4"/><rect y="186" width="400" height="8" fill="#a8a29e"/>
    <rect x="40" y="168" width="60" height="22" rx="3" fill="#1f2937"/><rect x="44" y="172" width="52" height="14" fill="#38bdf8"/>
    <path d="M290 180 h22 v10 h-22 Z" fill="#fff"/><path d="M312 182 q6 0 6 4 q0 4 -6 4" stroke="#fff" stroke-width="2" fill="none"/>`),
  party: () => svg(`
    <defs><linearGradient id="pt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e1b4b"/><stop offset="1" stop-color="#7e22ce"/></linearGradient></defs>
    <rect width="400" height="260" fill="url(#pt-sky)"/>
    ${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 137) % 400}" cy="${(i * 53) % 110}" r="${i % 3 === 0 ? 1.6 : 1}" fill="#fff" opacity=".8"/>`).join("")}
    <circle cx="70" cy="50" r="20" fill="#fef9c3"/><circle cx="62" cy="44" r="4" fill="#fde68a"/>
    ${skyline(196, "#312e81", "#fbbf24", 7)}
    <path d="M0 30 Q100 70 200 34 T400 40" stroke="#1f2937" stroke-width="1.5" fill="none"/>
    ${Array.from({ length: 14 }, (_, i) => { const x = 14 + i * 28; const y = 34 + Math.sin(i * 0.8) * 14 + (i < 7 ? i * 2 : (14 - i) * 2); const c = ["#f472b6", "#fde047", "#60a5fa", "#4ade80"][i % 4]; return `<circle cx="${x}" cy="${y}" r="4" fill="${c}"/><circle cx="${x}" cy="${y}" r="10" fill="${c}" opacity=".2"/>`; }).join("")}
    <rect y="196" width="400" height="64" fill="#1f2937"/><rect y="192" width="400" height="8" fill="#374151"/>
    <rect x="30" y="160" width="10" height="32" fill="#9ca3af"/><rect x="24" y="152" width="22" height="10" fill="#f472b6"/>`),
};

export function backdrop(id) {
  return (BACKDROPS[id] || BACKDROPS.cafe)();
}

// A little building for the city map.
export function building(id, color, locked) {
  const roof = {
    cafe: `<path d="M6 34 L40 12 L74 34 Z" fill="${color}"/><path d="M10 42 h60 l-4 10 h-52 Z" fill="#fff"/><path d="M10 42 h60 l-4 10 h-52 Z" fill="${color}" opacity=".35"/>`,
    market: `${[0, 1, 2, 3, 4].map((i) => `<path d="M${8 + i * 12.8} 30 h12.8 v10 q-6.4 6 -12.8 0 Z" fill="${i % 2 ? "#fff" : color}"/>`).join("")}`,
    taxi: `<rect x="14" y="40" width="52" height="16" rx="6" fill="#facc15"/><rect x="22" y="30" width="36" height="14" rx="5" fill="#facc15"/><rect x="34" y="25" width="12" height="6" rx="2" fill="#111827"/><circle cx="26" cy="58" r="5" fill="#111827"/><circle cx="54" cy="58" r="5" fill="#111827"/>`,
  }[id];
  const tall = ["hotel", "office", "airport"].includes(id);
  const h = tall ? 52 : 36;
  const top = 66 - h;
  const body =
    id === "taxi"
      ? `<rect x="6" y="56" width="68" height="10" rx="3" fill="#94a3b8"/>`
      : `<rect x="10" y="${top}" width="60" height="${h}" rx="4" fill="${locked ? "#cbd5e1" : "#fff"}"/>
         <rect x="10" y="${top}" width="60" height="${h}" rx="4" fill="${color}" opacity="${locked ? 0.2 : 0.18}"/>
         ${windowsGrid(16, top + 6, 4, tall ? 3 : 1, 9, 8, 5, locked ? "#e2e8f0" : "#bae6fd", "#94a3b8", id.length)}
         <rect x="34" y="52" width="12" height="14" rx="2" fill="${locked ? "#94a3b8" : color}"/>
         ${tall ? `<rect x="8" y="${top - 6}" width="64" height="8" rx="3" fill="${color}"/>` : ""}`;
  return `<svg class="bldg" viewBox="0 0 80 70" aria-hidden="true">
    <ellipse cx="40" cy="67" rx="36" ry="4" fill="#000" opacity=".15"/>
    ${body}${roof && !tall ? roof : ""}
  </svg>`;
}

export function flag(lang) {
  const f = {
    en: `<rect width="60" height="40" fill="#012169"/><path d="M0 0 L60 40 M60 0 L0 40" stroke="#fff" stroke-width="8"/><path d="M0 0 L60 40 M60 0 L0 40" stroke="#c8102e" stroke-width="3"/><path d="M30 0 V40 M0 20 H60" stroke="#fff" stroke-width="12"/><path d="M30 0 V40 M0 20 H60" stroke="#c8102e" stroke-width="7"/>`,
    es: `<rect width="60" height="40" fill="#aa151b"/><rect y="10" width="60" height="20" fill="#f1bf00"/>`,
    fr: `<rect width="20" height="40" fill="#002395"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#ed2939"/>`,
  }[lang];
  return `<svg class="flag" viewBox="0 0 60 40" aria-hidden="true"><clipPath id="fc-${lang}"><rect width="60" height="40" rx="6"/></clipPath><g clip-path="url(#fc-${lang})">${f}</g></svg>`;
}
