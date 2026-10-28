/* The listen page's player. It reads #listen-out aloud with the browser's
 * speech synthesis (the Web Speech API), one sentence at a time: long
 * utterances may stop midway in some browsers, and a sentence is what the
 * page highlights. #listen-out is filled either with the articles of a
 * page of this site, picked from #listen-files by a fuzzy match on its
 * file path (titles are mostly Japanese, awkward to type to narrow a
 * list), or with Markdown pasted into #listen-src, rendered by the
 * preview page's renderer (whose URL and file list ride on
 * #listen-data's data-* attributes, as on the preview page). Each
 * sentence is said as the reading rules in #listen-rules rewrite it. The
 * settings and the rules are kept in this browser's localStorage. */
const pick = document.getElementById("listen-pick");
const choices = document.getElementById("listen-files");
const src = document.getElementById("listen-src");
const out = document.getElementById("listen-out");
const status = document.getElementById("listen-status");
const voice = document.getElementById("listen-voice");
const rules = document.getElementById("listen-rules");
const knobs = Object.fromEntries(["rate", "pitch", "volume"].map((name) => {
  const input = document.getElementById(`listen-${name}`);
  const shown = document.getElementById(`listen-${name}-out`);
  const show = () => {
    shown.textContent = input.value;
  };
  input.addEventListener("input", show);
  return [name, { input, show }];
}));
const { wasm, files } = document.getElementById("listen-data").dataset;
const synth = window.speechSynthesis;
const lang = document.documentElement.lang;

// The elements read as one block each, and those never read: code,
// images, and the anchors and buttons the site adds.
const BLOCKS = "h1,h2,h3,h4,h5,h6,p,li,th,td,dt,dd,figcaption";
const SKIP = "pre,svg,img,button,.heading-permalink";
// A sentence longer than this is cut at a comma or a space before it.
const MAX = 120;

const segmenter = "Segmenter" in Intl
  ? new Intl.Segmenter(lang, { granularity: "sentence" })
  : null;

const say = (text) => {
  status.textContent = text;
};

// ---- Settings, kept in localStorage (which may be unavailable, as in
// some private windows: then nothing is kept).

const STORE = "listen-settings";

function saved() {
  try {
    return JSON.parse(localStorage.getItem(STORE)) ?? {};
  } catch {
    return {};
  }
}

function save() {
  const settings = { voice: voice.value, rules: rules.value };
  for (const [name, k] of Object.entries(knobs)) settings[name] = k.input.value;
  try {
    localStorage.setItem(STORE, JSON.stringify(settings));
  } catch {
    // Not kept.
  }
}

// ---- Reading rules: one a line, "pattern => reading". An empty reading
// is not read. /body/flags is a regular expression, whose reading may
// use $1 and the like; anything else is matched as it is written.

const DEFAULT_RULES = `# One rule a line: pattern => reading. An empty reading is not read.
# /.../flags is a regular expression; anything else matches as written.
# For example:  MoonBit => ムーンビット
/\\p{Extended_Pictographic}\\uFE0F?/gu =>
/https?:\\/\\/\\S+/g => URL
`;

let rewrites = [];

function parseRules() {
  rewrites = [];
  const bad = [];
  rules.value.split("\n").forEach((line, i) => {
    const m = /^(.*?)\s*=>\s?(.*)$/.exec(line);
    if (line.trim() === "" || line.startsWith("#")) return;
    if (!m || m[1] === "") {
      bad.push(i + 1);
      return;
    }
    const [, pattern, reading] = m;
    const re = /^\/(.+)\/([a-z]*)$/.exec(pattern);
    if (!re) {
      rewrites.push((t) => t.replaceAll(pattern, () => reading));
      return;
    }
    try {
      const flags = re[2].includes("g") ? re[2] : re[2] + "g";
      const regexp = new RegExp(re[1], flags);
      rewrites.push((t) => t.replace(regexp, reading));
    } catch {
      bad.push(i + 1);
    }
  });
  say(bad.length ? `reading rules not understood, on line ${bad.join(", ")}` : "");
}

const rewrite = (text) => rewrites.reduce((t, f) => f(t), text);

// ---- What to read

async function load(path, href) {
  stop();
  say(`loading ${path}`);
  const res = await fetch(href);
  if (!res.ok) {
    say(`could not load ${path}: ${res.status}`);
    return;
  }
  const page = new DOMParser().parseFromString(await res.text(), "text/html");
  out.replaceChildren(...page.querySelectorAll("main > article"));
  say("");
}

let render;
async function renderPasted() {
  stop();
  if (!render) {
    try {
      const { instance } = await WebAssembly.instantiateStreaming(fetch(wasm), {}, {
        builtins: ["js-string"],
        importedStringConstants: "_",
      });
      render = instance.exports.render;
    } catch {
      say("this browser could not run the Wasm renderer");
      return;
    }
  }
  out.innerHTML = render(src.value, files);
}

// ---- Picking a file, like fzf: every word of the query must appear in
// the path in order, not necessarily together. #listen-files lists every
// page as a link (so it works without this script); the best matches are
// kept in it, in order, and the rest taken out.

const SHOWN = 10;
const items = [...choices.querySelectorAll("a")].map((a) => ({
  a,
  li: a.closest("li"),
  path: a.dataset.source,
}));
let shown = [];
let active = 0;

// match scores how well the words of q match path, with the indexes of
// the matched characters, or is null when one of them does not match.
// Characters matched in a row and those right after a separator count
// more; a later match in the path is preferred, so that the file name,
// not the directory, takes the highlight.
function match(path, q) {
  const lower = path.toLowerCase();
  let score = 0;
  const at = [];
  for (const word of q.toLowerCase().split(/\s+/).filter(Boolean)) {
    // The word as it is wins; otherwise its characters are taken from
    // the end.
    const whole = lower.lastIndexOf(word);
    const hits = whole >= 0 ? [...word].map((_, k) => whole + k) : [];
    for (let k = word.length - 1, i = lower.length; whole < 0 && k >= 0; k--) {
      i = lower.lastIndexOf(word[k], i - 1);
      if (i < 0) return null;
      hits.unshift(i);
    }
    hits.forEach((h, k) => {
      score += 1;
      if (k > 0 && hits[k - 1] === h - 1) score += 2;
      if (h === 0 || "/-_.".includes(path[h - 1])) score += 3;
    });
    at.push(...hits);
  }
  return { score, at: new Set(at) };
}

function highlight(path, at) {
  return [...path].map((c, i) => {
    if (!at.has(i)) return c;
    const m = document.createElement("mark");
    m.textContent = c;
    return m;
  });
}

function filter() {
  const q = pick.value.trim();
  // sort is stable, so equal scores keep the site's order.
  const found = items
    .map((it) => ({ it, m: match(it.path, q) }))
    .filter((x) => x.m)
    .sort((x, y) => y.m.score - x.m.score)
    .slice(0, SHOWN);
  for (const { it, m } of found) it.a.replaceChildren(...highlight(it.path, m.at));
  shown = found.map((x) => x.it);
  choices.replaceChildren(...shown.map((it) => it.li));
  active = 0;
  showActive();
  choices.hidden = false;
}

function showActive() {
  shown.forEach((it, i) => it.li.classList.toggle("active", i === active));
  shown[active]?.li.scrollIntoView({ block: "nearest" });
}

function choose(it) {
  if (!it) return;
  pick.value = it.path;
  choices.hidden = true;
  load(it.path, it.a.href);
}

choices.hidden = true;
pick.addEventListener("input", filter);
pick.addEventListener("focus", filter);
pick.addEventListener("blur", () => {
  choices.hidden = true;
});
pick.addEventListener("keydown", (e) => {
  if (e.isComposing) return;
  const keys = {
    ArrowDown: () => active = Math.min(active + 1, shown.length - 1),
    ArrowUp: () => active = Math.max(active - 1, 0),
    Enter: () => choose(shown[active]),
    Escape: () => choices.hidden = true,
  };
  if (!keys[e.key]) return;
  e.preventDefault();
  keys[e.key]();
  showActive();
});
// Keep the focus in the input, so that clicking a choice is not a blur.
choices.addEventListener("mousedown", (e) => e.preventDefault());
choices.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a) return;
  e.preventDefault();
  choose(items.find((it) => it.a === a));
});
src.addEventListener("input", renderPasted);

// ---- Sentences

// sentences lists what #listen-out says, in order: each sentence with
// its block and its range in the page.
function sentences() {
  const list = [];
  for (const block of out.querySelectorAll(BLOCKS)) {
    if (block.closest(SKIP)) continue;
    const nodes = textNodes(block);
    const text = nodes.map((n) => n.data).join("");
    for (const [start, end] of split(text)) {
      const s = rewrite(text.slice(start, end)).trim();
      if (!/[\p{L}\p{N}]/u.test(s)) continue;
      list.push({ block, text: s, range: rangeOf(nodes, start, end) });
    }
  }
  return list;
}

// textNodes is the text of block itself: not of blocks inside it (a
// nested list's items are blocks of their own), nor of what is skipped.
function textNodes(block) {
  const walk = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.parentElement.closest(BLOCKS) === block && !n.parentElement.closest(SKIP)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });
  const nodes = [];
  while (walk.nextNode()) nodes.push(walk.currentNode);
  return nodes;
}

// split yields [start, end) of each sentence of text.
// A break the segmenter makes inside a word, as at the "?" of a URL's
// query, is not one: a sentence ends in 。！？ or before a space.
function* split(text) {
  const parts = [];
  for (const s of segmenter ? segmenter.segment(text) : [{ index: 0, segment: text }]) {
    const last = parts.at(-1);
    if (last && !/[\s。！？]$/.test(text.slice(last[0], last[1]))) last[1] += s.segment.length;
    else parts.push([s.index, s.index + s.segment.length]);
  }
  for (let [start, end] of parts) {
    while (end - start > MAX) {
      const head = text.slice(start, start + MAX);
      const cut = Math.max(...["、", "，", ",", " ", "　"].map((c) => head.lastIndexOf(c)));
      const at = cut > 0 ? start + cut + 1 : start + MAX;
      yield [start, at];
      start = at;
    }
    yield [start, end];
  }
}

function rangeOf(nodes, start, end) {
  const range = document.createRange();
  let offset = 0;
  for (const n of nodes) {
    const next = offset + n.data.length;
    if (offset <= start && start <= next) range.setStart(n, start - offset);
    if (offset <= end && end <= next) {
      range.setEnd(n, end - offset);
      break;
    }
    offset = next;
  }
  return range;
}

// ---- Highlight

let current;
function mark(s) {
  current?.classList.remove("listen-current");
  current = s?.block;
  current?.classList.add("listen-current");
  current?.scrollIntoView({ block: "center", behavior: "smooth" });
  if (window.CSS?.highlights) {
    if (s) CSS.highlights.set("listen", new Highlight(s.range));
    else CSS.highlights.delete("listen");
  }
}

// ---- Voices

function listVoices() {
  const all = synth.getVoices();
  if (all.length === 0) return;
  const mine = (v) => v.lang.startsWith(lang);
  const sorted = [...all.filter(mine), ...all.filter((v) => !mine(v))];
  const chosen = voice.value || saved().voice;
  voice.replaceChildren(...sorted.map((v) =>
    new Option(`${v.name} (${v.lang})${v.localService ? "" : " ☁"}`, v.voiceURI)
  ));
  voice.value = chosen;
  // A voice kept from before may be gone, and then the value is "".
  if (!voice.value) voice.value = (sorted.find((v) => mine(v) && v.default) ?? sorted[0]).voiceURI;
}

// ---- Playing

let queue = [];
let at = 0;
// run tells the utterances of the current playing from those cut off by
// cancel(), which still fire their end or error events afterwards.
let run = 0;

function play(from = 0) {
  synth.cancel();
  run++;
  queue = sentences();
  at = from;
  if (queue.length === 0) say("nothing to read: pick an article or paste Markdown");
  speakNext(run);
}

function speakNext(id) {
  if (id !== run) return;
  if (at >= queue.length) {
    mark(null);
    return;
  }
  const s = queue[at];
  const u = new SpeechSynthesisUtterance(s.text);
  const v = synth.getVoices().find((v) => v.voiceURI === voice.value);
  if (v) u.voice = v;
  u.lang = v?.lang ?? lang;
  u.rate = Number(knobs.rate.input.value);
  u.pitch = Number(knobs.pitch.input.value);
  u.volume = Number(knobs.volume.input.value);
  u.onend = () => {
    if (id !== run) return;
    at++;
    speakNext(id);
  };
  u.onerror = (e) => {
    if (id !== run || e.error === "interrupted" || e.error === "canceled") return;
    say(`speech stopped: ${e.error}`);
    stop();
  };
  mark(s);
  say(`${at + 1} / ${queue.length}`);
  synth.speak(u);
}

function stop() {
  run++;
  synth?.cancel();
  mark(null);
}

const button = (name) => document.getElementById(`listen-${name}`);

if (!synth) {
  say("this browser has no speech synthesis");
  for (const name of ["play", "pause", "stop"]) button(name).disabled = true;
} else {
  listVoices();
  synth.onvoiceschanged = listVoices;
  button("play").addEventListener("click", () => {
    if (synth.paused) synth.resume();
    else play();
  });
  button("pause").addEventListener("click", () => synth.pause());
  button("stop").addEventListener("click", () => {
    stop();
    say("");
  });
  // Clicking a block reads from its first sentence; links still work.
  out.addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    const block = e.target.closest(BLOCKS);
    if (!block) return;
    const from = sentences().findIndex((s) => s.block === block);
    if (from >= 0) play(from);
  });
}

// Settings kept from before, then saved whenever they change.
{
  const kept = saved();
  for (const [name, k] of Object.entries(knobs)) {
    if (kept[name] !== undefined) k.input.value = kept[name];
    k.show();
    k.input.addEventListener("change", save);
  }
  rules.value = kept.rules ?? DEFAULT_RULES;
  parseRules();
  rules.addEventListener("input", () => {
    parseRules();
    save();
  });
  voice.addEventListener("change", save);
  button("rules-reset").addEventListener("click", () => {
    rules.value = DEFAULT_RULES;
    parseRules();
    save();
  });
}
