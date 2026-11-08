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
- **How a trial runs**: a git worktree at 96f82be with the draft installed as `.agents/skills/document-merge/`, and a fresh agent (no context beyond [trial-prompt.md](trial-prompt.md)) told that the user invoked `/document-merge` with the prompt above. It ran to completion without asking; questions the skill would have asked are listed in its reply. It may use anything the environment offers (git history, issues, PRs) except material that already holds an answer: the manual result (#143, #144, the article on main), the draft discussion (#146), and other trials.
- **Reference result**: the manual merge, `slops/2026-11-07-investigation-note-skill.md/` on main (#143).

## Running a trial (any agent)

From the repository root, for each draft:

```sh
AGENT=codex DRAFT=draft1            # draft1 | draft2 | draft3
WT=/tmp/html-sandbox/trial-$AGENT-$DRAFT # anywhere outside the repo
git worktree add -b trial-$AGENT-$DRAFT "$WT" 96f82be
cp -R docs/sketch/document-merge/skills/$DRAFT "$WT/.agents/skills/document-merge"
```

Then start the agent fresh with [trial-prompt.md](trial-prompt.md) (fill in `<BRANCH>` and `<WT>`).
The worktree at 96f82be contains neither the other drafts nor the manual result.

Collect the outcome into `results/<agent>-<draft>/` (e.g. `results/claude-draft1/`):

- `reply.md` — the agent's final reply (merge report, open questions)
- `files.txt` — `git -C "$WT" diff --stat 96f82be`
- the merged article as committed in the worktree (`slops/2026-11-07-merge-investigation-note-skill.md`, a file or a bundle directory)

## Results

### Claude Code (Opus 5.5), 2026-11-08

Each directory under `results/` holds `article.md` (the merged article as committed), `reply.md` (the final reply), `files.txt` (diff stat against 96f82be) and `other-changes.diff` (edits outside the article).
The worktree commits (`trial-draft1` 7aede84, `trial-draft2` 2f13f8d, `trial-draft3` d9b5724) were not pushed; these files are their full content apart from the deletions.

The inputs total about 110 KB (9 files). The manual merge is a 4-file bundle of about 41 KB.

| | draft1 | draft2 | draft3 | manual (#143) |
| --- | --- | --- | --- | --- |
| article | [article.md](results/claude-draft1/article.md) | [article.md](results/claude-draft2/article.md) | [article.md](results/claude-draft3/article.md) | `slops/2026-11-07-investigation-note-skill.md/` |
| size | 66 KB, 375 lines | 39 KB, 237 lines | 41 KB, 205 lines | 41 KB, 4 files |
| shape | single file, 4 sections, 13 subsections | single file, 8 sections | single file, 4 sections, 5 subsections | bundle; sections by what was learned |
| title | 技術調査のあとに書く記事のスキルを、三つの試作を経て一本にした | 技術調査の記事を書くスキルを、下書きから三つの試作を経て一本にした | 技術調査の記事を書くスキルを、三つの試作から一本にするまで | 技術調査のあとに書く記事のスキル write-slops-investigation-note を作った |
| filename | kept | kept | kept | renamed |
| three input articles | deleted | deleted | deleted | deleted |
| report in reply | scope, chapter map, bridges B1–B4, conflicts | theme, chapter map, asides, dropped items | what was done and dropped; no chapter map (the skill outputs only the document) | — |

All three deleted the three input articles, repointed `next` of `2026-11-05-skill-for-new-articles` and the link in `03-svg-pitfalls.md`, ran `make test-go` and `tools/slops-nav`, and rendered the page on the local Go blog.
None renamed the file or turned the article into a bundle; the manual merge did both on request during the session.

These trials ran under an earlier, stricter rule: nothing created after 96f82be (PRs/issues #141+, other branches). draft3 still saw one later comment on #133 (2026-11-07T07:58Z) through `gh issue view 133 --json comments` and reports not using it; under the current rule that comment is allowed.

Points the agents raised about the skills themselves (from `reply.md`):

- draft1 and draft2: "leave no trace of the sources" conflicts with write-slops-investigation-note's "say it if you write from records" and "who tried what is the history itself".
- draft1: "do not summarize" conflicts with "a full trace is not needed"; the result is the longest. Its bridge B3 brings in facts from git history, against "bridges add no new facts".
- draft2 and draft3: none of the drafts says what to do when the destination is also one of the inputs, or whether to delete the inputs and fix links to them.
