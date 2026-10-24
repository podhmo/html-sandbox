// Adds a "Copy" button to every pre block: the block is wrapped in a
// .code-block div so the button can sit at its top right without becoming
// part of the pre's text. Clicking it writes the block's text to the
// clipboard and shows the outcome on the button for a moment.
(() => {
  const copyText = async (text) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return;
    }
    // navigator.clipboard needs a secure context; on plain HTTP (e.g. the
    // Go server reached over LAN) fall back to a hidden textarea.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.append(ta);
    ta.select();
    try {
      if (!document.execCommand("copy")) throw new Error("copy failed");
    } finally {
      ta.remove();
    }
  };

  for (const pre of document.querySelectorAll("pre")) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy secondary outline";
    button.textContent = "Copy";
    button.addEventListener("click", async () => {
      try {
        await copyText(pre.textContent);
        button.textContent = "Copied";
      } catch {
        button.textContent = "Failed";
      }
      setTimeout(() => {
        button.textContent = "Copy";
      }, 1500);
    });

    const wrap = document.createElement("div");
    wrap.className = "code-block";
    pre.before(wrap);
    wrap.append(pre, button);
  }
})();
