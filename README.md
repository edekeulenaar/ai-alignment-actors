# The actors in AI alignment

Article and interactive figures, published at <https://edekeulenaar.github.io/ai-alignment-actors/>.

## Edit the article

`manuscript.md` is the article source. After editing it, run:

```bash
python3 build_pages.py
```

The build requires Python and the `markdown` package. It generates `index.html` and `more-figures.html`, using the existing interface blocks and figure data. Citation metadata is in `bibliography.json`; the full document taxonomy is in `document-taxonomy.csv`. Keep these aligned with changes to the manuscript and its reference list.

`alignment-actors-for-comments.docx` is the illustrated review copy. It is a separate export and must be replaced when the article changes.

## Preview and publish

From this repository directory:

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000/>. GitHub Pages deploys the root of the `main` branch after a push.

## Figures and data

`interface.html` supplies the interactive figure blocks. `app.js`, `figures2.js` and `alluvial.js` render the corresponding JSON data. The article distinguishes the 752-file archive, the detailed 184-document extraction, the 515-document expanded collection and its separate 150-document retrieval-grounded reading. Numerical summaries by stored item identifier differ from the company–label grouping used by some interactive figures; the Method and captions explain the counting units.

The preprocessing scripts and underlying research collection are held in the surrounding research project. Rebuilding the article does not rerun extraction or change those data.
