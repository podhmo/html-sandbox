/* The listen page's player. It reads #listen-out aloud with the browser's
 * speech synthesis (the Web Speech API), one sentence at a time: long
 * utterances may stop midway in some browsers, and a sentence is what the
 * page highlights. #listen-out is filled either with the articles of a
 * page of this site, picked from #listen-files, or with Markdown pasted
 * into #listen-src, rendered by the preview page's renderer (whose URL
 * and file list ride on #listen-data's data-* attributes, as on the
 * preview page). Nothing is saved. */
const pick = document.getElementById("listen-pick");
const choices = document.getElementById("listen-files");
const src = document.getElementById("listen-src");
const out = document.getElementById("listen-out");
const status = document.getElementById("listen-status");
const voice = document.getElementById("listen-voice");
const knobs = Object.fromEntries(["rate", "pitch", "volume"].map((name) => {
  const input = document.getElementById(`listen-${name}`);
  const shown = document.getElementById(`listen-${name}-out`);
  input.addEventListener("input", () => {
    shown.textContent = input.value;
  });
  return [name, input];
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

// ---- What to read

async function load(path) {
  const opt = [...choices.options].find((o) => o.value === path);
  if (!opt) return;
  stop();
  say(`loading ${path}`);
  const res = await fetch(opt.dataset.href);
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

pick.addEventListener("change", () => load(pick.value));
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
      const s = text.slice(start, end).trim();
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
function* split(text) {
  const parts = segmenter
    ? [...segmenter.segment(text)].map((s) => [s.index, s.index + s.segment.length])
    : [[0, text.length]];
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
  const chosen = voice.value;
  voice.replaceChildren(...sorted.map((v) =>
    new Option(`${v.name} (${v.lang})${v.localService ? "" : " ☁"}`, v.voiceURI)
  ));
  voice.value = chosen || (sorted.find((v) => mine(v) && v.default) ?? sorted[0]).voiceURI;
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
  u.rate = Number(knobs.rate.value);
  u.pitch = Number(knobs.pitch.value);
  u.volume = Number(knobs.volume.value);
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
