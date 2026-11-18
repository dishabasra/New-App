// Thin wrappers around the browser's free, built-in speech APIs.

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const canListen = Boolean(Recognition);
export const canSpeak = "speechSynthesis" in window;

let allVoices = [];
function loadVoices() {
  if (!canSpeak) return;
  allVoices = speechSynthesis.getVoices();
}
if (canSpeak) {
  loadVoices();
  speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
}

// Voices for a language code like "es-ES". Prefer the exact region, then any region.
export function voicesFor(lang) {
  const base = lang.slice(0, 2).toLowerCase();
  const all = allVoices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(base));
  const exact = all.filter((v) => v.lang.replace("_", "-").toLowerCase() === lang.toLowerCase());
  return exact.length ? [...exact, ...all.filter((v) => !exact.includes(v))] : all;
}

// Pick a stable voice per character so each one sounds different.
function voiceFor(seed, preferredURI, lang) {
  const voices = voicesFor(lang);
  if (preferredURI) {
    const v = voices.find((x) => x.voiceURI === preferredURI);
    if (v) return v;
  }
  if (!voices.length) return null;
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return voices[h % voices.length];
}

export function speak(text, { lang = "en-US", seed = "", pitch = 1, rate = 1, voiceURI = null, speed = 1 } = {}) {
  return new Promise((resolve) => {
    if (!canSpeak) return resolve();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\(.*?\)\s*/g, ""));
    const v = voiceFor(seed, voiceURI, lang);
    if (v) u.voice = v;
    u.lang = v?.lang || lang;
    u.pitch = pitch;
    u.rate = Math.max(0.5, rate * (speed || 1));
    u.onend = resolve;
    u.onerror = resolve;
    speechSynthesis.speak(u);
    // Some browsers never fire onend; don't hang the conversation.
    setTimeout(resolve, 1500 + text.length * 90);
  });
}

export function stopSpeaking() {
  if (canSpeak) speechSynthesis.cancel();
}

// Listen once. Calls onInterim with partial text, resolves with the final text.
export function listen({ lang = "en-US", onInterim = () => {} } = {}) {
  let rec;
  const promise = new Promise((resolve, reject) => {
    if (!Recognition) return reject(new Error("unsupported"));
    rec = new Recognition();
    rec.lang = lang;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    let finalText = "";
    let confidence = 0;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          finalText += r[0].transcript;
          confidence = r[0].confidence;
        } else interim += r[0].transcript;
      }
      onInterim((finalText + " " + interim).trim());
    };
    rec.onerror = (e) => reject(new Error(e.error || "error"));
    rec.onend = () => resolve({ text: finalText.trim(), confidence });
    rec.start();
  });
  return { promise, stop: () => rec?.stop() };
}
