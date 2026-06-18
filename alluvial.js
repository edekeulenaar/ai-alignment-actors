/* ============================================================================
   alluvial.js — actor-coverage alluvial:
       Country → Type (harmonised) → Mentioned in AI training documents (Yes/No)
   Style ported from the PhD chapter-1 Sankey (pastel ribbons by left root).
   ========================================================================= */
(function () {
  "use strict";
  const HOST_SEL = "#alluvial";
  if (!document.querySelector(HOST_SEL)) return;

  const ALLUVIAL_PASTELS = [
    "#f3e09e", "#aed9c4", "#f0a87b", "#cdd5da", "#dde5d5",
    "#f4cda9", "#cbb9e0", "#a3b8d1", "#f0c0c8", "#c5dbb1",
    "#e3c9ad", "#b8c8b2", "#e6a8a8", "#c8d6b6", "#d8c8e0",
  ];
  const GAP = 6;
  const STAGE_HEADERS = { 0: "Country", 1: "Type", 2: "Mentioned in training docs" };

  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function alluvialPath(d) {
    const x0 = d.source.x1 + GAP, x1 = d.target.x0 - GAP;
    const y0 = d.y0, y1 = d.y1, xc = (x0 + x1) / 2;
    return `M${x0},${y0} C${xc},${y0} ${xc},${y1} ${x1},${y1}`;
  }

  // Hover-card for a ribbon: source → target, count, and up to 5 example actors
  // (with their country) so the reader sees *which* actors flow through it.
  function linkCardHtml(d) {
    // Dedupe by actor name (a few actors have duplicate rows).
    const seen = new Set();
    const members = (d.members || []).filter(m => {
      const k = (m.name || "").toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k); return true;
    }).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    const showCountry = d.source.depth !== 0;   // country already implied on the left
    const lis = members.slice(0, 5).map(m => {
      const where = (showCountry && m.country && m.country !== "Unknown")
        ? ` <span class="al-where">— ${esc(m.country)}</span>` : "";
      return `<li>${esc(m.name)}${where}</li>`;
    }).join("");
    const more = members.length > 5 ? `<li class="al-more">+ ${members.length - 5} more</li>` : "";
    return `<div class="dc-t">${esc(d.source.name)} → ${esc(d.target.name)}</div>` +
      `<div class="dc-row"><span>Actors</span> ${d3.format(",")(d.value)}</div>` +
      (members.length ? `<ul class="al-list">${lis}${more}</ul>` : "");
  }

  // Minimal hover-card reusing the page's #data-card element.
  const card = (() => {
    const el = () => document.getElementById("data-card");
    let hideT = null;
    const pos = (n, ev) => {
      const r = n.getBoundingClientRect(), pad = 12;
      let x = ev.clientX + pad, y = ev.clientY + pad;
      if (x + r.width > innerWidth - 6) x = ev.clientX - r.width - pad;
      if (y + r.height > innerHeight - 6) y = ev.clientY - r.height - pad;
      n.style.left = (x + scrollX) + "px"; n.style.top = (y + scrollY) + "px";
    };
    return {
      show(html, ev) { const c = el(); if (!c) return; clearTimeout(hideT);
        c.innerHTML = html; c.hidden = false; pos(c, ev); },
      move(ev) { const c = el(); if (c && !c.hidden) pos(c, ev); },
      hide() { hideT = setTimeout(() => { const c = el(); if (c) c.hidden = true; }, 150); },
    };
  })();

  fetch("alluvial.json?v=" + (window.STACK_DATA_VERSION || Date.now()))
    .then(r => r.json()).then(render).catch(e => console.warn("alluvial.json:", e));

  function render(data) {
    const STAGES = data.stages || ["country", "type", "mentioned"];
    const rows = data.rows || [];

    // Build nodes + links (value = number of actors along each adjacent edge).
    const N = new Map(), L = new Map();
    const node = (name, stage) => {
      const k = `s${stage}::${name}`;
      if (!N.has(k)) N.set(k, { id: k, name, stage });
      return k;
    };
    rows.forEach(r => {
      const path = STAGES.map((f, i) => node(r[f] || "(unknown)", i));
      const member = { name: r.name || "(unnamed)", country: r.country || "Unknown",
                       type: r.type || "", mentioned: r.mentioned || "" };
      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i], b = path[i + 1], k = `${a}|${b}`;
        let e = L.get(k);
        if (!e) { e = { source: a, target: b, value: 0, members: [] }; L.set(k, e); }
        e.value += 1;
        e.members.push(member);
      }
    });
    const nodes = [...N.values()];
    const links = [...L.values()];

    const host = d3.select(HOST_SEL); host.selectAll("*").remove();
    if (!links.length) { host.append("div").attr("class", "placeholder").text("No data."); return; }

    const W = Math.max(700, host.node().clientWidth || 880);
    const NODE_PAD = 9, TOP_PAD = 42, LEFT_GUTTER = 200, RIGHT_GUTTER = 230;
    const colCount = d3.max(d3.rollups(nodes, v => v.length, n => n.stage), d => d[1]) || 1;
    const H = Math.max(560, TOP_PAD + 40 + colCount * NODE_PAD * 2.4);

    const svg = host.append("svg").attr("class", "sankey alluvial")
      .attr("viewBox", [0, 0, W, H]).attr("preserveAspectRatio", "xMidYMid meet")
      .attr("width", "100%").attr("height", "auto");

    const sk = d3.sankey().nodeId(d => d.id).nodeWidth(10).nodePadding(NODE_PAD)
      .nodeAlign(d => d.stage)
      .extent([[LEFT_GUTTER, TOP_PAD], [W - RIGHT_GUTTER, H - 18]]);
    const g = sk({ nodes: nodes.map(n => ({ ...n })), links: links.map(l => ({ ...l })) });

    // Pastel ribbons coloured by the left-most root (Country).
    const leftNames = [...new Set(g.nodes.filter(n => n.depth === 0).map(n => n.name))].sort();
    const palette = d3.scaleOrdinal().domain(leftNames).range(ALLUVIAL_PASTELS);
    function rootName(n) {
      let cur = n;
      while (cur && cur.depth > 0) {
        const inb = (cur.targetLinks || []).slice().sort((a, b) => b.value - a.value)[0];
        if (!inb) break; cur = inb.source;
      }
      return cur && cur.depth === 0 ? cur.name : null;
    }

    const linkSel = svg.append("g").selectAll("path").data(g.links).join("path")
      .attr("class", "link").attr("d", alluvialPath).attr("fill", "none")
      .attr("stroke", d => {
        const root = d.source.depth === 0 ? d.source.name : rootName(d.source);
        return root ? palette(root) : "#cdd5da";
      })
      .attr("stroke-width", d => Math.max(1, d.width))
      .on("mouseenter", (e, d) => card.show(linkCardHtml(d), e))
      .on("mousemove", e => card.move(e))
      .on("mouseleave", () => card.hide());

    const maxDepth = d3.max(g.nodes, n => n.depth);
    const nodeSel = svg.append("g").selectAll("g").data(g.nodes).join("g").attr("class", "node");
    nodeSel.append("rect")
      .attr("x", d => d.x0).attr("y", d => d.y0)
      .attr("height", d => Math.max(2, d.y1 - d.y0)).attr("width", d => d.x1 - d.x0)
      .attr("class", d => d.depth === maxDepth
        ? (d.name.toLowerCase() === "yes" ? "term term-yes" : "term term-no") : "")
      .on("mouseenter", (e, d) => card.show(
        `<div class="dc-t">${esc(d.name)}</div>
         <div class="dc-row"><span>Actors</span> ${d3.format(",")(d.value || 0)}</div>`, e))
      .on("mousemove", e => card.move(e))
      .on("mouseleave", () => card.hide())
      .on("click", (e, d) => highlight(d));

    // Labels: first column → left of rect, others → right.
    const isFirst = d => d.depth === 0;
    const labelX = d => isFirst(d) ? d.x0 - GAP - 2 : d.x1 + GAP + 2;
    const anchorOf = d => isFirst(d) ? "end" : "start";
    const LBL_MAX = 34;
    const trunc = s => s.length > LBL_MAX ? s.slice(0, LBL_MAX - 1).trimEnd() + "…" : s;
    const labels = nodeSel.append("text").attr("class", "node-label")
      .attr("text-anchor", anchorOf).attr("x", labelX).attr("y", d => (d.y0 + d.y1) / 2);
    labels.append("tspan").attr("class", "lbl-name")
      .attr("x", labelX).attr("dy", "0.32em").text(d => trunc(d.name));
    labels.append("tspan").attr("class", "lbl-count")
      .text(d => `  ${d.value || 0}`);
    nodeSel.append("title").text(d => `${d.name} — ${d.value || 0} actors`);

    // Italic stage headers at the top of each column.
    const stageMid = new Map();
    g.nodes.forEach(n => { if (!stageMid.has(n.depth)) stageMid.set(n.depth, (n.x0 + n.x1) / 2); });
    svg.append("g").attr("class", "stage-headers").selectAll("text")
      .data([...stageMid.keys()].sort((a, b) => a - b)).join("text")
      .attr("x", d => d === 0 ? stageMid.get(d) - 8 : (d === maxDepth ? stageMid.get(d) + 8 : stageMid.get(d)))
      .attr("y", 22)
      .attr("text-anchor", d => d === 0 ? "end" : (d === maxDepth ? "start" : "middle"))
      .text(d => STAGE_HEADERS[d] || `Stage ${d}`);

    // Click-to-highlight one node's ribbons.
    let pinned = null;
    function highlight(d) {
      if (!d || pinned === d.id) { pinned = null; clear(); return; }
      pinned = d.id;
      linkSel.classed("hi", l => l.source.id === d.id || l.target.id === d.id)
             .classed("dim", l => l.source.id !== d.id && l.target.id !== d.id);
      nodeSel.classed("dim", n => n.id !== d.id &&
        !g.links.some(l => (l.source.id === d.id && l.target.id === n.id) ||
                           (l.target.id === d.id && l.source.id === n.id)));
    }
    function clear() { linkSel.classed("hi", false).classed("dim", false); nodeSel.classed("dim", false); }
    svg.on("click", e => { if (e.target.tagName === "svg") { pinned = null; clear(); } });
  }
})();
