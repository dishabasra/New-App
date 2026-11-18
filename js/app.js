import { getScenes, LANGS } from "./content.js";
import { bestReply, pronunciation } from "./match.js";
import { speak, stopSpeaking, listen, canListen, canSpeak, voicesFor } from "./speech.js";
import { character } from "./characters.js";
import { backdrop, building, flag } from "./art.js";

// ---------- state ----------

const STORE_KEY = "talktown:v2";
const today = () => new Date().toISOString().slice(0, 10);
const LEVEL_XP = { Beginner: 0, Intermediate: 150, Advanced: 420 };

const defaults = () => ({
  name: "",
  lang: "en",
  coins: 0,
  streak: 0,
  lastDay: null,
  dailyGoal: 50,
  todayXp: 0,
  todayDate: today(),
  progress: {},
  phrases: [],
  voice: {},
  speed: 1,
  autoListen: true,
  showTr: false,
});

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return { ...defaults(), ...JSON.parse(raw) };
    // Carry over progress from the first version of the app.
    const old = JSON.parse(localStorage.getItem("talktown:v1") || "null");
    if (old?.name) {
      return {
        ...defaults(),
        name: old.name,
        coins: old.coins || 0,
        streak: old.streak || 0,
        lastDay: old.lastDay,
        dailyGoal: old.dailyGoal || 50,
        progress: { en: { xp: old.xp || 0, completed: old.completed || {} } },
        phrases: (old.phrases || []).map((p) => ({ ...p, lang: "en" })),
      };
    }
  } catch {}
  return defaults();
}
let state = load();
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {}
}

const prog = (lang = state.lang) => (state.progress[lang] ||= { xp: 0, completed: {} });
const scenes = () => getScenes(state.lang);
const L = () => LANGS[state.lang];

function rollDay() {
  if (state.todayDate !== today()) {
    state.todayDate = today();
    state.todayXp = 0;
    save();
  }
}

function addXp(n) {
  rollDay();
  prog().xp += n;
  state.todayXp += n;
  state.coins += Math.round(n / 5);
  const d = today();
  if (state.lastDay !== d) {
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    state.streak = state.lastDay === yesterday ? state.streak + 1 : 1;
    state.lastDay = d;
  }
  save();
}

// ---------- helpers ----------

const $ = (sel, root = document) => root.querySelector(sel);
const app = $("#app");
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fill = (s) => String(s ?? "").replaceAll("{name}", state.name || "friend");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const levelFromXp = (xp) => Math.floor(Math.sqrt(xp / 25)) + 1;
const totalXp = () => Object.values(state.progress).reduce((a, p) => a + p.xp, 0);

function toast(msg) {
  document.querySelector(".toast")?.remove();
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 2400);
}

function say(text, opts = {}) {
  return speak(text, { lang: L().speech, voiceURI: state.voice[state.lang] || null, speed: state.speed || 1, ...opts });
}

function savePhrase(text, en, source) {
  const t = fill(text);
  if (state.phrases.some((p) => p.text === t && p.lang === state.lang)) return toast("Already in your phrasebook");
  state.phrases.unshift({ text: t, en: en ? fill(en) : "", lang: state.lang, source, best: 0, added: Date.now() });
  save();
  toast("⭐ Saved to phrasebook");
}

function ring(pct, size = 64, stroke = 7, color = "#f97316") {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.min(1, pct))}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
  </svg>`;
}

// ---------- router ----------

let cleanup = null;

function go(view, arg) {
  cleanup?.();
  cleanup = null;
  stopSpeaking();
  document.querySelector(".sheet-wrap")?.remove();
  window.scrollTo(0, 0);
  if (!state.name && view !== "welcome") view = "welcome";
  app.className = "view-" + view;
  ({ welcome, city, scene, phrasebook, drill, profile })[view](arg);
}

function nav(active) {
  const tabs = [
    ["city", "M3 21V10l9-7 9 7v11h-6v-6H9v6z", "City"],
    ["phrasebook", "M5 3h11a3 3 0 013 3v15H8a3 3 0 01-3-3zM5 18a3 3 0 013-3h11", "Phrases"],
    ["drill", "M12 2a3 3 0 013 3v6a3 3 0 01-6 0V5a3 3 0 013-3zM5 11a7 7 0 0014 0M12 18v4", "Drill"],
    ["profile", "M12 12a5 5 0 100-10 5 5 0 000 10zM3 22a9 9 0 0118 0", "Me"],
  ];
  return `<nav class="tabbar">${tabs
    .map(
      ([v, d, l]) => `<button data-go="${v}" class="${v === active ? "on" : ""}" aria-label="${l}">
        <svg viewBox="0 0 24 24" width="24" height="24"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>${l}</button>`
    )
    .join("")}</nav>`;
}

app.addEventListener("click", (e) => {
  const b = e.target.closest("[data-go]");
  if (b) go(b.dataset.go, b.dataset.arg);
});

// ---------- language picker sheet ----------

function langSheet(onPick) {
  const wrap = document.createElement("div");
  wrap.className = "sheet-wrap";
  wrap.innerHTML = `
    <div class="sheet" role="dialog" aria-label="Choose a language">
      <div class="grab"></div>
      <h3>What do you want to practise?</h3>
      <div class="lang-list">
        ${Object.values(LANGS)
          .map((l) => {
            const p = state.progress[l.id];
            return `<button class="lang-opt ${l.id === state.lang ? "on" : ""}" data-lang="${l.id}">
              ${flag(l.id)}<span><b>${l.native}</b><small>${p ? `Level ${levelFromXp(p.xp)} · ${p.xp} XP` : "Start fresh"}</small></span>
              ${l.id === state.lang ? `<i>✓</i>` : ""}</button>`;
          })
          .join("")}
      </div>
    </div>`;
  document.body.append(wrap);
  requestAnimationFrame(() => wrap.classList.add("open"));
  const close = () => {
    wrap.classList.remove("open");
    setTimeout(() => wrap.remove(), 250);
  };
  wrap.addEventListener("click", (e) => {
    if (e.target === wrap) return close();
    const b = e.target.closest("[data-lang]");
    if (!b) return;
    state.lang = b.dataset.lang;
    prog();
    save();
    close();
    onPick?.();
  });
}

// ---------- welcome ----------

function welcome() {
  let lang = state.lang || "en";
  app.innerHTML = `
  <section class="welcome">
    <div class="hero">
      <div class="hero-bg">${backdrop("party")}</div>
      <div class="hero-cast">
        <div class="cast c1">${character("cafe", { id: "w1" })}</div>
        <div class="cast c2">${character("airport", { id: "w2" })}</div>
        <div class="cast c3">${character("market", { id: "w3" })}</div>
      </div>
      <div class="hero-bubble">${esc(LANGS[lang].hello)}</div>
    </div>
    <div class="welcome-body">
      <h1>TalkTown</h1>
      <p class="lead">Walk into a café, a market or a job interview and <b>speak</b>. Real conversations, out loud, with instant feedback.</p>
      <form id="start" class="card">
        <fieldset class="fs">
          <legend>I want to speak</legend>
          <div class="lang-cards">
            ${Object.values(LANGS)
              .map(
                (l) => `<label class="lang-card">
                  <input type="radio" name="lang" value="${l.id}" ${l.id === lang ? "checked" : ""}/>
                  <span>${flag(l.id)}<b>${l.native}</b></span></label>`
              )
              .join("")}
          </div>
        </fieldset>
        <label class="field">What should we call you?
          <input name="name" required maxlength="20" placeholder="Your first name" autocomplete="given-name" />
        </label>
        <fieldset class="fs">
          <legend>Your level</legend>
          <div class="seg">
            ${Object.keys(LEVEL_XP)
              .map((l, i) => `<label><input type="radio" name="level" value="${l}" ${i === 0 ? "checked" : ""}/><span>${l}</span></label>`)
              .join("")}
          </div>
        </fieldset>
        <button class="btn primary big">Enter the city</button>
      </form>
      <ul class="perks">
        <li><b>🎙️</b> Speak out loud</li><li><b>🌍</b> 3 languages</li><li><b>🗺️</b> 9 places</li><li><b>💸</b> 100% free</li>
      </ul>
      ${canListen ? "" : `<p class="note">This browser can't recognise speech, so you'll type your replies. For voice, use Chrome, Edge or Safari.</p>`}
    </div>
  </section>`;
  app.querySelectorAll('input[name="lang"]').forEach((r) =>
    r.addEventListener("change", () => {
      lang = r.value;
      $(".hero-bubble").textContent = LANGS[lang].hello;
      $(".hero-bubble").classList.remove("pop");
      void $(".hero-bubble").offsetWidth;
      $(".hero-bubble").classList.add("pop");
    })
  );
  $("#start").onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    state.name = f.get("name").trim();
    state.lang = f.get("lang");
    const p = prog();
    p.xp = Math.max(p.xp, LEVEL_XP[f.get("level")]);
    save();
    go("city");
  };
}

// ---------- city ----------

function city() {
  rollDay();
  const list = scenes();
  const p = prog();
  const goalPct = state.todayXp / state.dailyGoal;
  const next = list.find((s) => s.unlock > p.xp);
  const cont = list.find((s) => s.unlock <= p.xp && !p.completed[s.id]) || list.filter((s) => s.unlock <= p.xp).pop();
  app.innerHTML = `
  <header class="topbar">
    <button class="lang-chip" id="lang" aria-label="Change language">${flag(state.lang)}<span>${L().native}</span><i>▾</i></button>
    <div class="stat" title="Day streak"><span class="flame">🔥</span><b>${state.streak}</b></div>
    <div class="stat" title="Coins">🪙 <b>${state.coins}</b></div>
  </header>
  <main class="page">
    <section class="hello-card">
      <div>
        <p class="eyebrow">Level ${levelFromXp(p.xp)} · ${p.xp} XP</p>
        <h2>Hey ${esc(state.name)}!</h2>
        <p class="small">${goalPct >= 1 ? "🎉 Daily goal smashed. Keep going!" : `${Math.max(0, state.dailyGoal - state.todayXp)} XP to today's goal`}</p>
      </div>
      <div class="goal-ring">${ring(goalPct, 70, 8)}<span>${Math.min(100, Math.round(goalPct * 100))}%</span></div>
    </section>

    ${
      cont
        ? `<button class="continue" data-go="scene" data-arg="${cont.id}" style="--c:${cont.color}">
        <div class="continue-art">${backdrop(cont.id)}<div class="continue-char">${character(cont.id, { id: "cont" })}</div></div>
        <div class="continue-body">
          <p class="eyebrow">${p.completed[cont.id] ? "Practise again" : "Up next"} · ${cont.level}</p>
          <h3>${cont.emoji} ${esc(cont.name)}</h3>
          <p class="small">${esc(cont.goal)}</p>
          <span class="btn primary">Talk to ${esc(cont.npc.name)} →</span>
        </div>
      </button>`
        : ""
    }

    <h3 class="section-title">Your city</h3>
    <div class="map" role="list">
      <svg class="map-ground" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path class="river" d="M78 -5 C 96 8, 86 20, 105 30 L105 -5 Z"/>
        <rect class="park" x="38" y="1" width="24" height="7" rx="3"/>
        <path class="road" d="M0 38.5 H100 M0 71.5 H100 M33.5 0 V100 M66.5 0 V100"/>
        <path class="dash" d="M0 38.5 H100 M0 71.5 H100 M33.5 0 V100 M66.5 0 V100"/>
      </svg>
      ${[[4, 4], [28, 4], [40, 5], [60, 5], [4, 33], [96, 64], [4, 66], [28, 97], [72, 97], [96, 97]].map(([x, y]) => `<span class="tree" style="left:${x}%;top:${y}%"></span>`).join("")}
      <span class="car car1"></span><span class="car car2"></span>
      ${list
        .map((s) => {
          const locked = s.unlock > p.xp;
          const done = p.completed[s.id];
          return `
        <button class="place ${locked ? "locked" : ""} ${cont?.id === s.id ? "next" : ""}" role="listitem" style="left:${s.pos.x}%;top:${s.pos.y}%;--c:${s.color}"
          ${locked ? `data-locked="${s.unlock}"` : `data-go="scene" data-arg="${s.id}"`} aria-label="${esc(s.name)}${locked ? ", locked" : ""}">
          ${cont?.id === s.id ? `<span class="you">${character(s.id, { id: "pin" + s.id })}</span>` : ""}
          ${building(s.id, s.color, locked)}
          <span class="label">${locked ? "🔒 " : s.emoji + " "}${esc(s.name)}</span>
          ${done ? `<span class="stars">${"★".repeat(done.stars)}<i>${"★".repeat(3 - done.stars)}</i></span>` : ""}
        </button>`;
        })
        .join("")}
    </div>
    ${next ? `<p class="small center">Next unlock: ${next.emoji} <b>${esc(next.name)}</b> at ${next.unlock} XP</p>` : `<p class="small center">🏆 You've unlocked the whole city!</p>`}

    <h3 class="section-title">All places</h3>
    <div class="place-cards">
      ${list
        .map((s) => {
          const locked = s.unlock > p.xp;
          const done = p.completed[s.id];
          return `
        <button class="pcard ${locked ? "locked" : ""}" style="--c:${s.color}" ${locked ? `data-locked="${s.unlock}"` : `data-go="scene" data-arg="${s.id}"`}>
          <div class="pcard-art">${backdrop(s.id)}<div class="pcard-char">${character(s.id, { id: "pc" + s.id })}</div>${locked ? `<div class="lock">🔒<small>${s.unlock} XP</small></div>` : ""}</div>
          <div class="pcard-body"><b>${esc(s.name)}</b><small>${esc(s.npc.name)} · ${esc(s.npc.role)}</small>
          <span class="pcard-meta"><em class="lvl lvl-${s.level}">${s.level}</em>${done ? `<span class="stars">${"★".repeat(done.stars)}<i>${"★".repeat(3 - done.stars)}</i></span>` : ""}</span></div>
        </button>`;
        })
        .join("")}
    </div>
  </main>
  ${nav("city")}`;
  $("#lang").onclick = () => langSheet(() => go("city"));
  app.querySelectorAll("[data-locked]").forEach(
    (b) => (b.onclick = () => toast(`🔒 Earn ${b.dataset.locked - p.xp} more XP to unlock`))
  );
}

// ---------- conversation ----------

const RETRY = {
  en: [["Sorry, I didn't quite catch that. Could you say it another way?", ""], ["Hmm, try one of the ideas below!", ""]],
  es: [["Perdona, no te he entendido bien. ¿Puedes decirlo de otra forma?", "Sorry, I didn't quite get that. Can you say it another way?"], ["Mmm, prueba una de las ideas de abajo.", "Hmm, try one of the ideas below."]],
  fr: [["Pardon, je n'ai pas bien compris. Vous pouvez le dire autrement ?", "Sorry, I didn't quite understand. Can you say it another way?"], ["Hmm, essayez une des idées ci-dessous !", "Hmm, try one of the ideas below!"]],
};

function shortestPath(s) {
  const seen = new Set([s.start]);
  let frontier = [s.start];
  for (let d = 0; d < 20; d++) {
    const nxt = [];
    for (const id of frontier) {
      const n = s.nodes[id];
      if (n.end) return d;
      for (const t of [...(n.replies || []).map((r) => r.next), n.any].filter(Boolean))
        if (!seen.has(t)) seen.add(t), nxt.push(t);
    }
    frontier = nxt;
  }
  return 6;
}

function scene(id) {
  const s = scenes().find((x) => x.id === id);
  if (!s) return go("city");
  const lang = state.lang;
  const isEn = lang === "en";
  const steps = shortestPath(s);
  let nodeId = s.start;
  let earned = 0, turns = 0, hintsUsed = 0, misses = 0;
  const accuracies = [];
  let listening = null;
  let alive = true;
  cleanup = () => {
    alive = false;
    listening?.stop();
  };

  app.innerHTML = `
  <div class="convo" style="--c:${s.color}">
    <header class="scenebar">
      <button class="icon-btn" data-go="city" aria-label="Back to city">✕</button>
      <div class="progress"><i id="prog" style="width:0%"></i></div>
      <div class="xp-chip">⚡<b id="earned">0</b></div>
    </header>
    <section class="stage" id="stage">
      <div class="stage-bg">${backdrop(s.id)}</div>
      <div class="stage-char" id="char">${character(s.id, { id: "stage" })}</div>
      <div class="nameplate"><b>${esc(s.npc.name)}</b><small>${esc(s.npc.role)} · ${esc(s.name)}</small></div>
      <button class="mission-chip" id="mission" aria-label="Show mission">🎯 Mission</button>
    </section>
    <main class="chat" id="chat" aria-live="polite">
      <div class="mission-card">🎯 <b>Your mission:</b> ${esc(s.goal)}</div>
    </main>
    <footer class="composer" id="composer">
      <div class="hints" id="hints"></div>
      <div class="live" id="live"></div>
      <div class="controls">
        <form id="typeform" class="typeform">
          <input id="typed" placeholder="${canListen ? "Type instead…" : "Type your reply…"}" autocomplete="off" enterkeyhint="send" lang="${lang}" />
          <button class="send" aria-label="Send">➤</button>
        </form>
        ${canListen ? `<button id="mic" class="mic" aria-label="Tap to speak"><svg viewBox="0 0 24 24" width="28" height="28"><path d="M12 2a3 3 0 013 3v6a3 3 0 01-6 0V5a3 3 0 013-3zM5 11a7 7 0 0014 0M12 18v4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>` : ""}
      </div>
    </footer>
  </div>`;

  const chat = $("#chat");
  const stage = $("#stage");
  const hintsEl = $("#hints");
  const live = $("#live");
  const mic = $("#mic");
  const npcVoice = { seed: s.npc.name, pitch: s.npc.pitch, rate: s.npc.rate };

  $("#mission").onclick = () => toast("🎯 " + s.goal);

  function react(emoji, mood) {
    const r = document.createElement("div");
    r.className = "reaction";
    r.textContent = emoji;
    stage.append(r);
    setTimeout(() => r.remove(), 1300);
    if (mood) {
      stage.classList.remove("happy", "confused");
      void stage.offsetWidth;
      stage.classList.add(mood);
    }
  }

  async function talk(text, opts) {
    stage.classList.add("talking");
    if (state.speed > 0) await say(text, { ...npcVoice, ...opts });
    else await wait(600 + text.length * 25);
    stage.classList.remove("talking");
  }

  function bubble(who, html) {
    const div = document.createElement("div");
    div.className = `msg ${who}`;
    div.innerHTML = html;
    chat.append(div);
    scrollChat();
    return div;
  }

  function scrollChat() {
    requestAnimationFrame(() => chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" }));
  }

  async function npcSay(text, en, tip) {
    const typing = bubble("npc typing", `<div class="dots"><i></i><i></i><i></i></div>`);
    await wait(500);
    typing.remove();
    if (!alive) return;
    const line = fill(text);
    const b = bubble(
      "npc",
      `<div class="bub">
        <p lang="${lang}">${esc(line)}</p>
        ${!isEn && en ? `<p class="tr ${state.showTr ? "show" : ""}">${esc(fill(en))}</p>` : ""}
        <div class="msg-tools">
          <button class="chip" data-act="replay" aria-label="Replay">🔊</button>
          <button class="chip" data-act="slow" aria-label="Slow">🐢</button>
          ${!isEn && en ? `<button class="chip" data-act="tr">🌐 Translate</button>` : ""}
        </div>
        ${tip ? `<p class="tip">💡 ${esc(tip)}</p>` : ""}
      </div>`
    );
    b.querySelector('[data-act="replay"]').onclick = () => talk(line);
    b.querySelector('[data-act="slow"]').onclick = () => talk(line, { speed: 0.65 });
    b.querySelector('[data-act="tr"]')?.addEventListener("click", () => b.querySelector(".tr").classList.toggle("show"));
    await talk(line);
  }

  function renderHints(node, reveal = false) {
    if (!reveal) {
      hintsEl.innerHTML = `<button class="ideas-btn" id="reveal">💡 Need ideas? <span>Show ${node.replies.length}</span></button>`;
      $("#reveal").onclick = () => {
        hintsUsed++;
        renderHints(node, true);
      };
      return;
    }
    hintsEl.innerHTML =
      `<p class="hint-label">${reveal ? "You could say…" : "Need ideas?"}</p>` +
      node.replies
        .map(
          (r, i) => `
        <div class="hint ${reveal ? "" : "blur"}" data-i="${i}" role="button" tabindex="0">
          <span><b lang="${lang}">${esc(fill(r.say))}</b>${!isEn && r.en ? `<small>${esc(fill(r.en))}</small>` : ""}</span>
          <button class="chip" data-act="hear" aria-label="Hear it">🔊</button>
          <button class="chip" data-act="star" aria-label="Save phrase">☆</button>
        </div>`
        )
        .join("") +
      (reveal ? "" : `<button class="chip reveal" id="reveal">💡 Show ideas</button>`);
    $("#reveal")?.addEventListener("click", () => {
      hintsUsed++;
      renderHints(node, true);
    });
    hintsEl.querySelectorAll(".hint").forEach((h) => {
      const r = node.replies[h.dataset.i];
      h.querySelector('[data-act="hear"]').onclick = (e) => {
        e.stopPropagation();
        say(fill(r.say));
      };
      h.querySelector('[data-act="star"]').onclick = (e) => {
        e.stopPropagation();
        savePhrase(r.say, r.en, s.name);
      };
      h.onclick = () => {
        if (h.classList.contains("blur")) {
          hintsUsed++;
          return renderHints(node, true);
        }
        $("#typed").value = fill(r.say);
        $("#typed").focus();
      };
    });
  }

  async function showNode() {
    const node = s.nodes[nodeId];
    hintsEl.innerHTML = "";
    await npcSay(node.npc, node.en, node.tip);
    if (!alive) return;
    if (node.end) return finish();
    misses = 0;
    renderHints(node, prog().xp < 60 && turns === 0);
    if (canListen && state.autoListen) startListening();
  }

  async function handle(text, confidence) {
    if (!text.trim()) return;
    const node = s.nodes[nodeId];
    if (node.end) return;
    const hit = bestReply(text, node.replies, state.name);
    const me = bubble("me", `<p lang="${lang}">${esc(text)}</p>`);

    let nextId = null;
    let xp = 0;
    if (hit) {
      const p = pronunciation(fill(hit.reply.say), text);
      if (p.accuracy >= 70) {
        accuracies.push(p.accuracy);
        me.insertAdjacentHTML(
          "beforeend",
          `<div class="score ${p.accuracy >= 85 ? "great" : "ok"}">
            <b>${p.accuracy}%</b> ${p.parts.map((x) => `<span class="${x.ok ? "" : "miss"}">${esc(x.word)}</span>`).join(" ")}
          </div>`
        );
      } else {
        me.insertAdjacentHTML("beforeend", `<div class="score great">✓ Said it your own way! <b>+5</b></div>`);
        xp += 5;
      }
      xp += hit.reply.xp || 10;
      nextId = hit.reply.next;
    } else if (node.any && text.trim().split(/\s+/).length >= 3) {
      me.insertAdjacentHTML("beforeend", `<div class="score great">✓ Great answer! <b>+15</b></div>`);
      xp += 15;
      nextId = node.any;
    }

    scrollChat();
    if (nextId) {
      if (confidence && confidence > 0.85) xp += 2;
      earned += xp;
      turns++;
      addXp(xp);
      $("#earned").textContent = earned;
      $("#prog").style.width = Math.min(100, (turns / steps) * 100) + "%";
      floatXp(me, xp);
      react(["👍", "😄", "👌", "✨"][turns % 4], "happy");
      nodeId = nextId;
      await wait(500);
      if (alive) showNode();
    } else {
      misses++;
      react("🤔", "confused");
      const [line, en] = RETRY[lang][Math.min(misses, 2) - 1];
      await npcSay(line, en);
      if (misses >= 2) renderHints(node, true);
      if (alive && canListen && state.autoListen) startListening();
    }
  }

  function floatXp(el, xp) {
    const f = document.createElement("span");
    f.className = "float-xp";
    f.textContent = `+${xp} XP`;
    el.append(f);
    setTimeout(() => f.remove(), 1200);
  }

  function startListening() {
    if (!mic || listening) return;
    stopSpeaking();
    mic.classList.add("on");
    live.innerHTML = `<span class="wave"><i></i><i></i><i></i><i></i><i></i></span> Listening in ${L().native}…`;
    listening = listen({ lang: L().speech, onInterim: (t) => t && (live.textContent = t) });
    listening.promise
      .then(({ text, confidence }) => {
        live.textContent = "";
        if (alive && text) handle(text, confidence);
      })
      .catch((err) => {
        live.textContent = "";
        if (err.message === "not-allowed" || err.message === "service-not-allowed") {
          state.autoListen = false;
          save();
          toast("Microphone blocked. You can type instead.");
        }
      })
      .finally(() => {
        listening = null;
        mic?.classList.remove("on");
      });
  }

  mic?.addEventListener("click", () => (listening ? listening.stop() : startListening()));

  $("#typeform").onsubmit = (e) => {
    e.preventDefault();
    const v = $("#typed").value;
    $("#typed").value = "";
    listening?.stop();
    handle(v);
  };

  function finish() {
    const avg = accuracies.length ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 100;
    let stars = 1;
    if (hintsUsed <= 2 && avg >= 60) stars = 2;
    if (hintsUsed === 0 && avg >= 80) stars = 3;
    const p = prog();
    const before = p.xp - earned;
    const prev = p.completed[s.id];
    const bonus = prev ? 10 : 30;
    addXp(bonus);
    p.completed[s.id] = { stars: Math.max(stars, prev?.stars || 0), runs: (prev?.runs || 0) + 1 };
    save();
    const unlocked = scenes().filter((x) => x.unlock > before && x.unlock <= p.xp);
    $("#prog").style.width = "100%";
    stage.classList.add("happy", "done");

    $("#composer").innerHTML = `
      <div class="result">
        <div class="big-stars">${[0, 1, 2].map((i) => `<span class="${i < stars ? "on" : ""}" style="animation-delay:${0.2 + i * 0.2}s">★</span>`).join("")}</div>
        <h3>${["Nice work!", "Great job!", "Perfect!"][stars - 1]}</h3>
        <div class="result-grid">
          <div><b>+${earned + bonus}</b><small>XP</small></div>
          <div><b>${avg}%</b><small>accuracy</small></div>
          <div><b>${hintsUsed}</b><small>hints</small></div>
        </div>
        ${unlocked.length ? `<p class="unlock">🔓 Unlocked: <b>${unlocked.map((u) => u.emoji + " " + esc(u.name)).join(", ")}</b></p>` : ""}
        <div class="vocab"><b>Key phrases. Tap to save.</b>${s.vocab.map((v) => `<button class="chip" data-v="${esc(v)}">☆ ${esc(v)}</button>`).join("")}</div>
        <div class="result-actions">
          <button class="btn" data-go="scene" data-arg="${s.id}">↻ Again</button>
          <button class="btn primary" data-go="city">Continue</button>
        </div>
      </div>`;
    $("#composer").querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => savePhrase(b.dataset.v, "", s.name)));
    confetti();
  }

  showNode();
}

// ---------- phrasebook ----------

function phrasebook() {
  const mine = state.phrases.filter((p) => (p.lang || "en") === state.lang);
  app.innerHTML = `
  <header class="topbar plain"><h2>Phrasebook</h2><button class="lang-chip" id="lang">${flag(state.lang)}<span>${L().native}</span><i>▾</i></button></header>
  <main class="page">
    ${
      mine.length
        ? `<p class="small">${mine.length} saved. Practise them in <b>Drill</b>.</p>
           <div class="list">${mine
             .map(
               (p) => `
             <div class="row">
               <span class="row-main"><b lang="${state.lang}">${esc(p.text)}</b>${p.en ? `<small>${esc(p.en)}</small>` : ""}<small>${esc(p.source || "")}${p.best ? ` · best ${p.best}%` : ""}</small></span>
               <button class="chip" data-hear="${state.phrases.indexOf(p)}" aria-label="Hear">🔊</button>
               <button class="chip" data-del="${state.phrases.indexOf(p)}" aria-label="Delete">🗑️</button>
             </div>`
             )
             .join("")}</div>`
        : `<div class="empty card"><div class="empty-art">${character("restaurant", { id: "empty" })}</div><h3>No phrases yet</h3><p class="small">Tap ☆ next to any phrase in a conversation and it lands here.</p><button class="btn primary" data-go="city">Find a conversation</button></div>`
    }
  </main>
  ${nav("phrasebook")}`;
  $("#lang").onclick = () => langSheet(() => go("phrasebook"));
  app.querySelectorAll("[data-hear]").forEach((b) => (b.onclick = () => say(state.phrases[b.dataset.hear].text)));
  app.querySelectorAll("[data-del]").forEach(
    (b) =>
      (b.onclick = () => {
        state.phrases.splice(+b.dataset.del, 1);
        save();
        phrasebook();
      })
  );
}

// ---------- pronunciation drill ----------

function drill() {
  const saved = state.phrases.filter((p) => (p.lang || "en") === state.lang).map((p) => ({ text: p.text, en: p.en }));
  const pool = saved.length >= 3
    ? saved
    : scenes()
        .filter((s) => s.unlock <= prog().xp)
        .flatMap((s) => Object.values(s.nodes).flatMap((n) => (n.replies || []).map((r) => ({ text: fill(r.say), en: r.en ? fill(r.en) : "" }))));
  const seen = new Set();
  const deck = pool.filter((p) => !seen.has(p.text) && seen.add(p.text)).sort(() => Math.random() - 0.5).slice(0, 5);
  let i = 0, total = 0, listening = null;
  cleanup = () => listening?.stop();

  function card() {
    const page = app.querySelector(".page");
    if (i >= deck.length) {
      const avg = Math.round(total / deck.length);
      const xp = avg >= 80 ? 25 : 15;
      addXp(xp);
      page.innerHTML = `
        <div class="result card">
          <div class="empty-art">${character(avg >= 80 ? "party" : "office", { id: "dr" })}</div>
          <h3>${avg >= 80 ? "Superstar!" : "Nice effort!"} ${avg}% average</h3>
          <p class="small">+${xp} XP</p>
          <div class="result-actions"><button class="btn" data-go="drill">Another round</button><button class="btn primary" data-go="city">City</button></div>
        </div>`;
      confetti();
      return;
    }
    const { text: phrase, en } = deck[i];
    page.innerHTML = `
      <div class="drill-top"><div class="progress"><i style="width:${(i / deck.length) * 100}%"></i></div><span>${i + 1}/${deck.length}</span></div>
      <div class="drill-card card">
        <p class="eyebrow">Say this out loud</p>
        <p class="drill-phrase" id="phrase" lang="${state.lang}">${esc(phrase)}</p>
        ${en && state.lang !== "en" ? `<p class="small">${esc(en)}</p>` : ""}
        <div class="drill-tools">
          <button class="btn" id="hear">🔊 Listen</button>
          <button class="btn" id="slow">🐢 Slow</button>
        </div>
        <p class="live" id="live"></p>
        ${canListen ? `<button class="mic big" id="mic" aria-label="Tap to speak"><svg viewBox="0 0 24 24" width="36" height="36"><path d="M12 2a3 3 0 013 3v6a3 3 0 01-6 0V5a3 3 0 013-3zM5 11a7 7 0 0014 0M12 18v4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>` : ""}
        <form id="tf" class="typeform"><input id="typed" placeholder="${canListen ? "No mic? Type it instead" : "Type the phrase"}" lang="${state.lang}"/><button class="send">✓</button></form>
        <button class="link" id="skip">Skip</button>
      </div>`;
    $("#hear").onclick = () => say(phrase);
    $("#slow").onclick = () => say(phrase, { speed: 0.6 });
    $("#skip").onclick = () => (i++, card());
    let graded = false;
    const grade = (heard) => {
      if (graded) return;
      graded = true;
      const p = pronunciation(phrase, heard);
      total += p.accuracy;
      const saved = state.phrases.find((x) => x.text === phrase && (x.lang || "en") === state.lang);
      if (saved) saved.best = Math.max(saved.best || 0, p.accuracy);
      save();
      $("#phrase").innerHTML = p.parts.map((x) => `<span class="${x.ok ? "hit" : "miss"}">${esc(x.word)}</span>`).join(" ");
      $("#live").innerHTML = `<b class="${p.accuracy >= 85 ? "good" : "bad"}">${p.accuracy}%</b> ${p.accuracy >= 85 ? "Excellent!" : p.accuracy >= 60 ? "Nearly there." : "Listen and try the next one."}`;
      setTimeout(() => (i++, card()), 1800);
    };
    if (canListen) {
      $("#mic").onclick = () => {
        if (listening) return listening.stop();
        $("#mic").classList.add("on");
        listening = listen({ lang: L().speech, onInterim: (t) => ($("#live").textContent = t) });
        listening.promise
          .then(({ text }) => text && grade(text))
          .catch(() => toast("Couldn't hear you. Check your microphone."))
          .finally(() => {
            listening = null;
            $("#mic")?.classList.remove("on");
          });
      };
    }
    $("#tf").onsubmit = (e) => {
      e.preventDefault();
      grade($("#typed").value);
    };
  }

  app.innerHTML = `
  <header class="topbar plain"><h2>Speaking drill</h2><button class="lang-chip" id="lang">${flag(state.lang)}<span>${L().native}</span><i>▾</i></button></header>
  <main class="page"></main>
  ${nav("drill")}`;
  $("#lang").onclick = () => langSheet(() => go("drill"));
  card();
}

// ---------- profile ----------

function profile() {
  const p = prog();
  const allDone = Object.values(state.progress).reduce((a, x) => a + Object.keys(x.completed).length, 0);
  const stars = Object.values(state.progress).reduce((a, x) => a + Object.values(x.completed).reduce((b, c) => b + c.stars, 0), 0);
  const langsStarted = Object.values(state.progress).filter((x) => x.xp > 0).length;
  const voices = voicesFor(L().speech);
  const badges = [
    ["🗣️", "First words", allDone >= 1],
    ["🔥", "3-day streak", state.streak >= 3],
    ["⭐", "10 stars", stars >= 10],
    ["📒", "10 phrases", state.phrases.length >= 10],
    ["🗺️", "5 places", allDone >= 5],
    ["🌍", "Polyglot", langsStarted >= 2],
    ["💯", "Daily goal", state.todayXp >= state.dailyGoal],
    ["🏆", "City legend", Object.keys(p.completed).length >= scenes().length],
    ["👑", "All 3 languages", langsStarted >= 3],
  ];
  app.innerHTML = `
  <header class="topbar plain"><h2>Profile</h2></header>
  <main class="page">
    <section class="profile-head card">
      <div class="avatar-big">${esc(state.name[0] || "?").toUpperCase()}</div>
      <div><h2>${esc(state.name)}</h2><p class="small">Level ${levelFromXp(totalXp())} · ${totalXp()} XP total</p></div>
    </section>
    <div class="result-grid card">
      <div><b>🔥 ${state.streak}</b><small>streak</small></div>
      <div><b>🪙 ${state.coins}</b><small>coins</small></div>
      <div><b>⭐ ${stars}</b><small>stars</small></div>
    </div>
    <h3 class="section-title">Languages</h3>
    <div class="list">
      ${Object.values(LANGS)
        .map((l) => {
          const x = state.progress[l.id] || { xp: 0, completed: {} };
          const n = Object.keys(x.completed).length;
          return `<button class="row lang-row ${l.id === state.lang ? "on" : ""}" data-lang="${l.id}">
            ${flag(l.id)}<span class="row-main"><b>${l.native}</b><small>${n}/9 places · ${x.xp} XP</small><span class="bar"><i style="width:${(n / 9) * 100}%"></i></span></span>
            ${l.id === state.lang ? `<em class="lvl">Active</em>` : ""}</button>`;
        })
        .join("")}
    </div>
    <h3 class="section-title">Badges</h3>
    <div class="badges">${badges.map(([i, l, ok]) => `<div class="badge ${ok ? "" : "off"}"><span>${i}</span><small>${l}</small></div>`).join("")}</div>
    <h3 class="section-title">Settings</h3>
    <div class="card settings">
      <label>Daily goal
        <select id="goal">${[30, 50, 100, 200].map((g) => `<option ${g === state.dailyGoal ? "selected" : ""} value="${g}">${g} XP a day</option>`).join("")}</select>
      </label>
      <label>Voice speed
        <select id="speed">${[[0.75, "Slow"], [1, "Normal"], [1.2, "Fast"], [0, "Muted (read only)"]]
          .map(([v, l]) => `<option ${v === state.speed ? "selected" : ""} value="${v}">${l}</option>`)
          .join("")}</select>
      </label>
      ${
        voices.length
          ? `<label>${L().native} voice
          <select id="voice"><option value="">A different voice for each character</option>${voices
            .map((v) => `<option ${v.voiceURI === state.voice[state.lang] ? "selected" : ""} value="${esc(v.voiceURI)}">${esc(v.name)} (${v.lang})</option>`)
            .join("")}</select></label>`
          : state.lang !== "en" ? `<p class="small">No ${L().name} voice is installed on this device, so lines may be read with an accent. Add one in your system's language settings.</p>` : ""
      }
      ${canListen ? `<label class="check"><input type="checkbox" id="auto" ${state.autoListen ? "checked" : ""}/> Listen automatically after each line</label>` : ""}
      <label class="check"><input type="checkbox" id="tr" ${state.showTr ? "checked" : ""}/> Always show English translations</label>
      <button class="btn danger" id="reset">Reset all progress</button>
    </div>
    <p class="small center">TalkTown is free. Everything stays on this device.${canSpeak ? "" : "<br/>Text-to-speech isn't available in this browser."}</p>
  </main>
  ${nav("profile")}`;
  app.querySelectorAll("[data-lang]").forEach(
    (b) =>
      (b.onclick = () => {
        state.lang = b.dataset.lang;
        prog();
        save();
        profile();
      })
  );
  $("#goal").onchange = (e) => ((state.dailyGoal = +e.target.value), save());
  $("#speed").onchange = (e) => ((state.speed = +e.target.value), save());
  $("#voice")?.addEventListener("change", (e) => ((state.voice[state.lang] = e.target.value), save()));
  $("#auto")?.addEventListener("change", (e) => ((state.autoListen = e.target.checked), save()));
  $("#tr").onchange = (e) => ((state.showTr = e.target.checked), save());
  $("#reset").onclick = () => {
    if (confirm("Delete all your progress in every language? This can't be undone.")) {
      state = defaults();
      save();
      go("welcome");
    }
  };
}

// ---------- confetti ----------

function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#f59e0b", "#22c55e", "#3b82f6", "#ec4899", "#8b5cf6", "#facc15"];
  for (let i = 0; i < 50; i++) {
    const c = document.createElement("i");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = Math.random() * 0.5 + "s";
    c.style.animationDuration = 1.4 + Math.random() + "s";
    document.body.append(c);
    setTimeout(() => c.remove(), 3000);
  }
}

// ---------- boot ----------

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
go(state.name ? "city" : "welcome");
