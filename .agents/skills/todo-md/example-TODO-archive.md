# TODO archive

> **What this file is:** append-only history of completed work moved out of
> `TODO.md` by a periodic GC sweep (see `.agents/skills/todo-md/SKILL.md` —
> feature PRs never write here, so this file never conflicts). Each item
> lands at the end of the file as one line, prefixed with its ancestor
> chain (`- [x] A > B > **C**: ...`), so a grep hit names the whole path.
> Wording and links are kept verbatim; only the layout is normalized.
>
> **Reading this file:** do not read it whole — `grep` for a symbol or
> feature name; the matching line is the whole entry.

- [x] **`HTMLRenderer`** ([#1](#)): wrapped lines in TODO.md are joined into one line at GC time.
- [x] HTML correctness > **Escape text and attribute values**: the chain names the parent by its title only (no `[ ]`/`[-]` marker — open-state greps stay clean).
- [x] HTML correctness > Escape text and attribute values > **Attributes**: deeper nesting extends the chain.
- HTML correctness > 完了の条件: notes without a checkbox get a chain too.
