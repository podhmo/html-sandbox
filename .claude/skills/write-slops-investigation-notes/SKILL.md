---
name: write-slops-investigation-notes
description: Write technical investigation notes in slops/ documenting concrete trials, discarded alternatives with constraints, answers to the initial question, and forward-looking asides.
---

# Write technical investigation notes (slops)

Author the article in the requested language, following the technical constraints of `write-slops` (tinymarkdown, SVG handling, and file/bundle structures).

Keep the tone matter-of-fact. Do not perform pedantic analysis, debate-style argumentation, or display of intellectual sharpness. Focus strictly on what was tried, what constraints were encountered, and what choices were made, following the four sections below.

## Article structure

### 1. Context and constraints
- State the initial request/question and the starting conditions (environment, hardware, permissions, and tool versions) concisely.
- **You may summarize or reshape the initial prompt for readability rather than quoting it verbatim.**
  - To maintain a clear structure of "request and its verified result".
  - Because quoting full prompt histories or intermediate exchanges upfront clutters the opening, especially when mid-task adjustments are documented later.

### 2. Narrative of trials and decisions
- Follow the actual sequence of events as the backbone of the narrative.
- **Do not write a bulleted chronology or commit log.** Connect steps with causal prose (e.g., "Encountering error X led to attempting Y").
- **Record discarded alternatives**: Whenever a path was rejected, a workaround was chosen, or an option was skipped, state the concrete reason (e.g., lack of root access, driver incompatibility, or scope limit). Workarounds must be recorded as conditional choices tied to environment constraints, not universal rules.
- **Incorporate mid-task adjustments**: If requirements were added or directions shifted during the work, state them as narrative turning points (e.g., "At this point, requirement Z was added") without quoting intermediate chat transcripts verbatim.

### 3. Conclusion to the original question
- Conclude by directly answering the original request or question with the actual results (measurements, outcomes, or cleanup procedures).
- **Do not end with personal reflections, regrets, or self-evaluations** of what went wrong. Keep the focus strictly on what was verified.

### 4. Epilogue: Further possibilities
- Place asides and tangents in a dedicated closing section after the conclusion.
- Use this space to point to possibilities not pursued in the main thread: untried ideas, alternative setups if constraints were relaxed, or future directions.
- Keep the main narrative free of scattered digressions by collecting them here.

## Base rules from write-slops

Follow all formatting and tooling specifications defined in `write-slops` (`.claude/skills/write-slops/SKILL.md`):
- Markdown syntax: strict tinymarkdown (no unsupported block types).
  - Never use `*` for bold or emphasis (`**bold**`, `*em*`), as tinymarkdown does not support it and the literal asterisks clutter the text.
- SVG diagrams: prioritize `tools/svg-gen`, place in ` ```svg ` fences, and document newly encountered failure modes in `03-svg-pitfalls.md`.
- Bundle organization: flat bundles using `YYYY-MM-DD-slug/` with numbered members (`01-`, `02-`) where appropriate.
