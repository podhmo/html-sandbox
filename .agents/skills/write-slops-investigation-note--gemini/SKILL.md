---
name: write-slops-investigation-note--gemini
description: Write technical investigation notes in slops/ documenting concrete trials, discarded alternatives with constraints, answers to the initial question, and forward-looking asides.
---

# Write technical investigation notes (slops)

Author the article in the requested language, following the technical constraints of `write-slops` (tinymarkdown, SVG handling, and file/bundle structures).

Focus the narrative on the concrete friction between intent and environment. Rather than general discussions or emotional reflections, document the actual progression of trials, the boundary conditions encountered, and the conditional decisions made to achieve the result.

## Article structure

### 1. Context and constraints
- Reshape the initial request into a concise technical question and target deliverables (environment, hardware, permissions, and tool versions).
- **Do not paste long chat transcripts upfront.** Establish the starting boundary conditions cleanly so the final outcome directly resolves this opening.

### 2. Narrative of trials and decisions
- Follow the sequence of events connected by causal prose (e.g., "Encountering error X led to trying Y").
- **Do not write a bulleted chronology or commit log.**
- **Record discarded alternatives**: Whenever a candidate path was rejected (e.g., command failure, missing root, driver mismatch, or package size), record the concrete environmental constraint that forced the detour.
- Treat workarounds not as permanent rules, but as conditional choices tied to the environment at that time.
- **Incorporate mid-task adjustments**: If requirements were added or directions shifted during the work, state them as narrative turning points without quoting transcripts verbatim.

### 3. Conclusion to the original question
- Directly answer the opening question with verified results (measurements, achieved outcomes, or verified cleanup steps).
- Keep this section strictly factual; avoid personal regrets or self-evaluations.

### 4. Epilogue: Further possibilities
- Collect unpursued ideas, alternative approaches if constraints were relaxed, or future directions in this closing section.
- Keep the main narrative linear and focused by placing forward-looking tangents here.

## Base rules from write-slops

Follow all formatting and tooling specifications defined in `write-slops` (`.agents/skills/write-slops/SKILL.md`):
- Markdown syntax: strict tinymarkdown (no unsupported block types; never use `*` for bold or emphasis).
- SVG diagrams: prioritize `tools/svg-gen`, place in ` ```svg ` fences, and document newly encountered failure modes in `03-svg-pitfalls.md`.
- Bundle organization: flat bundles using `YYYY-MM-DD-slug/` with numbered members (`01-`, `02-`) where appropriate.
