// Language flags, drawn as SVG.

export function flag(lang) {
  const f = {
    en: `<rect width="60" height="40" fill="#012169"/><path d="M0 0 L60 40 M60 0 L0 40" stroke="#fff" stroke-width="8"/><path d="M0 0 L60 40 M60 0 L0 40" stroke="#c8102e" stroke-width="3"/><path d="M30 0 V40 M0 20 H60" stroke="#fff" stroke-width="12"/><path d="M30 0 V40 M0 20 H60" stroke="#c8102e" stroke-width="7"/>`,
    es: `<rect width="60" height="40" fill="#aa151b"/><rect y="10" width="60" height="20" fill="#f1bf00"/>`,
    fr: `<rect width="20" height="40" fill="#002395"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#ed2939"/>`,
  }[lang];
  return `<svg class="flag" viewBox="0 0 60 40" aria-hidden="true"><clipPath id="fc-${lang}"><rect width="60" height="40" rx="6"/></clipPath><g clip-path="url(#fc-${lang})">${f}</g></svg>`;
}
