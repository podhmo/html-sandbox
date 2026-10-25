// The anchor ids and slugs, mirrored from the Go and MoonBit blogs.
import { describe, expect, test } from "vitest";
import { AnchorIds, slugify } from "./anchors.tsx";

describe("anchors", () => {
  test.each([
    ["Hello World", "hello-world"],
    ["ABC", "abc"],
    ["a-b_c", "a-b_c"],
    ["日本語", "日本語"],
    ["日本語 の 見出し", "日本語-の-見出し"],
    ["日本語　の　見出し", "日本語-の-見出し"],
    ["a\tb", "a-b"],
    ["a  b", "a--b"],
    ["日本語、の。見出し", "日本語の見出し"],
    ["テスト・検証", "テスト検証"],
    ["😀 Emoji", "-emoji"],
    ["Café", "café"],
    ["Hello 世界！", "hello-世界"],
    ["`code` と **強調**", "code-と-強調"],
    ["123", "123"],
    ["!!!", ""],
    ["", ""],
    [" a ", "-a-"],
  ])("slugify(%j) == %j", (title, want) => {
    expect(slugify(title)).toBe(want);
  });

  test("deduplicates ids per page", () => {
    const gen = new AnchorIds();
    expect(gen.id("Hello")).toBe("hello");
    expect(gen.id("Hello")).toBe("hello-1");
    expect(gen.id("Hello")).toBe("hello-2");
    expect(gen.id("foo")).toBe("foo");
    expect(gen.id("foo")).toBe("foo-1");
    expect(gen.id("foo-1")).toBe("foo-1-1");
    expect(gen.id("!!!")).toBe("sec");
    expect(gen.id("???")).toBe("sec-1");
  });

});

// The heading markup itself, the same as the Go and MoonBit blogs emit.
import { parse } from "../../../pkg/tinymarkdown/tinymarkdown.ts";
import { PostPage } from "./views.tsx";
import type { Linker } from "./links.ts";

describe("heading markup", () => {
  test("a section heading has an id and a permalink", () => {
    const post = {
      slug: "hello",
      file: "2026-10-14-hello.md",
      title: "Hello",
      description: "",
      date: "2026-10-14",
      doc: parse("# Hello <script>\nfirst\n## Points\n- one\n- two\n```\nx := <1>\n```\n## Points\n"),
      markdown: "",
    };
    const link: Linker = (u) => u;
    const html = PostPage({ post, link }).toString();
    expect(html).toContain(
      '<h1 id="hello-script">Hello &lt;script&gt;<a class="heading-permalink" href="#hello-script" aria-label="permalink"> #</a></h1>',
    );
    expect(html).toContain(
      '<h2 id="points">Points<a class="heading-permalink" href="#points" aria-label="permalink"> #</a></h2>',
    );
    expect(html).toContain('<h2 id="points-1">');
  });
});
