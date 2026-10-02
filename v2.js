/* Figures from the second, retrieval-grounded reading (October 2026):
 *   - the right sidebar can be hidden;
 *   - Figure 7  training methods × conducts and risks   (training_matrix.json)
 *   - Figure 8  benchmark types × conducts and risks    (benchmark_matrix.json)
 *   - Figure 11 word tree of how documents define AI and speculate about it (ai_sentences.json)
 *   - conceptual change: per company and year (conceptual_change.json), in the sidebar key
 *     and as Figure 12.
 * The year scale is app.js's makeTimeScale, shared with Figures 6a and 6b.
 */
(function () {
  "use strict";
  const V = (document.querySelector('script[src*="v2.js"]') || {}).src?.split("v=")[1] || Date.now();
  const getJSON = name => fetch(`${name}?v=${V}`).then(r => r.ok ? r.json() : null).catch(() => null);
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const actorColour = t => (window.COLOR_VAR_V2 && window.COLOR_VAR_V2[t]) || ACTOR_FALLBACK[t] || "#BABABA";
  const ACTOR_FALLBACK = {};

  // ── Right sidebar toggle ───────────────────────────────────────
  function sidebarToggle() {
    const side = document.getElementById("sidebar-right");
    if (!side) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sidebar-toggle";
    const set = hidden => {
      document.body.classList.toggle("right-collapsed", hidden);
      btn.textContent = hidden ? "‹ Controls" : "Hide ›";
      btn.setAttribute("aria-expanded", String(!hidden));
      btn.title = hidden ? "Show the controls sidebar" : "Hide the controls sidebar";
      try { localStorage.setItem("rightSidebarHidden", hidden ? "1" : "0"); } catch (e) { /* private mode */ }
      window.dispatchEvent(new Event("resize"));      // figures that measure their width redraw
    };
    let hidden = false;
    try { hidden = localStorage.getItem("rightSidebarHidden") === "1"; } catch (e) { /* ignore */ }
    btn.addEventListener("click", () => set(!document.body.classList.contains("right-collapsed")));
    document.body.appendChild(btn);
    set(hidden);
  }

  // ── Shared bits ────────────────────────────────────────────────
  const tip = (() => {
    let el;
    return {
      show(html, e) {
        if (!el) { el = document.createElement("div"); el.className = "v2-tip"; document.body.appendChild(el); }
        el.innerHTML = html; el.style.display = "block";
        const W = el.offsetWidth, H = el.offsetHeight;
        let x = e.clientX + 14, y = e.clientY + 14;
        if (x + W > innerWidth - 8) x = e.clientX - W - 14;
        if (y + H > innerHeight - 8) y = Math.max(8, innerHeight - H - 8);
        el.style.left = x + "px"; el.style.top = y + "px";
      },
      hide() { if (el) el.style.display = "none"; },
    };
  })();

  function select(label, options, value, onChange) {
    const wrap = document.createElement("label");
    wrap.className = "v2-ctl";
    wrap.innerHTML = `${esc(label)} <select>${options.map(o =>
      `<option value="${esc(o.value)}"${o.value === value ? " selected" : ""}>${esc(o.label)}</option>`).join("")}</select>`;
    wrap.querySelector("select").addEventListener("change", e => onChange(e.target.value));
    return wrap;
  }

  function withinYear(r, tv) {
    if (!tv || !tv.year) return true;
    return r.year && (tv.cumulative ? r.year <= tv.year : r.year === tv.year);
  }

  // ── Figures 7 and 8: matrices ──────────────────────────────────
  const TRAINING_ORDER = ["Preference learning", "Supervised training", "Reward shaping", "Data curation",
    "Adversarial training", "Inference-time filtering", "Hard constraints", "Runtime safeguards", "Other"];

  function matrix(host, records, cfg) {
    const state = { company: "", mode: "count", rows: "category", tv: null, pinned: null };
    const companies = Object.entries(records.reduce((a, r) => (a[r.company] = (a[r.company] || 0) + 1, a), {}))
      .filter(([c]) => c).sort((a, b) => b[1] - a[1]).map(([c]) => c);
    host.innerHTML = "";
    const controls = document.createElement("div");
    controls.className = "v2-controls";
    controls.append(
      select("Company", [{ value: "", label: "All companies" }, ...companies.map(c => ({ value: c, label: c }))],
        "", v => { state.company = v; draw(); }),
      select("Rows", [{ value: "category", label: "Conduct and risk categories" },
                      { value: "item", label: "Conducts and risks (harmonised)" }],
        "category", v => { state.rows = v; draw(); }),
      select("Shade by", [{ value: "count", label: cfg.countLabel },
                          { value: "actors", label: cfg.actorLabel }],
        "count", v => { state.mode = v; draw(); }));
    host.appendChild(controls);
    const tsHost = document.createElement("div");
    tsHost.className = "timescale-host";
    host.appendChild(tsHost);
    if (window.makeTimeScale) window.makeTimeScale(tsHost, records.map(r => r.year), tv => { state.tv = tv.year ? tv : null; draw(); });
    const legend = document.createElement("div");
    legend.className = "fig2-legend v2-legend";
    host.appendChild(legend);
    const scroller = document.createElement("div");
    scroller.className = "v2-matrix-scroll";
    host.appendChild(scroller);
    const detail = document.createElement("div");
    detail.className = "v2-detail";
    host.appendChild(detail);
    const note = document.createElement("p");
    note.className = "fig2-note";
    note.innerHTML = cfg.note;
    host.appendChild(note);

    function draw() {
      // Rows, columns and their order come from every year for this company, so that
      // positions stay fixed while the year scale accumulates; the year decides what is filled.
      const layout = records.filter(r => !state.company || r.company === state.company);
      const recs = layout.filter(r => withinYear(r, state.tv));
      const rowOf = r => r.target_category === "Unspecified" ? ["", "Not tied to a conduct or risk"]
        : [r.target_type, state.rows === "item" ? (r.target_item || r.target_category) : r.target_category];
      // Columns, grouped.
      const colCount = {};
      layout.forEach(r => { const k = cfg.col(r); colCount[k] = (colCount[k] || 0) + 1; });
      const groups = {};
      Object.keys(colCount).forEach(k => {
        const g = cfg.group(k, layout);
        (groups[g] = groups[g] || []).push(k);
      });
      const groupNames = Object.keys(groups).sort((a, b) => cfg.groupOrder(a) - cfg.groupOrder(b) || a.localeCompare(b));
      groupNames.forEach(g => groups[g].sort((a, b) => colCount[b] - colCount[a] || a.localeCompare(b)));
      const cols = groupNames.flatMap(g => groups[g]);
      // Cells.
      const cells = new Map(), rowTotals = {};
      layout.forEach(r => {
        const [t, row] = rowOf(r);
        const rk = `${t}|${row}`;
        rowTotals[rk] = rowTotals[rk] || new Set(); rowTotals[rk].add(cfg.unit(r));
      });
      recs.forEach(r => {
        const [t, row] = rowOf(r);
        const rk = `${t}|${row}`, ck = cfg.col(r);
        const key = `${rk}||${ck}`;
        if (!cells.has(key)) cells.set(key, { recs: [], units: new Set(), actors: new Map() });
        const c = cells.get(key);
        c.recs.push(r); c.units.add(cfg.unit(r));
        cfg.actors(r).forEach(a => { if (a.category !== "Internal") c.actors.set(a.name, a.category); });
      });
      let rows = Object.keys(rowTotals).sort((a, b) => {
        const order = k => k.startsWith("conduct|") ? 0 : k.startsWith("risk|") ? 1 : 2;
        return order(a) - order(b) || rowTotals[b].size - rowTotals[a].size || a.localeCompare(b);
      });
      if (state.rows === "item" && rows.length > 60) rows = rows.slice(0, 60);
      // The shade scale is that of all years too, so a cell darkens as the years add up.
      const allUnits = new Map();
      layout.forEach(r => { const [t, row] = rowOf(r); const k = `${t}|${row}||${cfg.col(r)}`;
        if (!allUnits.has(k)) allUnits.set(k, new Set()); allUnits.get(k).add(cfg.unit(r)); });
      const max = Math.max(1, ...[...allUnits.values()].map(u => u.size));
      const shade = v => d3.interpolateRgb("#e7eef8", "#1f4f96")(Math.log(1 + v) / Math.log(1 + max));

      if (!rows.length) {
        scroller.innerHTML = `<p class="fig2-note">Nothing for this company.</p>`;
        legend.innerHTML = ""; return;
      }
      let html = `<table class="fig2-matrix v2-matrix"><thead>`;
      if (cfg.grouped) {
        html += `<tr><th class="v2-corner"></th>${groupNames.map(g =>
          `<th class="v2-group" colspan="${groups[g].length}"><span>${esc(g)}</span></th>`).join("")}</tr>`;
      }
      html += `<tr><th class="v2-corner"></th>${cols.map(c => `<th class="v2-col" data-col="${esc(c)}"><span>${esc(c)}</span></th>`).join("")}</tr></thead><tbody>`;
      let lastType = null;
      rows.forEach(rk => {
        const [t, row] = rk.split("|");
        if (t !== lastType) {
          html += `<tr class="v2-rowgroup"><th colspan="${cols.length + 1}">${t === "conduct" ? "Conducts" : t === "risk" ? "Risks" : "Other"}</th></tr>`;
          lastType = t;
        }
        html += `<tr><th class="fig2-matrix-row" data-row="${esc(rk)}">${esc(row)}</th>`;
        cols.forEach(ck => {
          const c = cells.get(`${rk}||${ck}`);
          if (!c) { html += `<td></td>`; return; }
          const n = c.units.size;
          let bg, fg = n / max > 0.45 ? "#fff" : "#23211e";
          if (state.mode === "actors") {
            const types = [...new Set(c.actors.values())];
            bg = !types.length ? "#efece5" : types.length > 1 ? actorColour("Multiple") : actorColour(types[0]);
            fg = "#23211e";
          } else bg = shade(n);
          html += `<td class="has-value" data-key="${esc(`${rk}||${ck}`)}" style="background:${bg};color:${fg}">${n}</td>`;
        });
        html += `</tr>`;
      });
      html += `</tbody></table>`;
      scroller.innerHTML = html;

      // Legend.
      if (state.mode === "actors") {
        const types = [...new Set([...cells.values()].flatMap(c => [...c.actors.values()]))].sort();
        legend.innerHTML = types.map(t => `<span class="fig2-key"><i style="background:${actorColour(t)}"></i>${esc(t)}</span>`).join("")
          + `<span class="fig2-key"><i style="background:${actorColour("Multiple")}"></i>Multiple</span>`
          + `<span class="fig2-key"><i style="background:#efece5"></i>${esc(cfg.noActor)}</span>`;
      } else {
        legend.innerHTML = `<span class="fig2-key"><i style="background:${shade(1)}"></i>1</span>`
          + `<span class="fig2-key"><i style="background:${shade(Math.ceil(max / 3))}"></i>${Math.ceil(max / 3)}</span>`
          + `<span class="fig2-key"><i style="background:${shade(max)}"></i>${max} ${esc(cfg.unitLabel)}</span>`;
      }

      // Interaction.
      scroller.querySelectorAll("td.has-value").forEach(td => {
        const c = cells.get(td.dataset.key);
        const [rk, ck] = td.dataset.key.split("||");
        td.addEventListener("mouseenter", e => {
          scroller.querySelectorAll(`[data-row="${CSS.escape(rk)}"], [data-col="${CSS.escape(ck)}"]`).forEach(x => x.classList.add("is-lit"));
          tip.show(cfg.tip(rk.split("|")[1], ck, c), e);
        });
        td.addEventListener("mousemove", e => tip.show(cfg.tip(rk.split("|")[1], ck, c), e));
        td.addEventListener("mouseleave", () => {
          scroller.querySelectorAll(".is-lit").forEach(x => x.classList.remove("is-lit"));
          tip.hide();
        });
        td.addEventListener("click", () => { detail.innerHTML = cfg.detail(rk.split("|")[1], ck, c); });
      });
      detail.innerHTML = "";
    }
    draw();
  }

  function actorList(actors) {
    if (!actors.size) return "";
    return [...actors].map(([n, t]) => `<span class="v2-pill"><i style="background:${actorColour(t)}"></i>${esc(n)} <em>${esc(t)}</em></span>`).join(" ");
  }

  function trainingFigure(records) {
    const host = document.getElementById("fig-training-matrix");
    if (!host) return;
    matrix(host, records, {
      grouped: true,
      col: r => r.method || r.method_category,
      group: (k, recs) => (recs.find(r => (r.method || r.method_category) === k) || {}).method_category || "Other",
      groupOrder: g => { const i = TRAINING_ORDER.indexOf(g); return i < 0 ? 99 : i; },
      unit: r => r.doc,
      unitLabel: "documents",
      actors: r => r.actors || [],
      countLabel: "Number of documents",
      actorLabel: "Actors involved (other than the company)",
      noActor: "no actor named besides the company",
      tip: (row, col, c) => `<b>${esc(col)}</b> → <b>${esc(row)}</b><br>${c.units.size} document${c.units.size > 1 ? "s" : ""}, `
        + `${[...new Set(c.recs.map(r => r.company))].join(", ")}`
        + (c.actors.size ? `<br>Actors: ${[...c.actors].slice(0, 6).map(([n, t]) => `${esc(n)} (${esc(t)})`).join("; ")}` : "")
        + `<br><span class="fig2-tip-who">Click for the passages.</span>`,
      detail: (row, col, c) => `<h5>${esc(col)} → ${esc(row)}</h5>${actorList(c.actors)}<ul>${
        c.recs.slice(0, 40).map(r => `<li><b>${esc(r.company)}</b>, ${esc(r.title)} (${esc(r.year || "n.d.")}, p. ${r.page}): “${esc(r.quote)}”`
          + (r.actors.length ? ` — ${r.actors.map(a => `${esc(a.name)} (${esc(a.role)})`).join(", ")}` : "") + `</li>`).join("")}</ul>`,
      note: "Each cell counts the documents in which a company says it applied a training or mitigation method "
        + "to a conduct or risk. The methods are those of the study's coding scheme, grouped by category. "
        + "Shade by <em>actors involved</em> to colour cells by the type of the actors other than the company "
        + "that the documents credit with conceiving the method or taking part in the training. "
        + "Only passages found verbatim on their page in the index are counted.",
    });
  }

  function benchmarkFigure(records) {
    const host = document.getElementById("fig-benchmark-matrix");
    if (!host) return;
    matrix(host, records, {
      grouped: false,
      col: r => r.benchmark_type || "Other",
      group: () => "",
      groupOrder: () => 0,
      unit: r => r.name.toLowerCase(),
      unitLabel: "benchmarks",
      actors: r => r.creators || [],
      countLabel: "Number of benchmarks",
      actorLabel: "Benchmark creators (other than the company)",
      noActor: "created by the company itself, or creator not named",
      tip: (row, col, c) => `<b>${esc(col)}</b> → <b>${esc(row)}</b><br>${c.units.size} benchmark${c.units.size > 1 ? "s" : ""}: `
        + `${[...new Set(c.recs.map(r => r.name))].slice(0, 8).map(esc).join(", ")}`
        + (c.actors.size ? `<br>Created by: ${[...c.actors].slice(0, 6).map(([n, t]) => `${esc(n)} (${esc(t)})`).join("; ")}` : "")
        + `<br><span class="fig2-tip-who">Click for the benchmarks and their creators.</span>`,
      detail: (row, col, c) => {
        const byName = new Map();
        c.recs.forEach(r => { if (!byName.has(r.name)) byName.set(r.name, []); byName.get(r.name).push(r); });
        return `<h5>${esc(col)} → ${esc(row)}</h5><ul>${[...byName].slice(0, 40).map(([name, rs]) => {
          const creators = [...new Map(rs.flatMap(r => r.creators).map(a => [a.name, a])).values()];
          return `<li><b>${esc(name)}</b> — ${creators.length ? creators.map(a => `${esc(a.name)} <em>(${esc(a.category)}${a.role === "model_knowledge" ? ", not stated in the document" : ""})</em>`).join(", ") : "creator not named"}; used by ${[...new Set(rs.map(r => r.company))].map(esc).join(", ")}</li>`;
        }).join("")}</ul>`;
      },
      note: "Each cell counts the distinct benchmarks of a type (columns) that companies use to measure a "
        + "conduct or risk (rows): Capture the Flag challenges for cybersecurity, multiple-choice knowledge "
        + "tests for CBRN, and so on. Shade by <em>benchmark creators</em> to colour cells by the type of "
        + "actor, other than the company, that created the benchmarks. Creators come from the document's own "
        + "citation where it gives one.",
    });
  }

  // ── Figure 11: word tree ───────────────────────────────────────
  function wordTree(data) {
    const host = document.getElementById("fig-wordtree");
    if (!host || !data) return;
    const all = data.sentences;
    const state = { root: "AI", kind: "risk", company: "", tv: null, history: [] };
    host.innerHTML = "";
    const controls = document.createElement("div");
    controls.className = "v2-controls";
    const rootInput = document.createElement("label");
    rootInput.className = "v2-ctl";
    rootInput.innerHTML = `Begin with <input type="text" value="${esc(state.root)}" size="18">`;
    const input = rootInput.querySelector("input");
    input.addEventListener("change", () => { state.history.push(state.root); state.root = input.value.trim() || "AI"; draw(); });
    const back = document.createElement("button");
    back.type = "button"; back.className = "v2-btn"; back.textContent = "← back";
    back.addEventListener("click", () => { if (state.history.length) { state.root = state.history.pop(); input.value = state.root; draw(); } });
    const companies = [...new Set(all.map(s => s.company))].sort();
    controls.append(rootInput, back,
      select("Statements", [
        { value: "risk", label: "Speculation about risks" },
        { value: "speculation", label: "All speculation (“AI will …”)" },
        { value: "definition", label: "Definitions (“AI is …”)" },
        { value: "all", label: "Everything" }], "risk", v => {
          state.kind = v;
          if (v === "definition" && /will$/i.test(state.root)) { state.root = "AI"; input.value = state.root; }
          if (v !== "definition" && /\bis$/i.test(state.root)) { state.root = "AI"; input.value = state.root; }
          draw();
        }),
      select("Company", [{ value: "", label: "All companies" }, ...companies.map(c => ({ value: c, label: c }))],
        "", v => { state.company = v; draw(); }));
    host.appendChild(controls);
    const tsHost = document.createElement("div");
    tsHost.className = "timescale-host";
    host.appendChild(tsHost);
    // The tree grows year by year: each year adds its statements to those of earlier years,
    // and the branches that gained statements in the chosen year are marked.
    if (window.makeTimeScale) window.makeTimeScale(tsHost, all.map(s => s.year),
      tv => { state.tv = tv.year ? { year: tv.year, cumulative: true } : null; draw(); }, { cumulativeOnly: true });
    const info = document.createElement("p");
    info.className = "fig2-note v2-wt-info";
    host.appendChild(info);
    const scroller = document.createElement("div");
    scroller.className = "v2-wt-scroll";
    host.appendChild(scroller);
    const note = document.createElement("p");
    note.className = "fig2-note";
    note.innerHTML = "The year scale accumulates: each year shows the statements of that year and the years "
      + "before, and the branches that grew in that year are shown in blue; press play to watch the tree grow. "
      + "Statements without a date appear only at <em>Now</em>. "
      + "Read from the left: the phrase you type is the root, and every branch is a continuation "
      + "that documents actually wrote, sized by how many statements share it. Click a branch to make it the new "
      + "root. Statements come from every page of the corpus: a broad pattern picked candidate sentences in which "
      + "AI is the subject, and Claude Opus 5.5 kept those that define AI or speculate about what it will, could "
      + "or may do, marking the ones about risks.";
    host.appendChild(note);

    const tokens = s => s.match(/[\w’'\-]+|[^\s\w]/g) || [];
    const canvas = document.createElement("canvas").getContext("2d");
    const textW = (t, size) => { canvas.font = `${size}px "Test National", sans-serif`; return canvas.measureText(t).width; };

    function draw() {
      const rootToks = tokens(state.root).map(t => t.toLowerCase());
      // The tree grows with the years: it is laid out from the statements up to the chosen year.
      const inYear = s => withinYear(s, state.tv);
      const pool = all.filter(s => (state.kind === "all" || (state.kind === "risk" ? s.risk : s.kind === state.kind))
        && (!state.company || s.company === state.company) && inYear(s));
      // Sentences that contain the root phrase, and what follows it.
      const tree = { word: state.root, count: 0, children: new Map(), ids: [] };
      pool.forEach((s, id) => {
        const toks = tokens(s.t), low = toks.map(t => t.toLowerCase());
        for (let i = 0; i + rootToks.length <= low.length; i++) {
          if (rootToks.every((t, j) => low[i + j] === t)) {
            tree.count++; tree.ids.push(s);
            let node = tree;
            toks.slice(i + rootToks.length, i + rootToks.length + 40).forEach(tok => {
              const k = tok.toLowerCase();
              if (!node.children.has(k)) node.children.set(k, { word: tok, count: 0, children: new Map(), ids: [] });
              node = node.children.get(k);
              node.count++; node.ids.push(s);
            });
            break;
          }
        }
      });
      const added = state.tv ? tree.ids.filter(s => s.year === state.tv.year).length : 0;
      info.innerHTML = esc(`${tree.count} statement${tree.count === 1 ? "" : "s"} begin${tree.count === 1 ? "s" : ""} with “${state.root}”`
        + (state.tv ? ` up to ${state.tv.year}` : "") + ` (${pool.length} statements in the current selection).`)
        + (state.tv ? ` <span class="wt-new-key">${added} added in ${esc(state.tv.year)}</span>` : "");
      if (!tree.count) { scroller.innerHTML = ""; return; }
      // Merge single-child chains into phrases; keep the strongest branches.
      const compact = (node, depth) => {
        while (node.children.size === 1) {
          const [only] = node.children.values();
          if (only.count !== node.count || depth === 0) break;
          node.word += (/^[^\w]/.test(only.word) ? "" : " ") + only.word;
          node.children = only.children;
        }
        if (node.count === 1 && node.children.size) {      // a single statement: show its tail at once
          let tail = "", n = node;
          while (n.children.size) { [n] = n.children.values(); tail += (/^[^\w]/.test(n.word) ? "" : " ") + n.word; }
          const words = tail.trim().split(" ");
          node.word += " " + words.slice(0, 12).join(" ") + (words.length > 12 ? " …" : "");
          node.children = new Map();
        }
        const kids = [...node.children.values()].sort((a, b) => b.count - a.count);
        const limit = depth === 0 ? 24 : depth < 3 ? 10 : 6;
        node.kids = kids.slice(0, limit).map(k => compact(k, depth + 1));
        node.more = kids.slice(limit).reduce((a, k) => a + k.count, 0);
        return node;
      };
      compact(tree, 0);
      const max = tree.count;
      const size = n => n === tree ? 26 : 11 + 15 * Math.sqrt(n.count / max);
      // Layout: leaves stacked top to bottom; a node sits at the middle of its children.
      let y = 0;
      const place = (node, x) => {
        node.size = size(node);
        node.x = x;
        node.w = textW(node.word, node.size);
        if (!node.kids.length) { node.y = y + node.size / 2; y += node.size + 6 + (node.more ? 14 : 0); return; }
        node.kids.forEach(k => place(k, x + node.w + 22));
        if (node.more) y += 14;
        node.y = (node.kids[0].y + node.kids[node.kids.length - 1].y) / 2;
      };
      place(tree, 6);
      const nodes = [], links = [];
      const walk = n => { nodes.push(n); n.kids.forEach(k => { links.push([n, k]); walk(k); }); };
      walk(tree);
      const W = Math.max(...nodes.map(n => n.x + n.w)) + 20, H = y + 10;
      const svg = d3.create("svg").attr("width", W).attr("height", H).attr("class", "v2-wordtree");
      svg.append("g").selectAll("path").data(links).join("path")
        .attr("d", ([a, b]) => `M${a.x + a.w + 3},${a.y} C${a.x + a.w + 14},${a.y} ${b.x - 12},${b.y} ${b.x - 3},${b.y}`)
        .attr("class", "wt-link");
      const g = svg.append("g").selectAll("g").data(nodes).join("g").attr("class", "wt-node")
        .attr("transform", n => `translate(${n.x},${n.y})`);
      const fresh = n => state.tv && n.ids.some(s => s.year === state.tv.year);
      g.classed("wt-new", fresh);
      g.append("text").attr("dy", "0.35em").attr("font-size", n => n.size).text(n => n.word);
      g.filter(n => n.more).append("text").attr("class", "wt-more").attr("dy", n => n.size / 2 + 12)
        .attr("x", n => n.w + 22).text(n => `+${n.more} more`);
      g.on("mouseenter", (e, n) => {
        const ex = n.ids.slice(0, 4).map(s => `<li>“${esc(s.t.length > 200 ? s.t.slice(0, 200) + "…" : s.t)}”<br><span class="fig2-tip-who">${esc(s.company)}, ${esc(s.title)} (${esc(s.year || "n.d.")})</span></li>`).join("");
        tip.show(`<b>${n.count}</b> statement${n.count === 1 ? "" : "s"}${state.tv ? ` up to ${state.tv.year}` : ""}<ul class="wt-ex">${ex}</ul>${n !== tree ? '<span class="fig2-tip-who">Click to make this the root.</span>' : ""}`, e);
      }).on("mousemove", (e, n) => tip.show(document.querySelector(".v2-tip").innerHTML, e))
        .on("mouseleave", tip.hide)
        .on("click", (e, n) => {
          if (n === tree) return;
          // The new root is the path from the old root down to this node.
          const path = [];
          let found = false;
          const find = (m, acc) => { if (found) return; if (m === n) { path.push(...acc, m.word); found = true; return; } m.kids.forEach(k => find(k, [...acc, m.word])); };
          find(tree, []);
          state.history.push(state.root);
          state.root = path.join(" ").replace(/\s+([^\w\s])/g, "$1").replace(/\s*…$/, "");
          input.value = state.root;
          tip.hide();
          draw();
        });
      scroller.innerHTML = "";
      scroller.appendChild(svg.node());
    }
    draw();
  }

  // ── Conceptual change ──────────────────────────────────────────
  function conceptual(data) {
    if (!data) return;
    const byKey = new Map();
    data.items.forEach(it => byKey.set(`${it.company}|${it.item.toLowerCase()}`, it));
    window.CONCEPTUAL = { byKey, summary: data.summary, items: data.items };
    const companies = Object.keys(data.summary)
      .filter(c => Object.values(data.summary[c]).some(v => v.change != null))
      .sort((a, b) => Object.keys(data.summary[b]).length - Object.keys(data.summary[a]).length);
    const years = [...new Set(companies.flatMap(c => Object.keys(data.summary[c])))].sort();

    if (document.body.classList.contains("conceptual") && typeof renderAll === "function") renderAll();

    // Figure 12: each company's conducts and risks (rows) across years (columns). A square
    // marks a year with a definition; its size, like Commitment's, is the share of the
    // definition that changed from the latest earlier one. An outline is a first definition.
    const host = document.getElementById("fig-conceptual");
    if (!host) return;
    const state = { company: "", type: "", order: "change", minYears: 2 };
    const cos = [...new Set(data.items.map(i => i.company))].sort();
    host.innerHTML = "";
    const controls = document.createElement("div");
    controls.className = "v2-controls";
    controls.append(
      select("Company", [{ value: "", label: "All companies" }, ...cos.map(c => ({ value: c, label: c }))], "",
        v => { state.company = v; draw(); }),
      select("Show", [{ value: "", label: "Conducts and risks" }, { value: "conduct", label: "Conducts" },
                      { value: "risk", label: "Risks" }], "", v => { state.type = v; draw(); }),
      select("Concepts", [{ value: "2", label: "defined in two years or more" }, { value: "1", label: "all" }], "2",
        v => { state.minYears = +v; draw(); }),
      select("Order", [{ value: "change", label: "most changed first" }, { value: "alpha", label: "alphabetical" },
                       { value: "first", label: "first defined first" }], "change", v => { state.order = v; draw(); }));
    host.appendChild(controls);
    const scroller = document.createElement("div");
    scroller.className = "v2-matrix-scroll";
    host.appendChild(scroller);

    function draw() {
      let items = data.items.filter(i => (!state.company || i.company === state.company)
        && (!state.type || i.type === state.type) && Object.keys(i.years).length >= state.minYears);
      items.sort(state.order === "alpha" ? (a, b) => a.item.localeCompare(b.item)
        : state.order === "first" ? (a, b) => Object.keys(a.years).sort()[0].localeCompare(Object.keys(b.years).sort()[0])
        : (a, b) => (b.mean_change ?? -1) - (a.mean_change ?? -1));
      if (!items.length) { scroller.innerHTML = '<p class="fig2-note">No concept is defined in more than one year for this selection.</p>'; return; }
      const yrs = [...new Set(items.flatMap(i => Object.keys(i.years)))].sort();
      let html = `<table class="fig2-matrix v2-cc-grid"><thead><tr><th></th>${state.company ? "" : "<th></th>"}`
        + yrs.map(y => `<th class="v2-cc-year">${y}</th>`).join("") + `<th class="v2-cc-year">mean</th></tr></thead><tbody>`;
      items.forEach((it, r) => {
        html += `<tr><th class="fig2-matrix-row">${esc(it.item)} <em>${it.type}</em></th>`
          + (state.company ? "" : `<td class="v2-cc-co">${esc(it.company)}</td>`);
        yrs.forEach(y => {
          if (!it.years[y]) { html += "<td></td>"; return; }
          const v = it.changes[y];
          const px = v == null ? 8 : Math.round(8 + v * 22);
          html += `<td class="v2-cc-cell" data-r="${r}" data-y="${y}"><span class="v2-cc-sq${v == null ? " first" : ""}" style="width:${px}px;height:${px}px"></span></td>`;
        });
        html += `<td class="v2-cc-mean">${it.mean_change == null ? "—" : Math.round(it.mean_change * 100) + "%"}</td></tr>`;
      });
      scroller.innerHTML = html + "</tbody></table>";
      scroller.querySelectorAll(".v2-cc-cell").forEach(td => {
        const it = items[+td.dataset.r], y = td.dataset.y;
        const show = e => {
          const years = Object.keys(it.years).sort(), i = years.indexOf(y);
          const prev = i > 0 ? it.years[years[i - 1]][0] : null, cur = it.years[y][0];
          const text = prev && window.wordDiffV2 ? window.wordDiffV2(prev.quote, cur.quote) : esc(cur.quote);
          tip.show(`<b>${esc(it.item)}</b> · ${esc(it.company)} · ${y}<br>`
            + (prev ? `${Math.round(it.changes[y] * 100)}% changed since ${years[i - 1]}` : "first definition")
            + `<div class="cc-text">${text}</div><span class="fig2-tip-who">${esc(cur.title)}, p. ${cur.page}</span>`, e);
        };
        td.addEventListener("mouseenter", show);
        td.addEventListener("mousemove", show);
        td.addEventListener("mouseleave", tip.hide);
      });
    }
    draw();
    const note = document.createElement("p");
    note.className = "fig2-note";
    note.innerHTML = "Each row is one conduct or risk as one company defines it, each column a year in which "
      + "it does so. The square's size, on the same scale as Commitment, is the share of the definition that "
      + "changed since the company's latest earlier definition of the same concept: every definition of the "
      + "year is compared with the closest earlier one, word by word (1 − the share of words in common, in "
      + "order), and averaged. An outline marks the first definition. Hover a square to see what was struck "
      + "and what was added. Concepts are matched across documents by their harmonised names.";
    host.appendChild(note);
  }

  // ── Boot ───────────────────────────────────────────────────────
  sidebarToggle();
  // Actor colours come from data.json, which app.js applies to CSS variables.
  getJSON("data.json").then(d => {
    window.COLOR_VAR_V2 = (d && d.actor_colors) || {};
    getJSON("training_matrix.json").then(t => t && trainingFigure(t.records));
    getJSON("benchmark_matrix.json").then(b => b && benchmarkFigure(b.records));
  });
  getJSON("ai_sentences.json").then(wordTree);
  getJSON("conceptual_change.json").then(conceptual);
})();
