/* The skim page's reader. It shows #skim-out a piece at a time in the
 * middle of #skim-stage (RSVP, rapid serial visual presentation): each
 * block's text is cut into pieces about the size of a Japanese bunsetsu,
 * by BudouX where it can be loaded, and each piece stays for as long as
 * its characters take at the speed set. #skim-out is filled either with
 * the articles of a page of this site, picked from #skim-files by a fuzzy
 * match on its file path, or with Markdown pasted into #skim-src,
 * rendered by the preview page's renderer (whose URL and file list ride
 * on #skim-data's data-* attributes, as on the preview page). The speed,
 * and whether the pieces before and after are shown, can be set before
 * starting and while it runs, and are kept in this browser's
 * localStorage. This script shares no code with the listen page's. */
const pick = document.getElementById("skim-pick");
const choices = document.getElementById("skim-files");
const src = document.getElementById("skim-src");
const out = document.getElementById("skim-out");
const status = document.getElementById("skim-status");
// The settings come in pairs, one on the page and one on the stage.
const speeds = [...document.querySelectorAll('[data-setting="cpm"]')];
const arounds = [...document.querySelectorAll('[data-setting="around"]')];
const pace = document.getElementById("skim-pace");
const cpm = () => Number(speeds[0].value);
const stage = document.getElementById("skim-stage");
const note = document.getElementById("skim-note");
const prev = document.getElementById("skim-prev");
const word = document.getElementById("skim-word");
const next = document.getElementById("skim-next");
const view = stage.querySelector(".skim-view");
const progress = document.getElementById("skim-progress");
const button = (name) => document.getElementById(`skim-${name}`);
const { wasm, files } = document.getElementById("skim-data").dataset;
const lang = document.documentElement.lang;

// The elements shown as one block each, and those never shown: code,
// images, and the anchors and buttons the site adds.
const BLOCKS = "h1,h2,h3,h4,h5,h6,p,li,th,td,dt,dd,figcaption";
const SKIP = "pre,svg,img,button,.heading-permalink";

const say = (text) => {
  status.textContent = text;
};

// ---- The settings, kept in localStorage (which may be unavailable, as in
// some private windows: then it is not kept).

const STORE = "skim-settings";

function saved() {
  try {
    return JSON.parse(localStorage.getItem(STORE)) ?? {};
  } catch {
    return {};
  }
}

function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify({ cpm: speeds[0].value, around: arounds[0].checked, pace: pace.value }));
  } catch {
    // Not kept.
  }
}

// ---- Pieces

const words = "Segmenter" in Intl ? new Intl.Segmenter(lang, { granularity: "word" }) : null;
// A piece of Japanese grows to this many characters at most, and a run
// of ASCII longer than LONG is cut after its / . - _ ? & = #.
const MAX = 10;
const LONG = 16;
const KANA = /^[\p{Script=Hiragana}ー]+$/u;
const MARK = /^[\p{P}\p{S}]+$/u;
const OPENING = /^[「『（(［\[〈《【“"']+$/u;
const PAUSE = /[、。，．！？]$/;
const STOP = /[。！？.!?]["'」』）)]*$/;
const COMMA = /[、，,:：]$/;

// BudouX finds where Japanese breaks into phrases. Only its parser and
// its Japanese model are loaded (about 27KB, 10KB gzipped), not the
// package's index, which brings the models of every language. Where it
// cannot be loaded (offline, say), phrases is null, and the word
// segmenter's words are put together instead.
const BUDOUX = "https://esm.sh/budoux@0.10.0";
const phrases = Promise.all([
  import(`${BUDOUX}/module/parser.js`),
  import(`${BUDOUX}/module/data/models/ja.js`),
]).then(([{ Parser }, { model }]) => new Parser(model), () => null);
let parser = null;

// pieces cuts text into pieces about the size of a bunsetsu, by BudouX's
// phrases or, without it, the word segmenter's words.
function pieces(text) {
  return (parser ? byPhrases(text) : byWords(text)).flatMap(cutLong);
}

// byPhrases is BudouX's phrases of each part of text between spaces (a
// part all in ASCII is one piece as it is), with what it leaves alone put
// with the piece before: a particle after a space (TTS の), a counter
// after a number (2 つ), and a closing mark or a lone hiragana.
function byPhrases(text) {
  const list = [];
  for (const part of text.split(/\s+/).filter(Boolean)) {
    const ps = /^[\x21-\x7e]+$/.test(part) ? [part] : parser.parse(part);
    ps.forEach((p, i) => {
      const prev = list.at(-1);
      const spaced = i === 0;
      const joins = prev && !PAUSE.test(prev) && (spaced
        ? /^\p{Script=Hiragana}{1,2}[、。，．！？]?$/u.test(p) ||
          (/^[\d.,]+$/.test(prev) && /^(\p{Script=Han}|つ)/u.test(p))
        : (MARK.test(p) && !OPENING.test(p)) || ([...p].length === 1 && KANA.test(p)));
      if (joins) list[list.length - 1] = prev + (spaced ? " " : "") + p;
      else list.push(p);
    });
  }
  return list;
}

// byWords puts the word segmenter's words together into pieces. The
// words are too small to show one at a time (含|め|て), and they differ
// by browser, so they are put back together: hiragana-only
// words (particles, okurigana) and closing marks join the piece before
// them, opening brackets the piece after, kanji and katakana join kanji
// and katakana, and ASCII joins ASCII with nothing between (listen.js,
// URLs). A piece ends at a space and after 、。！？. A particle after a
// space joins the piece before the space (TTS の), as does a counter
// after a number (1 本で).
function byWords(text) {
  if (!words) return text.split(/\s+/).filter(Boolean);
  const list = [];
  let cur = "";
  let opening = "";
  let spaced = false;
  const end = () => {
    if (cur.trim()) list.push(cur.trim());
    cur = "";
  };
  for (const { segment: s } of words.segment(text)) {
    if (/^\s+$/.test(s)) {
      end();
      spaced = true;
      continue;
    }
    if (PAUSE.test(cur)) end();
    if (OPENING.test(s)) {
      end();
      opening += s;
      spaced = false;
      continue;
    }
    const prev = list.at(-1);
    if (spaced && !cur && !opening && prev && !PAUSE.test(prev) &&
      (KANA.test(s) || (/^[\d.,]+$/.test(prev) && /^\p{Script=Han}/u.test(s)))) {
      cur = list.pop() + " ";
    }
    spaced = false;
    const ascii = /[\x21-\x7e]$/.test(cur) && /^[\x21-\x7e]/.test(s);
    const joins = cur && !cur.endsWith(" ") && (MARK.test(s) || KANA.test(s) || ascii ||
      (/[\p{Script=Han}\p{Script=Katakana}ー]$/u.test(cur) && /^[\p{Script=Han}\p{Script=Katakana}]/u.test(s)));
    const roomy = MARK.test(s) || ascii || cur.endsWith(" ") || [...cur + s].length <= MAX;
    if (!(joins && roomy) && !cur.endsWith(" ")) end();
    cur += opening + s;
    opening = "";
  }
  cur += opening;
  end();
  return list;
}

// cutLong cuts a piece longer than LONG after the marks that part a path
// or a URL, keeping each part as long as it can be.
function cutLong(piece) {
  if ([...piece].length <= LONG) return [piece];
  const list = [];
  let cur = "";
  for (const part of piece.match(/[^/.\-_?&=#]*[/.\-_?&=#]?/g).filter(Boolean)) {
    if (cur && [...cur + part].length > LONG) {
      list.push(cur);
      cur = "";
    }
    cur += part;
  }
  if (cur) list.push(cur);
  return list;
}

// items lists the pieces of #skim-out, in order: each with its block and
// whether it ends a sentence (stop) or its block (last).
function items() {
  const list = [];
  for (const block of out.querySelectorAll(BLOCKS)) {
    if (block.closest(SKIP)) continue;
    const ps = pieces(textOf(block));
    ps.forEach((text, i) => list.push({
      text,
      block,
      heading: /^H\d$/.test(block.tagName),
      stop: STOP.test(text),
      last: i === ps.length - 1,
    }));
  }
  return list;
}

// textOf is the text of block itself: not of blocks inside it (a nested
// list's items are blocks of their own), nor of what is skipped.
function textOf(block) {
  const walk = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.parentElement.closest(BLOCKS) === block && !n.parentElement.closest(SKIP)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });
  let text = "";
  while (walk.nextNode()) text += walk.currentNode.data;
  return text;
}

// delay is how long an item stays, in milliseconds, at the speed set,
// by the pace picked. Every pause is in characters' time, so that it
// keeps step with the speed.
//
//   steady    every piece the time of an average one (perPiece
//             characters), twice that at the end of a block: the
//             rhythm never changes.
//   balanced  that time, 0.8 to 1.4 times by the piece's length, 1.5
//             times at the end of a sentence, twice at the end of a block.
//   length    the piece's own characters (3 at least), 1.8 times at the
//             end of a sentence or 1.3 after a comma, with 3 characters'
//             time more after a block and 7 after a heading.
const PACES = {
  steady: (item, n) => perPiece * (item.last ? 2 : 1),
  balanced: (item, n) =>
    perPiece * Math.min(1.4, Math.max(0.8, 0.6 + 0.1 * n)) * (item.last ? 2 : item.stop ? 1.5 : 1),
  length: (item, n) =>
    Math.max(n, 3) * (item.stop ? 1.8 : COMMA.test(item.text) ? 1.3 : 1) +
    (item.last ? (item.heading ? 7 : 3) : 0),
};

function delay(item) {
  const chars = (PACES[pace.value] ?? PACES.steady)(item, [...item.text].length);
  return chars * 60000 / cpm();
}

// perPiece is how many characters the pieces of queue have on average.
let perPiece = 4;

function measure() {
  const chars = queue.reduce((sum, it) => sum + [...it.text].length, 0);
  if (queue.length) perPiece = chars / queue.length;
}

// ---- What to show

let queue = [];

async function loaded() {
  parser = await phrases;
  queue = items();
  measure();
  if (queue.length === 0) {
    say("nothing to skim: pick an article or paste Markdown");
    return;
  }
  const minutes = queue.reduce((sum, it) => sum + delay(it), 0) / 60000;
  const by = parser ? "BudouX" : "Intl.Segmenter";
  say(`${queue.length} pieces (by ${by}), about ${Math.ceil(minutes)} min at ${cpm()} characters a minute`);
}

async function load(path, href) {
  say(`loading ${path}`);
  const res = await fetch(href);
  if (!res.ok) {
    say(`could not load ${path}: ${res.status}`);
    return;
  }
  const page = new DOMParser().parseFromString(await res.text(), "text/html");
  out.replaceChildren(...page.querySelectorAll("main > article"));
  loaded();
}

let render;
async function renderPasted() {
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
  loaded();
}

// ---- Picking a file, like fzf: every word of the query must appear in
// the path in order, not necessarily together. #skim-files lists every
// page as a link (so it works without this script); the best matches are
// kept in it, in order, and the rest taken out.

const SHOWN = 10;
const entries = [...choices.querySelectorAll("a")].map((a) => ({
  a,
  li: a.closest("li"),
  path: a.dataset.source,
}));
let shown = [];
let active = 0;

// match scores how well the words of q match path, with the indexes of
// the matched characters, or is null when one of them does not match.
// Characters matched in a row and those right after a separator count
// more. A word found as it is wins; otherwise its characters are taken
// from the end, so that the file name, not the directory, takes them.
function match(path, q) {
  const lower = path.toLowerCase();
  let score = 0;
  const at = [];
  for (const w of q.toLowerCase().split(/\s+/).filter(Boolean)) {
    const whole = lower.lastIndexOf(w);
    const hits = whole >= 0 ? [...w].map((_, k) => whole + k) : [];
    for (let k = w.length - 1, i = lower.length; whole < 0 && k >= 0; k--) {
      i = lower.lastIndexOf(w[k], i - 1);
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
  const found = entries
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
  choose(entries.find((it) => it.a === a));
});
src.addEventListener("input", renderPasted);

// ---- Showing

let at = 0;
let timer = null;

// show puts the item at `at` in the middle, shrunk to fit the stage if it
// is too wide, between the items before and after it.
function show() {
  const it = queue[at];
  const span = document.createElement("span");
  span.textContent = it.text;
  word.replaceChildren(span);
  const room = word.clientWidth - parseFloat(getComputedStyle(word).paddingLeft) * 2;
  const width = span.getBoundingClientRect().width;
  if (width > room) span.style.fontSize = `${100 * room / width}%`;
  prev.textContent = queue[at - 1]?.text ?? "";
  next.textContent = queue[at + 1]?.text ?? "";
  progress.style.transform = `scaleX(${queue.length > 1 ? at / (queue.length - 1) : 1})`;
}

function tick() {
  show();
  const ms = delay(queue[at]);
  if (at === queue.length - 1) {
    timer = setTimeout(() => {
      pause();
      note.textContent = "the end";
    }, ms);
    return;
  }
  at++;
  timer = setTimeout(tick, ms);
}

// ---- Keeping the screen on while it runs. The Screen Wake Lock API is
// there only in secure contexts (HTTPS or localhost). The browser lets the
// lock go when the page is hidden, and then it pauses too (see below).

let lock = null;

async function keepAwake() {
  if (!navigator.wakeLock) {
    note.textContent = "The screen may turn off: keeping it on needs HTTPS.";
    return;
  }
  try {
    lock = await navigator.wakeLock.request("screen");
  } catch (e) {
    note.textContent = `The screen may turn off: ${e.message}`;
  }
}

function letSleep() {
  lock?.release();
  lock = null;
}

// A hidden page pauses: its pieces would go by unseen, at whatever pace
// the browser lets a hidden page's timers run.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && timer) pause();
});

// ---- Playing

function play() {
  if (at >= queue.length - 1 && note.textContent === "the end") at = 0;
  note.textContent = "";
  button("toggle").textContent = "Pause";
  keepAwake();
  tick();
}

function pause() {
  clearTimeout(timer);
  timer = null;
  button("toggle").textContent = "Play";
  letSleep();
}

const toggle = () => timer ? pause() : play();

async function start(from = 0) {
  parser = await phrases;
  queue = items();
  measure();
  if (queue.length === 0) {
    say("nothing to skim: pick an article or paste Markdown");
    return;
  }
  at = from;
  stage.hidden = false;
  document.documentElement.classList.add("skim-on");
  play();
}

function close() {
  pause();
  stage.hidden = true;
  document.documentElement.classList.remove("skim-on");
  queue[at]?.block.scrollIntoView({ block: "center" });
}

// first is where the sentence holding the item at i starts.
function first(i) {
  while (i > 0 && !queue[i - 1].stop && !queue[i - 1].last) i--;
  return i;
}

// jump moves to the start of a sentence: the one before (or this one's,
// if it is well under way) for -1, the next one for +1.
function jump(by) {
  let to = first(at);
  if (by < 0 && at - to <= 1) to = first(Math.max(to - 1, 0));
  if (by > 0) {
    to = at;
    while (to < queue.length - 1 && !queue[to].stop && !queue[to].last) to++;
    to = Math.min(to + 1, queue.length - 1);
  }
  at = to;
  if (timer) {
    clearTimeout(timer);
    tick();
  } else {
    show();
  }
}

button("start").addEventListener("click", () => start());
button("toggle").addEventListener("click", toggle);
button("back").addEventListener("click", () => jump(-1));
button("forward").addEventListener("click", () => jump(1));
button("close").addEventListener("click", close);

// Tapping the view pauses or plays; swiping it to the left goes forward
// a sentence, to the right back one, as a page is turned.
{
  let down = null;
  view.addEventListener("pointerdown", (e) => {
    down = { x: e.clientX, y: e.clientY };
  });
  view.addEventListener("pointerup", (e) => {
    if (!down) return;
    const dx = e.clientX - down.x;
    const dy = e.clientY - down.y;
    down = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) jump(dx < 0 ? 1 : -1);
    else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) toggle();
  });
  view.addEventListener("pointercancel", () => {
    down = null;
  });
}

// The keys, while the stage is shown: Space plays or pauses, the left and
// right arrows go back and forward a sentence, the up and down arrows
// change the speed. Space on a button is the button's, and the arrows on
// a slider the slider's.
document.addEventListener("keydown", (e) => {
  if (stage.hidden || (e.key === " " && e.target.closest("button"))) return;
  if (e.key.startsWith("Arrow") && e.target.matches?.('input[type="range"]')) return;
  const keys = {
    " ": toggle,
    ArrowLeft: () => jump(-1),
    ArrowRight: () => jump(1),
    ArrowUp: () => setSpeed(cpm() + 50),
    ArrowDown: () => setSpeed(cpm() - 50),
    Escape: close,
  };
  if (!keys[e.key]) return;
  e.preventDefault();
  keys[e.key]();
});

// Tapping a block of the text starts from it; links still work.
out.addEventListener("click", (e) => {
  if (e.target.closest("a")) return;
  const block = e.target.closest(BLOCKS);
  if (!block) return;
  const from = items().findIndex((it) => it.block === block);
  if (from >= 0) start(from);
});

// ---- Settings: the speed takes effect from the next piece. The ones
// kept from before are put back, then saved whenever they change.

function setSpeed(value) {
  const v = Math.min(Number(speeds[0].max), Math.max(Number(speeds[0].min), value));
  for (const input of speeds) {
    input.value = v;
    document.getElementById(`${input.id}-out`).textContent = input.value;
  }
  save();
}

function setAround(on) {
  for (const input of arounds) input.checked = on;
  stage.classList.toggle("skim-around", on);
  save();
}

{
  const kept = saved();
  setSpeed(Number(kept.cpm ?? speeds[0].value));
  setAround(kept.around ?? arounds[0].checked);
  pace.value = kept.pace ?? pace.value;
  if (!pace.value) pace.value = "steady";
  pace.addEventListener("change", () => {
    save();
    if (queue.length) loaded();
  });
  for (const input of speeds) {
    input.addEventListener("input", () => setSpeed(Number(input.value)));
    input.addEventListener("change", () => {
      if (queue.length && stage.hidden) loaded();
    });
  }
  for (const input of arounds) input.addEventListener("change", () => setAround(input.checked));
}
