function _M0TPC16string10StringView(param0, param1, param2) {
  this.str = param0;
  this.start = param1;
  this.end = param2;
}
function _M0DTP46podhmo14html_2dsandbox3pkg2el4Node4Text(param0) {
  this._0 = param0;
}
_M0DTP46podhmo14html_2dsandbox3pkg2el4Node4Text.prototype.$tag = 0;
function _M0DTP46podhmo14html_2dsandbox3pkg2el4Node3Raw(param0) {
  this._0 = param0;
}
_M0DTP46podhmo14html_2dsandbox3pkg2el4Node3Raw.prototype.$tag = 1;
function _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element.prototype.$tag = 2;
function _M0DTP46podhmo14html_2dsandbox3pkg2el4Node4Attr(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTP46podhmo14html_2dsandbox3pkg2el4Node4Attr.prototype.$tag = 3;
function _M0DTP46podhmo14html_2dsandbox3pkg2el4Node8BoolAttr(param0) {
  this._0 = param0;
}
_M0DTP46podhmo14html_2dsandbox3pkg2el4Node8BoolAttr.prototype.$tag = 4;
function $oob() {
  throw new Error("Index out of bounds");
}
function _M0TPB13StringBuilder(param0) {
  this.val = param0;
}
class $PanicError extends Error {}
function $panic() {
  throw new $PanicError();
}
const _M0FPB12random__seed = () => {
  if (globalThis.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return array[0] | 0; // Convert to signed 32
  } else {
    return Math.floor(Math.random() * 0x100000000) | 0; // Fallback to Math.random
  }
};
const _M0FPB19int__to__string__js = (x, radix) => {
  return x.toString(radix);
};
function _M0TPB4IterGRPC16string10StringViewE(param0, param1) {
  this.f = param0;
  this.size_hint = param1;
}
function _M0TPB4IterGcE(param0, param1) {
  this.f = param0;
  this.size_hint = param1;
}
function _M0TPB9ArrayViewGyE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function $makebytes(a, b) {
  const arr = new Uint8Array(a);
  if (b !== 0) {
    arr.fill(b);
  }
  return arr;
}
function _M0TPB8MutLocalGiE(param0) {
  this.val = param0;
}
function $make_array_len_and_init(a, b) {
  const arr = new Array(a);
  arr.fill(b);
  return arr;
}
const _M0MPB7JSArray4push = (arr, val) => { arr.push(val); };
function _M0TPB8MutLocalGORPC16string10StringViewE(param0) {
  this.val = param0;
}
function _M0TPB9ArrayViewGsE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function _M0TPB9ArrayViewGRP46podhmo14html_2dsandbox3pkg2el4NodeE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function _M0TPB3MapGssE(param0, param1, param2, param3, param4, param5, param6) {
  this.entries = param0;
  this.size = param1;
  this.capacity = param2;
  this.capacity_mask = param3;
  this.grow_at = param4;
  this.head = param5;
  this.tail = param6;
}
function _M0TPB3MapGsiE(param0, param1, param2, param3, param4, param5, param6) {
  this.entries = param0;
  this.size = param1;
  this.capacity = param2;
  this.capacity_mask = param3;
  this.grow_at = param4;
  this.head = param5;
  this.tail = param6;
}
function _M0TPB5EntryGssE(param0, param1, param2, param3, param4, param5) {
  this.prev = param0;
  this.next = param1;
  this.psl = param2;
  this.hash = param3;
  this.key = param4;
  this.value = param5;
}
function _M0TPB5EntryGsiE(param0, param1, param2, param3, param4, param5) {
  this.prev = param0;
  this.next = param1;
  this.psl = param2;
  this.hash = param3;
  this.key = param4;
  this.value = param5;
}
const $bytes_literal$0 = new Uint8Array();
const _M0MPB7JSArray11set__length = (arr, len) => { arr.length = len; };
const _M0MPB7JSArray3pop = (arr) => arr.pop();
const _M0MPB7JSArray6splice = (arr, idx, cnt) => arr.splice(idx, cnt);
function _M0TPB9ArrayViewGRPC16string10StringViewE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
const _M0FPC28encoding4utf816encode__utf8__js = (() => {
   const encoder = new TextEncoder();
   return function(src, start, len, bom) {
     const end = start + len;
     const encoded = encoder.encode(src.slice(start, end));
     if (!bom) {
       return encoded;
     }
     const result = new Uint8Array(encoded.length + 3);
     result[0] = 0xEF;
     result[1] = 0xBB;
     result[2] = 0xBF;
     result.set(encoded, 3);
     return result;
   };
 })();
const _M0FPC28encoding4utf823decode__utf8__lossy__js = ((preserveBOMDecoder, dropBOMDecoder) => function(bytes, start, len, preserveBOM) {
   const end = start + len;
   const slice = bytes.subarray(start, end);
   const decoder = preserveBOM ? preserveBOMDecoder : dropBOMDecoder;
   return decoder.decode(slice);
 })(
   new TextDecoder("utf-8", { ignoreBOM: true }),
   new TextDecoder("utf-8", { ignoreBOM: false }),
 );
function _M0TPC16buffer6Buffer(param0, param1) {
  this.data = param0;
  this.len = param1;
}
function _M0TPC15bytes9BytesView(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function _M0DTPC16result6ResultGUORPB3MapGssEsERP46podhmo14html_2dsandbox3pkg15tinyfrontmatter10SplitErrorE3Err(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGUORPB3MapGssEsERP46podhmo14html_2dsandbox3pkg15tinyfrontmatter10SplitErrorE3Err.prototype.$tag = 0;
function _M0DTPC16result6ResultGUORPB3MapGssEsERP46podhmo14html_2dsandbox3pkg15tinyfrontmatter10SplitErrorE2Ok(param0) {
  this._0 = param0;
}
_M0DTPC16result6ResultGUORPB3MapGssEsERP46podhmo14html_2dsandbox3pkg15tinyfrontmatter10SplitErrorE2Ok.prototype.$tag = 1;
function _M0TPB9ArrayViewGUssEE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function _M0DTPC15error5Error73podhmo_2fhtml_2dsandbox_2fpkg_2ftinyfrontmatter_2eSplitError_2eSplitError(param0) {
  this._0 = param0;
}
_M0DTPC15error5Error73podhmo_2fhtml_2dsandbox_2fpkg_2ftinyfrontmatter_2eSplitError_2eSplitError.prototype.$tag = 0;
function _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block7Section(param0, param1, param2) {
  this._0 = param0;
  this._1 = param1;
  this._2 = param2;
}
_M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block7Section.prototype.$tag = 0;
function _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block9Paragraph(param0) {
  this._0 = param0;
}
_M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block9Paragraph.prototype.$tag = 1;
function _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block4List(param0) {
  this._0 = param0;
}
_M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block4List.prototype.$tag = 2;
function _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block5Quote(param0) {
  this._0 = param0;
}
_M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block5Quote.prototype.$tag = 3;
function _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block5Alert(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block5Alert.prototype.$tag = 4;
function _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block5Table(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block5Table.prototype.$tag = 5;
function _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block9CodeBlock(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block9CodeBlock.prototype.$tag = 6;
function _M0TP46podhmo14html_2dsandbox3pkg12tinymarkdown4Item(param0, param1) {
  this.text = param0;
  this.children = param1;
}
function _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown4Flat5Block(param0) {
  this._0 = param0;
}
_M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown4Flat5Block.prototype.$tag = 0;
function _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown4Flat7Heading(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown4Flat7Heading.prototype.$tag = 1;
function _M0TP46podhmo14html_2dsandbox3pkg12tinymarkdown8Document(param0) {
  this.children = param0;
}
function _M0TP46podhmo14html_2dsandbox3pkg12tinymarkdown7RawItem(param0, param1) {
  this.indent = param0;
  this.text = param1;
}
function _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown6Inline4Text(param0) {
  this._0 = param0;
}
_M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown6Inline4Text.prototype.$tag = 0;
function _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown6Inline4Code(param0) {
  this._0 = param0;
}
_M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown6Inline4Code.prototype.$tag = 1;
function _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown6Inline4Link(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown6Inline4Link.prototype.$tag = 2;
function _M0TP56podhmo14html_2dsandbox8examples4blog4site9AnchorIds(param0) {
  this.seen = param0;
}
function _M0TPB9ArrayViewGUsiEE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function _M0TP56podhmo14html_2dsandbox8examples4blog4site3Ref(param0, param1, param2, param3) {
  this.scheme = param0;
  this.path = param1;
  this.raw_query = param2;
  this.fragment = param3;
}
const _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger = { method_0: _M0IPB13StringBuilderPB6Logger13write__string, method_1: _M0IP016_24default__implPB6Logger16write__substringGRPB13StringBuilderE, method_2: _M0IPB13StringBuilderPB6Logger11write__view, method_3: _M0IPB13StringBuilderPB6Logger11write__char, method_4: _M0IP016_24default__implPB6Logger28write__string__interpolationGRPB13StringBuilderE, method_5: _M0IP016_24default__implPB6Logger5writeGRPB13StringBuilderE };
const _M0MPB4Iter4nextN6constrS156GRPC16string10StringViewE = 0;
const _M0MPB4Iter4nextN6constrS157GRPC16string10StringViewE = 0;
const _M0MPB4Iter4nextN6constrS172GcE = 0;
const _M0MPB4Iter4nextN6constrS173GcE = 0;
const _M0MPB4Iter3newN6constrS190GRPC16string10StringViewE = 0;
const _M0MPB4Iter3newN6constrS196GcE = 0;
const _M0FP46podhmo14html_2dsandbox3pkg2el1a = "a";
const _M0FP46podhmo14html_2dsandbox3pkg2el7article = "article";
const _M0FP46podhmo14html_2dsandbox3pkg2el10blockquote = "blockquote";
const _M0FP46podhmo14html_2dsandbox3pkg2el4code = "code";
const _M0FP46podhmo14html_2dsandbox3pkg2el3div = "div";
const _M0FP46podhmo14html_2dsandbox3pkg2el2h1 = "h1";
const _M0FP46podhmo14html_2dsandbox3pkg2el2h2 = "h2";
const _M0FP46podhmo14html_2dsandbox3pkg2el2h3 = "h3";
const _M0FP46podhmo14html_2dsandbox3pkg2el2h4 = "h4";
const _M0FP46podhmo14html_2dsandbox3pkg2el2h5 = "h5";
const _M0FP46podhmo14html_2dsandbox3pkg2el2li = "li";
const _M0FP46podhmo14html_2dsandbox3pkg2el1p = "p";
const _M0FP46podhmo14html_2dsandbox3pkg2el3pre = "pre";
const _M0FP46podhmo14html_2dsandbox3pkg2el7section = "section";
const _M0FP46podhmo14html_2dsandbox3pkg2el5table = "table";
const _M0FP46podhmo14html_2dsandbox3pkg2el5tbody = "tbody";
const _M0FP46podhmo14html_2dsandbox3pkg2el2td = "td";
const _M0FP46podhmo14html_2dsandbox3pkg2el2th = "th";
const _M0FP46podhmo14html_2dsandbox3pkg2el5thead = "thead";
const _M0FP46podhmo14html_2dsandbox3pkg2el2tr = "tr";
const _M0FP46podhmo14html_2dsandbox3pkg2el2ul = "ul";
const _M0FP46podhmo14html_2dsandbox3pkg2el5class = "class";
const _M0FP46podhmo14html_2dsandbox3pkg2el4href = "href";
const _M0FP46podhmo14html_2dsandbox3pkg2el2id = "id";
const _M0FP56podhmo14html_2dsandbox8examples4blog4site11drop__chars = "×÷・";
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1527 = { _0: 161, _1: 192 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1528 = { _0: 8192, _1: 8304 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1529 = { _0: 8352, _1: 8384 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1530 = { _0: 8400, _1: 8448 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1531 = { _0: 8448, _1: 8528 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1532 = { _0: 8592, _1: 9312 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1533 = { _0: 9472, _1: 11264 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1534 = { _0: 11776, _1: 11904 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1535 = { _0: 12289, _1: 12292 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1536 = { _0: 12296, _1: 12306 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1537 = { _0: 12308, _1: 12320 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1538 = { _0: 12336, _1: 12337 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1539 = { _0: 12349, _1: 12350 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1540 = { _0: 65024, _1: 65040 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1541 = { _0: 65040, _1: 65136 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1542 = { _0: 65281, _1: 65296 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1543 = { _0: 65306, _1: 65313 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1544 = { _0: 65339, _1: 65345 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1545 = { _0: 65371, _1: 65382 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1546 = { _0: 126976, _1: 129792 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1547 = { _0: 917504, _1: 921600 };
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__ranges = [_M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1527, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1528, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1529, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1530, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1531, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1532, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1533, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1534, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1535, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1536, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1537, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1538, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1539, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1540, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1541, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1542, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1543, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1544, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1545, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1546, _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__rangesN5tupleS1547];
const _M0FP56podhmo14html_2dsandbox8examples4blog4site11hex__digits = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 65, 66, 67, 68, 69, 70];
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12doc__sources = ["TODO.md", "docs"];
const _M0MPC16string10StringView4findN6constrS382 = 0;
const _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter9cut__lineN6recordS1256 = new _M0TPC16string10StringView("\n", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter9cut__lineN6recordS1257 = new _M0TPC16string10StringView("", 0, 0);
const _M0FPB4seed = _M0FPB12random__seed();
const _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter10trim__lineN6recordS1262 = new _M0TPC16string10StringView(" \t\r", 0, 3);
const _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter5splitN6recordS1278 = new _M0TPC16string10StringView("---", 0, 3);
const _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter5splitN6recordS1279 = new _M0TPC16string10StringView("", 0, 0);
const _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter5splitN6recordS1280 = new _M0TPC16string10StringView("---", 0, 3);
const _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter5splitN6recordS1281 = new _M0TPC16string10StringView("", 0, 0);
const _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter5splitN6recordS1282 = new _M0TPC16string10StringView(":", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter5splitN6recordS1283 = new _M0TPC16string10StringView("\t\n\u000b\f\r                  　", 0, 25);
const _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter5splitN6recordS1284 = new _M0TPC16string10StringView("\t\n\u000b\f\r                  　", 0, 25);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown10code__textN6recordS1486 = new _M0TPC16string10StringView("\n", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown10code__textN6recordS1487 = new _M0TPC16string10StringView("\n", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown10code__textN6recordS1488 = new _M0TPC16string10StringView(" ", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown10code__textN6recordS1489 = new _M0TPC16string10StringView(" ", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown10code__textN6recordS1490 = new _M0TPC16string10StringView("", 0, 0);
const _M0FP56podhmo14html_2dsandbox8examples4blog4site9permalinkN6constrS1592 = new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node3Raw(" #");
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown14parse__headingN6recordS1369 = new _M0TPC16string10StringView(" ", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown14unescape__cellN6recordS1372 = new _M0TPC16string10StringView("\\", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown14unescape__cellN6recordS1373 = new _M0TPC16string10StringView("\\|", 0, 2);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown14unescape__cellN6recordS1374 = new _M0TPC16string10StringView("|", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown5cellsN6recordS1376 = new _M0TPC16string10StringView("|", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown5cellsN6recordS1377 = new _M0TPC16string10StringView("|", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown5cellsN6recordS1378 = new _M0TPC16string10StringView("", 0, 0);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1420 = new _M0TPC16string10StringView("\n", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1421 = new _M0TPC16string10StringView("\n", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1422 = new _M0TPC16string10StringView("\n", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1423 = new _M0TPC16string10StringView("\n", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1424 = new _M0TPC16string10StringView("", 0, 0);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1425 = new _M0TPC16string10StringView("\n", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1426 = new _M0TPC16string10StringView("\r", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1427 = new _M0TPC16string10StringView("```", 0, 3);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1428 = new _M0TPC16string10StringView("\n", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1429 = new _M0TPC16string10StringView("", 0, 0);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1430 = new _M0TPC16string10StringView("```", 0, 3);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1431 = new _M0TPC16string10StringView("", 0, 0);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1432 = new _M0TPC16string10StringView("|", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1433 = new _M0TPC16string10StringView(">", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1434 = new _M0TPC16string10StringView(">", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1435 = new _M0TPC16string10StringView(" ", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1436 = new _M0TPC16string10StringView("\n", 0, 1);
const _M0FP56podhmo14html_2dsandbox8examples4blog4site5cleanN6recordS1682 = new _M0TPC16string10StringView("/", 0, 1);
const _M0FP56podhmo14html_2dsandbox8examples4blog4site5cleanN6recordS1683 = new _M0TPC16string10StringView("/", 0, 1);
const _M0FP56podhmo14html_2dsandbox8examples4blog4site5cleanN6recordS1684 = new _M0TPC16string10StringView("..", 0, 2);
const _M0FP56podhmo14html_2dsandbox8examples4blog4site5cleanN6recordS1685 = new _M0TPC16string10StringView("/", 0, 1);
const _M0FP56podhmo14html_2dsandbox8examples4blog4site3dirN6recordS1703 = new _M0TPC16string10StringView("/", 0, 1);
const _M0FP56podhmo14html_2dsandbox8examples4blog4site4joinN6recordS1721 = new _M0TPC16string10StringView("/", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg4http16unescape_2einnerN6recordS1204 = new _M0TPC16string10StringView("%", 0, 1);
const _M0FP46podhmo14html_2dsandbox3pkg4http16unescape_2einnerN6recordS1205 = new _M0TPC16string10StringView("+", 0, 1);
const _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parseN6recordS1725 = new _M0TPC16string10StringView("/", 0, 1);
const _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parseN6recordS1726 = new _M0TPC16string10StringView("/", 0, 1);
const _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parseN6recordS1727 = new _M0TPC16string10StringView(":", 0, 1);
const _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parseN6recordS1728 = new _M0TPC16string10StringView("/", 0, 1);
const _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parseN6recordS1729 = new _M0TPC16string10StringView("", 0, 0);
const _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parseN6recordS1730 = new _M0TPC16string10StringView("/", 0, 1);
const _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parseN6recordS1731 = new _M0TPC16string10StringView("?", 0, 1);
const _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parseN6recordS1732 = new _M0TPC16string10StringView("#", 0, 1);
const _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parseN6constrS1733 = "";
const _M0FP56podhmo14html_2dsandbox8examples4blog4site7resolveN6recordS1786 = new _M0TPC16string10StringView("../", 0, 3);
const _M0FP56podhmo14html_2dsandbox8examples4blog4site10post__nameN25_2atransition__table__148S1817 = [3, 3, 3, 3, 3, 3, 2, 3, 0, 1, 2, 3];
const _M0FP56podhmo14html_2dsandbox8examples4blog4site10post__nameN6constrS1818 = 10;
const _M0FP56podhmo14html_2dsandbox8examples4blog4site9doc__pathN6recordS1809 = new _M0TPC16string10StringView(".md", 0, 3);
const _M0FP56podhmo14html_2dsandbox8examples4blog4site9doc__pathN6recordS1810 = new _M0TPC16string10StringView("docs/", 0, 5);
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12preview__urlN6recordS1848 = new _M0TPC16string10StringView("/", 0, 1);
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12preview__urlN6recordS1849 = new _M0TPC16string10StringView("/", 0, 1);
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12preview__urlN6recordS1850 = new _M0TPC16string10StringView(".md/", 0, 4);
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12preview__urlN6recordS1851 = new _M0TPC16string10StringView("/", 0, 1);
const _M0FP56podhmo14html_2dsandbox8examples4blog4site12preview__urlN6recordS1852 = new _M0TPC16string10StringView(".md", 0, 3);
const _M0FP56podhmo14html_2dsandbox8examples4blog7preview6renderN6recordS1911 = new _M0TPC16string10StringView("\n", 0, 1);
const _M0FP56podhmo14html_2dsandbox8examples4blog7preview6renderN6recordS1912 = new _M0TPC16string10StringView("", 0, 0);
function _M0FPB13consume4__acc(acc, input) {
  const _p = (acc >>> 0) + ((Math.imul(input, -1028477379) | 0) >>> 0) | 0;
  const _p$2 = 17;
  return Math.imul(_p << _p$2 | (_p >>> (32 - _p$2 | 0) | 0), 668265263) | 0;
}
function _M0MPC15array10FixedArray12unsafe__blitGyE(dst, dst_offset, src, src_offset, len) {
  if (dst === src && dst_offset < src_offset) {
    let _tmp = 0;
    while (true) {
      const i = _tmp;
      if (i < len) {
        const _tmp$2 = dst_offset + i | 0;
        const _tmp$3 = src_offset + i | 0;
        if (_tmp$2 >>> 0 < dst.length) {
          dst[_tmp$2] = _tmp$3 >>> 0 < src.length ? src[_tmp$3] : $oob();
        } else {
          $oob();
        }
        _tmp = i + 1 | 0;
        continue;
      } else {
        return;
      }
    }
  } else {
    let _tmp = len - 1 | 0;
    let _tmp$2 = len > 0;
    while (true) {
      const i = _tmp;
      const _more = _tmp$2;
      if (_more) {
        const _tmp$3 = dst_offset + i | 0;
        const _tmp$4 = src_offset + i | 0;
        if (_tmp$3 >>> 0 < dst.length) {
          dst[_tmp$3] = _tmp$4 >>> 0 < src.length ? src[_tmp$4] : $oob();
        } else {
          $oob();
        }
        _tmp = i - 1 | 0;
        _tmp$2 = i > 0;
        continue;
      } else {
        return;
      }
    }
  }
}
function _M0MPC15array10FixedArray12unsafe__blitGRPB17UnsafeMaybeUninitGyEE(dst, dst_offset, src, src_offset, len) {
  if (dst === src && dst_offset < src_offset) {
    let _tmp = 0;
    while (true) {
      const i = _tmp;
      if (i < len) {
        const _tmp$2 = dst_offset + i | 0;
        const _tmp$3 = src_offset + i | 0;
        if (_tmp$2 >>> 0 < dst.length) {
          dst[_tmp$2] = _tmp$3 >>> 0 < src.length ? src[_tmp$3] : $oob();
        } else {
          $oob();
        }
        _tmp = i + 1 | 0;
        continue;
      } else {
        return;
      }
    }
  } else {
    let _tmp = len - 1 | 0;
    let _tmp$2 = len > 0;
    while (true) {
      const i = _tmp;
      const _more = _tmp$2;
      if (_more) {
        const _tmp$3 = dst_offset + i | 0;
        const _tmp$4 = src_offset + i | 0;
        if (_tmp$3 >>> 0 < dst.length) {
          dst[_tmp$3] = _tmp$4 >>> 0 < src.length ? src[_tmp$4] : $oob();
        } else {
          $oob();
        }
        _tmp = i - 1 | 0;
        _tmp$2 = i > 0;
        continue;
      } else {
        return;
      }
    }
  }
}
function _M0MPB18UninitializedArray12unsafe__blitGyE(dst, dst_offset, src, src_offset, len) {
  _M0MPC15array10FixedArray12unsafe__blitGRPB17UnsafeMaybeUninitGyEE(dst, dst_offset, src, src_offset, len);
}
function _M0MPB18UninitializedArray23unsafe__make__and__blitGyE(src, allocate_len, src_offset, dst_offset, blit_len) {
  const dst = new Uint8Array(allocate_len);
  _M0MPB18UninitializedArray12unsafe__blitGyE(dst, dst_offset, src, src_offset, blit_len);
  return dst;
}
function _M0MPB13StringBuilder13write__objectGiE(self, obj) {
  _M0IP016_24default__implPB4Show6outputGiE(obj, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0MPB13StringBuilder13write__objectGsE(self, obj) {
  _M0IP016_24default__implPB4Show6outputGsE(obj, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0MPB13StringBuilder13write__objectGRPC16string10StringViewE(self, obj) {
  const _p = { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger };
  _p.method_table.method_2(_p.self, obj);
}
function _M0MPB13StringBuilder13write__objectGcE(self, obj) {
  _M0IP016_24default__implPB4Show6outputGcE(obj, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0MPB13StringBuilder21StringBuilder_2einner(size_hint) {
  return new _M0TPB13StringBuilder("");
}
function _M0IPB13StringBuilderPB6Logger11write__char(self, ch) {
  self.val = `${self.val}${String.fromCodePoint(ch)}`;
}
function _M0IPB13StringBuilderPB6Logger13write__string(self, str) {
  self.val = `${self.val}${str}`;
}
function _M0FPB32code__point__of__surrogate__pair(leading, trailing) {
  return (((Math.imul(leading - 55296 | 0, 1024) | 0) + trailing | 0) - 56320 | 0) + 65536 | 0;
}
function _M0MPC16string6String16unsafe__char__at(self, index) {
  const c1 = self.charCodeAt(index);
  if (c1 >= 55296 && c1 <= 56319) {
    const c2 = self.charCodeAt(index + 1 | 0);
    return _M0FPB32code__point__of__surrogate__pair(c1, c2);
  } else {
    return c1;
  }
}
function _M0MPC14byte4Byte7to__hexN14to__hex__digitS77(i) {
  if (i < 10) {
    const _p = 48;
    const _p$2 = (i + _p | 0) & 255;
    return _p$2;
  } else {
    const _p = 97;
    const _p$2 = (i + _p | 0) & 255;
    const _p$3 = 10;
    const _p$4 = (_p$2 - _p$3 | 0) & 255;
    return _p$4;
  }
}
function _M0MPC14byte4Byte7to__hex(b) {
  const _self = _M0MPB13StringBuilder21StringBuilder_2einner(0);
  const _p = 16;
  _M0IPB13StringBuilderPB6Logger11write__char(_self, _M0MPC14byte4Byte7to__hexN14to__hex__digitS77((b / _p | 0) & 255));
  const _p$2 = 16;
  _M0IPB13StringBuilderPB6Logger11write__char(_self, _M0MPC14byte4Byte7to__hexN14to__hex__digitS77((b % _p$2 | 0) & 255));
  const _p$3 = _self;
  return _p$3.val;
}
function _M0MPC16string10StringView21clamped__view_2einner(self, start, end) {
  const len = self.end - self.start | 0;
  let lo = start < 0 ? 0 : start > len ? len : start;
  let hi;
  if (end === undefined) {
    hi = len;
  } else {
    const _Some = end;
    const _e = _Some;
    hi = _e < 0 ? 0 : _e > len ? len : _e;
  }
  const str = self.str;
  const base = self.start;
  let _tmp;
  if (lo > 0) {
    let _tmp$2;
    if (lo < len) {
      let _tmp$3;
      const _p = str.charCodeAt(base + lo | 0);
      if (_p >= 56320 && _p <= 57343) {
        const _p$2 = str.charCodeAt((base + lo | 0) - 1 | 0);
        _tmp$3 = _p$2 >= 55296 && _p$2 <= 56319;
      } else {
        _tmp$3 = false;
      }
      _tmp$2 = _tmp$3;
    } else {
      _tmp$2 = false;
    }
    _tmp = _tmp$2;
  } else {
    _tmp = false;
  }
  if (_tmp) {
    lo = lo + 1 | 0;
  }
  let _tmp$2;
  if (hi > 0) {
    let _tmp$3;
    if (hi < len) {
      let _tmp$4;
      const _p = str.charCodeAt(base + hi | 0);
      if (_p >= 56320 && _p <= 57343) {
        const _p$2 = str.charCodeAt((base + hi | 0) - 1 | 0);
        _tmp$4 = _p$2 >= 55296 && _p$2 <= 56319;
      } else {
        _tmp$4 = false;
      }
      _tmp$3 = _tmp$4;
    } else {
      _tmp$3 = false;
    }
    _tmp$2 = _tmp$3;
  } else {
    _tmp$2 = false;
  }
  if (_tmp$2) {
    hi = hi - 1 | 0;
  }
  return lo >= hi ? new _M0TPC16string10StringView(str, base + lo | 0, base + lo | 0) : new _M0TPC16string10StringView(str, base + lo | 0, base + hi | 0);
}
function _M0MPC16string10StringView18escape__to_2einnerN14flush__segmentS91(_env, seg, i) {
  const logger = _env._1;
  const self = _env._0;
  if (i > seg) {
    logger.method_table.method_2(logger.self, _M0MPC16string10StringView21clamped__view_2einner(self, seg, i));
    return;
  } else {
    return;
  }
}
function _M0MPC16string10StringView18escape__to_2einner(self, logger, quote) {
  if (quote) {
    logger.method_table.method_3(logger.self, 34);
  }
  const len = self.end - self.start | 0;
  const _env = { _0: self, _1: logger };
  let _tmp = 0;
  let _tmp$2 = 0;
  _L: while (true) {
    const i = _tmp;
    const seg = _tmp$2;
    if (i >= len) {
      _M0MPC16string10StringView18escape__to_2einnerN14flush__segmentS91(_env, seg, i);
      break;
    }
    const code = self.str.charCodeAt(self.start + i | 0);
    let c;
    _L$2: {
      switch (code) {
        case 34: {
          c = code;
          break _L$2;
        }
        case 92: {
          c = code;
          break _L$2;
        }
        case 10: {
          _M0MPC16string10StringView18escape__to_2einnerN14flush__segmentS91(_env, seg, i);
          logger.method_table.method_0(logger.self, "\\n");
          _tmp = i + 1 | 0;
          _tmp$2 = i + 1 | 0;
          continue _L;
        }
        case 13: {
          _M0MPC16string10StringView18escape__to_2einnerN14flush__segmentS91(_env, seg, i);
          logger.method_table.method_0(logger.self, "\\r");
          _tmp = i + 1 | 0;
          _tmp$2 = i + 1 | 0;
          continue _L;
        }
        case 8: {
          _M0MPC16string10StringView18escape__to_2einnerN14flush__segmentS91(_env, seg, i);
          logger.method_table.method_0(logger.self, "\\b");
          _tmp = i + 1 | 0;
          _tmp$2 = i + 1 | 0;
          continue _L;
        }
        case 9: {
          _M0MPC16string10StringView18escape__to_2einnerN14flush__segmentS91(_env, seg, i);
          logger.method_table.method_0(logger.self, "\\t");
          _tmp = i + 1 | 0;
          _tmp$2 = i + 1 | 0;
          continue _L;
        }
        default: {
          if (code < 32) {
            _M0MPC16string10StringView18escape__to_2einnerN14flush__segmentS91(_env, seg, i);
            logger.method_table.method_0(logger.self, "\\u{");
            logger.method_table.method_0(logger.self, _M0MPC14byte4Byte7to__hex(code & 255));
            logger.method_table.method_0(logger.self, "}");
            _tmp = i + 1 | 0;
            _tmp$2 = i + 1 | 0;
            continue _L;
          } else {
            _tmp = i + 1 | 0;
            continue _L;
          }
        }
      }
    }
    _M0MPC16string10StringView18escape__to_2einnerN14flush__segmentS91(_env, seg, i);
    logger.method_table.method_3(logger.self, 92);
    logger.method_table.method_3(logger.self, c);
    _tmp = i + 1 | 0;
    _tmp$2 = i + 1 | 0;
    continue;
  }
  if (quote) {
    logger.method_table.method_3(logger.self, 34);
    return;
  } else {
    return;
  }
}
function _M0MPC16string6String14escape_2einner(self, quote) {
  const buf = _M0MPB13StringBuilder21StringBuilder_2einner(0);
  _M0MPC16string10StringView18escape__to_2einner(new _M0TPC16string10StringView(self, 0, self.length), { self: buf, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger }, quote);
  return buf.val;
}
function _M0MPC16string10StringView12view_2einner(self, start_offset, end_offset) {
  let end_offset$2;
  if (end_offset === undefined) {
    end_offset$2 = self.end - self.start | 0;
  } else {
    const _Some = end_offset;
    end_offset$2 = _Some;
  }
  if (start_offset >= 0 && (start_offset <= end_offset$2 && end_offset$2 <= (self.end - self.start | 0))) {
    return new _M0TPC16string10StringView(self.str, self.start + start_offset | 0, self.start + end_offset$2 | 0);
  } else {
    return $panic();
  }
}
function _M0IP016_24default__implPB2Eq10not__equalGRPC16string10StringViewE(x, y) {
  return !_M0IPC16string10StringViewPB2Eq5equal(x, y);
}
function _M0FPB14avalanche__acc(acc) {
  let acc$2 = acc;
  acc$2 = acc$2 ^ (acc$2 >>> 15 | 0);
  acc$2 = Math.imul(acc$2, -2048144777) | 0;
  acc$2 = acc$2 ^ (acc$2 >>> 13 | 0);
  acc$2 = Math.imul(acc$2, -1028477379) | 0;
  acc$2 = acc$2 ^ (acc$2 >>> 16 | 0);
  return acc$2;
}
function _M0FPB13finalize__acc(acc) {
  return _M0FPB14avalanche__acc(acc);
}
function _M0IP016_24default__implPB6Logger28write__string__interpolationGRPB13StringBuilderE(self, show) {
  show.method_table.method_0(show.self, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0IP016_24default__implPB6Logger5writeGRPB13StringBuilderE(self, show) {
  show.method_table.method_0(show.self, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0MPC16string6String21clamped__view_2einner(self, start, end) {
  const len = self.length;
  let lo = start < 0 ? 0 : start > len ? len : start;
  let hi;
  if (end === undefined) {
    hi = len;
  } else {
    const _Some = end;
    const _e = _Some;
    hi = _e < 0 ? 0 : _e > len ? len : _e;
  }
  let _tmp;
  if (lo > 0) {
    let _tmp$2;
    if (lo < len) {
      let _tmp$3;
      const _p = self.charCodeAt(lo);
      if (_p >= 56320 && _p <= 57343) {
        const _p$2 = self.charCodeAt(lo - 1 | 0);
        _tmp$3 = _p$2 >= 55296 && _p$2 <= 56319;
      } else {
        _tmp$3 = false;
      }
      _tmp$2 = _tmp$3;
    } else {
      _tmp$2 = false;
    }
    _tmp = _tmp$2;
  } else {
    _tmp = false;
  }
  if (_tmp) {
    lo = lo + 1 | 0;
  }
  let _tmp$2;
  if (hi > 0) {
    let _tmp$3;
    if (hi < len) {
      let _tmp$4;
      const _p = self.charCodeAt(hi);
      if (_p >= 56320 && _p <= 57343) {
        const _p$2 = self.charCodeAt(hi - 1 | 0);
        _tmp$4 = _p$2 >= 55296 && _p$2 <= 56319;
      } else {
        _tmp$4 = false;
      }
      _tmp$3 = _tmp$4;
    } else {
      _tmp$3 = false;
    }
    _tmp$2 = _tmp$3;
  } else {
    _tmp$2 = false;
  }
  if (_tmp$2) {
    hi = hi - 1 | 0;
  }
  return lo >= hi ? new _M0TPC16string10StringView(self, lo, lo) : new _M0TPC16string10StringView(self, lo, hi);
}
function _M0IP016_24default__implPB6Logger16write__substringGRPB13StringBuilderE(self, value, start, len) {
  _M0IPB13StringBuilderPB6Logger11write__view(self, _M0MPC16string6String21clamped__view_2einner(value, start, start + len | 0));
}
function _M0IP016_24default__implPB4Show6outputGiE(self, logger) {
  logger.method_table.method_0(logger.self, _M0IPC13int3IntPB4Show10to__string(self));
}
function _M0IP016_24default__implPB4Show6outputGsE(self, logger) {
  logger.method_table.method_0(logger.self, self);
}
function _M0IP016_24default__implPB4Show6outputGcE(self, logger) {
  logger.method_table.method_0(logger.self, _M0IPC14char4CharPB4Show10to__string(self));
}
function _M0MPB4Iter4nextGRPC16string10StringViewE(self) {
  const _func = self.f;
  const result = _func();
  const _bind = self.size_hint;
  if (result === undefined) {
    self.size_hint = _M0MPB4Iter4nextN6constrS157GRPC16string10StringViewE;
  } else {
    if (_bind === undefined) {
    } else {
      const _Some = _bind;
      const _n = _Some;
      self.size_hint = _n > 0 ? _n - 1 | 0 : _M0MPB4Iter4nextN6constrS156GRPC16string10StringViewE;
    }
  }
  return result;
}
function _M0MPB4Iter4nextGcE(self) {
  const _func = self.f;
  const result = _func();
  const _bind = self.size_hint;
  if (result === -1) {
    self.size_hint = _M0MPB4Iter4nextN6constrS173GcE;
  } else {
    if (_bind === undefined) {
    } else {
      const _Some = _bind;
      const _n = _Some;
      self.size_hint = _n > 0 ? _n - 1 | 0 : _M0MPB4Iter4nextN6constrS172GcE;
    }
  }
  return result;
}
function _M0MPC13int3Int18to__string_2einner(self, radix) {
  return _M0FPB19int__to__string__js(self, radix);
}
function _M0MPB4Iter3newGRPC16string10StringViewE(f, size_hint) {
  let size_hint$2;
  if (size_hint === undefined) {
    size_hint$2 = undefined;
  } else {
    const _Some = size_hint;
    const _n = _Some;
    size_hint$2 = _n > 0 ? _n : _M0MPB4Iter3newN6constrS190GRPC16string10StringViewE;
  }
  return new _M0TPB4IterGRPC16string10StringViewE(f, size_hint$2);
}
function _M0MPB4Iter3newGcE(f, size_hint) {
  let size_hint$2;
  if (size_hint === undefined) {
    size_hint$2 = undefined;
  } else {
    const _Some = size_hint;
    const _n = _Some;
    size_hint$2 = _n > 0 ? _n : _M0MPB4Iter3newN6constrS196GcE;
  }
  return new _M0TPB4IterGcE(f, size_hint$2);
}
function _M0MPC15array10FixedArray21clamped__view_2einnerGyE(self, start, end) {
  const len = self.length;
  const lo = start < 0 ? 0 : start > len ? len : start;
  let hi;
  if (end === undefined) {
    hi = len;
  } else {
    const _Some = end;
    const _end = _Some;
    hi = _end < 0 ? 0 : _end > len ? len : _end;
  }
  const count = hi > lo ? hi - lo | 0 : 0;
  const _bind = self;
  return new _M0TPB9ArrayViewGyE(_bind, lo, lo + count | 0);
}
function _M0MPC16string10StringView9to__owned(self) {
  return self.str.substring(self.start, self.end);
}
function _M0MPC16string10StringView4iter(self) {
  const start = self.start;
  const end = self.end;
  const index = new _M0TPB8MutLocalGiE(start);
  return _M0MPB4Iter3newGcE(() => {
    if (index.val < end) {
      const c1 = self.str.charCodeAt(index.val);
      if (c1 >= 55296 && c1 <= 56319 && (index.val + 1 | 0) < self.end) {
        const c2 = self.str.charCodeAt(index.val + 1 | 0);
        if (c2 >= 56320 && c2 <= 57343) {
          index.val = index.val + 2 | 0;
          return _M0FPB32code__point__of__surrogate__pair(c1, c2);
        }
      }
      index.val = index.val + 1 | 0;
      return c1;
    } else {
      return -1;
    }
  }, undefined);
}
function _M0MPC16string6String20unsafe__range__equal(self, self_off, other, other_off, len) {
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < len) {
      const _p = self.charCodeAt(self_off + i | 0);
      const _p$2 = other.charCodeAt(other_off + i | 0);
      if (_p === _p$2) {
      } else {
        return false;
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return true;
}
function _M0IPC16string10StringViewPB2Eq5equal(self, other) {
  const len = self.end - self.start | 0;
  if (len === (other.end - other.start | 0)) {
    if (self.str === other.str && self.start === other.start) {
      return true;
    }
    return _M0MPC16string6String20unsafe__range__equal(self.str, self.start, other.str, other.start, len);
  } else {
    return false;
  }
}
function _M0MPC16string6String24char__length__ge_2einner(self, len, start_offset, end_offset) {
  let end_offset$2;
  if (end_offset === undefined) {
    end_offset$2 = self.length;
  } else {
    const _Some = end_offset;
    end_offset$2 = _Some;
  }
  let _tmp = start_offset;
  let _tmp$2 = 0;
  while (true) {
    const index = _tmp;
    const count = _tmp$2;
    if (index < end_offset$2 && count < len) {
      const c1 = self.charCodeAt(index);
      if (c1 >= 55296 && c1 <= 56319 && (index + 1 | 0) < end_offset$2) {
        const c2 = self.charCodeAt(index + 1 | 0);
        if (c2 >= 56320 && c2 <= 57343) {
          _tmp = index + 2 | 0;
          _tmp$2 = count + 1 | 0;
          continue;
        } else {
          $panic();
        }
      }
      _tmp = index + 1 | 0;
      _tmp$2 = count + 1 | 0;
      continue;
    } else {
      return count >= len;
    }
  }
}
function _M0MPC16string6String31offset__of__nth__char__backward(self, n, start_offset, end_offset) {
  let _tmp = end_offset;
  let _tmp$2 = 0;
  while (true) {
    const utf16_offset = _tmp;
    const char_count = _tmp$2;
    if ((utf16_offset - 1 | 0) >= start_offset && char_count < n) {
      const c = self.charCodeAt(utf16_offset - 1 | 0);
      if (c >= 56320 && c <= 57343) {
        _tmp = utf16_offset - 2 | 0;
        _tmp$2 = char_count + 1 | 0;
        continue;
      } else {
        _tmp = utf16_offset - 1 | 0;
        _tmp$2 = char_count + 1 | 0;
        continue;
      }
    } else {
      return char_count < n || utf16_offset < start_offset ? undefined : utf16_offset;
    }
  }
}
function _M0MPC16string6String30offset__of__nth__char__forward(self, n, start_offset, end_offset) {
  if (start_offset >= 0 && start_offset <= end_offset) {
    let _tmp = start_offset;
    let _tmp$2 = 0;
    while (true) {
      const utf16_offset = _tmp;
      const char_count = _tmp$2;
      if (utf16_offset < end_offset && char_count < n) {
        const c = self.charCodeAt(utf16_offset);
        if (c >= 55296 && c <= 56319) {
          _tmp = utf16_offset + 2 | 0;
          _tmp$2 = char_count + 1 | 0;
          continue;
        } else {
          _tmp = utf16_offset + 1 | 0;
          _tmp$2 = char_count + 1 | 0;
          continue;
        }
      } else {
        return char_count < n || utf16_offset >= end_offset ? undefined : utf16_offset;
      }
    }
  } else {
    return $panic();
  }
}
function _M0MPC16string6String29offset__of__nth__char_2einner(self, i, start_offset, end_offset) {
  let end_offset$2;
  if (end_offset === undefined) {
    end_offset$2 = self.length;
  } else {
    const _Some = end_offset;
    end_offset$2 = _Some;
  }
  return i >= 0 ? _M0MPC16string6String30offset__of__nth__char__forward(self, i, start_offset, end_offset$2) : _M0MPC16string6String31offset__of__nth__char__backward(self, -i | 0, start_offset, end_offset$2);
}
function _M0MPC16string6String12view_2einner(self, start_offset, end_offset) {
  let end_offset$2;
  if (end_offset === undefined) {
    end_offset$2 = self.length;
  } else {
    const _Some = end_offset;
    end_offset$2 = _Some;
  }
  if (start_offset >= 0 && (start_offset <= end_offset$2 && end_offset$2 <= self.length)) {
    return new _M0TPC16string10StringView(self, start_offset, end_offset$2);
  } else {
    return $panic();
  }
}
function _M0IPB13StringBuilderPB6Logger11write__view(self, str) {
  self.val = `${self.val}${_M0MPC16string10StringView9to__owned(str)}`;
}
function _M0FPB19kmp__failure__table(pattern) {
  const m = pattern.end - pattern.start | 0;
  const table = $make_array_len_and_init(m, 0);
  let k = 0;
  let _tmp = 1;
  while (true) {
    const i = _tmp;
    if (i < m) {
      const c = pattern.str.charCodeAt(pattern.start + i | 0);
      while (true) {
        let _tmp$2;
        if (k > 0) {
          const _p = pattern.str.charCodeAt(pattern.start + k | 0);
          _tmp$2 = c !== _p;
        } else {
          _tmp$2 = false;
        }
        if (_tmp$2) {
          const _tmp$3 = k - 1 | 0;
          k = _tmp$3 >>> 0 < table.length ? table[_tmp$3] : $oob();
          continue;
        } else {
          break;
        }
      }
      const _p = pattern.str.charCodeAt(pattern.start + k | 0);
      if (c === _p) {
        k = k + 1 | 0;
      }
      if (i >>> 0 < table.length) {
        table[i] = k;
      } else {
        $oob();
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return table;
}
function _M0FPB24find__pattern__kmp__from(target, pattern, start) {
  const n = target.end - target.start | 0;
  const m = pattern.end - pattern.start | 0;
  const table = _M0FPB19kmp__failure__table(pattern);
  let k = 0;
  let _tmp = start;
  while (true) {
    const i = _tmp;
    if (i < n) {
      const c = target.str.charCodeAt(target.start + i | 0);
      while (true) {
        let _tmp$2;
        if (k > 0) {
          const _p = pattern.str.charCodeAt(pattern.start + k | 0);
          _tmp$2 = c !== _p;
        } else {
          _tmp$2 = false;
        }
        if (_tmp$2) {
          const _tmp$3 = k - 1 | 0;
          k = _tmp$3 >>> 0 < table.length ? table[_tmp$3] : $oob();
          continue;
        } else {
          break;
        }
      }
      const _p = pattern.str.charCodeAt(pattern.start + k | 0);
      if (c === _p) {
        k = k + 1 | 0;
      }
      if (k === m) {
        return (i - m | 0) + 1 | 0;
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return undefined;
}
function _M0FPB36find__two__anchor__candidate__scalar(data, start, candidate_end, first, last_offset, last) {
  let _tmp = start;
  while (true) {
    const pos = _tmp;
    if (pos < candidate_end) {
      let _tmp$2;
      const _p = data.charCodeAt(pos);
      if (_p === first) {
        const _p$2 = data.charCodeAt(pos + last_offset | 0);
        _tmp$2 = _p$2 === last;
      } else {
        _tmp$2 = false;
      }
      if (_tmp$2) {
        return pos;
      }
      _tmp = pos + 1 | 0;
      continue;
    } else {
      return -1;
    }
  }
}
function _M0FPB42find__two__anchor__candidate__from__string(data, start, candidate_end, first, last_offset, last) {
  return _M0FPB36find__two__anchor__candidate__scalar(data, start, candidate_end, first, last_offset, last);
}
function _M0FPB21string__ranges__equal(left, left_start, right, right_start, length) {
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < length) {
      const _p = left.charCodeAt(left_start + i | 0);
      const _p$2 = right.charCodeAt(right_start + i | 0);
      if (_p !== _p$2) {
        return false;
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return true;
}
function _M0FPB22find__by__two__anchors(target, pattern) {
  const target_len = target.end - target.start | 0;
  const pattern_len = pattern.end - pattern.start | 0;
  const target_start = target.start;
  const pattern_start = pattern.start;
  const last_offset = pattern_len - 1 | 0;
  const candidate_end = ((target_start + target_len | 0) - pattern_len | 0) + 1 | 0;
  const first = pattern.str.charCodeAt(pattern.start);
  const last = pattern.str.charCodeAt(pattern.start + last_offset | 0);
  const middle_len = last_offset - 1 | 0;
  let _tmp = target_start;
  let _tmp$2 = 0;
  while (true) {
    const pos = _tmp;
    const failures = _tmp$2;
    if (pos < candidate_end) {
      const found = _M0FPB42find__two__anchor__candidate__from__string(target.str, pos, candidate_end, first, last_offset, last);
      if (found < 0) {
        return undefined;
      }
      if (_M0FPB21string__ranges__equal(target.str, found + 1 | 0, pattern.str, pattern_start + 1 | 0, middle_len)) {
        return found - target_start | 0;
      }
      const failures$2 = failures + 1 | 0;
      const scanned = found - target_start | 0;
      if (failures$2 > 64 || failures$2 > (4 + (scanned / 8 | 0) | 0)) {
        return _M0FPB24find__pattern__kmp__from(target, pattern, scanned + 1 | 0);
      }
      _tmp = found + 1 | 0;
      _tmp$2 = failures$2;
      continue;
    } else {
      return undefined;
    }
  }
}
function _M0FPB24find__code__unit__scalar(data, start, end, code) {
  let _tmp = start;
  while (true) {
    const pos = _tmp;
    if (pos < end) {
      const _p = data.charCodeAt(pos);
      if (_p === code) {
        return pos;
      }
      _tmp = pos + 1 | 0;
      continue;
    } else {
      return -1;
    }
  }
}
function _M0FPB30find__code__unit__from__string(data, start, end, code) {
  return _M0FPB24find__code__unit__scalar(data, start, end, code);
}
function _M0FPB28find__code__unit__from__view(target, start, end, code) {
  const target_start = target.start;
  const found = _M0FPB30find__code__unit__from__string(target.str, target_start + start | 0, target_start + end | 0, code);
  return found < 0 ? -1 : found - target_start | 0;
}
function _M0MPC16string10StringView4find(self, str) {
  const pattern_len = str.end - str.start | 0;
  switch (pattern_len) {
    case 0: {
      return _M0MPC16string10StringView4findN6constrS382;
    }
    case 1: {
      const found = _M0FPB28find__code__unit__from__view(self, 0, self.end - self.start | 0, str.str.charCodeAt(str.start));
      return found < 0 ? undefined : found;
    }
    default: {
      return pattern_len > (self.end - self.start | 0) ? undefined : _M0FPB22find__by__two__anchors(self, str);
    }
  }
}
function _M0MPC16string6String4find(self, str) {
  return _M0MPC16string10StringView4find(new _M0TPC16string10StringView(self, 0, self.length), str);
}
function _M0FPB31rev__find__pattern__kmp__before(target, pattern, candidate_end) {
  if (candidate_end > 0) {
    const m = pattern.end - pattern.start | 0;
    const table = _M0FPB19kmp__failure__table(pattern);
    const scan_end = (candidate_end + m | 0) - 1 | 0;
    let k = 0;
    let best = -1;
    let _tmp = 0;
    while (true) {
      const i = _tmp;
      if (i < scan_end) {
        const c = target.str.charCodeAt(target.start + i | 0);
        while (true) {
          let _tmp$2;
          if (k > 0) {
            const _p = pattern.str.charCodeAt(pattern.start + k | 0);
            _tmp$2 = c !== _p;
          } else {
            _tmp$2 = false;
          }
          if (_tmp$2) {
            const _tmp$3 = k - 1 | 0;
            k = _tmp$3 >>> 0 < table.length ? table[_tmp$3] : $oob();
            continue;
          } else {
            break;
          }
        }
        const _p = pattern.str.charCodeAt(pattern.start + k | 0);
        if (c === _p) {
          k = k + 1 | 0;
        }
        if (k === m) {
          best = (i - m | 0) + 1 | 0;
          const _tmp$2 = k - 1 | 0;
          k = _tmp$2 >>> 0 < table.length ? table[_tmp$2] : $oob();
        }
        _tmp = i + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    return best >= 0 ? best : undefined;
  } else {
    return undefined;
  }
}
function _M0FPB41rev__find__two__anchor__candidate__scalar(data, start, candidate_end, first, last_offset, last) {
  let _tmp = candidate_end - 1 | 0;
  while (true) {
    const pos = _tmp;
    if (pos >= start) {
      let _tmp$2;
      const _p = data.charCodeAt(pos);
      if (_p === first) {
        const _p$2 = data.charCodeAt(pos + last_offset | 0);
        _tmp$2 = _p$2 === last;
      } else {
        _tmp$2 = false;
      }
      if (_tmp$2) {
        return pos;
      }
      _tmp = pos - 1 | 0;
      continue;
    } else {
      return -1;
    }
  }
}
function _M0FPB47rev__find__two__anchor__candidate__from__string(data, start, candidate_end, first, last_offset, last) {
  return _M0FPB41rev__find__two__anchor__candidate__scalar(data, start, candidate_end, first, last_offset, last);
}
function _M0FPB27rev__find__by__two__anchors(target, pattern) {
  const target_len = target.end - target.start | 0;
  const pattern_len = pattern.end - pattern.start | 0;
  const target_start = target.start;
  const pattern_start = pattern.start;
  const last_offset = pattern_len - 1 | 0;
  const first = pattern.str.charCodeAt(pattern.start);
  const last = pattern.str.charCodeAt(pattern.start + last_offset | 0);
  const middle_len = last_offset - 1 | 0;
  const last_candidate = target_len - pattern_len | 0;
  let _tmp = (target_start + last_candidate | 0) + 1 | 0;
  let _tmp$2 = 0;
  while (true) {
    const candidate_end = _tmp;
    const failures = _tmp$2;
    if (candidate_end > target_start) {
      const found = _M0FPB47rev__find__two__anchor__candidate__from__string(target.str, target_start, candidate_end, first, last_offset, last);
      if (found < 0) {
        return undefined;
      }
      if (_M0FPB21string__ranges__equal(target.str, found + 1 | 0, pattern.str, pattern_start + 1 | 0, middle_len)) {
        return found - target_start | 0;
      }
      const candidate = found - target_start | 0;
      const failures$2 = failures + 1 | 0;
      const scanned = last_candidate - candidate | 0;
      if (failures$2 > 64 || failures$2 > (4 + (scanned / 8 | 0) | 0)) {
        return _M0FPB31rev__find__pattern__kmp__before(target, pattern, candidate);
      }
      _tmp = found;
      _tmp$2 = failures$2;
      continue;
    } else {
      return undefined;
    }
  }
}
function _M0FPB29rev__find__code__unit__scalar(data, start, end, code) {
  let _tmp = end - 1 | 0;
  while (true) {
    const pos = _tmp;
    if (pos >= start) {
      const _p = data.charCodeAt(pos);
      if (_p === code) {
        return pos;
      }
      _tmp = pos - 1 | 0;
      continue;
    } else {
      return -1;
    }
  }
}
function _M0FPB35rev__find__code__unit__from__string(data, start, end, code) {
  return _M0FPB29rev__find__code__unit__scalar(data, start, end, code);
}
function _M0FPB33rev__find__code__unit__from__view(target, start, end, code) {
  const target_start = target.start;
  const found = _M0FPB35rev__find__code__unit__from__string(target.str, target_start + start | 0, target_start + end | 0, code);
  return found < 0 ? -1 : found - target_start | 0;
}
function _M0MPC16string10StringView9rev__find(self, str) {
  const pattern_len = str.end - str.start | 0;
  switch (pattern_len) {
    case 0: {
      return self.end - self.start | 0;
    }
    case 1: {
      const found = _M0FPB33rev__find__code__unit__from__view(self, 0, self.end - self.start | 0, str.str.charCodeAt(str.start));
      return found < 0 ? undefined : found;
    }
    default: {
      return pattern_len > (self.end - self.start | 0) ? undefined : _M0FPB27rev__find__by__two__anchors(self, str);
    }
  }
}
function _M0MPC16string6String9rev__find(self, str) {
  return _M0MPC16string10StringView9rev__find(new _M0TPC16string10StringView(self, 0, self.length), str);
}
function _M0MPC16string10StringView11has__suffix(self, str) {
  const self_len = self.end - self.start | 0;
  const str_len = str.end - str.start | 0;
  if (str_len <= self_len) {
    const start = self_len - str_len | 0;
    let _tmp;
    if (str_len === 0) {
      _tmp = true;
    } else {
      const _p = self.str.charCodeAt(self.start + start | 0);
      const _p$2 = str.str.charCodeAt(str.start);
      _tmp = _p === _p$2;
    }
    if (_tmp) {
      return _M0MPC16string6String20unsafe__range__equal(self.str, self.start + start | 0, str.str, str.start, str_len);
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function _M0MPC16string6String11has__suffix(self, str) {
  return _M0MPC16string10StringView11has__suffix(new _M0TPC16string10StringView(self, 0, self.length), str);
}
function _M0MPC16string10StringView11has__prefix(self, str) {
  const str_len = str.end - str.start | 0;
  if (str_len <= (self.end - self.start | 0)) {
    let _tmp;
    if (str_len === 0) {
      _tmp = true;
    } else {
      const _p = self.str.charCodeAt(self.start);
      const _p$2 = str.str.charCodeAt(str.start);
      _tmp = _p === _p$2;
    }
    if (_tmp) {
      return _M0MPC16string6String20unsafe__range__equal(self.str, self.start, str.str, str.start, str_len);
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function _M0MPC16string6String11has__prefix(self, str) {
  return _M0MPC16string10StringView11has__prefix(new _M0TPC16string10StringView(self, 0, self.length), str);
}
function _M0MPC16string10StringView13strip__suffix(self, suffix) {
  const self_len = self.end - self.start | 0;
  const suffix_len = suffix.end - suffix.start | 0;
  return self_len >= suffix_len && _M0IPC16string10StringViewPB2Eq5equal(_M0MPC16string10StringView12view_2einner(self, self_len - suffix_len | 0, undefined), suffix) ? _M0MPC16string10StringView12view_2einner(self, 0, self_len - suffix_len | 0) : undefined;
}
function _M0MPC16string6String13strip__suffix(self, suffix) {
  return _M0MPC16string10StringView13strip__suffix(new _M0TPC16string10StringView(self, 0, self.length), suffix);
}
function _M0MPC16string10StringView13strip__prefix(self, prefix) {
  const prefix_len = prefix.end - prefix.start | 0;
  return (self.end - self.start | 0) >= prefix_len && _M0IPC16string10StringViewPB2Eq5equal(_M0MPC16string10StringView12view_2einner(self, 0, prefix_len), prefix) ? _M0MPC16string10StringView12view_2einner(self, prefix_len, undefined) : undefined;
}
function _M0MPC16string6String13strip__prefix(self, prefix) {
  return _M0MPC16string10StringView13strip__prefix(new _M0TPC16string10StringView(self, 0, self.length), prefix);
}
function _M0MPC15array5Array4pushGsE(self, value) {
  _M0MPB7JSArray4push(self, value);
}
function _M0MPC15array5Array4pushGRPB5ArrayGRPB5ArrayGRP46podhmo14html_2dsandbox3pkg2el4NodeEEE(self, value) {
  _M0MPB7JSArray4push(self, value);
}
function _M0FPB36string__contains__code__unit__scalar(str, start, end, code) {
  let _tmp = start;
  while (true) {
    const i = _tmp;
    if (i < end) {
      const _p = str.charCodeAt(i);
      if (_p === code) {
        return true;
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return false;
}
function _M0FPB28string__contains__code__unit(str, start, end, code) {
  return _M0FPB36string__contains__code__unit__scalar(str, start, end, code);
}
function _M0MPC16string10StringView20contains__code__unit(self, code) {
  return _M0FPB28string__contains__code__unit(self.str, self.start, self.end, code);
}
function _M0MPC16string10StringView8contains(self, str) {
  const _bind = str.end - str.start | 0;
  switch (_bind) {
    case 0: {
      return true;
    }
    case 1: {
      return _M0MPC16string10StringView20contains__code__unit(self, str.str.charCodeAt(str.start));
    }
    default: {
      const _bind$2 = _M0MPC16string10StringView4find(self, str);
      return !(_bind$2 === undefined);
    }
  }
}
function _M0FPB23build__ascii__char__set(chars) {
  let bits0 = 0;
  let bits1 = 0;
  let bits2 = 0;
  let bits3 = 0;
  const _bind = chars.str;
  const _bind$2 = chars.start;
  const _bind$3 = chars.end;
  let _tmp = _bind$2;
  while (true) {
    const _string_index = _tmp;
    if (_string_index < _bind$3) {
      let _decoded_next_string_index;
      let _decoded_char;
      _L: {
        const _bind$4 = _bind.charCodeAt(_string_index);
        if (_bind$4 >= 55296 && _bind$4 <= 56319 && (_string_index + 1 | 0) < _bind$3) {
          const _bind$5 = _bind.charCodeAt(_string_index + 1 | 0);
          if (_bind$5 >= 56320 && _bind$5 <= 57343) {
            const _tmp$2 = _string_index + 2 | 0;
            const _p = (((Math.imul(_bind$4 - 55296 | 0, 1024) | 0) + _bind$5 | 0) - 56320 | 0) + 65536 | 0;
            _decoded_next_string_index = _tmp$2;
            _decoded_char = _p;
            break _L;
          } else {
            const _tmp$2 = _string_index + 1 | 0;
            const _p = _bind$4;
            _decoded_next_string_index = _tmp$2;
            _decoded_char = _p;
            break _L;
          }
        } else {
          const _tmp$2 = _string_index + 1 | 0;
          const _p = _bind$4;
          _decoded_next_string_index = _tmp$2;
          _decoded_char = _p;
          break _L;
        }
      }
      const code = _decoded_char;
      if (code >>> 0 < 128 >>> 0) {
        const bit = 1 << (code & 31);
        const _bind$4 = code >>> 5 | 0;
        switch (_bind$4) {
          case 0: {
            bits0 = bits0 | bit;
            break;
          }
          case 1: {
            bits1 = bits1 | bit;
            break;
          }
          case 2: {
            bits2 = bits2 | bit;
            break;
          }
          default: {
            bits3 = bits3 | bit;
          }
        }
      } else {
        return undefined;
      }
      _tmp = _decoded_next_string_index;
      continue;
    } else {
      break;
    }
  }
  return { _0: bits0, _1: bits1, _2: bits2, _3: bits3 };
}
function _M0FPB26ascii__char__set__contains(bits0, bits1, bits2, bits3, code) {
  if (code >>> 0 < 128 >>> 0) {
    const bit = 1 << (code & 31);
    const _bind = code >>> 5 | 0;
    switch (_bind) {
      case 0: {
        return (bits0 & bit) !== 0;
      }
      case 1: {
        return (bits1 & bit) !== 0;
      }
      case 2: {
        return (bits2 & bit) !== 0;
      }
      default: {
        return (bits3 & bit) !== 0;
      }
    }
  } else {
    return false;
  }
}
function _M0FPB34string__trim__start__ascii__scalar(str, start, end, bits0, bits1, bits2, bits3) {
  let _tmp = start;
  while (true) {
    const pos = _tmp;
    let _tmp$2;
    if (pos < end) {
      const _p = str.charCodeAt(pos);
      _tmp$2 = _M0FPB26ascii__char__set__contains(bits0, bits1, bits2, bits3, _p);
    } else {
      _tmp$2 = false;
    }
    if (_tmp$2) {
      _tmp = pos + 1 | 0;
      continue;
    } else {
      return pos;
    }
  }
}
function _M0FPB32string__trim__end__ascii__scalar(str, start, end, bits0, bits1, bits2, bits3) {
  let _tmp = end;
  while (true) {
    const pos = _tmp;
    let _tmp$2;
    if (pos > start) {
      const _p = str.charCodeAt(pos - 1 | 0);
      _tmp$2 = _M0FPB26ascii__char__set__contains(bits0, bits1, bits2, bits3, _p);
    } else {
      _tmp$2 = false;
    }
    if (_tmp$2) {
      _tmp = pos - 1 | 0;
      continue;
    } else {
      return pos;
    }
  }
}
function _M0FPB26string__trim__start__ascii(str, start, end, _chars, bits0, bits1, bits2, bits3) {
  return _M0FPB34string__trim__start__ascii__scalar(str, start, end, bits0, bits1, bits2, bits3);
}
function _M0FPB24string__trim__end__ascii(str, start, end, _chars, bits0, bits1, bits2, bits3) {
  return _M0FPB32string__trim__end__ascii__scalar(str, start, end, bits0, bits1, bits2, bits3);
}
function _M0MPC16string10StringView14contains__char(self, c) {
  const len = self.end - self.start | 0;
  if (len > 0) {
    const c$2 = c;
    if (c$2 >= 0 && c$2 <= 65535) {
      return _M0MPC16string10StringView20contains__code__unit(self, c$2 & 65535);
    } else {
      if (c$2 < 0) {
        return false;
      } else {
        if (len >= 2) {
          const adj = c$2 - 65536 | 0;
          const high = 55296 + (adj >> 10) | 0;
          if (high <= 65535) {
            const high$2 = high & 65535;
            const low = (56320 + (adj & 1023) | 0) & 65535;
            let _tmp = 0;
            while (true) {
              const i = _tmp;
              if (i < (len - 1 | 0)) {
                const _p = self.str.charCodeAt(self.start + i | 0);
                if (_p === high$2) {
                  const _p$2 = self.str.charCodeAt(self.start + (i + 1 | 0) | 0);
                  if (_p$2 === low) {
                    return true;
                  }
                  _tmp = i + 2 | 0;
                  continue;
                }
                _tmp = i + 1 | 0;
                continue;
              } else {
                break;
              }
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      }
    }
    return false;
  } else {
    return false;
  }
}
function _M0MPC16string10StringView24trim__start__with__chars(self, chars) {
  let _tmp = self;
  while (true) {
    const x = _tmp;
    if ((x.end - x.start | 0) === 0) {
      return x;
    } else {
      const _c = _M0MPC16string6String16unsafe__char__at(x.str, _M0MPC16string6String29offset__of__nth__char_2einner(x.str, 0, x.start, x.end));
      const _tmp$2 = x.str;
      const _bind = _M0MPC16string6String29offset__of__nth__char_2einner(x.str, 1, x.start, x.end);
      let _tmp$3;
      if (_bind === undefined) {
        _tmp$3 = x.end;
      } else {
        const _Some = _bind;
        _tmp$3 = _Some;
      }
      const _x = new _M0TPC16string10StringView(_tmp$2, _tmp$3, x.end);
      if (_M0MPC16string10StringView14contains__char(chars, _c)) {
        _tmp = _x;
        continue;
      } else {
        return x;
      }
    }
  }
}
function _M0MPC16string10StringView22trim__end__with__chars(self, chars) {
  let _tmp = self;
  while (true) {
    const x = _tmp;
    if ((x.end - x.start | 0) === 0) {
      return x;
    } else {
      const _c = _M0MPC16string6String16unsafe__char__at(x.str, _M0MPC16string6String29offset__of__nth__char_2einner(x.str, -1, x.start, x.end));
      const _x = new _M0TPC16string10StringView(x.str, x.start, _M0MPC16string6String29offset__of__nth__char_2einner(x.str, -1, x.start, x.end));
      if (_M0MPC16string10StringView14contains__char(chars, _c)) {
        _tmp = _x;
        continue;
      } else {
        return x;
      }
    }
  }
}
function _M0MPC16string10StringView12trim_2einner(self, chars) {
  const _bind = _M0FPB23build__ascii__char__set(chars);
  if (_bind === undefined) {
    return _M0MPC16string10StringView22trim__end__with__chars(_M0MPC16string10StringView24trim__start__with__chars(self, chars), chars);
  } else {
    const _Some = _bind;
    const _x = _Some;
    const _bits0 = _x._0;
    const _bits1 = _x._1;
    const _bits2 = _x._2;
    const _bits3 = _x._3;
    const start = _M0FPB26string__trim__start__ascii(self.str, self.start, self.end, chars, _bits0, _bits1, _bits2, _bits3);
    const end = _M0FPB24string__trim__end__ascii(self.str, start, self.end, chars, _bits0, _bits1, _bits2, _bits3);
    return new _M0TPC16string10StringView(self.str, start, end);
  }
}
function _M0MPC16string10StringView17trim__end_2einner(self, chars) {
  const _bind = _M0FPB23build__ascii__char__set(chars);
  if (_bind === undefined) {
    return _M0MPC16string10StringView22trim__end__with__chars(self, chars);
  } else {
    const _Some = _bind;
    const _x = _Some;
    const _bits0 = _x._0;
    const _bits1 = _x._1;
    const _bits2 = _x._2;
    const _bits3 = _x._3;
    const end = _M0FPB24string__trim__end__ascii(self.str, self.start, self.end, chars, _bits0, _bits1, _bits2, _bits3);
    return new _M0TPC16string10StringView(self.str, self.start, end);
  }
}
function _M0MPC16string6String4iter(self) {
  const len = self.length;
  const index = new _M0TPB8MutLocalGiE(0);
  return _M0MPB4Iter3newGcE(() => {
    if (index.val < len) {
      const c1 = self.charCodeAt(index.val);
      if (c1 >= 55296 && c1 <= 56319 && (index.val + 1 | 0) < len) {
        const c2 = self.charCodeAt(index.val + 1 | 0);
        if (c2 >= 56320 && c2 <= 57343) {
          const c = _M0FPB32code__point__of__surrogate__pair(c1, c2);
          index.val = index.val + 2 | 0;
          return c;
        }
      }
      index.val = index.val + 1 | 0;
      return c1;
    } else {
      return -1;
    }
  }, undefined);
}
function _M0MPB4Iter3mapGcRPC16string10StringViewE(self, f) {
  return new _M0TPB4IterGRPC16string10StringViewE(() => {
    const _bind = _M0MPB4Iter4nextGcE(self);
    if (_bind === -1) {
      return undefined;
    } else {
      const _Some = _bind;
      const _x = _Some;
      return f(_x);
    }
  }, self.size_hint);
}
function _M0IPC14char4CharPB4Show10to__string(self) {
  return String.fromCodePoint(self);
}
function _M0MPC16string10StringView5split(self, sep) {
  const sep_len = sep.end - sep.start | 0;
  if (sep_len === 0) {
    return _M0MPB4Iter3mapGcRPC16string10StringViewE(_M0MPC16string10StringView4iter(self), (c) => _M0MPC16string6String12view_2einner(_M0IPC14char4CharPB4Show10to__string(c), 0, undefined));
  }
  const remaining = new _M0TPB8MutLocalGORPC16string10StringViewE(self);
  return _M0MPB4Iter3newGRPC16string10StringViewE(() => {
    const _bind = remaining.val;
    if (_bind === undefined) {
      return undefined;
    } else {
      const _Some = _bind;
      const _view = _Some;
      const _bind$2 = _M0MPC16string10StringView4find(_view, sep);
      if (_bind$2 === undefined) {
        remaining.val = undefined;
        return _view;
      } else {
        const _Some$2 = _bind$2;
        const _end = _Some$2;
        remaining.val = _M0MPC16string10StringView12view_2einner(_view, _end + sep_len | 0, undefined);
        return _M0MPC16string10StringView12view_2einner(_view, 0, _end);
      }
    }
  }, undefined);
}
function _M0MPC16string6String5split(self, sep) {
  return _M0MPC16string10StringView5split(new _M0TPC16string10StringView(self, 0, self.length), sep);
}
function _M0MPC16string10StringView12replace__all(self, old, new_) {
  const len = self.end - self.start | 0;
  const buf = _M0MPB13StringBuilder21StringBuilder_2einner(len);
  const old_len = old.end - old.start | 0;
  const new$2 = _M0MPC16string10StringView9to__owned(new_);
  if (old_len === 0) {
    _M0IPB13StringBuilderPB6Logger13write__string(buf, new$2);
    const _bind = self.str;
    const _bind$2 = self.start;
    const _bind$3 = self.end;
    let _tmp = _bind$2;
    while (true) {
      const _string_index = _tmp;
      if (_string_index < _bind$3) {
        let _decoded_next_string_index;
        let _decoded_char;
        _L: {
          const _bind$4 = _bind.charCodeAt(_string_index);
          if (_bind$4 >= 55296 && _bind$4 <= 56319 && (_string_index + 1 | 0) < _bind$3) {
            const _bind$5 = _bind.charCodeAt(_string_index + 1 | 0);
            if (_bind$5 >= 56320 && _bind$5 <= 57343) {
              const _tmp$2 = _string_index + 2 | 0;
              const _p = (((Math.imul(_bind$4 - 55296 | 0, 1024) | 0) + _bind$5 | 0) - 56320 | 0) + 65536 | 0;
              _decoded_next_string_index = _tmp$2;
              _decoded_char = _p;
              break _L;
            } else {
              const _tmp$2 = _string_index + 1 | 0;
              const _p = _bind$4;
              _decoded_next_string_index = _tmp$2;
              _decoded_char = _p;
              break _L;
            }
          } else {
            const _tmp$2 = _string_index + 1 | 0;
            const _p = _bind$4;
            _decoded_next_string_index = _tmp$2;
            _decoded_char = _p;
            break _L;
          }
        }
        _M0IPB13StringBuilderPB6Logger11write__char(buf, _decoded_char);
        _M0IPB13StringBuilderPB6Logger13write__string(buf, new$2);
        _tmp = _decoded_next_string_index;
        continue;
      } else {
        break;
      }
    }
    const _bind$4 = buf.val;
    return new _M0TPC16string10StringView(_bind$4, 0, _bind$4.length);
  } else {
    const first_end = _M0MPC16string10StringView4find(self, old);
    if (first_end === undefined) {
      return self;
    } else {
      const _Some = first_end;
      const _end = _Some;
      let _tmp = self;
      let _tmp$2 = _end;
      while (true) {
        const view = _tmp;
        const end = _tmp$2;
        const seg = _M0MPC16string10StringView12view_2einner(view, 0, end);
        _M0IP016_24default__implPB6Logger16write__substringGRPB13StringBuilderE(buf, seg.str, seg.start, seg.end - seg.start | 0);
        _M0IPB13StringBuilderPB6Logger13write__string(buf, new$2);
        if ((end + old_len | 0) <= len) {
          const next_view = _M0MPC16string10StringView12view_2einner(view, end + old_len | 0, undefined);
          const _bind = _M0MPC16string10StringView4find(next_view, old);
          if (_bind === undefined) {
            _M0IP016_24default__implPB6Logger16write__substringGRPB13StringBuilderE(buf, next_view.str, next_view.start, next_view.end - next_view.start | 0);
            break;
          } else {
            const _Some$2 = _bind;
            const _next_end = _Some$2;
            _tmp = next_view;
            _tmp$2 = _next_end;
            continue;
          }
        } else {
          break;
        }
      }
      const _bind = buf.val;
      return new _M0TPC16string10StringView(_bind, 0, _bind.length);
    }
  }
}
function _M0MPC14char4Char20is__ascii__uppercase(self) {
  return self >= 65 && self <= 90;
}
function _M0MPC16string10StringView9to__lower(self) {
  const _p = self.str;
  const _p$2 = self.start;
  const _p$3 = self.end;
  let _bind;
  let _tmp = _p$2;
  let _tmp$2 = 0;
  while (true) {
    const _p$4 = _tmp;
    const _p$5 = _tmp$2;
    if (_p$4 < _p$3) {
      let _p$6;
      let _p$7;
      _L: {
        const _p$8 = _p.charCodeAt(_p$4);
        if (_p$8 >= 55296 && _p$8 <= 56319 && (_p$4 + 1 | 0) < _p$3) {
          const _p$9 = _p.charCodeAt(_p$4 + 1 | 0);
          if (_p$9 >= 56320 && _p$9 <= 57343) {
            const _tmp$3 = _p$4 + 2 | 0;
            const _p$10 = (((Math.imul(_p$8 - 55296 | 0, 1024) | 0) + _p$9 | 0) - 56320 | 0) + 65536 | 0;
            _p$6 = _tmp$3;
            _p$7 = _p$10;
            break _L;
          } else {
            const _tmp$3 = _p$4 + 1 | 0;
            const _p$10 = _p$8;
            _p$6 = _tmp$3;
            _p$7 = _p$10;
            break _L;
          }
        } else {
          const _tmp$3 = _p$4 + 1 | 0;
          const _p$9 = _p$8;
          _p$6 = _tmp$3;
          _p$7 = _p$9;
          break _L;
        }
      }
      if (_M0MPC14char4Char20is__ascii__uppercase(_p$7)) {
        _bind = _p$5;
        break;
      }
      _tmp = _p$6;
      const _p$8 = _p$7;
      _tmp$2 = _p$5 + (_p$8 <= 65535 ? 1 : 2) | 0;
      continue;
    } else {
      _bind = undefined;
      break;
    }
  }
  if (_bind === undefined) {
    return self;
  } else {
    const _Some = _bind;
    const _idx = _Some;
    const buf = _M0MPB13StringBuilder21StringBuilder_2einner(self.end - self.start | 0);
    const head = _M0MPC16string10StringView12view_2einner(self, 0, _idx);
    _M0IP016_24default__implPB6Logger16write__substringGRPB13StringBuilderE(buf, head.str, head.start, head.end - head.start | 0);
    const _bind$2 = _M0MPC16string10StringView12view_2einner(self, _idx, undefined);
    const _bind$3 = _bind$2.str;
    const _bind$4 = _bind$2.start;
    const _bind$5 = _bind$2.end;
    let _tmp$3 = _bind$4;
    while (true) {
      const _string_index = _tmp$3;
      if (_string_index < _bind$5) {
        let _decoded_next_string_index;
        let _decoded_char;
        _L: {
          const _bind$6 = _bind$3.charCodeAt(_string_index);
          if (_bind$6 >= 55296 && _bind$6 <= 56319 && (_string_index + 1 | 0) < _bind$5) {
            const _bind$7 = _bind$3.charCodeAt(_string_index + 1 | 0);
            if (_bind$7 >= 56320 && _bind$7 <= 57343) {
              const _tmp$4 = _string_index + 2 | 0;
              const _p$4 = (((Math.imul(_bind$6 - 55296 | 0, 1024) | 0) + _bind$7 | 0) - 56320 | 0) + 65536 | 0;
              _decoded_next_string_index = _tmp$4;
              _decoded_char = _p$4;
              break _L;
            } else {
              const _tmp$4 = _string_index + 1 | 0;
              const _p$4 = _bind$6;
              _decoded_next_string_index = _tmp$4;
              _decoded_char = _p$4;
              break _L;
            }
          } else {
            const _tmp$4 = _string_index + 1 | 0;
            const _p$4 = _bind$6;
            _decoded_next_string_index = _tmp$4;
            _decoded_char = _p$4;
            break _L;
          }
        }
        if (_M0MPC14char4Char20is__ascii__uppercase(_decoded_char)) {
          _M0IPB13StringBuilderPB6Logger11write__char(buf, _decoded_char + 32 | 0);
        } else {
          _M0IPB13StringBuilderPB6Logger11write__char(buf, _decoded_char);
        }
        _tmp$3 = _decoded_next_string_index;
        continue;
      } else {
        break;
      }
    }
    const _bind$6 = buf.val;
    return new _M0TPC16string10StringView(_bind$6, 0, _bind$6.length);
  }
}
function _M0IPC16string6StringPB12ToStringView16to__string__view(self) {
  return new _M0TPC16string10StringView(self, 0, self.length);
}
function _M0IPC13int3IntPB4Show10to__string(self) {
  return _M0MPC13int3Int18to__string_2einner(self, 10);
}
function _M0MPC15array9ArrayView4iterGRP46podhmo14html_2dsandbox3pkg2el4NodeE(self) {
  const i = new _M0TPB8MutLocalGiE(0);
  const len = self.end - self.start | 0;
  return _M0MPB4Iter3newGRPC16string10StringViewE(() => {
    if (i.val < len) {
      const elem = self.buf[self.start + i.val | 0];
      i.val = i.val + 1 | 0;
      return elem;
    } else {
      return undefined;
    }
  }, len);
}
function _M0MPC15array10FixedArray4iterGsE(self) {
  return _M0MPC15array9ArrayView4iterGRP46podhmo14html_2dsandbox3pkg2el4NodeE(new _M0TPB9ArrayViewGsE(self, 0, self.length));
}
function _M0MPC15array5Array4iterGRP46podhmo14html_2dsandbox3pkg2el4NodeE(self) {
  return _M0MPC15array9ArrayView4iterGRP46podhmo14html_2dsandbox3pkg2el4NodeE(new _M0TPB9ArrayViewGRP46podhmo14html_2dsandbox3pkg2el4NodeE(self, 0, self.length));
}
function _M0MPC15array13ReadOnlyArray4iterGsE(self) {
  return _M0MPC15array10FixedArray4iterGsE(self);
}
function _M0MPC15array10FixedArray8containsGsE(self, value) {
  const _bind = self.length;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const x = self[_];
      if (x === value) {
        return true;
      }
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return false;
}
function _M0MPC15array13ReadOnlyArray8containsGsE(self, value) {
  return _M0MPC15array10FixedArray8containsGsE(self, value);
}
function _M0MPC15array9ArrayView4joinGRPC16string10StringViewE(self, separator) {
  if ((self.end - self.start | 0) === 0) {
    return "";
  } else {
    const _hd = self.buf[self.start];
    const _x_buf = self.buf;
    const _x_start = 1 + self.start | 0;
    const _x_end = self.end;
    const hd = _hd;
    const _bind = _x_end - _x_start | 0;
    let size_hint;
    let _tmp = 0;
    let _tmp$2 = hd.end - hd.start | 0;
    while (true) {
      const _ = _tmp;
      const size_hint$2 = _tmp$2;
      if (_ < _bind) {
        const s = _x_buf[_x_start + _ | 0];
        _tmp = _ + 1 | 0;
        const _bind$2 = s;
        _tmp$2 = (size_hint$2 + (_bind$2.end - _bind$2.start | 0) | 0) + (separator.end - separator.start | 0) | 0;
        continue;
      } else {
        size_hint = size_hint$2;
        break;
      }
    }
    const size_hint$2 = size_hint << 1;
    const buf = _M0MPB13StringBuilder21StringBuilder_2einner(size_hint$2);
    _M0IPB13StringBuilderPB6Logger11write__view(buf, hd);
    if ((separator.end - separator.start | 0) === 0) {
      const _bind$2 = _x_end - _x_start | 0;
      let _tmp$3 = 0;
      while (true) {
        const _ = _tmp$3;
        if (_ < _bind$2) {
          const s = _x_buf[_x_start + _ | 0];
          const s$2 = s;
          _M0IPB13StringBuilderPB6Logger11write__view(buf, s$2);
          _tmp$3 = _ + 1 | 0;
          continue;
        } else {
          break;
        }
      }
    } else {
      const _bind$2 = _x_end - _x_start | 0;
      let _tmp$3 = 0;
      while (true) {
        const _ = _tmp$3;
        if (_ < _bind$2) {
          const s = _x_buf[_x_start + _ | 0];
          const s$2 = s;
          _M0IPB13StringBuilderPB6Logger11write__view(buf, separator);
          _M0IPB13StringBuilderPB6Logger11write__view(buf, s$2);
          _tmp$3 = _ + 1 | 0;
          continue;
        } else {
          break;
        }
      }
    }
    return buf.val;
  }
}
function _M0MPC15array9ArrayView4joinGsE(self, separator) {
  if ((self.end - self.start | 0) === 0) {
    return "";
  } else {
    const _hd = self.buf[self.start];
    const _x_buf = self.buf;
    const _x_start = 1 + self.start | 0;
    const _x_end = self.end;
    const hd = _M0IPC16string6StringPB12ToStringView16to__string__view(_hd);
    const _bind = _x_end - _x_start | 0;
    let size_hint;
    let _tmp = 0;
    let _tmp$2 = hd.end - hd.start | 0;
    while (true) {
      const _ = _tmp;
      const size_hint$2 = _tmp$2;
      if (_ < _bind) {
        const s = _x_buf[_x_start + _ | 0];
        _tmp = _ + 1 | 0;
        const _bind$2 = _M0IPC16string6StringPB12ToStringView16to__string__view(s);
        _tmp$2 = (size_hint$2 + (_bind$2.end - _bind$2.start | 0) | 0) + (separator.end - separator.start | 0) | 0;
        continue;
      } else {
        size_hint = size_hint$2;
        break;
      }
    }
    const size_hint$2 = size_hint << 1;
    const buf = _M0MPB13StringBuilder21StringBuilder_2einner(size_hint$2);
    _M0IPB13StringBuilderPB6Logger11write__view(buf, hd);
    if ((separator.end - separator.start | 0) === 0) {
      const _bind$2 = _x_end - _x_start | 0;
      let _tmp$3 = 0;
      while (true) {
        const _ = _tmp$3;
        if (_ < _bind$2) {
          const s = _x_buf[_x_start + _ | 0];
          const s$2 = _M0IPC16string6StringPB12ToStringView16to__string__view(s);
          _M0IPB13StringBuilderPB6Logger11write__view(buf, s$2);
          _tmp$3 = _ + 1 | 0;
          continue;
        } else {
          break;
        }
      }
    } else {
      const _bind$2 = _x_end - _x_start | 0;
      let _tmp$3 = 0;
      while (true) {
        const _ = _tmp$3;
        if (_ < _bind$2) {
          const s = _x_buf[_x_start + _ | 0];
          const s$2 = _M0IPC16string6StringPB12ToStringView16to__string__view(s);
          _M0IPB13StringBuilderPB6Logger11write__view(buf, separator);
          _M0IPB13StringBuilderPB6Logger11write__view(buf, s$2);
          _tmp$3 = _ + 1 | 0;
          continue;
        } else {
          break;
        }
      }
    }
    return buf.val;
  }
}
function _M0MPC16option6Option10unwrap__orGRPB3MapGssEE(self, default_) {
  if (self === undefined) {
    return default_;
  } else {
    const _Some = self;
    const _t = _Some;
    return _t;
  }
}
function _M0MPC16option6Option10unwrap__orGiE(self, default_) {
  if (self === undefined) {
    return default_;
  } else {
    const _Some = self;
    const _t = _Some;
    return _t;
  }
}
function _M0MPC13int3Int20next__power__of__two(self) {
  if (self >= 0) {
    if (self <= 1) {
      return 1;
    }
    if (self > 1073741824) {
      return 1073741824;
    }
    return (2147483647 >> (Math.clz32(self - 1 | 0) - 1 | 0)) + 1 | 0;
  } else {
    return $panic();
  }
}
function _M0FPB8new__mapGssE(capacity) {
  const capacity$2 = _M0MPC13int3Int20next__power__of__two(capacity);
  const _bind = capacity$2 - 1 | 0;
  const _bind$2 = (Math.imul(capacity$2, 13) | 0) / 16 | 0;
  const _bind$3 = $make_array_len_and_init(capacity$2, undefined);
  const _bind$4 = undefined;
  return new _M0TPB3MapGssE(_bind$3, 0, capacity$2, _bind, _bind$2, _bind$4, -1);
}
function _M0FPB8new__mapGsiE(capacity) {
  const capacity$2 = _M0MPC13int3Int20next__power__of__two(capacity);
  const _bind = capacity$2 - 1 | 0;
  const _bind$2 = (Math.imul(capacity$2, 13) | 0) / 16 | 0;
  const _bind$3 = $make_array_len_and_init(capacity$2, undefined);
  const _bind$4 = undefined;
  return new _M0TPB3MapGsiE(_bind$3, 0, capacity$2, _bind, _bind$2, _bind$4, -1);
}
function _M0FPB21capacity__for__length(length) {
  let capacity = _M0MPC13int3Int20next__power__of__two(length);
  const _p = capacity;
  if (length > ((Math.imul(_p, 13) | 0) / 16 | 0)) {
    capacity = Math.imul(capacity, 2) | 0;
  }
  return capacity;
}
function _M0MPB3Map20add__entry__to__tailGssE(self, idx, entry) {
  const _bind = self.tail;
  if (_bind === -1) {
    self.head = entry;
  } else {
    const _tmp = self.entries;
    const _p = _bind >>> 0 < _tmp.length ? _tmp[_bind] : $oob();
    let _tmp$2;
    if (_p === undefined) {
      _tmp$2 = $panic();
    } else {
      const _p$2 = _p;
      _tmp$2 = _p$2;
    }
    _tmp$2.next = entry;
  }
  self.tail = idx;
  self.entries[idx] = entry;
  self.size = self.size + 1 | 0;
}
function _M0MPB3Map20add__entry__to__tailGsiE(self, idx, entry) {
  const _bind = self.tail;
  if (_bind === -1) {
    self.head = entry;
  } else {
    const _tmp = self.entries;
    const _p = _bind >>> 0 < _tmp.length ? _tmp[_bind] : $oob();
    let _tmp$2;
    if (_p === undefined) {
      _tmp$2 = $panic();
    } else {
      const _p$2 = _p;
      _tmp$2 = _p$2;
    }
    _tmp$2.next = entry;
  }
  self.tail = idx;
  self.entries[idx] = entry;
  self.size = self.size + 1 | 0;
}
function _M0MPB3Map10set__entryGssE(self, entry, new_idx) {
  const _bind = entry.next;
  if (_bind === undefined) {
    self.tail = new_idx;
  } else {
    const _Some = _bind;
    const _next = _Some;
    _next.prev = new_idx;
  }
  self.entries[new_idx] = entry;
}
function _M0MPB3Map10set__entryGsiE(self, entry, new_idx) {
  const _bind = entry.next;
  if (_bind === undefined) {
    self.tail = new_idx;
  } else {
    const _Some = _bind;
    const _next = _Some;
    _next.prev = new_idx;
  }
  self.entries[new_idx] = entry;
}
function _M0MPB3Map10push__awayGssE(self, idx, entry) {
  let _tmp = entry.psl + 1 | 0;
  let _tmp$2 = idx + 1 & self.capacity_mask;
  let _tmp$3 = entry;
  while (true) {
    const psl = _tmp;
    const idx$2 = _tmp$2;
    const entry$2 = _tmp$3;
    const _bind = self.entries[idx$2];
    if (_bind === undefined) {
      entry$2.psl = psl;
      _M0MPB3Map10set__entryGssE(self, entry$2, idx$2);
      return;
    } else {
      const _Some = _bind;
      const _curr_entry = _Some;
      if (psl > _curr_entry.psl) {
        entry$2.psl = psl;
        _M0MPB3Map10set__entryGssE(self, entry$2, idx$2);
        _tmp = _curr_entry.psl + 1 | 0;
        _tmp$2 = idx$2 + 1 & self.capacity_mask;
        _tmp$3 = _curr_entry;
        continue;
      } else {
        _tmp = psl + 1 | 0;
        _tmp$2 = idx$2 + 1 & self.capacity_mask;
        continue;
      }
    }
  }
}
function _M0MPB3Map10push__awayGsiE(self, idx, entry) {
  let _tmp = entry.psl + 1 | 0;
  let _tmp$2 = idx + 1 & self.capacity_mask;
  let _tmp$3 = entry;
  while (true) {
    const psl = _tmp;
    const idx$2 = _tmp$2;
    const entry$2 = _tmp$3;
    const _bind = self.entries[idx$2];
    if (_bind === undefined) {
      entry$2.psl = psl;
      _M0MPB3Map10set__entryGsiE(self, entry$2, idx$2);
      return;
    } else {
      const _Some = _bind;
      const _curr_entry = _Some;
      if (psl > _curr_entry.psl) {
        entry$2.psl = psl;
        _M0MPB3Map10set__entryGsiE(self, entry$2, idx$2);
        _tmp = _curr_entry.psl + 1 | 0;
        _tmp$2 = idx$2 + 1 & self.capacity_mask;
        _tmp$3 = _curr_entry;
        continue;
      } else {
        _tmp = psl + 1 | 0;
        _tmp$2 = idx$2 + 1 & self.capacity_mask;
        continue;
      }
    }
  }
}
function _M0MPB3Map20rehash__place__entryGssE(self, outer) {
  const hash = outer.hash;
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const psl = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      outer.psl = psl;
      outer.prev = self.tail;
      _M0MPB3Map20add__entry__to__tailGssE(self, idx, outer);
      return undefined;
    } else {
      const _Some = _bind;
      const _curr = _Some;
      if (psl > _curr.psl) {
        _M0MPB3Map10push__awayGssE(self, idx, _curr);
        outer.psl = psl;
        outer.prev = self.tail;
        _M0MPB3Map20add__entry__to__tailGssE(self, idx, outer);
        return undefined;
      } else {
        _tmp = psl + 1 | 0;
        _tmp$2 = idx + 1 & self.capacity_mask;
        continue;
      }
    }
  }
}
function _M0MPB3Map20rehash__place__entryGsiE(self, outer) {
  const hash = outer.hash;
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const psl = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      outer.psl = psl;
      outer.prev = self.tail;
      _M0MPB3Map20add__entry__to__tailGsiE(self, idx, outer);
      return undefined;
    } else {
      const _Some = _bind;
      const _curr = _Some;
      if (psl > _curr.psl) {
        _M0MPB3Map10push__awayGsiE(self, idx, _curr);
        outer.psl = psl;
        outer.prev = self.tail;
        _M0MPB3Map20add__entry__to__tailGsiE(self, idx, outer);
        return undefined;
      } else {
        _tmp = psl + 1 | 0;
        _tmp$2 = idx + 1 & self.capacity_mask;
        continue;
      }
    }
  }
}
function _M0MPB3Map4growGssE(self) {
  const old_head = self.head;
  const new_capacity = self.capacity << 1;
  self.entries = $make_array_len_and_init(new_capacity, undefined);
  self.capacity = new_capacity;
  self.capacity_mask = new_capacity - 1 | 0;
  const _p = self.capacity;
  self.grow_at = (Math.imul(_p, 13) | 0) / 16 | 0;
  self.size = 0;
  self.head = undefined;
  self.tail = -1;
  let _tmp = old_head;
  while (true) {
    const x = _tmp;
    if (x === undefined) {
      return;
    } else {
      const _Some = x;
      const _e = _Some;
      const next_in_chain = _e.next;
      _e.next = undefined;
      _M0MPB3Map20rehash__place__entryGssE(self, _e);
      _tmp = next_in_chain;
      continue;
    }
  }
}
function _M0MPB3Map4growGsiE(self) {
  const old_head = self.head;
  const new_capacity = self.capacity << 1;
  self.entries = $make_array_len_and_init(new_capacity, undefined);
  self.capacity = new_capacity;
  self.capacity_mask = new_capacity - 1 | 0;
  const _p = self.capacity;
  self.grow_at = (Math.imul(_p, 13) | 0) / 16 | 0;
  self.size = 0;
  self.head = undefined;
  self.tail = -1;
  let _tmp = old_head;
  while (true) {
    const x = _tmp;
    if (x === undefined) {
      return;
    } else {
      const _Some = x;
      const _e = _Some;
      const next_in_chain = _e.next;
      _e.next = undefined;
      _M0MPB3Map20rehash__place__entryGsiE(self, _e);
      _tmp = next_in_chain;
      continue;
    }
  }
}
function _M0MPB3Map15set__with__hashGssE(self, key, value, hash) {
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const psl = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      if (self.size >= self.grow_at) {
        _M0MPB3Map4growGssE(self);
        _tmp = 0;
        _tmp$2 = hash & self.capacity_mask;
        continue;
      }
      const _bind$2 = self.tail;
      const _bind$3 = undefined;
      const entry = new _M0TPB5EntryGssE(_bind$2, _bind$3, psl, hash, key, value);
      _M0MPB3Map20add__entry__to__tailGssE(self, idx, entry);
      return undefined;
    } else {
      const _Some = _bind;
      const _curr_entry = _Some;
      if (_curr_entry.hash === hash && _curr_entry.key === key) {
        _curr_entry.value = value;
        return undefined;
      }
      if (psl > _curr_entry.psl) {
        if (self.size >= self.grow_at) {
          _M0MPB3Map4growGssE(self);
          _tmp = 0;
          _tmp$2 = hash & self.capacity_mask;
          continue;
        }
        _M0MPB3Map10push__awayGssE(self, idx, _curr_entry);
        const _bind$2 = self.tail;
        const _bind$3 = undefined;
        const entry = new _M0TPB5EntryGssE(_bind$2, _bind$3, psl, hash, key, value);
        _M0MPB3Map20add__entry__to__tailGssE(self, idx, entry);
        return undefined;
      }
      _tmp = psl + 1 | 0;
      _tmp$2 = idx + 1 & self.capacity_mask;
      continue;
    }
  }
}
function _M0MPB3Map15set__with__hashGsiE(self, key, value, hash) {
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const psl = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      if (self.size >= self.grow_at) {
        _M0MPB3Map4growGsiE(self);
        _tmp = 0;
        _tmp$2 = hash & self.capacity_mask;
        continue;
      }
      const _bind$2 = self.tail;
      const _bind$3 = undefined;
      const entry = new _M0TPB5EntryGsiE(_bind$2, _bind$3, psl, hash, key, value);
      _M0MPB3Map20add__entry__to__tailGsiE(self, idx, entry);
      return undefined;
    } else {
      const _Some = _bind;
      const _curr_entry = _Some;
      if (_curr_entry.hash === hash && _curr_entry.key === key) {
        _curr_entry.value = value;
        return undefined;
      }
      if (psl > _curr_entry.psl) {
        if (self.size >= self.grow_at) {
          _M0MPB3Map4growGsiE(self);
          _tmp = 0;
          _tmp$2 = hash & self.capacity_mask;
          continue;
        }
        _M0MPB3Map10push__awayGsiE(self, idx, _curr_entry);
        const _bind$2 = self.tail;
        const _bind$3 = undefined;
        const entry = new _M0TPB5EntryGsiE(_bind$2, _bind$3, psl, hash, key, value);
        _M0MPB3Map20add__entry__to__tailGsiE(self, idx, entry);
        return undefined;
      }
      _tmp = psl + 1 | 0;
      _tmp$2 = idx + 1 & self.capacity_mask;
      continue;
    }
  }
}
function _M0MPB3Map3setGssE(self, key, value) {
  _M0MPB3Map15set__with__hashGssE(self, key, value, _M0IPC16string6StringPB4Hash4hash(key));
}
function _M0MPB3Map3setGsiE(self, key, value) {
  _M0MPB3Map15set__with__hashGsiE(self, key, value, _M0IPC16string6StringPB4Hash4hash(key));
}
function _M0MPB3Map3MapGssE(arr, capacity) {
  const length = arr.end - arr.start | 0;
  let capacity$2;
  if (capacity === undefined) {
    capacity$2 = length === 0 ? 8 : _M0FPB21capacity__for__length(length);
  } else {
    const _Some = capacity;
    const _capacity = _Some;
    const _p = _M0FPB21capacity__for__length(length);
    capacity$2 = _capacity > _p ? _capacity : _p;
  }
  const m = _M0FPB8new__mapGssE(capacity$2);
  const _bind = arr.end - arr.start | 0;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const e = arr.buf[arr.start + _ | 0];
      _M0MPB3Map3setGssE(m, e._0, e._1);
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return m;
}
function _M0MPB3Map3MapGsiE(arr, capacity) {
  const length = arr.end - arr.start | 0;
  let capacity$2;
  if (capacity === undefined) {
    capacity$2 = length === 0 ? 8 : _M0FPB21capacity__for__length(length);
  } else {
    const _Some = capacity;
    const _capacity = _Some;
    const _p = _M0FPB21capacity__for__length(length);
    capacity$2 = _capacity > _p ? _capacity : _p;
  }
  const m = _M0FPB8new__mapGsiE(capacity$2);
  const _bind = arr.end - arr.start | 0;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const e = arr.buf[arr.start + _ | 0];
      _M0MPB3Map3setGsiE(m, e._0, e._1);
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return m;
}
function _M0MPB3Map3getGssE(self, key) {
  const hash = _M0IPC16string6StringPB4Hash4hash(key);
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const i = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      return undefined;
    } else {
      const _Some = _bind;
      const _entry = _Some;
      if (_entry.hash === hash && _entry.key === key) {
        return _entry.value;
      }
      if (i > _entry.psl) {
        return undefined;
      }
      _tmp = i + 1 | 0;
      _tmp$2 = idx + 1 & self.capacity_mask;
      continue;
    }
  }
}
function _M0MPB3Map3getGsiE(self, key) {
  const hash = _M0IPC16string6StringPB4Hash4hash(key);
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const i = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      return undefined;
    } else {
      const _Some = _bind;
      const _entry = _Some;
      if (_entry.hash === hash && _entry.key === key) {
        return _entry.value;
      }
      if (i > _entry.psl) {
        return undefined;
      }
      _tmp = i + 1 | 0;
      _tmp$2 = idx + 1 & self.capacity_mask;
      continue;
    }
  }
}
function _M0MPB3Map8containsGssE(self, key) {
  const hash = _M0IPC16string6StringPB4Hash4hash(key);
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const i = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      return false;
    } else {
      const _Some = _bind;
      const _entry = _Some;
      if (_entry.hash === hash && _entry.key === key) {
        return true;
      }
      if (i > _entry.psl) {
        return false;
      }
      _tmp = i + 1 | 0;
      _tmp$2 = idx + 1 & self.capacity_mask;
      continue;
    }
  }
}
function _M0MPB3Map8containsGsiE(self, key) {
  const hash = _M0IPC16string6StringPB4Hash4hash(key);
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const i = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      return false;
    } else {
      const _Some = _bind;
      const _entry = _Some;
      if (_entry.hash === hash && _entry.key === key) {
        return true;
      }
      if (i > _entry.psl) {
        return false;
      }
      _tmp = i + 1 | 0;
      _tmp$2 = idx + 1 & self.capacity_mask;
      continue;
    }
  }
}
function _M0IPC16string6StringPB4Hash4hash(self) {
  let acc = (_M0FPB4seed >>> 0) + (374761393 >>> 0) | 0;
  const _bind = self.length;
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < _bind) {
      acc = (acc >>> 0) + (4 >>> 0) | 0;
      const v = self.charCodeAt(i);
      acc = _M0FPB13consume4__acc(acc, v);
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return _M0FPB13finalize__acc(acc);
}
function _M0MPC15array10FixedArray23unsafe__make__and__blitGyE(src, allocate_len, init, src_offset, dst_offset, blit_len) {
  const dst = $makebytes(allocate_len, init);
  _M0MPC15array10FixedArray12unsafe__blitGyE(dst, dst_offset, src, src_offset, blit_len);
  return dst;
}
function _M0MPC15array10FixedArray23make__and__blit_2einnerGyE(src, allocate_len, init, len, src_offset, dst_offset) {
  if (allocate_len >= 0 && (len >= 0 && (src_offset >= 0 && (dst_offset >= 0 && ((src_offset + len | 0) <= src.length && (dst_offset + len | 0) <= allocate_len))))) {
    return _M0MPC15array10FixedArray23unsafe__make__and__blitGyE(src, allocate_len, init, src_offset, dst_offset, len);
  } else {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(89);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "bounds check failed: allocate_len = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, allocate_len);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", src_offset = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, src_offset);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", dst_offset = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, dst_offset);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", len = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, len);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", src.length = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, src.length);
    return $panic();
  }
}
function _M0MPC14char4Char9is__ascii(self) {
  return self >= 0 && self <= 127;
}
function _M0MPC14char4Char21is__ascii__whitespace(self) {
  return self >= 9 && self <= 13 ? true : self === 32;
}
function _M0MPC14char4Char14is__whitespace(self) {
  if (self <= 32) {
    return _M0MPC14char4Char21is__ascii__whitespace(self);
  }
  return self === 133 ? true : self === 160 ? true : self === 5760 ? true : self >= 8192 && self <= 8202 ? true : self === 8232 ? true : self === 8233 ? true : self === 8239 ? true : self === 8287 ? true : self === 12288;
}
function _M0MPC15array10FixedArray17blit__from__bytes(self, bytes_offset, src, src_offset, length) {
  const len1 = self.length;
  const len2 = src.length;
  if (length >= 0 && (bytes_offset >= 0 && (bytes_offset <= len1 && (length <= (len1 - bytes_offset | 0) && (src_offset >= 0 && (src_offset <= len2 && length <= (len2 - src_offset | 0))))))) {
    _M0MPC15array10FixedArray12unsafe__blitGyE(self, bytes_offset, src, src_offset, length);
    return;
  } else {
    $panic();
    return;
  }
}
function _M0MPC15bytes5Bytes11from__array(arr) {
  const len = arr.end - arr.start | 0;
  if (len === 0) {
    return $bytes_literal$0;
  }
  const result = _M0MPB18UninitializedArray23unsafe__make__and__blitGyE(arr.buf, len, arr.start, 0, len);
  return result;
}
function _M0MPC15array5Array28unsafe__truncate__to__lengthGRPC16string10StringViewE(self, new_len) {
  _M0MPB7JSArray11set__length(self, new_len);
}
function _M0MPC15array5Array11unsafe__popGRPC16string10StringViewE(self) {
  return _M0MPB7JSArray3pop(self);
}
function _M0MPC15array5Array3popGRPC16string10StringViewE(self) {
  if (self.length === 0) {
    return undefined;
  } else {
    const v = _M0MPC15array5Array11unsafe__popGRPC16string10StringViewE(self);
    return v;
  }
}
function _M0MPC15array5Array6removeGRPC16string10StringViewE(self, index) {
  if (index >= 0 && index < self.length) {
    const value = index >>> 0 < self.length ? self[index] : $oob();
    _M0MPB7JSArray6splice(self, index, 1);
    return value;
  } else {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(60);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "index out of bounds: the len is from 0 to ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, self.length);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, " but the index is ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, index);
    return $panic();
  }
}
function _M0MPC15array5Array2atGRP46podhmo14html_2dsandbox3pkg12tinymarkdown4FlatE(self, index) {
  const len = self.length;
  return index >= 0 && index < len ? self[index] : $panic();
}
function _M0MPC15array5Array5clearGRPC16string10StringViewE(self) {
  _M0MPC15array5Array28unsafe__truncate__to__lengthGRPC16string10StringViewE(self, 0);
}
function _M0MPC15array5Array8truncateGsE(self, len) {
  if (len >= 0 && len < self.length) {
    _M0MPC15array5Array28unsafe__truncate__to__lengthGRPC16string10StringViewE(self, len);
    return;
  } else {
    return;
  }
}
function _M0MPC15array5Array10push__iterGRP46podhmo14html_2dsandbox3pkg2el4NodeE(self, iter) {
  const _bind = iter.size_hint;
  if (_bind === undefined) {
  }
  while (true) {
    const _bind$2 = _M0MPB4Iter4nextGRPC16string10StringViewE(iter);
    if (_bind$2 === undefined) {
      return;
    } else {
      const _Some = _bind$2;
      const _x = _Some;
      _M0MPC15array5Array4pushGsE(self, _x);
      continue;
    }
  }
}
function _M0MPC15array5Array4joinGRPC16string10StringViewE(self, separator) {
  return _M0MPC15array9ArrayView4joinGRPC16string10StringViewE(new _M0TPB9ArrayViewGRPC16string10StringViewE(self, 0, self.length), separator);
}
function _M0MPC15array5Array4joinGsE(self, separator) {
  return _M0MPC15array9ArrayView4joinGsE(new _M0TPB9ArrayViewGsE(self, 0, self.length), separator);
}
function _M0FPC28encoding4utf814encode_2einner(str, bom) {
  return _M0FPC28encoding4utf816encode__utf8__js(str.str, str.start, str.end - str.start | 0, bom);
}
function _M0FPC28encoding4utf821decode__lossy_2einner(bytes, ignore_bom) {
  return _M0FPC28encoding4utf823decode__utf8__lossy__js(bytes.buf, bytes.start, bytes.end - bytes.start | 0, !ignore_bom);
}
function _M0FPC16buffer24buffer__growth__capacity(current, len, required) {
  if (required < len) {
    $panic();
  }
  const start = current <= 0 ? 1 : current;
  let _tmp = start;
  while (true) {
    const space = _tmp;
    if (space >= required) {
      return space;
    }
    const next = Math.imul(space, 2) | 0;
    if (next <= space) {
      return required;
    }
    _tmp = next;
    continue;
  }
}
function _M0MPC16buffer6Buffer4grow(self, required) {
  const new_capacity = _M0FPC16buffer24buffer__growth__capacity(self.data.length, self.len, required);
  const new_data = _M0MPC15array10FixedArray23make__and__blit_2einnerGyE(self.data, new_capacity, 0, self.len, 0, 0);
  self.data = new_data;
}
function _M0MPC16buffer6Buffer9to__bytes(self) {
  return _M0MPC15bytes5Bytes11from__array(_M0MPC15array10FixedArray21clamped__view_2einnerGyE(self.data, 0, self.len));
}
function _M0MPC16buffer6Buffer14Buffer_2einner(size_hint) {
  const initial = size_hint < 1 ? 1 : size_hint;
  const data = $makebytes(initial, 0);
  return new _M0TPC16buffer6Buffer(data, 0);
}
function _M0MPC16buffer6Buffer16write__bytesview(self, value) {
  const val_len = value.end - value.start | 0;
  const required = self.len + val_len | 0;
  if (required > self.data.length || required < self.len) {
    _M0MPC16buffer6Buffer4grow(self, required);
  }
  _M0MPC15array10FixedArray17blit__from__bytes(self.data, self.len, value.buf, value.start, value.end - value.start | 0);
  self.len = self.len + val_len | 0;
}
function _M0MPC16buffer6Buffer12write__bytes(self, value) {
  _M0MPC16buffer6Buffer16write__bytesview(self, value);
}
function _M0MPC16buffer6Buffer11write__byte(self, value) {
  if (self.len >= self.data.length) {
    _M0MPC16buffer6Buffer4grow(self, self.len + 1 | 0);
  }
  self.data[self.len] = value;
  self.len = self.len + 1 | 0;
}
function _M0EPB13StringBuilderP46podhmo14html_2dsandbox3pkg2el14write__escaped(self, s) {
  const n = s.length;
  let start = 0;
  let i = 0;
  _L: while (true) {
    if (i < n) {
      const _tmp = i;
      const _bind = _tmp >>> 0 < s.length ? s.charCodeAt(_tmp) : $oob();
      let esc;
      switch (_bind) {
        case 60: {
          esc = "&lt;";
          break;
        }
        case 62: {
          esc = "&gt;";
          break;
        }
        case 38: {
          esc = "&amp;";
          break;
        }
        case 39: {
          esc = "&#39;";
          break;
        }
        case 34: {
          esc = "&#34;";
          break;
        }
        default: {
          i = i + 1 | 0;
          continue _L;
        }
      }
      if (start < i) {
        _M0IPB13StringBuilderPB6Logger11write__view(self, _M0MPC16string6String21clamped__view_2einner(s, start, i));
      }
      _M0IPB13StringBuilderPB6Logger13write__string(self, esc);
      i = i + 1 | 0;
      start = i;
      continue;
    } else {
      break;
    }
  }
  if (start < n) {
    _M0IPB13StringBuilderPB6Logger11write__view(self, _M0MPC16string6String21clamped__view_2einner(s, start, undefined));
    return;
  } else {
    return;
  }
}
function _M0MP46podhmo14html_2dsandbox3pkg2el3Tag8is__void(self) {
  const _bind = self;
  switch (_bind) {
    case "area": {
      return true;
    }
    case "base": {
      return true;
    }
    case "br": {
      return true;
    }
    case "col": {
      return true;
    }
    case "embed": {
      return true;
    }
    case "hr": {
      return true;
    }
    case "img": {
      return true;
    }
    case "input": {
      return true;
    }
    case "link": {
      return true;
    }
    case "meta": {
      return true;
    }
    case "source": {
      return true;
    }
    case "track": {
      return true;
    }
    case "wbr": {
      return true;
    }
    default: {
      return false;
    }
  }
}
function _M0MP46podhmo14html_2dsandbox3pkg2el4Node8is__attr(self) {
  switch (self.$tag) {
    case 3: {
      return true;
    }
    case 4: {
      return true;
    }
    default: {
      return false;
    }
  }
}
function _M0MP46podhmo14html_2dsandbox3pkg2el4Node11write__html(self, sb) {
  switch (self.$tag) {
    case 0: {
      const _Text = self;
      const _s = _Text._0;
      _M0EPB13StringBuilderP46podhmo14html_2dsandbox3pkg2el14write__escaped(sb, _s);
      return;
    }
    case 1: {
      const _Raw = self;
      const _s$2 = _Raw._0;
      _M0IPB13StringBuilderPB6Logger13write__string(sb, _s$2);
      return;
    }
    case 3: {
      const _Attr = self;
      const _x = _Attr._0;
      const _k = _x;
      const _v = _Attr._1;
      _M0IPB13StringBuilderPB6Logger11write__char(sb, 32);
      _M0IPB13StringBuilderPB6Logger13write__string(sb, _k);
      _M0IPB13StringBuilderPB6Logger13write__string(sb, "=\"");
      _M0EPB13StringBuilderP46podhmo14html_2dsandbox3pkg2el14write__escaped(sb, _v);
      _M0IPB13StringBuilderPB6Logger11write__char(sb, 34);
      return;
    }
    case 4: {
      const _BoolAttr = self;
      const _x$2 = _BoolAttr._0;
      const _k$2 = _x$2;
      _M0IPB13StringBuilderPB6Logger11write__char(sb, 32);
      _M0IPB13StringBuilderPB6Logger13write__string(sb, _k$2);
      return;
    }
    default: {
      const _Element = self;
      const _name = _Element._0;
      const _children = _Element._1;
      _M0IPB13StringBuilderPB6Logger11write__char(sb, 60);
      _M0IPB13StringBuilderPB6Logger13write__string(sb, _name);
      const _bind = _children.length;
      let _tmp = 0;
      while (true) {
        const _ = _tmp;
        if (_ < _bind) {
          const c = _children[_];
          if (_M0MP46podhmo14html_2dsandbox3pkg2el4Node8is__attr(c)) {
            _M0MP46podhmo14html_2dsandbox3pkg2el4Node11write__html(c, sb);
          }
          _tmp = _ + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _M0IPB13StringBuilderPB6Logger11write__char(sb, 62);
      if (_M0MP46podhmo14html_2dsandbox3pkg2el3Tag8is__void(_name)) {
        return undefined;
      }
      const _bind$2 = _children.length;
      let _tmp$2 = 0;
      while (true) {
        const _ = _tmp$2;
        if (_ < _bind$2) {
          const c = _children[_];
          if (!_M0MP46podhmo14html_2dsandbox3pkg2el4Node8is__attr(c)) {
            _M0MP46podhmo14html_2dsandbox3pkg2el4Node11write__html(c, sb);
          }
          _tmp$2 = _ + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      _M0IPB13StringBuilderPB6Logger13write__string(sb, "</");
      _M0IPB13StringBuilderPB6Logger13write__string(sb, _name);
      _M0IPB13StringBuilderPB6Logger11write__char(sb, 62);
      return;
    }
  }
}
function _M0FP46podhmo14html_2dsandbox3pkg2el12render__html(n) {
  const sb = _M0MPB13StringBuilder21StringBuilder_2einner(0);
  _M0MP46podhmo14html_2dsandbox3pkg2el4Node11write__html(n, sb);
  return sb.val;
}
function _M0FP46podhmo14html_2dsandbox3pkg4http10hex__value(c) {
  const n = c;
  return c >= 48 && c <= 57 ? n - 48 | 0 : c >= 97 && c <= 102 ? (n - 97 | 0) + 10 | 0 : c >= 65 && c <= 70 ? (n - 65 | 0) + 10 | 0 : undefined;
}
function _M0FP46podhmo14html_2dsandbox3pkg4http16unescape_2einner(s, plus) {
  if (_M0MPC16string10StringView8contains(s, _M0FP46podhmo14html_2dsandbox3pkg4http16unescape_2einnerN6recordS1204) || plus && _M0MPC16string10StringView8contains(s, _M0FP46podhmo14html_2dsandbox3pkg4http16unescape_2einnerN6recordS1205)) {
    const bytes = _M0MPC16buffer6Buffer14Buffer_2einner(0);
    let _tmp = 0;
    while (true) {
      const i = _tmp;
      if (i < (s.end - s.start | 0)) {
        if (i < 0 || i >= (s.end - s.start | 0)) {
          $panic();
        }
        const c = s.str.charCodeAt(s.start + i | 0);
        const _p = 37;
        if (c === _p) {
          _L: {
            if ((i + 2 | 0) < (s.end - s.start | 0)) {
              const _bind = i + 1 | 0;
              if (_bind < 0 || _bind >= (s.end - s.start | 0)) {
                $panic();
              }
              const _bind$2 = _M0FP46podhmo14html_2dsandbox3pkg4http10hex__value(s.str.charCodeAt(s.start + _bind | 0));
              if (_bind$2 === undefined) {
                break _L;
              } else {
                const _Some = _bind$2;
                const _hi = _Some;
                const _bind$3 = i + 2 | 0;
                if (_bind$3 < 0 || _bind$3 >= (s.end - s.start | 0)) {
                  $panic();
                }
                const _bind$4 = _M0FP46podhmo14html_2dsandbox3pkg4http10hex__value(s.str.charCodeAt(s.start + _bind$3 | 0));
                if (_bind$4 === undefined) {
                  break _L;
                } else {
                  const _Some$2 = _bind$4;
                  const _lo = _Some$2;
                  _M0MPC16buffer6Buffer11write__byte(bytes, ((Math.imul(_hi, 16) | 0) + _lo | 0) & 255);
                  _tmp = i + 3 | 0;
                  continue;
                }
              }
            } else {
              break _L;
            }
          }
          return undefined;
        }
        let _tmp$2;
        if (plus) {
          const _p$2 = 43;
          _tmp$2 = c === _p$2;
        } else {
          _tmp$2 = false;
        }
        if (_tmp$2) {
          _M0MPC16buffer6Buffer11write__byte(bytes, 32);
          _tmp = i + 1 | 0;
          continue;
        }
        const _p$2 = _M0MPC16string10StringView21clamped__view_2einner(s, i, undefined);
        const _p$3 = _p$2.str;
        const _p$4 = _p$2.start;
        const _p$5 = _p$2.end;
        let _bind;
        let _tmp$3 = _p$4;
        let _tmp$4 = 0;
        while (true) {
          const _p$6 = _tmp$3;
          const _p$7 = _tmp$4;
          if (_p$6 < _p$5) {
            let _p$8;
            let _p$9;
            _L: {
              const _p$10 = _p$3.charCodeAt(_p$6);
              if (_p$10 >= 55296 && _p$10 <= 56319 && (_p$6 + 1 | 0) < _p$5) {
                const _p$11 = _p$3.charCodeAt(_p$6 + 1 | 0);
                if (_p$11 >= 56320 && _p$11 <= 57343) {
                  const _tmp$5 = _p$6 + 2 | 0;
                  const _p$12 = (((Math.imul(_p$10 - 55296 | 0, 1024) | 0) + _p$11 | 0) - 56320 | 0) + 65536 | 0;
                  _p$8 = _tmp$5;
                  _p$9 = _p$12;
                  break _L;
                } else {
                  const _tmp$5 = _p$6 + 1 | 0;
                  const _p$12 = _p$10;
                  _p$8 = _tmp$5;
                  _p$9 = _p$12;
                  break _L;
                }
              } else {
                const _tmp$5 = _p$6 + 1 | 0;
                const _p$11 = _p$10;
                _p$8 = _tmp$5;
                _p$9 = _p$11;
                break _L;
              }
            }
            if (_p$9 === 37 || plus && _p$9 === 43) {
              _bind = _p$7;
              break;
            }
            _tmp$3 = _p$8;
            const _p$10 = _p$9;
            _tmp$4 = _p$7 + (_p$10 <= 65535 ? 1 : 2) | 0;
            continue;
          } else {
            _bind = undefined;
            break;
          }
        }
        let end;
        if (_bind === undefined) {
          end = s.end - s.start | 0;
        } else {
          const _Some = _bind;
          const _j = _Some;
          end = i + _j | 0;
        }
        const _bind$2 = _M0FPC28encoding4utf814encode_2einner(_M0MPC16string10StringView21clamped__view_2einner(s, i, end), false);
        _M0MPC16buffer6Buffer12write__bytes(bytes, new _M0TPC15bytes9BytesView(_bind$2, 0, _bind$2.length));
        _tmp = end;
        continue;
      } else {
        break;
      }
    }
    const _bind = _M0MPC16buffer6Buffer9to__bytes(bytes);
    return _M0FPC28encoding4utf821decode__lossy_2einner(new _M0TPC15bytes9BytesView(_bind, 0, _bind.length), false);
  } else {
    return _M0MPC16string10StringView9to__owned(s);
  }
}
function _M0FP46podhmo14html_2dsandbox3pkg6picoel7article(children) {
  return new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(_M0FP46podhmo14html_2dsandbox3pkg2el7article, children);
}
function _M0FP46podhmo14html_2dsandbox3pkg6picoel7section(children) {
  return new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(_M0FP46podhmo14html_2dsandbox3pkg2el7section, children);
}
function _M0FP46podhmo14html_2dsandbox3pkg6picoel1p(children) {
  return new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(_M0FP46podhmo14html_2dsandbox3pkg2el1p, children);
}
function _M0FP46podhmo14html_2dsandbox3pkg6picoel4list(items) {
  return new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(_M0FP46podhmo14html_2dsandbox3pkg2el2ul, items);
}
function _M0FP46podhmo14html_2dsandbox3pkg6picoel2li(children) {
  return new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(_M0FP46podhmo14html_2dsandbox3pkg2el2li, children);
}
function _M0FP46podhmo14html_2dsandbox3pkg6picoel10blockquote(children) {
  return new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(_M0FP46podhmo14html_2dsandbox3pkg2el10blockquote, children);
}
function _M0FP46podhmo14html_2dsandbox3pkg6picoel5tableN3rowS1234(tag, cells) {
  const _acc = [];
  const _bind = cells.length;
  let _p;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const c = cells[_];
      _M0MPC15array5Array4pushGsE(_acc, new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(tag, c));
      _tmp = _ + 1 | 0;
      continue;
    } else {
      _p = _acc;
      break;
    }
  }
  return new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(_M0FP46podhmo14html_2dsandbox3pkg2el2tr, _p);
}
function _M0FP46podhmo14html_2dsandbox3pkg6picoel5table(header, rows) {
  const _p = [_M0FP46podhmo14html_2dsandbox3pkg6picoel5tableN3rowS1234(_M0FP46podhmo14html_2dsandbox3pkg2el2th, header)];
  const parts = [new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(_M0FP46podhmo14html_2dsandbox3pkg2el5thead, _p)];
  if (!(rows.length === 0)) {
    const _acc = [];
    const _bind = rows.length;
    let _p$2;
    let _tmp = 0;
    while (true) {
      const _ = _tmp;
      if (_ < _bind) {
        const r = rows[_];
        _M0MPC15array5Array4pushGsE(_acc, _M0FP46podhmo14html_2dsandbox3pkg6picoel5tableN3rowS1234(_M0FP46podhmo14html_2dsandbox3pkg2el2td, r));
        _tmp = _ + 1 | 0;
        continue;
      } else {
        _p$2 = _acc;
        break;
      }
    }
    _M0MPC15array5Array4pushGsE(parts, new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(_M0FP46podhmo14html_2dsandbox3pkg2el5tbody, _p$2));
  }
  const _p$2 = [new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node4Attr(_M0FP46podhmo14html_2dsandbox3pkg2el5class, "overflow-auto"), new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(_M0FP46podhmo14html_2dsandbox3pkg2el5table, parts)];
  return new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(_M0FP46podhmo14html_2dsandbox3pkg2el3div, _p$2);
}
function _M0FP46podhmo14html_2dsandbox3pkg6picoel3pre(text) {
  const _p = [new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node4Text(text)];
  return new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(_M0FP46podhmo14html_2dsandbox3pkg2el3pre, _p);
}
function _M0FP46podhmo14html_2dsandbox3pkg6picoel4code(text) {
  const _p = [new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node4Text(text)];
  return new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(_M0FP46podhmo14html_2dsandbox3pkg2el4code, _p);
}
function _M0FP46podhmo14html_2dsandbox3pkg6picoel1a(href, children) {
  const _self = [];
  _M0MPC15array5Array4pushGsE(_self, new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node4Attr(_M0FP46podhmo14html_2dsandbox3pkg2el4href, href));
  _M0MPC15array5Array10push__iterGRP46podhmo14html_2dsandbox3pkg2el4NodeE(_self, _M0MPC15array5Array4iterGRP46podhmo14html_2dsandbox3pkg2el4NodeE(children));
  const _p = _self;
  return new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(_M0FP46podhmo14html_2dsandbox3pkg2el1a, _p);
}
function _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter9cut__line(s) {
  const _bind = _M0MPC16string10StringView4find(s, _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter9cut__lineN6recordS1256);
  if (_bind === undefined) {
    return { _0: s, _1: _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter9cut__lineN6recordS1257 };
  } else {
    const _Some = _bind;
    const _i = _Some;
    return { _0: _M0MPC16string10StringView21clamped__view_2einner(s, 0, _i), _1: _M0MPC16string10StringView21clamped__view_2einner(s, _i + 1 | 0, undefined) };
  }
}
function _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter10trim__line(s) {
  return _M0MPC16string10StringView17trim__end_2einner(s, _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter10trim__lineN6recordS1262);
}
function _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter7unquote(s) {
  _L: {
    _L$2: {
      let inner;
      let q;
      let last;
      _L$3: {
        if (_M0MPC16string6String24char__length__ge_2einner(s.str, 2, s.start, s.end)) {
          const _x = s.str.charCodeAt(s.start);
          switch (_x) {
            case 34: {
              const _last = _M0MPC16string6String16unsafe__char__at(s.str, _M0MPC16string6String29offset__of__nth__char_2einner(s.str, -1, s.start, s.end));
              const _tmp = s.str;
              const _bind = _M0MPC16string6String29offset__of__nth__char_2einner(s.str, 1, s.start, s.end);
              let _tmp$2;
              if (_bind === undefined) {
                _tmp$2 = s.end;
              } else {
                const _Some = _bind;
                _tmp$2 = _Some;
              }
              const _x$2 = new _M0TPC16string10StringView(_tmp, _tmp$2, _M0MPC16string6String29offset__of__nth__char_2einner(s.str, -1, s.start, s.end));
              inner = _x$2;
              q = _x;
              last = _last;
              break _L$3;
            }
            case 39: {
              const _last$2 = _M0MPC16string6String16unsafe__char__at(s.str, _M0MPC16string6String29offset__of__nth__char_2einner(s.str, -1, s.start, s.end));
              const _tmp$3 = s.str;
              const _bind$2 = _M0MPC16string6String29offset__of__nth__char_2einner(s.str, 1, s.start, s.end);
              let _tmp$4;
              if (_bind$2 === undefined) {
                _tmp$4 = s.end;
              } else {
                const _Some = _bind$2;
                _tmp$4 = _Some;
              }
              const _x$3 = new _M0TPC16string10StringView(_tmp$3, _tmp$4, _M0MPC16string6String29offset__of__nth__char_2einner(s.str, -1, s.start, s.end));
              inner = _x$3;
              q = _x;
              last = _last$2;
              break _L$3;
            }
            default: {
              break _L$2;
            }
          }
        } else {
          break _L$2;
        }
      }
      if (last === q) {
        return _M0MPC16string10StringView9to__owned(inner);
      } else {
        break _L;
      }
    }
    break _L;
  }
  return _M0MPC16string10StringView9to__owned(s);
}
function _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter5split(src) {
  const _bind = _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter9cut__line(new _M0TPC16string10StringView(src, 0, src.length));
  const _first = _bind._0;
  const _rest = _bind._1;
  if (_M0IP016_24default__implPB2Eq10not__equalGRPC16string10StringViewE(_M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter10trim__line(_first), _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter5splitN6recordS1278)) {
    return new _M0DTPC16result6ResultGUORPB3MapGssEsERP46podhmo14html_2dsandbox3pkg15tinyfrontmatter10SplitErrorE2Ok({ _0: undefined, _1: src });
  }
  const _bind$2 = [];
  const meta = _M0MPB3Map3MapGssE(new _M0TPB9ArrayViewGUssEE(_bind$2, 0, 0), undefined);
  let _tmp = _rest;
  let _tmp$2 = 2;
  while (true) {
    const rest = _tmp;
    const lineno = _tmp$2;
    if (_M0IP016_24default__implPB2Eq10not__equalGRPC16string10StringViewE(rest, _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter5splitN6recordS1279)) {
      const _bind$3 = _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter9cut__line(rest);
      const _raw = _bind$3._0;
      const _next = _bind$3._1;
      const line = _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter10trim__line(_raw);
      if (_M0IPC16string10StringViewPB2Eq5equal(line, _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter5splitN6recordS1280)) {
        return new _M0DTPC16result6ResultGUORPB3MapGssEsERP46podhmo14html_2dsandbox3pkg15tinyfrontmatter10SplitErrorE2Ok({ _0: meta, _1: _M0MPC16string10StringView9to__owned(_next) });
      }
      if (_M0IPC16string10StringViewPB2Eq5equal(line, _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter5splitN6recordS1281)) {
        _tmp = _next;
        _tmp$2 = lineno + 1 | 0;
        continue;
      }
      const _bind$4 = _M0MPC16string10StringView4find(line, _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter5splitN6recordS1282);
      if (_bind$4 === undefined) {
        const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(47);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "tinyfrontmatter: line ");
        _M0MPB13StringBuilder13write__objectGiE(_string_builder, lineno);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ": want \"key: value\", got ");
        _M0MPB13StringBuilder13write__objectGsE(_string_builder, _M0MPC16string6String14escape_2einner(_M0MPC16string10StringView9to__owned(line), true));
        return new _M0DTPC16result6ResultGUORPB3MapGssEsERP46podhmo14html_2dsandbox3pkg15tinyfrontmatter10SplitErrorE3Err(new _M0DTPC15error5Error73podhmo_2fhtml_2dsandbox_2fpkg_2ftinyfrontmatter_2eSplitError_2eSplitError(_string_builder.val));
      } else {
        const _Some = _bind$4;
        const _i = _Some;
        const key = _M0MPC16string10StringView9to__owned(_M0MPC16string10StringView12trim_2einner(_M0MPC16string10StringView21clamped__view_2einner(line, 0, _i), _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter5splitN6recordS1283));
        if (key === "") {
          const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(47);
          _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "tinyfrontmatter: line ");
          _M0MPB13StringBuilder13write__objectGiE(_string_builder, lineno);
          _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ": want \"key: value\", got ");
          _M0MPB13StringBuilder13write__objectGsE(_string_builder, _M0MPC16string6String14escape_2einner(_M0MPC16string10StringView9to__owned(line), true));
          return new _M0DTPC16result6ResultGUORPB3MapGssEsERP46podhmo14html_2dsandbox3pkg15tinyfrontmatter10SplitErrorE3Err(new _M0DTPC15error5Error73podhmo_2fhtml_2dsandbox_2fpkg_2ftinyfrontmatter_2eSplitError_2eSplitError(_string_builder.val));
        }
        if (_M0MPB3Map8containsGssE(meta, key)) {
          const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(38);
          _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "tinyfrontmatter: line ");
          _M0MPB13StringBuilder13write__objectGiE(_string_builder, lineno);
          _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ": duplicate key ");
          _M0MPB13StringBuilder13write__objectGsE(_string_builder, _M0MPC16string6String14escape_2einner(key, true));
          return new _M0DTPC16result6ResultGUORPB3MapGssEsERP46podhmo14html_2dsandbox3pkg15tinyfrontmatter10SplitErrorE3Err(new _M0DTPC15error5Error73podhmo_2fhtml_2dsandbox_2fpkg_2ftinyfrontmatter_2eSplitError_2eSplitError(_string_builder.val));
        }
        _M0MPB3Map3setGssE(meta, key, _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter7unquote(_M0MPC16string10StringView12trim_2einner(_M0MPC16string10StringView21clamped__view_2einner(line, _i + 1 | 0, undefined), _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter5splitN6recordS1284)));
        _tmp = _next;
        _tmp$2 = lineno + 1 | 0;
        continue;
      }
    } else {
      const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(28);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "tinyfrontmatter: no closing ");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder, _M0MPC16string6String14escape_2einner("---", true));
      return new _M0DTPC16result6ResultGUORPB3MapGssEsERP46podhmo14html_2dsandbox3pkg15tinyfrontmatter10SplitErrorE3Err(new _M0DTPC15error5Error73podhmo_2fhtml_2dsandbox_2fpkg_2ftinyfrontmatter_2eSplitError_2eSplitError(_string_builder.val));
    }
  }
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown15is__space__code(c) {
  if (c <= 32) {
    let _tmp;
    if (c >= 9 && c <= 13) {
      _tmp = true;
    } else {
      const _p = 32;
      _tmp = c === _p;
    }
    return _tmp;
  }
  switch (c) {
    case 133: {
      return true;
    }
    case 160: {
      return true;
    }
    case 5760: {
      return true;
    }
    case 8232: {
      return true;
    }
    case 8233: {
      return true;
    }
    case 8239: {
      return true;
    }
    case 8287: {
      return true;
    }
    case 12288: {
      return true;
    }
    default: {
      return c >= 8192 && c <= 8202;
    }
  }
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown11trim__space(s) {
  const n = s.end - s.start | 0;
  let start = 0;
  while (true) {
    let _tmp;
    if (start < n) {
      const _bind = start;
      if (_bind < 0 || _bind >= (s.end - s.start | 0)) {
        $panic();
      }
      _tmp = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown15is__space__code(s.str.charCodeAt(s.start + _bind | 0));
    } else {
      _tmp = false;
    }
    if (_tmp) {
      start = start + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  let end = n;
  while (true) {
    let _tmp;
    if (end > start) {
      const _bind = end - 1 | 0;
      if (_bind < 0 || _bind >= (s.end - s.start | 0)) {
        $panic();
      }
      _tmp = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown15is__space__code(s.str.charCodeAt(s.start + _bind | 0));
    } else {
      _tmp = false;
    }
    if (_tmp) {
      end = end - 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return _M0MPC16string10StringView21clamped__view_2einner(s, start, end);
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4nest(flat, from, level) {
  const out = [];
  let _tmp = from;
  while (true) {
    const i = _tmp;
    if (i < flat.length) {
      const _bind = _M0MPC15array5Array2atGRP46podhmo14html_2dsandbox3pkg12tinymarkdown4FlatE(flat, i);
      if (_bind.$tag === 0) {
        const _Block = _bind;
        const _b = _Block._0;
        _M0MPC15array5Array4pushGsE(out, _b);
        _tmp = i + 1 | 0;
        continue;
      } else {
        const _Heading = _bind;
        const _h = _Heading._0;
        const _x = _Heading._1;
        if (_h <= level) {
          return { _0: out, _1: i };
        } else {
          const _bind$2 = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4nest(flat, i + 1 | 0, _h);
          const _children = _bind$2._0;
          const _next = _bind$2._1;
          _M0MPC15array5Array4pushGsE(out, new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block7Section(_h, _x, _children));
          _tmp = _next;
          continue;
        }
      }
    } else {
      return { _0: out, _1: i };
    }
  }
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown12ascii__lower(c) {
  if (c >= 65 && c <= 90) {
    const _p = 32;
    return (c + _p | 0) & 65535;
  } else {
    return c;
  }
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown15ascii__eq__fold(a, b) {
  if ((a.end - a.start | 0) === (b.end - b.start | 0)) {
    let _tmp = 0;
    while (true) {
      const i = _tmp;
      if (i < (a.end - a.start | 0)) {
        if (i < 0 || i >= (a.end - a.start | 0)) {
          $panic();
        }
        const _p = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown12ascii__lower(a.str.charCodeAt(a.start + i | 0));
        if (i < 0 || i >= (b.end - b.start | 0)) {
          $panic();
        }
        const _p$2 = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown12ascii__lower(b.str.charCodeAt(b.start + i | 0));
        if (_p !== _p$2) {
          return false;
        }
        _tmp = i + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    return true;
  } else {
    return false;
  }
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown11alert__kind(line) {
  let end = line.end - line.start | 0;
  while (true) {
    let _tmp;
    if (end > 0) {
      let _tmp$2;
      const _bind = end - 1 | 0;
      if (_bind < 0 || _bind >= (line.end - line.start | 0)) {
        $panic();
      }
      const _p = line.str.charCodeAt(line.start + _bind | 0);
      const _p$2 = 32;
      if (_p === _p$2) {
        _tmp$2 = true;
      } else {
        const _bind$2 = end - 1 | 0;
        if (_bind$2 < 0 || _bind$2 >= (line.end - line.start | 0)) {
          $panic();
        }
        const _p$3 = line.str.charCodeAt(line.start + _bind$2 | 0);
        const _p$4 = 9;
        _tmp$2 = _p$3 === _p$4;
      }
      _tmp = _tmp$2;
    } else {
      _tmp = false;
    }
    if (_tmp) {
      end = end - 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const line$2 = _M0MPC16string10StringView21clamped__view_2einner(line, 0, end);
  let _tmp;
  if ((line$2.end - line$2.start | 0) >= 4) {
    let _tmp$2;
    if (0 >= (line$2.end - line$2.start | 0)) {
      $panic();
    }
    const _p = line$2.str.charCodeAt(line$2.start);
    const _p$2 = 91;
    if (_p === _p$2) {
      let _tmp$3;
      if (1 >= (line$2.end - line$2.start | 0)) {
        $panic();
      }
      const _p$3 = line$2.str.charCodeAt(line$2.start + 1 | 0);
      const _p$4 = 33;
      if (_p$3 === _p$4) {
        const _bind = end - 1 | 0;
        if (_bind < 0 || _bind >= (line$2.end - line$2.start | 0)) {
          $panic();
        }
        const _p$5 = line$2.str.charCodeAt(line$2.start + _bind | 0);
        const _p$6 = 93;
        _tmp$3 = _p$5 === _p$6;
      } else {
        _tmp$3 = false;
      }
      _tmp$2 = _tmp$3;
    } else {
      _tmp$2 = false;
    }
    _tmp = _tmp$2;
  } else {
    _tmp = false;
  }
  if (_tmp) {
    const inner = _M0MPC16string10StringView21clamped__view_2einner(line$2, 2, end - 1 | 0);
    const _bind = ["note", "tip", "important", "warning", "caution"];
    const _bind$2 = _bind.length;
    let _tmp$2 = 0;
    while (true) {
      const _ = _tmp$2;
      if (_ < _bind$2) {
        const kind = _bind[_];
        if (_M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown15ascii__eq__fold(inner, new _M0TPC16string10StringView(kind, 0, kind.length))) {
          return kind;
        }
        _tmp$2 = _ + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    return "";
  } else {
    return "";
  }
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown6indent(line) {
  const n = line.end - line.start | 0;
  let i = 0;
  while (true) {
    let _tmp;
    if (i < n) {
      let _tmp$2;
      const _bind = i;
      if (_bind < 0 || _bind >= (line.end - line.start | 0)) {
        $panic();
      }
      const _p = line.str.charCodeAt(line.start + _bind | 0);
      const _p$2 = 32;
      if (_p === _p$2) {
        _tmp$2 = true;
      } else {
        const _bind$2 = i;
        if (_bind$2 < 0 || _bind$2 >= (line.end - line.start | 0)) {
          $panic();
        }
        const _p$3 = line.str.charCodeAt(line.start + _bind$2 | 0);
        const _p$4 = 9;
        _tmp$2 = _p$3 === _p$4;
      }
      _tmp = _tmp$2;
    } else {
      _tmp = false;
    }
    if (_tmp) {
      i = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return i;
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown11is__heading(line) {
  const n = line.end - line.start | 0;
  let i = 0;
  while (true) {
    let _tmp;
    if (i < n) {
      const _bind = i;
      if (_bind < 0 || _bind >= (line.end - line.start | 0)) {
        $panic();
      }
      const _p = line.str.charCodeAt(line.start + _bind | 0);
      const _p$2 = 35;
      _tmp = _p === _p$2;
    } else {
      _tmp = false;
    }
    if (_tmp) {
      i = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  if (1 <= i) {
    let _tmp;
    if (i <= 5) {
      let _tmp$2;
      if (i < n) {
        const _bind = i;
        if (_bind < 0 || _bind >= (line.end - line.start | 0)) {
          $panic();
        }
        const _p = line.str.charCodeAt(line.start + _bind | 0);
        const _p$2 = 32;
        _tmp$2 = _p === _p$2;
      } else {
        _tmp$2 = false;
      }
      _tmp = _tmp$2;
    } else {
      _tmp = false;
    }
    return _tmp;
  } else {
    return false;
  }
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown11nest__items(flat, from, parent) {
  const out = [];
  let _tmp = from;
  while (true) {
    const i = _tmp;
    if (i < flat.length && _M0MPC15array5Array2atGRP46podhmo14html_2dsandbox3pkg12tinymarkdown4FlatE(flat, i).indent > parent) {
      const _bind = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown11nest__items(flat, i + 1 | 0, _M0MPC15array5Array2atGRP46podhmo14html_2dsandbox3pkg12tinymarkdown4FlatE(flat, i).indent);
      const _children = _bind._0;
      const _next = _bind._1;
      _M0MPC15array5Array4pushGsE(out, new _M0TP46podhmo14html_2dsandbox3pkg12tinymarkdown4Item(_M0MPC15array5Array2atGRP46podhmo14html_2dsandbox3pkg12tinymarkdown4FlatE(flat, i).text, _children));
      _tmp = _next;
      continue;
    } else {
      return { _0: out, _1: i };
    }
  }
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown14parse__heading(line) {
  const _p = _M0MPC16string10StringView4find(line, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown14parse__headingN6recordS1369);
  let n;
  if (_p === undefined) {
    n = $panic();
  } else {
    const _p$2 = _p;
    n = _p$2;
  }
  return new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown4Flat7Heading(n, _M0MPC16string10StringView9to__owned(_M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown11trim__space(_M0MPC16string10StringView21clamped__view_2einner(line, n, undefined))));
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown14unescape__cell(s) {
  return _M0MPC16string10StringView8contains(s, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown14unescape__cellN6recordS1372) ? _M0MPC16string10StringView12replace__all(s, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown14unescape__cellN6recordS1373, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown14unescape__cellN6recordS1374) : s;
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown5cells(line) {
  const line$2 = _M0MPC16option6Option10unwrap__orGRPB3MapGssEE(_M0MPC16string10StringView13strip__prefix(line, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown5cellsN6recordS1376), line);
  const out = [];
  const n = line$2.end - line$2.start | 0;
  let start = 0;
  let i = 0;
  while (true) {
    if (i < n) {
      const _bind = _M0MPC16string10StringView4find(_M0MPC16string10StringView21clamped__view_2einner(line$2, i, undefined), _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown5cellsN6recordS1377);
      let j;
      if (_bind === undefined) {
        break;
      } else {
        const _Some = _bind;
        const _k = _Some;
        j = i + _k | 0;
      }
      i = j + 1 | 0;
      let _tmp;
      if (j > start) {
        const _bind$2 = j - 1 | 0;
        if (_bind$2 < 0 || _bind$2 >= (line$2.end - line$2.start | 0)) {
          $panic();
        }
        const _p = line$2.str.charCodeAt(line$2.start + _bind$2 | 0);
        const _p$2 = 92;
        _tmp = _p === _p$2;
      } else {
        _tmp = false;
      }
      if (_tmp) {
        continue;
      }
      _M0MPC15array5Array4pushGsE(out, _M0MPC16string10StringView9to__owned(_M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown11trim__space(_M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown14unescape__cell(_M0MPC16string10StringView21clamped__view_2einner(line$2, start, j)))));
      start = i;
      continue;
    } else {
      break;
    }
  }
  const rest = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown11trim__space(_M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown14unescape__cell(_M0MPC16string10StringView21clamped__view_2einner(line$2, start, undefined)));
  if (_M0IP016_24default__implPB2Eq10not__equalGRPC16string10StringViewE(rest, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown5cellsN6recordS1378)) {
    _M0MPC15array5Array4pushGsE(out, _M0MPC16string10StringView9to__owned(rest));
  }
  return out;
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown13is__delimiter(c) {
  const c_end = c.length;
  let start = 0;
  let end = c_end;
  let _tmp;
  if (start < end) {
    const _bind = start;
    if (_bind < 0 || _bind >= c_end) {
      $panic();
    }
    const _p = c.charCodeAt(_bind);
    const _p$2 = 58;
    _tmp = _p === _p$2;
  } else {
    _tmp = false;
  }
  if (_tmp) {
    start = start + 1 | 0;
  }
  let _tmp$2;
  if (end > start) {
    const _bind = end - 1 | 0;
    if (_bind < 0 || _bind >= c_end) {
      $panic();
    }
    const _p = c.charCodeAt(_bind);
    const _p$2 = 58;
    _tmp$2 = _p === _p$2;
  } else {
    _tmp$2 = false;
  }
  if (_tmp$2) {
    end = end - 1 | 0;
  }
  if (start >= end) {
    return false;
  }
  let _tmp$3 = start;
  while (true) {
    const i = _tmp$3;
    if (i < end) {
      if (i < 0 || i >= c_end) {
        $panic();
      }
      const _p = c.charCodeAt(i);
      const _p$2 = 45;
      if (_p !== _p$2) {
        return false;
      }
      _tmp$3 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return true;
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown12parse__table(lines) {
  if (lines.length >= 2) {
    const _header = lines[0];
    const _delim = lines[1];
    const _x_end = lines.length;
    const header = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown5cells(_header);
    const delim = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown5cells(_delim);
    let _tmp;
    if (delim.length === header.length) {
      const _p = _M0MPC15array5Array4iterGRP46podhmo14html_2dsandbox3pkg2el4NodeE(delim);
      let _tmp$2;
      while (true) {
        const _p$2 = _M0MPB4Iter4nextGRPC16string10StringViewE(_p);
        if (_p$2 === undefined) {
          _tmp$2 = true;
          break;
        } else {
          const _p$3 = _p$2;
          const _p$4 = _p$3;
          if (_M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown13is__delimiter(_p$4)) {
          } else {
            _tmp$2 = false;
            break;
          }
          continue;
        }
      }
      _tmp = _tmp$2;
    } else {
      _tmp = false;
    }
    if (_tmp) {
      const rows = [];
      const _bind = _x_end - 2 | 0;
      let _tmp$2 = 0;
      while (true) {
        const _ = _tmp$2;
        if (_ < _bind) {
          const line = lines[2 + _ | 0];
          const row = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown5cells(line);
          _M0MPC15array5Array8truncateGsE(row, header.length);
          const _bind$2 = row.length;
          const _bind$3 = header.length;
          let _tmp$3 = _bind$2;
          while (true) {
            const _$2 = _tmp$3;
            if (_$2 < _bind$3) {
              _M0MPC15array5Array4pushGsE(row, "");
              _tmp$3 = _$2 + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          _M0MPC15array5Array4pushGRPB5ArrayGRPB5ArrayGRP46podhmo14html_2dsandbox3pkg2el4NodeEEE(rows, row);
          _tmp$2 = _ + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      return new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block5Table(header, rows);
    } else {
      return undefined;
    }
  } else {
    return undefined;
  }
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown5parse(src) {
  const _bind = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4nest(_M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scan(src), 0, 0);
  const _children = _bind._0;
  return new _M0TP46podhmo14html_2dsandbox3pkg12tinymarkdown8Document(_children);
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN5flushS1419(_env) {
  const items = _env._4;
  const quote = _env._3;
  const table = _env._2;
  const para = _env._1;
  const out = _env._0;
  if (!(para.length === 0)) {
    _M0MPC15array5Array4pushGsE(out, new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown4Flat5Block(new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block9Paragraph(_M0MPC15array5Array4joinGRPC16string10StringViewE(para, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1420))));
    _M0MPC15array5Array5clearGRPC16string10StringViewE(para);
  }
  if (!(items.length === 0)) {
    _M0MPC15array5Array4pushGsE(out, new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown4Flat5Block(new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block4List(_M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown11nest__items(items, 0, -1)._0)));
    _M0MPC15array5Array5clearGRPC16string10StringViewE(items);
  }
  if (!(quote.length === 0)) {
    const kind = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown11alert__kind(_M0MPC15array5Array2atGRP46podhmo14html_2dsandbox3pkg12tinymarkdown4FlatE(quote, 0));
    const _p = "";
    if (!(kind === _p)) {
      _M0MPC15array5Array6removeGRPC16string10StringViewE(quote, 0);
      _M0MPC15array5Array4pushGsE(out, new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown4Flat5Block(new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block5Alert(kind, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown5parse(_M0MPC15array5Array4joinGRPC16string10StringViewE(quote, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1421)).children)));
    } else {
      _M0MPC15array5Array4pushGsE(out, new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown4Flat5Block(new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block5Quote(_M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown5parse(_M0MPC15array5Array4joinGRPC16string10StringViewE(quote, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1422)).children)));
    }
    _M0MPC15array5Array5clearGRPC16string10StringViewE(quote);
  }
  if (!(table.length === 0)) {
    const _bind = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown12parse__table(table);
    if (_bind === undefined) {
      _M0MPC15array5Array4pushGsE(out, new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown4Flat5Block(new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block9Paragraph(_M0MPC15array5Array4joinGRPC16string10StringViewE(table, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1423))));
    } else {
      const _Some = _bind;
      const _t = _Some;
      _M0MPC15array5Array4pushGsE(out, new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown4Flat5Block(_t));
    }
    _M0MPC15array5Array5clearGRPC16string10StringViewE(table);
    return;
  } else {
    return;
  }
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scan(src) {
  const out = [];
  const para = [];
  const items = [];
  const quote = [];
  const table = [];
  const _env = { _0: out, _1: para, _2: table, _3: quote, _4: items };
  const code = [];
  let code_info = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1424;
  let in_code = false;
  const _it = _M0MPC16string6String5split(src, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1425);
  while (true) {
    const _bind = _M0MPB4Iter4nextGRPC16string10StringViewE(_it);
    if (_bind === undefined) {
      break;
    } else {
      const _Some = _bind;
      const _raw = _Some;
      const line = _M0MPC16option6Option10unwrap__orGRPB3MapGssEE(_M0MPC16string10StringView13strip__suffix(_raw, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1426), _raw);
      const trimmed = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown11trim__space(line);
      if (in_code) {
        if (_M0IPC16string10StringViewPB2Eq5equal(trimmed, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1427)) {
          _M0MPC15array5Array4pushGsE(out, new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown4Flat5Block(new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block9CodeBlock(_M0MPC15array5Array4joinGRPC16string10StringViewE(code, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1428), _M0MPC16string10StringView9to__owned(code_info))));
          _M0MPC15array5Array5clearGRPC16string10StringViewE(code);
          code_info = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1429;
          in_code = false;
        } else {
          _M0MPC15array5Array4pushGsE(code, line);
        }
        continue;
      }
      if (_M0MPC16string10StringView11has__prefix(trimmed, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1430)) {
        _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN5flushS1419(_env);
        code_info = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown11trim__space(_M0MPC16string10StringView21clamped__view_2einner(trimmed, "```".length, undefined));
        in_code = true;
      } else {
        if (_M0IPC16string10StringViewPB2Eq5equal(trimmed, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1431)) {
          _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN5flushS1419(_env);
        } else {
          if (_M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown11is__heading(trimmed)) {
            _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN5flushS1419(_env);
            _M0MPC15array5Array4pushGsE(out, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown14parse__heading(trimmed));
          } else {
            if (_M0MPC16string10StringView11has__prefix(trimmed, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1432)) {
              if (!(para.length === 0) || (!(items.length === 0) || !(quote.length === 0))) {
                _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN5flushS1419(_env);
              }
              _M0MPC15array5Array4pushGsE(table, trimmed);
            } else {
              if (_M0MPC16string10StringView11has__prefix(trimmed, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1433)) {
                if (!(para.length === 0) || (!(items.length === 0) || !(table.length === 0))) {
                  _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN5flushS1419(_env);
                }
                const _p = _M0MPC16string10StringView4find(line, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1434);
                let _tmp;
                if (_p === undefined) {
                  _tmp = $panic();
                } else {
                  const _p$2 = _p;
                  _tmp = _p$2;
                }
                const rest = _M0MPC16string10StringView21clamped__view_2einner(line, _tmp + 1 | 0, undefined);
                const _bind$2 = _M0MPC16string10StringView9to__owned(_M0MPC16option6Option10unwrap__orGRPB3MapGssEE(_M0MPC16string10StringView13strip__prefix(rest, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1435), rest));
                _M0MPC15array5Array4pushGsE(quote, new _M0TPC16string10StringView(_bind$2, 0, _bind$2.length));
              } else {
                _L: {
                  _L$2: {
                    if ((trimmed.end - trimmed.start | 0) >= 2) {
                      const _x = trimmed.str.charCodeAt(trimmed.start);
                      if (_x === 45) {
                        const _x$2 = trimmed.str.charCodeAt(trimmed.start + 1 | 0);
                        if (_x$2 === 32) {
                          const _x$3 = new _M0TPC16string10StringView(trimmed.str, trimmed.start + 2 | 0, trimmed.end);
                          if (!(para.length === 0) || (!(quote.length === 0) || !(table.length === 0))) {
                            _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN5flushS1419(_env);
                          }
                          _M0MPC15array5Array4pushGsE(items, new _M0TP46podhmo14html_2dsandbox3pkg12tinymarkdown7RawItem(_M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown6indent(line), _M0MPC16string10StringView9to__owned(_M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown11trim__space(_x$3))));
                        } else {
                          break _L$2;
                        }
                      } else {
                        break _L$2;
                      }
                    } else {
                      break _L$2;
                    }
                    break _L;
                  }
                  _L$3: {
                    _L$4: {
                      if (!(items.length === 0)) {
                        if ((line.end - line.start | 0) !== (trimmed.end - trimmed.start | 0)) {
                          _L$5: {
                            if (0 >= (line.end - line.start | 0)) {
                              $panic();
                            }
                            const _bind$2 = line.str.charCodeAt(line.start);
                            switch (_bind$2) {
                              case 32: {
                                break _L$5;
                              }
                              case 9: {
                                break _L$5;
                              }
                              default: {
                                break _L$4;
                              }
                            }
                          }
                          const _bind$2 = _M0MPC15array5Array2atGRP46podhmo14html_2dsandbox3pkg12tinymarkdown4FlatE(items, items.length - 1 | 0);
                          const _tmp = _bind$2.text;
                          const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(1);
                          _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "\n");
                          _M0MPB13StringBuilder13write__objectGRPC16string10StringViewE(_string_builder, trimmed);
                          _bind$2.text = `${_tmp}${_string_builder.val}`;
                        } else {
                          break _L$4;
                        }
                      } else {
                        break _L$4;
                      }
                      break _L$3;
                    }
                    if (!(items.length === 0) || (!(quote.length === 0) || !(table.length === 0))) {
                      _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN5flushS1419(_env);
                    }
                    _M0MPC15array5Array4pushGsE(para, trimmed);
                  }
                }
              }
            }
          }
        }
      }
      continue;
    }
  }
  if (in_code) {
    _M0MPC15array5Array4pushGsE(out, new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown4Flat5Block(new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown5Block9CodeBlock(_M0MPC15array5Array4joinGRPC16string10StringViewE(code, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN6recordS1436), _M0MPC16string10StringView9to__owned(code_info))));
  }
  _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4scanN5flushS1419(_env);
  return out;
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown10backquotes(s, i) {
  const n = s.length;
  let j = i;
  while (true) {
    let _tmp;
    if (j < n) {
      const _tmp$2 = j;
      const _p = _tmp$2 >>> 0 < s.length ? s.charCodeAt(_tmp$2) : $oob();
      const _p$2 = 96;
      _tmp = _p === _p$2;
    } else {
      _tmp = false;
    }
    if (_tmp) {
      j = j + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return j - i | 0;
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown12closing__run(s, from, n) {
  let _tmp = from;
  while (true) {
    const j = _tmp;
    if (j < s.length) {
      const _p = j >>> 0 < s.length ? s.charCodeAt(j) : $oob();
      const _p$2 = 96;
      if (_p !== _p$2) {
        _tmp = j + 1 | 0;
        continue;
      }
      const m = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown10backquotes(s, j);
      if (m === n) {
        return j;
      }
      _tmp = j + m | 0;
      continue;
    } else {
      return -1;
    }
  }
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown10code__text(s) {
  const s$2 = _M0MPC16string10StringView8contains(s, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown10code__textN6recordS1486) ? _M0MPC16string10StringView12replace__all(s, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown10code__textN6recordS1487, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown10code__textN6recordS1488) : s;
  _L: {
    _L$2: {
      if ((s$2.end - s$2.start | 0) >= 2) {
        const _x = s$2.str.charCodeAt(s$2.start);
        if (_x === 32) {
          const _x$2 = s$2.str.charCodeAt(s$2.end - 1 | 0);
          if (_x$2 === 32) {
            const _x$3 = new _M0TPC16string10StringView(s$2.str, s$2.start + 1 | 0, s$2.end - 1 | 0);
            if (_M0IP016_24default__implPB2Eq10not__equalGRPC16string10StringViewE(_M0MPC16string10StringView12trim_2einner(_x$3, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown10code__textN6recordS1489), _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown10code__textN6recordS1490)) {
              return _M0MPC16string10StringView9to__owned(_x$3);
            } else {
              break _L;
            }
          } else {
            break _L$2;
          }
        } else {
          break _L$2;
        }
      } else {
        break _L$2;
      }
    }
    break _L;
  }
  return _M0MPC16string10StringView9to__owned(s$2);
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4link(s, i) {
  let j;
  let _tmp = i + 1 | 0;
  while (true) {
    const j$2 = _tmp;
    let _tmp$2;
    if (j$2 < s.length) {
      const _p = j$2 >>> 0 < s.length ? s.charCodeAt(j$2) : $oob();
      const _p$2 = 93;
      _tmp$2 = _p !== _p$2;
    } else {
      _tmp$2 = false;
    }
    if (_tmp$2) {
      const _p = j$2 >>> 0 < s.length ? s.charCodeAt(j$2) : $oob();
      const _p$2 = 91;
      if (_p === _p$2) {
        return undefined;
      }
      const _p$3 = j$2 >>> 0 < s.length ? s.charCodeAt(j$2) : $oob();
      const _p$4 = 96;
      if (_p$3 === _p$4) {
        const n = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown10backquotes(s, j$2);
        const c = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown12closing__run(s, j$2 + n | 0, n);
        _tmp = c >= 0 ? c + n | 0 : j$2 + n | 0;
        continue;
      }
      _tmp = j$2 + 1 | 0;
      continue;
    } else {
      j = j$2;
      break;
    }
  }
  let _tmp$2;
  if ((j + 1 | 0) < s.length) {
    const _tmp$3 = j + 1 | 0;
    const _p = _tmp$3 >>> 0 < s.length ? s.charCodeAt(_tmp$3) : $oob();
    const _p$2 = 40;
    _tmp$2 = _p === _p$2;
  } else {
    _tmp$2 = false;
  }
  if (_tmp$2) {
    const label = _M0MPC16string10StringView9to__owned(_M0MPC16string6String21clamped__view_2einner(s, i + 1 | 0, j));
    let k;
    let _tmp$3 = j + 2 | 0;
    while (true) {
      const k$2 = _tmp$3;
      let _tmp$4;
      if (k$2 < s.length) {
        const _p = k$2 >>> 0 < s.length ? s.charCodeAt(k$2) : $oob();
        const _p$2 = 41;
        _tmp$4 = _p !== _p$2;
      } else {
        _tmp$4 = false;
      }
      if (_tmp$4) {
        _L: {
          _L$2: {
            const _bind = k$2 >>> 0 < s.length ? s.charCodeAt(k$2) : $oob();
            switch (_bind) {
              case 32: {
                break _L$2;
              }
              case 9: {
                break _L$2;
              }
              case 10: {
                break _L$2;
              }
              case 40: {
                break _L$2;
              }
            }
            break _L;
          }
          return undefined;
        }
        _tmp$3 = k$2 + 1 | 0;
        continue;
      } else {
        k = k$2;
        break;
      }
    }
    return k < s.length ? { _0: label, _1: _M0MPC16string10StringView9to__owned(_M0MPC16string6String21clamped__view_2einner(s, j + 2 | 0, k)), _2: k + 1 | 0 } : undefined;
  } else {
    return undefined;
  }
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown14split__inlines(s, links) {
  const out = [];
  let text = 0;
  const n = s.length;
  let i = 0;
  while (true) {
    if (i < n) {
      const _tmp = i;
      const _p = _tmp >>> 0 < s.length ? s.charCodeAt(_tmp) : $oob();
      const _p$2 = 96;
      if (_p === _p$2) {
        const m = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown10backquotes(s, i);
        const end = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown12closing__run(s, i + m | 0, m);
        if (end < 0) {
          i = i + m | 0;
          continue;
        }
        if (text < i) {
          _M0MPC15array5Array4pushGsE(out, new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown6Inline4Text(_M0MPC16string10StringView9to__owned(_M0MPC16string6String21clamped__view_2einner(s, text, i))));
        }
        _M0MPC15array5Array4pushGsE(out, new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown6Inline4Code(_M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown10code__text(_M0MPC16string6String21clamped__view_2einner(s, i + m | 0, end))));
        i = end + m | 0;
        text = i;
      } else {
        let _tmp$2;
        const _tmp$3 = i;
        const _p$3 = _tmp$3 >>> 0 < s.length ? s.charCodeAt(_tmp$3) : $oob();
        const _p$4 = 91;
        if (_p$3 === _p$4) {
          _tmp$2 = links;
        } else {
          _tmp$2 = false;
        }
        if (_tmp$2) {
          const _bind = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown4link(s, i);
          if (_bind === undefined) {
            i = i + 1 | 0;
          } else {
            const _Some = _bind;
            const _x = _Some;
            const _label = _x._0;
            const _url = _x._1;
            const _end = _x._2;
            if (text < i) {
              _M0MPC15array5Array4pushGsE(out, new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown6Inline4Text(_M0MPC16string10StringView9to__owned(_M0MPC16string6String21clamped__view_2einner(s, text, i))));
            }
            _M0MPC15array5Array4pushGsE(out, new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown6Inline4Link(_M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown14split__inlines(_label, false), _url));
            i = _end;
            text = i;
          }
        } else {
          i = i + 1 | 0;
        }
      }
      continue;
    } else {
      break;
    }
  }
  if (text < n) {
    _M0MPC15array5Array4pushGsE(out, new _M0DTP46podhmo14html_2dsandbox3pkg12tinymarkdown6Inline4Text(_M0MPC16string10StringView9to__owned(_M0MPC16string6String21clamped__view_2einner(s, text, undefined))));
  }
  return out;
}
function _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown7inlines(s) {
  return _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown14split__inlines(s, true);
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site11plain__textN4walkS1548(sb, ins) {
  const _bind = ins.length;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const i = ins[_];
      let t;
      _L: {
        _L$2: {
          switch (i.$tag) {
            case 0: {
              const _Text = i;
              const _t = _Text._0;
              t = _t;
              break _L$2;
            }
            case 1: {
              const _Code = i;
              const _t$2 = _Code._0;
              t = _t$2;
              break _L$2;
            }
            default: {
              const _Link = i;
              const _children = _Link._0;
              _M0FP56podhmo14html_2dsandbox8examples4blog4site11plain__textN4walkS1548(sb, _children);
            }
          }
          break _L;
        }
        _M0IPB13StringBuilderPB6Logger13write__string(sb, t);
      }
      _tmp = _ + 1 | 0;
      continue;
    } else {
      return;
    }
  }
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site11plain__text(s) {
  const sb = _M0MPB13StringBuilder21StringBuilder_2einner(0);
  _M0FP56podhmo14html_2dsandbox8examples4blog4site11plain__textN4walkS1548(sb, _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown7inlines(s));
  return sb.val;
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site15render__inlines(ins, link) {
  const out = [];
  const _bind = ins.length;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const i = ins[_];
      switch (i.$tag) {
        case 0: {
          const _Text = i;
          const _t = _Text._0;
          _M0MPC15array5Array4pushGsE(out, new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node4Text(_t));
          break;
        }
        case 1: {
          const _Code = i;
          const _t$2 = _Code._0;
          _M0MPC15array5Array4pushGsE(out, _M0FP46podhmo14html_2dsandbox3pkg6picoel4code(_t$2));
          break;
        }
        default: {
          const _Link = i;
          const _children = _Link._0;
          const _url = _Link._1;
          const children = _M0FP56podhmo14html_2dsandbox8examples4blog4site15render__inlines(_children, link);
          const _bind$2 = link(_url);
          if (_bind$2 === undefined) {
            _M0MPC15array5Array10push__iterGRP46podhmo14html_2dsandbox3pkg2el4NodeE(out, _M0MPC15array5Array4iterGRP46podhmo14html_2dsandbox3pkg2el4NodeE(children));
          } else {
            const _Some = _bind$2;
            const _href = _Some;
            _M0MPC15array5Array4pushGsE(out, _M0FP46podhmo14html_2dsandbox3pkg6picoel1a(_href, children));
          }
        }
      }
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return out;
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site12first__title(doc) {
  const _bind = doc.children;
  const _bind$2 = _bind.length;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind$2) {
      const b = _bind[_];
      if (b.$tag === 0) {
        const _Section = b;
        const _x = _Section._0;
        if (_x === 1) {
          const _title = _Section._1;
          return _title;
        }
      }
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return undefined;
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site9permalink(id) {
  const _tmp = new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node4Attr(_M0FP46podhmo14html_2dsandbox3pkg2el5class, "heading-permalink");
  const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(1);
  _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "#");
  _M0MPB13StringBuilder13write__objectGsE(_string_builder, id);
  const _p = [_tmp, new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node4Attr(_M0FP46podhmo14html_2dsandbox3pkg2el4href, _string_builder.val), new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node4Attr("aria-label", "permalink"), _M0FP56podhmo14html_2dsandbox8examples4blog4site9permalinkN6constrS1592];
  return new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(_M0FP46podhmo14html_2dsandbox3pkg2el1a, _p);
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site7heading(level, id, children) {
  let tag;
  switch (level) {
    case 1: {
      tag = _M0FP46podhmo14html_2dsandbox3pkg2el2h1;
      break;
    }
    case 2: {
      tag = _M0FP46podhmo14html_2dsandbox3pkg2el2h2;
      break;
    }
    case 3: {
      tag = _M0FP46podhmo14html_2dsandbox3pkg2el2h3;
      break;
    }
    case 4: {
      tag = _M0FP46podhmo14html_2dsandbox3pkg2el2h4;
      break;
    }
    default: {
      tag = _M0FP46podhmo14html_2dsandbox3pkg2el2h5;
    }
  }
  const _self = [];
  _M0MPC15array5Array4pushGsE(_self, new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node4Attr(_M0FP46podhmo14html_2dsandbox3pkg2el2id, id));
  _M0MPC15array5Array10push__iterGRP46podhmo14html_2dsandbox3pkg2el4NodeE(_self, _M0MPC15array5Array4iterGRP46podhmo14html_2dsandbox3pkg2el4NodeE(children));
  _M0MPC15array5Array4pushGsE(_self, _M0FP56podhmo14html_2dsandbox8examples4blog4site9permalink(id));
  const _p = _self;
  return new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(tag, _p);
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site12alert__title(kind) {
  switch (kind) {
    case "note": {
      return "Note";
    }
    case "tip": {
      return "Tip";
    }
    case "important": {
      return "Important";
    }
    case "warning": {
      return "Warning";
    }
    default: {
      return "Caution";
    }
  }
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site12render__list(items, link) {
  const _p = new Array(items.length);
  const _p$2 = items.length;
  let _tmp = 0;
  while (true) {
    const _p$3 = _tmp;
    if (_p$3 < _p$2) {
      const _p$4 = items[_p$3];
      const _p$5 = _M0FP56podhmo14html_2dsandbox8examples4blog4site15render__inlines(_M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown7inlines(_p$4.text), link);
      const _p$6 = _p$4.children;
      if (!(_p$6.length === 0)) {
        _M0MPC15array5Array4pushGsE(_p$5, _M0FP56podhmo14html_2dsandbox8examples4blog4site12render__list(_p$4.children, link));
      }
      _p[_p$3] = _M0FP46podhmo14html_2dsandbox3pkg6picoel2li(_p$5);
      _tmp = _p$3 + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return _M0FP46podhmo14html_2dsandbox3pkg6picoel4list(_p);
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site8in__drop(c) {
  const _bind = _M0FP56podhmo14html_2dsandbox8examples4blog4site11drop__chars.length;
  let _tmp = 0;
  while (true) {
    const _string_index = _tmp;
    if (_string_index < _bind) {
      let _decoded_next_string_index;
      let _decoded_char;
      _L: {
        const _bind$2 = _M0FP56podhmo14html_2dsandbox8examples4blog4site11drop__chars.charCodeAt(_string_index);
        if (_bind$2 >= 55296 && _bind$2 <= 56319 && (_string_index + 1 | 0) < _bind) {
          const _bind$3 = _M0FP56podhmo14html_2dsandbox8examples4blog4site11drop__chars.charCodeAt(_string_index + 1 | 0);
          if (_bind$3 >= 56320 && _bind$3 <= 57343) {
            const _tmp$2 = _string_index + 2 | 0;
            const _p = (((Math.imul(_bind$2 - 55296 | 0, 1024) | 0) + _bind$3 | 0) - 56320 | 0) + 65536 | 0;
            _decoded_next_string_index = _tmp$2;
            _decoded_char = _p;
            break _L;
          } else {
            const _tmp$2 = _string_index + 1 | 0;
            const _p = _bind$2;
            _decoded_next_string_index = _tmp$2;
            _decoded_char = _p;
            break _L;
          }
        } else {
          const _tmp$2 = _string_index + 1 | 0;
          const _p = _bind$2;
          _decoded_next_string_index = _tmp$2;
          _decoded_char = _p;
          break _L;
        }
      }
      if (_decoded_char === c) {
        return true;
      }
      _tmp = _decoded_next_string_index;
      continue;
    } else {
      break;
    }
  }
  const i = c;
  const _bind$2 = _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__ranges.length;
  let _tmp$2 = 0;
  while (true) {
    const _ = _tmp$2;
    if (_ < _bind$2) {
      const r = _M0FP56podhmo14html_2dsandbox8examples4blog4site12drop__ranges[_];
      const _lo = r._0;
      const _hi = r._1;
      if (_lo <= i && i < _hi) {
        return true;
      }
      _tmp$2 = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return false;
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site17is__ascii__keeper(c) {
  return c === 45 || (c === 95 || (48 <= c && c <= 57 || (97 <= c && c <= 122 || 65 <= c && c <= 90)));
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site9to__lower(c) {
  const i = c;
  return 65 <= c && c <= 90 ? i + (97 - 65 | 0) | 0 : 65313 <= c && c <= 65338 ? i + (65345 - 65313 | 0) | 0 : c;
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site7slugify(title) {
  const sb = _M0MPB13StringBuilder21StringBuilder_2einner(0);
  const _it = _M0MPC16string6String4iter(title);
  while (true) {
    const _bind = _M0MPB4Iter4nextGcE(_it);
    if (_bind === -1) {
      break;
    } else {
      const _Some = _bind;
      const _c = _Some;
      if (_M0MPC14char4Char14is__whitespace(_c)) {
        _M0IPB13StringBuilderPB6Logger11write__char(sb, 45);
      } else {
        if (_M0FP56podhmo14html_2dsandbox8examples4blog4site17is__ascii__keeper(_c)) {
          _M0IPB13StringBuilderPB6Logger11write__char(sb, _M0FP56podhmo14html_2dsandbox8examples4blog4site9to__lower(_c));
        } else {
          if (!_M0MPC14char4Char9is__ascii(_c) && !_M0FP56podhmo14html_2dsandbox8examples4blog4site8in__drop(_c)) {
            _M0IPB13StringBuilderPB6Logger11write__char(sb, _M0FP56podhmo14html_2dsandbox8examples4blog4site9to__lower(_c));
          }
        }
      }
      continue;
    }
  }
  return sb.val;
}
function _M0MP56podhmo14html_2dsandbox8examples4blog4site9AnchorIds2id(self, title) {
  let base = _M0FP56podhmo14html_2dsandbox8examples4blog4site7slugify(title);
  if (base === "") {
    base = "sec";
  }
  let id = base;
  while (true) {
    if (_M0MPB3Map8containsGsiE(self.seen, id)) {
      const n = _M0MPC16option6Option10unwrap__orGiE(_M0MPB3Map3getGsiE(self.seen, base), 0) + 1 | 0;
      _M0MPB3Map3setGsiE(self.seen, base, n);
      const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(1);
      _M0MPB13StringBuilder13write__objectGsE(_string_builder, base);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "-");
      _M0MPB13StringBuilder13write__objectGiE(_string_builder, n);
      id = _string_builder.val;
      continue;
    } else {
      break;
    }
  }
  _M0MPB3Map3setGsiE(self.seen, id, 0);
  return id;
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site14render__blocksN7inlinesS1638(link, s) {
  return _M0FP56podhmo14html_2dsandbox8examples4blog4site15render__inlines(_M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown7inlines(s), link);
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site14render__blocksN5cellsS1639(link, row) {
  const _acc = [];
  const _bind = row.length;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const c = row[_];
      _M0MPC15array5Array4pushGRPB5ArrayGRPB5ArrayGRP46podhmo14html_2dsandbox3pkg2el4NodeEEE(_acc, _M0FP56podhmo14html_2dsandbox8examples4blog4site14render__blocksN7inlinesS1638(link, c));
      _tmp = _ + 1 | 0;
      continue;
    } else {
      return _acc;
    }
  }
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site14render__blocks(bs, link, gen) {
  const _p = new Array(bs.length);
  const _p$2 = bs.length;
  let _tmp = 0;
  while (true) {
    const _p$3 = _tmp;
    if (_p$3 < _p$2) {
      const _p$4 = bs[_p$3];
      let _tmp$2;
      switch (_p$4.$tag) {
        case 0: {
          const _p$5 = _p$4;
          const _p$6 = _p$5._0;
          const _p$7 = _p$5._1;
          const _p$8 = _p$5._2;
          const _p$9 = _M0MP56podhmo14html_2dsandbox8examples4blog4site9AnchorIds2id(gen, _M0FP56podhmo14html_2dsandbox8examples4blog4site11plain__text(_p$7));
          const _p$10 = [];
          _M0MPC15array5Array4pushGsE(_p$10, _M0FP56podhmo14html_2dsandbox8examples4blog4site7heading(_p$6, _p$9, _M0FP56podhmo14html_2dsandbox8examples4blog4site14render__blocksN7inlinesS1638(link, _p$7)));
          _M0MPC15array5Array10push__iterGRP46podhmo14html_2dsandbox3pkg2el4NodeE(_p$10, _M0MPC15array5Array4iterGRP46podhmo14html_2dsandbox3pkg2el4NodeE(_M0FP56podhmo14html_2dsandbox8examples4blog4site14render__blocks(_p$8, link, gen)));
          _tmp$2 = _M0FP46podhmo14html_2dsandbox3pkg6picoel7section(_p$10);
          break;
        }
        case 1: {
          const _p$11 = _p$4;
          const _p$12 = _p$11._0;
          _tmp$2 = _M0FP46podhmo14html_2dsandbox3pkg6picoel1p(_M0FP56podhmo14html_2dsandbox8examples4blog4site14render__blocksN7inlinesS1638(link, _p$12));
          break;
        }
        case 2: {
          const _p$13 = _p$4;
          const _p$14 = _p$13._0;
          _tmp$2 = _M0FP56podhmo14html_2dsandbox8examples4blog4site12render__list(_p$14, link);
          break;
        }
        case 3: {
          const _p$15 = _p$4;
          const _p$16 = _p$15._0;
          _tmp$2 = _M0FP46podhmo14html_2dsandbox3pkg6picoel10blockquote(_M0FP56podhmo14html_2dsandbox8examples4blog4site14render__blocks(_p$16, link, gen));
          break;
        }
        case 4: {
          const _p$17 = _p$4;
          const _p$18 = _p$17._0;
          const _p$19 = _p$17._1;
          const _p$20 = [];
          const _p$21 = _M0MPB13StringBuilder21StringBuilder_2einner(30);
          _M0IPB13StringBuilderPB6Logger13write__string(_p$21, "markdown-alert markdown-alert-");
          _M0MPB13StringBuilder13write__objectGsE(_p$21, _p$18);
          _M0MPC15array5Array4pushGsE(_p$20, new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node4Attr(_M0FP46podhmo14html_2dsandbox3pkg2el5class, _p$21.val));
          const _tmp$3 = new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node4Attr(_M0FP46podhmo14html_2dsandbox3pkg2el5class, "markdown-alert-title");
          const _p$22 = _M0FP56podhmo14html_2dsandbox8examples4blog4site12alert__title(_p$18);
          const _p$23 = [_tmp$3, new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node4Text(_p$22)];
          _M0MPC15array5Array4pushGsE(_p$20, new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(_M0FP46podhmo14html_2dsandbox3pkg2el1p, _p$23));
          _M0MPC15array5Array10push__iterGRP46podhmo14html_2dsandbox3pkg2el4NodeE(_p$20, _M0MPC15array5Array4iterGRP46podhmo14html_2dsandbox3pkg2el4NodeE(_M0FP56podhmo14html_2dsandbox8examples4blog4site14render__blocks(_p$19, link, gen)));
          const _p$24 = _p$20;
          _tmp$2 = new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node7Element(_M0FP46podhmo14html_2dsandbox3pkg2el10blockquote, _p$24);
          break;
        }
        case 5: {
          const _p$25 = _p$4;
          const _p$26 = _p$25._0;
          const _p$27 = _p$25._1;
          const _tmp$4 = _M0FP56podhmo14html_2dsandbox8examples4blog4site14render__blocksN5cellsS1639(link, _p$26);
          const _p$28 = [];
          const _p$29 = _p$27.length;
          let _tmp$5;
          let _tmp$6 = 0;
          while (true) {
            const _p$30 = _tmp$6;
            if (_p$30 < _p$29) {
              const _p$31 = _p$27[_p$30];
              _M0MPC15array5Array4pushGRPB5ArrayGRPB5ArrayGRP46podhmo14html_2dsandbox3pkg2el4NodeEEE(_p$28, _M0FP56podhmo14html_2dsandbox8examples4blog4site14render__blocksN5cellsS1639(link, _p$31));
              _tmp$6 = _p$30 + 1 | 0;
              continue;
            } else {
              _tmp$5 = _p$28;
              break;
            }
          }
          _tmp$2 = _M0FP46podhmo14html_2dsandbox3pkg6picoel5table(_tmp$4, _tmp$5);
          break;
        }
        default: {
          const _p$30 = _p$4;
          const _p$31 = _p$30._0;
          const _p$32 = _p$30._1;
          _tmp$2 = _p$32 === "svg" ? new _M0DTP46podhmo14html_2dsandbox3pkg2el4Node3Raw(_p$31) : _M0FP46podhmo14html_2dsandbox3pkg6picoel3pre(_p$31);
        }
      }
      _p[_p$3] = _tmp$2;
      _tmp = _p$3 + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return _p;
}
function _M0MP56podhmo14html_2dsandbox8examples4blog4site9AnchorIds3new() {
  const _bind = [];
  return new _M0TP56podhmo14html_2dsandbox8examples4blog4site9AnchorIds(_M0MPB3Map3MapGsiE(new _M0TPB9ArrayViewGUsiEE(_bind, 0, 0), undefined));
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site5clean(p) {
  if (p === "") {
    return ".";
  }
  const rooted = _M0MPC16string6String11has__prefix(p, _M0FP56podhmo14html_2dsandbox8examples4blog4site5cleanN6recordS1682);
  const out = [];
  const _it = _M0MPC16string6String5split(p, _M0FP56podhmo14html_2dsandbox8examples4blog4site5cleanN6recordS1683);
  while (true) {
    const _bind = _M0MPB4Iter4nextGRPC16string10StringViewE(_it);
    if (_bind === undefined) {
      break;
    } else {
      const _Some = _bind;
      const _elem = _Some;
      _L: {
        _L$2: {
          if ((_elem.end - _elem.start | 0) === 0) {
          } else {
            if ((_elem.end - _elem.start | 0) === 1) {
              const _x = _elem.str.charCodeAt(_elem.start);
              if (_x === 46) {
              } else {
                break _L$2;
              }
            } else {
              if ((_elem.end - _elem.start | 0) === 2) {
                const _x = _elem.str.charCodeAt(_elem.start);
                if (_x === 46) {
                  const _x$2 = _elem.str.charCodeAt(_elem.start + 1 | 0);
                  if (_x$2 === 46) {
                    _L$3: {
                      _L$4: {
                        if (out.length >= 1) {
                          const _last = out[out.length - 1 | 0];
                          if (_M0IP016_24default__implPB2Eq10not__equalGRPC16string10StringViewE(_last, _M0FP56podhmo14html_2dsandbox8examples4blog4site5cleanN6recordS1684)) {
                            _M0MPC15array5Array3popGRPC16string10StringViewE(out);
                          } else {
                            break _L$4;
                          }
                        } else {
                          break _L$4;
                        }
                        break _L$3;
                      }
                      if (!rooted) {
                        _M0MPC15array5Array4pushGsE(out, _elem);
                      }
                    }
                  } else {
                    break _L$2;
                  }
                } else {
                  break _L$2;
                }
              } else {
                break _L$2;
              }
            }
          }
          break _L;
        }
        _M0MPC15array5Array4pushGsE(out, _elem);
      }
      continue;
    }
  }
  const _p = new Array(out.length);
  const _p$2 = out.length;
  let _tmp = 0;
  while (true) {
    const _p$3 = _tmp;
    if (_p$3 < _p$2) {
      const _p$4 = out[_p$3];
      _p[_p$3] = _M0MPC16string10StringView9to__owned(_p$4);
      _tmp = _p$3 + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const joined = _M0MPC15array5Array4joinGsE(_p, _M0FP56podhmo14html_2dsandbox8examples4blog4site5cleanN6recordS1685);
  if (rooted) {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(1);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "/");
    _M0MPB13StringBuilder13write__objectGsE(_string_builder, joined);
    return _string_builder.val;
  } else {
    return joined === "" ? "." : joined;
  }
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site3dir(p) {
  const _bind = _M0MPC16string6String9rev__find(p, _M0FP56podhmo14html_2dsandbox8examples4blog4site3dirN6recordS1703);
  if (_bind === undefined) {
    return ".";
  } else {
    const _Some = _bind;
    const _i = _Some;
    return _M0FP56podhmo14html_2dsandbox8examples4blog4site5clean(_M0MPC16string10StringView9to__owned(_M0MPC16string6String21clamped__view_2einner(p, 0, _i + 1 | 0)));
  }
}
function _M0EPB13StringBuilderP56podhmo14html_2dsandbox8examples4blog4site23write__percent__encoded(self, b) {
  _M0IPB13StringBuilderPB6Logger13write__string(self, "%");
  const _p = b >> 4;
  _M0MPB13StringBuilder13write__objectGcE(self, _p >>> 0 < _M0FP56podhmo14html_2dsandbox8examples4blog4site11hex__digits.length ? _M0FP56podhmo14html_2dsandbox8examples4blog4site11hex__digits[_p] : $oob());
  const _p$2 = b & 15;
  _M0MPB13StringBuilder13write__objectGcE(self, _p$2 >>> 0 < _M0FP56podhmo14html_2dsandbox8examples4blog4site11hex__digits.length ? _M0FP56podhmo14html_2dsandbox8examples4blog4site11hex__digits[_p$2] : $oob());
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site6escape(s, fragment) {
  const sb = _M0MPB13StringBuilder21StringBuilder_2einner(0);
  const _bind = _M0FPC28encoding4utf814encode_2einner(new _M0TPC16string10StringView(s, 0, s.length), false);
  const _bind$2 = _bind.length;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind$2) {
      const b = _bind[_];
      const c = b;
      let keep;
      _L: {
        _L$2: {
          if (c >= 97 && c <= 122) {
            keep = true;
          } else {
            if (c >= 65 && c <= 90) {
              keep = true;
            } else {
              if (c >= 48 && c <= 57) {
                keep = true;
              } else {
                if (c === 45) {
                  keep = true;
                } else {
                  if (c === 95) {
                    keep = true;
                  } else {
                    if (c === 46) {
                      keep = true;
                    } else {
                      if (c === 126) {
                        keep = true;
                      } else {
                        if (c === 36) {
                          keep = true;
                        } else {
                          if (c === 38) {
                            keep = true;
                          } else {
                            if (c === 43) {
                              keep = true;
                            } else {
                              if (c === 44) {
                                keep = true;
                              } else {
                                if (c === 47) {
                                  keep = true;
                                } else {
                                  if (c === 58) {
                                    keep = true;
                                  } else {
                                    if (c === 59) {
                                      keep = true;
                                    } else {
                                      if (c === 61) {
                                        keep = true;
                                      } else {
                                        if (c === 64) {
                                          keep = true;
                                        } else {
                                          if (c === 63) {
                                            break _L$2;
                                          } else {
                                            if (c === 33) {
                                              break _L$2;
                                            } else {
                                              if (c === 40) {
                                                break _L$2;
                                              } else {
                                                if (c === 41) {
                                                  break _L$2;
                                                } else {
                                                  if (c === 42) {
                                                    break _L$2;
                                                  } else {
                                                    keep = false;
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          break _L;
        }
        keep = fragment;
      }
      if (keep) {
        _M0IPB13StringBuilderPB6Logger11write__char(sb, c);
      } else {
        _M0EPB13StringBuilderP56podhmo14html_2dsandbox8examples4blog4site23write__percent__encoded(sb, b);
      }
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return sb.val;
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site4join(elems) {
  const _p = [];
  const _p$2 = elems.length;
  let _tmp = 0;
  while (true) {
    const _p$3 = _tmp;
    if (_p$3 < _p$2) {
      const _p$4 = elems[_p$3];
      const _p$5 = "";
      if (!(_p$4 === _p$5)) {
        _M0MPC15array5Array4pushGsE(_p, _p$4);
      }
      _tmp = _p$3 + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const parts = _p;
  return parts.length === 0 ? "" : _M0FP56podhmo14html_2dsandbox8examples4blog4site5clean(_M0MPC15array5Array4joinGsE(parts, _M0FP56podhmo14html_2dsandbox8examples4blog4site4joinN6recordS1721));
}
function _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parse(raw) {
  const _p = _M0MPC16string6String4iter(raw);
  let _tmp;
  while (true) {
    const _p$2 = _M0MPB4Iter4nextGcE(_p);
    if (_p$2 === -1) {
      _tmp = false;
      break;
    } else {
      const _p$3 = _p$2;
      const _p$4 = _p$3;
      if (_p$4 < 32 || _p$4 === 127) {
        _tmp = true;
        break;
      }
      continue;
    }
  }
  if (_tmp) {
    return undefined;
  }
  let rest;
  let fragment;
  _L: {
    const _bind = _M0MPC16string6String4find(raw, _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parseN6recordS1732);
    if (_bind === undefined) {
      rest = new _M0TPC16string10StringView(raw, 0, raw.length);
      fragment = _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parseN6constrS1733;
      break _L;
    } else {
      const _Some = _bind;
      const _i = _Some;
      rest = _M0MPC16string6String21clamped__view_2einner(raw, 0, _i);
      fragment = _M0FP46podhmo14html_2dsandbox3pkg4http16unescape_2einner(_M0MPC16string6String21clamped__view_2einner(raw, _i + 1 | 0, undefined), false);
      break _L;
    }
  }
  if (fragment === undefined) {
    return undefined;
  } else {
    const _Some = fragment;
    const _fragment = _Some;
    let scheme;
    let rest$2;
    _L$2: {
      const _bind = rest.str;
      const _bind$2 = rest.start;
      const _bind$3 = rest.end;
      let _tmp$2 = _bind$2;
      let _tmp$3 = 0;
      while (true) {
        const _string_index = _tmp$2;
        const i = _tmp$3;
        if (_string_index < _bind$3) {
          let _decoded_next_string_index;
          let _decoded_char;
          _L$3: {
            const _bind$4 = _bind.charCodeAt(_string_index);
            if (_bind$4 >= 55296 && _bind$4 <= 56319 && (_string_index + 1 | 0) < _bind$3) {
              const _bind$5 = _bind.charCodeAt(_string_index + 1 | 0);
              if (_bind$5 >= 56320 && _bind$5 <= 57343) {
                const _tmp$4 = _string_index + 2 | 0;
                const _p$2 = (((Math.imul(_bind$4 - 55296 | 0, 1024) | 0) + _bind$5 | 0) - 56320 | 0) + 65536 | 0;
                _decoded_next_string_index = _tmp$4;
                _decoded_char = _p$2;
                break _L$3;
              } else {
                const _tmp$4 = _string_index + 1 | 0;
                const _p$2 = _bind$4;
                _decoded_next_string_index = _tmp$4;
                _decoded_char = _p$2;
                break _L$3;
              }
            } else {
              const _tmp$4 = _string_index + 1 | 0;
              const _p$2 = _bind$4;
              _decoded_next_string_index = _tmp$4;
              _decoded_char = _p$2;
              break _L$3;
            }
          }
          const _next_char_index = i + 1 | 0;
          _L$4: {
            _L$5: {
              _L$6: {
                _L$7: {
                  if (_decoded_char >= 97 && _decoded_char <= 122) {
                    break _L$7;
                  } else {
                    if (_decoded_char >= 65 && _decoded_char <= 90) {
                      break _L$7;
                    } else {
                      if (_decoded_char >= 48 && _decoded_char <= 57) {
                        if (i > 0) {
                          break _L$6;
                        } else {
                          break _L$5;
                        }
                      } else {
                        if (_decoded_char === 43) {
                          if (i > 0) {
                            break _L$6;
                          } else {
                            break _L$5;
                          }
                        } else {
                          if (_decoded_char === 45) {
                            if (i > 0) {
                              break _L$6;
                            } else {
                              break _L$5;
                            }
                          } else {
                            if (_decoded_char === 46) {
                              if (i > 0) {
                                break _L$6;
                              } else {
                                break _L$5;
                              }
                            } else {
                              if (_decoded_char === 58) {
                                if (i === 0) {
                                  return undefined;
                                } else {
                                  scheme = _M0MPC16string10StringView9to__owned(_M0MPC16string10StringView9to__lower(_M0MPC16string10StringView21clamped__view_2einner(rest, 0, i)));
                                  rest$2 = _M0MPC16string10StringView21clamped__view_2einner(rest, i + 1 | 0, undefined);
                                  break _L$2;
                                }
                              } else {
                                break _L$5;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
                break _L$4;
              }
              break _L$4;
            }
            scheme = "";
            rest$2 = rest;
            break _L$2;
          }
          _tmp$2 = _decoded_next_string_index;
          _tmp$3 = _next_char_index;
          continue;
        } else {
          scheme = "";
          rest$2 = rest;
          break _L$2;
        }
      }
    }
    let rest$3;
    let raw_query;
    _L$3: {
      const _bind = _M0MPC16string10StringView4find(rest$2, _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parseN6recordS1731);
      if (_bind === undefined) {
        rest$3 = rest$2;
        raw_query = "";
        break _L$3;
      } else {
        const _Some$2 = _bind;
        const _i = _Some$2;
        rest$3 = _M0MPC16string10StringView21clamped__view_2einner(rest$2, 0, _i);
        raw_query = _M0MPC16string10StringView9to__owned(_M0MPC16string10StringView21clamped__view_2einner(rest$2, _i + 1 | 0, undefined));
        break _L$3;
      }
    }
    if (!_M0MPC16string10StringView11has__prefix(rest$3, _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parseN6recordS1725)) {
      const _p$2 = "";
      if (!(scheme === _p$2)) {
        return new _M0TP56podhmo14html_2dsandbox8examples4blog4site3Ref(scheme, "", raw_query, _fragment);
      }
      const _bind = _M0MPC16string10StringView4find(rest$3, _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parseN6recordS1726);
      let segment;
      if (_bind === undefined) {
        segment = rest$3;
      } else {
        const _Some$2 = _bind;
        const _i = _Some$2;
        segment = _M0MPC16string10StringView21clamped__view_2einner(rest$3, 0, _i);
      }
      if (_M0MPC16string10StringView8contains(segment, _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parseN6recordS1727)) {
        return undefined;
      }
    }
    let rest$4;
    _L$4: {
      _L$5: {
        _L$6: {
          _L$7: {
            if ((rest$3.end - rest$3.start | 0) >= 2) {
              const _x = rest$3.str.charCodeAt(rest$3.start);
              if (_x === 47) {
                const _x$2 = rest$3.str.charCodeAt(rest$3.start + 1 | 0);
                if (_x$2 === 47) {
                  const _x$3 = new _M0TPC16string10StringView(rest$3.str, rest$3.start + 2 | 0, rest$3.end);
                  _L$8: {
                    const _p$2 = "";
                    if (!(scheme === _p$2)) {
                      break _L$8;
                    } else {
                      if (!_M0MPC16string10StringView11has__prefix(_x$3, _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parseN6recordS1730)) {
                        break _L$8;
                      } else {
                        break _L$5;
                      }
                    }
                  }
                  const _bind = _M0MPC16string10StringView4find(_x$3, _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parseN6recordS1728);
                  if (_bind === undefined) {
                    rest$4 = _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parseN6recordS1729;
                  } else {
                    const _Some$2 = _bind;
                    const _i = _Some$2;
                    rest$4 = _M0MPC16string10StringView21clamped__view_2einner(_x$3, _i, undefined);
                  }
                } else {
                  break _L$7;
                }
              } else {
                break _L$7;
              }
            } else {
              break _L$7;
            }
            break _L$6;
          }
          break _L$5;
        }
        break _L$4;
      }
      rest$4 = rest$3;
    }
    const _bind = _M0FP46podhmo14html_2dsandbox3pkg4http16unescape_2einner(rest$4, false);
    if (_bind === undefined) {
      return undefined;
    } else {
      const _Some$2 = _bind;
      const _path = _Some$2;
      return new _M0TP56podhmo14html_2dsandbox8examples4blog4site3Ref(scheme, _path, raw_query, _fragment);
    }
  }
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site7resolve(page_url, source, repo_files) {
  return (raw) => {
    const _bind = _M0MP56podhmo14html_2dsandbox8examples4blog4site3Ref5parse(raw);
    if (_bind === undefined) {
      return undefined;
    } else {
      const _Some = _bind;
      const _u = _Some;
      const _p = _u.scheme;
      const _p$2 = "";
      if (!(_p === _p$2)) {
        let _tmp;
        _L: {
          _L$2: {
            const _bind$2 = _u.scheme;
            switch (_bind$2) {
              case "http": {
                break _L$2;
              }
              case "https": {
                break _L$2;
              }
              case "mailto": {
                break _L$2;
              }
              default: {
                _tmp = undefined;
              }
            }
            break _L;
          }
          _tmp = raw;
        }
        return _tmp;
      }
      _L: {
        _L$2: {
          if (raw === "") {
            break _L$2;
          } else {
            if (raw.length >= 1) {
              const _x = raw.charCodeAt(0);
              switch (_x) {
                case 47: {
                  break _L$2;
                }
                case 35: {
                  break _L$2;
                }
              }
            }
          }
          break _L;
        }
        return raw;
      }
      const p = _M0FP56podhmo14html_2dsandbox8examples4blog4site4join([_M0FP56podhmo14html_2dsandbox8examples4blog4site3dir(source), _u.path]);
      if (p === ".." || _M0MPC16string6String11has__prefix(p, _M0FP56podhmo14html_2dsandbox8examples4blog4site7resolveN6recordS1786)) {
        return undefined;
      }
      const _bind$2 = page_url(p);
      let href;
      if (_bind$2 === undefined) {
        if (repo_files) {
          const path = _M0FP56podhmo14html_2dsandbox8examples4blog4site4join(["/podhmo/html-sandbox/blob/main", p]);
          let query;
          const _p$3 = _u.raw_query;
          const _p$4 = "";
          if (!(_p$3 === _p$4)) {
            const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(1);
            _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "?");
            _M0MPB13StringBuilder13write__objectGsE(_string_builder, _u.raw_query);
            query = _string_builder.val;
          } else {
            query = "";
          }
          const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(8);
          _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "https://");
          _M0MPB13StringBuilder13write__objectGsE(_string_builder, "github.com");
          _M0MPB13StringBuilder13write__objectGsE(_string_builder, _M0FP56podhmo14html_2dsandbox8examples4blog4site6escape(path, false));
          _M0MPB13StringBuilder13write__objectGsE(_string_builder, query);
          href = _string_builder.val;
        } else {
          return undefined;
        }
      } else {
        const _Some$2 = _bind$2;
        href = _Some$2;
      }
      let fragment;
      const _p$3 = _u.fragment;
      const _p$4 = "";
      if (!(_p$3 === _p$4)) {
        const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(1);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "#");
        _M0MPB13StringBuilder13write__objectGsE(_string_builder, _M0FP56podhmo14html_2dsandbox8examples4blog4site6escape(_u.fragment, true));
        fragment = _string_builder.val;
      } else {
        fragment = "";
      }
      const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(0);
      _M0MPB13StringBuilder13write__objectGsE(_string_builder, href);
      _M0MPB13StringBuilder13write__objectGsE(_string_builder, fragment);
      return _string_builder.val;
    }
  };
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site9doc__path(source) {
  const p = _M0MPC16option6Option10unwrap__orGRPB3MapGssEE(_M0MPC16string6String13strip__suffix(source, _M0FP56podhmo14html_2dsandbox8examples4blog4site9doc__pathN6recordS1809), new _M0TPC16string10StringView(source, 0, source.length));
  return _M0MPC16string10StringView9to__owned(_M0MPC16option6Option10unwrap__orGRPB3MapGssEE(_M0MPC16string10StringView13strip__prefix(p, _M0FP56podhmo14html_2dsandbox8examples4blog4site9doc__pathN6recordS1810), p));
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site7is__doc(source) {
  if (_M0MPC15array13ReadOnlyArray8containsGsE(_M0FP56podhmo14html_2dsandbox8examples4blog4site12doc__sources, source)) {
    return true;
  } else {
    const _p = _M0MPC15array13ReadOnlyArray4iterGsE(_M0FP56podhmo14html_2dsandbox8examples4blog4site12doc__sources);
    let _tmp;
    while (true) {
      const _p$2 = _M0MPB4Iter4nextGRPC16string10StringViewE(_p);
      if (_p$2 === undefined) {
        _tmp = false;
        break;
      } else {
        const _p$3 = _p$2;
        const _p$4 = _p$3;
        const _p$5 = _M0MPB13StringBuilder21StringBuilder_2einner(1);
        _M0MPB13StringBuilder13write__objectGsE(_p$5, _p$4);
        _M0IPB13StringBuilderPB6Logger13write__string(_p$5, "/");
        const _p$6 = _p$5.val;
        if (_M0MPC16string6String11has__prefix(source, new _M0TPC16string10StringView(_p$6, 0, _p$6.length))) {
          _tmp = true;
          break;
        }
        continue;
      }
    }
    return _tmp;
  }
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site10post__name(name) {
  _L: {
    if (name.length >= 14) {
      const _x = name.charCodeAt(0);
      if (_x >= 48 && _x <= 57) {
        const _x$2 = name.charCodeAt(1);
        if (_x$2 >= 48 && _x$2 <= 57) {
          const _x$3 = name.charCodeAt(2);
          if (_x$3 >= 48 && _x$3 <= 57) {
            const _x$4 = name.charCodeAt(3);
            if (_x$4 >= 48 && _x$4 <= 57) {
              const _x$5 = name.charCodeAt(4);
              if (_x$5 === 45) {
                const _x$6 = name.charCodeAt(5);
                if (_x$6 >= 48 && _x$6 <= 57) {
                  const _x$7 = name.charCodeAt(6);
                  if (_x$7 >= 48 && _x$7 <= 57) {
                    const _x$8 = name.charCodeAt(7);
                    if (_x$8 === 45) {
                      const _x$9 = name.charCodeAt(8);
                      if (_x$9 >= 48 && _x$9 <= 57) {
                        const _x$10 = name.charCodeAt(9);
                        if (_x$10 >= 48 && _x$10 <= 57) {
                          const _x$11 = name.charCodeAt(10);
                          if (_x$11 === 45) {
                            const _x$12 = name.charCodeAt((name.length - 1 | 0) - 2 | 0);
                            if (_x$12 === 46) {
                              const _x$13 = name.charCodeAt((name.length - 1 | 0) - 1 | 0);
                              if (_x$13 === 109) {
                                const _x$14 = name.charCodeAt(name.length - 1 | 0);
                                if (_x$14 === 100) {
                                  const _bind = name.length - 3 | 0;
                                  const _x$15 = new _M0TPC16string10StringView(name, 11, _bind);
                                  let _cursor_139 = 0;
                                  const _input_end_141 = _bind - 11 | 0;
                                  const _start_140 = _cursor_139;
                                  let _accept_state_142 = -1;
                                  let _match_end_143 = -1;
                                  let _state_144 = 1;
                                  while (true) {
                                    if (_state_144 !== 3) {
                                      if (_state_144 < 1) {
                                        _accept_state_142 = _state_144;
                                        _match_end_143 = _cursor_139;
                                      }
                                      const _tmp = Math.imul(_state_144, 4) | 0;
                                      let _next_char_147;
                                      if (_cursor_139 < _input_end_141) {
                                        const _char_146 = name.charCodeAt(11 + _cursor_139 | 0);
                                        _cursor_139 = _cursor_139 + 1 | 0;
                                        _next_char_147 = _char_146;
                                      } else {
                                        _next_char_147 = -1;
                                      }
                                      const _p = _tmp + (_next_char_147 < 48 ? (_next_char_147 < 45 ? (_next_char_147 < 0 ? 0 : 3) : _next_char_147 > 45 ? 3 : 1) : _next_char_147 > 57 ? (_next_char_147 < 97 ? 3 : _next_char_147 > 122 ? 3 : 2) : 2) | 0;
                                      _state_144 = _M0FP56podhmo14html_2dsandbox8examples4blog4site10post__nameN25_2atransition__table__148S1817[_p];
                                      continue;
                                    } else {
                                      break;
                                    }
                                  }
                                  const _bind$2 = _accept_state_142;
                                  let _bind$3;
                                  if (_bind$2 === 0) {
                                    _cursor_139 = _match_end_143;
                                    _bind$3 = undefined;
                                  } else {
                                    _cursor_139 = _start_140;
                                    _bind$3 = -1;
                                  }
                                  return _bind$3 === -1 ? undefined : { _0: _M0MPC16string10StringView9to__owned(_M0MPC16string6String21clamped__view_2einner(name, 0, _M0FP56podhmo14html_2dsandbox8examples4blog4site10post__nameN6constrS1818)), _1: _M0MPC16string10StringView9to__owned(_x$15) };
                                } else {
                                  break _L;
                                }
                              } else {
                                break _L;
                              }
                            } else {
                              break _L;
                            }
                          } else {
                            break _L;
                          }
                        } else {
                          break _L;
                        }
                      } else {
                        break _L;
                      }
                    } else {
                      break _L;
                    }
                  } else {
                    break _L;
                  }
                } else {
                  break _L;
                }
              } else {
                break _L;
              }
            } else {
              break _L;
            }
          } else {
            break _L;
          }
        } else {
          break _L;
        }
      } else {
        break _L;
      }
    } else {
      break _L;
    }
  }
  return undefined;
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site12preview__url(source) {
  const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(1);
  _M0MPB13StringBuilder13write__objectGsE(_string_builder, "posts");
  _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "/");
  const _bind = _string_builder.val;
  const _bind$2 = _M0MPC16string6String13strip__prefix(source, new _M0TPC16string10StringView(_bind, 0, _bind.length));
  if (_bind$2 === undefined) {
    const _bind$3 = _M0MPC16string6String4find(source, _M0FP56podhmo14html_2dsandbox8examples4blog4site12preview__urlN6recordS1850);
    if (_bind$3 === undefined) {
      if (_M0FP56podhmo14html_2dsandbox8examples4blog4site7is__doc(source) && _M0MPC16string6String11has__suffix(source, _M0FP56podhmo14html_2dsandbox8examples4blog4site12preview__urlN6recordS1852)) {
        const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(6);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, "/docs/");
        _M0MPB13StringBuilder13write__objectGsE(_string_builder$2, _M0FP56podhmo14html_2dsandbox8examples4blog4site9doc__path(source));
        return _string_builder$2.val;
      } else {
        return undefined;
      }
    } else {
      const _Some = _bind$3;
      const _i = _Some;
      const dir = _M0MPC16string10StringView9to__owned(_M0MPC16string6String21clamped__view_2einner(source, 0, _i + 3 | 0));
      const file = _M0MPC16string6String21clamped__view_2einner(source, _i + 4 | 0, undefined);
      if (!_M0FP56podhmo14html_2dsandbox8examples4blog4site7is__doc(dir) || _M0MPC16string10StringView8contains(file, _M0FP56podhmo14html_2dsandbox8examples4blog4site12preview__urlN6recordS1851)) {
        return undefined;
      }
      const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(7);
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, "/docs/");
      _M0MPB13StringBuilder13write__objectGsE(_string_builder$2, _M0FP56podhmo14html_2dsandbox8examples4blog4site9doc__path(dir));
      _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, "/");
      _M0MPB13StringBuilder13write__objectGRPC16string10StringViewE(_string_builder$2, file);
      return _string_builder$2.val;
    }
  } else {
    const _Some = _bind$2;
    const _name = _Some;
    let dir;
    let file;
    _L: {
      const _bind$3 = _M0MPC16string10StringView4find(_name, _M0FP56podhmo14html_2dsandbox8examples4blog4site12preview__urlN6recordS1849);
      if (_bind$3 === undefined) {
        dir = _name;
        file = undefined;
        break _L;
      } else {
        const _Some$2 = _bind$3;
        const _i = _Some$2;
        dir = _M0MPC16string10StringView21clamped__view_2einner(_name, 0, _i);
        file = _M0MPC16string10StringView21clamped__view_2einner(_name, _i + 1 | 0, undefined);
        break _L;
      }
    }
    if (file === undefined) {
    } else {
      const _Some$2 = file;
      const _f = _Some$2;
      if (_M0MPC16string10StringView8contains(_f, _M0FP56podhmo14html_2dsandbox8examples4blog4site12preview__urlN6recordS1848)) {
        return undefined;
      }
    }
    const _bind$3 = _M0FP56podhmo14html_2dsandbox8examples4blog4site10post__name(_M0MPC16string10StringView9to__owned(dir));
    if (_bind$3 === undefined) {
      return undefined;
    } else {
      const _Some$2 = _bind$3;
      const _x = _Some$2;
      const _slug = _x._1;
      if (file === undefined) {
        const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(7);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, "/posts/");
        _M0MPB13StringBuilder13write__objectGsE(_string_builder$2, _slug);
        return _string_builder$2.val;
      } else {
        const _Some$3 = file;
        const _f = _Some$3;
        const _string_builder$2 = _M0MPB13StringBuilder21StringBuilder_2einner(8);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, "/posts/");
        _M0MPB13StringBuilder13write__objectGsE(_string_builder$2, _slug);
        _M0IPB13StringBuilderPB6Logger13write__string(_string_builder$2, "/");
        _M0MPB13StringBuilder13write__objectGRPC16string10StringViewE(_string_builder$2, _f);
        return _string_builder$2.val;
      }
    }
  }
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site15preview__linker(files) {
  const _bind = [];
  const urls = _M0MPB3Map3MapGssE(new _M0TPB9ArrayViewGUssEE(_bind, 0, 0), undefined);
  const _bind$2 = files.length;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind$2) {
      const f = files[_];
      const _bind$3 = _M0FP56podhmo14html_2dsandbox8examples4blog4site12preview__url(f);
      if (_bind$3 === undefined) {
      } else {
        const _Some = _bind$3;
        const _u = _Some;
        _M0MPB3Map3setGssE(urls, f, _M0FP56podhmo14html_2dsandbox8examples4blog4site6escape(_u, false));
      }
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return _M0FP56podhmo14html_2dsandbox8examples4blog4site7resolve((p) => _M0MPB3Map3getGssE(urls, p), "posts/preview.md", true);
}
function _M0FP56podhmo14html_2dsandbox8examples4blog4site7preview(src, files) {
  let _bind;
  let _try_err;
  _L: {
    _L$2: {
      const _bind$2 = _M0FP46podhmo14html_2dsandbox3pkg15tinyfrontmatter5split(src);
      if (_bind$2.$tag === 1) {
        const _ok = _bind$2;
        _bind = _ok._0;
      } else {
        const _err = _bind$2;
        _try_err = _err._0;
        break _L$2;
      }
      break _L;
    }
    _bind = { _0: undefined, _1: src };
  }
  const _meta = _bind._0;
  const _body = _bind._1;
  const _bind$2 = [];
  const meta = _M0MPC16option6Option10unwrap__orGRPB3MapGssEE(_meta, _M0MPB3Map3MapGssE(new _M0TPB9ArrayViewGUssEE(_bind$2, 0, 0), undefined));
  const doc = _M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown5parse(_body);
  const link = _M0FP56podhmo14html_2dsandbox8examples4blog4site15preview__linker(files);
  const gen = _M0MP56podhmo14html_2dsandbox8examples4blog4site9AnchorIds3new();
  const children = [];
  const _bind$3 = _M0FP56podhmo14html_2dsandbox8examples4blog4site12first__title(doc);
  if (_bind$3 === undefined) {
    const _x = _M0MPB3Map3getGssE(meta, "title");
    let title;
    if (_x === undefined) {
      title = "";
    } else {
      const _Some = _x;
      const _t = _Some;
      const _p = "";
      if (!(_t === _p)) {
        title = _t;
      } else {
        title = "";
      }
    }
    const _p = "";
    if (!(title === _p)) {
      _M0MPC15array5Array4pushGsE(children, _M0FP56podhmo14html_2dsandbox8examples4blog4site7heading(1, _M0MP56podhmo14html_2dsandbox8examples4blog4site9AnchorIds2id(gen, _M0FP56podhmo14html_2dsandbox8examples4blog4site11plain__text(title)), _M0FP56podhmo14html_2dsandbox8examples4blog4site15render__inlines(_M0FP46podhmo14html_2dsandbox3pkg12tinymarkdown7inlines(title), link)));
    }
  }
  _M0MPC15array5Array10push__iterGRP46podhmo14html_2dsandbox3pkg2el4NodeE(children, _M0MPC15array5Array4iterGRP46podhmo14html_2dsandbox3pkg2el4NodeE(_M0FP56podhmo14html_2dsandbox8examples4blog4site14render__blocks(doc.children, link, gen)));
  return _M0FP46podhmo14html_2dsandbox3pkg6picoel7article(children);
}
function _M0FP56podhmo14html_2dsandbox8examples4blog7preview6render(src, files) {
  const list = [];
  const _it = _M0MPC16string6String5split(files, _M0FP56podhmo14html_2dsandbox8examples4blog7preview6renderN6recordS1911);
  while (true) {
    const _bind = _M0MPB4Iter4nextGRPC16string10StringViewE(_it);
    if (_bind === undefined) {
      break;
    } else {
      const _Some = _bind;
      const _f = _Some;
      if (_M0IP016_24default__implPB2Eq10not__equalGRPC16string10StringViewE(_f, _M0FP56podhmo14html_2dsandbox8examples4blog7preview6renderN6recordS1912)) {
        _M0MPC15array5Array4pushGsE(list, _M0MPC16string10StringView9to__owned(_f));
      }
      continue;
    }
  }
  return _M0FP46podhmo14html_2dsandbox3pkg2el12render__html(_M0FP56podhmo14html_2dsandbox8examples4blog4site7preview(src, list));
}
export { _M0FP56podhmo14html_2dsandbox8examples4blog7preview6render as render }
