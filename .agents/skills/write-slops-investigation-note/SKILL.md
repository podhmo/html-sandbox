---
name: write-slops-investigation-note
description: A variant of write-slops for the report written after a technical investigation session.
---

# Write technical investigation notes (slops)

This skill only decides what an investigation article contains and in
what order. Markdown dialect, SVG and figures, file and bundle layout,
handling of sources, and checking the output all follow
[write-slops](../write-slops/SKILL.md); read it first.

## What the article is for

The article is a technical log of the investigation, read as a request
and what was done and verified to answer it. The reader wants to re-run
or extend the investigation later, possibly under different conditions.
Beyond the log, the article keeps what the session knew but the PR and
the sketch do not carry, such as options that were not taken.

Everything in the article comes from the session as it went.
Interpretations made at the time belong in it: what an error seemed to
mean, why one path looked cheaper. Writing the article is not a new
round of investigation or judgment: it does not add alternatives,
assessments, lessons, or recommendations that did not arise in the
session, and it does not argue a thesis, generalize the episode into
properties of coding agents, or evaluate the author. Later sessions read
these articles, and a conclusion formed while writing would act as
guidance for them.

The session usually has already collected what it found in
`docs/sketch/`. The sketch holds the gathered facts and any reproducible
procedure; the article links to it and covers what the sketch does not:
the request, how the work proceeded and why, and the answer to the
request. Facts already in the sketch are linked rather than restated,
except where the article needs them to follow the course of the work or
to state the answer.

The article is normally written in the session that did the work, from
its context. If it is written instead from records (the sketch, commits,
a summary), say so. Do not fill in alternatives or reasons the records do
not show; when the reason for a decision is not recorded, say it is
unknown.

## Article structure

### 1. Request and starting conditions

- The request as it stood at the start. It may be summarized or
  reshaped; it need not be the prompt verbatim. Requirements added or
  changed midway belong in section 2, at the point where they took
  effect.
- The starting conditions that later choices depend on, such as
  environment, versions, and permissions (what the agent may not change).

### 2. What was done, in order

- What was done, in the order it was done, including trials that failed
  and what led from each step to the next (e.g. which error prompted
  which next attempt). This section is an account of how the work
  proceeded, not a timeline, a chronology, or a list of commits.
- The reasons behind the choices that set the course: a permission
  boundary, a version mismatch, a scope limit, a measurement. A
  constraint the agent could not change is recorded as a condition of
  the environment: what it was and what it ruled out.
- A workaround is recorded together with the condition that made it
  necessary (e.g. pinned to cu128 because driver 573.22 rejected the
  default build), not as a standalone rule. It is not described as
  temporary unless that is known.
- When the requester added a requirement or changed direction midway and
  it changed what was done next or how the result was judged, it is
  recorded where it happened, not as known from the start. A full trace
  of the conversation is not needed; what is needed is enough to
  reproduce the findings and the steps.

### 3. Answer to the original question

- The main text ends with the answer to what section 1 asked: the
  result, the state the environment was left in, and how to undo it if
  relevant. Numbers come with the conditions you know (runs, setup).
- No reflections on the author's mistakes or regrets. A mistake that
  changed the outcome belongs in section 2, where it happened.
- If part of the question remains unanswered, which part.

### 4. Asides (optional)

- Anything worth keeping that does not belong in the main line goes in
  a closing section after the answer. For example: a surprising finding
  or a tip that is valuable but off the main line; an explanation of, or
  a reservation about, something in the main text; options considered
  but not taken and why, messages or warnings left unaddressed, things
  noticed but not pursued. Omit the section when there is nothing to put
  in it.

The order above is what this skill requires; the section titles name
contents, not article headings. A short investigation may merge sections
1 and 2.
