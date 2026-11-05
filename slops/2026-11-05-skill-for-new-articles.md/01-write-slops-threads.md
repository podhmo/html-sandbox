# 実験で使った write-slops-threads

fork の前に `write-slops-threads` ブランチで作ったスキルの全文。このブランチはマージしないので、ここに写しておく。

```
---
name: write-slops-threads
description: Experimental variant of write-slops that changes only how an article's subject is chosen when the work had several threads. Use only when the user names write-slops-threads explicitly; otherwise use write-slops.
---

# Write slops articles by picking one thread

This skill is an experiment to compare against write-slops. Everything
about Markdown, SVG, figures, file layout, honesty about sources, and
checking the output follows
[write-slops](../write-slops/SKILL.md); read it first. This skill only
adds how to decide what the article talks about.

## Comparing with write-slops

When asked to compare the two skills on the same work, do not write
either article in the main session. Spawn two fork subagents (Agent with
`subagent_type: "fork"`), so both inherit the same session context: one
writes with write-slops, the other with write-slops-threads. Give them
different slugs (e.g. a `-threads` suffix) because they share the working
tree, and tell neither about the other's article.

## Lay out what happened, unsummarized

Before writing, list what happened in this session in the order it
happened: what was asked, what you did, what came out, where you chose
between options, what you noticed on the way. Do not group, rank, or
name patterns yet. This list is working material, not the article.

## Pick one thread

Look at the list for separate threads: lines of work or questions that
could each be told on their own. If the request names one, take that one.
Otherwise pick one and say in the article which one it is.

The article tells that thread only. Leave the other threads out; name
them at the end as not covered, or write them as separate articles or
bundle members if the request asks for that.

Do not introduce a framework, a list of properties, or a general claim
to cover several threads at once.

## Separate what you understood from what you did not

Within the thread, write what became clear and what is still unclear.
Leave the unclear parts unclear rather than filling them with an
explanation you did not check.
```
