/* Puts a page of the site into the state a slide shows: a chip selected, a year chosen,
 * item names on, a card pinned, a tooltip open. Used by the presentation (on the page in
 * its frame) and by the script that finds where each slide's screenshot sits on the page.
 *
 *   await PresentationDriver.apply(window, steps)
 */
(function () {
  "use strict";
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function waitFor(doc, test, timeout = 20000) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      const v = test(doc);
      if (v) return v;
      await sleep(100);
    }
    throw new Error("timed out waiting");
  }

  const norm = s => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
  const byText = (nodes, text, exact = true) =>
    [...nodes].find(n => exact ? norm(n.textContent) === norm(text) : norm(n.textContent).includes(norm(text)));

  function fire(win, el, types, at) {
    const r = el.getBoundingClientRect();
    const x = at ? at.x : r.left + r.width / 2, y = at ? at.y : r.top + r.height / 2;
    for (const type of types) {
      const Ctor = type.startsWith("pointer") ? win.PointerEvent : win.MouseEvent;
      el.dispatchEvent(new Ctor(type, { bubbles: type !== "mouseenter" && type !== "mouseleave",
                                         cancelable: true, clientX: x, clientY: y, view: win }));
    }
  }
  const hover = (win, el) => fire(win, el, ["pointerover", "mouseover", "mouseenter", "pointermove", "mousemove"]);
  const click = (win, el) => fire(win, el, ["mousedown", "mouseup", "click"]);

  // Year scale inside a container: move the slider to the stop with this label.
  function setYear(win, host, year) {
    const ts = host.querySelector(".timescale");
    const stop = [...ts.querySelectorAll(".ts-ticks span")].find(s => s.textContent.trim() === String(year));
    const range = ts.querySelector("input[type=range]");
    range.value = stop.dataset.i;
    range.dispatchEvent(new win.Event("input", { bubbles: true }));
  }

  const STEPS = {
    // Paper grids (Figures 6a and 6b) ---------------------------------------------
    async named(win, doc) {
      const cb = await waitFor(doc, d => d.getElementById("view-named"));
      if (!cb.checked) { cb.checked = true; cb.dispatchEvent(new win.Event("change", { bubbles: true })); }
    },
    async showAllCats(win, doc, block) {
      const bar = await waitFor(doc, d => d.querySelector(`[data-sort-for="${block}"]`)?.closest(".sort-bar"));
      const link = await waitFor(doc, () => bar.querySelector(`a[data-toggle="${block}"]`));
      if (/show all/.test(link.textContent)) link.click();
    },
    async showAllCompanies(win, doc) {
      const cb = await waitFor(doc, d => d.getElementById("show-all-cos"));
      if (!cb.checked) { cb.checked = true; cb.dispatchEvent(new win.Event("change", { bubbles: true })); }
    },
    async gridYear(win, doc, arg) {
      const block = await waitFor(doc, d => d.querySelector(`#block-${arg.block} .timescale`)?.closest(".grid-block"));
      setYear(win, block, arg.year);
    },
    async pin(win, doc, arg) {
      await sleep(150);
      const sq = await waitFor(doc, d => byText(d.querySelectorAll(`#grid-${arg.block} .sq`), arg.text));
      sq.scrollIntoView({ block: "center" });
      await sleep(50);
      click(win, sq);
    },
    // Figure 2 (keyness) ----------------------------------------------------------
    async keyness(win, doc, type) {
      const b = await waitFor(doc, d => byText(d.querySelectorAll("#fig-keyness .fig2-type"), type));
      b.click();
    },
    // Figure 3a (network) ---------------------------------------------------------
    async networkCompany(win, doc, company) {
      const b = await waitFor(doc, d => byText(d.querySelectorAll("#fig-network .fig2-type"), company));
      b.click();
      await sleep(600);                                      // embedded: the layout is computed at once
    },
    async networkCategory(win, doc, cat) {
      const b = await waitFor(doc, d => byText(d.querySelectorAll("#fig-network .fig2-key-btn"), cat));
      b.click();
    },
    async networkHover(win, doc, title) {
      const node = await waitFor(doc, d => [...d.querySelectorAll("#fig-network circle")]
        .find(c => c.__data__ && norm(c.__data__.title || c.__data__.label || "").includes(norm(title))));
      hover(win, node);
      // The layout may still be drifting; hover again where the node ends up.
      setTimeout(() => hover(win, node), 1500);
      setTimeout(() => hover(win, node), 4000);
    },
    // Figure 3b (actor types x document types) ----------------------------------
    async matrixHover(win, doc, arg) {
      const table = await waitFor(doc, d => d.querySelector("#fig-actor-types table"));
      const heads = [...table.querySelectorAll("tr:first-child th")].map(th => norm(th.textContent));
      const col = heads.indexOf(norm(arg.col));
      const row = [...table.querySelectorAll("tr")].find(tr => tr.querySelector(".fig2-matrix-row") &&
        norm(tr.querySelector(".fig2-matrix-row").textContent) === norm(arg.row));
      const cell = row.children[col];
      hover(win, cell);
    },
    // Figure 10 (alluvial) ---------------------------------------------------------
    async alluvialHover(win, doc, name) {
      const node = await waitFor(doc, d => [...d.querySelectorAll("#block-alluvial rect")]
        .find(r => r.__data__ && norm(r.__data__.name || r.__data__.id || "") === norm(name)));
      hover(win, node);
    },
    // Word tree --------------------------------------------------------------------
    async wordtreeRoot(win, doc, root) {
      const input = await waitFor(doc, d => d.querySelector("#fig-wordtree .v2-ctl input"));
      input.value = root;
      input.dispatchEvent(new win.Event("change", { bubbles: true }));
    },
    async wordtreeYear(win, doc, year) {
      const host = await waitFor(doc, d => d.querySelector("#fig-wordtree .timescale") && d.getElementById("fig-wordtree"));
      setYear(win, host, year);
    },
    async undim(win, doc) {
      // Pinning a card also highlights the items linked to it and dims the rest; the slides
      // show the card over an undimmed grid.
      win.eval("STATE.selectionHL = null; STATE.catSelection = null; refreshSelectionState();");
    },
    async wait(win, doc, ms) { await sleep(ms); },
  };

  async function apply(win, steps) {
    const doc = win.document;
    for (const [name, arg] of steps) {
      await STEPS[name](win, doc, arg);
      await sleep(80);
    }
  }

  // What each page must have drawn before a slide's steps can run.
  const READY = {
    "index.html": d => d.querySelector("#grid-conducts .sq") && d.querySelector("#fig-network circle") &&
                       d.querySelector("#fig-actor-types td") && d.querySelector("#block-alluvial path"),
    "more-figures.html": d => d.querySelector("#fig-wordtree .wt-node"),
    "interface.html": d => d.querySelector("#grid-training .sq") && d.querySelector("#grid-benchmark .sq"),
  };
  async function ready(win, page) {
    await waitFor(win.document, READY[page] || (() => true), 30000);
    await sleep(600);
  }

  window.PresentationDriver = { apply, ready };
})();
