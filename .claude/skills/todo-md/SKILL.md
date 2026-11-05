---
name: todo-md
description: Maintaining html-sandbox's task tracker (TODO.md + TODO-archive.md). Use whenever you add a task, complete or partially complete one, or re-apply TODO.md changes across merges/rebases.
---

# TODO.md upkeep

## Files

- `TODO.md` — actionable work only: `[ ]` open, `[-]` partially done.
- `TODO-archive.md` — append-only flat log of completed entries.

## Adding a task

Append `- [ ]` under `## To Be Implemented`: a bold title, 1–3 sentences of
what remains, and links (design docs under `docs/` such as
`docs/ja/design.md`, issues/PRs). Bugs found mid-task get an entry too. Never write done-work narratives here.

## Completing a task

In the PR that lands the work, mark the entry `- [x]` and leave it —
deleting it outright is also fine. Completed children of a still-open `[-]`
parent are marked the same way; the parent stays until its last open child
resolves.

**Do not edit `TODO-archive.md` in a feature PR.** Consolidation is
asynchronous so the archive can never conflict between branches.

## GC: consolidating completed entries

Run whenever `[x]` entries accumulate in `TODO.md` — any session may do it
(e.g. at the end of a work round); there is no fixed schedule. For each
`[x]` entry in `TODO.md`:

1. Delete it from `TODO.md`.
2. Append it to the **end** of `TODO-archive.md` as **one physical line per
   item**, so `rg <word>` on any word of any item returns a line that also
   names every ancestor:
   - Start the line with `- [x] `, then the ancestor chain, then the item:
     `- [x] A > B > **C**: ...`. Ancestors are their title text only (no
     `[ ]`/`[-]` marker, no bold); the item keeps its own text as written.
     A top-level item has no chain. If an ancestor's title has drifted,
     use its current text — the GC pass is where such drift gets
     reconciled.
   - Join the item's wrapped lines into that one line with spaces. Keep
     the wording and links verbatim.
   - Never archive a subtree. A completed parent with `[x]` children goes
     first without them; each child, grandchild, … follows as its own
     line, in document order.
   - Plain `- ` notes without a checkbox (`完了の条件:`, `決めること:`) get
     the same treatment without the checkbox: `- A > 完了の条件: ...`.

   ```markdown
   <!-- TODO.md -->
   - [x] **A**: one
     two.
     - [x] **B**: ...
     - [x] **C**: ...
       - [x] **D**: ...
     - 完了の条件: ...

   <!-- appended to TODO-archive.md -->
   - [x] **A**: one two.
   - [x] A > **B**: ...
   - [x] A > **C**: ...
   - [x] A > C > **D**: ...
   - A > 完了の条件: ...
   ```

Only GC writes to `TODO-archive.md`, so the file stays append-only and
conflict-free.

## Reading the archive

Never read it whole. `rg <symbol>` returns the matching item with its
ancestor chain on the same line. Entries archived before the one-line rule
still span several lines with `> parent:` context lines; for those, read
the surrounding window (`rg -C 20`, or an offset read).

## Porting this scheme to another repo

Reference starters are bundled:
[example-TODO.md](example-TODO.md) /
[example-TODO-archive.md](example-TODO-archive.md). They ship under
`example-*` names so nothing reads them as the live files day to day.

See [why.md](why.md) for the background of this scheme.
