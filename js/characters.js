// Illustrated characters, drawn as SVG so they stay sharp, animate (blink,
// talk, react) and weigh almost nothing. Each place has its own person.

export const LOOKS = {
  cafe: { skin: "#c68642", hair: "bun", hairColor: "#2b1b12", outfit: "#f59e0b", acc: ["apron", "earrings"] },
  market: { skin: "#f1c27d", hair: "short", hairColor: "#6b4423", outfit: "#16a34a", acc: ["cap", "beard"] },
  taxi: { skin: "#8d5524", hair: "turban", hairColor: "#dc2626", outfit: "#1f2937", acc: ["beard"] },
  restaurant: { skin: "#ffdbb4", hair: "long", hairColor: "#e8b04a", outfit: "#111827", acc: ["bowtie", "earrings"] },
  hotel: { skin: "#f1c27d", hair: "short", hairColor: "#1f1f1f", outfit: "#4338ca", acc: ["tie"] },
  doctor: { skin: "#f6d3b3", hair: "bob", hairColor: "#1a1a1a", outfit: "#f8fafc", acc: ["coat", "glasses", "stethoscope"] },
  airport: { skin: "#5c3a1e", hair: "puff", hairColor: "#1a1a1a", outfit: "#1d4ed8", acc: ["headset", "earrings"] },
  office: { skin: "#4a2e19", hair: "buzz", hairColor: "#111111", outfit: "#334155", acc: ["glasses", "tie"] },
  party: { skin: "#ffdbb4", hair: "curly", hairColor: "#b45309", outfit: "#ec4899", acc: ["earrings"] },
};

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt))));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

const HEAD = "M56 92 C56 56 74 42 100 42 C126 42 144 56 144 92 C144 124 126 144 100 144 C74 144 56 124 56 92 Z";

function backHair(style, c) {
  switch (style) {
    case "long":
      return `<path d="M50 92 C44 40 80 28 100 28 C122 28 158 40 150 92 L158 176 C136 188 64 188 42 176 Z" fill="${c}"/>`;
    case "bob":
      return `<path d="M47 94 C42 44 78 32 100 32 C124 32 158 44 153 94 L154 142 C138 150 62 150 46 142 Z" fill="${c}"/>`;
    case "bun":
      return `<circle cx="100" cy="30" r="20" fill="${c}"/><circle cx="94" cy="24" r="6" fill="${shade(c, 0.25)}" opacity=".5"/>`;
    case "puff":
      return `<circle cx="100" cy="70" r="62" fill="${c}"/><circle cx="76" cy="40" r="10" fill="${shade(c, 0.3)}" opacity=".35"/>`;
    case "curly": {
      let s = "";
      for (let a = 160; a <= 380; a += 22) {
        const r = (a * Math.PI) / 180;
        s += `<circle cx="${100 + Math.cos(r) * 48}" cy="${86 + Math.sin(r) * 52}" r="17" fill="${c}"/>`;
      }
      return s + `<path d="M54 100 C50 130 60 150 70 156 L130 156 C140 150 150 130 146 100 Z" fill="${c}"/>`;
    }
    default:
      return "";
  }
}

function frontHair(style, c) {
  const hi = shade(c, 0.25);
  switch (style) {
    case "short":
      return `<path d="M54 90 C50 48 78 34 102 34 C128 34 152 50 146 90 C142 72 132 62 118 60 C104 70 80 62 66 70 C60 76 56 82 54 90 Z" fill="${c}"/>
        <path d="M84 44 C96 40 112 40 124 46" stroke="${hi}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`;
    case "buzz":
      return `<path d="M57 84 C58 52 80 40 100 40 C120 40 142 52 143 84 C132 64 118 56 100 56 C82 56 68 64 57 84 Z" fill="${c}" opacity=".92"/>`;
    case "long":
      return `<path d="M54 96 C50 48 80 36 100 36 C124 36 152 50 146 96 C140 66 120 56 100 58 C92 66 74 74 60 80 Z" fill="${c}"/>
        <path d="M78 46 C90 40 112 40 124 48" stroke="${hi}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
    case "bob":
      return `<path d="M54 92 C52 50 80 36 100 36 C124 36 150 50 146 92 C146 74 132 64 116 66 C100 72 84 62 70 66 C60 72 56 80 54 92 Z" fill="${c}"/>`;
    case "bun":
      return `<path d="M56 86 C54 52 78 40 100 40 C122 40 146 52 144 86 C136 64 120 56 100 56 C80 56 64 64 56 86 Z" fill="${c}"/>`;
    case "puff":
      return `<path d="M58 80 C64 56 82 48 100 48 C118 48 136 56 142 80 C130 66 116 62 100 62 C84 62 70 66 58 80 Z" fill="${c}"/>`;
    case "curly":
      return [70, 86, 100, 114, 130].map((x, i) => `<circle cx="${x}" cy="${50 + (i % 2) * 6}" r="13" fill="${c}"/>`).join("");
    case "turban":
      return `<path d="M50 86 C44 38 80 20 100 20 C122 20 158 38 150 86 C136 70 116 64 100 64 C84 64 64 70 50 86 Z" fill="${c}"/>
        <path d="M60 70 C80 40 120 34 142 66 M58 54 C84 34 120 30 140 48" stroke="${shade(c, -0.25)}" stroke-width="3" fill="none"/>
        <circle cx="100" cy="58" r="6" fill="#fbbf24" stroke="#b45309" stroke-width="1.5"/>`;
    default:
      return "";
  }
}

function body(look) {
  const o = look.outfit;
  const dark = shade(o, -0.2);
  let s = `<path d="M24 222 C26 176 58 154 100 154 C142 154 174 176 176 222 Z" fill="${o}"/>
    <path d="M24 222 C26 190 40 172 58 164 L64 222 Z" fill="${dark}" opacity=".35"/>`;
  if (look.acc.includes("coat")) {
    s += `<path d="M86 154 L100 196 L114 154" fill="#93c5fd"/><path d="M80 156 L96 210 M120 156 L104 210" stroke="#cbd5e1" stroke-width="3"/>
      <rect x="122" y="182" width="18" height="12" rx="2" fill="#e2e8f0"/><path d="M126 182 v-6" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>`;
  } else if (look.acc.includes("tie")) {
    s += `<path d="M84 154 L100 172 L116 154 Z" fill="#fff"/>
      <path d="M96 160 L104 160 L106 166 L103 204 L100 210 L97 204 L94 166 Z" fill="#dc2626"/>`;
  } else {
    s += `<path d="M84 154 C88 166 112 166 116 154 Z" fill="${look.skin}"/>`;
  }
  if (look.acc.includes("apron")) {
    s += `<path d="M70 176 L130 176 L138 222 L62 222 Z" fill="#fff" opacity=".95"/>
      <path d="M72 176 L86 156 M128 176 L114 156" stroke="#fff" stroke-width="4"/>
      <rect x="88" y="190" width="24" height="14" rx="3" fill="#fde68a"/>`;
  }
  if (look.acc.includes("bowtie")) {
    s += `<path d="M84 160 L98 166 L84 172 Z M116 160 L102 166 L116 172 Z" fill="#dc2626"/><circle cx="100" cy="166" r="4" fill="#991b1b"/>`;
  }
  if (look.acc.includes("stethoscope")) {
    s += `<path d="M78 156 C72 186 90 200 100 200 C110 200 128 186 122 156" stroke="#475569" stroke-width="4" fill="none"/>
      <circle cx="100" cy="204" r="7" fill="#94a3b8" stroke="#475569" stroke-width="2"/>`;
  }
  return s;
}

function face(look) {
  const skin = look.skin;
  const deep = shade(skin, -0.22);
  const lip = shade(skin, -0.45);
  const brow = look.hair === "turban" ? "#1f1f1f" : look.hairColor;
  let s = `
    <ellipse cx="56" cy="98" rx="8" ry="11" fill="${skin}"/><ellipse cx="144" cy="98" rx="8" ry="11" fill="${skin}"/>
    <path d="${HEAD}" fill="${skin}"/>
    <path d="M60 112 C66 134 84 144 100 144 C116 144 134 134 140 112 C130 130 116 136 100 136 C84 136 70 130 60 112 Z" fill="${deep}" opacity=".35"/>
    <g class="eyes">
      <ellipse cx="82" cy="96" rx="7.5" ry="8.5" fill="#fff"/><ellipse cx="118" cy="96" rx="7.5" ry="8.5" fill="#fff"/>
      <circle class="pupil" cx="83" cy="97" r="5" fill="#1f2937"/><circle class="pupil" cx="119" cy="97" r="5" fill="#1f2937"/>
      <circle cx="85" cy="94.5" r="1.8" fill="#fff"/><circle cx="121" cy="94.5" r="1.8" fill="#fff"/>
    </g>
    <path class="brow" d="M71 82 Q82 75 93 80" stroke="${brow}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <path class="brow" d="M107 80 Q118 75 129 82" stroke="${brow}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <path d="M100 100 Q95 112 101 114" stroke="${deep}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="72" cy="114" r="7" fill="#f87171" opacity=".22"/><circle cx="128" cy="114" r="7" fill="#f87171" opacity=".22"/>
    <path class="mouth-idle" d="M88 122 Q100 132 112 122" stroke="${lip}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <g class="mouth-talk"><ellipse cx="100" cy="125" rx="9" ry="7" fill="${lip}"/><ellipse cx="100" cy="129" rx="5" ry="2.5" fill="#f87171"/></g>`;
  if (look.acc.includes("beard")) {
    const c = look.hairColor === "#dc2626" ? "#1f1f1f" : look.hairColor;
    s += `<path d="M58 104 C60 142 84 152 100 152 C116 152 140 142 142 104 C134 128 118 136 112 136 L112 132 C106 128 94 128 88 132 L88 136 C82 136 66 128 58 104 Z" fill="${c}"/>
      <path d="M86 119 Q100 112 114 119 Q100 122 86 119 Z" fill="${c}"/>`;
  }
  if (look.acc.includes("glasses")) {
    s += `<g fill="rgba(255,255,255,.18)" stroke="#111827" stroke-width="3"><rect x="68" y="85" width="28" height="22" rx="8"/><rect x="104" y="85" width="28" height="22" rx="8"/></g>
      <path d="M96 94 Q100 90 104 94" stroke="#111827" stroke-width="3" fill="none"/>`;
  }
  if (look.acc.includes("earrings")) {
    s += `<circle cx="55" cy="112" r="4" fill="#fbbf24"/><circle cx="145" cy="112" r="4" fill="#fbbf24"/>`;
  }
  return s;
}

function topper(look) {
  let s = "";
  if (look.acc.includes("cap")) {
    s += `<path d="M54 80 C54 34 146 34 146 80 Z" fill="#dc2626"/><path d="M50 80 Q100 70 172 84 Q100 92 50 84 Z" fill="#b91c1c"/>
      <circle cx="100" cy="44" r="4" fill="#991b1b"/>`;
  }
  if (look.acc.includes("headset")) {
    s += `<path d="M50 96 C46 30 154 30 150 96" stroke="#111827" stroke-width="6" fill="none"/>
      <rect x="44" y="86" width="14" height="24" rx="6" fill="#111827"/><rect x="142" y="86" width="14" height="24" rx="6" fill="#111827"/>
      <path d="M52 108 Q60 132 84 128" stroke="#111827" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="86" cy="128" r="4" fill="#111827"/>`;
  }
  return s;
}

// Full character portrait. `id` keeps gradient ids unique when several are on screen.
export function character(sceneId, { id = sceneId, cls = "" } = {}) {
  const look = LOOKS[sceneId] || LOOKS.cafe;
  return `<svg class="character ${cls}" viewBox="0 0 200 222" role="img" aria-hidden="true">
    <defs><radialGradient id="glow-${id}" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <g class="char-body">
      ${backHair(look.hair, look.hairColor)}
      <rect x="86" y="130" width="28" height="30" rx="8" fill="${shade(look.skin, -0.15)}"/>
      ${body(look)}
      <g class="char-head">
        ${face(look)}
        ${frontHair(look.hair, look.hairColor)}
        ${topper(look)}
      </g>
    </g>
  </svg>`;
}
