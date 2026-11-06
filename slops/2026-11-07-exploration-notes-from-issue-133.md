---
title: Recording the choices left behind by a technical exploration
description: A trial of a specialized slops skill, built from issue 133 and the November 5 writing experiments, with conditional workarounds, discarded alternatives, and an answer to the original request.
---

# Recording the choices left behind by a technical exploration

## The request and the material available

I was asked to make a slops writing skill for the end of a technical exploration, use the existing write-slops as its base, expose it to Codex, and then use it to write an article about the work. The starting point was [the technical-memo comment on issue #133](https://github.com/podhmo/html-sandbox/issues/133#issuecomment-6686188903). Work was to happen in a separate worktree, without consulting another agent's PR. This article is the first use of the resulting skill.

The comment describes information that was getting lost: the alternatives an agent left behind, the conditions that made a workaround reasonable, and the answer the investigation actually reached. It also describes two unwanted endings: an argument about the general nature of agents, and a reflection on the writer's mistakes that never answers the original request.

The repository at the start of this work already contained an investigation-notes skill. To keep this attempt independent, I left that skill and its companion article unread and unchanged, and created `write-slops-exploration-notes` alongside it. The worktree branch is `codex/exploration-slops`. My sources were the specified comment, the base skill, the November 5 articles discussed below, issue #128, and the checked-in TTS investigation notes. I did not open the Drive or AI Studio materials linked inside the comment; the account here is limited to the comment's own text and the repository records.

## From the earlier articles to a narrower skill

I began with [write-slops](../.claude/skills/write-slops/SKILL.md). It already separates questions, observations, untried ideas, and decisions, and prohibits invented measurements or promises. It also owns the site's Markdown dialect, figures, bundles, and renderer checks. Copying those instructions into a second skill would leave two versions to maintain, so the new skill begins by requiring the base and adds only the investigation-specific focus.

That left a choice about what the specialization should prescribe. [The use-case templates article](2026-11-05-slops-use-case-templates.md) records an earlier attempt to respond to issue #133 by adjusting the sound of the prose. Its next attempt instead separated what an article should cover from how it should sound. I used that distinction here: the new instructions identify the evidence and choices the reader needs, rather than requesting feelings or a particular personality.

[The November 5 skill experiment](2026-11-05-skill-for-new-articles.md) supplied a more concrete failure to account for. According to that article, two drafts both included the rejected answers but ended with the writer's mistakes; neither supplied the requested account of what a good article was and how to make one. A rule to choose one thread also caused a useful aside about session forks to be dropped. I did not repeat that comparison. I used its reported outcomes to give the new skill four parts: context, a causal narrative of trials, an explicit answer to the initial request, and useful asides after that answer.

The sequence matters, but it does not require a timestamp list. In the current work, for example, the base already covered formatting, which led me to keep formatting out of the specialization. The earlier comparison reported a missing answer, which led me to make that answer an explicit part of the article. These are decisions with local reasons. A chronology that merely listed files read and commands run would obscure those connections.

### What a conditional workaround needs to retain

Issue #133 points back to [the TTS article about constraints](2026-11-05-answers-under-constraints.md). [Issue #128](https://github.com/podhmo/html-sandbox/issues/128) had asked whether the CUDA pinning was really a consequence of an older driver and called for a retry after updating it. The checked-in [TTS notes](../docs/sketch/ja/tts-wsl2.md) report that the original driver environment failed to initialize the default torch build, while the later environment initialized it successfully. Those are historical reports I read during this task; I did not run a TTS workload or verify current package compatibility.

The writing problem can be stated without repeating the package installation instructions:

| Material in the record | What the new skill asks the writer to preserve |
| --- | --- |
| Default build failed in the earlier driver environment | Keep that environment beside the workaround |
| A pinned build worked in that environment | Record it as the selected response to that failure |
| Default build worked in the later environment | Identify the changed condition that permits revisiting the workaround |
| A host update was outside the worker's available actions | Distinguish that boundary from a technical impossibility |

An environment table alone does not keep a later instruction conditional. If a reader copies only the workaround paragraph, its reason must still be visible there. That is why the new skill asks for the relevant condition beside the choice itself.

There is also a limit to reconstruction. A later reader can notice an alternative without knowing whether the earlier worker considered it. [The article about good slops for the requester](2026-11-05-good-slops-for-requester.md) emphasizes being honest about what was actually checked. I added an explicit distinction between a failed trial, a considered but unexecuted option, and a possibility noticed afterward. Where an earlier decision has no recorded reason, the article should retain that unknown. The instruction to explain discarded alternatives must not become an instruction to invent them.

### Making the same files available to Codex

The skill sources remain under `.claude/skills/`. I added relative directory symlinks under `.agents/skills/` for both `write-slops` and `write-slops-exploration-notes`. A global installation would have changed this machine alone; repository-local links keep the paths with the checkout. Copying the files would have created another editable version. The relative links also let the specialization's sibling link to the base resolve through either entry point.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -3 286 259.2" width="286" height="259" role="img" aria-label="The base and exploration skill sources above, with matching discovery symlinks below pointing upward to the same files">
<text x="10" y="20" font-size="13" fill="currentColor">.claude/skills/ (sources)</text>
<text x="10" y="152" font-size="13" fill="currentColor">.agents/skills/ (symlinks)</text>
<rect x="10" y="38" width="124" height="44" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="72" y="60" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">base</text>
<rect x="10" y="170" width="124" height="44" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
<text x="72" y="192" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">base</text>
<path d="M72 167 L72 85" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M76.05 94 L72 85 L67.95 94" fill="none" stroke="currentColor" stroke-width="1.5"/>
<rect x="152" y="38" width="124" height="44" rx="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="214" y="60" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">exploration</text>
<rect x="152" y="170" width="124" height="44" rx="8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
<text x="214" y="192" font-size="13" text-anchor="middle" dominant-baseline="central" fill="currentColor">exploration</text>
<path d="M214 167 L214 85" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M218.05 94 L214 85 L209.95 94" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="10" y="244" font-size="11" fill="currentColor">Arrows point to stored files.</text>
</svg>
```

The solid rectangles represent stored skill directories; the dashed rectangles represent directory aliases. The columns are the base write-slops skill and the new exploration skill. Arrows point from each alias to its actual target. This is a schematic of the files added here, not a model of which instruction an agent will select. The generator is `tools/svg-gen/examples/fig-exploration-skill-links.ts`.

I also added a routing paragraph to `AGENTS.md` for articles after investigation, experiments, or environment setup. The general write-slops route remains the base for other articles. The specialization does not require stopping autonomous work to ask about every discarded branch; it requires recording the significant branches afterward.

## What this attempt produced

The requested specialization is [write-slops-exploration-notes](../.claude/skills/write-slops-exploration-notes/SKILL.md). It adds a way to recover trials and choices from the work record, keeps workarounds tied to their conditions, and makes the answer to the original request a distinct part of the article. The base remains the source of formatting and rendering rules. Codex-facing links point to both physical sources, and this article was written after loading the new skill through its link.

The first attempt to run the skill validator stopped because the system Python lacked PyYAML. I used an isolated uv environment with that dependency, leaving the repository's dependencies unchanged; both skills then passed `quick_validate.py`. Reading each skill through `.agents/skills/` returned the same bytes as its `.claude/skills/` source.

`make -C tools/svg-gen` generated and linted 26 figures with no failures or warnings. On the first browser check, this article's wide two-column figure shrank enough to make its labels difficult to read on the narrow viewport. I changed it to a compact layout with abbreviated labels and targets above their aliases. The full skill names remain in the surrounding prose.

`GOCACHE=/private/tmp/html-sandbox-exploration-go-cache make test-go` passed the Go suite with embedded content refreshed. I also opened the article served by the Go development server and checked the browser's rendered page, including the inline SVG. The browser displayed the site's “Rendered with Wasm” status; this was a browser rendering check as well as a Go test run. I did not run the full MoonBit suite or verify the TypeScript renderer. These checks establish loading and presentation, not reader approval of the article.

This establishes that the files and links can be used for one article about a repository investigation and skill implementation. It does not establish that the skill improves article quality across models, or that it has been tested after a new hardware or environment experiment. The TTS material remains source context rather than a new result of this session.

## Aside: a comparison that remains available

The earlier skill experiment used forks of one session to give two writers the same working context. If a future task asks to compare this specialization with the base, that setup could make the difference in instructions easier to examine. Both drafts would need the same initial question and evidence, separate output paths, and no access to each other's article. This task produced one draft; no such comparison was run, and no new agent was started.
