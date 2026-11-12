#!/usr/bin/env python3
"""Genre-confound check for the author aggregation (issue #172).

Articles are classified by purpose (書かれた目的) using the table in
slops/2026-11-05-slops-use-case-templates.md/01-use-cases.md; articles
published after that table get provisional labels marked with '*'.

Reads out/members.jsonl and reports per-(genre, author) stats for the key
features, so we can see whether the claude-high metrics are driven by
author or by genre.
"""

from __future__ import annotations

import json
import math
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"

# genre from 01-use-cases.md; '*' = provisional classification by this script
GENRE = {
    "2026-10-14-hello.md": "記法の見本",
    "2026-10-15-tinymarkdown.md": "記法の見本",
    "2026-10-16-mobile-first.md": "変更の報告",
    "2026-10-17-workers-wasm.md": "変更の報告",
    "2026-10-18-moonbit.md": "変更の報告",
    "2026-10-19-moonbit-memory.md": "変更の報告",
    "2026-10-20-moonbit-http.md": "変更の報告",
    "2026-10-21-moonbit-browser.md": "詰まった経緯",
    "2026-10-22-bundle-demo.md": "記法の見本",
    "2026-10-22-bundle.md": "変更の報告",
    "2026-10-24-alerts.md": "変更の報告",
    "2026-10-25-permalink.md": "変更の報告",
    "2026-10-25-preview.md": "変更の報告",
    "2026-10-26-draw-svg-with-llm.md": "実験・比較",
    "2026-10-27-pkg-graph.md": "実験・比較",
    "2026-10-27-redraw-novel-figures.md": "実験・比較",
    "2026-10-27-writing-slops.md": "書き方そのもの",
    "2026-10-28-listen.md": "変更の報告",
    "2026-10-28-workers-subrequest-limit.md": "詰まった経緯",
    "2026-10-29-details.md": "変更の報告",
    "2026-10-30-pi-sarashina-dogfooding.md": "任せた作業の記録",
    "2026-10-31-footnotes.md": "変更の報告",
    "2026-10-31-svg-gen-figures.md": "実験・比較",
    "2026-11-01-chart-gen.md": "実験・比較",
    "2026-11-03-dads-illustration-lora.md": "実現性の調査",
    "2026-11-03-gom-squad-experiment.md": "他人の成果物を読む",
    "2026-11-03-html-report-variations.md": "実験・比較",
    "2026-11-03-silence-as-consent.md": "主張の検討",
    "2026-11-03-unslop-dads-reports.md": "実験・比較",
    "2026-11-05-answers-under-constraints.md": "主張の検討",
    "2026-11-05-reading-slops-again.md": "書き方そのもの",
    "2026-11-05-slops-use-case-templates.md": "書き方そのもの",
    "2026-11-05-good-slops-for-requester.md": "主張の検討*",
    "2026-11-05-skill-for-new-articles.md": "書き方そのもの*",
    "2026-11-07-delaunay-voronoi.md": "実験・比較*",
    "2026-11-07-investigation-note-skill.md": "書き方そのもの*",
    "2026-11-07-numbered-lists.md": "変更の報告*",
    "2026-11-11-moonbit-sum-types.md": "変更の報告*",
    "2026-11-12-what-the-lint-missed.md": "主張の検討*",
}

# (key, label, mode) — mode: "density" = counts[key]*1000/prose_chars, "field" = member field
FEATURES = [
    ("comma", "読点", "density"),
    ("comma_boundary", "読点@文節末", "density"),
    ("renyo_comma", "連用形+読点", "density"),
    ("te_chain", "て形接続", "density"),
    ("clauses_per_sent", "節数/文", "field"),
    ("bunsetu_per_sent", "文節数/文", "field"),
    ("sent_char_mean", "文長(字)平均", "field"),
    ("sent_char_std", "文長(字)標準偏差", "field"),
    ("dep_depth_mean", "係受け深さ平均", "field"),
    ("end_ta_rate", "文末:た率", "field"),
    ("end_noun_rate", "文末:体言止め率", "field"),
    ("sahen_noun", "サ変名詞", "density"),
    ("inanim_action", "無生物主語+動作動詞", "density"),
    ("formal_noun", "形式名詞", "density"),
    ("conj", "接続詞", "density"),
    ("noun_run3", "名詞3連積み上げ", "density"),
]

AUTHORS = ["devin", "claude", "codex", "opencode", "unknown"]
NICE = {"devin": "devin", "claude": "claude", "codex": "codex", "opencode": "opencode", "unknown": "不明"}


def mean(xs):
    return sum(xs) / len(xs) if xs else 0.0


def std(xs):
    if len(xs) < 2:
        return 0.0
    m = mean(xs)
    return math.sqrt(sum((x - m) ** 2 for x in xs) / (len(xs) - 1))


def cohens_d(a, b):
    na, nb = len(a), len(b)
    if na < 2 or nb < 2:
        return 0.0
    sp = math.sqrt(((na - 1) * std(a) ** 2 + (nb - 1) * std(b) ** 2) / (na + nb - 2))
    return (mean(a) - mean(b)) / sp if sp else 0.0


def value(m, key, mode):
    if mode == "density":
        return m["counts"].get(key, 0) * 1000.0 / m["prose_chars"] if m["prose_chars"] else 0.0
    return m.get(key)


def main():
    members = [json.loads(l) for l in (OUT / "members.jsonl").read_text().splitlines()]
    for m in members:
        article = m["member"].split("/")[0]
        m["genre"] = GENRE.get(article, "?")

    # ---- 1. genre x author composition ----
    print("## genre × author のメンバー数 (* はこのスクリプトでの仮分類)\n")
    genres = sorted({m["genre"] for m in members}, key=lambda g: -sum(1 for m in members if m["genre"] == g))
    print("| genre | " + " | ".join(NICE[a] for a in AUTHORS) + " |")
    print("|---|" + "---|" * len(AUTHORS))
    for g in genres:
        row = [g]
        for a in AUTHORS:
            n = sum(1 for m in members if m["genre"] == g and m["author"] == a)
            row.append(str(n) if n else "")
        print("| " + " | ".join(row) + " |")

    # ---- 2. per-genre means for each feature (devin vs claude) ----
    print("\n## genre 内での devin vs claude (メンバー平均)")
    for key, label, mode in FEATURES:
        print(f"\n### {label}")
        print("| genre | devin (n) | claude (n) | d |")
        print("|---|---|---|---|")
        for g in genres:
            dv = [value(m, key, mode) for m in members if m["genre"] == g and m["author"] == "devin" and value(m, key, mode) is not None]
            cv_ = [value(m, key, mode) for m in members if m["genre"] == g and m["author"] == "claude" and value(m, key, mode) is not None]
            if not dv and not cv_:
                continue
            d = cohens_d(cv_, dv)
            print(f"| {g} | {mean(dv):.2f} ({len(dv)}) | {mean(cv_):.2f} ({len(cv_)}) | {d:+.2f} |")

    # ---- 3. matched-genre control: 変更の報告 only, all metrics ----
    print("\n## 統制: 「変更の報告」内だけの集計 (全指標)")
    subset = [m for m in members if m["genre"] == "変更の報告"]
    dv = [m for m in subset if m["author"] == "devin"]
    cv_ = [m for m in subset if m["author"] == "claude"]
    print(f"\n変更の報告: devin {len(dv)} メンバー, claude {len(cv_)} メンバー\n")
    print("| 特徴量 | devin | claude | d |")
    print("|---|---|---|---|")
    for key, label, mode in FEATURES:
        a = [value(m, key, mode) for m in dv if value(m, key, mode) is not None]
        b = [value(m, key, mode) for m in cv_ if value(m, key, mode) is not None]
        print(f"| {label} | {mean(a):.2f} | {mean(b):.2f} | {cohens_d(b, a):+.2f} |")

    # ---- 4. genre means ignoring author ----
    print("\n## genre ごとの平均 (著者をまとめたもの) — 特徴量が genre を反映するか")
    print("| genre | n | " + " | ".join(l for _, l, _ in FEATURES[:8]) + " |")
    print("|---|---|" + "---|" * 8)
    for g in genres:
        ms = [m for m in members if m["genre"] == g]
        row = [g, str(len(ms))]
        for key, label, mode in FEATURES[:8]:
            row.append(f"{mean([value(m, key, mode) for m in ms if value(m, key, mode) is not None]):.2f}")
        print("| " + " | ".join(row) + " |")


if __name__ == "__main__":
    main()
