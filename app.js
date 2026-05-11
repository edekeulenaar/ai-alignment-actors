/* ════════════════════════════════════════════════════════════════
   The actors in AI alignment — interactions
   ════════════════════════════════════════════════════════════════ */

const COLOR_VAR = {
  "internal":              "var(--c-internal)",
  "private":               "var(--c-private)",
  "academic":              "var(--c-academic)",
  "research institute":    "var(--c-research-institute)",
  "governmental":          "var(--c-governmental)",
  "nonprofit":             "var(--c-nonprofit)",
  "public":                "var(--c-public)",
  "public consultation":   "var(--c-public-consultation)",
  "other":                 "var(--c-other)",
  "multiple":              "var(--c-multiple)",
  "unknown":               "var(--c-unknown)",
};

const DOC_TYPE_CLASS = {
  "Model card": "t-model-card",  "Model Card": "t-model-card",
  "Company policy": "t-company-policy",
  "Principle": "t-principle",     "Grant": "t-grant",
  "Initiative": "t-initiative",   "Report": "t-report",
  "Research": "t-research",       "Announcement": "t-announcement",
  "Audit": "t-audit",             "Other: Legislation": "t-legislation",
};
const docTypeKey = t => DOC_TYPE_CLASS[t] || "t-other";

const DOC_TYPE_LABEL = {
  "t-model-card":     "Model card",
  "t-company-policy": "Company policy",
  "t-principle":      "Principle / charter",
  "t-grant":          "Grant",
  "t-initiative":     "Initiative",
  "t-report":         "Report",
  "t-research":       "Research / paper",
  "t-announcement":   "Announcement / blog",
  "t-audit":          "Audit",
  "t-legislation":    "Legislation",
  "t-other":          "Other",
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
fetch("data.json").then(r => r.json()).then(data => {
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
  // Items derived ONLY from company policies go to the Misuses block.
  const nonPolicy  = arr => arr.filter(x => !x.only_policy);
  const policyOnly = arr => arr.filter(x =>  x.only_policy);
  renderItemBlock("conducts",  nonPolicy(STATE.data.conducts),   {nameKey:"item"});
  renderItemBlock("risks",     nonPolicy(STATE.data.risks),      {nameKey:"item"});
  renderItemBlock("misuses",
                  policyOnly(STATE.data.conducts).concat(policyOnly(STATE.data.risks)),
                  {nameKey:"item"});
  renderItemBlock("training",  nonPolicy(STATE.data.trainings),  {nameKey:"item"});
  renderItemBlock("benchmark", nonPolicy(STATE.data.benchmarks), {nameKey:"name"});
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

  // Sort categories
  const sortBy = STATE.sortMode[blockId] || "alpha";
  if (sortBy === "alpha")    cats.sort();
  if (sortBy === "quantity") cats.sort((a,b) => byCat[b].length - byCat[a].length);
  if (sortBy === "newest" || sortBy === "oldest") {
    const yearOf = cat => {
      const ys = byCat[cat]
        .flatMap(it => (it.pub_ids||[]).map(pid => yearByDocId[pid]))
        .filter(Boolean);
      return ys.length ? (sortBy === "newest" ? Math.max(...ys) : Math.min(...ys)) : 0;
    };
    const yearByDocId = Object.fromEntries(STATE.data.documents.map(d => [d.id, parseInt(d.year)||0]));
    cats.sort((a,b) => sortBy === "newest" ? yearOf(b)-yearOf(a) : yearOf(a)-yearOf(b));
  }

  // Truncate long category lists unless the user asked to expand
  const totalCats = cats.length;
  if (!STATE.showAllCats[blockId] && totalCats > STATE.maxCats) {
    // Always sort by quantity for the "top N" cut to make sense
    const counts = Object.fromEntries(Object.entries(byCat).map(([k,v]) => [k, v.length]));
    cats = [...cats].sort((a,b) => counts[b]-counts[a]).slice(0, STATE.maxCats);
    // Restore the user-chosen sort order over the truncated set
    if (sortBy === "alpha")    cats.sort();
    if (sortBy === "quantity") cats.sort((a,b) => counts[b]-counts[a]);
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
  // Store credited + contributor actor types separately for the 3-state chip cycle
  const credited    = item.credited_actor_types    || [];
  const contributor = item.contributor_actor_types || [];
  const all = item.all_actor_types || (item.actor_types && item.actor_types.length ? item.actor_types : [sq.dataset.actorType]);
  sq.dataset.actorTypes        = all.join("|");
  sq.dataset.creditedTypes     = credited.join("|");
  sq.dataset.contributorTypes  = contributor.join("|");
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
  el.dataset.actorTypes = (doc.actor_types && doc.actor_types.length ? doc.actor_types : [doc.primary_actor_type]).join("|");
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
    <dt>Contributors</dt><dd>${escape(d.actors) || "—"}</dd>
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

// Aggregate unique pub_actors across an item's source documents
function contributorsOf(it) {
  const data = STATE.data;
  const set = new Set();
  (it.pub_ids || []).forEach(pid => {
    const d = data.documents.find(x => x.id === pid);
    if (d && d.actors) d.actors.split("|").map(s => s.trim()).filter(Boolean).forEach(a => set.add(a));
  });
  return [...set].join(" | ");
}
function itemToCard(it, blockId, nameKey) {
  const found = foundInBlock(it);
  const contribs = contributorsOf(it);
  const evalLine = it.external_evaluator
    ? `<dt>External evaluator</dt><dd>${escape(it.external_evaluator)}</dd>` : "";

  if (blockId === "training") return `
    <h4>${escape(it.item)}</h4>
    ${it.verbatim ? `<div class="quote">"${escape(snippet(it.verbatim, 220))}"</div>` : ""}
    <dt>Category</dt><dd>${escape(it.category)}</dd>
    <dt>Found in</dt><dd>${found}</dd>
    <dt>Contributors</dt><dd>${escape(it.actor || contribs) || "—"}</dd>`;

  if (blockId === "benchmark") return `
    <h4>${escape(it.name)}</h4>
    <dt>Category</dt><dd>${escape(it.category)}</dd>
    <dt>Found in</dt><dd>${found}</dd>
    <dt>Contributors</dt><dd>${escape(it.author || contribs) || "—"}</dd>`;

  // conduct / risk
  return `
    <h4>${escape(it.item)}</h4>
    ${it.definition ? `<div class="quote">"${escape(snippet(it.definition, 220))}"</div>` : ""}
    <dt>Found in</dt><dd>${found}</dd>
    <dt>Contributors</dt><dd>${escape(contribs) || "—"}</dd>
    ${it.specific_actor ? `<dt>Defined by</dt><dd>${escape(it.specific_actor)}</dd>` : ""}
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
    if (lbl) lbl.textContent = mode === 1 ? "  CREDITED" : mode === 2 ? "  COLLABORATED" : "";
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
    //   mode 1 (CREDITED)      → match only credited_actor_types
    //   mode 2 (COLLABORATED)  → match credited ∪ contributor (= all actor types)
    if (hasActor) {
      const credited    = (el.dataset.creditedTypes||"").split("|").filter(Boolean);
      const contributor = (el.dataset.contributorTypes||"").split("|").filter(Boolean);
      for (const t of STATE.selectedActorTypes) {
        const mode = STATE.actorChipMode[t] || 0;
        if (mode === 1 && credited.includes(t))                  { highlight = true; break; }
        if (mode === 2 && (credited.includes(t) || contributor.includes(t)))
                                                                 { highlight = true; break; }
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
  "internal":              "#4A90E2",
  "private":               "#7FD2F8",
  "academic":              "#FCF6AE",
  "research institute":    "#FECB7A",
  "governmental":          "#FA7EAE",
  "nonprofit":             "#C4E79F",
  "public":                "#74C4A7",
  "public consultation":   "#74C4A7",   // merged with public
  "multiple":              "#FFB8FB",
  "other":                 "#F9DFFC",
  "unknown":               "#D3D3D3",
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
  STATE.data.documents.forEach(d => note(d.actors, d.actors_type_raw));
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

    years.forEach(y => {
      byYear[y].forEach((r, idx) => {
        const row = document.createElement("div");
        row.className = "tl-row";
        const actorType = r.item.actor_type || "unknown";
        const color = ACTOR_COLOR_HEX[actorType] || ACTOR_COLOR_HEX.unknown;

        // Year label sits to the LEFT of the axis (only on the first row of each year)
        const yearCell = document.createElement("div");
        yearCell.className = "tl-year-cell";
        if (idx === 0) yearCell.innerHTML = `<div class="tl-year-label">${escape(y)}</div>`;
        row.appendChild(yearCell);

        // RIGHT-SIDE container: axis line is its left border; tick crosses it; card below
        const right = document.createElement("div");
        right.className = "tl-right";
        right.innerHTML = `
          <div class="tl-tick">
            <span class="tl-tick-mark" style="background:${color}"></span>
            <span class="tl-tick-co">${escape(r.item.company)}</span>
          </div>
          <div class="tl-def-card"></div>
        `;
        renderTimelineCard(right.querySelector(".tl-def-card"), r);
        row.appendChild(right);

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
  const sharedWord = (a, b) => {
    const wa = new Set(a.toLowerCase().split(/[^a-z]+/).filter(w => w.length > 3));
    const wb = b.toLowerCase().split(/[^a-z]+/).filter(w => w.length > 3);
    return wb.some(w => wa.has(w));
  };
  const cAll = STATE.data[kind] || [];
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
          actorType: t, item: it, blockId: kind,
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

function renderTimelineCard(card, r, pinned=false) {
  const link = r.doc.url
    ? `<a href="${r.doc.url}" target="_blank">${escape(r.doc.title)}</a>`
    : escape(r.doc.title);
  const def = r.item.definition || r.item.verbatim || "";
  const contribs = r.item.specific_actor
    ? r.item.specific_actor
    : (r.doc.actors || "");
  const trainLines = (r.trainings || []).map(t =>
    `<div class="tl-step"><span class="tl-step-tag">Trained</span>
       <span class="tl-step-body">${escape(t.item)} <span class="tl-meta">(${escape(t.category)})</span>${t.actor ? ` — ${escape(t.actor)}` : ""}</span></div>`).join("");
  const benchLines = (r.benchmarks || []).map(b =>
    `<div class="tl-step"><span class="tl-step-tag">Benchmarked</span>
       <span class="tl-step-body">${escape(b.name)} <span class="tl-meta">(${escape(b.category)})</span>${b.author ? ` — ${escape(b.author)}` : ""}</span></div>`).join("");
  card.innerHTML = `
    <div class="tl-card-head">
      <strong>${escape(r.year)}</strong> · <strong>${escape(r.item.company)}</strong> · <em>${escape(r.item.item)}</em>
    </div>
    <div class="tl-card-src">${link}</div>
    ${def ? `<div class="tl-def">"${escape(snippet(def, 320))}"</div>` : ""}
    ${contribs ? `<div class="tl-step"><span class="tl-step-tag">Contributors</span><span class="tl-step-body">${escape(contribs)}</span></div>` : ""}
    ${trainLines}
    ${benchLines}
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
  const subIds = ["block-sources", "block-conducts", "block-risks", "block-uses",
                  "block-training", "block-benchmark", "block-clusters"];
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
