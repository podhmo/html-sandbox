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
Write what the requester can use to understand and revisit this exploration:
what was asked, what happened, which choices remained available, and what
was established. Keep interpretation attached to concrete observations.
Do not turn an individual investigation into a debate about agents in
general or a performance of the writer's insight.

## Recover the material before drafting

Use the work session, commands, outputs, artifacts, and linked records to
recover the actual sequence. Distinguish your own trials from earlier
reports you have only read. Preserve the conditions that change the answer:
relevant versions, hardware, permissions, input, measurement procedure,
and scope. Include only the conditions relevant to this investigation.

For each consequential choice, recover the observation, chosen response,
alternative, reason for leaving it, and outcome. Distinguish a failed trial,
an option considered but not run, and a possibility noticed only afterward.
If the record does not explain an earlier decision, say that the reason is
unknown; do not invent deliberation or attribute a new hypothesis to the
original worker. A private evidence outline can help, but is not the article.

## Build the article around the request and its answer

Use these four parts in order, with headings suited to the actual subject:

- Context and constraints: summarize the initial request in readable prose,
  then state the starting conditions needed to understand the result.
  Do not paste the opening prompt or the chat transcript.
- Trials and decisions: use the actual sequence as a backbone, connecting
  observations to choices and subsequent results in causal prose. A table
  can compare conditions or outcomes; it should not replace the narrative
  with a timestamp list, command diary, or commit log. Include important
  mid-task requirement changes where they changed the available paths,
  summarized in a sentence or two.
- Answer to the original request: give the verified outcome, relevant
  measurements with their conditions, and remaining limits. Include cleanup
  when environment setup made it relevant. Partial or negative results
  still answer the question; identify the part that remains unanswered.
  Do not substitute regrets, self-evaluation, or promises for this answer.
- Closing aside: put useful tangents, later hypotheses, untried setups, or
  follow-up possibilities after the answer. Mark them as unverified and
  tie them to the condition that would make them worth trying. Do not
  manufacture a tangent just to fill a section.

## Keep choices conditional and reconstructible

When a workaround or rejected option matters, state the local condition
beside it: what failed or was unavailable, why the chosen path was used,
and what change would justify revisiting it. A condition in a distant
setup table is insufficient if the workaround itself reads as a permanent
instruction. Do not promote a historical success to a current compatibility
guarantee or infer the best solution from the first working one.

Explain consequential skipped alternatives, including scope or cost limits,
without expanding the article into a catalog of every possible tool.
Describing a blocked path afterward does not require asking the human to
resolve every branch during autonomous work, and does not authorize new
experiments or external publication.

Before delivery, check that the opening request has an explicit answer,
that each important change of direction has a recorded reason or an honest
unknown, and that the closing aside does not contain the only answer.
Run the base skill's applicable content and rendering checks, and report
which checks were actually performed. One successful article is a trial
of this skill, not evidence that it improves every investigation.
