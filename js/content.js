import { SCENES } from "./scenes.js";
import es from "./lang/es.js";
import fr from "./lang/fr.js";

export const LANGS = {
  en: { id: "en", name: "English", native: "English", speech: "en-US", hello: "Hello!", city: "Ashford Bay", again: "Sorry?", againEn: "",
    repeat: ["sorry", "pardon", "repeat", "again", "what", "slower"] },
  es: { id: "es", name: "Spanish", native: "Español", speech: "es-ES", hello: "¡Hola!", city: "Valdelsol", again: "¿Cómo?", againEn: "Sorry, what?",
    repeat: ["como", "perdon", "perdona", "repite", "otra vez", "despacio", "que"] },
  fr: { id: "fr", name: "French", native: "Français", speech: "fr-FR", hello: "Bonjour !", city: "Saint-Lumière", again: "Pardon ?", againEn: "Sorry?",
    repeat: ["pardon", "comment", "repeter", "repetez", "encore", "lentement", "quoi"] },
};

const PACKS = { es, fr };

// Neighbourhoods of each city, unlocked by XP.
export const DISTRICTS = [
  { name: "Old Town", xp: 0 },
  { name: "Riverside", xp: 150 },
  { name: "Uptown", xp: 420 },
];

// Characters with a looping video in vid/<id>.mp4. Others use their still portrait.
export const VIDEOS = new Set([]);
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
