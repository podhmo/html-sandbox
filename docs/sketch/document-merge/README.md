# document-merge trials

What happens when the article merge done by hand in #143 is run again with each of three draft `document-merge` skills (issue #146)?

## Setup

- **Inputs**: the four articles as they were at commit 96f82be, just before the manual merge:
  - `slops/2026-11-07-investigation-notes-skill.md/` (Claude, #138)
  - `slops/2026-11-07-exploration-notes-from-issue-133.md/` (Codex, #139)
  - `slops/2026-11-07-write-slops-investigation-notes.md` (Gemini, #140)
  - `slops/2026-11-07-merge-investigation-note-skill.md` (the merge article before its rewrite)
- **Prompt**: the user message from the manual merge, verbatim (it also names `/write-slops-investigation-note`):

  > 改めて考えてみると今日の3つのモデルが書いた記事は通常なら候補として隠れてPRのコミットの中にだけ隠される記事だった気がする。 2026-11-07-investigation-notes-skill.md, 2026-11-07-exploration-notes-from-issue-133.md, 2026-11-07-write-slops-investigation-notes.md, 2026-11-07-merge-investigation-note-skill.mdこれらの記事は経緯も含めて 2026-11-07-merge-investigation-note-skill.md にまとめられるべきな気がする。 /write-slops-investigation-note の形式に沿って一つの記事にまとめて欲しい。

- **Skills** (copied verbatim from the issue comments):
  - [skills/draft1](skills/draft1/SKILL.md) — [#146 comment 6709337524](https://github.com/podhmo/html-sandbox/issues/146#issuecomment-6709337524). Union of all content, reorganized by premise order.
  - [skills/draft2](skills/draft2/SKILL.md) + [references/examples.md](skills/draft2/references/examples.md) — [#146 comment 6720905775](https://github.com/podhmo/html-sandbox/issues/146#issuecomment-6720905775). Picks a theme, selects a main line from it, leftovers become asides. (The comment labels the reference file `references/example.md`; the SKILL.md refers to `references/examples.md`, which is the name used here.)
  - [skills/draft3](skills/draft3/SKILL.md) — [#146 comment 6720948134](https://github.com/podhmo/html-sandbox/issues/146#issuecomment-6720948134). English; outputs only the integrated document by default.
- **How each trial ran**: a git worktree at 96f82be with the draft installed as `.agents/skills/document-merge/`, and a fresh agent (no context beyond [trial-prompt.md](trial-prompt.md)) told that the user invoked `/document-merge` with the prompt above. It ran to completion without asking; questions the skill would have asked are listed in its reply. It was barred from anything after 96f82be (PRs/issues #141+, other branches), so it could not see the manual result.
- **Reference result**: the manual merge, `slops/2026-11-07-investigation-note-skill.md/` on main (#143).

## Running a trial (any agent)

From the repository root, for each draft:

```sh
DRAFT=draft1                      # draft1 | draft2 | draft3
WT=/tmp/html-sandbox/trial-$DRAFT # anywhere outside the repo
git worktree add -b trial-$DRAFT "$WT" 96f82be
cp -R docs/sketch/document-merge/skills/$DRAFT "$WT/.agents/skills/document-merge"
```

Then start the agent fresh with [trial-prompt.md](trial-prompt.md) (fill in `<DRAFT>` and `<WT>`).
The worktree at 96f82be contains neither the other drafts nor the manual result.

Collect the outcome into `results/<agent>-<draft>/` (e.g. `results/claude-draft1/`):

- `reply.md` — the agent's final reply (merge report, open questions)
- `files.txt` — `git -C "$WT" diff --stat 96f82be`
- the merged article as committed in the worktree (`slops/2026-11-07-merge-investigation-note-skill.md`, a file or a bundle directory)

## Results

See `results/`.
