# reports/

Standalone HTML report samples generated with the
[dads-html](https://github.com/podhmo/digital-go-jp-skill) skill (Digital
Agency Design System, HTML edition). Each file is fully self-contained:
all CSS/JS is inlined by `build_standalone.py`, so opening the file in a
browser is enough — no server or network needed (Google Fonts is the only
external reference and falls back gracefully offline).

## Variants

The set follows a thesis/antithesis exploration: pick one archetype,
imagine its opposite, then take three shifted positions. The space the
variants cover is described in
[`docs/sketch/ja/html-report-skill.md`](../docs/sketch/ja/html-report-skill.md).

| File | Type (role) | Reader / structural axis |
| --- | --- | --- |
| `dads/weekly-progress.html` | Weekly progress report (thesis) | Boss / BLUF: status banner → progress → risks → next |
| `dads/personal-memo.html` | Personal memo (antithesis) | Future self / indexing over formality |
| `dads/tech-survey.html` | Technical survey (shift) | Other departments / topic order + TOC + glossary |
| `dads/incident-report.html` | Incident report (shift) | Stakeholders / timeline; fact vs. hypothesis separated |
| `dads/decision-request.html` | Decision request (shift) | Approver / options table; one-screen decision |

All content is fictional sample data.

## Verification applied

- `build_standalone.py` warnings: unknown `dads-*` classes (0)
- headless Chromium at 1280px and 390px: `scrollWidth == clientWidth`, zero
  console errors; `decision-request.html` intentionally scrolls its wide
  table inside `dads-scroll-shadow`

See `slops/2026-11-03-html-report-variations.md` for the retrospective.
