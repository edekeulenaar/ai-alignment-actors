/* The presentation as a deck of slides.
 *
 * Every slide is the slide image from the PDF. Slides that show a figure of the site carry
 * the live figure instead of its screenshot: the page is opened in a frame at the window
 * width the screenshot was taken at (1512 px), put into the slide's state (driver.js), and
 * scrolled and scaled so that the same region shows through the slide's frame. The rest of
 * the slide — title, circles, documents laid over the figure — is an image on top, with a
 * transparent hole where the screenshot was. Until the live figure is ready the slide shows
 * its screenshot.
 */
(function () {
  "use strict";
  const V = "20261002p3";
  const stage = document.getElementById("stage");
  const counter = document.getElementById("counter");
  const W = 1280, H = 720;
  let deck = null, current = 0;
  const frames = new Map();                 // slide index → its built element (kept for neighbours)

  // ── Fit the 1280 × 720 stage to the window ─────────────────────
  const wrap = document.querySelector(".stage-wrap");
  const sizer = document.createElement("div");
  sizer.className = "stage-sizer";
  wrap.appendChild(sizer);
  sizer.appendChild(stage);
  function fit() {
    const full = !!document.fullscreenElement;
    const availW = full ? innerWidth : Math.min(innerWidth - 32, 1600);
    const availH = full ? innerHeight : innerHeight - 120;
    const s = Math.max(0.2, Math.min(availW / W, availH / H));
    document.documentElement.style.setProperty("--s", s);
    stage.style.transform = `scale(${s})`;
  }
  addEventListener("resize", fit);
  document.addEventListener("fullscreenchange", fit);

  // ── Slides ──────────────────────────────────────────────────────
  function build(i) {
    if (frames.has(i)) return frames.get(i);
    const s = deck.slides[i];
    const el = document.createElement("div");
    el.className = "slide";
    el.hidden = true;
    if (s.live) {
      const poster = img(s.poster, "layer poster");
      const live = document.createElement("div");
      live.className = "live";
      const [bx, by, bw, bh] = s.box;
      Object.assign(live.style, { left: bx + "%", top: by + "%", width: bw + "%", height: bh + "%" });
      const loading = document.createElement("span");
      loading.className = "loading";
      loading.textContent = "loading the live figure…";
      el.append(poster, live, img(s.img, "layer overlay"), loading);
      startLive(s, live, poster, loading);
    } else {
      el.append(img(s.img, "layer"));
    }
    for (const l of s.links || []) {
      const a = document.createElement("a");
      a.className = "link"; a.href = l.uri; a.target = "_blank"; a.rel = "noopener";
      const [x0, y0, x1, y1] = l.rect;
      Object.assign(a.style, { left: x0 + "%", top: y0 + "%", width: (x1 - x0) + "%", height: (y1 - y0) + "%" });
      el.appendChild(a);
    }
    stage.appendChild(el);
    frames.set(i, el);
    return el;
  }

  function img(src, cls) {
    const im = document.createElement("img");
    im.src = `presentation/${src}?v=${V}`;
    im.className = cls; im.alt = ""; im.draggable = false;
    return im;
  }

  function startLive(s, holder, poster, loading) {
    const L = s.live;
    const frame = document.createElement("iframe");
    frame.title = "Live figure";
    frame.loading = "eager";
    frame.width = L.width;
    frame.height = L.h;                       // the frame's viewport is exactly the crop
    frame.src = `${L.page}?embed=1&v=${V}`;
    holder.appendChild(frame);
    const place = () => {
      const scale = holder.clientWidth / L.w;
      frame.style.transform = `scale(${scale}) translate(${-frame._cropX || 0}px, 0)`;
    };
    frame.addEventListener("load", async () => {
      const win = frame.contentWindow, doc = frame.contentDocument;
      try {
        await inject(doc, "presentation/driver.js");
        await win.PresentationDriver.ready(win, L.page);
        await win.PresentationDriver.apply(win, L.steps);
        // The page may still grow above the figure (fonts, figures drawn late), and some steps
        // scroll it, so the crop is measured again a few times after loading.
        const settle = () => {
          const r = anchor(doc, L.anchor, L.text).getBoundingClientRect();
          const x = r.left + win.scrollX + L.dx, y = r.top + win.scrollY + L.dy;
          frame._cropX = Math.max(0, x);
          win.scrollTo(0, Math.max(0, y));
          place();
        };
        settle();
        [300, 1000, 2500, 5000].forEach(ms => setTimeout(settle, ms));
        poster.style.visibility = "hidden";
        loading.remove();
      } catch (e) {
        loading.textContent = "showing the slide's screenshot";
        console.warn("slide", s.n, e);
      }
    });
    new ResizeObserver(place).observe(holder);
  }

  function inject(doc, src) {
    return new Promise((resolve, reject) => {
      const sc = doc.createElement("script");
      sc.src = `${src}?v=${V}`;
      sc.onload = resolve; sc.onerror = reject;
      doc.head.appendChild(sc);
    });
  }

  function anchor(doc, sel, text) {
    let els = [...doc.querySelectorAll(sel)];
    if (text) els = els.filter(e => e.textContent.trim().toLowerCase().startsWith(text.toLowerCase()));
    if (!els.length) throw new Error("anchor not found: " + sel);
    return els[0];
  }

  // ── Navigation ─────────────────────────────────────────────────
  function show(i) {
    i = Math.max(0, Math.min(deck.slides.length - 1, i));
    current = i;
    for (const [k, el] of frames) el.hidden = k !== i;
    build(i).hidden = false;
    counter.textContent = `${i + 1} / ${deck.slides.length}`;
    if (location.hash !== `#${i + 1}`) history.replaceState(null, "", `#${i + 1}`);
    // Prepare the neighbours, and drop live frames far from the current slide.
    [i + 1, i - 1].forEach(k => { if (k >= 0 && k < deck.slides.length) build(k); });
    for (const [k, el] of frames) {
      if (Math.abs(k - i) > 2) { el.remove(); frames.delete(k); }
    }
  }
  document.getElementById("prev").onclick = () => show(current - 1);
  document.getElementById("next").onclick = () => show(current + 1);
  document.getElementById("full").onclick = () =>
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  addEventListener("keydown", e => {
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); show(current + 1); }
    if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); show(current - 1); }
    if (e.key === "Home") show(0);
    if (e.key === "End") show(deck.slides.length - 1);
    if (e.key === "f") document.getElementById("full").click();
  });
  addEventListener("hashchange", () => {
    const n = parseInt(location.hash.slice(1), 10);
    if (n && n - 1 !== current) show(n - 1);
  });

  fetch(`presentation/slides.json?v=${V}`).then(r => r.json()).then(d => {
    deck = d;
    fit();
    const n = parseInt(location.hash.slice(1), 10);
    show(n ? n - 1 : 0);
  });
})();
