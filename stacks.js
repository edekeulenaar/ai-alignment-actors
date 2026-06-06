// Stack view: actor enrolment across alignment-stack layers.
// Mirrors the colour palette from app.js.

const STACK_ACTOR_COLOR = {
  "internal":                     "#7585BE",
  "private":                      "#80C2CA",
  "academic":                     "#EFCE44",
  "research institute":           "#ECB280",
  "governmental":                 "#8EDE78",
  "nonprofit":                    "#ADD672",
  "public":                       "#53B3AD",
  "public consultation":          "#53B3AD",
  "ai company":                   "#6DA5D8",
  "industry consortium":          "#BECF54",
  "public benefit corporation":   "#9193C4",
  "public deliberation platform": "#4146C3",
  "multiple":                     "#E69FC1",
  "other":                        "#BABABA",
  "unknown":                      "#BABABA",
};

const LAYERS = [
  { key: "conducts",   label: "Conducts" },
  { key: "risks",      label: "Risks" },
  { key: "trainings",  label: "Training" },
  { key: "benchmarks", label: "Benchmarks" },
];

// Per-layer field for the actor whose involvement we record.
const ACTOR_FIELDS = {
  conducts:   { name: "specific_actor", type: "specific_actor_type" },
  risks:      { name: "specific_actor", type: "specific_actor_type" },
  trainings:  { name: "actor",          type: "actor_type" },
  benchmarks: { name: "author",         type: "author_type" },
};

let DATA = null;
let DOC_BY_ID = new Map();

if (document.getElementById("stack-svg")) {
  fetch("data.json").then(r => r.json()).then(d => {
    DATA = d;
    DOC_BY_ID = new Map(d.documents.map(doc => [doc.id, doc]));
    init();
  });
}

function init() {
  const sel = document.getElementById("stack-company-filter");
  if (!sel) return;
  DATA.companies.map(c => c.name).sort().forEach(c => {
    const o = document.createElement("option");
    o.value = c; o.textContent = c; sel.appendChild(o);
  });
  ["stack-group-by", "stack-company-filter", "stack-topn", "stack-cap",
   "stack-show-labels", "stack-show-cross", "stack-show-cited"].forEach(id =>
    document.getElementById(id).addEventListener("change", render));
  render();
}

// Walk every layer item and collect, per group key, per layer:
//   actor nodes (name, type), and document → actors map for edges.
function buildModel(groupBy, companyFilter) {
  // groups :: Map<groupKey, {
  //    color, label,
  //    nodes: Map<actorName, {name, type, layers:Set}>,
  //    docLayerActors: { layerKey: Map<pubId, Set<actorName>> } }>
  const groups = new Map();

  const ensure = (key, color, label) => {
    if (!groups.has(key)) {
      groups.set(key, {
        color, label,
        nodes: new Map(),
        docLayerActors: {
          conducts: new Map(), risks: new Map(),
          trainings: new Map(), benchmarks: new Map(),
        },
      });
    }
    return groups.get(key);
  };

  // Helper to register an (actor, layer, doc) tuple under the right group.
  const register = (actorName, actorType, role, company, layer, pid) => {
    if (!actorName) return;
    const t = (actorType || "unknown").toLowerCase().trim() || "unknown";

    let groupKey, color, label;
    if (groupBy === "type") {
      groupKey = t;
      color = STACK_ACTOR_COLOR[t] || "#888";
      label = t;
    } else {
      groupKey = company || "unknown";
      color = null;
      label = company || "unknown";
    }
    const g = ensure(groupKey, color, label);
    if (!g.nodes.has(actorName)) {
      g.nodes.set(actorName, {
        name: actorName, type: t,
        layers: new Set(),
        docsByLayer: {
          conducts: new Set(), risks: new Set(),
          trainings: new Set(), benchmarks: new Set(),
        },
        rolesByLayer: {
          conducts: new Set(), risks: new Set(),
          trainings: new Set(), benchmarks: new Set(),
        },
      });
    }
    const node = g.nodes.get(actorName);
    node.layers.add(layer);
    node._mentionCount = (node._mentionCount || 0) + 1;
    if (role) node.rolesByLayer[layer].add(role);
    if (pid) {
      node.docsByLayer[layer].add(pid);
      if (!g.docLayerActors[layer].has(pid))
        g.docLayerActors[layer].set(pid, new Set());
      g.docLayerActors[layer].get(pid).add(actorName);
    }
  };

  LAYERS.forEach(({ key }) => {
    const fields = ACTOR_FIELDS[key];
    DATA[key].forEach(item => {
      if (companyFilter && item.company !== companyFilter) return;
      const pubIds = (item.pub_ids && item.pub_ids.length)
        ? item.pub_ids : [null];

      // (1) The row-level "primary" actor — most precisely credited.
      const rawName = (item[fields.name] || "").trim();
      const rawType = (item[fields.type] || "").trim().toLowerCase();
      if (rawName) {
        rawName.split("|").map(s => s.trim()).filter(Boolean).forEach(an => {
          pubIds.forEach(pid =>
            register(an, rawType, "specific", item.company, key, pid));
        });
      }

      // (2) Every actor named on the documents that produced this item —
      //     authors and cited parties alike. This is the inclusion criterion
      //     the user asked for: if mentioned in a given stack, they appear.
      (item.pub_ids || []).forEach(pid => {
        const doc = DOC_BY_ID.get(pid);
        if (!doc) return;
        (doc.author_actors || []).forEach(a => {
          if (a && a.name) register(a.name.trim(), a.type, "author",
                                    item.company, key, pid);
        });
        (doc.cited_actors || []).forEach(a => {
          if (a && a.name) register(a.name.trim(), a.type, "cited",
                                    item.company, key, pid);
        });
      });
    });
  });

  // Build intra-plane edges from doc co-occurrence.
  groups.forEach(g => {
    g.intraEdges = {};
    LAYERS.forEach(({ key }) => {
      const counts = new Map();
      g.docLayerActors[key].forEach(set => {
        const arr = [...set];
        for (let i = 0; i < arr.length; i++)
          for (let j = i + 1; j < arr.length; j++) {
            const [a, b] = [arr[i], arr[j]].sort();
            const k = a + "" + b;
            counts.set(k, (counts.get(k) || 0) + 1);
          }
      });
      g.intraEdges[key] = [...counts].map(([k, w]) => {
        const [s, t] = k.split("");
        return { source: s, target: t, weight: w };
      });
    });
  });

  return groups;
}

function render() {
  const groupBy        = document.getElementById("stack-group-by").value;
  const companyFilter  = document.getElementById("stack-company-filter").value;
  const topN           = parseInt(document.getElementById("stack-topn").value);
  const cap            = parseInt(document.getElementById("stack-cap").value);
  const showLabels     = document.getElementById("stack-show-labels").checked;
  const showCross      = document.getElementById("stack-show-cross").checked;
  const showCited      = document.getElementById("stack-show-cited").checked;

  const groups = buildModel(groupBy, companyFilter);

  // Sort groups by total node count, take top N.
  const stacks = [...groups.entries()]
    .map(([k, v]) => ({ key: k, ...v, total: v.nodes.size }))
    .filter(s => s.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, topN);

  // Geometry. Stacks are laid out in a grid (default 3 columns) so each
  // stack can be wider and the actor nodes inside it readable.
  const COLS      = Math.min(stacks.length, 3);
  const ROWS      = Math.max(1, Math.ceil(stacks.length / COLS));
  const STACK_W   = 480;
  const STACK_GAP = 48;
  const ROW_GAP   = 80;
  const PLANE_W   = 400;
  const PLANE_H   = 140;
  const PLANE_GAP = 110;
  const SKEW      = 90;          // horizontal offset of top vs bottom
  const THICK     = 16;          // slab thickness (3D depth)
  const TITLE_H   = 56;          // room for two-line title above first plane
  const MARGIN_X  = 32;
  const MARGIN_Y  = 24;

  const STACK_H   = TITLE_H + LAYERS.length * PLANE_H
                  + (LAYERS.length - 1) * PLANE_GAP + THICK + 20;

  const totalW = MARGIN_X * 2 + COLS * STACK_W
                 + Math.max(0, COLS - 1) * STACK_GAP;
  const totalH = MARGIN_Y * 2 + ROWS * STACK_H
                 + Math.max(0, ROWS - 1) * ROW_GAP;

  const svg = d3.select("#stack-svg")
    .attr("viewBox", `0 0 ${totalW} ${totalH}`)
    .attr("preserveAspectRatio", "xMidYMin meet");
  svg.selectAll("*").remove();

  // Build legend.
  const legendDiv = d3.select("#stack-legend").html("");
  if (groupBy === "type") {
    stacks.forEach(s => {
      legendDiv.append("span").attr("class", "legend-item").html(
        `<span class="legend-swatch" style="background:${s.color}"></span>${s.label} (${s.total})`
      );
    });
  } else {
    // Node colours by actor type, regardless of group.
    const seen = new Set();
    stacks.forEach(s => s.nodes.forEach(n => seen.add(n.type)));
    [...seen].sort().forEach(t => {
      legendDiv.append("span").attr("class", "legend-item").html(
        `<span class="legend-swatch" style="background:${STACK_ACTOR_COLOR[t] || "#888"}"></span>${t}`
      );
    });
  }

  stacks.forEach((stack, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const stackX = MARGIN_X + col * (STACK_W + STACK_GAP);
    const stackY = MARGIN_Y + row * (STACK_H + ROW_GAP);
    const g = svg.append("g").attr("transform", `translate(${stackX}, ${stackY})`);

    // Stack title block sits at the top-left of the first plane,
    // aligned with the plane's top-left corner (x = SKEW).
    g.append("text").attr("class", "stack-title")
      .attr("x", SKEW).attr("y", TITLE_H - 26)
      .text(stack.label.toUpperCase());
    g.append("text").attr("class", "stack-sub")
      .attr("x", SKEW).attr("y", TITLE_H - 10)
      .text(`${stack.total} actor${stack.total === 1 ? "" : "s"}`);

    // Two inter-edge groups so we can weave cross-layer lines THROUGH the
    // stack: the BACK group is created BEFORE any plane slab is appended
    // (slabs paint over it → hides the line near the source node, giving
    // the "outgoing beneath the stack" look); the FRONT group is appended
    // AFTER all plane slabs (paints over the slabs at the target end →
    // "incoming above the stack"). We split each inter-edge at its midpoint
    // so one half lands in each group.
    const interBackG  = g.append("g").attr("class", "inter-back");

    // Positions stored per actor across layers, for cross-plane edges.
    const positions = {}; // { actorName: { layerKey: {x,y} } }
    const layerNodes = {};

    LAYERS.forEach(({ key, label }, li) => {
      const planeY = TITLE_H + li * (PLANE_H + PLANE_GAP);

      // Top-face corners.
      const tl = [SKEW,           planeY];
      const tr = [SKEW + PLANE_W, planeY];
      const br = [PLANE_W,        planeY + PLANE_H];
      const bl = [0,              planeY + PLANE_H];
      // Bottom-face corners (slab underside, THICK below top face).
      const tl2 = [tl[0], tl[1] + THICK];
      const tr2 = [tr[0], tr[1] + THICK];
      const br2 = [br[0], br[1] + THICK];
      const bl2 = [bl[0], bl[1] + THICK];
      const poly = pts => pts.map(p => p.join(",")).join(" ");

      // Soft drop shadow on the ground (below the slab).
      g.append("polygon").attr("class", "plane-shadow")
        .attr("transform", `translate(6, ${THICK + 4})`)
        .attr("points", poly([tl, tr, br, bl]));

      // Front face (visible long edge along the front of the slab).
      g.append("polygon").attr("class", "plane-front")
        .attr("points", poly([bl, br, br2, bl2]));
      // Right side face.
      g.append("polygon").attr("class", "plane-right")
        .attr("points", poly([br, tr, tr2, br2]));
      // Top face (where the nodes live).
      g.append("polygon").attr("class", "plane-top")
        .attr("points", poly([tl, tr, br, bl]));

      // Layer label: for the first plane, place it inline with the stack
      // subtitle (after "39 actors") so the user sees e.g.
      //   PRIVATE
      //   39 actors  Conducts
      // For subsequent planes the label sits just above the plane top-left.
      if (li === 0) {
        // Push past the "N actors" subtitle width (rough monospace estimate).
        const subText = `${stack.total} actor${stack.total === 1 ? "" : "s"}`;
        const subWidth = subText.length * 7.5;
        g.append("text").attr("class", "plane-label")
          .attr("x", SKEW + subWidth + 22).attr("y", TITLE_H - 10)
          .text(label);
      } else {
        g.append("text").attr("class", "plane-label")
          .attr("x", SKEW).attr("y", planeY - 8).text(label);
      }

      // Helper: is this actor only "cited" on this layer (no specific/author role)?
      const isCitedOnly = (n) => {
        const r = n.rolesByLayer && n.rolesByLayer[key];
        if (!r) return false;
        return r.has("cited") && !r.has("specific") && !r.has("author");
      };

      // Actors on this layer; optionally exclude cited-only.
      let actors = [...stack.nodes.values()].filter(n => n.layers.has(key));
      if (!showCited) actors = actors.filter(n => !isCitedOnly(n));
      if (actors.length > cap) {
        // Prefer non-cited-only actors when capping; then by mention count.
        actors = actors
          .sort((a, b) => {
            const aw = isCitedOnly(a) ? 0 : 1;
            const bw = isCitedOnly(b) ? 0 : 1;
            if (aw !== bw) return bw - aw;
            return (b._mentionCount || 0) - (a._mentionCount || 0);
          })
          .slice(0, cap);
      }
      const actorSet = new Set(actors.map(a => a.name));
      const intra = stack.intraEdges[key].filter(e =>
        actorSet.has(e.source) && actorSet.has(e.target));

      // Local rect layout via d3-force.
      const W = PLANE_W, H = PLANE_H;
      const nodes = actors.map((a, i) => ({
        name: a.name, type: a.type,
        x: (i * 37) % W,
        y: (i * 53) % H,
      }));
      const links = intra.map(e => ({ source: e.source, target: e.target }));

      // Scale node radius and forces with crowding.
      const N = nodes.length;
      const radius = N > 80 ? 3 : N > 40 ? 4 : 5;
      const linkDist = N > 80 ? 18 : N > 40 ? 22 : 28;
      const charge = N > 80 ? -10 : N > 40 ? -16 : -22;

      if (nodes.length) {
        const sim = d3.forceSimulation(nodes)
          .force("charge", d3.forceManyBody().strength(charge))
          .force("link", d3.forceLink(links).id(d => d.name).distance(linkDist).strength(0.45))
          .force("center", d3.forceCenter(W / 2, H / 2))
          .force("collide", d3.forceCollide(radius + 1.5))
          .stop();
        for (let i = 0; i < 240; i++) sim.tick();
        const pad = radius + 2;
        nodes.forEach(n => {
          n.x = Math.max(pad, Math.min(W - pad, n.x));
          n.y = Math.max(pad, Math.min(H - pad, n.y));
        });
      }

      // Map local (x,y) into the parallelogram.
      const project = (lx, ly) => {
        const shift = SKEW * (1 - ly / H);
        return [lx + shift, planeY + ly];
      };

      // Draw intra edges first.
      const edgeG = g.append("g");
      links.forEach(e => {
        const s = nodes.find(n => n.name === (e.source.name || e.source));
        const t = nodes.find(n => n.name === (e.target.name || e.target));
        if (!s || !t) return;
        const [sx, sy] = project(s.x, s.y);
        const [tx, ty] = project(t.x, t.y);
        edgeG.append("line").attr("class", "intra-edge")
          .attr("x1", sx).attr("y1", sy)
          .attr("x2", tx).attr("y2", ty);
      });

      // Compute node screen positions and stash for cross-layer edges.
      // Defer drawing until after the inter-edge FRONT group is added, so
      // nodes always sit on top of every inter-edge.
      const nodesProjected = nodes.map(n => {
        const [px, py] = project(n.x, n.y);
        positions[n.name] = positions[n.name] || {};
        positions[n.name][key] = { x: px, y: py };
        return { n, px, py };
      });
      layerNodes[key] = { key, nodesProjected };
    });

    // Inter-edge FRONT group — appended AFTER every plane slab is drawn, so
    // it paints over the slab fronts/tops near the target node.
    const interFrontG = g.append("g").attr("class", "inter-front");

    // Cross-plane edges between successive layers for the same actor, split
    // at the midpoint so the source half lives in the BACK group (gets
    // hidden by the source slab) and the target half lives in the FRONT
    // group (paints over the target slab). The line therefore weaves
    // through the stack — leaving each slab beneath, arriving at the next
    // above.
    if (showCross) {
      Object.entries(positions).forEach(([name, layerPos]) => {
        const ordered = LAYERS.map(l => l.key).filter(k => layerPos[k]);
        if (ordered.length < 2) return;
        for (let i = 0; i < ordered.length - 1; i++) {
          const a = layerPos[ordered[i]];
          const b = layerPos[ordered[i + 1]];
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          interBackG.append("line").attr("class", "inter-edge inter-back-seg")
            .attr("x1", a.x).attr("y1", a.y)
            .attr("x2", mx).attr("y2", my);
          interFrontG.append("line").attr("class", "inter-edge inter-front-seg")
            .attr("x1", mx).attr("y1", my)
            .attr("x2", b.x).attr("y2", b.y);
        }
      });
    }

    // Finally, draw nodes — appended last so they sit above every edge,
    // whether back-segment or front-segment.
    const nodesG = g.append("g").attr("class", "nodes-top");
    Object.values(layerNodes).forEach(({ key, nodesProjected }) => {
      const isCitedOnlyLayer = (n) => {
        const r = n.rolesByLayer && n.rolesByLayer[key];
        if (!r) return false;
        return r.has("cited") && !r.has("specific") && !r.has("author");
      };
      const N = nodesProjected.length;
      const radius = N > 80 ? 3 : N > 40 ? 4 : 5;
      nodesProjected.forEach(({ n, px, py }) => {
        const fullNode = stack.nodes.get(n.name);
        const baseColor = groupBy === "type"
          ? stack.color
          : (STACK_ACTOR_COLOR[n.type] || "#888");
        const citedOnly = isCitedOnlyLayer(fullNode);
        nodesG.append("circle")
          .attr("class", citedOnly ? "node node-cited" : "node")
          .attr("cx", px).attr("cy", py).attr("r", radius)
          .attr("fill", citedOnly ? "#ffffff" : baseColor)
          .attr("stroke", citedOnly ? baseColor : "#1a1a1a")
          .attr("stroke-width", citedOnly ? 1.4 : 0.7)
          .on("mouseover", ev => showTip(ev, fullNode, key, stack.label))
          .on("mouseout", scheduleHideTip)
          .on("mousemove", ev => moveTip(ev));
        if (showLabels) {
          nodesG.append("text").attr("class", "node-label")
            .attr("x", px + 7).attr("y", py + 3)
            .text(n.name.length > 28 ? n.name.slice(0, 27) + "…" : n.name);
        }
      });
    });
  });
}

const tip = document.getElementById("stack-tooltip");
let _hideTimer = null;
tip.addEventListener("mouseenter", () => { if (_hideTimer) clearTimeout(_hideTimer); });
tip.addEventListener("mouseleave", scheduleHideTip);

function showTip(ev, node, layer, stackLabel) {
  if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null; }
  const docIds = node.docsByLayer && node.docsByLayer[layer]
    ? [...node.docsByLayer[layer]] : [];
  // Also list documents on OTHER layers, to show full enrolment.
  const otherLayers = LAYERS.map(l => l.key).filter(k =>
    k !== layer && node.docsByLayer && node.docsByLayer[k] && node.docsByLayer[k].size);

  const docLine = doc => {
    const safeTitle = escapeHtml(doc.title || doc.id);
    const yr = doc.year ? ` (${escapeHtml(doc.year)})` : "";
    const meta = doc.company ? ` <em style="color:#555">— ${escapeHtml(doc.company)}, ${escapeHtml(doc.pub_type || "")}</em>` : "";
    return doc.url
      ? `<a href="${escapeHtml(doc.url)}" target="_blank" rel="noopener">${safeTitle}</a>${yr}${meta}`
      : `${safeTitle}${yr}${meta}`;
  };

  const roles = node.rolesByLayer && node.rolesByLayer[layer]
    ? [...node.rolesByLayer[layer]] : [];
  const ROLE_LABEL = {
    specific: "explicitly credited",
    author:   "document author",
    cited:    "cited",
  };
  let roleLabel;
  if (!roles.length) roleLabel = "mentioned";
  else if (roles.length === 1 && roles[0] === "cited") roleLabel = "cited only";
  else roleLabel = roles.map(r => ROLE_LABEL[r] || r).join(", ");
  let html =
    `<strong>${escapeHtml(node.name)}</strong><br>` +
    `<span style="color:#555">type: ${escapeHtml(node.type)} · stack: ${escapeHtml(stackLabel)}</span>` +
    `<div class="tip-section">Role on ${layer}: ${escapeHtml(roleLabel)}</div>` +
    `<div class="tip-section">Mentioned in (${layer})</div>`;
  if (docIds.length) {
    html += "<ul>";
    docIds.slice(0, 10).forEach(id => {
      const doc = DOC_BY_ID.get(id);
      html += `<li>${doc ? docLine(doc) : escapeHtml(id)}</li>`;
    });
    if (docIds.length > 10) html += `<li>… and ${docIds.length - 10} more</li>`;
    html += "</ul>";
  } else {
    html += `<div style="color:#888;font-size:10px">(no documents linked)</div>`;
  }
  if (otherLayers.length) {
    html += `<div class="tip-section">Also enrolled at</div><div>` +
      otherLayers.map(l => {
        const n = node.docsByLayer[l].size;
        return `${l} (${n})`;
      }).join(" · ") + `</div>`;
  }

  tip.innerHTML = html;
  tip.style.opacity = 1;
  moveTip(ev);
}
function moveTip(ev) {
  // Keep tooltip on-screen.
  const pad = 14;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let left = ev.pageX + pad;
  let top  = ev.pageY + pad;
  if (left + w > window.scrollX + window.innerWidth - 8)
    left = ev.pageX - w - pad;
  if (top + h > window.scrollY + window.innerHeight - 8)
    top = ev.pageY - h - pad;
  tip.style.left = left + "px";
  tip.style.top  = top  + "px";
}
function scheduleHideTip() {
  if (_hideTimer) clearTimeout(_hideTimer);
  _hideTimer = setTimeout(() => { tip.style.opacity = 0; }, 250);
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
