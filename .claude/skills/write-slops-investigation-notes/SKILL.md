---
name: write-slops-investigation-notes
description: Write a slops article after a technical investigation (environment setup, a feasibility check, a retest, a debugging session) - what was asked, what was tried, which alternatives were dropped under which constraints, and the answer to the original question. Layered on write-slops; use it instead of plain write-slops when the article records such an investigation.
---

# Write technical investigation notes (slops)

This skill only decides what an investigation article contains and in
what order. Markdown dialect, SVG and figures, file and bundle layout,
handling of sources, and checking the output all follow
[write-slops](../write-slops/SKILL.md); read it first.

Write the article in the session that did the investigation, or in a fork
of it. The material that matters here (options that were considered and
dropped, and why) is mostly not in the commits or in the docs afterwards.

## What the article is for

The reader wants to re-run or extend the investigation later, possibly
under different conditions. So the article records, for each choice, the
condition it depended on. It does not argue a thesis, does not generalize
the episode into properties of coding agents, and does not grade the
author. Interpretation is welcome where it is about this investigation:
what an error seemed to mean at the time, why one path looked cheaper.

If the investigation also produced a reproducible procedure in
`docs/sketch/`, the sketch keeps the procedure and the facts; the article
links to it and tells how the procedure was reached. Do not copy the
sketch into the article.

## Article structure

### 1. Request and starting conditions

- Summarize the request or question; reshape it for readability rather
  than quoting the prompt verbatim.
- State the starting conditions that later choices depend on: machine,
  OS, driver and tool versions, permissions (root or not, what the agent
  may not change), and the time or scope given.

### 2. Trials and decisions, in order

- Follow the order in which things actually happened. Write prose that
  connects steps by cause ("the import failed with X, so Y was tried"),
  not a timestamped log or a commit list.
- For every dropped path, skipped option, or workaround, state the
  concrete reason: a permission boundary, a version mismatch, a time or
  scope limit, a measurement that ruled it out.
- Write workarounds as conditional on what made them necessary ("pinned
  to cu128 because driver 573.22 rejected the default build"), never as
  standalone rules ("always pin cu128"). If the cause sat outside what
  the agent could change, say where it sat.
- Give each measurement its conditions: how many runs, which environment,
  warm or cold. A single run is labelled as one.
- When the requester added a requirement or changed direction midway,
  mention it where it happened, in a sentence or two, as the reason the
  next step went the way it did. Quote only short decisive phrases.

### 3. Answer to the original question

- End the main text by answering what section 1 asked: the result,
  measurements with their conditions, the state the environment was left
  in, and how to undo it if relevant.
- Do not close with reflections on the author's mistakes or with what
  should have been asked. A mistake that changed the outcome belongs in
  section 2, where it happened.
- If part of the question remains unanswered, say which part and what
  would be needed to answer it.

### 4. Asides

- After the answer, a short closing section collects what did not fit the
  main line: ideas not tried, what would change if a constraint were
  lifted, related observations. Keep such digressions out of section 2.
- Each item says whether it was checked. Unchecked items stay labelled as
  such.

Headings may be phrased to fit the subject; the order above is what
matters. A short investigation may merge sections 1 and 2.
