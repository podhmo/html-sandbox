# Trial prompt

Give this to the agent under test, replacing `<BRANCH>` (e.g. trial-codex-draft1) and `<WT>` (the worktree path).
Start it fresh: no context other than this prompt.

---

You are running one trial of an experiment that tests a draft skill. Act exactly as if you were a coding-agent session in the repository below and the user had just typed the message given at the end.

Repository (a git worktree, branch <BRANCH>, checked out at commit 96f82be): <WT>
Work only inside that directory. Read its AGENTS.md and follow it (think/write code in English, articles in slops/ are Japanese, reply to the user in Japanese).

The user invoked the skill `/document-merge`. Its definition is at <WT>/.agents/skills/document-merge/SKILL.md — read it (and any files under that directory it refers to) and follow it. The user's message also names `/write-slops-investigation-note`; that skill is at .agents/skills/write-slops-investigation-note/SKILL.md and builds on .agents/skills/write-slops/SKILL.md — read and follow those too.

Rules of the experiment:
- The user is not available. Run to completion automatically. Wherever a skill tells you to ask the user, make the best provisional decision, proceed, and list those questions in your final reply.
- Use whatever you can read from the environment (git history, `gh` read-only on issues and PRs) to understand the articles, with one exception: do not look at anything that already contains an answer to this task. That means PRs #143 and #144 and their branches, issue #146, the branches `document-merge-trials*` and `trial-*` other than your own, other worktrees, and any version of `slops/2026-11-07-investigation-note-skill.md` or `docs/sketch/document-merge/`. If you come across such material anyway, do not use it, and say so in your final reply.
- Do not post anything to GitHub, do not push.
- When done, commit your changes in the worktree on branch <BRANCH>.
- Also write your final reply to the user (everything the skill says to output to the user besides the article files themselves, e.g. a merge report) to <WT>-reply.md, and return that same reply as your final message.

The user's message:

改めて考えてみると今日の3つのモデルが書いた記事は通常なら候補として隠れてPRのコミットの中にだけ隠される記事だった気がする。 2026-11-07-investigation-notes-skill.md, 2026-11-07-exploration-notes-from-issue-133.md, 2026-11-07-write-slops-investigation-notes.md, 2026-11-07-merge-investigation-note-skill.mdこれらの記事は経緯も含めて 2026-11-07-merge-investigation-note-skill.md にまとめられるべきな気がする。 /write-slops-investigation-note の形式に沿って一つの記事にまとめて欲しい。
