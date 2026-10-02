#!/usr/bin/env python3
"""Draw Figure 5, the method diagram (fig-method.svg). Edit the text here and rerun."""
from pathlib import Path

TOP = [  # steps 1–3, side by side: (title, lines, count)
    ("Selecting seed URLs", ["Newsrooms, transparency hubs,", "model-card and safety pages."], "28 seeds · 8 companies"),
    ("Crawling the seed URLs", ["Pages rendered with Playwright.", "PDFs kept as published."], "1,318 links · 515 documents"),
    ("Categorising a sample by hand", ["A sample of documents read by hand", "to define the categories of conducts,", "risks, training methods, benchmarks", "and actors."], ""),
]
SIMPLE = [  # steps 4–5, one box each: (title, line, count)
    ("Categorising document types",
     "Each document given one of 21 types: at selection, by hand, or by rules on title and URL.",
     "515 documents · 21 types"),
    ("Applying RAG",
     "Company documents, Zotero items and policies indexed page by page and split into passages.",
     "752 documents · 13,660 pages · 35,265 passages"),
]
NESTED = [  # steps 6–8: (title, [(title lines, body lines, count)])
    ("Processing with Claude Opus 5.5 via RAG", [
        (["Reading each document"], ["Opus 5.5 reads each document from the index, page by", "page. Long documents are read in sections."], "863 readings"),
        (["Recording data points"], ["Definitions of conducts and risks, training methods, benchmarks,", "credited actors and dates. Each has a quote and page number."],
         "3,327 definitions · 2,109 trainings · 3,311 benchmarks")]),
    ("Verifying", [
        (["Checking quotes against pages"], ["Each quote is matched to the", "page it cites."], "9,533 kept · 37 dropped"),
        (["Checking who each actor is"], ["Each actor's type is checked", "against how the corpus describes it."], "1,204 actors · 139 corrected"),
        (["Harmonising names"], ["Names for the same conduct or", "risk are merged."], "3,152 names → 1,233 concepts")]),
    ("Analysing", [
        (["Document discourses"], ["Noun phrases per document type,", "scored by log-odds against the", "rest of the corpus."], "Figure 2"),
        (["Document relations"], ["An edge where one document links", "to another or names it."], "Figure 3a"),
        (["How risks are defined", "and by whom"], ["Risk definitions per company, with", "the actors cited as their sources."], "Figure 6b"),
        (["How conducts are defined", "and by whom"], ["Conduct definitions per company,", "with the actors cited as their sources."], "Figure 6a"),
        (["Who participates in training", "and benchmarking"], ["Actors credited with training methods", "and benchmarks, per conduct and risk."], "Figures 7, 8 and 9"),
        (["Comparing with external", "alignment actors"], ["512 organisations from a directory", "of alignment actors, matched by name", "to the actors found."], "Figure 10")]),
]

out = []


def txt(cls, x, y, s, extra=""):
    out.append(f'  <text class="{cls}" x="{x}" y="{y}"{extra}>{s}</text>')


def arrow(x0, y0, x1, y1):
    out.append(f'  <path class="flow" d="M{x0},{y0} L{x1},{y1}"/>')


y = 92
H_TOP = 168
for i, (title, lines, count) in enumerate(TOP):
    x = [40, 344, 648][i]
    out.append(f'  <rect class="box" x="{x}" y="{y}" width="272" height="{H_TOP}" rx="6"/>')
    txt("step", x + 22, y + 28, f"STEP {i + 1}")
    txt("head", x + 22, y + 50, title)
    for j, line in enumerate(lines):
        txt("body", x + 22, y + 74 + 17 * j, line)
    if count:
        txt("count", x + 22, y + H_TOP - 20, count)
    if i < 2:
        arrow(x + 273, y + H_TOP // 2, x + 302, y + H_TOP // 2)
arrow(784, y + H_TOP, 784, y + H_TOP + 30)
y += H_TOP + 32

for k, (title, line, count) in enumerate(SIMPLE):
    out.append(f'  <rect class="box" x="40" y="{y}" width="880" height="104" rx="6"/>')
    txt("step", 64, y + 28, f"STEP {k + 4}")
    txt("head", 64, y + 50, title)
    txt("body", 64, y + 72, line)
    txt("count", 64, y + 90, count)
    arrow(480, y + 104, 480, y + 134)
    y += 136

for k, (title, boxes) in enumerate(NESTED):
    per = 3 if len(boxes) % 3 == 0 else 2
    rows = len(boxes) // per
    ih = 130 if any(len(b[0]) > 1 or len(b[1]) > 2 for b in boxes) else 118
    H = 70 + rows * ih + (rows - 1) * 20 + 24
    out.append(f'  <rect class="box" x="40" y="{y}" width="880" height="{H}" rx="6"/>')
    txt("step", 64, y + 28, f"STEP {k + 6}")
    txt("head", 64, y + 50, title)
    w, xs = (256, [64, 352, 640]) if per == 3 else (400, [64, 496])
    for i, (heads, lines, count) in enumerate(boxes):
        bx, by = xs[i % per], y + 70 + (i // per) * (ih + 20)
        out.append(f'  <rect class="box-out" x="{bx}" y="{by}" width="{w}" height="{ih}" rx="5"/>')
        for h_i, h in enumerate(heads):
            txt("head", bx + 20, by + 26 + 16 * h_i, h, ' font-size="12.5"')
        top = by + 26 + 16 * (len(heads) - 1) + 21
        for j, line in enumerate(lines):
            txt("body", bx + 20, top + 17 * j, line)
        txt("count", bx + 20, by + ih - 14, count)
    if k < len(NESTED) - 1:
        arrow(480, y + H, 480, y + H + 30)
    y += H + 32

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 {y - 12}" font-family="Test National, -apple-system, BlinkMacSystemFont, sans-serif">
  <defs>
    <style>
      .box {{ fill: #f4f1ea; stroke: #cfc7b8; stroke-width: 1; }}
      .box-out {{ fill: #fffdf8; stroke: #cfc7b8; stroke-width: 1; }}
      .step {{ font-size: 12px; fill: #8a8377; letter-spacing: .08em; }}
      .head {{ font-size: 14px; font-weight: bold; fill: #23211e; }}
      .body {{ font-size: 11.5px; fill: #4a463f; }}
      .flow {{ stroke: #a9a093; stroke-width: 1.3; fill: none; marker-end: url(#m); }}
      .title {{ font-size: 22px; fill: #23211e; }}
      .count {{ font-size: 11.5px; fill: #3f6fb5; }}
    </style>
    <marker id="m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#a9a093"/>
    </marker>
  </defs>

  <text class="title" x="480" y="44" text-anchor="middle">From seed URLs to analysis</text>

''' + "\n".join(out) + "\n</svg>\n"
Path(__file__).with_name("fig-method.svg").write_text(svg, encoding="utf-8")
print("fig-method.svg written")
