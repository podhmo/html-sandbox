---
name: write-slops
description: Write or revise AI-authored articles in html-sandbox's slops/, or Markdown for its preview, using its small Markdown dialect, inline SVG, and flat article bundles.
---

# Write slops articles

Use the requested language and topic. Keep the question, observed results,
untried ideas, and decisions distinguishable. Do not invent the author's
preferences, measurements, or future commitments to complete a narrative.

## Markdown for this site

This is tinymarkdown, not full CommonMark. For a preview request, return
one Markdown document, without a chat introduction or an outer code fence.
Read the [ready-to-paste preview prompt](../../../slops/2026-10-27-writing-slops.md/01-preview-prompt.md)
when a reusable instruction for another LLM is needed.

- Use headings `#` through `#####`, paragraphs, `- ` or `* ` lists,
  indented list continuations, quotes, tables with a delimiter row,
  inline code, and `[label](URL)` links.
- Code fences use exactly three backticks. Other fence lengths and `~~~`
  are not supported. A literal HTML fragment outside an SVG fence is text.
- Do not rely on emphasis, numbered lists, `![]()` images, `data:` images,
  Mermaid rendering, or syntax highlighting. Explain or simplify instead
  of extending the renderer as part of an article-writing task.
- Front matter, if used, is simple `key: value`, not general YAML.
  Only `title`, `description`, `prev`, and `next` are allowed. Give a
  single-file article or bundle face a title there or in a `#` heading.

## Try SVG illustrations in slops articles

When authoring articles in `slops/`, actively try SVG illustrations to
explore what helps explain the subject and where diagrams fail. This is
an experimental preference for this authoring skill, not an additional
requirement for the reusable preview-format prompt or every article.

Use visual properties to carry meaning: position, scale, shape, overlap,
or change across states. For example, show a concrete object's structure,
a spatial relationship, or a before/after difference. Do not turn prose
sentences into nodes connected by arrows or lines, as in a slide that
merely rearranges the text. Arrows can show an actual movement or relation
in the subject; they should not substitute for an explanation.

Judge the rendered attempt by what it makes easier to see than the prose
alone. Revise or omit it if it adds no insight. When a failed attempt is
useful evidence for an article about diagramming, retain it as an explicitly
labelled counterexample and explain the concrete failure; do not present
it as a successful illustration or add a bad example to every article.

## SVG is an image only with the svg fence label

For inline images, the opening fence must be exactly three backticks
followed by lowercase `svg`: ` ```svg ` (without the surrounding spaces).
Put a complete `<svg xmlns="http://www.w3.org/2000/svg" viewBox="…">`
element inside and close with a line containing three backticks.

An unlabelled fence, `xml`, `html`, or `SVG` displays the source as code;
it does not display an image. Do not put the whole answer in an outer fence.
The [example article](../../../slops/2026-10-27-writing-slops.md/README.md)
contains an actual inline SVG and an unlabelled counterexample.

Keep diagrams small and understandable: ordinary shapes, short `<text>`
labels, and a `viewBox`; set a modest `width`/`height` to avoid stretching
a small diagram across a desktop column. The site's CSS scales it down
on narrow screens. A plain `font-size` or `text-anchor` is enough
when needed. Use the available default/inherited font; do not embed WOFF,
base64 font data, external fonts, or convert labels to paths merely to
polish typography. Prefer `currentColor` for a diagram drawn inline on
both light and dark pages; standalone SVG members need their own legible
colors. Use a short `aria-label` or `<title>` for the image's meaning.

SVG fences are inserted as raw markup, not sanitized. Author simple,
self-contained SVG without scripts, event handlers, `foreignObject`,
or remote resources. Do not copy opaque generated SVG exports blindly.

## One file or one flat bundle

Use `slops/YYYY-MM-DD-slug.md` for a single article, or a directory with
that same naming pattern for a bundle. Use the user's date/timezone;
slugs contain lowercase ASCII letters, digits, and hyphens.

For a bundle, `README.md` is the face and supplies title/description and
optional `prev`/`next`. It may be the main text or an introduction, as the
request requires. The site assembles one page from that face and every
other member, in filename order; `01-`, `02-` prefixes control this order.
Keep the files separate rather than concatenating them into README.

Other `.md` members render as Markdown sections; `.svg` members appear
as images; other text files appear as code. Each member also has a raw
route at `/slops/<slug>/<filename>`. Subdirectories are rejected, and
binary PNG/JPEG members are not supported. Prefer simple ASCII filenames
without spaces, `#`, or `?`.

Write relative links from the member's own location. `[notes](01-notes.md)`
links to that member's raw file; use a page fragment such as `#01-notesmd`
to jump to its rendered section in the combined page. Inline SVG belongs
in a labelled fence; an `.svg` member is shown automatically without
unsupported Markdown image syntax.

Use a bundle for supplemental explanations, alternative treatments, or
source files, not as a mandatory structure for every article. Read the
[bundle prompt](../../../slops/2026-10-27-writing-slops.md/02-bundle-prompt.md)
when asking an agent to create several files.

## Check the intended output

Use `/preview` for one document's actual rendering; paste raw Markdown or
load its `.md` file. It does not upload a directory or assemble a bundle.
Preview relative links resolve as if the text were `posts/preview.md`,
so check bundle links and combined sections on the local blog as well.

`make -C go watch` serves the current source files. Verify that SVG is an
image, unlabelled examples remain code, and supplemental files appear in
order and can be fetched individually. Refresh embedded content before
using a built server (`make -C go generate`). For a committed content
change, `make test-go` checks loading and routes. Use MoonBit checks when
checking that implementation; do not claim TypeScript parity from those
results. The current TypeScript view does not render SVG fences as images.

Report which renderer and checks were used. Article authoring alone does
not request deployment or permission to publish to an external service.
