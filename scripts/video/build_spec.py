import json, sys
D = sys.argv[1] if len(sys.argv) > 1 else "take"  # folder written by record-intro.mjs
m = json.load(open(f"{D}/take.json")); ev = m["events"]
A0 = ev["click_search"] - 0.55
A1 = ev["click_show"] + 1.35
B1 = ev["hover"] + 2.05
B0 = B1 - (10.0 - (A1 - A0))
La = lambda t: round(t - A0, 3); Lb = lambda t: round(t - B0, 3)
pill = "bosphore-1819.vercel.app/?lang=en"
segA = {"src": f"{D}/raw.mp4", "start": round(A0, 3), "end": round(A1, 3), "pill": pill,
  "captions": [
    {"text": "Bosphore 1819 · 387 labels, three languages", "start": 0.0, "end": La(ev["click_search"] + 0.3)},
    {"text": "Search: hisar", "start": La(ev["click_search"] + 0.35), "end": La(ev["click_cb1"] - 0.35)},
    {"text": "Select both fortresses", "start": La(ev["click_cb1"] - 0.3), "end": La(ev["click_show"] - 0.15)},
    {"text": "Show on map", "start": La(ev["click_show"] - 0.1), "end": La(A1)}],
  "cursor": {"rest": [980, 430], "moves": [
    {"to": m["search"], "start": La(ev["click_search"] - 0.5), "end": La(ev["click_search"] - 0.1), "click": La(ev["click_search"])},
    {"to": m["cb1"], "start": La(ev["click_cb1"] - 0.6), "end": La(ev["click_cb1"] - 0.1), "click": La(ev["click_cb1"])},
    {"to": m["cb2"], "start": La(ev["click_cb2"] - 0.5), "end": La(ev["click_cb2"] - 0.1), "click": La(ev["click_cb2"])},
    {"to": m["show"], "start": La(ev["click_show"] - 0.6), "end": La(ev["click_show"] - 0.1), "click": La(ev["click_show"])}]}}
segB = {"src": f"{D}/raw.mp4", "start": round(B0, 3), "end": round(B1, 3), "pill": pill,
  "captions": [{"text": "French · Ottoman Turkish · modern name", "start": Lb(ev["hover"] + 0.15), "end": Lb(B1)}],
  "cursor": {"rest": m["show"], "moves": [{"to": m["hover"], "start": max(0.05, Lb(ev["hover_start"] - 0.05)), "end": Lb(ev["hover"] + 0.3)}]}}
spec = {"output": f"{D}/demo-10s-en.mp4", "width": 2560, "height": 1600, "fps": 60, "ui_scale": 2, "crf": 18,
  "fonts": {"sans": "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "mono": "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf"},
  "sprites": {"cursor": "sprites/cursor.png", "press": "sprites/cursor-press.png", "ripple": "sprites/ripple/r%02d.png"},
  "segments": [segA, segB]}
json.dump(spec, open(f"{D}/spec.json", "w"), indent=1)
print("A", round(A0,2), round(A1,2), "B", round(B0,2), round(B1,2), "total", round((A1-A0)+(B1-B0),2))
