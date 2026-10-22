// Loading posts and documents: a port of the Go blog's posts.go and
// docs.go, reading the embedded (name, content) pairs instead of an fs.FS.

///|
/// LoadError is content that cannot be served; the message names the
/// file and the problem, as the Go blog's errors do.
pub(all) suberror LoadError {
  LoadError(message~ : String)
} derive(Debug)

///|
/// output writes the message alone, so "\{e}" reads as the error text.
pub impl Show for LoadError with fn output(self, logger) {
  let LoadError(message~) = self
  logger.write_string(message)
}

///|
#deprecated("Use \"\\{e}\" or Show::to_string instead")
pub extend LoadError with Show::{to_string, output}

///|
#deprecated("Use Debug::to_repr instead")
pub extend LoadError with Debug::{to_repr}

///|
/// Post is one blog post loaded from a YYYY-MM-DD-slug.md file.
pub struct Post {
  slug : String
  file : String // file name, e.g. 2026-10-14-hello.md
  date : String // YYYY-MM-DD
  title : String // front matter "title", or the first "#" heading
  description : String // front matter "description", or the first paragraph
  prev : String // front matter "prev", as written
  next : String // front matter "next", as written
  mut prev_nav : NavItem? // "prev" resolved by Site::Site
  mut next_nav : NavItem? // "next" resolved by Site::Site
  doc : @tinymarkdown.Document
  markdown : String // the file as written, front matter included
  // members holds every file of a bundle (a directory named like a post
  // file), face first; empty for a single-file post.
  members : Array[Member]
}

///|
/// Post::link_base is the repository path that relative links of the post
/// resolve against: for a bundle the face member's own file, so relative
/// links stay inside the bundle directory.
fn Post::link_base(self : Post) -> String {
  if self.members is [face, ..] {
    face.source
  } else {
    self.source()
  }
}

///|
/// front_matter_keys are the keys a post or document may set; others are
/// reported as typos.
let front_matter_keys : ReadOnlyArray[String] = [
  "title", "description", "prev", "next",
]

///|
/// check_meta reports a key of meta that is not in front_matter_keys.
fn check_meta(
  name : String,
  meta : Map[String, String],
) -> Unit raise LoadError {
  for k, _ in meta {
    if !front_matter_keys.contains(k) {
      raise LoadError(
        message="\{name}: unknown front matter key \{k.escape()} (want one of [\{front_matter_keys.join(" ")}])",
      )
    }
  }
}

///|
/// Member is one file of a bundle — a directory named like a page's file
/// (posts/YYYY-MM-DD-slug.md/, docs/**/x.md/) — shown as a section of the
/// bundle's page. The first member is the face: it is rendered as the page
/// body and gives the page its title, description, and prev/next.
pub struct Member {
  name : String // file name inside the bundle, e.g. "memo.md"
  source : String // its path in the repository
  is_markdown : Bool // name ends in .md: rendered as Markdown, else as a pre block
  meta : Map[String, String] // front matter, when is_markdown
  doc : @tinymarkdown.Document
  raw : String // the file as written
}

///|
/// member_of returns the member named name, or None.
fn member_of(ms : Array[Member], name : String) -> Member? {
  for m in ms {
    if m.name == name {
      return Some(m)
    }
  }
  None
}

///|
/// load_member builds one member from its file name and content. Bundles
/// are flat: a member name containing "/" is a subdirectory and an error.
fn load_member(
  dir_name : String,
  member_name : String,
  source : String,
  src : String,
) -> Member raise LoadError {
  if member_name.contains("/") {
    raise LoadError(
      message="\{source}: is inside a subdirectory (bundles are flat)",
    )
  }
  if !member_name.has_suffix(".md") {
    return {
      name: member_name,
      source,
      is_markdown: false,
      meta: Map([]),
      doc: @tinymarkdown.parse(""),
      raw: src,
    }
  }
  let (meta, body) = @tinyfrontmatter.split(src) catch {
    e => raise LoadError(message="\{dir_name}/\{member_name}: \{e}")
  }
  let meta = meta.unwrap_or(Map([]))
  check_meta(source, meta)
  {
    name: member_name,
    source,
    is_markdown: true,
    meta,
    doc: @tinymarkdown.parse(body),
    raw: src,
  }
}

///|
/// load_members builds the members of a bundle from its (file name,
/// content) entries, sorted by name with README.md hoisted to the front.
/// repo_dir is the bundle's path in the repository, for Member.source.
fn load_members(
  dir_name : String,
  repo_dir : String,
  entries : Array[(String, String)],
) -> Array[Member] raise LoadError {
  entries.sort_by((a, b) => a.0.lexical_compare(b.0))
  let members = []
  for (member_name, src) in entries {
    members.push(
      load_member(dir_name, member_name, "\{repo_dir}/\{member_name}", src),
    )
  }
  if members.is_empty() {
    raise LoadError(message="\{dir_name}: bundle has no files")
  }
  for i, m in members {
    if m.name == "README.md" {
      ignore(members.remove(i))
      members.insert(0, m)
      break
    }
  }
  members
}

///|
/// load_post_bundle reads the bundle directory dir_name as a single post.
/// Its first member — README.md if present, else the file first in name
/// order — is the face: it gives the post its title, description, and
/// prev/next.
fn load_post_bundle(
  dir_name : String,
  date : String,
  slug : String,
  entries : Array[(String, String)],
) -> Post raise LoadError {
  let members = load_members(dir_name, "\{POSTS_DIR}/\{dir_name}", entries)
  let face = members[0]
  let meta = face.meta
  let title = match meta {
    { "title": t, .. } if t != "" => t
    _ => first_title(face.doc).unwrap_or("")
  }
  if title == "" {
    raise LoadError(
      message="\{face.source}: no title (set \"title\" in front matter or start with a \"# title\" heading)",
    )
  }
  let description = match meta {
    { "description": d, .. } if d != "" => d
    _ => first_paragraph(face.doc.children)
  }
  {
    slug,
    file: dir_name,
    date,
    title,
    description,
    prev: meta.get("prev").unwrap_or(""),
    next: meta.get("next").unwrap_or(""),
    prev_nav: None,
    next_nav: None,
    doc: face.doc,
    markdown: face.raw,
    members,
  }
}

///|
/// load_posts reads every *.md file and every *.md directory (a bundle) in
/// files, given as (file name, content) pairs, newest first. A member
/// appears as "dir/name"; directories not named like a post file are not
/// content.
pub fn load_posts(
  files : ReadOnlyArray[(String, String)],
) -> Array[Post] raise LoadError {
  let seen : Map[String, String] = Map([]) // slug -> file name
  let posts = []
  let bundles : Map[String, Array[(String, String)]] = Map([])
  let bundle_dirs = [] // in file order
  for (name, src) in files {
    if name.find("/") is Some(i) {
      let dir_name = name[:i].to_owned()
      let member_name = name[i + 1:].to_owned()
      match bundles.get(dir_name) {
        Some(list) => list.push((member_name, src))
        None => {
          bundles[dir_name] = [(member_name, src)]
          bundle_dirs.push(dir_name)
        }
      }
      continue
    }
    guard name.has_suffix(".md") else { continue }
    guard post_name(name) is Some((date, slug)) else {
      raise LoadError(
        message="\{name}: file name must look like YYYY-MM-DD-slug.md (slug: a-z, 0-9, -)",
      )
    }
    if check_date(date) is Some(problem) {
      raise LoadError(
        message="\{name}: parsing time \{date.escape()}: \{problem}",
      )
    }
    if seen.get(slug) is Some(prev) {
      raise LoadError(
        message="\{name}: slug \{slug.escape()} is already used by \{prev}",
      )
    }
    seen[slug] = name
    let (meta, body) = @tinyfrontmatter.split(src) catch {
      e => raise LoadError(message="\{name}: \{e}")
    }
    let meta = meta.unwrap_or(Map([]))
    check_meta(name, meta)
    let doc = @tinymarkdown.parse(body)
    let title = match meta {
      { "title": t, .. } if t != "" => t
      _ => first_title(doc).unwrap_or("")
    }
    if title == "" {
      raise LoadError(
        message="\{name}: no title (set \"title\" in front matter or start with a \"# title\" heading)",
      )
    }
    let description = match meta {
      { "description": d, .. } if d != "" => d
      _ => first_paragraph(doc.children)
    }
    posts.push({
      slug,
      file: name,
      date,
      title,
      description,
      prev: meta.get("prev").unwrap_or(""),
      next: meta.get("next").unwrap_or(""),
      prev_nav: None,
      next_nav: None,
      doc,
      markdown: src,
      members: [],
    })
  }
  for dir_name in bundle_dirs {
    guard post_name(dir_name) is Some((date, slug)) else { continue }
    if check_date(date) is Some(problem) {
      raise LoadError(
        message="\{dir_name}: parsing time \{date.escape()}: \{problem}",
      )
    }
    if seen.get(slug) is Some(prev) {
      raise LoadError(
        message="\{dir_name}: slug \{slug.escape()} is already used by \{prev}",
      )
    }
    seen[slug] = dir_name
    posts.push(
      load_post_bundle(dir_name, date, slug, bundles[dir_name]),
    )
  }
  posts.sort_by((a, b) => {
    let c = b.date.lexical_compare(a.date)
    if c != 0 {
      c
    } else {
      a.slug.lexical_compare(b.slug)
    }
  })
  posts
}

///|
/// post_name matches name against YYYY-MM-DD-slug.md, where slug is runs
/// of a-z and 0-9 joined by single "-", and returns the date and the slug.
fn post_name(name : String) -> (String, String)? {
  guard name
    is [
      '0'..<='9',
      '0'..<='9',
      '0'..<='9',
      '0'..<='9',
      '-',
      '0'..<='9',
      '0'..<='9',
      '-',
      '0'..<='9',
      '0'..<='9',
      '-',
      .. slug,
      .. ".md",
    ] else {
    return None
  }
  guard slug =~ re"^[a-z0-9]+(-[a-z0-9]+)*$" else { return None }
  Some((name[:10].to_owned(), slug.to_owned()))
}

///|
/// check_date reports what is wrong with date, digits in the form
/// YYYY-MM-DD, in the words of Go's time.Parse, or None if it is a real
/// day.
fn check_date(date : String) -> String? {
  let num = (s : StringView) => {
    s.iter().fold(init=0, (n, c) => n * 10 + (c.to_int() - '0'.to_int()))
  }
  let year = num(date[0:4])
  let month = num(date[5:7])
  let day = num(date[8:10])
  if month < 1 || month > 12 {
    return Some("month out of range")
  }
  let leap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)
  let days = match month {
    2 => if leap { 29 } else { 28 }
    4 | 6 | 9 | 11 => 30
    _ => 31
  }
  if day < 1 || day > days {
    return Some("day out of range")
  }
  None
}

///|
/// first_title returns the title of the first top-level "#" section.
fn first_title(doc : @tinymarkdown.Document) -> String? {
  for b in doc.children {
    if b is Section(level=1, title~, ..) {
      return Some(title)
    }
  }
  None
}

///|
/// first_paragraph returns the first paragraph in document order, with line
/// breaks turned into spaces.
fn first_paragraph(bs : Array[@tinymarkdown.Block]) -> String {
  for b in bs {
    match b {
      Paragraph(text) => return text.replace_all(old="\n", new=" ")
      Section(children~, ..) => {
        let s = first_paragraph(children)
        if s != "" {
          return s
        }
      }
      _ => ()
    }
  }
  ""
}

///|
/// Doc is a repository document, such as TODO.md or docs/ja/design.md,
/// served under /docs/.
pub struct Doc {
  path : String // URL path below /docs/: the file path without "docs/" and ".md"
  source : String // file path in the repository
  title : String // front matter "title", the first "#" heading, or source
  description : String // front matter "description", or the first paragraph
  prev : String // front matter "prev", as written
  next : String // front matter "next", as written
  mut prev_nav : NavItem? // "prev" resolved by Site::Site
  mut next_nav : NavItem? // "next" resolved by Site::Site
  doc : @tinymarkdown.Document
  markdown : String // the file as written, front matter included
  // members holds every file of a bundle (a directory named like a
  // document file), face first; empty for a single-file document.
  members : Array[Member]
}

///|
/// Doc::link_base is the repository path that relative links of the doc
/// resolve against: for a bundle the face member's own file, so relative
/// links stay inside the bundle directory.
fn Doc::link_base(self : Doc) -> String {
  if self.members is [face, ..] {
    face.source
  } else {
    self.source
  }
}

///|
/// doc_sources are the files and directories of the repository that hold
/// documents, in the order they are listed.
let doc_sources : ReadOnlyArray[String] = ["TODO.md", "docs"]

///|
/// load_docs reads every *.md file in files, given as (file path in the
/// repository, content) pairs, in the order of doc_sources and then in the
/// order Go's fs.WalkDir visits them.
pub fn load_docs(
  files : ReadOnlyArray[(String, String)],
) -> Array[Doc] raise LoadError {
  let sources = []
  for root in doc_sources {
    let found = [
      for f in files if f.0 == root || f.0.has_prefix("\{root}/") => f
    ]
    found.sort_by((a, b) => walk_order(a.0, b.0))
    sources.push_iter(found.iter())
  }
  // Group bundle members: a file under a ".md" directory belongs to that
  // bundle, e.g. docs/x.md/memo.md is "memo.md" of bundle docs/x.md/.
  let bundles : Map[String, Array[(String, String)]] = Map([])
  for (name, src) in sources {
    if name.find(".md/") is Some(i) {
      let bundle_dir = name[:i + 3].to_owned()
      let member_name = name[i + 4:].to_owned()
      match bundles.get(bundle_dir) {
        Some(list) => list.push((member_name, src))
        None => bundles[bundle_dir] = [(member_name, src)]
      }
    }
  }
  let seen : Map[String, String] = Map([]) // path -> source
  let emitted : Set[String] = Set([]) // bundle dirs already turned into docs
  let docs = []
  for (name, src) in sources {
    if name.find(".md/") is Some(i) {
      let bundle_dir = name[:i + 3].to_owned()
      if emitted.contains(bundle_dir) {
        continue
      }
      emitted.add(bundle_dir)
      let p = bundle_dir.strip_suffix(".md").unwrap_or(bundle_dir)
      let p = p.strip_prefix("docs/").unwrap_or(p).to_owned()
      if seen.get(p) is Some(prev) {
        raise LoadError(
          message="\{bundle_dir}: /docs/\{p} is already used by \{prev}",
        )
      }
      // A plain directory docs/p/ would share every member URL.
      if sources.any(fn(f) { f.0.has_prefix("docs/\{p}/") }) {
        raise LoadError(
          message="\{bundle_dir}: pages under docs/\{p}/ would collide with its members",
        )
      }
      seen[p] = bundle_dir
      docs.push(load_doc_bundle(bundle_dir, p, bundles[bundle_dir]))
      continue
    }
    guard name.has_suffix(".md") else { continue }
    let p = name.strip_suffix(".md").unwrap_or(name)
    let p = p.strip_prefix("docs/").unwrap_or(p).to_owned()
    if seen.get(p) is Some(prev) {
      raise LoadError(message="\{name}: /docs/\{p} is already used by \{prev}")
    }
    seen[p] = name
    let (meta, body) = @tinyfrontmatter.split(src) catch {
      e => raise LoadError(message="\{name}: \{e}")
    }
    let meta = meta.unwrap_or(Map([]))
    check_meta(name, meta)
    let doc = @tinymarkdown.parse(body)
    let title = match meta {
      { "title": t, .. } if t != "" => t
      _ => first_title(doc).unwrap_or(name)
    }
    let description = match meta {
      { "description": d, .. } if d != "" => d
      _ => first_paragraph(doc.children)
    }
    docs.push({
      path: p,
      source: name,
      title,
      description,
      prev: meta.get("prev").unwrap_or(""),
      next: meta.get("next").unwrap_or(""),
      prev_nav: None,
      next_nav: None,
      doc,
      markdown: src,
      members: [],
    })
  }
  docs
}

///|
/// load_doc_bundle reads the bundle directory dir_name as a single
/// document whose path is p. Its first member — README.md if present,
/// else the file first in name order — is the face: it gives the
/// document its title, description, and prev/next.
fn load_doc_bundle(
  dir_name : String,
  p : String,
  entries : Array[(String, String)],
) -> Doc raise LoadError {
  let members = load_members(dir_name, dir_name, entries)
  let face = members[0]
  let meta = face.meta
  let title = match meta {
    { "title": t, .. } if t != "" => t
    _ => first_title(face.doc).unwrap_or(dir_name)
  }
  let description = match meta {
    { "description": d, .. } if d != "" => d
    _ => first_paragraph(face.doc.children)
  }
  {
    path: p,
    source: dir_name,
    title,
    description,
    prev: meta.get("prev").unwrap_or(""),
    next: meta.get("next").unwrap_or(""),
    prev_nav: None,
    next_nav: None,
    doc: face.doc,
    markdown: face.raw,
    members,
  }
}

///|
/// walk_order compares file paths the way fs.WalkDir orders them: element
/// by element, so that a directory's files come right after its name.
fn walk_order(a : String, b : String) -> Int32 {
  let xs = a.split("/").to_array()
  let ys = b.split("/").to_array()
  for i in 0..<xs.length().min(ys.length()) {
    let c = xs[i].lexical_compare(ys[i])
    if c != 0 {
      return c
    }
  }
  xs.length().compare(ys.length())
}
