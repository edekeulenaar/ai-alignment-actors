// Stack view: actor enrolment across alignment-stack layers.
// Colour palette comes from data.json (actor_colors), shared with app.js.

const STACK_ACTOR_COLOR = { "unknown": "#C8C8C8", "Multiple": "#E69FC1", "Other": "#BABABA" };

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

// Cache-buster shared with app.js (read from this script's own ?v= param) so
// the stack view never serves a stale data.json.
const STACK_DATA_VERSION =
  (document.querySelector('script[src*="stacks.js"]') || {}).src?.split("v=")[1] || Date.now();

if (document.getElementById("stack-svg")) {
  fetch("data.json?v=" + STACK_DATA_VERSION).then(r => r.json()).then(d => {
    DATA = d;
    if (d.actor_colors) Object.assign(STACK_ACTOR_COLOR, d.actor_colors);
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
  const register = (actorName, actorType, role, company, layer, pid, quote) => {
    if (!actorName) return;
    // Keep the canonical category casing ("Government agency") so it matches
    // the colour palette and the legend.
    const t = (actorType || "unknown").trim() || "unknown";

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
        mentionsByLayer: {
          conducts: 0, risks: 0, trainings: 0, benchmarks: 0,
        },
        docsByLayer: {
          conducts: new Set(), risks: new Set(),
          trainings: new Set(), benchmarks: new Set(),
        },
        rolesByLayer: {
          conducts: new Set(), risks: new Set(),
          trainings: new Set(), benchmarks: new Set(),
        },
        quotesByLayer: {
          conducts: [], risks: [], trainings: [], benchmarks: [],
        },
      });
    }
    const node = g.nodes.get(actorName);
    node.layers.add(layer);
    node._mentionCount = (node._mentionCount || 0) + 1;
    node.mentionsByLayer[layer] = (node.mentionsByLayer[layer] || 0) + 1;  // per-component frequency
    if (role) node.rolesByLayer[layer].add(role);
    if (quote && node.quotesByLayer[layer].length < 3 &&
        !node.quotesByLayer[layer].includes(quote)) {
      node.quotesByLayer[layer].push(quote);   // evidence for placement
    }
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
      // Evidence quote for why an actor sits in this component.
      const quote = (item.definition || item.verbatim ||
                     (item.name ? `Benchmark: ${item.name}` : "") ||
                     (item.item ? `${key}: ${item.item}` : "")).trim();

      // (1) The row-level "primary" actor — most precisely credited.
      const rawName = (item[fields.name] || "").trim();
      const rawType = (item[fields.type] || "").trim();
      if (rawName) {
        rawName.split("|").map(s => s.trim()).filter(Boolean).forEach(an => {
          pubIds.forEach(pid =>
            register(an, rawType, "specific", item.company, key, pid, quote));
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
                                    item.company, key, pid, quote);
        });
        (doc.cited_actors || []).forEach(a => {
          if (a && a.name) register(a.name.trim(), a.type, "cited",
                                    item.company, key, pid, quote);
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

  // Sort groups by total node count, take top N. When grouping by type, the
  // "Multiple" and "Other" buckets are not meaningful stacks — drop them.
  const EXCLUDE = new Set(["Multiple", "Other", "unknown"]);
  const stacks = [...groups.entries()]
    .map(([k, v]) => ({ key: k, ...v, total: v.nodes.size }))
    .filter(s => s.total > 0)
    .filter(s => !(groupBy === "type" && EXCLUDE.has(s.key)))
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
  const TITLE_H   = 72;          // room for title + subtitle + first-layer label
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
    // aligned with the plane's top-left corner (x = SKEW). Three lines
    // stacked: TITLE / N actors / first-layer label.
    g.append("text").attr("class", "stack-title")
      .attr("x", SKEW).attr("y", TITLE_H - 50)
      .text(stack.label.toUpperCase());
    g.append("text").attr("class", "stack-sub")
      .attr("x", SKEW).attr("y", TITLE_H - 32)
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

      // Layer label sits on its own line above each plane's top-left.
      g.append("text").attr("class", "plane-label")
        .attr("x", SKEW).attr("y", planeY - 8).text(label);

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
      // Co-mention links WITHIN this component: two actors named together in the
      // same document. They are NOT drawn — they only feed the force layout so
      // that actors frequently mentioned together cluster close on the plane.
      const intra = stack.intraEdges[key].filter(e =>
        actorSet.has(e.source) && actorSet.has(e.target));

      // Local rect layout via d3-force.
      const W = PLANE_W, H = PLANE_H;
      const nodes = actors.map((a, i) => ({
        name: a.name, type: a.type,
        x: (i * 37) % W,
        y: (i * 53) % H,
      }));
      const links = intra.map(e => ({ source: e.source, target: e.target, weight: e.weight || 1 }));

      // Per-node radius — sqrt-scaled by the actor's mention frequency WITHIN
      // this component (conducts / risks / training / benchmarks), so a more
      // frequently-named actor shows a bigger circle on that plane.
      const N = nodes.length;
      const rMin = N > 80 ? 2.4 : N > 40 ? 2.8 : 3.2;
      const rMax = N > 80 ? 9   : N > 40 ? 11  : 13;
      const counts = nodes.map(n => {
        const fn = stack.nodes.get(n.name);
        return (fn && fn.mentionsByLayer && fn.mentionsByLayer[key]) || 1;
      });
      const cMax = Math.max(2, ...counts);
      nodes.forEach((n, i) => {
        const t = Math.sqrt(counts[i]) / Math.sqrt(cMax);
        n.r = rMin + (rMax - rMin) * t;
      });

      const linkDist = N > 80 ? 22 : N > 40 ? 26 : 32;
      const charge   = N > 80 ? -16 : N > 40 ? -22 : -30;

      if (nodes.length) {
        const wMax = Math.max(1, ...links.map(l => l.weight || 1));
        const sim = d3.forceSimulation(nodes)
          .force("charge", d3.forceManyBody().strength(charge))
          // Co-mentioned actors pull together; more shared documents = shorter,
          // stronger spring, so frequent co-mentions cluster tightly.
          .force("link", d3.forceLink(links).id(d => d.name)
            .distance(d => linkDist * (1 - 0.5 * ((d.weight || 1) / wMax)))
            .strength(d => Math.min(0.9, 0.3 + 0.6 * ((d.weight || 1) / wMax))))
          .force("center", d3.forceCenter(W / 2, H / 2))
          .force("collide", d3.forceCollide().radius(d => d.r + 1.5).strength(0.9))
          .stop();
        for (let i = 0; i < 300; i++) sim.tick();
        nodes.forEach(n => {
          const pad = n.r + 2;
          n.x = Math.max(pad, Math.min(W - pad, n.x));
          n.y = Math.max(pad, Math.min(H - pad, n.y));
        });
      }

      // Map local (x,y) into the parallelogram.
      const project = (lx, ly) => {
        const shift = SKEW * (1 - ly / H);
        return [lx + shift, planeY + ly];
      };

      // (Within-plane co-mention links are NOT drawn — they only cluster the
      // layout. Visible edges connect the same actor across components.)

      // Compute degree per node from this plane's co-mention links. The most-
      // connected actors get their labels rendered by default; everyone
      // else can be revealed by hover. Tie-break by mention count.
      const degree = new Map();
      links.forEach(e => {
        const sName = typeof e.source === "object" ? e.source.name : e.source;
        const tName = typeof e.target === "object" ? e.target.name : e.target;
        degree.set(sName, (degree.get(sName) || 0) + 1);
        degree.set(tName, (degree.get(tName) || 0) + 1);
      });
      const topNames = new Set(
        [...nodes]
          .sort((a, b) => {
            const da = degree.get(a.name) || 0;
            const db = degree.get(b.name) || 0;
            if (da !== db) return db - da;
            const ca = (stack.nodes.get(a.name)?._mentionCount) || 0;
            const cb = (stack.nodes.get(b.name)?._mentionCount) || 0;
            return cb - ca;
          })
          .slice(0, 10)
          .map(n => n.name)
      );

      // Compute node screen positions and stash for cross-layer edges.
      // Defer drawing until after the inter-edge FRONT group is added, so
      // nodes always sit on top of every inter-edge.
      const nodesProjected = nodes.map(n => {
        const [px, py] = project(n.x, n.y);
        positions[n.name] = positions[n.name] || {};
        positions[n.name][key] = { x: px, y: py };
        return { n, px, py };
      });
      layerNodes[key] = { key, nodesProjected, topNames };
    });

    // Inter-edge FRONT group — appended AFTER every plane slab is drawn, so
    // it paints over the slab fronts/tops near the target node.
    const interFrontG = g.append("g").attr("class", "inter-front");

    // Cross-plane edges between successive layers for the same actor. The
    // split point is the y of the TARGET plane's top edge — anything
    // ABOVE that y is the BACK half (hidden by every slab whose
    // footprint it crosses, including the source); anything BELOW is the
    // FRONT half (painted only over the target slab). This guarantees
    // the front half never appears above its target slab, which used to
    // happen when we split at the midpoint.
    if (showCross) {
      const layerIdx = Object.fromEntries(LAYERS.map((l, i) => [l.key, i]));
      const planeTopY = (li) => TITLE_H + li * (PLANE_H + PLANE_GAP);

      Object.entries(positions).forEach(([name, layerPos]) => {
        const ordered = LAYERS.map(l => l.key).filter(k => layerPos[k]);
        if (ordered.length < 2) return;
        for (let i = 0; i < ordered.length - 1; i++) {
          const a = layerPos[ordered[i]];
          const b = layerPos[ordered[i + 1]];

          const targetY = planeTopY(layerIdx[ordered[i + 1]]);
          const t = Math.max(0, Math.min(1, (targetY - a.y) / (b.y - a.y)));
          const mx = a.x + (b.x - a.x) * t;
          const my = targetY;

          interBackG.append("line").attr("class", "inter-edge inter-back-seg")
            .attr("data-actor-name", name)
            .attr("data-stack", stack.key)
            .attr("x1", a.x).attr("y1", a.y)
            .attr("x2", mx).attr("y2", my);
          interFrontG.append("line").attr("class", "inter-edge inter-front-seg")
            .attr("data-actor-name", name)
            .attr("data-stack", stack.key)
            .attr("x1", mx).attr("y1", my)
            .attr("x2", b.x).attr("y2", b.y);
        }
      });
    }

    // Finally, draw nodes — appended last so they sit above every edge,
    // whether back-segment or front-segment.
    const nodesG = g.append("g").attr("class", "nodes-top");

    // Shared hover-label per stack — one <text> element we reposition as
    // the cursor moves over unlabeled nodes. Created first, raised last
    // so it draws above all permanent labels.
    const hoverText = nodesG.append("text")
      .attr("class", "node-label hover-label")
      .style("display", "none")
      .style("pointer-events", "none");

    const truncate = name => name.length > 32 ? name.slice(0, 31) + "…" : name;

    Object.values(layerNodes).forEach(({ key, nodesProjected, topNames }) => {
      const isCitedOnlyLayer = (n) => {
        const r = n.rolesByLayer && n.rolesByLayer[key];
        if (!r) return false;
        return r.has("cited") && !r.has("specific") && !r.has("author");
      };
      nodesProjected.forEach(({ n, px, py }) => {
        const fullNode = stack.nodes.get(n.name);
        const baseColor = groupBy === "type"
          ? stack.color
          : (STACK_ACTOR_COLOR[n.type] || "#888");
        const citedOnly = isCitedOnlyLayer(fullNode);
        const r = n.r || 4;

        // Persistent labels are off by default. The "Show labels" toggle
        // turns them on for every node; either way, hovering an unlabeled
        // node still reveals its name transiently.
        const hasPermanentLabel = showLabels;

        nodesG.append("circle")
          .attr("class", citedOnly ? "node node-cited" : "node")
          .attr("data-actor-name", n.name)
          .attr("data-stack", stack.key)
          .attr("data-layer", key)
          .attr("cx", px).attr("cy", py).attr("r", r)
          .attr("fill", citedOnly ? "#ffffff" : baseColor)
          .attr("stroke", citedOnly ? baseColor : "#1a1a1a")
          .attr("stroke-width", citedOnly ? 1.4 : 0.7)
          .on("mouseover", ev => {
            showTip(ev, fullNode, key, stack.label);
            if (!hasPermanentLabel) {
              hoverText
                .attr("x", px + r + 3).attr("y", py + 3)
                .text(truncate(n.name))
                .style("display", null);
              hoverText.raise();
            }
          })
          .on("mouseout", () => {
            scheduleHideTip();
            hoverText.style("display", "none");
          })
          .on("mousemove", ev => moveTip(ev))
          .on("click", ev => { ev.stopPropagation(); selectActor(n.name); });

        if (hasPermanentLabel) {
          nodesG.append("text").attr("class", "node-label")
            .attr("x", px + r + 3).attr("y", py + 3)
            .text(truncate(n.name));
        }
      });
    });
  });
}

// ────────────────────────────────────────────────────────────────
// Click-to-highlight: focus an actor's full sub-network across the
// stack. Highlighted = the clicked actor (everywhere it appears),
// every co-mention edge it touches inside any plane, every actor on
// the other end of those edges, and every cyan vertical line linking
// the actor across layers. Everything else dims.
// ────────────────────────────────────────────────────────────────
let _selectedActor = null;

function selectActor(actorName) {
  if (_selectedActor === actorName) { clearSelection(); return; }
  _selectedActor = actorName;
  const svg = document.getElementById("stack-svg");
  if (!svg) return;
  svg.classList.add("has-selection");

  // First pass: mark intra-edges where this actor is an endpoint, and
  // collect the names of the actors on the other end (the neighbours).
  const neighbours = new Set();
  svg.querySelectorAll(".intra-edge").forEach(e => {
    const s = e.getAttribute("data-source");
    const t = e.getAttribute("data-target");
    const hit = (s === actorName) || (t === actorName);
    e.classList.toggle("hl", hit);
    if (hit) neighbours.add(s === actorName ? t : s);
  });

  // Cross-layer (cyan) edges of this actor — both back and front halves.
  svg.querySelectorAll(".inter-edge").forEach(e => {
    e.classList.toggle("hl", e.getAttribute("data-actor-name") === actorName);
  });

  // Nodes: the actor itself = primary highlight; neighbours = secondary.
  svg.querySelectorAll(".node").forEach(el => {
    const name = el.getAttribute("data-actor-name");
    el.classList.remove("hl", "hl-related");
    if (name === actorName) el.classList.add("hl");
    else if (neighbours.has(name)) el.classList.add("hl-related");
  });

  // Show a small banner with the selection + a Clear control.
  showSelectionBanner(actorName, neighbours.size);
}

function clearSelection() {
  _selectedActor = null;
  const svg = document.getElementById("stack-svg");
  if (!svg) return;
  svg.classList.remove("has-selection");
  svg.querySelectorAll(".hl, .hl-related").forEach(el => {
    el.classList.remove("hl"); el.classList.remove("hl-related");
  });
  hideSelectionBanner();
}

function showSelectionBanner(actorName, neighbourCount) {
  let banner = document.getElementById("stack-selection-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "stack-selection-banner";
    const block = document.getElementById("block-stacks");
    const svg = document.getElementById("stack-svg");
    (block || svg.parentNode).insertBefore(banner, svg);
  }
  banner.innerHTML =
    `<span class="sel-label">Selected:</span> ` +
    `<strong>${escapeHtml(actorName)}</strong> ` +
    `<span class="sel-meta">(${neighbourCount} direct co-mention neighbour` +
    `${neighbourCount === 1 ? "" : "s"})</span>` +
    `<button type="button" id="stack-clear-sel">Clear</button>`;
  banner.style.display = "flex";
  document.getElementById("stack-clear-sel")
    .addEventListener("click", clearSelection);
}
function hideSelectionBanner() {
  const banner = document.getElementById("stack-selection-banner");
  if (banner) banner.style.display = "none";
}

// Background click on the SVG clears the selection.
document.addEventListener("DOMContentLoaded", () => {
  const svg = document.getElementById("stack-svg");
  if (svg) {
    svg.addEventListener("click", ev => {
      if (ev.target.tagName !== "circle") clearSelection();
    });
  }
});
document.addEventListener("keydown", ev => {
  if (ev.key === "Escape" && _selectedActor) clearSelection();
});

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
  const quotes = (node.quotesByLayer && node.quotesByLayer[layer]) || [];
  const cap = layer.charAt(0).toUpperCase() + layer.slice(1);
  let html =
    `<h4>${escapeHtml(node.name)}</h4>` +
    `<div class="st-sub">${escapeHtml(node.type)} &middot; in the ${escapeHtml(stackLabel)} stack</div>` +
    `<dt>Role on ${escapeHtml(cap)}</dt><dd>${escapeHtml(roleLabel)}</dd>`;
  if (quotes.length) {
    html += `<dt>Relevant passages</dt><dd>` +
      quotes.slice(0, 2).map(q => {
        const t = q.length > 220 ? q.slice(0, 219) + "…" : q;
        return `<div class="quote">"${escapeHtml(t)}"</div>`;
      }).join("") + `</dd>`;
  }
  html += `<dt>Mentioned in (${escapeHtml(cap)})</dt><dd>`;
  if (docIds.length) {
    html += `<ul class="st-docs">`;
    docIds.slice(0, 10).forEach(id => {
      const doc = DOC_BY_ID.get(id);
      html += `<li>${doc ? docLine(doc) : escapeHtml(id)}</li>`;
    });
    if (docIds.length > 10) html += `<li class="st-more">… and ${docIds.length - 10} more</li>`;
    html += "</ul>";
  } else {
    html += `<span class="tl-meta">(no documents linked)</span>`;
  }
  html += `</dd>`;
  if (otherLayers.length) {
    html += `<dt>Also enrolled at</dt><dd>` +
      otherLayers.map(l => {
        const n = node.docsByLayer[l].size;
        const lc = l.charAt(0).toUpperCase() + l.slice(1);
        return `${escapeHtml(lc)} (${n})`;
      }).join(" &middot; ") + `</dd>`;
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
