---
name: write-slops-investigation-note--claude
description: "[Claude] Experimental variant of write-slops-investigation-note, kept as a record of the 2026-11-07 comparison. Use only when this variant is named explicitly; otherwise use write-slops-investigation-note."
---

# Write technical investigation notes (slops)

This skill only decides what an investigation article contains and in
what order. Markdown dialect, SVG and figures, file and bundle layout,
handling of sources, and checking the output all follow
[write-slops](../write-slops/SKILL.md); read it first.

## What the article is for

The reader wants to re-run or extend the investigation later, possibly
under different conditions, and to see which paths were dropped on the
way. The article does not argue a thesis, does not generalize the episode
into properties of coding agents, and does not grade the author. Do not
perform pedantic analysis or display intellectual sharpness; the word
"investigation" is about the subject, not the register. Interpretation is
welcome where it is about this investigation: what an error seemed to
mean at the time, why one path looked cheaper.

If the investigation also produced a reproducible procedure in
`docs/sketch/`, the sketch keeps the procedure and the facts; the article
links to it and tells how the procedure was reached. Do not copy the
sketch into the article.

If you are writing from records (commits, docs, a summary) rather than
from the context of the session that did the work, say so, and do not
fill in alternatives or reasons the records do not show.

## Article structure

### 1. Request and starting conditions

- Summarize or reshape the request rather than quoting the prompt
  verbatim. The article reads as "the request and what was verified", and
  when mid-task adjustments appear later in section 2, a full transcript
  of the request up front only gets in the way.
- State the starting conditions that later choices depend on, such as
  environment, versions, and permissions (what the agent may not change).

### 2. Trials and decisions, in order

- Follow the order in which things actually happened, but write prose
  that connects steps by cause ("the import failed with X, so Y was
  tried"), not a timestamped log or a commit list.
- Record the alternatives that were actually considered and changed the
  course of the work, with the concrete reason each was dropped: a
  permission boundary, a version mismatch, a scope limit, a measurement.
  Do not list candidates that were never weighed at the time to make the
  record look thorough; if there were few alternatives, this stays short.
- An option outside what the agent could change is recorded as a
  boundary of the environment, like a version, not as something the
  requester should have been asked. Working through the task without
  checking in is not a fault to be explained.
- Write workarounds as conditional on what made them necessary ("pinned
  to cu128 because driver 573.22 rejected the default build"), not as
  standalone rules ("always pin cu128").
- When the requester added a requirement or changed direction midway and
  it changed what was done next, mention it there in a sentence or two.
  A full trace of the conversation is not needed; what is needed is
  enough to reproduce the findings and the steps.

### 3. Answer to the original question

- End the main text by answering what section 1 asked: the result, the
  state the environment was left in, and how to undo it if relevant.
  When reporting numbers, add the conditions you know (runs, setup).
- Do not close with reflections on the author's mistakes or regrets. A
  mistake that changed the outcome belongs in section 2, where it happened.
- If part of the question remains unanswered, say which part.

### 4. Asides

- After the answer, a short closing section collects what did not fit the
  main line: ideas not pursued, what would change if a constraint were
  lifted, related observations. Keep such digressions out of section 2.

Headings may be phrased to fit the subject; the order above is what
matters. A short investigation may merge sections 1 and 2.
