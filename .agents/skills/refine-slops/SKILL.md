---
name: refine-slops
description: Refine the prose of an existing article in html-sandbox's slops/, using kuden's writing criteria as the baseline and, on request, yomiyasu's lint findings (negative_parallelism and its density rule), without changing facts, claims, or format. Use when asked to refine or polish an existing slops article.
---

# Refine slops articles

This skill polishes the prose of an article that already exists in
`slops/` (a single `.md` or a bundle). It changes sentences, not
content. Format limits, bundle layout, and output checks follow
[write-slops](../write-slops/SKILL.md); read it first.

## Baseline criteria

Read the writing skill at
`~/ghq/github.com/shokai/agent-skills/.claude/skills/writing/SKILL.md`
and apply it to the article's prose. Its rules target interpretation
blur rather than vocabulary: write a bad thing with a predicate that
shows what is lost, finish purpose clauses, resolve which clause a
reason attaches to, and rework sentences instead of leaning on
emphasis or parenthetical asides. If that file is missing, stop and
say which checkout is missing instead of refining from memory.

## The pass

1. Read the whole article once as a first-time reader (the bundle face
   first for a bundle, then every `.md` member) and list the sentences
   where the reading stalls or splits: an ambiguous purpose or
   attachment, a claim that reads as its opposite, a restatement of
   what the reader already has, a reference that dies when the
   surrounding text changes.
2. Rewrite each listed sentence in place, one at a time, checking the
   result in the surrounding context — a sentence moved or tightened
   must still mean what it meant where it now sits.
3. Preserve, in every edit: the claim, the weight given to each point,
   the assertiveness (stated vs. hedged vs. reported), and each
   sentence's role (evaluation, explanation, request, plan). A rewrite
   that fails one of these is discarded; the original stays and the
   spot is reported instead.
4. Verify with `tools/slops-fmt` and a render check, as write-slops
   describes, then report which spots changed and which candidates
   were kept with reasons.

## What stays untouched

- Front matter values, code fences, `svg` fences, tables, link
  targets, filenames and member order, and the `> 執筆:` attribution —
  refining is not authoring.
- Facts, numbers, observed results, and the boundary between what was
  asked, what was observed, and what was decided (per write-slops). Do
  not add content the article does not state to make a sentence
  smoother; if a sentence cannot be recovered from context, leave it
  and ask.

## Option: yomiyasu lint pass

When the user asks for the lint pass or names these rules, run the
lint on each prose member:

```
python3 ~/ghq/github.com/nanaism/yomiyasu/scripts/yomiyasu_lint.py --doc-type article <file>
```

- Act on `negative_parallelism` and `negative_parallelism_density`.
  Add other rules only when the user names them.
- A `negative_parallelism` hit is a candidate, not a fix order: drop
  the "AではなくB" frame only where removing the negation leaves the
  claim unchanged. Negation that corrects a likely misreading or
  carries contrastive weight stays.
- `negative_parallelism_density` is document-level: it fires once the
  pattern is frequent enough to read as a tic rather than a choice.
  Use it to decide which of the per-line hits are worth rewriting; it
  is not a count to zero out.
- Report remaining hits the pass left alone, with the reason each was
  kept.

## Re-running on the same article

When refining an article again, commit the current state before
rewriting, then commit the refined text afterwards. The before/after
diff of a pass must be reviewable on its own: unrelated edits or an
earlier pass's output must not mix into the same commit.
