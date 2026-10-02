#!/usr/bin/env python3
"""Side by side: each slide's screenshot and the live region the presentation will show."""
import json, sys
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
HERE = Path(__file__).resolve().parent
SCRATCH = Path(sys.argv[1]); only = [a for a in sys.argv[2:]]
loc = json.loads((HERE / "crops.json").read_text())
with sync_playwright() as pw:
    b = pw.chromium.launch(); page = b.new_page(device_scale_factor=1)
    for n, L in sorted(loc.items(), key=lambda kv: int(kv[0])):
        if only and n not in only: continue
        page.set_viewport_size({"width": L["width"], "height": 1000})
        page.goto(f"http://localhost:8765/{L['page']}?embed=1", wait_until="load")
        page.add_script_tag(path=str(HERE / "driver.js"))
        page.evaluate(f"PresentationDriver.ready(window, {json.dumps(L['page'])})")
        page.evaluate(f"PresentationDriver.apply(window, {json.dumps(L['steps'])})")
        page.wait_for_timeout(500)
        out = SCRATCH / f"live{int(n):02d}.png"
        ax, ay = page.evaluate("""([sel, text]) => { let els = [...document.querySelectorAll(sel)];
          if (text) els = els.filter(e => e.textContent.trim().toLowerCase().startsWith(text.toLowerCase()));
          const b = els[0].getBoundingClientRect(); return [b.left + scrollX, b.top + scrollY]; }""", [L["anchor"], L.get("text")])
        page.screenshot(path=str(out), full_page=True, clip={"x": max(0, ax + L["dx"]), "y": ay + L["dy"], "width": L["w"], "height": L["h"]})
        base = Image.open(next(SCRATCH.glob(f"base{int(n):02d}.*"))).convert("RGB")
        live = Image.open(out).convert("RGB")
        H = 360
        a = base.resize((int(base.width * H / base.height), H)); c = live.resize((int(live.width * H / live.height), H))
        im = Image.new("RGB", (a.width + c.width + 20, H + 24), "white"); im.paste(a, (0, 24)); im.paste(c, (a.width + 20, 24))
        from PIL import ImageDraw; ImageDraw.Draw(im).text((4, 4), f"slide {n}  score {L['score']}  (left: slide, right: live)", fill="red")
        im.save(SCRATCH / f"cmp{int(n):02d}.png")
    b.close()
