---
name: write-slops-investigation-note
description: Write the slops article that closes a technical investigation session - the request as understood, what was done and why, the answer, and asides - from what happened in the session. Fixes what the article contains and where each part goes, not how it is written. Layered on write-slops.
---

# Write technical investigation notes (slops)

This skill decides only what an investigation article contains and where
each part goes. Markdown dialect, figures, bundle layout, and checking the
output follow [write-slops](../write-slops/SKILL.md); read it first.

## What the article is for

The article reports a request, the requirements added along the way, and
what was done and verified to answer them. The reader wants to re-run or
extend the investigation later, possibly under different conditions.

The article is written last, in the session that did the work. If the
session recorded the facts it gathered or a reproducible procedure in
`docs/sketch/`, that sketch already exists: the article links to it and
carries what the sketch does not (the request, how the work proceeded
and why, and the answer), restating sketch facts only where it needs
them to follow the work or to state the answer. Without a sketch, the
facts a reader needs to re-run the work are in the article itself.

Everything in the article comes from the session as it went, including
interpretations made at the time (what an error seemed to mean, why one
path looked cheaper). Writing the article adds no new alternatives,
assessments, lessons, or recommendations: later sessions read these
articles, and a conclusion formed while writing would act as guidance for
them. If the article is written from records (the sketch, commits, a
summary) rather than from the session's context, it says so, and a
reason the records do not show is given as unknown.

## Contents, in this order

### 1. Request and starting conditions

- The request as the session understood it, restated rather than quoted:
  the prompt's wording and typos are not kept, and the restatement shows
  how the request was read, so a misreading can be spotted here.
  Follow-up messages that only refined the request without changing what
  was done may be folded into it (a → b → c becomes a+b → c).
- The starting conditions that later choices depend on: environment,
  versions, and permissions (what the agent may not change).

### 2. What was done

- What was done, in the order it was done, including trials that failed
  and what led from each step to the next.
- The reasons behind the choices that set the course. A constraint the
  agent could not change is a condition of the environment: what it was
  and what it ruled out.
- A workaround, together with the condition that made it necessary
  (e.g. pinned to cu128 because driver 573.22 rejected the default
  build). It is temporary only if that is known.
- A requirement added or a direction changed by the requester midway
  that changed what was done next or how the result was judged, at the
  point where it did. Enough to reproduce the findings and the steps;
  not a trace of the conversation.
- A mistake that changed the outcome, where it happened.

### 3. Answer to the request

- The result, the state the environment was left in, and how to undo it
  if relevant. Numbers come with the conditions known (runs, setup).
- Which part of the request, if any, remains unanswered.

### 4. Asides

- After the answer, whatever the session knew that is worth keeping but
  is off the main line. Options considered but not taken, and why, go
  here rather than in section 2. So do surprising findings and tips that
  are valuable but beside the point of the request, explanations of or
  reservations about something in the main text, messages or warnings
  left unaddressed, and things noticed but not pursued. Omitted when
  there is nothing to put in it.

Only the order is required. A short investigation may merge sections 1
and 2.
