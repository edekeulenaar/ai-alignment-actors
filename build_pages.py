#!/usr/bin/env python3
"""Render the restructured draft as a page of the site, in the site's own shell.

`restructured.html` reuses index.html's head, sidebars and scripts, so it inherits the
fonts, the citation colours, the hover reference cards and the interactive figures that
app.js builds from data.json. The draft's own figure captions decide where each figure
goes: the caption line stays where the author wrote it and the figure is inserted under it.

  Figure 1   the alignment stack (fig-stack.svg)
  Table 1    the document taxonomy, from the taxonomy CSV
  Figure 2   discourse per document type      (keyness.json)
  Figure 3   the document network             (citations.json)
  Figure 4   actors per document type         (actors_by_type.json)
  Figure 5   the method (fig-method.svg)
  Figure 6a/6b, 7, 8  the original interface blocks for conducts, risks, training
             and benchmarking, which app.js fills from data.json

Citations written as [@key] become <span class="cite-grp" data-keys="…">, which is what
refs-comments.js renders and links to the reference list.
"""
from __future__ import annotations

import csv
import html
import re
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parent
ROOT = DOCS.parent
ARTICLES = Path.home() / "Projects" / "Master_vault" / "Articles"
DRAFT = ARTICLES / "PoP - Alignment actors - Restructured draft.md"
TAXONOMY = ROOT / "PoP - Alignment actors - Taxonomy table.csv"
INDEX = DOCS / "index.html"
OUT = DOCS / "restructured.html"
VERSION = "20260918f"

CITE = re.compile(r"\[@([^\]]+)\]")
CAPTION = re.compile(r"^\*\*(Figure|Table)\s*([0-9]+[ab]?(?:\s*and\s*[0-9]+[ab])?)\.?\*\*", re.I)

FIGURE_HTML = {
    "figure 1": '<figure class="fig2"><img src="fig-stack.svg" alt="The alignment stack" '
                'style="width:100%;height:auto"></figure>',
    "figure 5": '<figure class="fig2"><img src="fig-method.svg" alt="The method, from seed URLs '
                'to analysis" style="width:100%;height:auto"></figure>',
    "figure 2": '<div id="fig-keyness" class="fig2-host"></div>',
    "figure 3": '<div id="fig-network" class="fig2-host"></div>',
    "figure 4": '<div id="fig-actors" class="fig2-host"></div>',
    "figure 6a and 6b": "@@block-conducts@@@@block-risks@@",
    "figure 7": "@@block-training@@",
    "figure 8": "@@block-benchmark@@",
}
# The interface blocks kept after the article, in the order the original page has them.
TRAILING_BLOCKS = ["block-sources", "block-top-actors", "block-stacks", "block-alluvial",
                   "block-clusters"]


def slice_block(page: str, block_id: str) -> str:
    """The <article> element with this id, with its nested elements."""
    start = page.index(f'<article class="grid-block" id="{block_id}"')
    depth, i = 0, start
    while True:
        opening = page.find("<article", i)
        closing = page.find("</article>", i)
        if closing == -1:
            raise ValueError(block_id)
        if opening != -1 and opening < closing:
            depth += 1
            i = opening + 8
        else:
            depth -= 1
            i = closing + 10
            if depth == 0:
                return page[start:i]


def taxonomy_table() -> str:
    with TAXONOMY.open(encoding="utf-8-sig") as fh:
        rows = [r for r in csv.DictReader(fh, delimiter=";")
                if not r["Group"].startswith("Out of scope")]
    out = ['<div class="fig2-host"><table class="taxonomy">',
           "<thead><tr><th>Group</th><th>Category</th><th>Also known as</th>"
           "<th>Definition and decision rule</th><th>Data points to code</th></tr></thead><tbody>"]
    group = None
    for row in rows:
        shown = "" if row["Group"] == group else row["Group"]
        group = row["Group"]
        out.append("<tr>" + "".join(
            f"<td>{html.escape(cell)}</td>" for cell in
            (shown, row["Category"], row["Also known as"], row["Definition and decision rule"],
             row["Data points to code"])) + "</tr>")
    out.append("</tbody></table></div>")
    return "\n".join(out)


def render_citation(match: re.Match) -> str:
    keys = [k.strip().lstrip("@").split(",")[0].strip() for k in match[1].split(";")]
    return f'<span class="cite-grp" data-keys="{html.escape(",".join(k for k in keys if k))}"></span>'


def to_html(text: str) -> str:
    import markdown
    # The reference list becomes <ol class="references">, which refs-comments.js indexes so
    # that inline citations can link into it.
    body, _, refs = text.partition("\n# References\n")
    body_html = markdown.markdown(CITE.sub(render_citation, body),
                                  extensions=["tables", "sane_lists", "attr_list"])
    items = [line.strip() for line in refs.splitlines() if line.strip()]
    refs_html = markdown.markdown("\n\n".join(items), extensions=["sane_lists"])
    refs_html = refs_html.replace("<p>", "<li>").replace("</p>", "</li>")
    return body_html, f'<h1>References</h1>\n<ol class="references">\n{refs_html}\n</ol>'


def insert_figures(body_html: str) -> str:
    """Put each figure directly under the caption paragraph that announces it."""
    out, used = [], set()
    for para in re.split(r"(?=<p><strong>)", body_html):
        out.append(para)
        match = re.match(r"<p><strong>(Figure|Table)\s*([0-9]+[ab]?(?:\s*and\s*[0-9]+[ab])?)",
                         para, re.I)
        if not match:
            continue
        name = f"{match[1].lower()} {match[2].lower().replace('  ', ' ')}"
        if name in FIGURE_HTML and name not in used:
            out.append(FIGURE_HTML[name])
            used.add(name)
        elif name == "table 1" and "table 1" not in used:
            out.append(taxonomy_table())
            used.add(name)
    missing = set(FIGURE_HTML) - used
    if missing:
        print(f"captions not found for: {sorted(missing)}", file=sys.stderr)
    return "".join(out)


def main() -> None:
    page = INDEX.read_text(encoding="utf-8")
    head_end = page.index("</head>")
    head = page[:head_end]
    main_open = page.index("<main")
    shell_top = page[head_end + len("</head>"):main_open]  # <body> + sidebars
    scripts = page[page.index("</main>") + len("</main>"):]
    # The shell does not load the September 2026 figures; this page needs them.
    scripts = scripts.replace("</body>", f'<script src="figures2.js?v={VERSION}"></script>\n</body>')

    head = head.replace("<title>The actors in AI alignment</title>",
                        "<title>The actors in AI alignment — restructured</title>")
    head = re.sub(r'(figures2\.css\?v=)[0-9A-Za-z]+', r"\g<1>" + VERSION, head)

    body_html, refs_html = to_html(DRAFT.read_text(encoding="utf-8"))
    body_html = insert_figures(body_html)
    for block_id in ("block-conducts", "block-risks", "block-training", "block-benchmark"):
        body_html = body_html.replace(f"@@{block_id}@@", slice_block(page, block_id))
    trailing = "\n".join(slice_block(page, b) for b in TRAILING_BLOCKS)

    nav = ('<nav class="paper-nav" style="max-width:52rem;margin:0 auto 1.5rem;">'
           '<a href="index.html">← Interface and findings</a>'
           '<span class="paper-nav-current">Restructured text</span></nav>')
    main_html = f"""<main class="restructured">
{nav}
<section class="prose paper">
{body_html}
</section>

<section id="findings" class="prose">
<h2>The rest of the interface</h2>
<p class="fig2-note">The remaining figures of the original interface, unchanged: the corpus itself,
the actors most often named, the stack view, the flow from actor to component, and the conceptual
clusters.</p>
{trailing}
</section>

<section id="references" class="prose">
{refs_html}
</section>
</main>
"""
    OUT.write_text(head + "</head>" + shell_top + main_html + scripts, encoding="utf-8")
    print(f"restructured.html: {len(main_html):,} characters")


if __name__ == "__main__":
    main()
