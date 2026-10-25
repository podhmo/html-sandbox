// Anchor IDs for section headings, the same rule as the Go and MoonBit
// blogs: a GitHub/GitLab-style slug built from the heading's plain text,
// deduplicated per page with -N suffixes.
import type { Child } from "hono/jsx";

// AnchorIds holds the ids already used on the page, so generated suffixes
// cannot be reused by a later literal title either.
export class AnchorIds {
  private seen = new Map<string, number>();

  id(title: string): string {
    const base = slugify(title) || "sec";
    let id = base;
    while (this.seen.has(id)) {
      const n = (this.seen.get(base) ?? 0) + 1;
      this.seen.set(base, n);
      id = `${base}-${n}`;
    }
    this.seen.set(id, 0);
    return id;
  }
}

// slugify keeps letters, digits, "-" and "_", turns Unicode whitespace into
// "-", and drops other punctuation and symbols (emoji included). Only ASCII
// and fullwidth A-Z are lowercased, so all three implementations share one
// rule without a Unicode-aware toLowerCase.
export function slugify(title: string): string {
  let out = "";
  for (const r of title) {
    if (isWhitespace(r)) {
      out += "-";
    } else if (isASCIIKeeper(r) || (r.codePointAt(0)! >= 0x80 && !inDrop(r))) {
      out += toLower(r);
    }
  }
  return out;
}

// isWhitespace is the Unicode White_Space set (it is what the Go and
// MoonBit versions test, unlike JavaScript's \s which differs on U+0085
// and U+FEFF).
function isWhitespace(r: string): boolean {
  const c = r.codePointAt(0)!;
  return (
    (0x09 <= c && c <= 0x0d) || c === 0x20 || c === 0x85 || c === 0xa0 ||
    c === 0x1680 || (0x2000 <= c && c <= 0x200a) || c === 0x2028 ||
    c === 0x2029 || c === 0x202f || c === 0x205f || c === 0x3000
  );
}

function isASCIIKeeper(r: string): boolean {
  const c = r.codePointAt(0)!;
  return (
    r === "-" || r === "_" ||
    (0x30 <= c && c <= 0x39) || (0x61 <= c && c <= 0x7a) || (0x41 <= c && c <= 0x5a)
  );
}

function toLower(r: string): string {
  const c = r.codePointAt(0)!;
  if ((0x41 <= c && c <= 0x5a) || (0xff21 <= c && c <= 0xff3a)) {
    return String.fromCodePoint(c + 0x20);
  }
  return r;
}

const dropRanges: [number, number][] = [
  [0x00a1, 0x00c0], // Latin-1 punctuation and symbols: ¡–¿
  [0x2000, 0x2070], // general punctuation
  [0x20a0, 0x20c0], // currency symbols
  [0x20d0, 0x2100], // combining marks for symbols
  [0x2100, 0x2150], // letterlike symbols
  [0x2190, 0x2460], // arrows, math operators, technical and control pictures
  [0x2500, 0x2c00], // box drawing, blocks, geometric shapes, dingbats, more math and arrows
  [0x2e00, 0x2e80], // supplemental punctuation
  [0x3001, 0x3004], // CJK punctuation: 、。〃
  [0x3008, 0x3012], // CJK brackets: 〈〉《》「」『』【】
  [0x3014, 0x3020], // more CJK brackets and marks: 〔〕〖〗〘〙〚〛〜〝〞〟
  [0x3030, 0x3031], // wavy dash 〰
  [0x303d, 0x303e], // part alternation mark 〽
  [0xfe00, 0xfe10], // variation selectors
  [0xfe10, 0xfe70], // vertical forms, CJK compatibility forms, small form variants
  [0xff01, 0xff10], // fullwidth punctuation: ！–／
  [0xff1a, 0xff21], // fullwidth punctuation: ：–＠
  [0xff3b, 0xff41], // fullwidth punctuation: ［–｀
  [0xff5b, 0xff66], // fullwidth and halfwidth punctuation: ｛–･
  [0x1f000, 0x1fb00], // emoji
  [0xe0000, 0xe1000], // tags and variation selectors supplement
];

const dropChars = "×÷・";

function inDrop(r: string): boolean {
  if (dropChars.includes(r)) {
    return true;
  }
  const c = r.codePointAt(0)!;
  return dropRanges.some(([lo, hi]) => lo <= c && c < hi);
}

// permalink is the always-visible "#" link appended to a heading, so the
// id can be copied on mobile where no hover exists.
export function permalink(id: string): Child {
  return (
    <a class="heading-permalink" href={`#${id}`} aria-label="permalink">{" #"}</a>
  );
}
