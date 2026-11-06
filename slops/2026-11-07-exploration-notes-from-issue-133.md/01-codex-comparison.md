# Comment from Codex: comparing the two skills and articles

🤖 Codex

Added on November 7, 2026, at the requester's invitation to compare this work with [PR #138](https://github.com/podhmo/html-sandbox/pull/138). This is Codex's assessment, not the requester's evaluation or a controlled comparison of model quality. The initial article above was written without consulting that PR. This comment was written after reading it.

## What was compared

I read PR #138's [write-slops-investigation-notes](https://github.com/podhmo/html-sandbox/blob/5c08749df1eef13bc8c953dbd244694f662efb11/.claude/skills/write-slops-investigation-notes/SKILL.md) and [article](https://github.com/podhmo/html-sandbox/blob/5c08749df1eef13bc8c953dbd244694f662efb11/slops/2026-11-07-investigation-notes-skill.md) at commit `5c08749`. I compared them with PR #139's [write-slops-exploration-notes](https://github.com/podhmo/html-sandbox/blob/a2208c7007032fd1ac0d2110780fc9d96a65aa97/.claude/skills/write-slops-exploration-notes/SKILL.md) and [initial article](https://github.com/podhmo/html-sandbox/blob/a2208c7007032fd1ac0d2110780fc9d96a65aa97/slops/2026-11-07-exploration-notes-from-issue-133.md) at commit `a2208c7`. These links pin the comparison even if either PR changes later.

Both implementations started from issue #133's technical-memo comment and used write-slops as their base. Both were subsequently adjusted after receiving the dialogue that produced the comment. In this work, that adjustment changed the skill after the first article had been written; the article above remains a record of the initial run. PR #138's article incorporates its second adjustment into the narrative. Comparing the articles without that distinction would hide a difference in what they cover.

## Where the skills agree

Both require the base rather than copying its Markdown, figure, and bundle rules. Both follow the request, trials in chronological causal prose, the answer, and closing asides. Neither asks for a timestamp list. Both reject general claims about agents as a substitute for recording the investigation, and neither treats autonomous progress without repeated human consultation as a fault.

Both also guard against an especially consequential failure: filling the article with alternatives the worker never actually considered. PR #138 says to include alternatives that were actually considered and changed the course of work. This skill distinguishes failed trials, considered but unexecuted options, and possibilities noticed only afterward, and retains an unknown when a historical reason is missing. These instructions are compatible; neither gives permission to invent the worker's deliberation.

## Differences that could affect the next article

| Question | PR #138: investigation-notes | PR #139: exploration-notes |
| --- | --- | --- |
| Which alternatives earn space? | Actually considered alternatives that changed the course of work; few alternatives can mean a short account | Choices relevant to the result's conditions, limits, or reproducibility; no exhaustive candidate list |
| How can the opening summarize the request? | Reshape the prompt, with explicit reasons about request/result correspondence and avoiding repetition | Consolidate the request including later adjustments, while retaining when consequential changes occurred |
| Which mid-task changes matter? | Changes that altered what was done next | Changes that affected choices or how results were evaluated |
| How should a conditional workaround be described? | Attach the condition, with the driver/cu128 example | Attach the condition and explicitly avoid calling every environment-dependent choice temporary |
| What belongs in the closing aside? | Unpursued ideas, relaxed constraints, related observations | Verified findings outside the main thread as well as identified hypotheses and untried ideas; omit the section if empty |
| How much structure is required? | Subject-specific headings; a short article may merge the first two sections | Subject-specific headings and an optional aside, without an explicit allowance to merge the opening and narrative |
| How does it relate to docs/sketch? | Explicitly keep procedures and facts in the sketch and tell how they were reached in the article | No explicit division beyond the base and the investigation's focus |

My reading is that PR #138 is more economical about selecting material and separating the sketch from the article. Its explicit allowance to merge the first two sections is useful for a short investigation. Those are concrete strengths of its instructions, although I have not tested whether either instruction changes generated output.

This skill is more explicit about changes to evaluation criteria. A new requirement can change what a result means even when it does not change the next command. It also allows the opening to state the consolidated question without pretending a later condition existed at the start. Those distinctions came from the supplied dialogue's allowance to reshape the request while retaining consequential turns.

The different alternative-selection rules have a tradeoff. “Changed the course of work” can keep PR #138 concise, but a relevant option may have been rejected immediately and left the chosen path unchanged. This skill's conditions/limits/reproducibility criterion can retain that option. It can also admit more material than the reader needs. The explicit instruction against exhaustive enumeration reduces that risk; it does not prove the criterion will select well in practice.

For integration, this PR adds actual `.agents/skills/` links for both source skills and an AGENTS.md route. PR #138 adds `agents/openai.yaml`; its article reports an existing `.opencode/skills` link. UI metadata, a discovery link, and a routing instruction serve different purposes, so the presence of one should not be counted as verification of the others. I verified this PR's links; I did not run PR #138's skill in Codex or OpenCode.

## How the articles compare

PR #138's article gives a clearer account of the skill-design work. It identifies what the first revision removed, what the source dialogue revealed, and what the second revision restored or relaxed. The movement from an instruction to its side effect and then to a narrower instruction is visible in the article itself. Its observation that a skill loaded only at writing time cannot guarantee earlier alternatives were recorded also identifies a limit of the proposed solution.

The initial Codex article supplies concrete implementation and verification evidence: the repository-local links, the missing PyYAML dependency and isolated validation environment, and a figure revised after inspecting the narrow browser view. Those details let a reader check what was built and what was actually tested.

However, it spends more space restating the TTS context and explaining the intended writing rules. Its TTS table is an explanation of a motivation rather than a new trial. It also predates the dialogue-based refinement of this skill, leaving that important turn absent from the main account. PR #138's article therefore answers “how did this particular skill reach its present form?” more completely. This bundle note records the gap and the comparison; it does not retroactively make the initial article a trial of the revised skill.

The source/alias SVG in the Codex article illustrates real file relationships and was checked at its displayed width. It helps inspect the integration change. It provides no evidence that the writing instructions select better material, and I would not use the presence of a figure to rank the two articles.

## Overall assessment

For explaining the design history, I prefer PR #138's article: the changes and their local reasons are easier to follow, and the second revision is part of the account. For the skill itself, both implement the same main use case. PR #138 contributes concise material selection, a useful sketch/article division, and flexibility for short articles; this implementation contributes explicit handling of consolidated requests, changed evaluation criteria, conditional choices that are not automatically provisional, and optional asides containing verified discoveries.

I would preserve those distinctions when deciding whether to consolidate the two skills. Accumulating every clause would risk recreating the excessive obligations both revisions tried to remove. This comparison changes neither skill and does not recommend adopting one solely because of who wrote it.

Neither article demonstrates the intended use case after a fresh technical environment investigation. Both first trials concern building the writing skill itself. There is no controlled fork comparison here, no evidence of cross-model superiority, and no new TTS measurement. A useful next check, if requested, would give both revised skills the same completed technical-work context and inspect whether each article preserves the answer, relevant alternatives, and changed conditions without manufacturing a decision history.
