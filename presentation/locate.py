#!/usr/bin/env python3
"""Find where each slide's screenshot sits on the live page, in the slide's state.

For every live slide: open its page at a given window width, apply the slide's steps
(driver.js), take a full-page screenshot, and look for the slide's screenshot in it by
template matching over a range of scales. The result — page, width, scroll position, crop
and scale — is what the presentation uses to show the same region live.

    python3 docs/presentation/locate.py [slide numbers] [--widths 1440,1512]
Needs the docs folder served at http://localhost:8765.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import numpy as np
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
SCRATCH = Path(sys.argv[sys.argv.index("--scratch") + 1]) if "--scratch" in sys.argv else HERE
BASE = "http://localhost:8765/"
from slides_spec import SPEC  # noqa: E402


def screenshot(page, url, steps, width):
    page.set_viewport_size({"width": width, "height": 1000})
    page.goto(url + ("&" if "?" in url else "?") + "embed=1", wait_until="load")
    page.add_script_tag(path=str(HERE / "driver.js"))
    name = url.split("?")[0]
    page.evaluate(f"PresentationDriver.ready(window, {json.dumps(name)})")
    page.evaluate(f"PresentationDriver.apply(window, {json.dumps(steps)})")
    page.wait_for_timeout(600)
    png = page.screenshot(full_page=True)
    return cv2.imdecode(np.frombuffer(png, np.uint8), cv2.IMREAD_GRAYSCALE)


def region(page, selector, margin=(260, 320)):
    """The figure's box on the page, widened, where the screenshot is looked for."""
    r = page.evaluate(f"""(() => {{ const b = document.querySelector({json.dumps(selector)}).getBoundingClientRect();
        return [b.left + scrollX, b.top + scrollY, b.right + scrollX, b.bottom + scrollY]; }})()""")
    return [int(r[0] - margin[0]), int(r[1] - margin[1]), int(r[2] + margin[0]), int(r[3] + margin[1])]


def locate(shot, template, scales):
    best = (-1, None, None)
    small_shot = cv2.resize(shot, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
    for s in scales:
        t = cv2.resize(template, None, fx=s * 0.5, fy=s * 0.5, interpolation=cv2.INTER_AREA)
        if t.shape[0] >= small_shot.shape[0] or t.shape[1] >= small_shot.shape[1]:
            continue
        res = cv2.matchTemplate(small_shot, t, cv2.TM_CCOEFF_NORMED)
        _, score, _, loc = cv2.minMaxLoc(res)
        if score > best[0]:
            best = (score, s, (loc[0] * 2, loc[1] * 2))
    return best


def main() -> None:
    flags_with_values = {"--widths", "--scales", "--scratch"}
    argv = sys.argv[1:]
    args = [a for i, a in enumerate(argv) if a.isdigit() and (i == 0 or argv[i - 1] not in flags_with_values)]
    widths = [1512]
    if "--widths" in sys.argv:
        widths = [int(w) for w in sys.argv[sys.argv.index("--widths") + 1].split(",")]
    scales = [x / 100 for x in range(40, 61, 2)]
    if "--scales" in sys.argv:
        lo, hi = sys.argv[sys.argv.index("--scales") + 1].split(",")
        scales = [x / 1000 for x in range(int(float(lo) * 1000), int(float(hi) * 1000) + 1, 5)]
    out_path = HERE / "located.json"
    located = json.loads(out_path.read_text()) if out_path.exists() else {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(device_scale_factor=1)
        for n, spec in SPEC.items():
            if args and str(n) not in args:
                continue
            template = cv2.imread(str(next(SCRATCH.glob(f"base{n:02d}.*"))), cv2.IMREAD_GRAYSCALE)
            results = []
            for w in widths:
                shot = screenshot(page, BASE + spec["page"], spec["steps"], w)
                ox = oy = 0
                if spec.get("near"):
                    x0, y0, x1, y1 = region(page, spec["near"])
                    x0, y0 = max(0, x0), max(0, y0)
                    shot = shot[y0:y1, x0:]
                    ox, oy = x0, y0
                score, s, (x, y) = locate(shot, template, scales)
                x, y = x + ox, y + oy
                results.append({"width": w, "score": round(score, 3), "scale": s, "x": x, "y": y,
                                "w": round(template.shape[1] * s), "h": round(template.shape[0] * s)})
                print(n, results[-1], flush=True)
            best = max(results, key=lambda r: r["score"])
            located[str(n)] = {**best, "page": spec["page"], "steps": spec["steps"]}
            out_path.write_text(json.dumps(located, indent=1))
        browser.close()


if __name__ == "__main__":
    main()
