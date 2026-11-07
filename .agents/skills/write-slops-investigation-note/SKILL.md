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

The reader wants to re-run or extend the investigation later, possibly
under different conditions, and to see which paths were dropped on the
way. The article records this investigation as a request and what was
done and verified to answer it. It does not argue a thesis,
generalize the episode into properties of coding agents, or evaluate the
author. Interpretation about this investigation belongs in it: what an
error seemed to mean at the time, why one path looked cheaper.

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

### 2. Trials and decisions, in order

- What happened, in the order it happened, including what led from each
  step to the next (e.g. which error prompted which next attempt). This
  section is an account of how the work proceeded, not a timeline, a
  chronology, or a list of commits.
- The alternatives that changed the course of the work or that explain
  the result's conditions, limits, or how to repeat it, each with the
  concrete reason it was dropped: a permission boundary, a version
  mismatch, a scope limit, a measurement. Distinguish a trial that failed,
  an option considered but not run, and a possibility noticed only
  afterward. Candidates that were never weighed are not included.
- The versions actually used are recorded as conditions of the
  environment, together with any messages about them that the session
  left unaddressed (e.g. a "too old" warning it worked past). The article
  records the session as it went: if the session chose not to upgrade,
  that choice and its reason are recorded like any other decision; if it
  did not notice a newer version, that is not added after the fact. A
  constraint the agent could not change is recorded the same way: what
  it was and which options it ruled out.
- The article does not conclude that the requester should have been
  consulted (e.g. asked whether to install the latest version), and does
  not justify the agent having proceeded without asking. Later sessions
  read these articles, and such a conclusion would lead them to stop and
  ask instead of working through the task. Whether asking would have
  changed anything may be noted in section 4.
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

- Material worth keeping that did not fit the main line goes in a
  closing section after the answer: ideas not pursued, what would change
  if a constraint were lifted, related observations. It does not go in
  section 2. Omit the section when there is nothing to put in it.

The order above is what this skill requires; the section titles name
contents, not article headings. A short investigation may merge sections
1 and 2.
