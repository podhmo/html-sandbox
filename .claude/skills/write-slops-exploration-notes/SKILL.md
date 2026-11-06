---
name: write-slops-exploration-notes
description: Write slops articles after technical investigation, experiments, or environment setup, preserving trials, condition-bound choices, discarded alternatives, and the verified answer to the original request.
---

# Write notes after technical exploration

Read [write-slops](../write-slops/SKILL.md) first. It is the base for
language, source honesty, tinymarkdown, figures, article layout, and renderer
checks. This skill adds a focus for recording completed technical work;
it does not replace those rules or apply to every slops article.

The use case comes from [issue #133's technical-memo comment](https://github.com/podhmo/html-sandbox/issues/133#issuecomment-6686188903).
Record the result of the request and the choices that led to it so a reader
can check or reproduce the findings and revisit the implementation. Make
the result's conditions and relevant alternatives visible. A complete trace
of conversations, commands, or decisions is unnecessary. Keep interpretation
attached to concrete observations.
Do not turn an individual investigation into a debate about agents in
general or a performance of the writer's insight.

## Recover the material before drafting

Use the work session, commands, outputs, artifacts, and linked records to
recover the actual sequence. Distinguish your own trials from earlier
reports you have only read. Preserve the conditions that change the answer:
relevant versions, hardware, permissions, input, measurement procedure,
and scope. Include only the conditions relevant to this investigation.

Retain choices and alternatives that help explain the result's conditions,
limits, or how to repeat the investigation. For those choices, recover the
observation, chosen response, reason for leaving an alternative, and outcome.
Do not enumerate candidates merely to make the record exhaustive.
Distinguish failed trials, options considered but not run, and possibilities
noticed only afterward.
If the record does not explain an earlier decision, say that the reason is
unknown; do not invent deliberation or attribute a new hypothesis to the
original worker. A private evidence outline can help, but is not the article.

## Build the article around the request and its answer

Use the following order, with headings suited to the actual subject and
the closing aside included only when useful:

- Context and constraints: reshape the request, including adjustments made
  during the work, into a readable statement of the question the article
  answers. State the starting conditions needed to understand the result.
  The opening need not quote the original prompt or repeat the conversation;
  keep the request and its verified result easy to connect.
- Trials and decisions: use the actual sequence as a backbone, connecting
  observations to choices and subsequent results in causal prose. A table
  can compare conditions or outcomes; it should not replace the narrative
  with a timestamp list, command diary, or commit log. Retain requirement
  changes where they affected choices or how results were evaluated, even
  if the opening consolidates the request. Do not present a later condition
  as known from the start. Include mistakes and corrections when they help
  explain the path to the result.
- Answer to the original request: give the verified outcome, relevant
  measurements with their conditions, and remaining limits. Include cleanup
  when environment setup made it relevant. Partial or negative results
  still answer the question; identify the part that remains unanswered.
  Do not substitute regrets, self-evaluation, or promises for this answer.
- Closing aside: put useful findings outside the main thread, later
  hypotheses, untried setups, or follow-up possibilities after the answer.
  Distinguish verified findings from speculation and untried ideas.
  Omit this section when there is no useful aside.

## Keep choices conditional and reconstructible

When a workaround or rejected option matters, state the local condition
beside it: what failed or was unavailable, why the chosen path was used,
and what change would justify revisiting it. A condition in a distant
setup table is insufficient if the workaround itself reads as a permanent
instruction. An environment-dependent choice need not be temporary; state
its applicable conditions without declaring it provisional by default.
Do not promote a historical success to a current compatibility guarantee
or infer the best solution from the first working one.

Include scope or cost limits when they explain a relevant skipped option.
Describing a blocked path afterward does not require asking the human to
resolve every branch during autonomous work, and does not authorize new
experiments or external publication.

Before delivery, check that the request as presented has an explicit answer,
that each important change of direction has a recorded reason or an honest
unknown, and that the closing aside does not contain the only answer.
Run the base skill's applicable content and rendering checks, and report
which checks were actually performed. One successful article is a trial
of this skill, not evidence that it improves every investigation.
