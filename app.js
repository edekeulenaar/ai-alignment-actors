/* ════════════════════════════════════════════════════════════════
   The actors in AI alignment — interactions
   ════════════════════════════════════════════════════════════════ */

const COLOR_VAR = {
  "internal":                     "var(--c-internal)",
  "private":                      "var(--c-private)",
  "academic":                     "var(--c-academic)",
  "research institute":           "var(--c-research-institute)",
  "governmental":                 "var(--c-governmental)",
  "nonprofit":                    "var(--c-nonprofit)",
  "public":                       "var(--c-public)",
  "public consultation":          "var(--c-public-consultation)",
  "ai company":                   "var(--c-ai-company)",
  "industry consortium":          "var(--c-industry-consortium)",
  "public benefit corporation":   "var(--c-public-benefit-corporation)",
  "public deliberation platform": "var(--c-public-deliberation-platform)",
  "multiple":                     "var(--c-multiple)",
  "other":                        "var(--c-other)",
  "unknown":                      "var(--c-unknown)",
};

const DOC_TYPE_CLASS = {
  "Model card": "t-model-card",   "Model Card":      "t-model-card",
  "Company policy": "t-company-policy",
  "Principle":      "t-principle",
  "Grant":          "t-grant",
  "Initiative":     "t-initiative",
  "Report":         "t-report",
  "Research":       "t-research",
  "Research paper": "t-research-paper",
  "Framework":      "t-framework",
  "Announcement":   "t-announcement",
  "Audit":          "t-audit",
  "Other: Legislation": "t-legislation",
  "Legislation":    "t-legislation",
};
const docTypeKey = t => DOC_TYPE_CLASS[t] || "t-other";

const DOC_TYPE_LABEL = {
  "t-model-card":      "Model card",
  "t-company-policy":  "Company policy",
  "t-principle":       "Principle / charter",
  "t-grant":           "Grant",
  "t-initiative":      "Initiative",
  "t-report":          "Report",
  "t-research-paper":  "Research paper",
  "t-research":        "Research paper",
  "t-framework":       "Framework",
  "t-announcement":    "Announcement / blog",
  "t-audit":           "Audit",
  "t-legislation":     "Legislation",
  "t-other":           "Other",
};

const STATE = {
  data:               null,
  selectedActorTypes: new Set(),
  actorChipMode:      {},        // type → 0 (off), 1 (credited), 2 (collaborated)
  selectedYears:      new Set(),
  selectedCountries:  new Set(),
  selectedCompanies:  new Set(),
  selectedModels:     new Set(),
  selectionHL:        null,           // {type:'documents'|'conducts'|..., id:'...'}
  catSelection:      null,            // {block, category}
  pinned:             false,
  sortMode:           { conducts:"quantity", risks:"quantity", training:"quantity", benchmark:"quantity" },
  showAllCats:        { conducts:false, risks:false, training:false, benchmark:false, uses:false },
  showAllCompanies:   false,
  maxCats:            10,
  viewNamed:          false,
  searchTerm:         "",
  cluster:            { kind: "conducts", id: null },
  iconCache:          {},              // doc-type-class → URL or false
};

// ── Boot ──────────────────────────────────────────────────────────
// Cache-bust data.json with the same build tag as the script — keeps it in sync
const DATA_VERSION = (document.querySelector('script[src*="app.js"]')||{}).src?.split("v=")[1] || Date.now();
fetch("data.json?v=" + DATA_VERSION).then(r => r.json()).then(data => {
  STATE.data = data;
  buildSidebar(data);
  wireSortBars();
  renderAll();
  wireCardDismiss();
  setupScrollSpy();
  const vn = document.getElementById("view-named");
  if (vn) vn.addEventListener("change", e => {
    STATE.viewNamed = e.target.checked;
    document.body.classList.toggle("view-named", STATE.viewNamed);
    renderAll();
  });
  const sac = document.getElementById("show-all-cos");
  if (sac) sac.addEventListener("change", e => {
    STATE.showAllCompanies = e.target.checked;
    renderAll();
  });

  // Misuses toggle: show / hide the entire Misuses block
  const vu = document.getElementById("view-misuses");
  if (vu) vu.addEventListener("change", e => {
    document.body.classList.toggle("hide-misuses", !e.target.checked);
  });

  // Search bar
  const si = document.getElementById("search-input");
  if (si) {
    let timer = null;
    si.addEventListener("input", e => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        STATE.searchTerm = e.target.value.trim().toLowerCase();
        refreshSelectionState();
      }, 120);
    });
  }

  // ESC clears all selections + search
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    STATE.selectionHL = null;
    STATE.catSelection = null;
    STATE.searchTerm = "";
    STATE.pinned = false;
    STATE.selectedActorTypes.clear();
    STATE.actorChipMode = {};
    if (si) si.value = "";
    CARD().classList.add("hidden");
    CARD().classList.remove("pinned");
    refreshSelectionState();
  });

  setupClusters();
  setupTopActors();
});

// ── Sidebar pieces ────────────────────────────────────────────────
function buildSidebar(data) {
  // Legend
  const legend = document.getElementById("legend");
  // Merge "public consultation" into "public" (single colour now)
  const visibleTypes = data.actor_types.filter(t => t !== "public consultation");
  visibleTypes.forEach(t => {
    const el = document.createElement("div");
    el.className = "legend-chip"; el.dataset.type = t;
    el.innerHTML = `<span class="swatch" style="background:${COLOR_VAR[t]||'#ccc'}"></span>${t}<span class="chip-mode"></span>`;
    el.addEventListener("click", () => {
      // 3-state cycle: off → CREDITED → COLLABORATED → off
      const cur = STATE.actorChipMode[t] || 0;
      const next = (cur + 1) % 3;
      STATE.actorChipMode[t] = next;
      if (next === 0) STATE.selectedActorTypes.delete(t);
      else            STATE.selectedActorTypes.add(t);
      refreshSelectionState();
    });
    legend.appendChild(el);
  });

  // Filters
  fillMulti("filter-year",    data.years,    "selectedYears");
  fillMulti("filter-country", data.countries,"selectedCountries", true);
  fillMulti("filter-company", data.companies.map(c => c.name), "selectedCompanies", true);
  const allModels = [...new Set(data.companies.flatMap(c => c.models))].filter(Boolean).sort();
  fillMulti("filter-model",   allModels,     "selectedModels");

  document.getElementById("reset-filters").onclick = resetAll;

  // Companies list — one per row, "|" treated as a unit (no splitting)
  const ul = document.getElementById("company-list");
  const docCount = Object.fromEntries(data.companies.map(c => [c.name, 0]));
  data.documents.forEach(d => { if (docCount[d.company] != null) docCount[d.company]++; });
  const sorted = [...data.companies].sort((a,b)=>(docCount[b.name]||0)-(docCount[a.name]||0));
  sorted.forEach(c => {
    const li = document.createElement("li");
    li.dataset.company = c.name;
    li.innerHTML = `${c.name}<span class="ct"> · ${docCount[c.name]||0}</span>`;
    li.title = c.country || "";
    li.addEventListener("click", () => {
      const cb = document.querySelector(`#filter-company input[value="${cssEscape(c.name)}"]`);
      if (!cb) return;
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    });
    ul.appendChild(li);
  });
}

function fillMulti(containerId, values, stateKey, rerender=false) {
  const cont = document.getElementById(containerId);
  cont.innerHTML = "";
  values.forEach(v => {
    if (!v) return;
    const lbl = document.createElement("label");
    lbl.innerHTML = `<input type="checkbox" value="${escapeAttr(v)}"> <span>${escape(v)}</span>`;
    cont.appendChild(lbl);
    lbl.querySelector("input").addEventListener("change", e => {
      const set = STATE[stateKey];
      if (e.target.checked) set.add(v); else set.delete(v);
      syncCompanyListActive();
      if (rerender) renderAll();
      refreshSelectionState();
    });
  });
}

function syncCompanyListActive() {
  document.querySelectorAll("#company-list li").forEach(li => {
    li.classList.toggle("active", STATE.selectedCompanies.has(li.dataset.company));
  });
}

function resetAll() {
  STATE.selectedActorTypes.clear();
  STATE.actorChipMode = {};
  STATE.selectedYears.clear();
  STATE.selectedCountries.clear();
  STATE.selectedCompanies.clear();
  STATE.selectedModels.clear();
  STATE.selectionHL = null;
  STATE.catSelection = null;
  STATE.pinned = false;
  document.querySelectorAll(".filters input[type=checkbox]").forEach(c => c.checked = false);
  document.querySelectorAll(".legend-chip").forEach(c => c.classList.remove("active"));
  document.querySelectorAll(".cat-label").forEach(c => c.classList.remove("active"));
  document.querySelectorAll(".sq, .doc").forEach(el => el.classList.remove("hl"));
  document.body.classList.remove("has-selection");
  document.getElementById("info-card").classList.add("hidden");
  syncCompanyListActive();
  renderAll();
}

// ── Sort bars ─────────────────────────────────────────────────────
function wireSortBars() {
  document.querySelectorAll("[data-sort-for]").forEach(sel => {
    sel.addEventListener("change", e => {
      STATE.sortMode[sel.dataset.sortFor] = e.target.value;
      renderAll();
    });
  });
}

// ── Document-type key ─────────────────────────────────────────────
function buildDocKey() {
  const k = document.getElementById("doc-key");
  Object.entries(DOC_TYPE_LABEL).forEach(([cls, label]) => {
    const it = document.createElement("div");
    it.className = "key-item";
    it.innerHTML = `<span class="doc ${cls}"></span>${label}`;
    k.appendChild(it);
  });
  applyCustomIcons(k);
}

// ── Visible companies (rows) ──────────────────────────────────────
function visibleCompanies() {
  let cos = STATE.data.companies.slice();
  if (STATE.selectedCountries.size)
    cos = cos.filter(c => STATE.selectedCountries.has(c.country));
  if (STATE.selectedCompanies.size)
    cos = cos.filter(c => STATE.selectedCompanies.has(c.name));
  // Sort by document count desc
  const docCount = Object.fromEntries(cos.map(c => [c.name, 0]));
  STATE.data.documents.forEach(d => { if (docCount[d.name] != null || docCount[d.company] != null) docCount[d.company] = (docCount[d.company]||0)+1; });
  cos.sort((a,b) => (docCount[b.name]||0) - (docCount[a.name]||0));
  return cos;
}

// ── Render all blocks ────────────────────────────────────────────
const TOP_N_PER_BLOCK = 10;

function topCompaniesBy(items) {
  // All companies represented in this block, sorted by item count.
  // Respects country/company filters, and the "Show all companies" toggle.
  const counts = {};
  items.forEach(it => counts[it.company] = (counts[it.company]||0)+1);
  let cos = Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([c])=>c);
  if (STATE.selectedCompanies.size) cos = cos.filter(c => STATE.selectedCompanies.has(c));
  if (STATE.selectedCountries.size) {
    const ok = new Set(STATE.data.companies.filter(c => STATE.selectedCountries.has(c.country)).map(c=>c.name));
    cos = cos.filter(c => ok.has(c));
  }
  return STATE.showAllCompanies ? cos : cos.slice(0, TOP_N_PER_BLOCK);
}
const countryOf = name => (STATE.data.companies.find(c=>c.name===name)||{}).country || "";

function renderAll() {
  renderSources();
  renderItemBlock("conducts",  STATE.data.conducts || [],  {nameKey:"item"});
  renderItemBlock("risks",     STATE.data.risks    || [],  {nameKey:"item"});
  renderItemBlock("misuses",   STATE.data.misuses  || [],  {nameKey:"item"});
  renderItemBlock("training",  STATE.data.trainings || [], {nameKey:"item"});
  renderItemBlock("benchmark", STATE.data.benchmarks||[],  {nameKey:"name"});
  refreshClusterItems();
  refreshSelectionState();
}

// ── DOCUMENTS block: pub_type rows × top-N companies columns.
// Company policies are excluded here — they live in the Uses block.
function renderSources() {
  const grid = document.getElementById("grid-sources");
  grid.innerHTML = "";

  const nonPolicyDocs = STATE.data.documents.filter(d => !d.is_policy);
  const cos = topCompaniesBy(nonPolicyDocs);
  if (!cos.length) { grid.innerHTML = "<div class=meta>No companies match filters.</div>"; return; }

  // Group documents by pub_type
  const byType = {};
  nonPolicyDocs.forEach(d => {
    if (!cos.includes(d.company)) return;
    const t = d.pub_type || "Other";
    (byType[t] = byType[t] || []).push(d);
  });
  let types = Object.keys(byType).sort((a,b) => byType[b].length - byType[a].length);

  // Configure grid columns: label col + N company cols
  grid.style.gridTemplateColumns = `var(--label-w, 170px) repeat(${cos.length}, var(--col-w, 80px))`;

  // ── Sticky header row ──
  const hSpacer = document.createElement("div");
  hSpacer.className = "co-head spacer";
  grid.appendChild(hSpacer);
  cos.forEach(co => grid.appendChild(coHeadCell(co)));

  // ── pub_type rows ──
  types.forEach(t => {
    const lbl = document.createElement("div");
    lbl.className = "cat-row-label";
    lbl.textContent = t;
    grid.appendChild(lbl);
    cos.forEach(co => {
      const cell = document.createElement("div");
      cell.className = "cat-cell docs-cell";
      byType[t].filter(d => d.company === co)
        .sort((a,b)=> (a.year||"").localeCompare(b.year||""))
        .forEach(d => cell.appendChild(makeDocIcon(d)));
      grid.appendChild(cell);
    });
  });
  applyCustomIcons(grid);
}

function coHeadCell(co) {
  const h = document.createElement("div");
  h.className = "co-head";
  h.innerHTML = `<div class="co-name">${escape(co)}</div><div class="country">${escape(countryOf(co)||"")}</div>`;
  h.addEventListener("click", () => {
    const cb = document.querySelector(`#filter-company input[value="${cssEscape(co)}"]`);
    if (!cb) return;
    cb.checked = !cb.checked;
    cb.dispatchEvent(new Event("change", { bubbles: true }));
  });
  return h;
}

// ── CONDUCTS / RISKS / TRAINING / BENCHMARK ──────────────────────
function renderItemBlock(blockId, items, opts) {
  const nameKey = opts.nameKey || "item";
  const grid    = document.getElementById("grid-" + blockId);
  grid.innerHTML = "";

  // Top-N companies for THIS block
  const cos = topCompaniesBy(items);
  if (window.console && blockId === "misuses") {
    console.log("[misuses] items:", items.length, "companies:", cos.length, cos);
  }

  // Group by category
  const byCat = {};
  items.forEach(it => {
    const cat = it.category || "Other";
    (byCat[cat] = byCat[cat] || []).push(it);
  });
  let cats = Object.keys(byCat);

  // ── Category sort ────────────────────────────────────────────────────
  const sortBy = STATE.sortMode[blockId] || "alpha";
  const yearByDocId = Object.fromEntries(
    STATE.data.documents.map(d => [d.id, parseInt(d.year) || 0])
  );
  const counts = Object.fromEntries(
    Object.entries(byCat).map(([k, v]) => [k, v.length])
  );
  // Two scores per category: max year (recency peak) and avg year (recency
  // mass). Sort by max with avg as tiebreaker so categories that are *mostly*
  // recent rank above ones with a single 2025 outlier in an older dataset.
  const yearStats = cat => {
    const ys = byCat[cat]
      .flatMap(it => (it.pub_ids || []).map(pid => yearByDocId[pid]))
      .filter(y => y > 0);
    if (!ys.length) return { max: 0, min: 9999, avg: 0 };
    const sum = ys.reduce((s, y) => s + y, 0);
    return { max: Math.max(...ys), min: Math.min(...ys), avg: sum / ys.length };
  };
  const cmp = (a, b, dir) => {
    const ya = yearStats(a), yb = yearStats(b);
    if (dir === "newest") {
      return (yb.max - ya.max) || (yb.avg - ya.avg) || (counts[b] - counts[a]) || a.localeCompare(b);
    }
    return (ya.min - yb.min) || (ya.avg - yb.avg) || (counts[b] - counts[a]) || a.localeCompare(b);
  };
  const applySort = (arr) => {
    if (sortBy === "alpha")    arr.sort();
    if (sortBy === "quantity") arr.sort((a, b) => counts[b] - counts[a]);
    if (sortBy === "newest")   arr.sort((a, b) => cmp(a, b, "newest"));
    if (sortBy === "oldest")   arr.sort((a, b) => cmp(a, b, "oldest"));
  };
  applySort(cats);

  // Truncate long category lists unless the user asked to expand.
  // Always pick top-N by quantity; then re-apply the user's sort over them.
  const totalCats = cats.length;
  if (!STATE.showAllCats[blockId] && totalCats > STATE.maxCats) {
    cats = [...cats].sort((a, b) => counts[b] - counts[a]).slice(0, STATE.maxCats);
    applySort(cats);
  }

  // ── "Showing N of M categories" + toggle ───────────────────────
  const bar = document.querySelector(`[data-sort-for="${blockId}"]`).closest(".sort-bar");
  let info = bar.querySelector(".cat-count");
  if (!info) {
    info = document.createElement("span");
    info.className = "cat-count";
    bar.appendChild(info);
  }
  if (totalCats > STATE.maxCats) {
    const allShown = STATE.showAllCats[blockId];
    info.innerHTML = `${cats.length} of ${totalCats} categories — `
      + `<a data-toggle="${blockId}">${allShown ? "show top "+STATE.maxCats : "show all"}</a>`;
    const link = info.querySelector("a");
    link.onclick = () => { STATE.showAllCats[blockId] = !allShown; renderAll(); };
  } else {
    info.textContent = `${cats.length} categories`;
  }

  // Grid: label col + one column per top-N company
  grid.style.gridTemplateColumns = `var(--label-w, 170px) repeat(${cos.length}, var(--col-w, 80px))`;

  // ── Sticky company header row ──────────────────────────────────
  const spacer = document.createElement("div");
  spacer.className = "co-head spacer";
  grid.appendChild(spacer);
  cos.forEach(co => grid.appendChild(coHeadCell(co)));

  // ── One row per category ───────────────────────────────────────
  cats.forEach(cat => {
    const lbl = document.createElement("div");
    lbl.className = "cat-row-label";
    lbl.textContent = cat;
    lbl.dataset.block = blockId; lbl.dataset.cat = cat;
    lbl.addEventListener("click", () => {
      if (STATE.catSelection && STATE.catSelection.block===blockId && STATE.catSelection.cat===cat) {
        STATE.catSelection = null;
      } else {
        STATE.catSelection = {block: blockId, cat};
        STATE.selectionHL = null;
      }
      refreshSelectionState();
    });
    grid.appendChild(lbl);

    cos.forEach(co => {
      const cell = document.createElement("div");
      cell.className = "cat-cell";
      cell.dataset.block = blockId; cell.dataset.cat = cat; cell.dataset.company = co;
      byCat[cat].filter(it => it.company === co)
                .forEach(it => cell.appendChild(makeSquare(it, blockId, nameKey)));
      grid.appendChild(cell);
    });
  });
}

function coLabel(c) {
  const el = document.createElement("div");
  el.className = "co-label";
  el.innerHTML = `${escape(c.name)}<br><span class="country">${escape(c.country||"")}</span>`;
  return el;
}

// ── Squares & doc icons ──────────────────────────────────────────
function makeSquare(item, blockId, nameKey) {
  const sq = document.createElement("div");
  sq.className = "sq";
  sq.dataset.type      = blockId;
  sq.dataset.id        = item.id;
  sq.dataset.category  = item.category || "";
  sq.dataset.actorType = item.actor_type || item.author_type || "unknown";
  // AUTHOR types = actor types of the source document(s)' authors (pub_author/company)
  // CITED  types = actor types named inside the document but not its author
  const authors = item.author_actor_types || item.credited_actor_types     || [];
  const cited   = item.cited_actor_types  || item.collaborated_actor_types || [];
  const all = item.all_actor_types || (item.actor_types && item.actor_types.length ? item.actor_types : [sq.dataset.actorType]);
  sq.dataset.actorTypes  = all.join("|");
  sq.dataset.authorTypes = authors.join("|");
  sq.dataset.citedTypes  = cited.join("|");
  const cssColor = COLOR_VAR[sq.dataset.actorType] || COLOR_VAR.unknown;
  sq.style.background = cssColor;                 // compact view
  sq.style.setProperty("--sq-bg", cssColor);      // named-view tint reads this
  if (STATE.viewNamed) sq.textContent = item[nameKey] || "";

  sq.addEventListener("mouseenter", e => showCard(itemToCard(item, blockId, nameKey), e));
  sq.addEventListener("mouseleave", hideCard);
  sq.addEventListener("click",  e => {
    e.stopPropagation();
    pinCard(itemToCard(item, blockId, nameKey), e);
    selectElement(blockId, item.id);
  });
  return sq;
}

function makeDocIcon(doc) {
  const el = document.createElement("div");
  const cls = docTypeKey(doc.pub_type);
  el.className = `doc ${cls}`;
  el.dataset.type      = "documents";
  el.dataset.id        = doc.id;
  el.dataset.actorType = doc.primary_actor_type;
  const docTypes = (doc.actor_types && doc.actor_types.length ? doc.actor_types : [doc.primary_actor_type]);
  el.dataset.actorTypes  = docTypes.join("|");
  // Author = types of pub_actors that match pub_author/company;
  // Cited  = types of pub_actors that DON'T match (external references named
  // inside the document). Both come from the build step.
  el.dataset.authorTypes = (doc.author_actor_types || []).join("|");
  el.dataset.citedTypes  = (doc.cited_actor_types  || []).join("|");
  el.style.color       = COLOR_VAR[doc.primary_actor_type] || COLOR_VAR.unknown;
  el.style.borderColor = COLOR_VAR[doc.primary_actor_type] || "var(--ink)";
  el.addEventListener("mouseenter", e => showCard(docToCard(doc), e));
  el.addEventListener("mouseleave", hideCard);
  el.addEventListener("click", e => {
    e.stopPropagation();
    pinCard(docToCard(doc), e);
    selectElement("documents", doc.id);
  });
  return el;
}

// If you drop SVGs into docs/icons/ they'll be used automatically.
function applyCustomIcons(scope) {
  scope.querySelectorAll(".doc").forEach(el => {
    const cls = [...el.classList].find(c => c.startsWith("t-"));
    if (!cls) return;
    if (STATE.iconCache[cls] === false) return;
    if (STATE.iconCache[cls]) {
      el.classList.add("has-svg");
      el.style.setProperty("--svg-url", `url("${STATE.iconCache[cls]}")`);
      return;
    }
    const url = `icons/doc-${cls.replace(/^t-/, "")}.svg`;
    fetch(url, {method:"HEAD"}).then(r => {
      if (r.ok) { STATE.iconCache[cls] = url; el.classList.add("has-svg"); el.style.setProperty("--svg-url",`url("${url}")`); }
      else      { STATE.iconCache[cls] = false; }
    }).catch(()=> STATE.iconCache[cls] = false);
  });
}

// ── Cards ────────────────────────────────────────────────────────
function docToCard(d) {
  const titleHtml = d.url
    ? `<a href="${d.url}" target="_blank">${escape(d.title)}</a>`
    : escape(d.title);
  return `
    <h4>${titleHtml}</h4>
    <dt>Year</dt><dd>${escape(d.year)}</dd>
    <dt>Type</dt><dd>${escape(d.pub_type)}${d.policy_type ? ` — ${escape(d.policy_type)}` : ""}</dd>
    <dt>Model</dt><dd>${escape(d.company_model || "—")}</dd>
    <dt>Authors</dt><dd>${escape(d.actors) || "—"}</dd>
    <dt>Defines</dt><dd>${d.conduct_ids.length} conduct(s), ${d.risk_ids.length} risk(s)</dd>
  `;
}
function typeChips(types) {
  if (!types || !types.length) return "—";
  return types.map(t => `<span class="type-chip" style="background:${COLOR_VAR[t]||'#ccc'}"></span>${escape(t)}`).join("&nbsp;&nbsp;");
}

// Build "Found in" lines: each source doc as link + the union of pages once
function foundInBlock(it) {
  const data = STATE.data;
  if (!it.pub_ids || !it.pub_ids.length) return "—";
  const pageStr = it.pages && it.pages.length ? it.pages.join(", ") : "";
  return it.pub_ids.map(pid => {
    const d = data.documents.find(x => x.id === pid);
    if (!d) return "";
    const link = d.url
      ? `<a href="${d.url}" target="_blank">${escape(d.title)}</a>`
      : escape(d.title);
    return `<div class="src-line">${link}${pageStr ? ` <span class="pg">p. ${escape(pageStr)}</span>` : ""}</div>`;
  }).filter(Boolean).join("");
}

// Aggregate AUTHOR and CITED actors (with their types) across an item's source docs.
function authorsAndCitedOf(it) {
  const data = STATE.data;
  const authors = new Map();   // name → type
  const cited   = new Map();
  (it.pub_ids || []).forEach(pid => {
    const d = data.documents.find(x => x.id === pid);
    if (!d) return;
    (d.author_actors || []).forEach(a => authors.set(a.name, a.type));
    (d.cited_actors  || []).forEach(a => cited.set(a.name, a.type));
  });
  if (it.specific_actor && !cited.has(it.specific_actor)) {
    cited.set(it.specific_actor, it.specific_actor_type || "unknown");
  }
  return {
    authors: [...authors.entries()].map(([name, type]) => ({ name, type })),
    cited:   [...cited.entries()  ].map(([name, type]) => ({ name, type })),
  };
}
function itemToCard(it, blockId, nameKey) {
  const found = foundInBlock(it);
  const { authors, cited } = authorsAndCitedOf(it);
  const evalLine = it.external_evaluator
    ? `<dt>External evaluator</dt><dd>${escape(it.external_evaluator)}</dd>` : "";

  if (blockId === "training") {
    const trainActors = pairsFrom(it.actor, it.actor_type_raw);
    return `
      <h4>${escape(it.item)}</h4>
      ${it.verbatim ? `<div class="quote">"${escape(snippet(it.verbatim, 220))}"</div>` : ""}
      <dt>Category</dt><dd>${escape(it.category)}</dd>
      <dt>Found in</dt><dd>${found}</dd>
      <dt>Done by</dt><dd>${actorPills(trainActors)}</dd>
      <dt>Author of doc</dt><dd>${actorPills(authors)}</dd>
      ${cited.length ? `<dt>Cited in doc</dt><dd>${actorPills(cited)}</dd>` : ""}`;
  }

  if (blockId === "benchmark") {
    const benchActors = pairsFrom(it.author, it.author_type_raw);
    return `
      <h4>${escape(it.name)}</h4>
      <dt>Category</dt><dd>${escape(it.category)}</dd>
      <dt>Found in</dt><dd>${found}</dd>
      <dt>Benchmark creator</dt><dd>${actorPills(benchActors)}</dd>
      <dt>Author of doc</dt><dd>${actorPills(authors)}</dd>
      ${cited.length ? `<dt>Cited in doc</dt><dd>${actorPills(cited)}</dd>` : ""}`;
  }

  // conduct / risk
  return `
    <h4>${escape(it.item)}</h4>
    ${it.definition ? `<div class="quote">"${escape(snippet(it.definition, 220))}"</div>` : ""}
    <dt>Found in</dt><dd>${found}</dd>
    <dt>Author</dt><dd>${actorPills(authors)}</dd>
    ${cited.length ? `<dt>Cited</dt><dd>${actorPills(cited)}</dd>` : ""}
    ${it.specific_actor ? `<dt>Defined by</dt><dd>${escape(it.specific_actor)} <span class="tl-meta">(${escape(it.specific_actor_type || "unknown")})</span></dd>` : ""}
    ${evalLine}`;
}
const snippet = (s,n) => !s ? "" : (s.length>n ? s.slice(0,n).trim()+"…" : s);
const escape  = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const escapeAttr = s => escape(s).replace(/"/g,"&quot;");
const cssEscape  = s => s.replace(/(["\\])/g, "\\$1");

const CARD = () => document.getElementById("info-card");
function showCard(html, e) { if (STATE.pinned) return; const c=CARD(); c.innerHTML=html; c.classList.remove("hidden"); positionCard(e); }
function hideCard()        { if (STATE.pinned) return; CARD().classList.add("hidden"); }
function pinCard(html, e)  { const c=CARD(); c.innerHTML = html + `<p style="margin:0.6em 0 0;font-size:11px;color:var(--muted)">click outside to dismiss</p>`; c.classList.remove("hidden"); c.classList.add("pinned"); STATE.pinned=true; positionCard(e); }
function positionCard(e)   { const c=CARD(); const x=e.clientX+14, y=e.clientY+14, W=c.offsetWidth, H=c.offsetHeight;
                              c.style.left=Math.min(x,window.innerWidth-W-8)+"px"; c.style.top=Math.min(y,window.innerHeight-H-8)+"px"; }
function wireCardDismiss() {
  document.addEventListener("click", e => {
    if (e.target.closest(".sq, .doc, .cat-label, .legend-chip, #company-list li, .info-card")) return;
    if (STATE.pinned) {
      STATE.pinned = false;
      CARD().classList.remove("pinned"); CARD().classList.add("hidden");
    }
    STATE.selectionHL = null;
    STATE.catSelection = null;
    document.querySelectorAll(".cat-label.active").forEach(el=>el.classList.remove("active"));
    refreshSelectionState();
  });
}

// ── Selection: highlight all linked elements ─────────────────────
// Re-clicking the same element clears the selection.
function selectElement(type, id) {
  const cur = STATE.selectionHL;
  if (cur && cur.type === type && cur.id === id) {
    STATE.selectionHL = null;
    STATE.pinned = false;
    CARD().classList.remove("pinned");
    CARD().classList.add("hidden");
  } else {
    STATE.selectionHL = { type, id };
    STATE.catSelection = null;
  }
  refreshSelectionState();
}

function gatherHighlightIds(sel) {
  const data = STATE.data;
  const out = { documents:new Set(), conducts:new Set(), risks:new Set(),
                training:new Set(),  benchmark:new Set() };
  if (!sel) return out;
  out[sel.type].add(sel.id);
  if (sel.type === "documents") {
    const d = data.documents.find(x => x.id === sel.id);
    if (d) {
      d.conduct_ids.forEach(i => out.conducts.add(i));
      d.risk_ids.forEach(i => out.risks.add(i));
      d.training_ids.forEach(i => out.training.add(i));
      d.benchmark_ids.forEach(i => out.benchmark.add(i));
    }
  }
  if (sel.type === "conducts" || sel.type === "risks") {
    const arr = sel.type === "conducts" ? data.conducts : data.risks;
    const it = arr.find(x => x.id === sel.id);
    if (it) {
      it.pub_ids.forEach(i => out.documents.add(i));
      it.training_ids.forEach(i => out.training.add(i));
      it.benchmark_ids.forEach(i => out.benchmark.add(i));
    }
  }
  if (sel.type === "training" || sel.type === "benchmark") {
    const arr = sel.type === "training" ? data.trainings : data.benchmarks;
    const it = arr.find(x => x.id === sel.id);
    if (it) {
      it.pub_ids.forEach(i => out.documents.add(i));
      it.conduct_ids.forEach(i => out.conducts.add(i));
      it.risk_ids.forEach(i => out.risks.add(i));
    }
  }
  return out;
}

// Category selection: highlight every item in that category + all its links.
function gatherCategoryHighlights() {
  const out = { documents:new Set(), conducts:new Set(), risks:new Set(),
                training:new Set(),  benchmark:new Set(), misuses:new Set() };
  const sel = STATE.catSelection;
  if (!sel) return out;
  const arr = sel.block === "conducts"  ? STATE.data.conducts
            : sel.block === "risks"     ? STATE.data.risks
            : sel.block === "training"  ? STATE.data.trainings
            : sel.block === "misuses"   ? STATE.data.conducts.concat(STATE.data.risks).filter(x => x.only_policy)
            : STATE.data.benchmarks;
  arr.filter(it => (it.category||"") === sel.cat).forEach(it => {
    out[sel.block].add(it.id);
    (it.pub_ids||[]).forEach(i => out.documents.add(i));
    if (it.conduct_ids)  it.conduct_ids.forEach(i => out.conducts.add(i));
    if (it.risk_ids)     it.risk_ids.forEach(i => out.risks.add(i));
    if (it.training_ids) it.training_ids.forEach(i => out.training.add(i));
    if (it.benchmark_ids)it.benchmark_ids.forEach(i => out.benchmark.add(i));
  });
  return out;
}

// ── Apply selection state to DOM ─────────────────────────────────
function refreshSelectionState() {
  const hasActor = STATE.selectedActorTypes.size > 0;
  const hasYear  = STATE.selectedYears.size > 0;
  const hasModel = STATE.selectedModels.size > 0;
  const hasClick = !!STATE.selectionHL;
  const hasCat   = !!STATE.catSelection;

  const hasSearch = !!STATE.searchTerm;
  const hasSelection = hasActor || hasYear || hasClick || hasModel || hasCat || hasSearch;
  document.body.classList.toggle("has-selection", hasSelection);

  // Build a search index lazily — flat lowercase blob per item
  const matchesSearch = (type, id) => {
    if (!hasSearch) return false;
    const data = STATE.data;
    const term = STATE.searchTerm;
    let it = null;
    if (type === "documents") it = data.documents.find(x => x.id === id);
    if (type === "conducts")  it = data.conducts.find(x => x.id === id);
    if (type === "risks")     it = data.risks.find(x => x.id === id);
    if (type === "misuses")   it = data.conducts.concat(data.risks).find(x => x.id === id);
    if (type === "training")  it = data.trainings.find(x => x.id === id);
    if (type === "benchmark") it = data.benchmarks.find(x => x.id === id);
    if (!it) return false;
    const blob = [
      it.title, it.item, it.name, it.category, it.definition, it.verbatim,
      it.actor, it.author, it.actors, it.specific_actor, it.external_evaluator,
      it.company, it.pub_type, (it.all_actor_types||[]).join(" "),
      (it.actor_types||[]).join(" ")
    ].filter(Boolean).join(" ").toLowerCase();
    return blob.includes(term);
  };

  document.querySelectorAll(".legend-chip").forEach(el => {
    const t = el.dataset.type;
    const mode = STATE.actorChipMode[t] || 0;
    el.classList.toggle("active", mode > 0);
    const lbl = el.querySelector(".chip-mode");
    if (lbl) lbl.textContent = mode === 1 ? "  AUTHOR" : mode === 2 ? "  + CITED" : "";
  });
  document.querySelectorAll(".cat-label").forEach(el => {
    el.classList.toggle("active",
      STATE.catSelection && STATE.catSelection.block===el.dataset.block && STATE.catSelection.cat===el.dataset.cat);
  });

  const clickIds = gatherHighlightIds(STATE.selectionHL);
  const catIds   = gatherCategoryHighlights();
  let docIdsByYearModel = null;
  if (hasYear || hasModel) {
    docIdsByYearModel = new Set(
      STATE.data.documents
        .filter(d => (!hasYear  || STATE.selectedYears.has(d.year)) &&
                     (!hasModel || STATE.selectedModels.has(d.company_model)))
        .map(d => d.id)
    );
  }

  document.querySelectorAll(".sq, .doc").forEach(el => {
    const type = el.dataset.type;
    const id   = el.dataset.id;
    const ats  = (el.dataset.actorTypes||"").split("|").filter(Boolean);

    let highlight;
    if (!hasSelection) {
      highlight = false;                // <-- key fix: nothing highlighted when no filter active
      el.classList.remove("hl");
      return;
    }
    highlight = false;

    if (hasClick && clickIds[type] && clickIds[type].has(id))      highlight = true;
    if (hasCat   && catIds[type]   && catIds[type].has(id))        highlight = true;
    if (hasSearch && matchesSearch(type, id))                      highlight = true;
    // 3-state actor chip matching:
    //   mode 1 (AUTHOR)         → this actor type AUTHORED the source document
    //   mode 2 (AUTHOR + CITED) → this actor type is anywhere on the item
    //                             (author OR cited)
    // For the "multiple" chip: any item with >1 distinct types lights up.
    if (hasActor) {
      const authors = (el.dataset.authorTypes||"").split("|").filter(Boolean);
      const cited   = (el.dataset.citedTypes ||"").split("|").filter(Boolean);
      const union   = [...new Set([...authors, ...cited])];
      for (const t of STATE.selectedActorTypes) {
        const mode = STATE.actorChipMode[t] || 0;
        if (t === "multiple") {
          if (mode === 1 && authors.length > 1) { highlight = true; break; }
          if (mode === 2 && union.length   > 1) { highlight = true; break; }
          continue;
        }
        if (mode === 1 && authors.includes(t))                       { highlight = true; break; }
        if (mode === 2 && (authors.includes(t) || cited.includes(t))){ highlight = true; break; }
      }
    }
    if (docIdsByYearModel) {
      // For docs check directly; for items, check pub_ids overlap
      let ok = false;
      if (type === "documents") ok = docIdsByYearModel.has(id);
      else {
        const arr = STATE.data[type === "conducts" ? "conducts"
                            : type === "risks"    ? "risks"
                            : type === "training" ? "trainings"
                            : "benchmarks"];
        const it = arr.find(x => x.id === id);
        ok = it && it.pub_ids.some(p => docIdsByYearModel.has(p));
      }
      // year/model is a constraint, not an additive highlight — must match.
      if (!ok) highlight = false;
      else if (!hasClick && !hasCat && !hasActor) highlight = true;
    }
    el.classList.toggle("hl", highlight);
  });
}

// ════════════════════════════════════════════════════════════════
// TOP ACTORS — table of the most-mentioned actors per type
// ════════════════════════════════════════════════════════════════
function setupTopActors() {
  const typeSel = document.getElementById("top-actors-type");
  const nSel    = document.getElementById("top-actors-n");
  const roleSel = document.getElementById("top-actors-role");
  if (!typeSel || !nSel || !roleSel) return;

  // Populate type dropdown: union of types observed in actors AND those in
  // the canonical vocabulary, so the new types (AI company, industry
  // consortium, etc.) appear even if no actor is tagged yet.
  const allTypes = new Set([...(STATE.data.actor_types || [])]);
  (STATE.data.actors || []).forEach(a => {
    if (a.type) allTypes.add(a.type);
    (a.types_all || []).forEach(t => allTypes.add(t));
  });
  [...allTypes].sort().forEach(t => {
    const o = document.createElement("option");
    o.value = t; o.textContent = t;
    typeSel.appendChild(o);
  });

  const render = () => renderTopActors(typeSel.value, parseInt(nSel.value, 10), roleSel.value);
  typeSel.addEventListener("change", render);
  nSel.addEventListener("change", render);
  roleSel.addEventListener("change", render);
  render();
}

function renderTopActors(typeFilter, n, roleFilter) {
  const tbody = document.querySelector("#top-actors-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  let arr = (STATE.data.actors || []).slice();
  if (typeFilter) arr = arr.filter(a =>
    a.type === typeFilter || (a.types_all || []).includes(typeFilter)
  );
  if (roleFilter) arr = arr.filter(a => (a.role || "") === roleFilter);
  arr = arr.slice(0, n || 25);
  if (!arr.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--muted);font-style:italic">No actors match.</td></tr>`;
    return;
  }
  arr.forEach((a, i) => {
    const tr = document.createElement("tr");
    const swatch = ACTOR_COLOR_HEX[a.type] || "#ccc";
    const cos = (a.companies || []).slice(0, 4).map(c => `<span class="co-pill">${escape(c)}</span>`).join("");
    const more = a.companies && a.companies.length > 4 ? ` <span class="co-pill" style="background:transparent">+${a.companies.length-4}</span>` : "";
    const docs = (a.doc_ids || []).slice(0, 5).map(id => {
      const d = STATE.data.documents.find(x => x.id === id);
      if (!d) return "";
      return d.url
        ? `<div class="src-line"><a href="${d.url}" target="_blank">${escape(d.title)}</a></div>`
        : `<div class="src-line">${escape(d.title)}</div>`;
    }).filter(Boolean).join("");
    const moreDocs = a.doc_ids && a.doc_ids.length > 5
      ? `<div class="src-line" style="color:var(--muted);font-style:italic">+ ${a.doc_ids.length-5} more</div>`
      : "";
    const role = (a.role || "").toUpperCase();
    tr.innerHTML = `
      <td class="num">${i+1}</td>
      <td><strong>${escape(a.name)}</strong></td>
      <td><span class="type-chip" style="background:${swatch}"></span>${escape(a.type)}</td>
      <td>${role ? `<span class="badge ${role}">${role}</span>` : "—"}</td>
      <td>${escape(a.based_in || "—")}</td>
      <td>${cos || "—"}${more}</td>
      <td>${docs}${moreDocs}</td>
      <td class="num">${a.mention_count}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ════════════════════════════════════════════════════════════════
// CONCEPTUAL CLUSTERS — definitions over time + two networks
// ════════════════════════════════════════════════════════════════
function setupClusters() {
  const kindSel = document.getElementById("cluster-kind");
  const itemSel = document.getElementById("cluster-item");
  if (!kindSel || !itemSel) return;
  kindSel.addEventListener("change", () => {
    STATE.cluster.kind = kindSel.value;
    refreshClusterItems();
    renderCluster();
  });
  itemSel.addEventListener("change", () => {
    STATE.cluster.id = itemSel.value;
    renderCluster();
  });
  const expSel = document.getElementById("cluster-expand-related");
  if (expSel) expSel.addEventListener("change", e => {
    STATE.cluster.expandRelated = e.target.checked;
    renderCluster();
  });
}

function refreshClusterItems() {
  const itemSel = document.getElementById("cluster-item");
  if (!itemSel) return;
  const kind = STATE.cluster.kind || "conducts";
  // List all unique CATEGORIES for that kind (conduct categories or risk categories)
  const cats = {};
  (STATE.data[kind] || []).forEach(it => {
    const c = (it.category || "").trim();
    if (!c) return;
    cats[c] = (cats[c] || 0) + 1;
  });
  const names = Object.keys(cats).sort();
  itemSel.innerHTML =
    `<option value="">— pick a ${kind === "risks" ? "risk" : "conduct"} category —</option>` +
    names.map(n => `<option value="${escapeAttr(n)}">${escape(n)} · ${cats[n]}</option>`).join("");
  if (STATE.cluster.id && names.includes(STATE.cluster.id)) {
    itemSel.value = STATE.cluster.id;
  } else if (names.length) {
    // Auto-pick the first category so the user sees populated output immediately
    STATE.cluster.id = names[0];
    itemSel.value = names[0];
  } else {
    STATE.cluster.id = "";
  }
  renderCluster();
}

// Per-actor-type colors mirrored from CSS variables
const ACTOR_COLOR_HEX = {
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

// Lazy lookup: actor name → most-common type (built once)
let _actorTypeMap = null;
function actorTypeMap() {
  if (_actorTypeMap) return _actorTypeMap;
  const counts = new Map();
  const note = (names, types) => {
    const nArr = (names||"").split("|").map(s => s.trim());
    const tArr = (types||"").split("|").map(s => s.trim().toLowerCase());
    nArr.forEach((n, i) => {
      if (!n) return;
      let t = tArr[i] || tArr[0] || "unknown";
      if (t.startsWith("other")) t = "other";
      if (!counts.has(n)) counts.set(n, new Map());
      const tc = counts.get(n);
      tc.set(t, (tc.get(t)||0) + 1);
    });
  };
  STATE.data.documents.forEach(d => note(d.actors, d.actor_types_raw));
  STATE.data.trainings.forEach(t => note(t.actor, t.actor_type_raw));
  STATE.data.benchmarks.forEach(b => note(b.author, b.author_type_raw));
  [...STATE.data.conducts, ...STATE.data.risks].forEach(it => {
    if (it.specific_actor && it.specific_actor_type) note(it.specific_actor, it.specific_actor_type);
  });
  _actorTypeMap = new Map();
  counts.forEach((tc, name) => {
    let best = "unknown", bestN = 0;
    tc.forEach((n, t) => { if (n > bestN) { bestN = n; best = t; } });
    _actorTypeMap.set(name, best);
  });
  // Manual overrides (from actors.csv) win over inferred types
  const manual = STATE.data.actor_types_manual || {};
  Object.entries(manual).forEach(([name, type]) => _actorTypeMap.set(name, type));
  return _actorTypeMap;
}

// Lazy lookup: actor name → { type, docs:[], credited:[], trainings:[], benchmarks:[] }
let _actorIndex = null;
function actorIndex() {
  if (_actorIndex) return _actorIndex;
  const idx = new Map();
  const get = name => {
    if (!idx.has(name)) idx.set(name, {
      type: "unknown", docs:[], credited:[], trainings:[], benchmarks:[],
    });
    return idx.get(name);
  };
  STATE.data.documents.forEach(d => {
    (d.actors||"").split("|").map(s=>s.trim()).filter(Boolean)
      .forEach(a => get(a).docs.push(d.id));
  });
  [...STATE.data.conducts, ...STATE.data.risks].forEach(it => {
    if (it.specific_actor) get(it.specific_actor).credited.push(it.id);
  });
  STATE.data.trainings.forEach(t => {
    (t.actor||"").split("|").map(s=>s.trim()).filter(Boolean)
      .forEach(a => get(a).trainings.push(t.id));
  });
  STATE.data.benchmarks.forEach(b => {
    (b.author||"").split("|").map(s=>s.trim()).filter(Boolean)
      .forEach(a => get(a).benchmarks.push(b.id));
  });
  const tm = actorTypeMap();
  idx.forEach((info, name) => { info.type = tm.get(name) || "unknown"; });
  _actorIndex = idx;
  return _actorIndex;
}

function renderCluster() {
  const tl = document.getElementById("cluster-timeline");
  const cg = document.getElementById("concept-graph");
  const ag = document.getElementById("actor-graph");
  if (!tl || !cg || !ag) return;
  tl.innerHTML = ""; cg.innerHTML = ""; ag.innerHTML = "";

  const category = STATE.cluster.id;
  if (!category) {
    tl.innerHTML = "<p class=meta>Pick a category above to see how it has been defined, trained and evaluated over time.</p>";
    return;
  }
  const kind = STATE.cluster.kind;
  const items = (STATE.data[kind] || []).filter(it => (it.category || "") === category);
  if (!items.length) return;

  // ── Build timeline rows: one per (item × source-doc) ──
  const docById  = id => STATE.data.documents.find(x => x.id === id);
  const linkKey  = kind === "conducts" ? "conduct_ids" : "risk_ids";
  const itemIds  = new Set(items.map(it => it.id));

  // Pre-index trainings & benchmarks by linked item id (faster than re-scanning each iteration)
  const trByItem = new Map(), bnByItem = new Map();
  STATE.data.trainings.forEach(t =>
    (t[linkKey] || []).forEach(iid => {
      if (!itemIds.has(iid)) return;
      (trByItem.get(iid) || trByItem.set(iid, []).get(iid)).push(t);
    }));
  STATE.data.benchmarks.forEach(b =>
    (b[linkKey] || []).forEach(iid => {
      if (!itemIds.has(iid)) return;
      (bnByItem.get(iid) || bnByItem.set(iid, []).get(iid)).push(b);
    }));

  const rows = [];
  items.forEach(it => {
    (it.pub_ids || []).forEach(pid => {
      const d = docById(pid);
      if (!d) return;
      rows.push({
        year: d.year || "—",
        item: it,
        doc:  d,
        trainings:  trByItem.get(it.id) || [],
        benchmarks: bnByItem.get(it.id) || [],
      });
    });
  });
  rows.sort((a, b) => (a.year || "").localeCompare(b.year || ""));

  // ── Render: vertical timeline with ticks per definition, detail card on right
  if (!rows.length) {
    tl.innerHTML = "<p class=meta>No definitions recorded for this category.</p>";
  } else {
    // Group rows by year → array of definitions
    const byYear = {};
    rows.forEach(r => {
      const y = r.year || "—";
      (byYear[y] = byYear[y] || []).push(r);
    });
    const years = Object.keys(byYear).filter(y => y !== "—").sort();
    if (byYear["—"]) years.push("—");

    const allActorsSet = new Set();
    rows.forEach(r => {
      if (r.item.specific_actor) allActorsSet.add(r.item.specific_actor);
      (r.doc.actors||"").split("|").map(s=>s.trim()).filter(Boolean).forEach(a => allActorsSet.add(a));
    });

    const summary = document.createElement("div");
    summary.className = "tl-summary";
    summary.innerHTML = `
      <strong>${rows.length}</strong> definition${rows.length===1?"":"s"}
      &middot; <strong>${years[0]}–${years.filter(y=>y!=="—").slice(-1)[0] || "—"}</strong>
      &middot; <strong>${allActorsSet.size}</strong> distinct contributor${allActorsSet.size===1?"":"s"}
    `;
    tl.appendChild(summary);

    const axis = document.createElement("div");
    axis.className = "tl-axis";
    tl.appendChild(axis);

    let rowIdx = 0;
    years.forEach(y => {
      byYear[y].forEach((r, idx) => {
        const row = document.createElement("div");
        row.className = "tl-row";
        row.dataset.year = y;
        row.dataset.idx  = rowIdx++;

        // Year (only on the first row of each year)
        const yearCell = document.createElement("div");
        yearCell.className = "tl-year-cell";
        if (idx === 0) {
          yearCell.innerHTML = `<div class="tl-year-label">${escape(y)}</div>`;
        }
        row.appendChild(yearCell);

        // Black dot on the timeline
        const dotCell = document.createElement("div");
        dotCell.className = "tl-dot-cell";
        const dot = document.createElement("div");
        dot.className = "tl-dot";
        dotCell.appendChild(dot);
        row.appendChild(dotCell);

        // Company name (its own grid column, sits next to the dot)
        const co = document.createElement("div");
        co.className = "tl-company";
        co.textContent = r.item.company;
        row.appendChild(co);

        // Card sits in the rightmost grid column, opens beside the company name
        const card = document.createElement("div");
        card.className = "tl-def-card";
        renderTimelineCard(card, r);
        row.appendChild(card);

        // Interactions
        const showHover = () => { if (!row.classList.contains("is-pinned")) row.classList.add("is-hover"); };
        const hideHover = () => row.classList.remove("is-hover");
        const togglePin = () => {
          const pinned = row.classList.toggle("is-pinned");
          dot.classList.toggle("pinned", pinned);
          if (pinned) row.classList.remove("is-hover");
        };
        dot.addEventListener("mouseenter", showHover);
        dot.addEventListener("mouseleave", hideHover);
        co .addEventListener("mouseenter", showHover);
        co .addEventListener("mouseleave", hideHover);
        dot.addEventListener("click", togglePin);
        co .addEventListener("click", togglePin);

        axis.appendChild(row);
      });
    });
  }

  // ── Conceptual network: CENTRAL node = the selected category;
  //    related nodes = every risk_conduct_item in that category. Each item is
  //    coloured by FIRST specific_risk_conduct_actor_category if available,
  //    else by the source document's first pub_actors_type.
  //    Optional second-iteration: expand to categories whose names share a
  //    word with the selected category (e.g. "Political bias" ↔ "Political
  //    neutrality", "Bias", "Representational bias"). Toggle in the UI.
  const includeRelatedCats = STATE.cluster.expandRelated === true;
  // Loose word-overlap check. Strips punctuation, lower-cases, ignores
  // 3-letter "stop" words ("the", "and", etc.). Any shared 4+-letter token
  // between two category names counts as a match.
  const STOP = new Set(["the","and","for","with","into","over","this","that","from"]);
  const tokens = s => s.toLowerCase().split(/[^a-z]+/).filter(w => w.length >= 4 && !STOP.has(w));
  const sharedWord = (a, b) => {
    const wa = new Set(tokens(a));
    return tokens(b).some(w => wa.has(w));
  };
  // The dataset of items to search for related categories — every kind, so
  // a Conduct's category can pull related Risk and Misuse categories too.
  const cAll = [
    ...(STATE.data.conducts || []),
    ...(STATE.data.risks    || []),
    ...(STATE.data.misuses  || []),
  ];
  let relatedCats = [];
  if (includeRelatedCats) {
    const allCats = [...new Set(cAll.map(c => c.category).filter(Boolean))];
    relatedCats = allCats.filter(c => c !== category && sharedWord(category, c));
  }

  const firstActorTypeOf = it => {
    if (it.specific_actor_type) return it.specific_actor_type;
    if (it.all_actor_types && it.all_actor_types.length) return it.all_actor_types[0];
    return it.actor_type || "unknown";
  };

  const conceptNodes = [];
  const conceptEdges = [];
  // CENTRAL category node — strong + dark
  conceptNodes.push({
    id: "__cat__" + category, label: category,
    actorType: "central", focus: true,
    isCategory: true,
  });
  const blockIdOf = id =>
       id && id.startsWith("risk__")   ? "risks"
     : id && id.startsWith("misuse__") ? "misuses"
     :                                   "conducts";

  // Items in the focal category
  items.forEach(it => {
    const t = firstActorTypeOf(it);
    conceptNodes.push({
      id: it.id, label: it.item,
      actorType: t, item: it, blockId: kind,
    });
    conceptEdges.push({ source: "__cat__" + category, target: it.id, weight: 1 });
  });
  // Optional related categories + their items
  if (includeRelatedCats) {
    relatedCats.forEach(rc => {
      conceptNodes.push({
        id: "__cat__" + rc, label: rc,
        actorType: "related-cat", focus: false,
        isCategory: true,
      });
      // Edge from focal category to related category
      conceptEdges.push({ source: "__cat__" + category, target: "__cat__" + rc, weight: 2 });
      cAll.filter(it => it.category === rc).forEach(it => {
        const t = firstActorTypeOf(it);
        conceptNodes.push({
          id: it.id + "::" + rc, label: it.item,
          actorType: t, item: it, blockId: blockIdOf(it.id),
        });
        conceptEdges.push({ source: "__cat__" + rc, target: it.id + "::" + rc, weight: 1 });
      });
    });
  }

  drawForceGraph("#concept-graph",
    conceptNodes,
    conceptEdges,
    {
      colorFn: d => {
        if (d.actorType === "central")     return "#1c1a18";
        if (d.actorType === "related-cat") return "#6c655c";
        return ACTOR_COLOR_HEX[d.actorType] || ACTOR_COLOR_HEX.unknown;
      },
      hoverHtml: d => d.isCategory
        ? `<h4>${escape(d.label)}</h4><p class=meta>Category</p>`
        : itemToCard(d.item, d.blockId, "item"),
    });

  // ── Actor network: actors involved in defining, training & benchmarking
  //    items in this category. Edges = co-appearance in the same document.
  const actorsByDoc = new Map();
  const addActor = (pid, name) => {
    if (!pid || !name) return;
    const s = actorsByDoc.get(pid) || actorsByDoc.set(pid, new Set()).get(pid);
    s.add(name);
  };
  items.forEach(it => {
    // Defining actors: from each source doc's pub_actors, + specific_actor if any
    (it.pub_ids || []).forEach(pid => {
      const d = docById(pid);
      if (d && d.actors) d.actors.split("|").map(s => s.trim()).filter(Boolean)
        .forEach(a => addActor(pid, a));
      if (it.specific_actor) addActor(pid, it.specific_actor);
    });
    // Training actors
    (trByItem.get(it.id) || []).forEach(t =>
      (t.pub_ids || []).forEach(pid =>
        (t.actor || "").split("|").map(s => s.trim()).filter(Boolean)
          .forEach(a => addActor(pid, a))));
    // Benchmark authors
    (bnByItem.get(it.id) || []).forEach(b =>
      (b.pub_ids || []).forEach(pid =>
        (b.author || "").split("|").map(s => s.trim()).filter(Boolean)
          .forEach(a => addActor(pid, a))));
  });

  const actorNodes = new Map();
  const actorEdges = new Map();
  actorsByDoc.forEach(set => {
    const list = [...set];
    list.forEach(a => actorNodes.set(a, { id: a, label: a }));
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) {
        const k = [list[i], list[j]].sort().join("|");
        actorEdges.set(k, (actorEdges.get(k) || 0) + 1);
      }
  });
  // Actor nodes coloured by their primary actor type, clickable for details.
  const tm = actorTypeMap();
  drawForceGraph("#actor-graph",
    [...actorNodes.values()].map(n => ({ ...n, actorType: tm.get(n.id) || "unknown" })),
    [...actorEdges.entries()].map(([k, w]) => {
      const [a, b] = k.split("|");
      return { source: a, target: b, weight: w };
    }),
    {
      colorFn: d => ACTOR_COLOR_HEX[d.actorType] || ACTOR_COLOR_HEX.unknown,
      onNodeClick: showActorDetails,
      hoverHtml: d => actorNodeCard(d),
    });
}

function actorNodeCard(node) {
  const info = actorIndex().get(node.id) || { type:"unknown", docs:[], credited:[] };
  return `
    <h4>${escape(node.id)}</h4>
    <dt>Type</dt><dd>${escape(info.type)}</dd>
    <dt>Documents</dt><dd>${info.docs.length}</dd>
    <dt>Credited as defining</dt><dd>${info.credited.length} item${info.credited.length===1?"":"s"}</dd>
    <p style="margin:0.6em 0 0;font-size:11px;color:var(--muted)">Click for full details</p>
  `;
}

function updateExpandedYear() {
  const ey = STATE.cluster.expandedYear;
  document.querySelectorAll(".tl-row").forEach(r => {
    r.classList.toggle("is-expanded", ey != null && r.dataset.year === ey);
  });
  document.querySelectorAll(".tl-year-cell[data-year]").forEach(c => {
    c.classList.toggle("expanded", ey != null && c.dataset.year === ey);
  });
}

// Render an array of {name, type} as colour-coded chips.
function actorPills(actors) {
  if (!actors || !actors.length) return `<span class="tl-meta">—</span>`;
  return actors.map(a => {
    const c = ACTOR_COLOR_HEX[(a.type||"").toLowerCase()] || ACTOR_COLOR_HEX.unknown;
    return `<span class="actor-pill"><span class="type-chip" style="background:${c}"></span>${escape(a.name)} <span class="tl-meta">(${escape(a.type||"unknown")})</span></span>`;
  }).join(" ");
}

// Split parallel pipe-separated "name | name" and "type | type" into pairs
function pairsFrom(namesStr, typesStr) {
  const names = (namesStr||"").split("|").map(s => s.trim()).filter(Boolean);
  const types = (typesStr||"").split("|").map(s => s.trim().toLowerCase());
  return names.map((n, i) => ({ name: n, type: types[i] || types[0] || "unknown" }));
}

function renderTimelineCard(card, r) {
  const link = r.doc.url
    ? `<a href="${r.doc.url}" target="_blank">${escape(r.doc.title)}</a>`
    : escape(r.doc.title);
  const def = r.item.definition || r.item.verbatim || "";

  const authors = r.doc.author_actors || [];
  const cited   = r.doc.cited_actors  || [];

  // Specific actor (if any) is an explicit external credit — count as cited
  let citedFull = cited.slice();
  if (r.item.specific_actor) {
    citedFull = citedFull.concat([{ name: r.item.specific_actor,
                                    type: r.item.specific_actor_type || "unknown" }]);
  }

  const trainBlock = (r.trainings || []).map(t => {
    const actorPairs = pairsFrom(t.actor, t.actor_type_raw);
    return `<div class="tl-step"><span class="tl-step-tag">Training</span>
              <span class="tl-step-body">
                <span class="tl-meta">${escape(t.item)} · ${escape(t.category)}</span><br>
                ${actorPills(actorPairs)}
              </span></div>`;
  }).join("");

  const benchBlock = (r.benchmarks || []).map(b => {
    const actorPairs = pairsFrom(b.author, b.author_type_raw);
    return `<div class="tl-step"><span class="tl-step-tag">Benchmark</span>
              <span class="tl-step-body">
                <span class="tl-meta">${escape(b.name)} · ${escape(b.category)}</span><br>
                ${actorPills(actorPairs)}
              </span></div>`;
  }).join("");

  const evalLine = r.item.external_evaluator
    ? `<div class="tl-step"><span class="tl-step-tag">External evaluator</span>
         <span class="tl-step-body">${escape(r.item.external_evaluator)}</span></div>`
    : "";

  card.innerHTML = `
    <div class="tl-card-head">
      <strong>${escape(r.year)}</strong> · <strong>${escape(r.item.company)}</strong> · <em>${escape(r.item.item)}</em>
    </div>
    <div class="tl-card-src">${link}</div>
    ${def ? `<div class="tl-def">"${escape(snippet(def, 320))}"</div>` : ""}
    <div class="tl-step"><span class="tl-step-tag">Author</span>
      <span class="tl-step-body">${actorPills(authors)}</span></div>
    ${citedFull.length ? `<div class="tl-step"><span class="tl-step-tag">Cited</span>
      <span class="tl-step-body">${actorPills(citedFull)}</span></div>` : ""}
    ${trainBlock}
    ${benchBlock}
    ${evalLine}
  `;
}

// Render a small panel below the actor graph for the clicked actor
function showActorDetails(node) {
  const pane = document.getElementById("actor-detail");
  if (!pane) return;
  const info = actorIndex().get(node.id);
  if (!info) { pane.innerHTML = ""; pane.classList.add("hidden"); return; }
  const docs = info.docs.map(id => STATE.data.documents.find(d => d.id === id)).filter(Boolean);
  const credited = info.credited.map(id => {
    const arr = STATE.data.conducts.concat(STATE.data.risks);
    return arr.find(x => x.id === id);
  }).filter(Boolean);
  pane.classList.remove("hidden");
  pane.innerHTML = `
    <button class="close" onclick="document.getElementById('actor-detail').classList.add('hidden')" type="button">×</button>
    <h4>${escape(node.id)}</h4>
    <dt>Type</dt><dd><span class="type-chip" style="background:${ACTOR_COLOR_HEX[info.type]||'#ccc'}"></span>${escape(info.type)}</dd>
    <dt>Documents (${docs.length})</dt><dd>${docs.length
      ? docs.map(d => d.url
          ? `<div class="src-line"><a href="${d.url}" target="_blank">${escape(d.title)}</a></div>`
          : `<div class="src-line">${escape(d.title)}</div>`).join("")
      : "—"}</dd>
    <dt>Credited as defining (${credited.length})</dt><dd>${credited.length
      ? credited.map(it => `<div class="src-line">${escape(it.item)} <span class="pg">(${escape(it.category)} · ${escape(it.company)})</span></div>`).join("")
      : "—"}</dd>
  `;
}

// D3 force-directed graph with zoom/pan + recenter button + node click + hover labels.
function drawForceGraph(selector, nodes, links, opts) {
  const svg = d3.select(selector);
  svg.selectAll("*").remove();
  // Reset detail pane for actor graph on re-render
  if (selector === "#actor-graph") {
    const p = document.getElementById("actor-detail");
    if (p) { p.innerHTML = ""; p.classList.add("hidden"); }
  }
  if (!nodes.length) {
    svg.append("text").attr("x", 10).attr("y", 20)
       .attr("font-size", "11px").attr("fill", "#999")
       .text("Not enough data for a graph yet.");
    return;
  }
  const rect = svg.node().getBoundingClientRect();
  const w = rect.width || 400, h = rect.height || 360;
  svg.attr("viewBox", `0 0 ${w} ${h}`);

  // Outer group that pans/zooms; all content sits inside it.
  const root = svg.append("g").attr("class", "graph-root");

  const zoom = d3.zoom()
    .scaleExtent([0.2, 5])
    .on("zoom", ev => root.attr("transform", ev.transform));
  svg.call(zoom);

  // Recenter button (HTML overlay handled in CSS)
  const parent = svg.node().parentElement;
  let btn = parent.querySelector(".graph-recenter");
  if (!btn) {
    btn = document.createElement("button");
    btn.className = "graph-recenter";
    btn.type = "button";
    btn.title = "Recenter";
    btn.textContent = "⊕";
    parent.appendChild(btn);
  }
  btn.onclick = () => svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity);

  // Compact collision radius so the graph stays within the pane.
  // Labels overlap is mitigated by the paper-coloured stroke halo + hover scale.
  const collideR = d => d.focus ? 28 : 18;

  const sim = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(55).strength(0.7))
    .force("charge", d3.forceManyBody().strength(-90))
    .force("center", d3.forceCenter(w/2, h/2))
    .force("collide", d3.forceCollide(collideR));

  const link = root.append("g").attr("class", "links")
    .selectAll("line").data(links).enter()
    .append("line").attr("class", "link")
    .attr("stroke-width", d => Math.min(4, 0.6 + d.weight * 0.4));

  const node = root.append("g").attr("class", "nodes")
    .selectAll("g").data(nodes).enter()
    .append("g").attr("class", "node");

  node.append("circle")
    .attr("r", d => d.focus ? 10 : 6)
    .attr("fill", d => opts.colorFn ? opts.colorFn(d) : (opts.color || "#888"))
    .attr("stroke", "#1c1a18")
    .attr("stroke-width", d => d.focus ? 1.8 : 0.8);

  node.append("text")
    .attr("class", "node-label")
    .attr("x", 11).attr("y", 4)
    .attr("fill", "#1c1a18")
    .style("paint-order", "stroke")
    .style("stroke", "rgba(251,247,240,0.92)")
    .style("stroke-width", "3px")
    .style("stroke-linejoin", "round")
    .text(d => (d.label||"").length > 28 ? (d.label||"").slice(0, 27) + "…" : d.label);

  node.call(d3.drag()
    .on("start", (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
    .on("drag",  (event, d) => { d.fx = event.x; d.fy = event.y; })
    .on("end",   (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

  if (opts.onNodeClick) {
    node.style("cursor", "pointer");
    node.on("click", (_, d) => opts.onNodeClick(d));
  }
  if (opts.hoverHtml) {
    node.on("mouseenter", (e, d) => showCard(opts.hoverHtml(d), e));
    node.on("mousemove",  e      => positionCard(e));
    node.on("mouseleave", ()      => hideCard());
  }

  sim.on("tick", () => {
    link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });
}

// ── Scroll spy (sidebar) ─────────────────────────────────────────
function setupScrollSpy() {
  const topIds = ["introduction", "method", "findings", "discussion", "references"];
  const subIds = ["block-sources", "block-conducts", "block-risks", "block-misuses",
                  "block-training", "block-benchmark", "block-top-actors", "block-clusters"];
  const allIds = [...topIds, ...subIds];

  const sections = allIds.map(id => document.getElementById(id)).filter(Boolean);
  const setActive = id => {
    document.querySelectorAll(".side-nav a, .side-nav .sub-nav a").forEach(a => {
      a.classList.toggle("active", a.dataset.target === id);
    });
  };
  const io = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting)
                           .sort((a,b) => b.intersectionRatio - a.intersectionRatio);
    if (visible[0]) setActive(visible[0].target.id);
  }, { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.2, 0.5, 0.8, 1] });
  sections.forEach(s => io.observe(s));
  setActive("introduction");
}
