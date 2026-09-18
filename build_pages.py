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
OUT = DOCS / "index.html"        # the restructured text is the site's front page
INTERFACE = DOCS / "interface.html"  # the original interface page, kept alongside
VERSION = "20260918g"

CITE = re.compile(r"\[@([^\]]+)\]")
CAPTION = re.compile(r"^\*\*(Figure|Table)\s*([0-9]+[ab]?(?:\s*and\s*[0-9]+[ab])?)\.?\*\*", re.I)

FIGURE_HTML = {
    "figure 1": '<figure class="fig2" id="fig-stack-1"><img src="fig-stack.svg" alt="The alignment stack" '
                'style="width:100%;height:auto"></figure>',
    "figure 5": '<figure class="fig2" id="fig-method-5"><img src="fig-method.svg" alt="The method, from seed URLs '
                'to analysis" style="width:100%;height:auto"></figure>',
    "figure 2": '<div id="fig-keyness" class="fig2-host"></div>',
    "figure 3a": '<div id="fig-network" class="fig2-host"></div>',
    "figure 3b": '<div id="fig-actor-types" class="fig2-host"></div>',
    "figure 4": '<div id="fig-actors" class="fig2-host"></div>',
    "figure 6a and 6b": "@@block-conducts@@@@block-risks@@",
    "figure 7": "@@block-training@@",
    "figure 8": "@@block-benchmark@@",
    "figure 9": "@@block-stacks@@",
    "figure 10": "@@block-alluvial@@",
}
# The interface blocks kept after the article, in the order the original page has them.
TRAILING_BLOCKS = ["block-sources", "block-top-actors", "block-clusters"]


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
    out = ['<div class="fig2-host" id="table-1"><table class="taxonomy">',
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


SLUG = re.compile(r"[^a-z0-9]+")


def add_heading_ids(body_html: str) -> tuple[str, list[tuple[str, str, str]]]:
    """Give every heading an id, and return (level, id, text) for the sidebar."""
    headings: list[tuple[str, str, str]] = []
    seen: set[str] = set()

    def tag(match: re.Match) -> str:
        level, text = match[1], match[2]
        plain = re.sub(r"<[^>]+>", "", text).strip()
        slug = SLUG.sub("-", plain.lower()).strip("-")[:48] or "section"
        while slug in seen:
            slug += "-2"
        seen.add(slug)
        headings.append((level, slug, plain))
        return f'<h{level} id="{slug}">{text}</h{level}>'

    return re.sub(r"<h([12])>(.*?)</h\1>", tag, body_html, flags=re.S), headings


def sidebar_nav(headings: list[tuple[str, str, str]], figures: list[tuple[str, str]]) -> str:
    out = ['<nav class="side-nav" aria-label="Sections">']
    for level, slug, text in headings:
        if level == "1":
            out.append(f'<a href="#{slug}" data-target="{slug}">{html.escape(text)}</a>')
        else:
            out.append(f'<ul class="sub-nav"><li><a href="#{slug}" data-target="{slug}">'
                       f'{html.escape(text)}</a></li></ul>')
    out.append('<a href="#figures-list" data-target="figures-list">Figures</a><ul class="sub-nav">')
    for anchor, label in figures:
        out.append(f'<li><a href="#{anchor}" data-target="{anchor}">{html.escape(label)}</a></li>')
    out.append("</ul></nav>")
    return "\n".join(out)


def insert_figures(body_html: str) -> str:
    """Put each figure directly under the caption paragraph that announces it."""
    out, used = [], set()
    for para in re.split(r"(?=<p><strong>)", body_html):
        match = re.match(r"<p><strong>(Figure|Table)\s*([0-9]+[ab]?(?:\s*and\s*[0-9]+[ab])?)\.?"
                         r"</strong>", para, re.I)
        # A caption, not a sentence that happens to open with the figure's name.
        out.append(para)
        if not match:
            continue
        caption = para[:para.find("</p>") + 4]  # the chunk runs on to the next bold paragraph
        after = caption[match.end():].lstrip(". ")
        if not (after.startswith("<em>") or len(caption) < 420):
            continue
        name = f"{match[1].lower()} {match[2].lower().replace('  ', ' ')}"
        figure = FIGURE_HTML.get(name) or (taxonomy_table() if name == "table 1" else None)
        if figure and name not in used:
            used.add(name)
            out[-1] = caption + figure + para[len(caption):]
    missing = set(FIGURE_HTML) - used
    if missing:
        print(f"captions not found for: {sorted(missing)}", file=sys.stderr)
    return "".join(out)


def main() -> None:
    page = INTERFACE.read_text(encoding="utf-8")
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
    body_html, headings = add_heading_ids(body_html)
    figures = [("fig-stack-1", "1. The alignment stack"), ("table-1", "Table 1. Taxonomy"),
               ("fig-keyness", "2. Discourse per type"), ("fig-network", "3a. Document network"),
               ("fig-actor-types", "3b. Actor types"), ("fig-actors", "4. Actors per type"),
               ("fig-method-5", "5. Method"), ("block-conducts", "6a. Conducts"),
               ("block-risks", "6b. Risks"), ("block-training", "7. Training"),
               ("block-benchmark", "8. Benchmarking"), ("block-stacks", "9. Stack view"),
               ("block-alluvial", "10. Who reaches the documents")]
    for block_id in ("block-conducts", "block-risks", "block-training", "block-benchmark",
                     "block-stacks", "block-alluvial"):
        body_html = body_html.replace(f"@@{block_id}@@", slice_block(page, block_id))
    trailing = "\n".join(slice_block(page, b) for b in TRAILING_BLOCKS)

    nav = ('<nav class="paper-nav" style="max-width:52rem;margin:0 auto 1.5rem;">'
           '<span class="paper-nav-current">The paper</span>'
           '<a href="interface.html">Interface and original findings</a>'
           '<span class="paper-nav-disabled" title="Set aside; the restructured text supersedes it">'
           'Revised text</span></nav>')
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
    shell_top = re.sub(r'<nav class="side-nav".*?</nav>', sidebar_nav(headings, figures),
                       shell_top, flags=re.S)
    OUT.write_text(head + "</head>" + shell_top + main_html + scripts, encoding="utf-8")
    print(f"index.html (restructured text): {len(main_html):,} characters")


if __name__ == "__main__":
    main()
