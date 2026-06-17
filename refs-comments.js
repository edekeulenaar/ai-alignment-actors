/* ============================================================================
   refs-comments.js — inline citations with hover reference cards, and
   reader comments (highlight a passage → leave a note). Self-contained;
   adapted from the Censorship & moderation site. Loads after app.js.
   ========================================================================= */
(function () {
  "use strict";

  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const mdItalic = s => esc(s).replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // ───────────────────────── Citations ─────────────────────────
  let BIB = {};

  function deriveFromKey(key) {
    const years = key.match(/\d{4}/g);
    const year = years ? years[years.length - 1] : "n.d.";
    let raw = (key.match(/^[a-z]+/) || [key])[0];
    const author = raw.charAt(0).toUpperCase() + raw.slice(1);
    return { author, year };
  }
  function inlineFor(key) {
    const e = BIB[key];
    if (e && e.author && e.year) return `${e.author}, ${e.year}`;
    const d = deriveFromKey(key);
    return `${d.author}, ${d.year}`;
  }
  function harvardFor(key) {
    const e = BIB[key];
    if (e && e.harvard) return mdItalic(e.harvard);
    const d = deriveFromKey(key);
    return `${esc(d.author)} (${esc(d.year)}) <em>Reference pending</em>.`;
  }
  function linkFor(key) { return (BIB[key] && BIB[key].link) || ""; }

  // Index the manuscript's own References list so cite-links can jump to it.
  const refIndex = new Map();   // "lastnamelower|year" → element id
  function buildRefIndex() {
    document.querySelectorAll(".references li").forEach((li, i) => {
      if (!li.id) li.id = `ref-entry-${i + 1}`;
      const txt = li.textContent.trim();
      const lastMatch = txt.match(/^([A-Z][^,\.\(]{0,40}?)(?=[,\.\(])/);
      const lastFirst = (lastMatch ? lastMatch[1] : "").trim().split(/\s+/)[0] || "";
      const lastLower = lastFirst.toLowerCase().replace(/[^a-z]/g, "");
      const yMatch = txt.match(/\((\d{4})/) || txt.match(/(\d{4})/);
      const year = yMatch ? yMatch[1] : "";
      if (lastLower && year) refIndex.set(`${lastLower}|${year}`, li.id);
    });
  }
  function refIdFor(key) {
    const e = BIB[key];
    const author = (e && e.author) || deriveFromKey(key).author;
    const year = (e && e.year) || deriveFromKey(key).year;
    const lk = author.toLowerCase().replace(/[^a-z]/g, "");
    for (let len = lk.length; len >= 3; len--) {
      const hit = refIndex.get(`${lk.slice(0, len)}|${year}`);
      if (hit) return hit;
    }
    return "";
  }

  function renderCites() {
    document.querySelectorAll(".cite-grp").forEach(g => {
      const keys = (g.dataset.keys || "").split(",").map(s => s.trim()).filter(Boolean);
      if (!keys.length) { g.remove(); return; }
      const parts = keys.map(k => {
        const rid = refIdFor(k);
        return `<a class="cite-link" href="${rid ? "#" + rid : "#references"}" ` +
               `data-key="${esc(k)}"${rid ? ` data-refid="${rid}"` : ""}>${esc(inlineFor(k))}</a>`;
      });
      g.innerHTML = "(" + parts.join("; ") + ")";
    });
  }

  // Floating hover-card.
  const card = (() => {
    const el = () => document.getElementById("data-card");
    let hideTimer = null;
    function position(node, ev) {
      const r = node.getBoundingClientRect();
      const pad = 12, vw = innerWidth, vh = innerHeight;
      let x = ev.clientX + pad, y = ev.clientY + pad;
      if (x + r.width > vw - 6) x = ev.clientX - r.width - pad;
      if (y + r.height > vh - 6) y = ev.clientY - r.height - pad;
      node.style.left = `${x + scrollX}px`;
      node.style.top = `${y + scrollY}px`;
    }
    function bind() {
      const c = el(); if (!c || c.dataset.bound) return;
      c.dataset.bound = "1";
      c.addEventListener("mouseenter", () => clearTimeout(hideTimer));
      c.addEventListener("mouseleave", () => schedule());
    }
    function schedule() { clearTimeout(hideTimer); hideTimer = setTimeout(() => {
      const c = el(); if (c) c.hidden = true; }, 280); }
    return {
      show(html, ev) { bind(); clearTimeout(hideTimer);
        const c = el(); if (!c) return; c.innerHTML = html; c.hidden = false; position(c, ev); },
      move(ev) { const c = el(); if (c && !c.hidden) position(c, ev); },
      hide() { schedule(); },
    };
  })();

  function citeCardHtml(keys) {
    return keys.map(k => {
      const link = linkFor(k);
      const rid = refIdFor(k);
      const ext = link ? ` <a class="ext" href="${esc(link)}" target="_blank" rel="noopener">Open ↗</a>` : "";
      const jump = rid ? ` <a class="ext" href="#${rid}">See in References ↓</a>` : "";
      return `<div class="dc-cite" data-key="${esc(k)}">${harvardFor(k)}${ext}${jump}</div>`;
    }).join("");
  }
  function keysFromTarget(el) {
    const a = el.closest && el.closest(".cite-link");
    if (a) return a.dataset.key ? [a.dataset.key] : [];
    const g = el.closest && el.closest(".cite-grp");
    if (!g) return [];
    return (g.dataset.keys || "").split(",").map(s => s.trim()).filter(Boolean);
  }
  function wireCiteHovers() {
    document.body.addEventListener("mouseover", e => {
      const keys = keysFromTarget(e.target);
      if (keys.length) card.show(citeCardHtml(keys), e);
    });
    document.body.addEventListener("mousemove", e => {
      if (e.target.closest && e.target.closest(".cite-grp,.cite-link")) card.move(e);
    });
    document.body.addEventListener("mouseout", e => {
      if (e.target.closest && e.target.closest(".cite-grp,.cite-link")) card.hide();
    });
    // Jump + flash when a cite-link is clicked.
    document.body.addEventListener("click", e => {
      const a = e.target.closest && e.target.closest(".cite-link");
      if (!a || !a.dataset.refid) return;
      const tgt = document.getElementById(a.dataset.refid);
      if (!tgt) return;
      e.preventDefault();
      tgt.scrollIntoView({ block: "center", behavior: "smooth" });
      tgt.classList.remove("flash"); void tgt.offsetWidth; tgt.classList.add("flash");
      setTimeout(() => tgt.classList.remove("flash"), 1600);
    });
  }

  // ───────────────────────── Comments ─────────────────────────
  const CMT_KEY = "pop-alignment-comments-v1";
  const CTX = 48;
  const SB = (window.SUPABASE_CFG && window.SUPABASE_CFG.url && window.SUPABASE_CFG.anonKey)
    ? { url: window.SUPABASE_CFG.url.replace(/\/$/, ""), key: window.SUPABASE_CFG.anonKey,
        table: window.SUPABASE_CFG.table || "comments" } : null;

  function sbHeaders(extra) { return Object.assign({ apikey: SB.key, Authorization: `Bearer ${SB.key}` }, extra || {}); }
  async function sbFetchAll() {
    const r = await fetch(`${SB.url}/rest/v1/${SB.table}?select=*`, { headers: sbHeaders() });
    if (!r.ok) throw new Error("supabase select " + r.status);
    const grouped = {};
    for (const row of await r.json())
      (grouped[row.chapter] = grouped[row.chapter] || []).push(row);
    return grouped;
  }
  async function sbInsert(slug, c) {
    const r = await fetch(`${SB.url}/rest/v1/${SB.table}`, { method: "POST",
      headers: sbHeaders({ "Content-Type": "application/json", Prefer: "return=minimal" }),
      body: JSON.stringify({ id: c.id, chapter: slug, name: c.name, body: c.body,
        quote: c.quote, prefix: c.prefix, suffix: c.suffix, ts: c.ts }) });
    if (!r.ok) throw new Error("supabase insert " + r.status);
  }
  async function sbDelete(id) {
    const r = await fetch(`${SB.url}/rest/v1/${SB.table}?id=eq.${encodeURIComponent(id)}`,
      { method: "DELETE", headers: sbHeaders({ Prefer: "return=minimal" }) });
    if (!r.ok) throw new Error("supabase delete " + r.status);
  }

  let _cache = null;
  function all() {
    if (_cache) return _cache;
    try { _cache = JSON.parse(localStorage.getItem(CMT_KEY)) || {}; } catch { _cache = {}; }
    return _cache;
  }
  function save(a) { _cache = a; try { localStorage.setItem(CMT_KEY, JSON.stringify(a)); } catch {} }
  function forSlug(s) { return all()[s] || []; }
  function newId() { return "c" + Math.abs(Date.now() ^ Math.floor(performance.now() * 1000)).toString(36); }

  // Comment host = the main column, minus interactive widgets.
  const HOST = () => document.querySelector("main");
  const REJECT = ".grid-block, svg, .stacks-controls, .stack-howto, #stack-selection-banner, " +
                 "#stack-legend, .cmt-plus, .cmt-pop, #data-card, #info-card, .cite-grp, script, style";

  function flat() {
    const host = HOST();
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue) return NodeFilter.FILTER_REJECT;
        if (n.parentElement && n.parentElement.closest(REJECT)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let text = ""; const map = []; let n;
    while ((n = walker.nextNode())) { map.push({ node: n, start: text.length, end: text.length + n.nodeValue.length }); text += n.nodeValue; }
    return { text, map };
  }
  function flatIndex(map, container, offset) {
    if (container.nodeType === 3) { const m = map.find(x => x.node === container); return m ? m.start + offset : null; }
    const ref = container.childNodes ? container.childNodes[offset] : null;
    if (ref) { const m = map.find(x => ref === x.node || (ref.contains && ref.contains(x.node))); if (m) return m.start; }
    const inside = map.filter(x => container.contains(x.node));
    if (inside.length) return offset === 0 ? inside[0].start : inside[inside.length - 1].end;
    return null;
  }
  function wrapFlat(map, start, end, id) {
    map.forEach(m => {
      if (m.end <= start || m.start >= end) return;
      const s = Math.max(start, m.start) - m.start, e = Math.min(end, m.end) - m.start;
      if (e <= s) return;
      const range = document.createRange();
      try { range.setStart(m.node, s); range.setEnd(m.node, e); } catch { return; }
      const mark = document.createElement("mark");
      mark.className = "cmt"; mark.dataset.cmtId = id;
      try { range.surroundContents(mark); } catch {}
    });
  }
  function locate(text, c) {
    if (!c.quote) return -1;
    const hits = []; let i = text.indexOf(c.quote);
    while (i !== -1) { hits.push(i); i = text.indexOf(c.quote, i + 1); }
    if (!hits.length) return -1;
    if (hits.length === 1) return hits[0];
    let best = hits[0], bestScore = -1;
    for (const h of hits) {
      const pre = text.slice(Math.max(0, h - CTX), h), suf = text.slice(h + c.quote.length, h + c.quote.length + CTX);
      let score = 0;
      for (let k = 1; k <= Math.min(pre.length, (c.prefix || "").length); k++) if (pre[pre.length - k] === c.prefix[c.prefix.length - k]) score++; else break;
      for (let k = 0; k < Math.min(suf.length, (c.suffix || "").length); k++) if (suf[k] === c.suffix[k]) score++; else break;
      if (score > bestScore) { bestScore = score; best = h; }
    }
    return best;
  }
  function slugForNode(node) {
    const sec = node.nodeType === 3 ? node.parentElement : node;
    const s = sec && sec.closest && sec.closest("section[id], article[id]");
    return (s && s.id) || "report";
  }
  function applyAll() {
    const host = HOST(); if (!host) return;
    host.querySelectorAll("mark.cmt").forEach(m => m.replaceWith(document.createTextNode(m.textContent)));
    host.normalize();
    const a = all();
    const list = Object.values(a).flat();
    if (!list.length) { updateRail(); return; }
    const { text, map } = flat();
    list.forEach(c => { const at = locate(text, c); if (at >= 0) wrapFlat(map, at, at + c.quote.length, c.id); });
    updateRail();
  }

  let _pending = null;
  function setup() {
    const plus = document.createElement("button");
    plus.className = "cmt-plus"; plus.type = "button"; plus.title = "Add a comment"; plus.textContent = "+"; plus.hidden = true;
    document.body.appendChild(plus);
    const hidePlus = () => { plus.hidden = true; };

    document.addEventListener("mouseup", () => setTimeout(() => {
      const host = HOST(); const sel = window.getSelection();
      if (!host || !sel || sel.isCollapsed || !sel.rangeCount) return hidePlus();
      const range = sel.getRangeAt(0);
      if (!host.contains(range.commonAncestorContainer)) return hidePlus();
      if (range.startContainer.parentElement && range.startContainer.parentElement.closest(REJECT)) return hidePlus();
      const quote = sel.toString().trim();
      if (quote.length < 2) return hidePlus();
      const { text, map } = flat();
      let s = flatIndex(map, range.startContainer, range.startOffset);
      let e = flatIndex(map, range.endContainer, range.endOffset);
      if (s == null || e == null) return hidePlus();
      if (s > e) [s, e] = [e, s];
      _pending = { slug: slugForNode(range.startContainer), quote: text.slice(s, e),
        prefix: text.slice(Math.max(0, s - CTX), s), suffix: text.slice(e, e + CTX) };
      const r = range.getBoundingClientRect();
      plus.style.left = `${scrollX + r.right + 6}px`;
      plus.style.top = `${scrollY + r.top - 6}px`;
      plus.hidden = false;
    }, 10));

    plus.addEventListener("mousedown", e => e.preventDefault());
    plus.addEventListener("click", e => { e.stopPropagation(); if (_pending) openForm(_pending, plus); hidePlus(); });
    document.addEventListener("mousedown", e => {
      if (!e.target.closest(".cmt-plus")) hidePlus();
      const mark = e.target.closest("mark.cmt"); if (mark) openView(mark);
      if (!e.target.closest(".cmt-pop, .cmt-plus, mark.cmt")) closePop();
    });
  }
  function lastName() { try { return localStorage.getItem("pop-cmt-name") || ""; } catch { return ""; } }
  function rememberName(n) { try { localStorage.setItem("pop-cmt-name", n); } catch {} }
  function closePop() { const p = document.getElementById("cmt-pop"); if (p) p.remove(); }
  function positionPop(pop, rect) {
    const w = pop.offsetWidth, vw = innerWidth;
    let left = scrollX + rect.left;
    if (left + w > scrollX + vw - 12) left = scrollX + vw - w - 12;
    pop.style.left = `${Math.max(scrollX + 8, left)}px`;
    pop.style.top = `${scrollY + rect.bottom + 8}px`;
  }
  function openForm(anchor, near) {
    closePop();
    const pop = document.createElement("div"); pop.className = "cmt-pop"; pop.id = "cmt-pop";
    pop.innerHTML =
      `<div class="cmt-quote">“${esc(anchor.quote.slice(0, 140))}${anchor.quote.length > 140 ? "…" : ""}”</div>` +
      `<input class="cmt-name" type="text" placeholder="Your name" value="${esc(lastName())}">` +
      `<textarea class="cmt-text" rows="3" placeholder="Your comment…"></textarea>` +
      `<div class="cmt-actions"><button type="button" class="cmt-cancel">Cancel</button>` +
      `<button type="button" class="cmt-save">Add comment</button></div>`;
    document.body.appendChild(pop);
    positionPop(pop, near.getBoundingClientRect());
    pop.querySelector(".cmt-text").focus();
    pop.querySelector(".cmt-cancel").onclick = closePop;
    pop.querySelector(".cmt-save").onclick = () => {
      const name = pop.querySelector(".cmt-name").value.trim() || "Anonymous";
      const body = pop.querySelector(".cmt-text").value.trim();
      if (!body) { pop.querySelector(".cmt-text").focus(); return; }
      rememberName(name);
      const a = all(); const slug = anchor.slug || "report";
      const entry = { id: newId(), quote: anchor.quote, prefix: anchor.prefix, suffix: anchor.suffix, name, body, ts: new Date().toISOString() };
      (a[slug] = a[slug] || []).push(entry); save(a);
      if (SB) sbInsert(slug, entry).catch(e => { console.warn(e); alert("Saved locally, but could not reach the shared store."); });
      closePop(); window.getSelection().removeAllRanges(); applyAll();
    };
  }
  function openView(mark) {
    const id = mark.dataset.cmtId;
    let slug = null, item = null;
    const a = all();
    for (const s of Object.keys(a)) { const f = a[s].find(c => c.id === id); if (f) { slug = s; item = f; break; } }
    if (!item) return;
    closePop();
    const pop = document.createElement("div"); pop.className = "cmt-pop cmt-view"; pop.id = "cmt-pop";
    pop.innerHTML =
      `<div class="cmt-entry"><div class="cmt-meta"><span class="cmt-who">${esc(item.name)}</span>` +
      `<span class="cmt-when">${new Date(item.ts).toLocaleDateString()}</span></div>` +
      `<div class="cmt-body">${esc(item.body)}</div>` +
      `<button type="button" class="cmt-del" data-id="${item.id}">Delete</button></div>` +
      `<div class="cmt-actions"><button type="button" class="cmt-cancel">Close</button></div>`;
    document.body.appendChild(pop);
    positionPop(pop, mark.getBoundingClientRect());
    pop.querySelector(".cmt-cancel").onclick = closePop;
    pop.querySelector(".cmt-del").onclick = () => { deleteComment(id, slug); closePop(); };
  }
  function deleteComment(id, slug) {
    const a = all();
    if (a[slug]) { a[slug] = a[slug].filter(c => c.id !== id); if (!a[slug].length) delete a[slug]; }
    save(a);
    if (SB) sbDelete(id).catch(e => console.warn(e));
    applyAll();
  }
  function sectionLabel(slug) {
    const link = document.querySelector(`.side-nav a[data-target="${slug}"]`);
    if (link) return link.textContent.trim();
    const h = document.querySelector(`#${CSS.escape(slug)} h2, #${CSS.escape(slug)} h3`);
    return h ? h.textContent.trim() : slug;
  }
  function updateRail() {
    const nav = document.getElementById("chapter-comments");
    const list = document.getElementById("chapter-comments-list");
    if (!nav || !list) return;
    const a = all();
    const total = Object.values(a).reduce((n, v) => n + v.length, 0);
    if (!total) { list.innerHTML = ""; nav.hidden = true; return; }
    nav.hidden = false;
    let html = `<li class="cmt-rail-count">${total} comment${total === 1 ? "" : "s"}</li>`;
    Object.keys(a).forEach(slug => {
      a[slug].forEach(c => {
        const body = `${esc((c.body || "").slice(0, 60))}${(c.body || "").length > 60 ? "…" : ""}`;
        html += `<li class="cmt-rail-item" data-jump="${c.id}" tabindex="0" role="button">` +
          `<button type="button" class="cmt-rail-del" data-del="${c.id}" data-slug="${slug}" title="Delete" aria-label="Delete">×</button>` +
          `<span class="cmt-rail-ch">${esc(sectionLabel(slug))}</span>` +
          `<span class="cmt-rail-who">${esc(c.name || "Anon")}</span>: ${body}</li>`;
      });
    });
    html += `<li><button type="button" class="cmt-export" data-export>⤓ Export comments</button></li>`;
    list.innerHTML = html;
  }
  function jumpTo(id) {
    let mark = document.querySelector(`mark.cmt[data-cmt-id="${id}"]`);
    if (!mark) { applyAll(); mark = document.querySelector(`mark.cmt[data-cmt-id="${id}"]`); }
    if (!mark) return;
    mark.scrollIntoView({ block: "center", behavior: "smooth" });
    document.querySelectorAll("mark.cmt.flash").forEach(m => m.classList.remove("flash"));
    mark.classList.add("flash"); setTimeout(() => mark.classList.remove("flash"), 1600);
  }
  function exportComments() {
    const a = all();
    const lines = ["# Comments on “The actors in AI alignment”", ""];
    Object.keys(a).forEach(slug => {
      lines.push(`## ${sectionLabel(slug)}`, "");
      a[slug].forEach(c => {
        lines.push(`- **${c.name}** (${new Date(c.ts).toLocaleString()})`);
        lines.push(`  > ${c.quote}`);
        lines.push(`  ${c.body}`, "");
      });
    });
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = "alignment-actors-comments.md"; link.click();
    URL.revokeObjectURL(url);
  }
  document.addEventListener("click", e => {
    const del = e.target.closest("#chapter-comments-list [data-del]");
    if (del) { e.stopPropagation(); deleteComment(del.dataset.del, del.dataset.slug); return; }
    if (e.target.closest("[data-export]")) { exportComments(); return; }
    const item = e.target.closest("#chapter-comments-list [data-jump]");
    if (item) jumpTo(item.dataset.jump);
  });
  document.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const item = e.target.closest("#chapter-comments-list [data-jump]");
    if (item) jumpTo(item.dataset.jump);
  });

  async function cmtHydrate() {
    if (!SB) return;
    try { const g = await sbFetchAll(); _cache = g; try { localStorage.setItem(CMT_KEY, JSON.stringify(g)); } catch {} applyAll(); }
    catch (e) { console.warn("comments backend unreachable, using local cache:", e); }
  }

  // ───────────────────────── Boot ─────────────────────────
  async function init() {
    try {
      const r = await fetch("bibliography.json", { cache: "no-store" });
      if (r.ok) BIB = await r.json();
    } catch (e) { console.warn("bibliography.json not loaded:", e); }
    buildRefIndex();
    renderCites();
    wireCiteHovers();
    setup();
    applyAll();
    if (SB) cmtHydrate();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
