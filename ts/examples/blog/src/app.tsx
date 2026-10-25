// The blog as a Hono app, and the Worker's entry point. favicon.svg and
// site.css never reach it: Workers serves them from dist/client/ as static
// assets, before the Worker runs.
import { Hono, type Context } from "hono";
import { loadDocs, loadPosts, postPath } from "./content.ts";
import { linker } from "./links.ts";
import { DocList, DocPage, ErrorPage, PostList, PostPage, layout, siteDescription } from "./views.tsx";
import * as sources from "./sources.ts";

type Env = {
  Bindings: {
    // BASE_URL is the public origin for OGP tags, e.g. https://example.com.
    BASE_URL: string;
  };
};

// The posts and documents are parsed once, when the isolate starts. Parsing
// them on the first request instead cut the reported startup time from
// about 13 ms to 3 ms, but moved the work into requests: 9 of 25 took 18 to
// 43 ms of CPU, against 1 of 25 (15 ms) this way. See
// docs/sketch/ja/ts-hono-workers.md.
const posts = [...loadPosts(sources.posts), ...loadPosts(sources.slops).map((p) => ({ ...p, collection: "slops" as const }))];
const docs = loadDocs(sources.docs);
const bySlug = new Map(posts.map((p) => [postPath(p), p]));
const byPath = new Map(docs.map((d) => [d.path, d]));

const app = new Hono<Env>();
app.use(layout);

function notFound(c: Context<Env>, message: string) {
  c.status(404);
  return c.render(<ErrorPage title="404 Not Found" message={message} />, { title: "404 Not Found", description: message });
}

// markdown serves the source of a page. nosniff keeps browsers from
// guessing that Markdown containing tags is HTML.
function markdown(c: Context<Env>, src: string) {
  return c.body(src, 200, { "Content-Type": "text/markdown; charset=utf-8", "X-Content-Type-Options": "nosniff" });
}

app.get("/", (c) =>
  c.render(<PostList posts={posts.filter((p) => p.collection === "slops")} collection="slops" />, { description: siteDescription, url: `${c.env.BASE_URL}/`, type: "website" }),
);

for (const collection of ["posts", "slops"] as const) {
  app.get(`/${collection}`, (c) => c.redirect(`/${collection}/`, 307));
  app.get(`/${collection}/`, (c) => c.render(
    <PostList posts={posts.filter((p) => (p.collection ?? "posts") === collection)} collection={collection} />,
    { title: collection === "slops" ? "Slops" : "Posts", description: `blog by ${collection === "slops" ? "AI" : "human"}`, url: `${c.env.BASE_URL}/${collection}/`, type: "website" },
  ));
  app.get(`/${collection}/:slug/:member`, (c) => {
    const post = bySlug.get(`/${collection}/${c.req.param("slug")}`);
    const member = post?.members?.find((m) => m.name === c.req.param("member"));
    if (!member) return notFound(c, "Page not found.");
    const type = member.isMarkdown ? "text/markdown; charset=utf-8" : member.name.endsWith(".svg") ? "image/svg+xml" : "text/plain; charset=utf-8";
    return c.body(member.markdown, 200, { "Content-Type": type, "X-Content-Type-Options": "nosniff" });
  });
  app.get(`/${collection}/:slug`, (c) => {
    const slug = c.req.param("slug");
    const post = bySlug.get(`/${collection}/${slug.replace(/\.md$/, "")}`);
    if (!post) return notFound(c, "Post not found.");
    if (slug.endsWith(".md")) return markdown(c, post.markdown);
    return c.render(<PostPage post={post} posts={posts} docs={docs} link={linker(`${collection}/${post.file}${post.members ? "/" + post.members[0].name : ""}`, posts, docs)} />, {
      title: post.title, description: post.description,
      url: `${c.env.BASE_URL}${postPath(post)}`, type: "article",
    });
  });
}

app.get("/docs", (c) => c.redirect("/docs/", 307));

app.get("/docs/", (c) =>
  c.render(<DocList docs={docs} />, {
    title: "Docs",
    description: "Documents of this repository.",
    url: `${c.env.BASE_URL}/docs/`,
    type: "website",
  }),
);

app.get("/docs/:path{.+}", (c) => {
  const path = c.req.param("path");
  const doc = byPath.get(path.replace(/\.md$/, ""));
  if (!doc) return notFound(c, "Document not found.");
  if (path.endsWith(".md")) return markdown(c, doc.markdown);
  return c.render(<DocPage doc={doc} link={linker(doc.source, posts, docs)} />, {
    title: doc.title,
    description: doc.description,
    url: `${c.env.BASE_URL}/docs/${doc.path}`,
    type: "article",
  });
});

app.notFound((c) => notFound(c, "Page not found."));

app.onError((err, c) => {
  console.error(err);
  c.status(500);
  return c.render(<ErrorPage title="500 Internal Server Error" message="Something went wrong." />, {
    title: "500 Internal Server Error",
    description: "Something went wrong.",
  });
});

export default app;
