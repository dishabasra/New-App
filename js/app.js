import { getScenes, LANGS, DISTRICTS, VIDEOS } from "./content.js";
import { bestReply, pronunciation, normalize } from "./match.js";
import { speak, stopSpeaking, listen, canListen, canSpeak, voicesFor } from "./speech.js";
import { flag } from "./art.js";

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
  hideTr: false,
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
const pic = (id, thumb) => `img/${id}${thumb ? "-thumb" : ""}.webp`;
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
      <img class="hero-img" src="${pic("welcome")}" alt="Three friendly characters on a sunny city street" />
      <div class="hero-title">
        <p class="brand">TalkTown</p>
        <h1>Talk your way<br/>through <span>the city.</span></h1>
      </div>
      <div class="hero-bubble b1">¡Hola! <small>Hi!</small></div>
      <div class="hero-bubble b2">Bonjour ! <small>Hello!</small></div>
      <div class="hero-bubble b3" id="heroHello">${esc(LANGS[lang].hello)}</div>
    </div>
    <div class="welcome-body">
      <p class="lead">Order coffee, haggle at the market, ace a job interview. Real conversations, out loud, with characters who answer back.</p>
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
      const b = $("#heroHello");
      b.textContent = LANGS[lang].hello;
      b.classList.remove("pop");
      void b.offsetWidth;
      b.classList.add("pop");
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
  const T = L();
  const goalPct = state.todayXp / state.dailyGoal;
  const cont = list.find((s) => s.unlock <= p.xp && !p.completed[s.id]) || list.filter((s) => s.unlock <= p.xp).pop();
  const district = [...DISTRICTS].reverse().find((d) => p.xp >= d.xp);
  const nextD = DISTRICTS.find((d) => d.xp > p.xp);
  const prevXp = district.xp;
  const dPct = nextD ? (p.xp - prevXp) / (nextD.xp - prevXp) : 1;
  const stamps = list.filter((s) => p.completed[s.id]).length;
  app.innerHTML = `
  <header class="topbar">
    <button class="lang-chip" id="lang" aria-label="Change language">${flag(state.lang)}<span>${T.native}</span><i>▾</i></button>
    <div class="stat" title="Day streak"><span class="flame">🔥</span><b>${state.streak}</b><small>${state.streak === 1 ? "day" : "days"}</small></div>
    <div class="stat" title="Coins">🪙 <b>${state.coins}</b></div>
  </header>
  <main class="page">
    <section class="citymap" style="--map:url(${pic("city-" + state.lang)})">
      <img class="map-img" src="${pic("city-" + state.lang)}" alt="Illustrated map of ${esc(T.city)}" />
      <div class="map-top">
        <div><p class="eyebrow">Your city</p><h2>${esc(T.city)}</h2></div>
        <div class="lvl-badge"><small>LVL</small><b>${levelFromXp(p.xp)}</b></div>
      </div>
      ${list
        .map((s) => {
          const locked = s.unlock > p.xp;
          const done = p.completed[s.id];
          return `<button class="pin ${locked ? "locked" : ""} ${done ? "done" : ""} ${cont?.id === s.id ? "next" : ""}" style="left:${s.pos.x}%;top:${s.pos.y}%;--c:${s.color}"
            ${locked ? `data-locked="${s.unlock}"` : `data-go="scene" data-arg="${s.id}"`} aria-label="${esc(s.name)}${locked ? ", locked" : done ? ", completed" : ""}">
            <span class="pin-face">${locked ? `<i>🔒</i>` : `<img src="${pic(s.id, true)}" alt="" />`}${done ? `<em>✓</em>` : ""}</span>
            <span class="pin-label">${s.emoji} ${esc(s.name)}</span>
          </button>`;
        })
        .join("")}
      <div class="map-bottom">
        <div class="row-between"><span>${nextD ? `Next district: <b>${nextD.name}</b>` : `<b>All districts open</b>`}</span><span>${nextD ? `${p.xp}/${nextD.xp} XP` : "🏆"}</span></div>
        <div class="progress slim"><i style="width:${Math.min(100, dPct * 100)}%"></i></div>
      </div>
    </section>

    <section class="hello-card">
      <div>
        <p class="eyebrow">Hey ${esc(state.name)} 👋</p>
        <h2>${goalPct >= 1 ? "Goal smashed!" : "Today's goal"}</h2>
        <p class="small">${goalPct >= 1 ? "Keep going for bonus coins." : `${Math.max(0, state.dailyGoal - state.todayXp)} XP to go · ${stamps}/9 stamps in ${esc(T.city)}`}</p>
      </div>
      <div class="goal-ring">${ring(goalPct, 70, 8)}<span>${Math.min(100, Math.round(goalPct * 100))}%</span></div>
    </section>

    ${
      cont
        ? `<button class="continue" data-go="scene" data-arg="${cont.id}" style="--c:${cont.color}">
        <div class="continue-art"><img src="${pic(cont.id)}" alt="" /><span class="continue-tag">${cont.emoji} ${esc(cont.npc.name)} is waiting</span></div>
        <div class="continue-body">
          <p class="eyebrow">${p.completed[cont.id] ? "Practise again" : "Up next"} · ${cont.level}</p>
          <h3>${esc(cont.name)}</h3>
          <p class="small">${esc(cont.goal)}</p>
          <span class="btn primary">Start talking →</span>
        </div>
      </button>`
        : ""
    }

    <h3 class="section-title">Passport · ${esc(T.city)}</h3>
    <div class="passport">
      ${list
        .map((s) => {
          const done = p.completed[s.id];
          return `<div class="pstamp ${done ? "got" : ""}" style="--c:${s.color}" title="${esc(s.name)}"><span>${done ? s.emoji : "?"}</span><small>${done ? esc(s.name) : "Locked"}</small></div>`;
        })
        .join("")}
    </div>

    ${DISTRICTS.map((d, i) => {
      const items = list.filter((s) => s.unlock >= d.xp && (i === DISTRICTS.length - 1 || s.unlock < DISTRICTS[i + 1].xp));
      return `<h3 class="section-title">${d.name} ${p.xp < d.xp ? `<span class="lock-note">🔒 ${d.xp} XP</span>` : ""}</h3>
      <div class="place-cards">
        ${items
          .map((s) => {
            const locked = s.unlock > p.xp;
            const done = p.completed[s.id];
            return `
          <button class="pcard ${locked ? "locked" : ""}" style="--c:${s.color}" ${locked ? `data-locked="${s.unlock}"` : `data-go="scene" data-arg="${s.id}"`}>
            <div class="pcard-art"><img src="${pic(s.id, true)}" alt="" loading="lazy" />${locked ? `<div class="lock">🔒<small>${s.unlock} XP</small></div>` : ""}</div>
            <div class="pcard-body"><b>${esc(s.name)}</b><small>${esc(s.npc.name)} · ${esc(s.npc.role)}</small>
            <span class="pcard-meta"><em class="lvl lvl-${s.level}">${s.level}</em>${done ? `<span class="stars">${"★".repeat(done.stars)}<i>${"★".repeat(3 - done.stars)}</i></span>` : ""}</span></div>
          </button>`;
          })
          .join("")}
      </div>`;
    }).join("")}
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

function scene(id) {
  const s = scenes().find((x) => x.id === id);
  if (!s) return go("city");
  const lang = state.lang;
  const isEn = lang === "en";
  const T = L();
  let nodeId = s.start;
  let earned = 0, turns = 0, hintsUsed = 0, misses = 0, totalMisses = 0, hintIdx = -1;
  let keyboard = !canListen;
  const accuracies = [];
  const log = []; // transcript: { who, text, en }
  const wins = [], struggles = [];
  const chosen = new Set(); // replies the learner used
  const ownWords = []; // answers phrased differently from the suggestions
  const visited = new Set([s.start]);
  let listening = null;
  let alive = true;
  let firstFold;
  let currentLine = "";
  cleanup = () => {
    alive = false;
    listening?.stop();
    document.querySelector(".sheet-wrap")?.remove();
  };

  const media = VIDEOS.has(s.id)
    ? `<video src="vid/${s.id}.mp4" poster="${pic(s.id)}" autoplay muted loop playsinline></video>`
    : `<img src="${pic(s.id)}" alt="${esc(s.npc.name)}, ${esc(s.npc.role)}, at ${esc(s.name)}" />`;

  app.innerHTML = `
  <div class="convo" id="stage" style="--c:${s.color}">
    <div class="scene-photo">${media}</div>
    <div class="scene-shade"></div>
    <header class="scenebar">
      <button class="glass-btn" data-go="city" aria-label="Leave conversation">✕</button>
      <button class="mission-pill" id="missionToggle" aria-expanded="true" aria-controls="mission">
        <span>Your mission</span><b id="missionCount">0/${s.objectives.length}</b>
      </button>
      ${isEn ? "" : `<button class="glass-btn ${state.hideTr ? "" : "on"}" id="cc" aria-label="Show translations" aria-pressed="${!state.hideTr}">CC</button>`}
      ${canListen ? `<button class="glass-btn" id="kb" aria-label="Type instead" aria-pressed="false">⌨︎</button>` : ""}
      <button class="glass-btn" id="log" aria-label="Show transcript">☰</button>
    </header>
    <section class="mission" id="mission">
      <p class="mission-place">${s.emoji} ${esc(s.name).toUpperCase()}</p>
      <ul id="objectives"></ul>
      <div class="progress"><i id="prog" style="width:0%"></i></div>
    </section>
    <div class="scene-spacer"></div>
    <div class="nameplate"><span class="np-dot"></span><b>${esc(s.npc.name)}</b><small>${esc(s.npc.role)}</small><span class="bars"><i></i><i></i><i></i><i></i></span></div>
    <section class="caption" id="caption" aria-live="polite">
      <div class="dots"><i></i><i></i><i></i></div>
    </section>
    <section class="turn" id="turn" aria-live="polite"></section>
    <footer class="actions" id="actions">
      <button class="act" id="explain"><span class="act-ico">?</span><small>Explain</small></button>
      ${canListen ? `<button class="mic" id="mic" aria-label="Tap to speak"><svg viewBox="0 0 24 24" width="30" height="30"><path d="M12 2a3 3 0 013 3v6a3 3 0 01-6 0V5a3 3 0 013-3zM5 11a7 7 0 0014 0M12 18v4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>` : `<span class="mic-spacer"></span>`}
      <button class="act" id="hint"><span class="act-ico">💡</span><small>Hint</small></button>
    </footer>
    <div class="xp-float" id="xpTotal">⚡ <b id="earned">0</b> XP</div>
  </div>`;

  const stage = $("#stage");
  const caption = $("#caption");
  const turn = $("#turn");
  const mic = $("#mic");
  const missionEl = $("#mission");
  const npcVoice = { seed: s.npc.name, pitch: s.npc.pitch, rate: s.npc.rate };

  // ----- mission checklist -----
  $("#missionToggle").onclick = () => {
    const open = missionEl.classList.toggle("collapsed") === false;
    $("#missionToggle").setAttribute("aria-expanded", open);
  };
  const doneObjectives = () => s.objectives.filter((o) => o.reach.some((r) => visited.has(r)));
  function renderObjectives(fresh = []) {
    const done = doneObjectives();
    $("#objectives").innerHTML = s.objectives
      .map((o) => `<li class="${done.includes(o) ? "done" : ""} ${fresh.includes(o) ? "just" : ""}"><i></i>${esc(o.label)}</li>`)
      .join("");
    $("#missionCount").textContent = `${done.length}/${s.objectives.length}`;
    $("#prog").style.width = (done.length / s.objectives.length) * 100 + "%";
  }
  renderObjectives();
  firstFold = setTimeout(() => alive && missionEl.classList.add("collapsed"), 4500);
  function reach(id) {
    const before = doneObjectives();
    visited.add(id);
    const fresh = doneObjectives().filter((o) => !before.includes(o));
    renderObjectives(fresh);
    if (fresh.length) {
      clearTimeout(firstFold);
      missionEl.classList.remove("collapsed");
      clearTimeout(reach.t);
      reach.t = setTimeout(() => alive && missionEl.classList.add("collapsed"), 2200);
    }
  }
  const nextObjective = () => s.objectives.find((o) => !o.reach.some((r) => visited.has(r)));

  // ----- header buttons -----
  $("#cc")?.addEventListener("click", (e) => {
    state.hideTr = !state.hideTr;
    save();
    e.currentTarget.classList.toggle("on", !state.hideTr);
    e.currentTarget.setAttribute("aria-pressed", !state.hideTr);
    stage.classList.toggle("no-tr", state.hideTr);
  });
  stage.classList.toggle("no-tr", state.hideTr);
  $("#kb")?.addEventListener("click", (e) => {
    keyboard = !keyboard;
    e.currentTarget.classList.toggle("on", keyboard);
    e.currentTarget.setAttribute("aria-pressed", keyboard);
    listening?.stop();
    renderTurn("idle");
  });
  $("#log").onclick = () =>
    openSheet(
      "Transcript",
      log.length
        ? `<div class="transcript">${log
            .map((l) => `<div class="t-row ${l.who}"><b>${l.who === "me" ? "You" : esc(s.npc.name)}</b><p lang="${lang}">${esc(l.text)}</p>${l.en && !isEn ? `<small>${esc(l.en)}</small>` : ""}</div>`)
            .join("")}</div>`
        : `<p class="small">Nothing said yet.</p>`
    );

  // ----- character reactions -----
  function react(emoji, mood) {
    const r = document.createElement("div");
    r.className = "reaction";
    r.textContent = emoji;
    stage.append(r);
    setTimeout(() => r.remove(), 1300);
    stage.classList.remove("happy", "confused");
    void stage.offsetWidth;
    if (mood) stage.classList.add(mood);
  }

  async function talk(text, opts) {
    stage.classList.add("talking");
    if (state.speed > 0) await say(text, { ...npcVoice, ...opts });
    else await wait(600 + text.length * 25);
    stage.classList.remove("talking");
  }

  // ----- the character's line, shown as a subtitle -----
  async function npcSay(text, en, tip) {
    caption.innerHTML = `<div class="dots"><i></i><i></i><i></i></div>`;
    turn.innerHTML = "";
    await wait(450);
    if (!alive) return;
    const line = fill(text);
    currentLine = line;
    log.push({ who: "npc", text: line, en: en ? fill(en) : "" });
    caption.innerHTML = `
      <p class="line" lang="${lang}">${esc(line)}</p>
      ${!isEn && en ? `<p class="tr">${esc(fill(en))}</p>` : ""}
      <div class="cap-tools">
        <button class="chip" id="replay" aria-label="Hear again">🔊</button>
        <button class="chip" id="slow" aria-label="Hear slowly">🐢</button>
        <button class="chip again" id="again">${esc(T.again)}</button>
      </div>
      ${tip ? `<p class="tip">💡 ${esc(tip)}</p>` : ""}`;
    caption.classList.remove("in");
    void caption.offsetWidth;
    caption.classList.add("in");
    $("#replay").onclick = () => talk(line);
    $("#slow").onclick = () => talk(line, { speed: 0.65 });
    $("#again").onclick = () => askAgain(false);
    await talk(line);
  }

  // The learner asks the character to repeat: costs nothing, and is real practice.
  async function askAgain(spoken) {
    listening?.stop();
    if (!spoken) {
      log.push({ who: "me", text: T.again, en: T.againEn });
      say(T.again, { pitch: 1 });
      await wait(900);
    }
    react("👂");
    await talk(currentLine, { speed: 0.7 });
    if (alive) renderTurn("idle");
  }

  // ----- the learner's turn card -----
  function renderTurn(mode, data = {}) {
    const node = s.nodes[nodeId];
    if (!node || node.end) return;
    const obj = nextObjective();
    if (mode === "idle" && hintIdx >= 0) mode = "hint";
    let html = "";
    if (mode === "idle") {
      html = `<p class="turn-label">Your turn</p>
        <p class="turn-main">${obj ? "🎯 " + esc(obj.label) : "Answer " + esc(s.npc.name)}</p>
        <p class="turn-sub">${keyboard ? "Type your answer below." : `Tap the mic and answer in ${T.native}. Stuck? Tap Hint.`}</p>`;
    } else if (mode === "hint") {
      const r = node.replies[hintIdx % node.replies.length];
      html = `<p class="turn-label">Say this <span>${(hintIdx % node.replies.length) + 1}/${node.replies.length}</span></p>
        <p class="turn-main say" lang="${lang}">${esc(fill(r.say))}</p>
        ${!isEn && r.en ? `<p class="turn-sub tr">${esc(fill(r.en))}</p>` : ""}
        <div class="cap-tools"><button class="chip" id="hearHint">🔊 Hear it</button><button class="chip" id="saveHint">☆ Save</button></div>`;
    } else if (mode === "listening") {
      html = `<p class="turn-label live-label"><span class="wave"><i></i><i></i><i></i><i></i><i></i></span> Listening…</p>
        <p class="turn-main heard" id="heard" lang="${lang}">${esc(data.text || "")}</p>
        <p class="turn-sub">Speak in ${T.native}, then pause.</p>`;
    } else if (mode === "result") {
      html = `<p class="turn-label ok">You said ${data.badge || ""}</p>
        <p class="turn-main heard" lang="${lang}">${data.html}</p>`;
    } else if (mode === "miss") {
      html = `<p class="turn-label bad">Not quite</p>
        <p class="turn-main heard" lang="${lang}">${esc(data.text)}</p>
        <p class="turn-sub">${esc(s.npc.name)} didn't understand. Try saying it another way, or tap Hint.</p>`;
    }
    if (keyboard && mode !== "listening" && mode !== "result") {
      html += `<form class="typeform" id="typeform"><input id="typed" placeholder="Type in ${T.native}…" autocomplete="off" enterkeyhint="send" lang="${lang}" /><button class="send" aria-label="Send">➤</button></form>`;
    }
    turn.innerHTML = html;
    turn.className = "turn t-" + mode;
    $("#hearHint")?.addEventListener("click", () => say(fill(node.replies[hintIdx % node.replies.length].say)));
    $("#saveHint")?.addEventListener("click", () => {
      const r = node.replies[hintIdx % node.replies.length];
      savePhrase(r.say, r.en, s.name);
    });
    const tf = $("#typeform");
    if (tf) {
      tf.onsubmit = (e) => {
        e.preventDefault();
        const v = $("#typed").value;
        if (v.trim()) handle(v);
      };
    }
  }

  // ----- buttons -----
  $("#hint").onclick = () => {
    const node = s.nodes[nodeId];
    if (!node || node.end || !node.replies?.length) return;
    hintIdx++;
    hintsUsed++;
    listening?.stop();
    renderTurn("hint");
    say(fill(node.replies[hintIdx % node.replies.length].say), { speed: 0.9 });
  };

  $("#explain").onclick = () => {
    const node = s.nodes[nodeId];
    const last = [...log].reverse().find((l) => l.who === "npc");
    openSheet(
      "What's going on?",
      `<div class="explain">
        ${last ? `<div class="ex-block"><p class="eyebrow">${esc(s.npc.name)} said</p><p class="ex-line" lang="${lang}">${esc(last.text)}</p>${last.en ? `<p class="small">${esc(last.en)}</p>` : ""}</div>` : ""}
        ${node?.tip ? `<div class="ex-block tip-block">💡 ${esc(node.tip)}</div>` : ""}
        <div class="ex-block"><p class="eyebrow">Your goal</p><p>🎯 ${esc(nextObjective()?.label || s.goal)}</p></div>
        <div class="ex-block"><p class="eyebrow">Handy phrases here</p>${s.vocab.map((v) => `<p class="ex-vocab">${esc(v)}</p>`).join("")}</div>
        <p class="small center">Explain is free. It doesn't count as a hint.</p>
      </div>`
    );
  };

  function startListening() {
    if (!mic || listening || keyboard) return;
    stopSpeaking();
    mic.classList.add("on");
    renderTurn("listening");
    listening = listen({ lang: T.speech, onInterim: (t) => t && $("#heard") && ($("#heard").textContent = t) });
    listening.promise
      .then(({ text, confidence }) => {
        if (!alive) return;
        if (text) handle(text, confidence);
        else renderTurn("idle");
      })
      .catch((err) => {
        if (!alive) return;
        if (err.message === "not-allowed" || err.message === "service-not-allowed") {
          state.autoListen = false;
          keyboard = true;
          save();
          toast("Microphone blocked, so you can type instead.");
        }
        renderTurn("idle");
      })
      .finally(() => {
        listening = null;
        mic?.classList.remove("on");
      });
  }
  mic?.addEventListener("click", () => (listening ? listening.stop() : startListening()));

  // ----- understanding the learner -----
  async function handle(text, confidence) {
    const node = s.nodes[nodeId];
    if (!node || node.end) return;
    const hit = bestReply(text, node.replies, state.name);

    if (!hit && !node.any && T.repeat.some((w) => normalize(text).split(" ").includes(normalize(w)) || normalize(text).includes(normalize(w) + " "))) {
      log.push({ who: "me", text, en: "" });
      return askAgain(true);
    }

    let nextId = null, xp = 0, badge = "", html = esc(text);
    if (hit) {
      chosen.add(hit.reply);
      const target = fill(hit.reply.say);
      const p = pronunciation(target, text);
      if (p.accuracy >= 70) {
        accuracies.push(p.accuracy);
        html = p.parts.map((x) => `<span class="${x.ok ? "hit" : "miss"}">${esc(x.word)}</span>`).join(" ");
        badge = `<b class="pct ${p.accuracy >= 85 ? "great" : "ok"}">${p.accuracy}%</b>`;
        if (p.accuracy >= 90) wins.push(`You said “${target}” clearly (${p.accuracy}%).`);
        else struggles.push({ say: target, why: `${p.accuracy}% match. Listen to it again and repeat.` });
      } else {
        badge = `<b class="pct great">✓ Your own words +5</b>`;
        ownWords.push(text);
        xp += 5;
      }
      xp += hit.reply.xp || 10;
      nextId = hit.reply.next;
    } else if (node.any && text.trim().split(/\s+/).length >= 3) {
      badge = `<b class="pct great">✓ Great answer +15</b>`;
      wins.push(`You gave a full answer of your own.`);
      xp += 15;
      nextId = node.any;
    }
    log.push({ who: "me", text, en: hit?.reply.en ? fill(hit.reply.en) : "" });

    if (nextId) {
      if (confidence && confidence > 0.85) xp += 2;
      if (hintIdx >= 0 && hit) struggles.push({ say: fill(hit.reply.say), why: "You used a hint here. Try it from memory next time." });
      earned += xp;
      turns++;
      hintIdx = -1;
      misses = 0;
      addXp(xp);
      $("#earned").textContent = earned;
      bump();
      renderTurn("result", { html, badge });
      react(["👍", "😄", "👌", "✨"][turns % 4], "happy");
      nodeId = nextId;
      reach(nextId);
      await wait(1100);
      if (alive) showNode();
    } else {
      misses++;
      totalMisses++;
      renderTurn("miss", { text });
      react("🤔", "confused");
      await wait(900);
      const [line, en] = RETRY[lang][Math.min(misses, 2) - 1];
      await npcSay(line, en);
      if (!alive) return;
      if (misses >= 2 && hintIdx < 0) {
        hintIdx = 0;
        hintsUsed++;
      }
      renderTurn("idle");
      if (canListen && state.autoListen && !keyboard) startListening();
    }
  }

  function bump() {
    const x = $("#xpTotal");
    x.classList.remove("bump");
    void x.offsetWidth;
    x.classList.add("bump");
  }

  async function showNode() {
    const node = s.nodes[nodeId];
    await npcSay(node.npc, node.en, node.tip);
    if (!alive) return;
    if (node.end) return finish();
    if (prog().xp < 60 && turns === 0) hintIdx = 0;
    renderTurn("idle");
    if (canListen && state.autoListen && !keyboard) startListening();
  }

  // ----- end of scene report -----
  function finish() {
    const avg = accuracies.length ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : 100;
    let stars = 1;
    if (hintsUsed <= 2 && avg >= 60) stars = 2;
    if (hintsUsed === 0 && avg >= 80) stars = 3;
    const score = Math.max(5, Math.min(20, Math.round((avg / 100) * 20 - hintsUsed * 1.5 - totalMisses)));
    const p = prog();
    const before = p.xp - earned;
    const prev = p.completed[s.id];
    const bonus = prev ? 10 : 30;
    addXp(bonus);
    p.completed[s.id] = { stars: Math.max(stars, prev?.stars || 0), runs: (prev?.runs || 0) + 1, best: Math.max(score, prev?.best || 0), date: today() };
    save();
    const unlocked = scenes().filter((x) => x.unlock > before && x.unlock <= p.xp);
    if (ownWords.length === 1) wins.unshift(`You answered in your own words: “${ownWords[0]}”.`);
    if (ownWords.length > 1) wins.unshift(`You answered in your own words ${ownWords.length} times, like “${ownWords[0]}”.`);
    if (hintsUsed === 0) wins.push("You finished without a single hint.");
    if (totalMisses === 0 && turns > 2) wins.push(`${s.npc.name} understood you every time.`);
    if (!wins.length) wins.push("You made it all the way through the conversation.");
    // Suggest a reply they didn't use, so there's always something new to try.
    const unused = [...visited].flatMap((v) => s.nodes[v].replies || []).filter((r) => !chosen.has(r));
    const alt = unused[Math.floor(Math.random() * unused.length)];
    const next = struggles.slice(0, 2);
    if (alt && next.length < 3) next.push({ say: fill(alt.say), why: "Another way to answer. Try it next time." });

    stage.classList.add("finished");
    missionEl.classList.remove("collapsed");
    $("#caption").innerHTML = "";
    $("#turn").innerHTML = "";
    $("#actions").innerHTML = "";
    const rep = document.createElement("section");
    rep.className = "report";
    rep.innerHTML = `
      <div class="report-card">
        <div class="report-head">
          <div class="score-tile"><b>${score}</b><small>/20</small></div>
          <div>
            <p class="eyebrow">Scene complete</p>
            <h3>${["Nice work!", "Great job!", "Perfect!"][stars - 1]}</h3>
            <div class="mini-stars">${[0, 1, 2].map((i) => `<span class="${i < stars ? "on" : ""}" style="animation-delay:${0.3 + i * 0.15}s">★</span>`).join("")}</div>
          </div>
          <div class="stamp" style="--c:${s.color}"><span>${s.emoji}</span><small>${esc(s.name)}</small><em>${new Date().toLocaleDateString(undefined, { day: "numeric", month: "short" })}</em></div>
        </div>
        <div class="report-stats">
          <div><b>+${earned + bonus}</b><small>XP</small></div>
          <div><b>${avg}%</b><small>clarity</small></div>
          <div><b>${hintsUsed}</b><small>hints</small></div>
        </div>
        <div class="fb good"><p class="fb-title">✅ What went well</p>${wins.slice(0, 3).map((w) => `<p>${esc(w)}</p>`).join("")}</div>
        ${next.length ? `<div class="fb next"><p class="fb-title">🎯 Try next time</p>${next
          .map((n, i) => `<div class="fb-row"><div><p class="fb-say" lang="${lang}">${esc(n.say)}</p><small>${esc(n.why)}</small></div><button class="chip" data-hear="${i}">🔊</button><button class="chip" data-save="${i}">☆</button></div>`)
          .join("")}</div>` : ""}
        ${unlocked.length ? `<p class="unlock">🔓 Unlocked: <b>${unlocked.map((u) => u.emoji + " " + esc(u.name)).join(", ")}</b></p>` : ""}
        <div class="result-actions">
          <button class="btn" data-go="scene" data-arg="${s.id}">↻ Again</button>
          <button class="btn primary" data-go="city">Back to ${esc(T.city)}</button>
        </div>
      </div>`;
    stage.append(rep);
    rep.querySelectorAll("[data-hear]").forEach((b) => (b.onclick = () => say(next[b.dataset.hear].say)));
    rep.querySelectorAll("[data-save]").forEach((b) => (b.onclick = () => savePhrase(next[b.dataset.save].say, "", s.name)));
    confetti();
  }

  showNode();
}

function openSheet(title, html) {
  document.querySelector(".sheet-wrap")?.remove();
  const wrap = document.createElement("div");
  wrap.className = "sheet-wrap";
  wrap.innerHTML = `<div class="sheet" role="dialog" aria-label="${esc(title)}"><div class="grab"></div><div class="sheet-head"><h3>${esc(title)}</h3><button class="icon-btn" aria-label="Close">✕</button></div><div class="sheet-body">${html}</div></div>`;
  document.body.append(wrap);
  requestAnimationFrame(() => wrap.classList.add("open"));
  const close = () => {
    wrap.classList.remove("open");
    setTimeout(() => wrap.remove(), 250);
  };
  wrap.addEventListener("click", (e) => {
    if (e.target === wrap || e.target.closest(".sheet-head .icon-btn")) close();
  });
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
        : `<div class="empty card"><img class="empty-art" src="${pic("restaurant", true)}" alt="" /><h3>No phrases yet</h3><p class="small">Tap ☆ next to any phrase in a conversation and it lands here.</p><button class="btn primary" data-go="city">Find a conversation</button></div>`
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
          <img class="empty-art" src="${pic(avg >= 80 ? "party" : "office", true)}" alt="" />
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
      <label class="check"><input type="checkbox" id="tr" ${state.hideTr ? "" : "checked"}/> Show English translations</label>
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
  $("#tr").onchange = (e) => ((state.hideTr = !e.target.checked), save());
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
