// Map buildings and flags, drawn as SVG.

function windowsGrid(x, y, cols, rows, w, h, gap, lit = "#fde68a", dark = "#1e293b", seed = 1) {
  let s = "";
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const on = ((r * 7 + c * 3 + seed) % 5) > 1;
      s += `<rect x="${x + c * (w + gap)}" y="${y + r * (h + gap)}" width="${w}" height="${h}" rx="1.5" fill="${on ? lit : dark}" opacity="${on ? 0.9 : 0.6}"/>`;
    }
  return s;
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
