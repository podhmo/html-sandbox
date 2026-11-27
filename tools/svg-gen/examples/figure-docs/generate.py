#!/usr/bin/env python3
"""Generate figure-docs .mbtx probes from the pinned upstream reference HTML."""
import html
import re
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

PIN = "c10dce225fe205bdacb64f754cc5b6fc61ead8f2"
BASE = f"https://raw.githubusercontent.com/u-ichi/agent-plugins/{PIN}/plugins/figure-docs/skills/figure-docs/references"
ROOT = Path(__file__).resolve().parents[4]
OUT = ROOT / "tools/svg-gen/examples/figure-docs"
SOURCES = ["business", "dev"]

def fetch(name):
    url = f"{BASE}/{name}.html"
    with urllib.request.urlopen(url) as r:
        return r.read().decode("utf-8"), url

def fnum(v):
    x = float(v)
    if x == int(x):
        return f"{int(x)}.0"
    return format(x, ".12g") + (".0" if re.fullmatch(r"-?\d+", format(x, ".12g")) else "")

def q(s):
    return '"' + str(s).replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n') + '"'

def optstr(v):
    return "None" if v is None else f"Some({q(v)})"

def optnum(v):
    return "None" if v is None else f"Some({fnum(v)})"

def common(a, default_width="1"):
    parts = []
    if a.get("stroke-dasharray") is not None:
        parts.append(f"dash={optstr(a.get('stroke-dasharray'))}")
    if a.get("opacity") is not None:
        parts.append(f"opacity={optnum(a.get('opacity'))}")
    width = float(a.get("stroke-width", default_width))
    if width != 1.5:
        parts.append(f"width={fnum(width)}")
    parts.append(f"color={q(a.get('stroke', 'none'))}")
    fill = a.get("fill", "black")
    if fill != "none" or a.get("fill-opacity") is not None:
        parts.append(f"fill={q(fill)}")
    if a.get("fill-opacity") is not None:
        parts.append(f"fill_opacity={optnum(a.get('fill-opacity'))}")
    if a.get("stroke-opacity") is not None:
        parts.append(f"stroke_opacity={optnum(a.get('stroke-opacity'))}")
    return ", ".join(parts)

def points(s):
    vals = [float(x) for x in re.split(r"[\s,]+", s.strip()) if x]
    pts = ", ".join(f"({fnum(vals[i])}, {fnum(vals[i+1])})" for i in range(0, len(vals), 2))
    return "[" + pts + "]"

def convert_el(el):
    tag = el.tag
    a = el.attrib
    try:
        if tag == "rect":
            rx = f", rx={fnum(a.get('rx', 0))}" if float(a.get("rx", 0)) != 0 else ""
            return f"  ignore(c.rect({fnum(a['x'])}, {fnum(a['y'])}, {fnum(a['width'])}, {fnum(a['height'])}{rx}, {common(a)}))"
        if tag == "circle":
            return f"  ignore(c.circle({fnum(a['cx'])}, {fnum(a['cy'])}, {fnum(a['r'])}, {common(a)}))"
        if tag == "ellipse":
            return f"  ignore(c.ellipse({fnum(a['cx'])}, {fnum(a['cy'])}, {fnum(a['rx'])}, {fnum(a['ry'])}, {common(a)}))"
        if tag == "line":
            parts = []
            if a.get("stroke-dasharray") is not None:
                parts.append(f"dash={optstr(a.get('stroke-dasharray'))}")
            if a.get("opacity") is not None:
                parts.append(f"opacity={optnum(a.get('opacity'))}")
            width = float(a.get("stroke-width", 1))
            if width != 1.5:
                parts.append(f"width={fnum(width)}")
            parts.append(f"color={q(a.get('stroke', 'none'))}")
            if a.get("stroke-opacity") is not None:
                parts.append(f"stroke_opacity={optnum(a.get('stroke-opacity'))}")
            tail = (", " + ", ".join(parts)) if parts else ""
            return f"  c.line(({fnum(a['x1'])}, {fnum(a['y1'])}), ({fnum(a['x2'])}, {fnum(a['y2'])}){tail})"
        if tag == "polyline":
            return f"  c.polyline({points(a['points'])}, {common(a)})"
        if tag == "polygon":
            return f"  c.polygon({points(a['points'])}, {common(a)})"
        if tag == "path":
            return f"  c.path({q(a['d'])}, [], {common(a)})"
        if tag == "text":
            anch = {"start": "@svg.Start", "middle": "@svg.Middle", "end": "@svg.End"}.get(a.get("text-anchor", "start"), "@svg.Start")
            txt = "".join(el.itertext())
            parts = [f"anchor={anch}", f"size={fnum(a.get('font-size', 14))}"]
            if a.get("opacity") is not None:
                parts.append(f"opacity={optnum(a.get('opacity'))}")
            parts.append(f"color={q(a.get('fill', 'black'))}")
            return f"  c.text({fnum(a['x'])}, {fnum(a['y'])}, {q(txt)}, {', '.join(parts)})"
    except KeyError as e:
        raise ValueError(f"missing attr {e} in {tag}: {a}")
    raise ValueError(f"unsupported element {tag}")

def slug(name):
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s[:42].strip("-") or "figure"

def emit(source, html_text, url):
    figures = []
    headers = [
        (m.start(), html.unescape(re.sub(r"<[^>]+>", "", m.group(1))))
        for m in re.finditer(r"<h2>(.*?)</h2>", html_text, re.S)
    ]
    for m in re.finditer(r"<figure>(<svg.*?</svg>)<figcaption><b>(.*?)</b>(.*?)<span>(.*?)</span>", html_text, re.S):
        category = "?"
        for pos, title in headers:
            if pos < m.start():
                category = title
            else:
                break
        svg_text = m.group(1)
        name = html.unescape(m.group(2))
        shape = html.unescape(re.sub(r"<[^>]+>", "", m.group(3)))
        use = html.unescape(re.sub(r"<[^>]+>", "", m.group(4)))
        root = ET.fromstring(svg_text)
        vb = [float(x) for x in root.attrib["viewBox"].split()]
        lines = [convert_el(el) for el in root]
        figures.append((category, name, shape, use, vb, lines, svg_text))
    outputs = []
    for i, (category, name, shape, use, vb, lines, svg_text) in enumerate(figures, 1):
        fn = f"{source}-{i:03d}-{slug(name)}.mbtx"
        body = "\n".join(lines)
        if not body:
            body = "  // empty reference figure"
        text = f'''---
import {{ "podhmo/svg-gen" @svg }}
---

// {source}/{i:03d} transcription probe
// source: {url}
//
// Mechanical transcription probe: each SVG element in the reference is
// emitted through the lowest-level svg-gen primitive that can represent
// it. Coordinates and fixed light-theme colors are intentionally kept so
// unsupported surface area is visible instead of redesigned away. The
// reference name is kept as string data in the render label.

fn main {{
  let c = @svg.Canvas(margin=0.0)
{body}
  println(
    c.render(
      width=Some({fnum(vb[2])}),
      height=Some({fnum(vb[3])}),
      label=Some({q(name)}),
      viewbox=Some(@svg.ViewBox::{{ x: {fnum(vb[0])}, y: {fnum(vb[1])}, w: {fnum(vb[2])}, h: {fnum(vb[3])} }}),
    ),
  )
}}
'''
        outputs.append((fn, text))
    return outputs

def write_outputs(outputs):
    OUT.mkdir(parents=True, exist_ok=True)
    current = {fn for fn, _ in outputs}
    for old in OUT.glob("*.mbtx"):
        if old.name not in current:
            old.unlink()
    for fn, text in outputs:
        target = OUT / fn
        tmp = target.with_suffix(target.suffix + ".tmp")
        tmp.write_text(text)
        tmp.replace(target)

def main():
    outputs = []
    counts = []
    for source in SOURCES:
        text, url = fetch(source)
        got = emit(source, text, url)
        outputs += got
        counts.append((source, len(got)))
    write_outputs(outputs)
    for source, count in counts:
        print(source, count)
    print("total", len(outputs))

if __name__ == "__main__":
    main()
