/* Three figures added in September 2026, built from the document corpus itself:
   A. the discourse peculiar to each document type (keyness.json)
   B. the citation network between documents (citations.json)
   C. the actors named in each document type and what they do (actors_by_type.json)
   Each figure renders only if its container is present on the page. */
(function () {
  "use strict";

  var PALETTE = ["#3f6fb5", "#c2632c", "#4a8a67", "#8b5a9e", "#b0843a", "#5b8ca8",
                 "#a8555f", "#6b7a4a", "#8a6a55", "#7a7a8c", "#457f8a", "#9c6b3f"];
  var colourOf = function (values) {
    var scale = {};
    values.forEach(function (v, i) { scale[v] = PALETTE[i % PALETTE.length]; });
    return function (v) { return scale[v] || "#8a8a8a"; };
  };
  var el = function (id) { return document.getElementById(id); };
  var clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); };

  function typeSelector(container, types, onChange) {
    var bar = document.createElement("div");
    bar.className = "fig2-types";
    types.forEach(function (t, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = t;
      b.className = "fig2-type" + (i === 0 ? " is-on" : "");
      b.addEventListener("click", function () {
        bar.querySelectorAll(".fig2-type").forEach(function (o) { o.classList.remove("is-on"); });
        b.classList.add("is-on");
        onChange(t);
      });
      bar.appendChild(b);
    });
    container.appendChild(bar);
  }

  /* ── A. Discourse of each document type ─────────────────────────────────── */
  function keyness(data) {
    var host = el("fig-keyness");
    if (!host) return;
    var types = Object.keys(data).sort(function (a, b) {
      return data[b][0].category_docs - data[a][0].category_docs;
    });
    var chart = document.createElement("div");
    chart.className = "fig2-chart";
    typeSelector(host, types, draw);
    host.appendChild(chart);

    function draw(type) {
      clear(chart);
      var terms = data[type].slice(0, 18);
      var max = d3.max(terms, function (d) { return d.z; });
      var note = document.createElement("p");
      note.className = "fig2-note";
      note.textContent = terms[0].category_docs + " documents of this type. Bars show how much more "
        + "of this type's documents use the phrase than the rest of the corpus.";
      chart.appendChild(note);
      var list = document.createElement("ul");
      list.className = "fig2-bars";
      terms.forEach(function (t) {
        var li = document.createElement("li");
        var label = document.createElement("span");
        label.className = "fig2-term";
        label.textContent = t.term;
        var track = document.createElement("span");
        track.className = "fig2-track";
        var bar = document.createElement("span");
        bar.className = "fig2-bar";
        bar.style.width = Math.max(2, (t.z / max) * 100) + "%";
        bar.style.background = PALETTE[0];
        track.appendChild(bar);
        var value = document.createElement("span");
        value.className = "fig2-value";
        value.textContent = t.docs + "/" + t.category_docs + " docs";
        li.appendChild(label); li.appendChild(track); li.appendChild(value);
        list.appendChild(li);
      });
      chart.appendChild(list);
    }
    draw(types[0]);
  }

  /* ── B. Citation network ────────────────────────────────────────────────── */
  function network(data) {
    var host = el("fig-network");
    if (!host) return;
    var companies = Array.from(new Set(data.nodes.map(function (n) { return n.company; }))).sort();
    var categories = Array.from(new Set(data.nodes.map(function (n) { return n.category; }))).sort();
    var colour = colourOf(categories);
    var state = {company: "All companies"};

    var controls = document.createElement("div");
    controls.className = "fig2-types";
    ["All companies"].concat(companies).forEach(function (c, i) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = c;
      b.className = "fig2-type" + (i === 0 ? " is-on" : "");
      b.addEventListener("click", function () {
        controls.querySelectorAll(".fig2-type").forEach(function (o) { o.classList.remove("is-on"); });
        b.classList.add("is-on"); state.company = c; draw();
      });
      controls.appendChild(b);
    });
    host.appendChild(controls);

    var legend = document.createElement("div");
    legend.className = "fig2-legend";
    categories.forEach(function (c) {
      var s = document.createElement("span");
      s.className = "fig2-key";
      s.innerHTML = '<i style="background:' + colour(c) + '"></i>' + c;
      legend.appendChild(s);
    });
    host.appendChild(legend);

    var wrap = document.createElement("div");
    wrap.className = "fig2-canvas";
    host.appendChild(wrap);
    var tip = document.createElement("div");
    tip.className = "fig2-tip"; tip.hidden = true;
    host.appendChild(tip);

    function draw() {
      clear(wrap);
      var nodes = data.nodes.filter(function (n) {
        return state.company === "All companies" || n.company === state.company;
      }).map(function (n) { return Object.assign({}, n); });
      var keep = new Set(nodes.map(function (n) { return n.key; }));
      var links = data.edges.filter(function (e) {
        return keep.has(e.source) && keep.has(e.target);
      }).map(function (e) { return {source: e.source, target: e.target, type: e.type}; });
      // Keep the picture readable: drop documents that end up with no visible tie.
      var linked = new Set();
      links.forEach(function (l) { linked.add(l.source); linked.add(l.target); });
      nodes = nodes.filter(function (n) { return linked.has(n.key); });

      var width = wrap.clientWidth || 900, height = 560;
      var svg = d3.select(wrap).append("svg")
        .attr("viewBox", "0 0 " + width + " " + height)
        .attr("width", "100%").attr("height", height);
      var g = svg.append("g");
      svg.call(d3.zoom().scaleExtent([0.3, 4]).on("zoom", function (ev) {
        g.attr("transform", ev.transform);
      }));

      var r = function (n) { return 3 + Math.sqrt(n.cited_by) * 2.4; };
      var sim = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(function (d) { return d.key; }).distance(60).strength(0.25))
        .force("charge", d3.forceManyBody().strength(-90))
        .force("centre", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(function (d) { return r(d) + 3; }));

      var link = g.append("g").attr("stroke", "#c9c4bb").attr("stroke-opacity", 0.55)
        .selectAll("line").data(links).join("line")
        .attr("stroke-width", function (d) { return d.type === "title" ? 1.4 : 0.7; })
        .attr("stroke-dasharray", function (d) { return d.type === "title" ? null : "2,2"; });

      var node = g.append("g").selectAll("circle").data(nodes).join("circle")
        .attr("r", r)
        .attr("fill", function (d) { return colour(d.category); })
        .attr("stroke", "#fff").attr("stroke-width", 0.8)
        .style("cursor", "pointer")
        .on("mousemove", function (ev, d) {
          tip.hidden = false;
          tip.innerHTML = "<strong>" + d.title + "</strong><br>" + d.company + " — " + d.category
            + "<br>cited by " + d.cited_by + ", cites " + d.cites;
          var box = host.getBoundingClientRect();
          tip.style.left = (ev.clientX - box.left + 12) + "px";
          tip.style.top = (ev.clientY - box.top + 12) + "px";
        })
        .on("mouseleave", function () { tip.hidden = true; })
        .on("click", function (ev, d) { if (d.url) window.open(d.url, "_blank", "noopener"); })
        .call(d3.drag()
          .on("start", function (ev, d) { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on("drag", function (ev, d) { d.fx = ev.x; d.fy = ev.y; })
          .on("end", function (ev, d) { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

      var labelled = nodes.slice().sort(function (a, b) { return b.cited_by - a.cited_by; }).slice(0, 12);
      var label = g.append("g").selectAll("text").data(labelled).join("text")
        .text(function (d) { return d.title.length > 42 ? d.title.slice(0, 40) + "…" : d.title; })
        .attr("font-size", 10).attr("fill", "#2b2b2b").attr("pointer-events", "none")
        .attr("paint-order", "stroke").attr("stroke", "#fdfcf9").attr("stroke-width", 3);

      sim.on("tick", function () {
        link.attr("x1", function (d) { return d.source.x; }).attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; }).attr("y2", function (d) { return d.target.y; });
        node.attr("cx", function (d) { return d.x; }).attr("cy", function (d) { return d.y; });
        label.attr("x", function (d) { return d.x + r(d) + 3; }).attr("y", function (d) { return d.y + 3; });
      });

      var count = document.createElement("p");
      count.className = "fig2-note";
      count.textContent = nodes.length + " documents and " + links.length
        + " ties. A solid line means one document names another by title; a dotted line means it links to it. "
        + "Circles grow with the number of documents citing them. Click a circle to open the document.";
      wrap.appendChild(count);
    }
    draw();
  }

  /* ── C. Actors per document type ────────────────────────────────────────── */
  function actors(data) {
    var host = el("fig-actors");
    if (!host) return;
    var types = Object.keys(data).sort(function (a, b) {
      return d3.sum(data[b], function (d) { return d.documents; })
           - d3.sum(data[a], function (d) { return d.documents; });
    });
    var relations = Array.from(new Set([].concat.apply([], types.map(function (t) {
      return data[t].map(function (a) { return a.main_relation; });
    })))).sort();
    var colour = colourOf(relations);

    var legend = document.createElement("div");
    legend.className = "fig2-legend";
    relations.forEach(function (rel) {
      var s = document.createElement("span");
      s.className = "fig2-key";
      s.innerHTML = '<i style="background:' + colour(rel) + '"></i>' + rel;
      legend.appendChild(s);
    });

    var chart = document.createElement("div");
    chart.className = "fig2-chart";
    typeSelector(host, types, draw);
    host.appendChild(legend);
    host.appendChild(chart);

    function draw(type) {
      clear(chart);
      var items = data[type].slice(0, 24);
      var width = chart.clientWidth || 900, height = 420;
      var root = d3.hierarchy({children: items}).sum(function (d) { return d.documents; })
        .sort(function (a, b) { return b.value - a.value; });
      d3.treemap().size([width, height]).paddingInner(3).round(true)(root);
      var svg = d3.select(chart).append("svg")
        .attr("viewBox", "0 0 " + width + " " + height)
        .attr("width", "100%").attr("height", height);
      var cell = svg.selectAll("g").data(root.leaves()).join("g")
        .attr("transform", function (d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });
      cell.append("rect")
        .attr("width", function (d) { return d.x1 - d.x0; })
        .attr("height", function (d) { return d.y1 - d.y0; })
        .attr("fill", function (d) { return colour(d.data.main_relation); })
        .attr("rx", 2);
      cell.append("title").text(function (d) {
        return d.data.actor + " — " + d.data.main_relation + "\n" + d.data.documents
          + " documents of this type";
      });
      cell.append("text").attr("x", 5).attr("y", 14)
        .attr("font-size", 11).attr("fill", "#fff")
        .text(function (d) {
          var space = d.x1 - d.x0;
          if (space < 46 || d.y1 - d.y0 < 18) return "";
          var chars = Math.floor(space / 6.2);
          return d.data.actor.length > chars ? d.data.actor.slice(0, chars - 1) + "…" : d.data.actor;
        });
      cell.append("text").attr("x", 5).attr("y", 27)
        .attr("font-size", 9.5).attr("fill", "rgba(255,255,255,.85)")
        .text(function (d) {
          return (d.x1 - d.x0) < 80 || (d.y1 - d.y0) < 34 ? "" : d.data.documents + " docs";
        });
      var note = document.createElement("p");
      note.className = "fig2-note";
      note.textContent = "Each square is an actor named in documents of this type; its size is the number "
        + "of such documents naming it, and its colour the relation those documents most often state. "
        + "The authoring company and its own models are excluded.";
      chart.appendChild(note);
    }
    draw(types[0]);
  }

  function load(file, fn) {
    fetch(file + "?v=20260918").then(function (r) { return r.json(); }).then(fn)
      .catch(function (e) { console.warn("figures2: could not load " + file, e); });
  }
  document.addEventListener("DOMContentLoaded", function () {
    if (el("fig-keyness")) load("keyness.json", keyness);
    if (el("fig-network")) load("citations.json", network);
    if (el("fig-actors")) load("actors_by_type.json", actors);
  });
})();
