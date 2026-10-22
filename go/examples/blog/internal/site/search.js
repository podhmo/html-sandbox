// Search page client: fetch /search.json, index it with MiniSearch, and
// render results. Only this page loads the script; every other page stays
// JavaScript-free.
(() => {
  "use strict";

  const status = document.getElementById("search-status");
  const results = document.getElementById("search-results");
  const form = document.querySelector('form[role="search"]');
  const input = form && form.querySelector('input[name="q"]');
  if (!status || !results || !input) {
    return;
  }

  // MiniSearch is loaded by a separate <script defer> before this one. If it
  // is missing the CDN failed, which is worth telling the reader about.
  if (typeof MiniSearch === "undefined") {
    status.textContent = "Could not load the search library.";
    return;
  }

  // Split Japanese into words when the browser knows how. Latin words are
  // kept as they are, lowercased by processTerm. Without Intl.Segmenter,
  // whitespace is all we can split on.
  function makeTokenizer() {
    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
      try {
        const segmenter = new Intl.Segmenter("ja", { granularity: "word" });
        return (text) => {
          const words = [];
          for (const part of segmenter.segment(String(text).toLowerCase())) {
            if (part.isWordLike) {
              words.push(part.segment);
            }
          }
          return words;
        };
      } catch (err) {
        // Fall through to whitespace splitting below.
      }
    }
    return (text) => String(text).toLowerCase().split(/\s+/).filter(Boolean);
  }

  const tokenize = makeTokenizer();
  const searchOptions = {
    boost: { title: 2 },
    prefix: true,
    fuzzy: 0.2,
    // The word segmenter splits some katakana words into pieces ("プロ",
    // "ファ", "イラ"). Requiring every piece keeps those pieces from
    // matching unrelated pages, which plain OR did badly.
    combineWith: "AND",
  };

  const index = new MiniSearch({
    fields: ["title", "text"],
    storeFields: ["title", "url", "kind", "date", "text"],
    idField: "url", // every page has a unique URL
    tokenize,
    processTerm: (term) => term.toLowerCase(),
    searchOptions,
  });

  let ready = false;
  let generation = 0;
  let timer = 0;

  function setStatus(text) {
    status.textContent = text;
  }

  function terms(query) {
    return tokenize(query).filter((term) => term.length > 0);
  }

  // snippet returns a short piece of text around the first hit. Matching is
  // case-insensitive because tokenize lowercases both sides. The whole query
  // is preferred over its pieces, so a katakana word split by the segmenter
  // does not start the window at a stray "プロ".
  function snippet(text, words, phrase) {
    const limit = 110;
    if (!text) {
      return "";
    }
    const lower = text.toLowerCase();
    let at = phrase ? lower.indexOf(phrase) : -1;
    if (at < 0) {
      for (const word of words) {
        const i = lower.indexOf(word);
        if (i >= 0 && (at < 0 || i < at)) {
          at = i;
        }
      }
    }
    if (at < 0) {
      return text.length > limit ? text.slice(0, limit) + "…" : text;
    }
    const start = Math.max(0, at - 40);
    const end = Math.min(text.length, start + limit);
    return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
  }

  // appendMarked adds text to parent, wrapping every occurrence of words in
  // <mark>. It builds nodes instead of HTML so corpus text and the query can
  // never become markup. When the whole query occurs, mark it alone.
  function appendMarked(parent, text, words, phrase) {
    const lower = text.toLowerCase();
    const ranges = [];
    const found = phrase ? lower.indexOf(phrase) : -1;
    if (found >= 0) {
      ranges.push([found, found + phrase.length]);
    } else {
      for (const word of words) {
        if (!word) {
          continue;
        }
        let from = 0;
        while (ranges.length < 30) {
          const i = lower.indexOf(word, from);
          if (i < 0) {
            break;
          }
          ranges.push([i, i + word.length]);
          from = i + word.length;
        }
      }
    }
    ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const merged = [];
    for (const range of ranges) {
      const last = merged[merged.length - 1];
      if (last && range[0] <= last[1]) {
        last[1] = Math.max(last[1], range[1]);
      } else {
        merged.push(range.slice());
      }
    }
    let pos = 0;
    for (const [start, end] of merged) {
      if (start > pos) {
        parent.appendChild(document.createTextNode(text.slice(pos, start)));
      }
      const mark = document.createElement("mark");
      mark.textContent = text.slice(start, end);
      parent.appendChild(mark);
      pos = end;
    }
    if (pos < text.length) {
      parent.appendChild(document.createTextNode(text.slice(pos)));
    }
  }

  function render(hits, query) {
    results.replaceChildren();
    if (hits.length === 0) {
      setStatus('No results for "' + query + '"');
      return;
    }
    setStatus(hits.length === 1 ? "1 result" : hits.length + " results");
    const words = terms(query);
    const phrase = query.toLowerCase();
    for (const hit of hits) {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = hit.url;
      link.textContent = hit.title;
      li.appendChild(link);

      const label = document.createElement("small");
      label.textContent = hit.kind === "post" && hit.date ? "post · " + hit.date : hit.kind;
      li.appendChild(label);

      const p = document.createElement("p");
      appendMarked(p, snippet(hit.text || "", words, phrase), words, phrase);
      li.appendChild(p);

      results.appendChild(li);
    }
  }

  function runSearch() {
    const query = input.value.trim();
    syncURL(query);
    if (!ready) {
      setStatus("Loading the search index…");
      return;
    }
    if (query === "") {
      results.replaceChildren();
      setStatus("Type a word to search.");
      return;
    }
    // A newer query may have arrived while MiniSearch was working; drop the
    // old one rather than letting it overwrite the newer results.
    const mine = ++generation;
    const hits = index.search(query, searchOptions);
    if (mine === generation) {
      render(hits, query);
    }
  }

  function syncURL(query) {
    const url = new URL(window.location.href);
    if (query === "") {
      url.searchParams.delete("q");
    } else {
      url.searchParams.set("q", query);
    }
    window.history.replaceState(null, "", url);
  }

  function schedule() {
    window.clearTimeout(timer);
    timer = window.setTimeout(runSearch, 100);
  }

  input.addEventListener("input", schedule);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    window.clearTimeout(timer);
    runSearch();
  });

  const initial = new URLSearchParams(window.location.search).get("q");
  if (initial) {
    input.value = initial;
  }
  setStatus("Loading the search index…");

  fetch("/search.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }
      return response.json();
    })
    .then((entries) => {
      index.addAll(entries);
      ready = true;
      runSearch();
    })
    .catch((err) => {
      console.error("search index failed to load", err);
      setStatus("Could not load the search index. Please try again later.");
    });
})();
