---
name: document-merge
description: Merge two or more articles, reports, drafts, or documents into one independently readable, logically coherent document. Use when asked to combine multiple writings, reconcile overlapping chapters, integrate experiments and their later conclusions, or reconstruct a single narrative from documents with different premises and stages of development. Do not merely concatenate, summarize, or preserve every source detail.
---

# Document Merge

Combine source documents by reconstructing their argumentative and explanatory structure, not by joining their text. Produce a new document that reads as though it was planned as one work from the beginning.

## Governing principles

- Treat all inputs as peers during analysis. Do not choose a primary document because it was provided first, is longer, or is more recent. Distinguish this from **semantic precedence**: later work may revise, reject, or synthesize earlier work.
- Do not target the set-theoretic union of source content. Select information according to the unified document's purpose, explanatory dependencies, and value to its reader.
- Preserve necessary premises and evidence, not necessarily all descriptions, examples, or historical details. Never suppress a consequential disagreement or turn tentative findings into established facts.
- Regard source chapters as *material*, not as a mandatory destination outline. A source section may be split, consolidated, moved, reframed as background, or omitted.
- Work primarily at chapter/section-outline granularity. Drill down to paragraph or claim granularity only where overlaps, contradictions, or missing logical transitions demand it.
- Separate the chronology of discovery from the order best suited to explanation. Preserve chronology where causally important; otherwise optimize for reader comprehension.

## Workflow

### 1. Determine the intended document

Read every available source before drafting. Infer the shared subject, likely reader, central question, and destination (what the unified document should ultimately explain or establish). Use the user's explicit purpose when supplied. If several substantially different destinations remain equally plausible and would materially change the result, ask one focused question; otherwise choose the best-supported destination and proceed.

Do not assume that the last document is the destination, but consider whether it represents a later synthesis or result.

### 2. Extract section-level outlines

For each source, build a working outline covering, when applicable:

- Role: motivation, background, hypothesis, method, evidence, analysis, counterargument, outcome, retrospective, or aside.
- Claim or question: what the section contributes.
- Premises: what the section assumes the reader already knows.
- Reasoning: how it connects premises to findings, including important examples or evidence.
- Dependencies: what must be established elsewhere for the section to make sense.
- Epistemic status: proposal, conjecture, observation, tested result, rejected approach, or unresolved issue.

Do not force narrative, reference, or example-driven sections into a premise-to-conclusion mold. Distinguish the document's chapter hierarchy from cross-section logical dependencies; the latter need not form a tree.

### 3. Compare across sources

Identify overlap, complementary explanations, incompatible claims, distinct perspectives, and *development relationships*: tested, revised, superseded, rejected, or synthesized. Do not mistake a discarded experiment for a current alternative or a later assertion for proof of an earlier hypothesis.

For source material, decide whether it should become:

- Core argument or essential premise.
- Historical path or evidence explaining a design decision.
- Supporting example or detail.
- A valuable but nonessential aside or appendix.
- An omission because it is redundant, immaterial, or excessively detailed.

Keep a private coverage map from source sections or key claims to their destination, transformation, or reason for omission. Do not automatically emit this map.

### 4. Design a new unified outline

Choose the document's throughline and ending, then design chapters from scratch. Arrange premises before dependent arguments, or clearly flag a forward reference that is resolved later. Where two sources assume incompatible conditions, qualify the scope, explain the disagreement, or retain it as unresolved; never invent bridging facts.

A section's role can change during integration: a former proposal may become a considered option; a failed attempt may become a constraint or lesson; a late synthesis may become the article's conclusion. The integrated outline need not preserve source order or boundaries.

Check the outline for a coherent progression from the reader's starting context through the central argument to the intended destination **before** writing full prose. Revise the outline when gaps or circular dependencies appear.

### 5. Compose the document

Write a standalone article in a consistent voice. Supply adequate context for readers who have not seen any inputs. Rewrite transitions and explanations across section boundaries; do not paste source paragraphs together with cosmetic bridges.

Deduplicate repeated premises and explanations without deleting meaningful differences, qualifying conditions, or independent evidence. Keep depth where it helps understand or evaluate the result; avoid compressing substantial reasoning into a list of conclusions.

Use an aside or appendix selectively for independently useful material that would interrupt the central argument. Do not turn it into a dumping ground for all excluded source content.

Respect the user's requested format, audience, scope, and tone. If none is specified, default to a well-structured article with informative headings.

### 6. Audit against the sources

Before delivering, verify:

1. **Continuity:** The reader can follow the prerequisites, argument, and outcome without reading the source documents.
2. **Faithfulness:** Important findings, qualifications, and causal explanations retain their original meaning; claims remain supported by the inputs.
3. **Evolution:** Earlier attempts, later revisions, and final outcomes are not flattened into simultaneous alternatives.
4. **Selection:** Omitted content is nonessential to the unified purpose; valuable tangents are considered for a brief aside rather than automatically kept.
5. **Non-fabrication:** Missing connections are not filled with invented evidence, events, or conclusions. Mark substantive uncertainty explicitly.
6. **Non-concatenation:** The document has a new, purposeful outline rather than sequential mini-summaries of each input.
7. **Order robustness:** The choice of content and narrative is grounded in meaning rather than the order in which files were supplied.

If a critical source claim cannot be reconciled, disclose the conflict in the document instead of silently resolving it. If an input is unavailable or incomplete, state the limitation rather than claiming a full merge.

## Output

Default to delivering the **integrated document itself**, not a planning report, comparison table, or an explanation of the merge process. Do not expose intermediate outlines or the coverage map unless requested. For particularly consequential unresolved conflicts, append a short editorial note only if the reader needs it to interpret the merged document.

## Example: experimental articles

Given three articles about experiments `a`, `b`, `c` (including why the experiments began) and a fourth article about integrating their results into a new skill, do **not** output four condensed summaries or put the synthesis article after three pasted experiments. Instead, construct a new article along a plausible argument such as:

1. What problem motivated building the skill.
2. What approaches were tried, and what each established or ruled out.
3. Which lessons informed integration, preserving necessary evidence and caveats.
4. How the resulting skill works and why its design follows from those lessons.
5. Optional independently valuable side findings.

This is an illustrative shape, not a mandatory template. If a clearer article introduces the final skill before explaining the experiments, prefer that order.

