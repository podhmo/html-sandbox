// Package el builds HTML as plain data and renders it, ported from the Go
// blog's pkg/el.
//
// Nodes carry no rendering logic: they are values compared with ==.
// Element and attribute names are distinct types (Tag and AttrName) so
// that passing one where the other is expected fails to compile.

///|
/// Tag is an element name such as "div". Build a one-off dynamic name
/// directly: Tag("my-widget").
#derive(Eq, Debug)
pub(all) struct Tag(String)

///|
/// AttrName is an attribute name such as "class". Build a one-off dynamic
/// name directly: AttrName("data-id").
#derive(Eq, Debug)
pub(all) struct AttrName(String)

///|
/// Node is a piece of HTML. Element children that are Attr or BoolAttr go
/// into the start tag; every other child becomes content.
#derive(Eq, Debug)
pub(all) enum Node {
  /// Text is text content. It is escaped when rendered as HTML.
  Text(String)
  /// Raw is trusted markup written as is. Never put user input in it.
  Raw(String)
  /// Element is an element with its attributes and content.
  Element(Tag, Array[Node])
  /// Attr is an attribute with a value, such as class="x".
  Attr(AttrName, String)
  /// BoolAttr is an attribute without a value, such as hidden.
  BoolAttr(AttrName)
}

///|
/// el returns an element with the given children.
pub fn el(name : Tag, children : Array[Node]) -> Node {
  Element(name, children)
}
