#!/usr/bin/env python3
"""Measure morphological / dependency / document-structure features of slops
members, aggregated by author (issue #172).

Sentence-level features come from GiNZA (Sudachi + UD parser + bunsetu).
Document-level features come from markdown-it-py block tokens.

Output: out/members.jsonl (per-member metrics) and out/report.md (per-author
aggregation + separation ranking).
"""

from __future__ import annotations

import json
import math
import re
import sys
from collections import Counter
from pathlib import Path

import ginza
import spacy
from markdown_it import MarkdownIt
from sudachipy import Dictionary

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SLOPS = ROOT / "slops"
OUT = HERE / "out"

AUTHOR_RE = re.compile(r"執筆[:：]\s*([^\n]+)")  # capture to EOL; name = part before 。
XREF_RE = re.compile(r"\d{2}-[a-z0-9-]+\.md\b|\bL\d+\b|#\d+\b")
ALERT_MARK_RE = re.compile(r"^\[![A-Z]+\]\s*")
META_RE = re.compile(r"この記事|この文書|このメモ|このセクション|このページ|本記事|ここでは|上記の|前述の|以下の通り|まとめると")

ANIMATE_NOUNS = {
    "私", "わたし", "我々", "われわれ", "自分", "自身", "人", "人間", "著者",
    "書き手", "ユーザー", "利用者", "開発者", "読者", "誰", "だれ", "みんな",
    "皆", "彼", "彼女", "あなた", "君", "きみ", "俺", "おれ", "僕", "ぼく",
    "我輩", "一人", "誰か", "技術者", "エンジニア", "運営", "担当者", "人々",
}

# godan: renyo-final i-row kana -> dictionary-form u-row kana
I_TO_U = dict(zip("いきぎしちにびみり", "うくぐすつぬぶむる"))
HIRAGANA = set("あいうえおかがきぎくぐけげこごさざしじすずせぜそぞただちぢつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもやゆよらりるれろわをん")

FORMAL_NOUNS = {"こと", "もの", "ところ", "ため", "わけ", "際", "場合", "うえ", "うち", "ほう", "とおり", "なか"}
# surfaces that pass the verb-existence test but are not used as deverbal nouns
RENYO_STOP = {"なし", "はず", "わけ", "ほう", "とも", "つの", "あり"}

# verbs that do not select an agentive subject (existential / stative / light)
LIGHT_VERBS = {"ある", "いる", "おる", "なる", "する", "できる", "である", "くださる", "まま", "見える", "みえる", "聞こえる"}
KANJI_RE = re.compile(r"[一-龯々]")
KATAKANA_RE = re.compile(r"[ァ-ヶー]")
LATIN_RE = re.compile(r"[A-Za-z]")


def classify_author(text: str, path: Path) -> str:
    m = AUTHOR_RE.search(text)
    label = None
    if m:
        label = m.group(1)
    elif path.parent.name.endswith(".md"):  # bundle member -> inherit README
        readme = path.parent / "README.md"
        if readme.exists():
            rm = AUTHOR_RE.search(readme.read_text(encoding="utf-8"))
            if rm:
                label = rm.group(1)
    if label is None:
        return "unknown"
    name = label.split("。")[0]
    if "おそらく" in label or "たぶん" in label:
        return "unknown"
    if "Claude" in name:
        return "claude"
    if "Devin" in name or "SWE" in name:
        return "devin"
    if "Codex" in name or "GPT" in name:
        return "codex"
    if "opencode" in name or "DeepSeek" in name:
        return "opencode"
    return "unknown"


AUTHOR_OVERRIDES = {
    "2026-10-27-writing-slops.md/03-svg-pitfalls.md": "claude",
    "2026-11-11-moonbit-sum-types.md/01-guidelines.md": "claude",
}


def inline_text(inline_token) -> str:
    parts = []
    for c in inline_token.children or []:
        if c.type in ("text", "code_inline", "text_special", "emoji"):
            parts.append(c.content)
    return "".join(parts)


def iter_blocks(tokens, lines):
    """Walk block tokens; yield (kind, text, extra) for text blocks and
    (kind, None, chars) for opaque regions."""
    stack: list[tuple[str, str]] = []
    i = 0
    n = len(tokens)
    while i < n:
        t = tokens[i]
        ty = t.type
        if ty == "inline":
            names = [s for s, _ in stack]
            if "heading" in names:
                kind = "heading"
                tag = next(tag for s, tag in reversed(stack) if s == "heading")
                yield kind, inline_text(t), int(tag[1]) if tag and tag[1:].isdigit() else 0
                i += 1
                continue
            if "th" in names or "td" in names:
                kind = "table_cell"
            elif "list_item" in names:
                kind = "list_item"
            elif "blockquote" in names:
                kind = "blockquote"
            elif "paragraph" in names:
                kind = "paragraph"
            else:
                kind = "other"
            yield kind, inline_text(t), t
        elif ty in ("fence", "code_block", "html_block"):
            if t.map:
                chars = sum(len(lines[j]) for j in range(t.map[0], min(t.map[1], len(lines))))
            else:
                chars = len(t.content)
            if ty == "fence" and (t.info or "").strip() == "svg":
                kind = "svg"
            else:
                kind = "code" if ty != "html_block" else "html"
            yield kind, None, chars
        elif ty.endswith("_open"):
            stack.append((ty[:-5], t.tag))
        elif ty.endswith("_close") and stack:
            stack.pop()
        i += 1


def mean(xs):
    return sum(xs) / len(xs) if xs else 0.0


def std(xs):
    if len(xs) < 2:
        return 0.0
    m = mean(xs)
    return math.sqrt(sum((x - m) ** 2 for x in xs) / (len(xs) - 1))


def skew(xs):
    if len(xs) < 3:
        return 0.0
    m = mean(xs)
    sd = std(xs)
    if sd == 0:
        return 0.0
    return mean([(x - m) ** 3 for x in xs]) / sd**3


def cv(xs):
    m = mean(xs)
    return std(xs) / m if m else 0.0


def cohens_d(a, b):
    """pooled-SD effect size a vs b"""
    na, nb = len(a), len(b)
    if na < 2 or nb < 2:
        return 0.0
    sp = math.sqrt(((na - 1) * std(a) ** 2 + (nb - 1) * std(b) ** 2) / (na + nb - 2))
    return (mean(a) - mean(b)) / sp if sp else 0.0


class RenyoChecker:
    """Decide whether a noun surface is a verb renyo (deverbal) form by
    trying to find a verb whose renyo surface equals it."""

    def __init__(self):
        self.tok = Dictionary().create()
        self.cache: dict[str, bool] = {}

    def _is_verb(self, s: str) -> bool:
        ms = self.tok.tokenize(s)
        return len(ms) == 1 and ms[0].part_of_speech()[0] == "動詞"

    def check(self, surface: str) -> bool:
        if surface in self.cache:
            return self.cache[surface]
        ok = False
        if len(surface) >= 2 and surface[-1] in HIRAGANA and surface[-1] != "ん":
            if self._is_verb(surface + "る"):
                ok = True  # ichidan or -ru godan
            else:
                u = I_TO_U.get(surface[-1])
                if u and self._is_verb(surface[:-1] + u):
                    ok = True
        self.cache[surface] = ok
        return ok


def ud_depth(sent) -> int:
    depth = 0
    for t in sent:
        d = 0
        h = t
        while h.head.i != h.i and d < 40:
            d += 1
            h = h.head
        depth = max(depth, d)
    return depth


def ending_category(sent) -> str:
    toks = [t for t in sent if t.tag_ != "補助記号-句点" and t.text not in "。」！？!?)）"]
    if not toks:
        return "empty"
    t = toks[-1]
    tag, lemma = t.tag_, t.lemma_
    if tag.startswith("助動詞"):
        if lemma in ("です", "だ", "である", "ます", "た", "ない", "れる", "せる", "たい"):
            return f"aux:{lemma}"
        return "aux:other"
    if tag.startswith("動詞"):
        return "verb"
    if tag.startswith("形容詞"):
        return "adj"
    if tag.startswith("名詞") or tag.startswith("代名詞") or tag.startswith("形状詞"):
        return "noun_final"
    if tag.startswith("助詞"):
        return "particle_final"
    return "other"


def has_no_modifier(noun_tok) -> bool:
    for c in noun_tok.children:
        if c.dep_ in ("nmod", "compound") and any(cc.text == "の" for cc in c.children):
            return True
    return False


def no_chain_depth(tok) -> int:
    """length of consecutive の-marked nominal ancestors above tok."""
    d = 0
    t = tok
    while t.dep_ in ("nmod", "compound") and any(c.text == "の" for c in t.children) and d < 10:
        d += 1
        t = t.head
    return d


def measure_member(path: Path, nlp, md: MarkdownIt, checker: RenyoChecker) -> dict:
    raw = path.read_text(encoding="utf-8")
    rel = path.relative_to(SLOPS).as_posix()
    author = AUTHOR_OVERRIDES.get(rel) or classify_author(raw, path)
    lines = raw.splitlines()
    tokens = md.parse(raw)

    blocks = []
    area = Counter()
    headings = []
    for kind, text, extra in iter_blocks(tokens, lines):
        if kind in ("code", "html", "svg"):
            area[kind] += extra
            continue
        text = ALERT_MARK_RE.sub("", text).strip()
        if not text:
            continue
        blocks.append((kind, text))
        if kind == "heading":
            headings.append((extra, len(text)))
        elif kind in ("list_item", "table_cell", "blockquote"):
            area[kind] += len(text)

    prose_kinds = {"paragraph", "list_item", "blockquote"}
    prose_texts = [t for k, t in blocks if k in prose_kinds]
    prose_chars = sum(len(t) for t in prose_texts)

    # document-level: section char CV over h2 (or h1) boundaries on prose text
    section_chars, cur = [], 0
    for kind, text in blocks:
        if kind == "heading":
            if cur:
                section_chars.append(cur)
            cur = 0
        elif kind in prose_kinds:
            cur += len(text)
    if cur:
        section_chars.append(cur)

    heading_levels = [lv for lv, _ in headings]
    head_skips = sum(1 for a, b in zip(heading_levels, heading_levels[1:]) if b - a > 1)

    # parse prose blocks
    sent_lens_tok, sent_lens_char = [], []
    bunsetu_counts, clause_counts, depths, arc_lens = [], [], [], []
    counters = Counter()
    endings = Counter()
    topics = []  # per-sentence topic lemma or None
    para_sent_counts, para_chars = [], []

    prose_blocks = [(k, t) for k, t in blocks if k in prose_kinds]
    docs = list(nlp.pipe([t for _, t in prose_blocks]))
    for (kind, text), doc in zip(prose_blocks, docs):
        bstarts = {s.start for s in ginza.bunsetu_spans(doc)}
        clauses = doc.user_data.get("clauses", {}) or {}
        for sent in doc.sents:
            stoks = [t for t in sent]
            if not stoks:
                continue
            sent_lens_tok.append(len(stoks))
            sent_lens_char.append(len(sent.text))
            nb = sum(1 for b in bstarts if sent.start <= b < sent.end)
            bunsetu_counts.append(nb)
            nc = sum(1 for k in clauses if sent.start <= k < sent.end)
            clause_counts.append(nc or 1)
            depths.append(ud_depth(sent))
            arcs = [abs(t.i - t.head.i) for t in sent if t.dep_ not in ("punct", "ROOT")]
            arc_lens.append(mean(arcs))
            counters["long_arc"] += sum(1 for a in arcs if a > 8)

            topic = None
            has_nsubj = False
            for t in sent:
                if t.pos_ == "NOUN":
                    counters["noun"] += 1
                    if "サ変可能" in t.tag_:
                        counters["sahen_noun"] += 1
                    elif t.tag_.startswith("名詞-普通名詞-一般") and t.text not in RENYO_STOP and checker.check(t.text):
                        counters["renyo_noun"] += 1
                        if has_no_modifier(t):
                            counters["renyo_no"] += 1
                if t.text == "の" and t.dep_ == "case":
                    counters["no_case"] += 1
                    d = no_chain_depth(t.head)
                    counters["no_chain_max"] = max(counters["no_chain_max"], d)
                    if d >= 2:
                        counters["no_chain2"] += 1
                if t.text == "、":
                    counters["comma"] += 1
                    if t.i + 1 in bstarts or t.i + 1 >= len(doc):
                        counters["comma_boundary"] += 1
                if t.dep_ in ("nsubj", "csubj"):
                    has_nsubj = True
                    counters["nsubj"] += 1
                    if t.lemma_ not in ANIMATE_NOUNS and t.pos_ in ("NOUN", "PRON"):
                        counters["inanim_nsubj"] += 1
                        if t.head.pos_ == "VERB" and t.head.lemma_ not in LIGHT_VERBS:
                            counters["inanim_action"] += 1
                if t.dep_ == "acl":
                    counters["acl_noun"] += 1
                    nsub = len(list(t.subtree))
                    counters["acl_len_total"] += nsub
                    if nsub >= 5:
                        counters["acl_long"] += 1
                if t.dep_ in ("advcl", "acl", "ccomp", "xcomp"):
                    counters["dep_clause"] += 1
                if t.pos_ == "CCONJ" or t.tag_.startswith("接続詞"):
                    counters["conj"] += 1
                if t.tag_ == "補助記号-括弧開":
                    counters["paren"] += 1
                if t.pos_ == "NOUN" and t.lemma_ in FORMAL_NOUNS:
                    counters["formal_noun"] += 1
                if t.tag_.startswith("動詞") and "連用形" in str(t.morph):
                    if t.i + 1 < len(doc) and doc[t.i + 1].text == "、":
                        counters["renyo_comma"] += 1
                if t.text in ("て", "で") and t.head.pos_ in ("VERB", "AUX") and t.i + 1 < len(doc) and doc[t.i + 1].text != "。":
                    counters["te_chain"] += 1
                if topic is None and any(c.text == "は" for c in t.children):
                    topic = t.lemma_
            if has_nsubj:
                counters["sents_with_nsubj"] += 1
            topics.append(topic)
            endings[ending_category(sent)] += 1

            # noun stacking: consecutive NOUN tokens (の/compound links don't break
            # the run only for compound; a bare run of NOUN tokens = stacked compound)
            run = 0
            for t in stoks:
                if t.pos_ == "NOUN" and (run == 0 or t.dep_ in ("compound", "nmod")):
                    run += 1
                else:
                    if run >= 3:
                        counters["noun_run3"] += 1
                    run = 0
            if run >= 3:
                counters["noun_run3"] += 1
        if kind == "paragraph":
            para_sent_counts.append(len(list(doc.sents)))
            para_chars.append(len(text))

    counters["meta"] = sum(len(META_RE.findall(t)) for t in prose_texts)
    counters["xref"] = sum(len(XREF_RE.findall(t)) for t in prose_texts)

    tpair = [(a, b) for a, b in zip(topics, topics[1:]) if a and b]
    switches = sum(1 for a, b in tpair if a != b)

    # ending distribution
    end_total = sum(endings.values()) or 1
    end_top = endings.most_common(1)[0][1] / end_total if endings else 0.0
    ent = -sum((c / end_total) * math.log2(c / end_total) for c in endings.values())

    return {
        "member": rel,
        "author": author,
        "raw_chars": len(raw),
        "prose_chars": prose_chars,
        "n_sents": len(sent_lens_tok),
        "sent_tok_mean": mean(sent_lens_tok),
        "sent_tok_std": std(sent_lens_tok),
        "sent_tok_skew": skew(sent_lens_tok),
        "sent_char_mean": mean(sent_lens_char),
        "sent_char_std": std(sent_lens_char),
        "sent_char_skew": skew(sent_lens_char),
        "bunsetu_per_sent": mean(bunsetu_counts),
        "bunsetu_max": max(bunsetu_counts, default=0),
        "tok_per_bunsetu": mean(sent_lens_tok) / mean(bunsetu_counts) if bunsetu_counts and mean(bunsetu_counts) else 0.0,
        "clauses_per_sent": mean(clause_counts),
        "dep_depth_mean": mean(depths),
        "dep_depth_max": max(depths, default=0),
        "arc_len_mean": mean(arc_lens),
        "nsubj_sent_rate": counters["sents_with_nsubj"] / max(1, len(sent_lens_tok)),
        "inanim_action_share": counters["inanim_action"] / counters["nsubj"] if counters["nsubj"] else 0.0,
        "acl_len_mean": counters["acl_len_total"] / counters["acl_noun"] if counters["acl_noun"] else 0.0,
        "topic_switch_rate": switches / len(tpair) if tpair else None,
        "comma_boundary_rate": counters["comma_boundary"] / counters["comma"] if counters["comma"] else None,
        "sahen_share_of_noun": counters["sahen_noun"] / counters["noun"] if counters["noun"] else 0.0,
        "no_chain_max": counters["no_chain_max"],
        "end_top_share": end_top,
        "end_entropy": ent,
        "end_verb_rate": endings.get("verb", 0) / end_total,
        "end_ta_rate": endings.get("aux:た", 0) / end_total,
        "end_noun_rate": endings.get("noun_final", 0) / end_total,
        "endings": dict(endings),
        "kanji_rate": len(KANJI_RE.findall("".join(prose_texts))) / prose_chars if prose_chars else 0,
        "katakana_rate": len(KATAKANA_RE.findall("".join(prose_texts))) / prose_chars if prose_chars else 0,
        "latin_rate": len(LATIN_RE.findall("".join(prose_texts))) / prose_chars if prose_chars else 0,
        "para_sent_mean": mean(para_sent_counts),
        "para_sent_std": std(para_sent_counts),
        "para_char_mean": mean(para_chars),
        "para_char_std": std(para_chars),
        "para_char_cv": cv(para_chars),
        "n_headings": len(headings),
        "head_skips": head_skips,
        "section_char_cv": cv(section_chars) if len(section_chars) > 1 else None,
        "area": dict(area),
        "counts": {k: v for k, v in counters.items() if k != "no_chain_max"},
    }


# ---------- aggregation ----------

DENSITY_KEYS = [
    ("sahen_noun", "サ変名詞"),
    ("renyo_noun", "連用形名詞(推定)"),
    ("renyo_no", "うち「の+連用形」"),
    ("no_case", "格助詞「の」"),
    ("no_chain2", "「の」連結>=2"),
    ("comma", "読点"),
    ("comma_boundary", "読点@文節末"),
    ("renyo_comma", "連用形+読点"),
    ("te_chain", "て形接続"),
    ("dep_clause", "従属節(dep)"),
    ("long_arc", "長距離係り(>8tok)"),
    ("nsubj", "主語(nsubj)"),
    ("inanim_nsubj", "無生物主語(推定)"),
    ("inanim_action", "無生物主語+動作動詞"),
    ("acl_noun", "連体修飾節(acl)"),
    ("acl_long", "長い連体修飾(>=5tok)"),
    ("noun_run3", "名詞3連積み上げ"),
    ("conj", "接続詞"),
    ("formal_noun", "形式名詞"),
    ("paren", "括弧(開)"),
    ("meta", "メタ表現"),
    ("xref", "番号相互参照"),
]

MEAN_KEYS = [
    ("sent_char_mean", "文長(字)平均"),
    ("sent_char_std", "文長(字)標準偏差"),
    ("sent_char_skew", "文長(字)歪度"),
    ("sent_tok_mean", "文長(形態素)平均"),
    ("bunsetu_per_sent", "文節数/文"),
    ("tok_per_bunsetu", "形態素/文節"),
    ("clauses_per_sent", "節数/文"),
    ("dep_depth_mean", "係受け深さ平均"),
    ("dep_depth_max", "係受け深さ最大"),
    ("arc_len_mean", "係り距離平均"),
    ("kanji_rate", "漢字率"),
    ("katakana_rate", "カタカナ率"),
    ("latin_rate", "英字率"),
    ("nsubj_sent_rate", "主語出現率/文"),
    ("inanim_action_share", "無生物+動作動詞/主語"),
    ("acl_len_mean", "連体修飾節の長さ"),
    ("topic_switch_rate", "主題交代率"),
    ("comma_boundary_rate", "読点位置一致率"),
    ("sahen_share_of_noun", "サ変/名詞比"),
    ("end_top_share", "文末トップ共有率"),
    ("end_entropy", "文末エントロピー"),
    ("end_verb_rate", "文末:動詞止め率"),
    ("end_ta_rate", "文末:「た」終わり率"),
    ("end_noun_rate", "文末:体言止め率"),
    ("para_char_mean", "段落長(字)平均"),
    ("para_char_cv", "段落長CV"),
    ("para_sent_mean", "文数/段落"),
    ("section_char_cv", "セクション長CV"),
    ("head_skips", "見出しレベル飛び"),
    ("no_chain_max", "「の」連結最大"),
]

AUTHORS = ["devin", "claude", "codex", "opencode", "unknown"]
NICE = {"devin": "Devin", "claude": "Claude", "codex": "Codex", "opencode": "opencode", "unknown": "不明"}


def aggregate(members):
    by = {}
    for a in AUTHORS:
        ms = [m for m in members if m["author"] == a]
        counts = Counter()
        for m in ms:
            counts.update(m["counts"])
        agg = {
            "members": ms,
            "n": len(ms),
            "prose_chars": sum(m["prose_chars"] for m in ms),
            "raw_chars": sum(m["raw_chars"] for m in ms),
            "n_sents": sum(m["n_sents"] for m in ms),
            "counts": counts,
            "area": Counter({k: sum(m["area"].get(k, 0) for m in ms) for k in ("code", "svg", "html", "list_item", "table_cell", "blockquote")}),
        }
        by[a] = agg
    return by


def main():
    nlp = spacy.load("ja_ginza")
    md = MarkdownIt("commonmark").enable("table")
    checker = RenyoChecker()

    paths = sorted(
        p for p in SLOPS.rglob("*.md") if p.is_file()
    )
    members = []
    for p in paths:
        try:
            members.append(measure_member(p, nlp, md, checker))
        except Exception as e:
            print(f"!! {p.relative_to(SLOPS)}: {e}", file=sys.stderr)
            raise
    OUT.mkdir(exist_ok=True)
    (OUT / "members.jsonl").write_text(
        "\n".join(json.dumps(m, ensure_ascii=False) for m in members), encoding="utf-8"
    )

    by = aggregate(members)
    rep = render(members, by)
    (OUT / "report.md").write_text(rep, encoding="utf-8")
    print(rep)


def render(members, by) -> str:
    out = []
    out.append("| | メンバー数 | 総prose字数 | 総文数 |")
    out.append("|---|---|---|---|")
    for a in AUTHORS:
        g = by[a]
        out.append(f"| {NICE[a]} | {g['n']} | {g['prose_chars']:,} | {g['n_sents']} |")
    tot_pc = sum(by[a]["prose_chars"] for a in AUTHORS)
    tot_s = sum(by[a]["n_sents"] for a in AUTHORS)
    out.append(f"| 全体 | {len(members)} | {tot_pc:,} | {tot_s} |")

    # density table (per 1000 prose chars)
    out.append("\n### 密度 (件/千prose字)")
    out.append("| 特徴量 | " + " | ".join(NICE[a] for a in AUTHORS) + " | claude-devin d |")
    out.append("|---|" + "---|" * (len(AUTHORS) + 1))
    d_col = []
    for key, label in DENSITY_KEYS:
        row = [label]
        vals = {}
        for a in AUTHORS:
            g = by[a]
            v = g["counts"][key] * 1000.0 / g["prose_chars"] if g["prose_chars"] else 0
            row.append(f"{g['counts'][key]} ({v:.2f})")
            vals[a] = [m["counts"].get(key, 0) * 1000.0 / m["prose_chars"] for m in g["members"] if m["prose_chars"]]
        d = cohens_d(vals["claude"], vals["devin"])
        d_col.append((label, key, d, vals))
        row.append(f"{d:+.2f}")
        out.append("| " + " | ".join(row) + " |")

    # area ratio (region chars / raw chars)
    out.append("\n### 構造面積比 (領域字/全字 %)")
    out.append("| | " + " | ".join(NICE[a] for a in AUTHORS) + " |")
    out.append("|---|" + "---|" * len(AUTHORS))
    for k, label in (("code", "コード"), ("svg", "svg図"), ("list_item", "箇条書き"), ("table_cell", "表セル"), ("blockquote", "引用"), ("html", "html")):
        row = [label]
        for a in AUTHORS:
            g = by[a]
            v = g["area"][k] * 100.0 / g["raw_chars"] if g["raw_chars"] else 0
            row.append(f"{v:.1f}%")
        out.append("| " + " | ".join(row) + " |")

    # mean/rate table: per-author member-mean and pooled
    out.append("\n### 平均・割合系 (メンバー平均 [プール値])")
    out.append("| 特徴量 | " + " | ".join(NICE[a] for a in AUTHORS) + " | claude-devin d |")
    out.append("|---|" + "---|" * (len(AUTHORS) + 1))
    for key, label in MEAN_KEYS:
        row = [label]
        vals = {}
        for a in AUTHORS:
            xs = [m[key] for m in by[a]["members"] if m.get(key) is not None]
            vals[a] = xs
            pooled = mean(xs)
            row.append(f"{pooled:.2f}")
        d = cohens_d(vals["claude"], vals["devin"])
        d_col.append((label, key, d, vals))
        row.append(f"{d:+.2f}")
        out.append("| " + " | ".join(row) + " |")

    # ending distribution
    out.append("\n### 文末カテゴリ (文に対する割合)")
    cats = sorted({c for m in members for c in m["endings"]}, key=lambda c: -sum(m["endings"].get(c, 0) for m in members))
    out.append("| | " + " | ".join(NICE[a] for a in AUTHORS) + " |")
    out.append("|---|" + "---|" * len(AUTHORS))
    for c in cats[:12]:
        row = [c]
        for a in AUTHORS:
            ms = by[a]["members"]
            tot = sum(sum(m["endings"].values()) for m in ms) or 1
            v = sum(m["endings"].get(c, 0) for m in ms) * 100.0 / tot
            row.append(f"{v:.1f}%")
        out.append("| " + " | ".join(row) + " |")

    # separation ranking over all features, claude-high first then devin-high
    out.append("\n### 分離度ランキング (claude 平均 vs devin 平均の d)")
    rows = []
    for label, key, d, vals in d_col:
        cm, dm = mean(vals["claude"]), mean(vals["devin"])
        others_max = max(mean(vals[a]) for a in AUTHORS if a not in ("claude", "devin") and vals[a])
        rows.append((d, label, cm, dm, cm > others_max, key))
    out.append("claude が高い順:")
    for d, label, cm, dm, uni, key in sorted(rows, reverse=True):
        mark = " ★" if uni and cm > dm else ""
        out.append(f"- {label}: claude={cm:.2f} devin={dm:.2f} (d={d:+.2f}){mark}")
    out.append("\n逆方向 (devin が高い) 上位:")
    for d, label, cm, dm, uni, key in sorted(rows)[:8]:
        out.append(f"- {label}: devin={dm:.2f} claude={cm:.2f} (d={d:+.2f})")
    return "\n".join(out) + "\n"


if __name__ == "__main__":
    main()
