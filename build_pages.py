#!/usr/bin/env python3
"""Render the two working-paper drafts as pages of the site.

  revised.html       the original text with the September 2026 revisions
  restructured.html  the same material under the new structure

Both pages carry the three new figures at the end, built by rag/discourse_keyness.py,
rag/citation_network.py and rag/actors_by_type.py.

Citations written as [@key] become "(Author, Year)" using docs/bibliography.json where the
key is known, and otherwise from the key itself; unknown keys are listed on stderr so they
can be added to the bibliography.
"""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parent
ARTICLES = Path.home() / "Projects" / "Master_vault" / "Articles"
BIB = json.loads((DOCS / "bibliography.json").read_text(encoding="utf-8"))
PAGES = [
    ("revised.html", ARTICLES / "PoP - Alignment actors - revised draft.md",
     "The actors in AI alignment — revised text",
     "The working paper as first written, with the September 2026 revisions: the corpus now "
     "follows the whole alignment stack, the reading is grounded in retrieval, and three new "
     "figures read the corpus itself."),
    ("restructured.html", ARTICLES / "PoP - Alignment actors - Restructured draft.md",
     "The actors in AI alignment — restructured text",
     "The same material under the new structure, up to the findings."),
]
CITE = re.compile(r"\[@([^\]]+)\]")
MARKER = re.compile(r"==Visualisation\s*(\d)[^=]*==")
KEY = re.compile(r"^([a-z]+)([A-Za-z]*?)(\d{4})")

FIGURES = """
<section id="figures" class="prose">
  <h2>Figures</h2>

  <figure class="fig2" id="figure-1">
    <figcaption><strong>Figure 1.</strong> The discursive character of each document type.
      The phrases that a larger share of one type's documents use than the rest of the corpus
      (log-odds ratio with an informative prior; a phrase counts only if more than one company
      uses it).</figcaption>
    <div id="fig-keyness" class="fig2-host"></div>
  </figure>

  <figure class="fig2" id="figure-2">
    <figcaption><strong>Figure 2.</strong> The document network. One document points at another
      when it names it by title or links to it; links that a company's navigation places on every
      page are discounted.</figcaption>
    <div id="fig-network" class="fig2-host"></div>
  </figure>

  <figure class="fig2" id="figure-3">
    <figcaption><strong>Figure 3.</strong> Actors named in each type of document, and what those
      documents say they do.</figcaption>
    <div id="fig-actors" class="fig2-host"></div>
  </figure>
</section>
"""

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<link rel="stylesheet" href="style.css?v={v}">
<link rel="stylesheet" href="figures2.css?v={v}">
</head>
<body class="paper-page">
<main class="paper">
<nav class="paper-nav">
  <a href="index.html">← Interface and findings</a>
  <a href="revised.html">Revised text</a>
  <a href="restructured.html">Restructured text</a>
</nav>
<p class="paper-lede">{lede}</p>
{body}
{figures}
</main>
<script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
<script src="figures2.js?v={v}"></script>
</body>
</html>
"""


def render_citation(match: re.Match) -> str:
    out = []
    for key in match[1].split(";"):
        key = key.strip().lstrip("@")
        key, _, locator = key.partition(",")
        entry = BIB.get(key.strip())
        if entry:
            text = f"{entry['author']}, {entry['year']}"
        else:
            parts = KEY.match(key.strip())
            if parts:
                text = f"{parts[1].capitalize()}, {parts[3]}"
                UNKNOWN.add(key.strip())
            else:
                text = key.strip()
                UNKNOWN.add(key.strip())
        if locator.strip():
            text += f", {locator.strip()}"
        out.append(text)
    return f'<span class="cite">({"; ".join(out)})</span>'


UNKNOWN: set[str] = set()


def to_html(markdown_text: str) -> str:
    import markdown
    text = MARKER.sub(lambda m: f'<span class="figref">See Figure {m[1]}, at the end.</span>',
                      markdown_text)
    text = CITE.sub(render_citation, text)
    return markdown.markdown(text, extensions=["tables", "sane_lists", "attr_list"])


def main() -> None:
    version = "20260918"
    for name, source, title, lede in PAGES:
        if not source.exists():
            sys.exit(f"missing draft: {source}")
        body = to_html(source.read_text(encoding="utf-8"))
        page = TEMPLATE.format(title=html.escape(title), lede=html.escape(lede),
                               body=body, figures=FIGURES, v=version)
        (DOCS / name).write_text(page, encoding="utf-8")
        print(f"{name}: {len(body):,} characters of HTML from {source.name}")
    if UNKNOWN:
        print(f"\n{len(UNKNOWN)} citation keys not in bibliography.json (rendered from the key):",
              file=sys.stderr)
        print("  " + ", ".join(sorted(UNKNOWN)), file=sys.stderr)


if __name__ == "__main__":
    main()
