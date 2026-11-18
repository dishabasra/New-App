// Understanding what the learner said, and scoring how close it was.

export function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/wi-?fi/g, "wifi")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function words(text) {
  return normalize(text).split(" ").filter(Boolean);
}

// A keyword matches as a whole phrase, or as a word prefix ("strawberr" matches "strawberries").
function hasKeyword(norm, key) {
  const k = normalize(key);
  if (!k) return false;
  if (k.includes(" ")) return (" " + norm + " ").includes(" " + k + " ");
  return norm.split(" ").some((w) => w === k || (k.length >= 4 && w.startsWith(k)));
}

// Dice coefficient over word sets: 0 (nothing shared) to 1 (same words).
export function similarity(a, b) {
  const A = new Set(words(a));
  const B = new Set(words(b));
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return (2 * shared) / (A.size + B.size);
}

// Returns { reply, score } for the best matching reply, or null.
export function bestReply(text, replies, name = "") {
  const norm = normalize(text);
  if (!norm) return null;
  let best = null;
  for (const reply of replies) {
    const sample = reply.say.replace("{name}", name);
    const sim = similarity(text, sample);
    const keyed = reply.match?.length && reply.match.every((group) => group.some((k) => hasKeyword(norm, k)));
    const score = keyed ? 1 + sim : sim >= 0.6 ? sim : 0;
    if (score > 0 && (!best || score > best.score)) best = { reply, score };
  }
  return best;
}

// Word-by-word comparison of a target phrase against what was heard.
// Returns { accuracy: 0-100, parts: [{ word, ok }] }
export function pronunciation(target, heard) {
  const heardWords = words(heard);
  const pool = new Map();
  for (const w of heardWords) pool.set(w, (pool.get(w) || 0) + 1);
  const parts = target.split(/\s+/).map((raw) => {
    const w = normalize(raw);
    if (!w) return { word: raw, ok: true };
    const loose = [...pool.keys()].find((h) => pool.get(h) > 0 && (h === w || closeEnough(h, w)));
    if (loose) {
      pool.set(loose, pool.get(loose) - 1);
      return { word: raw, ok: true };
    }
    return { word: raw, ok: false };
  });
  const scored = parts.filter((p) => normalize(p.word));
  const ok = scored.filter((p) => p.ok).length;
  return { accuracy: scored.length ? Math.round((ok / scored.length) * 100) : 0, parts };
}

function closeEnough(a, b) {
  if (Math.abs(a.length - b.length) > 2 || Math.min(a.length, b.length) < 4) return false;
  return levenshtein(a, b) <= 1;
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}
