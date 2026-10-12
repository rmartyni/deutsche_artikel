// der/die/das quiz engine, shared by all noun pages.
(() => {
  const quizId = document.querySelector("[data-quiz]").dataset.quiz;
  const quiz = window.QUIZZES[quizId];
  const ROUNDS = quiz.rounds;

  // With several rounds, the last option combines the words of all of them.
  const OPTIONS = ROUNDS.length > 1
    ? [...ROUNDS, { name: "Alle Wörter", words: ROUNDS.flatMap((r) => r.words) }]
    : ROUNDS;

  // The selected round is remembered separately for each page.
  const ROUND_KEY = `${quizId}:round`;

  const $ = (id) => document.getElementById(id);
  const buttons = [...document.querySelectorAll(".answers button")];

  let round = 0;
  try {
    const saved = Number(localStorage.getItem(ROUND_KEY));
    if (OPTIONS[saved]) round = saved;
  } catch (e) {}

  let hints = true;
  try {
    hints = localStorage.getItem("hints") !== "off";
  } catch (e) {}
  $("hints").checked = hints;

  const LANGS = ["pl", "en"];
  let lang = (() => {
    const fromHash = location.hash.slice(1);
    if (LANGS.includes(fromHash)) return fromHash;
    try {
      const saved = localStorage.getItem("lang");
      if (LANGS.includes(saved)) return saved;
    } catch (e) {}
    const browser = (navigator.languages && navigator.languages[0]) || navigator.language || "";
    return /^pl\b/i.test(browser) ? "pl" : "en";
  })();

  let deck = [];
  let pos = 0;
  let correct = 0;
  let answered = 0;
  let streak = 0;
  let mistakes = new Map();
  let locked = false;
  let nextTimer = null;
  let last = null;
  let view = "quiz"; // "quiz" or "list"

  function shuffle(list) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    // Do not start a new round with the word the previous one ended with.
    if (a.length > 1 && a[0] === last) [a[0], a[1]] = [a[1], a[0]];
    return a;
  }

  function renderSets() {
    const nav = $("sets");
    nav.innerHTML = "";
    OPTIONS.forEach((r, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.id = `set-${i}`;
      b.setAttribute("aria-pressed", String(i === round));
      b.innerHTML = `${r.name} <span class="count">· ${r.words.length}</span>`;
      b.addEventListener("click", () => selectRound(i));
      nav.append(b);
    });
  }

  function selectRound(i) {
    if (i === round && $("summary").hidden) return;
    clearTimeout(nextTimer);
    round = i;
    try { localStorage.setItem(ROUND_KEY, String(i)); } catch (e) {}
    correct = 0;
    answered = 0;
    streak = 0;
    $("score").textContent = "0 / 0";
    $("streak").textContent = "0";
    renderSets();
    newRound();
    renderWordList();
  }

  function newRound() {
    deck = shuffle(OPTIONS[round].words);
    pos = 0;
    mistakes = new Map();
    $("summary").hidden = true;
    $("quiz").hidden = false;
    show();
  }

  // An empty translation shows nothing, with no fallback to another language.
  function renderGloss(w) {
    $("gloss").lang = lang;
    $("gloss").textContent = w[lang] || "";
  }

  function renderLangs() {
    for (const b of document.querySelectorAll("#langs button")) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
    }
  }

  // With hints off, the picture and translation appear only after answering.
  function updateHints() {
    document.querySelector(".sign").classList.toggle("hide-hints", !hints && !locked);
  }

  function show() {
    const w = deck[pos];
    locked = false;
    $("pic").textContent = w.e;
    $("pic").hidden = !w.e;
    $("noun").textContent = w.n;
    renderGloss(w);
    updateHints();
    $("feedback").className = "feedback";
    $("feedback").innerHTML = '<span class="hint">Wähle den Artikel<span class="kbd-only"> oder drücke 1, 2 oder 3</span>.</span>';
    for (const b of buttons) {
      b.disabled = false;
      b.classList.remove("is-correct", "is-wrong");
    }
    $("round-info").textContent = `Wort ${pos + 1} von ${deck.length}`;
    $("bar").style.width = `${(pos / deck.length) * 100}%`;
  }

  function answer(choice) {
    if (locked) return;
    locked = true;
    const w = deck[pos];
    const ok = choice === w.a;
    answered++;

    for (const b of buttons) {
      b.disabled = true;
      if (b.dataset.a === w.a) b.classList.add("is-correct");
      else if (b.dataset.a === choice) b.classList.add("is-wrong");
    }

    $("noun").innerHTML = "";
    const art = document.createElement("span");
    art.className = `article ${w.a}`;
    art.textContent = w.a;
    $("noun").append(art, document.createTextNode(w.n));

    updateHints();
    const fb = $("feedback");
    if (ok) {
      correct++;
      streak++;
      fb.className = "feedback ok";
      fb.textContent = `Richtig: ${w.a} ${w.n}`;
      nextTimer = setTimeout(next, 1100);
    } else {
      streak = 0;
      mistakes.set(w, (mistakes.get(w) || 0) + 1);
      requeue(w);
      fb.className = "feedback bad";
      fb.innerHTML = "";
      const msg = document.createElement("span");
      msg.textContent = `Falsch. Richtig ist: ${w.a} ${w.n}. Das Wort kommt noch zweimal.`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn";
      btn.id = "btn-next";
      btn.textContent = "Weiter";
      btn.addEventListener("click", next);
      fb.append(msg, btn);
      btn.focus();
    }
    last = w;
    $("score").textContent = `${correct} / ${answered}`;
    $("streak").textContent = streak;
  }

  // After a mistake the word comes back twice in the same round: 2-4 words
  // later and again 3-5 words after that or at the end if fewer are left.
  function requeue(w) {
    let at = pos;
    for (let i = 0; i < 2; i++) {
      const remaining = deck.length - at - 1;
      const gap = Math.min(remaining, (i === 0 ? 2 : 3) + Math.floor(Math.random() * 3));
      at += 1 + gap;
      deck.splice(at, 0, w);
    }
  }

  function next() {
    if (!locked) return;
    clearTimeout(nextTimer);
    pos++;
    if (pos < deck.length) show();
    else finishRound();
  }

  function finishRound() {
    locked = true;
    $("bar").style.width = "100%";
    $("quiz").hidden = true;
    $("summary").hidden = false;
    const n = OPTIONS[round].words.length;
    const good = n - mistakes.size;
    const name = OPTIONS[round].name;
    $("summary-title").textContent = mistakes.size
      ? `${name}: ${good} von ${n} beim ersten Versuch`
      : `${name} ohne Fehler: ${n} von ${n}`;
    const body = $("summary-body");
    body.innerHTML = "";
    if (mistakes.size) {
      const p = document.createElement("p");
      p.style.margin = "0";
      p.textContent = "Zum Wiederholen:";
      const ul = document.createElement("ul");
      for (const [w, count] of mistakes) {
        const li = document.createElement("li");
        const times = `${count} Fehler`;
        li.innerHTML = `<span class="art-${w.a}">${w.a}</span> ${w.n} <span style="color:var(--muted)">(${times})</span>`;
        ul.append(li);
      }
      body.append(p, ul);
    }
    $("round-info").textContent = `${name}: ${n} Wörter`;
    $("btn-restart").focus();
  }

  // Every noun of the selected round, grouped by article (der, die, das),
  // alphabetically within each group, article in its colour.
  function renderWordList() {
    const r = OPTIONS[round];
    $("wordlist-title").textContent = `${r.name} · ${r.words.length} Wörter`;
    const container = $("words");
    container.innerHTML = "";
    for (const a of ["der", "die", "das"]) {
      const words = r.words
        .filter((w) => w.a === a)
        .sort((x, y) => x.n.localeCompare(y.n, "de"));
      if (!words.length) continue;

      const group = document.createElement("section");
      group.className = `group ${a}`;
      const title = document.createElement("h3");
      title.className = `group-title ${a}`;
      title.innerHTML = `${a} <span class="count">${words.length}</span>`;
      const list = document.createElement("ul");
      list.className = "words";
      group.append(title, list);
      container.append(group);
      renderWords(list, words);
    }
  }

  function renderWords(list, words) {
    for (const w of words) {
      const li = document.createElement("li");

      const pic = document.createElement("span");
      pic.className = "word-pic";
      pic.setAttribute("aria-hidden", "true");
      pic.textContent = w.e || "";

      const word = document.createElement("span");
      word.className = "word";
      word.lang = "de";
      const art = document.createElement("b");
      art.className = `article ${w.a}`;
      art.textContent = w.a;
      word.append(art, ` ${w.n}`);

      const tr = document.createElement("span");
      tr.className = "word-tr";
      tr.lang = lang;
      tr.textContent = w[lang] || "";

      li.append(pic, word, tr);
      list.append(li);
    }
  }

  function setView(v) {
    view = v;
    $("practice").hidden = v !== "quiz";
    $("wordlist").hidden = v !== "list";
    for (const b of document.querySelectorAll(".views button")) {
      b.setAttribute("aria-pressed", String(b.dataset.view === v));
    }
    if (v === "list") renderWordList();
  }

  for (const b of buttons) b.addEventListener("click", () => answer(b.dataset.a));
  $("btn-restart").addEventListener("click", newRound);
  $("hints").addEventListener("change", (e) => {
    hints = e.target.checked;
    try { localStorage.setItem("hints", hints ? "on" : "off"); } catch (err) {}
    updateHints();
  });
  for (const b of document.querySelectorAll("#langs button")) {
    b.addEventListener("click", () => {
      lang = b.dataset.lang;
      try { localStorage.setItem("lang", lang); } catch (err) {}
      renderLangs();
      if (deck[pos]) renderGloss(deck[pos]);
      if (view === "list") renderWordList();
    });
  }
  for (const b of document.querySelectorAll(".views button")) {
    b.addEventListener("click", () => setView(b.dataset.view));
  }
  renderLangs();
  renderSets();

  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || view !== "quiz") return;
    const map = { "1": "der", "2": "die", "3": "das" };
    if (!$("quiz").hidden && map[e.key]) {
      e.preventDefault();
      answer(map[e.key]);
    } else if (e.key === "Enter" && !$("quiz").hidden && locked) {
      e.preventDefault();
      next();
    }
  });

  newRound();
})();
