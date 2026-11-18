import { SCENES } from "./scenes.js";
import { bestReply, pronunciation } from "./match.js";
import { speak, stopSpeaking, listen, canListen, canSpeak, englishVoices } from "./speech.js";

// ---------- state ----------

const STORE_KEY = "talktown:v1";
const today = () => new Date().toISOString().slice(0, 10);

const defaults = {
  name: "",
  level: "Beginner",
  xp: 0,
  coins: 0,
  streak: 0,
  lastDay: null,
  dailyGoal: 50,
  todayXp: 0,
  todayDate: today(),
  completed: {}, // sceneId -> { stars, runs }
  phrases: [], // saved phrases
  voiceURI: "",
  speed: 1,
  autoListen: true,
};

function load() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
  } catch {
    return { ...defaults };
  }
}
let state = load();
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {}
}

function rollDay() {
  if (state.todayDate !== today()) {
    state.todayDate = today();
    state.todayXp = 0;
    save();
  }
}

function addXp(n) {
  rollDay();
  state.xp += n;
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
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fill = (s) => s.replaceAll("{name}", state.name || "friend");

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 2400);
}

function levelFromXp(xp) {
  return Math.floor(Math.sqrt(xp / 25)) + 1;
}

function savePhrase(text, source) {
  const t = fill(text);
  if (state.phrases.some((p) => p.text === t)) return toast("Already in your phrasebook");
  state.phrases.unshift({ text: t, source, best: 0, added: Date.now() });
  save();
  toast("⭐ Saved to phrasebook");
}

// ---------- router ----------

let current = null; // cleanup for active view

function go(view, arg) {
  current?.();
  current = null;
  stopSpeaking();
  window.scrollTo(0, 0);
  if (!state.name && view !== "welcome") view = "welcome";
  ({ welcome, city, scene, phrasebook, drill, profile })[view](arg);
}

function nav(active) {
  return `
  <nav class="tabbar">
    ${[
      ["city", "🏙️", "City"],
      ["phrasebook", "📒", "Phrases"],
      ["drill", "🎯", "Drill"],
      ["profile", "👤", "Me"],
    ]
      .map(
        ([v, i, l]) =>
          `<button data-go="${v}" class="${v === active ? "on" : ""}"><span>${i}</span>${l}</button>`
      )
      .join("")}
  </nav>`;
}

app.addEventListener("click", (e) => {
  const b = e.target.closest("[data-go]");
  if (b) go(b.dataset.go, b.dataset.arg);
});

// ---------- welcome ----------

function welcome() {
  app.innerHTML = `
  <section class="welcome">
    <div class="hero-emoji">🏙️</div>
    <h1>TalkTown</h1>
    <p class="lead">Learn English by actually <b>talking</b>. Walk around a city, meet people and practise real conversations out loud.</p>
    <ul class="perks">
      <li>🎙️ Speak out loud and get instant feedback</li>
      <li>🗺️ 9 places, from cafés to job interviews</li>
      <li>🔥 Streaks, XP and a phrasebook</li>
      <li>💸 100% free. No account, no ads.</li>
    </ul>
    <form id="start" class="card">
      <label>What should we call you?
        <input name="name" required maxlength="20" placeholder="Your first name" autocomplete="given-name" />
      </label>
      <label>Your English level
        <div class="seg">
          ${["Beginner", "Intermediate", "Advanced"]
            .map((l, i) => `<label><input type="radio" name="level" value="${l}" ${i === 0 ? "checked" : ""}/><span>${l}</span></label>`)
            .join("")}
        </div>
      </label>
      <button class="btn primary big">Enter the city →</button>
    </form>
    ${canListen ? "" : `<p class="note">Your browser can't do speech recognition, so you'll type instead. For voice, use Chrome, Edge or Safari.</p>`}
  </section>`;
  $("#start").onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    state.name = f.get("name").trim();
    state.level = f.get("level");
    // Skip ahead for experienced learners.
    if (state.level === "Intermediate" && state.xp < 150) state.xp = 150;
    if (state.level === "Advanced" && state.xp < 420) state.xp = 420;
    save();
    go("city");
  };
}

// ---------- city map ----------

function city() {
  rollDay();
  const goalPct = Math.min(100, Math.round((state.todayXp / state.dailyGoal) * 100));
  const lvl = levelFromXp(state.xp);
  const next = SCENES.find((s) => s.unlock > state.xp);
  app.innerHTML = `
  <header class="topbar">
    <div class="stat" title="Day streak">🔥 <b>${state.streak}</b></div>
    <div class="stat" title="Coins">🪙 <b>${state.coins}</b></div>
    <div class="stat" title="Level">⭐ Lv <b>${lvl}</b></div>
    <div class="stat xp" title="Total XP"><b>${state.xp}</b> XP</div>
  </header>
  <main class="page">
    <h2 class="greet">Hey ${esc(state.name)} 👋</h2>
    <div class="goal card">
      <div class="goal-row"><span>Daily goal</span><span>${state.todayXp} / ${state.dailyGoal} XP</span></div>
      <div class="bar"><i style="width:${goalPct}%"></i></div>
      ${goalPct >= 100 ? `<p class="small">🎉 Goal smashed. Keep going for bonus coins!</p>` : ""}
    </div>

    <div class="map" role="list">
      <svg class="roads" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 45 H100 M0 78 H100 M35 0 V100 M65 0 V100" />
      </svg>
      <div class="park" style="left:4%;top:42%"></div>
      <div class="river"></div>
      ${SCENES.map((s) => {
        const locked = s.unlock > state.xp;
        const done = state.completed[s.id];
        return `
        <button class="place ${locked ? "locked" : ""}" role="listitem" style="left:${s.pos.x}%;top:${s.pos.y}%;--c:${s.color}"
          ${locked ? `data-locked="${s.unlock}"` : `data-go="scene" data-arg="${s.id}"`} aria-label="${esc(s.name)}${locked ? ", locked" : ""}">
          <span class="pin">${locked ? "🔒" : s.emoji}</span>
          <span class="label">${esc(s.name)}</span>
          ${done ? `<span class="stars">${"★".repeat(done.stars)}${"☆".repeat(3 - done.stars)}</span>` : ""}
        </button>`;
      }).join("")}
    </div>
    ${next ? `<p class="small center">Next unlock: ${next.emoji} <b>${esc(next.name)}</b> at ${next.unlock} XP</p>` : `<p class="small center">🏆 You've unlocked the whole city!</p>`}

    <h3>Places</h3>
    <div class="list">
      ${SCENES.map((s) => {
        const locked = s.unlock > state.xp;
        const done = state.completed[s.id];
        return `
        <button class="row ${locked ? "locked" : ""}" ${locked ? `data-locked="${s.unlock}"` : `data-go="scene" data-arg="${s.id}"`}>
          <span class="row-icon" style="background:${s.color}22">${locked ? "🔒" : s.emoji}</span>
          <span class="row-main"><b>${esc(s.name)}</b><small>${esc(s.goal)}</small></span>
          <span class="row-side">${done ? "★".repeat(done.stars) : `<em>${s.level}</em>`}</span>
        </button>`;
      }).join("")}
    </div>
  </main>
  ${nav("city")}`;
  app.querySelectorAll("[data-locked]").forEach(
    (b) => (b.onclick = () => toast(`🔒 Earn ${b.dataset.locked - state.xp} more XP to unlock`))
  );
}

// ---------- conversation ----------

function scene(id) {
  const s = SCENES.find((x) => x.id === id);
  if (!s) return go("city");
  let nodeId = s.start;
  let earned = 0;
  let turns = 0;
  let hintsUsed = 0;
  let misses = 0;
  let accuracies = [];
  let listening = null;
  let alive = true;
  current = () => {
    alive = false;
    listening?.stop();
  };

  app.innerHTML = `
  <header class="scenebar" style="--c:${s.color}">
    <button class="icon-btn" data-go="city" aria-label="Back to city">←</button>
    <div class="who"><span class="avatar">${s.npc.avatar}</span><span><b>${esc(s.npc.name)}</b><small>${esc(s.npc.role)} · ${esc(s.name)}</small></span></div>
    <div class="earned">+<b id="earned">0</b> XP</div>
  </header>
  <div class="mission"><b>🎯 Mission:</b> ${esc(s.goal)}</div>
  <main class="chat" id="chat" aria-live="polite"></main>
  <footer class="composer" id="composer">
    <div class="hints" id="hints"></div>
    <div class="live" id="live"></div>
    <div class="controls">
      <form id="typeform" class="typeform">
        <input id="typed" placeholder="${canListen ? "…or type your reply" : "Type your reply"}" autocomplete="off" />
        <button class="btn" aria-label="Send">➤</button>
      </form>
      ${canListen ? `<button id="mic" class="mic" aria-label="Hold to speak">🎙️</button>` : ""}
    </div>
  </footer>`;

  const chat = $("#chat");
  const hintsEl = $("#hints");
  const live = $("#live");
  const mic = $("#mic");

  const voice = () => ({ seed: s.npc.name, pitch: s.npc.pitch, rate: s.npc.rate, voiceURI: state.voiceURI || null, speed: state.speed });

  function bubble(who, html, extra = "") {
    const div = document.createElement("div");
    div.className = `msg ${who} ${extra}`;
    div.innerHTML = html;
    chat.append(div);
    div.scrollIntoView({ behavior: "smooth", block: "end" });
    return div;
  }

  async function npcSay(text, tip) {
    const line = fill(text);
    const b = bubble(
      "npc",
      `<span class="avatar sm">${s.npc.avatar}</span><div><p>${esc(line)}</p>
       <div class="msg-tools"><button class="chip" data-act="replay">🔊 Replay</button><button class="chip" data-act="slow">🐢 Slow</button></div>
       ${tip ? `<p class="tip">💡 ${esc(tip)}</p>` : ""}</div>`
    );
    b.querySelector('[data-act="replay"]').onclick = () => speak(line, voice());
    b.querySelector('[data-act="slow"]').onclick = () => speak(line, { ...voice(), speed: 0.65 });
    if (state.speed > 0) await speak(line, voice());
  }

  function renderHints(node, reveal = false) {
    hintsEl.innerHTML = node.replies
      .map(
        (r, i) => `
        <div class="hint ${reveal ? "" : "blur"}" data-i="${i}">
          <span>${esc(fill(r.say))}</span>
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
        speak(fill(r.say), { speed: state.speed || 1 });
      };
      h.querySelector('[data-act="star"]').onclick = (e) => {
        e.stopPropagation();
        savePhrase(r.say, s.name);
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
    await npcSay(node.npc, node.tip);
    if (!alive) return;
    if (node.end) return finish();
    misses = 0;
    renderHints(node, state.level === "Beginner" && turns === 0);
    if (canListen && state.autoListen) startListening();
  }

  async function handle(text, confidence) {
    if (!text.trim()) return;
    const node = s.nodes[nodeId];
    if (node.end) return;
    const hit = bestReply(text, node.replies, state.name);
    const me = bubble("me", `<p>${esc(text)}</p>`);

    let nextId = null;
    let xp = 0;
    if (hit) {
      const target = fill(hit.reply.say);
      const p = pronunciation(target, text);
      // Accuracy only means something if they were aiming for the suggestion.
      if (p.accuracy >= 70) {
        accuracies.push(p.accuracy);
        me.insertAdjacentHTML(
          "beforeend",
          `<div class="score ${p.accuracy >= 85 ? "great" : p.accuracy >= 60 ? "ok" : "low"}">
            ${p.accuracy}% match · ${p.parts.map((x) => `<span class="${x.ok ? "" : "miss"}">${esc(x.word)}</span>`).join(" ")}
          </div>`
        );
      } else {
        me.insertAdjacentHTML("beforeend", `<div class="score great">✓ Understood, in your own words! +5 bonus</div>`);
        xp += 5;
      }
      xp += hit.reply.xp || 10;
      nextId = hit.reply.next;
    } else if (node.any && text.trim().split(/\s+/).length >= 3) {
      me.insertAdjacentHTML("beforeend", `<div class="score great">✓ Great answer! +10</div>`);
      xp += 15;
      nextId = node.any;
    }

    if (nextId) {
      if (confidence && confidence > 0.85) xp += 2;
      earned += xp;
      turns++;
      addXp(xp);
      $("#earned").textContent = earned;
      nodeId = nextId;
      await new Promise((r) => setTimeout(r, 450));
      if (alive) showNode();
    } else {
      misses++;
      const retry = misses === 1 ? "Sorry, I didn't quite catch that. Could you say it another way?" : "Hmm, try one of the ideas below!";
      await npcSay(retry);
      if (misses >= 2) renderHints(node, true);
      if (alive && canListen && state.autoListen) startListening();
    }
  }

  function startListening() {
    if (!mic || listening) return;
    stopSpeaking();
    mic.classList.add("on");
    live.textContent = "Listening…";
    listening = listen({ onInterim: (t) => (live.textContent = t || "Listening…") });
    listening.promise
      .then(({ text, confidence }) => {
        live.textContent = "";
        if (alive && text) handle(text, confidence);
      })
      .catch((err) => {
        live.textContent = "";
        if (err.message === "not-allowed") {
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
    const prev = state.completed[s.id];
    const firstTime = !prev;
    const bonus = firstTime ? 30 : 10;
    addXp(bonus);
    state.completed[s.id] = { stars: Math.max(stars, prev?.stars || 0), runs: (prev?.runs || 0) + 1 };
    save();
    const unlocked = SCENES.filter((x) => x.unlock > state.xp - earned - bonus && x.unlock <= state.xp);

    $("#composer").innerHTML = `
      <div class="result">
        <div class="big-stars">${"★".repeat(stars)}<span>${"★".repeat(3 - stars)}</span></div>
        <h3>Conversation complete!</h3>
        <div class="result-grid">
          <div><b>+${earned + bonus}</b><small>XP</small></div>
          <div><b>${avg}%</b><small>accuracy</small></div>
          <div><b>${hintsUsed}</b><small>hints</small></div>
        </div>
        ${unlocked.length ? `<p class="unlock">🔓 New place unlocked: <b>${unlocked.map((u) => u.emoji + " " + esc(u.name)).join(", ")}</b></p>` : ""}
        <div class="vocab"><b>Key phrases</b>${s.vocab.map((v) => `<button class="chip" data-v="${esc(v)}">☆ ${esc(v)}</button>`).join("")}</div>
        <div class="result-actions">
          <button class="btn" data-go="scene" data-arg="${s.id}">↻ Try again</button>
          <button class="btn primary" data-go="city">Back to city</button>
        </div>
      </div>`;
    $("#composer").querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => savePhrase(b.dataset.v, s.name)));
    confetti();
  }

  showNode();
}

// ---------- phrasebook ----------

function phrasebook() {
  app.innerHTML = `
  <header class="topbar plain"><h2>📒 Phrasebook</h2></header>
  <main class="page">
    ${
      state.phrases.length
        ? `<p class="small">Tap 🔊 to hear a phrase. Practise them all in <b>Drill</b>.</p>
           <div class="list">${state.phrases
             .map(
               (p, i) => `
             <div class="row">
               <span class="row-main"><b>${esc(p.text)}</b><small>${esc(p.source || "")}${p.best ? ` · best ${p.best}%` : ""}</small></span>
               <button class="chip" data-hear="${i}" aria-label="Hear">🔊</button>
               <button class="chip" data-del="${i}" aria-label="Delete">🗑️</button>
             </div>`
             )
             .join("")}</div>`
        : `<div class="empty card"><div class="hero-emoji">📒</div><p>No phrases yet. Tap ☆ next to any phrase during a conversation to save it here.</p><button class="btn primary" data-go="city">Find a conversation</button></div>`
    }
  </main>
  ${nav("phrasebook")}`;
  app.querySelectorAll("[data-hear]").forEach((b) => (b.onclick = () => speak(state.phrases[b.dataset.hear].text, { speed: state.speed || 1 })));
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
  const pool = state.phrases.length
    ? state.phrases.map((p) => p.text)
    : SCENES.filter((s) => s.unlock <= state.xp).flatMap((s) => Object.values(s.nodes).flatMap((n) => (n.replies || []).map((r) => fill(r.say))));
  const deck = [...new Set(pool)].sort(() => Math.random() - 0.5).slice(0, 5);
  let i = 0;
  let total = 0;
  let listening = null;
  current = () => listening?.stop();

  function card() {
    if (i >= deck.length) {
      const avg = Math.round(total / deck.length);
      addXp(avg >= 80 ? 25 : 15);
      app.querySelector(".page").innerHTML = `
        <div class="result card">
          <div class="hero-emoji">${avg >= 80 ? "🏆" : "💪"}</div>
          <h3>Drill done: ${avg}% average</h3>
          <p class="small">+${avg >= 80 ? 25 : 15} XP</p>
          <div class="result-actions"><button class="btn" data-go="drill">Another round</button><button class="btn primary" data-go="city">City</button></div>
        </div>`;
      confetti();
      return;
    }
    const phrase = deck[i];
    app.querySelector(".page").innerHTML = `
      <p class="small center">${i + 1} / ${deck.length}</p>
      <div class="bar"><i style="width:${(i / deck.length) * 100}%"></i></div>
      <div class="drill-card card">
        <p class="drill-phrase" id="phrase">${esc(phrase)}</p>
        <div class="drill-tools">
          <button class="btn" id="hear">🔊 Listen</button>
          <button class="btn" id="slow">🐢 Slow</button>
        </div>
        <p class="live" id="live"></p>
        ${canListen ? `<button class="mic big" id="mic">🎙️</button><p class="small center">Tap and read the phrase out loud</p>` : ""}
        <form id="tf" class="typeform"><input id="typed" placeholder="${canListen ? "No mic? Type it instead" : "Type the phrase"}"/><button class="btn">Check</button></form>
        <button class="link" id="skip">Skip</button>
      </div>`;
    $("#hear").onclick = () => speak(phrase, { speed: state.speed || 1 });
    $("#slow").onclick = () => speak(phrase, { speed: 0.6 });
    $("#skip").onclick = () => {
      i++;
      card();
    };
    const grade = (heard) => {
      const p = pronunciation(phrase, heard);
      total += p.accuracy;
      const saved = state.phrases.find((x) => x.text === phrase);
      if (saved) saved.best = Math.max(saved.best || 0, p.accuracy);
      save();
      $("#phrase").innerHTML = p.parts.map((x) => `<span class="${x.ok ? "hit" : "miss"}">${esc(x.word)}</span>`).join(" ");
      $("#live").innerHTML = `<b class="${p.accuracy >= 85 ? "good" : "bad"}">${p.accuracy}%</b> ${p.accuracy >= 85 ? "Excellent!" : p.accuracy >= 60 ? "Nice, nearly there." : "Listen and try again next time."}`;
      setTimeout(() => {
        i++;
        card();
      }, 1800);
    };
    if (canListen) {
      $("#mic").onclick = () => {
        if (listening) return listening.stop();
        $("#mic").classList.add("on");
        listening = listen({ onInterim: (t) => ($("#live").textContent = t) });
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
  <header class="topbar plain"><h2>🎯 Pronunciation drill</h2></header>
  <main class="page"></main>
  ${nav("drill")}`;
  card();
}

// ---------- profile ----------

function profile() {
  const done = Object.keys(state.completed).length;
  const stars = Object.values(state.completed).reduce((a, c) => a + c.stars, 0);
  const voices = englishVoices();
  const badges = [
    ["🗣️", "First words", done >= 1],
    ["🔥", "3-day streak", state.streak >= 3],
    ["⭐", "10 stars", stars >= 10],
    ["📒", "Collector: 10 phrases", state.phrases.length >= 10],
    ["🗺️", "Explorer: 5 places", done >= 5],
    ["🏆", "City legend", done >= SCENES.length],
  ];
  app.innerHTML = `
  <header class="topbar plain"><h2>👤 ${esc(state.name)}</h2></header>
  <main class="page">
    <div class="result-grid card">
      <div><b>${levelFromXp(state.xp)}</b><small>level</small></div>
      <div><b>${state.xp}</b><small>XP</small></div>
      <div><b>${state.streak}</b><small>streak</small></div>
      <div><b>${stars}</b><small>stars</small></div>
    </div>
    <h3>Badges</h3>
    <div class="badges">${badges.map(([i, l, ok]) => `<div class="badge ${ok ? "" : "off"}"><span>${i}</span><small>${l}</small></div>`).join("")}</div>
    <h3>Settings</h3>
    <div class="card settings">
      <label>Daily goal
        <select id="goal">${[30, 50, 100, 200].map((g) => `<option ${g === state.dailyGoal ? "selected" : ""} value="${g}">${g} XP</option>`).join("")}</select>
      </label>
      <label>Voice speed
        <select id="speed">${[
          [0.75, "Slow"],
          [1, "Normal"],
          [1.2, "Fast"],
          [0, "Muted (read only)"],
        ]
          .map(([v, l]) => `<option ${v === state.speed ? "selected" : ""} value="${v}">${l}</option>`)
          .join("")}</select>
      </label>
      ${
        voices.length
          ? `<label>Voice
          <select id="voice"><option value="">A different voice for each character</option>${voices
            .map((v) => `<option ${v.voiceURI === state.voiceURI ? "selected" : ""} value="${esc(v.voiceURI)}">${esc(v.name)} (${v.lang})</option>`)
            .join("")}</select></label>`
          : ""
      }
      ${canListen ? `<label class="check"><input type="checkbox" id="auto" ${state.autoListen ? "checked" : ""}/> Start listening automatically after each line</label>` : ""}
      <button class="btn danger" id="reset">Reset all progress</button>
    </div>
    <p class="small center">TalkTown is free. Everything stays on this device.<br/>${canSpeak ? "" : "Text-to-speech isn't available in this browser."}</p>
  </main>
  ${nav("profile")}`;
  $("#goal").onchange = (e) => ((state.dailyGoal = +e.target.value), save());
  $("#speed").onchange = (e) => ((state.speed = +e.target.value), save());
  $("#voice")?.addEventListener("change", (e) => ((state.voiceURI = e.target.value), save()));
  $("#auto")?.addEventListener("change", (e) => ((state.autoListen = e.target.checked), save()));
  $("#reset").onclick = () => {
    if (confirm("Delete all your progress? This can't be undone.")) {
      state = { ...defaults };
      save();
      go("welcome");
    }
  };
}

// ---------- confetti ----------

function confetti() {
  const colors = ["#f59e0b", "#22c55e", "#3b82f6", "#ec4899", "#8b5cf6"];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement("i");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = Math.random() * 0.4 + "s";
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.append(c);
    setTimeout(() => c.remove(), 2200);
  }
}

// ---------- boot ----------

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
go(state.name ? "city" : "welcome");
