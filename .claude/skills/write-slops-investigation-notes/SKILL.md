---
name: write-slops-investigation-notes
description: Write a slops article after a technical investigation, environment setup, or trial run done in this session — what was asked, what was tried, which alternatives were dropped under which constraints, and the answer to the original question. Builds on write-slops; use write-slops for other articles.
---

# Write investigation notes (slops)

This skill specializes [write-slops](../write-slops/SKILL.md) for one use
case: the article that follows a technical investigation, an environment
setup, or a trial run. Read write-slops first. Its rules on Markdown,
SVG and `tools/svg-gen`, file and bundle layout, sources, and checking the
output all apply unchanged. This skill only adds what the article carries
and in which order.

Write the article in the session that did the work. If you write from
records of another session (PRs, `docs/sketch/`, commit messages), say
which records you read, and do not fill in alternatives or reasons that
those records do not show.

## What the article is for

The requester already has the PR, the diff, and the `docs/sketch/` note.
What they cannot see is which options you weighed, which you dropped, and
what constraint made you drop them. The article is the record of that,
told against the question that started the work.

The interpretation belongs to the concrete choices in this work: why this
path, what that error pointed to. Do not turn the work into general
claims about agents or tools, a list of properties, or an argument for a
thesis.

Keep procedures and reference facts in `docs/sketch/` and link to them.
The article tells what happened when they were applied; it does not copy
the procedure.

## Four parts, in this order

Name the headings to fit the content and the article's language.

### 1. The question and the starting conditions

State what was asked and the conditions the work started from: machine,
hardware, permissions, tool and driver versions, and what was out of
reach. Summarize or reshape the request so the article reads as "the
question and what was verified"; do not paste the prompt or the chat.

### 2. What was tried, and why

Follow the order in which things actually happened, as prose that connects
each step to the one before it ("the error said X, so Y was tried").
Do not write a bulleted timeline or a commit log.

- Dropped alternatives: whenever an option was rejected, a workaround was
  chosen, or a step was skipped, give the concrete reason (no root, a
  driver too old for the build, out of scope for the request, time).
- Conditional workarounds: write a workaround together with the
  condition that made it necessary ("pin cu128 while the driver is below
  CUDA 13.2"), not as a rule that holds everywhere. A later session reads
  the article as its starting constraints.
- Out of reach: when the better fix was outside what this session could
  change (the host, the driver, a decision only the requester can make),
  name it as an alternative and who could take it. Record it as part of
  the situation, not as a regret.
- Measurements: give the number of runs and the conditions with each
  value. A single run is labelled as one run.
- Changes during the work: when the requester added a requirement or
  changed direction, place it where it happened as a turning point, in a
  sentence or two, without quoting the chat at length.

### 3. The answer to the original question

End the main text by answering the question from part 1 with what was
verified: results, measurements, what remains on the machine and how to
clean it up. Do not end with a review of your own mistakes or an
evaluation of yourself.

### 4. Asides

After the answer, collect what the main text left out: paths not pursued,
what could change if a constraint were lifted, related things noticed on
the way. Keep these out of parts 2 and 3 so the main text reads straight
through. Do not phrase them as commitments for the requester.
