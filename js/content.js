import { SCENES } from "./scenes.js";
import es from "./lang/es.js";
import fr from "./lang/fr.js";

export const LANGS = {
  en: { id: "en", name: "English", native: "English", speech: "en-US", hello: "Hello!" },
  es: { id: "es", name: "Spanish", native: "Español", speech: "es-ES", hello: "¡Hola!" },
  fr: { id: "fr", name: "French", native: "Français", speech: "fr-FR", hello: "Bonjour !" },
};

const PACKS = { es, fr };
const cache = {};

// Returns the 9 scenes in the requested language. English scenes define the
// structure; other languages supply the words for each node and reply.
export function getScenes(lang) {
  if (lang === "en" || !PACKS[lang]) return SCENES;
  if (cache[lang]) return cache[lang];
  const pack = PACKS[lang];
  cache[lang] = SCENES.map((base) => {
    const p = pack[base.id];
    const nodes = {};
    for (const [id, node] of Object.entries(base.nodes)) {
      const t = p.nodes[id];
      nodes[id] = {
        ...node,
        npc: t.npc,
        en: t.en,
        tip: t.tip,
        replies: (node.replies || []).map((r, i) => ({
          ...r,
          say: t.r[i][0],
          en: t.r[i][1],
          match: [t.r[i][2]],
        })),
      };
    }
    return { ...base, name: p.name, vocab: p.vocab, npc: { ...base.npc, name: p.npc }, nodes };
  });
  return cache[lang];
}
