"""
Extract the peacock artwork from the Illustrator (.ai, PDF-compatible) source into
typed SVG data for the interactive <Peacock> component.

    python3 -m venv .venv && .venv/bin/pip install pymupdf
    .venv/bin/python scripts/extract_peacock.py

Reads   creative-peacock-design/454696-PFDO7O-178.ai  (OBJECTS layer only — the
        TEXTURE grain layer and the credit layer are skipped)
Writes  lib/peacock/art.generated.ts

The OBJECTS layer is painted in a fixed order:
  0–16    pale-mint scalloped backing shapes (radial gradient spokes)
  17–196  15 feathers × 12 parts, left-bottom → right-bottom
          [blade A, glint, blade B, glint, inner, teal band, inner 2, dark band,
           eye outline, eye, pupil ring, pupil]
  197–215 body: backing arches, legs, feet, body, head, face details
Gradients (PDF axial/radial shadings) are kept as real SVG gradients.
"""
import json
import math
import re
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "creative-peacock-design" / "454696-PFDO7O-178.ai"
OUT = ROOT / "lib" / "peacock" / "art.generated.ts"

PAGE_H = 500.0
FEATHER_START, FEATHER_COUNT, FEATHER_PARTS = 17, 15, 12
BACKER_END = 17
BODY_START = FEATHER_START + FEATHER_COUNT * FEATHER_PARTS

doc = pymupdf.open(str(SRC))
page = doc[0]
lines = page.read_contents().decode("latin-1").split("\n")
start = next(i for i, l in enumerate(lines) if "/MC1 BDC" in l)
end = next(i for i, l in enumerate(lines) if i > start and l.strip() == "EMC")
body_ops = "\n".join(lines[start + 1 : end])

res = doc.xref_get_key(page.xref, "Resources")[1]
shading_xref = {n: int(x) for n, x in re.findall(r"/(Sh\d+) (\d+) 0 R", res)}


def nums(s):
    return [float(v) for v in s.split()]


def grab(pattern, text):
    m = re.search(pattern, text)
    if not m:
        raise ValueError(pattern)
    return m.group(1)


def fn_stops(xref):
    o = doc.xref_object(xref)
    if int(grab(r"/FunctionType (\d)", o)) == 2:
        return [(0.0, nums(grab(r"/C0 \[([^\]]*)\]", o))), (1.0, nums(grab(r"/C1 \[([^\]]*)\]", o)))]
    bounds = nums(grab(r"/Bounds \[([^\]]*)\]", o))
    enc = nums(grab(r"/Encode \[([^\]]*)\]", o))
    subs = [int(x) for x in re.findall(r"(\d+) 0 R", grab(r"/Functions \[([^\]]*)\]", o))]
    edges = [0.0] + bounds + [1.0]
    out = []
    for i, sx in enumerate(subs):
        a, b = edges[i], edges[i + 1]
        e0, e1 = enc[2 * i], enc[2 * i + 1]
        for off, col in fn_stops(sx):
            if e1 != e0:
                out.append((a + (off - e0) / (e1 - e0) * (b - a), col))
    return sorted(out, key=lambda s: s[0])


def hexc(c):
    return "#%02x%02x%02x" % tuple(max(0, min(255, round(v * 255))) for v in c[:3])


def mul(m, n):
    a, b, c, d, e, f = m
    A, B, C, D, E, F = n
    return [a * A + b * C, a * B + b * D, c * A + d * C, c * B + d * D, e * A + f * C + E, e * B + f * D + F]


FLIP = [1, 0, 0, -1, 0, PAGE_H]  # PDF (y-up) → SVG (y-down)


def to_svg(m, x, y):
    """Apply CTM then flip."""
    a, b, c, d, e, f = m
    px, py = a * x + c * y + e, b * x + d * y + f
    return px, PAGE_H - py


def f2(v):
    s = "%.2f" % v
    return s.rstrip("0").rstrip(".") if "." in s else s


# ---------------------------------------------------------------------------
# Interpret the content stream
# ---------------------------------------------------------------------------
tokens = re.findall(r"\[[^\]]*\]|/[^\s/\[\]]+|[^\s]+", body_ops)
stack = []
st = {"ctm": [1, 0, 0, 1, 0, 0], "fill": "#000000", "clips": []}
path, pts, cur, operands = [], [], (0.0, 0.0), []
elements = []
shadings = {}

for tok in tokens:
    if re.match(r"^-?[\d.]+$", tok) or tok[0] in "/[":
        operands.append(tok)
        continue
    op, o, operands = tok, operands, []
    m = st["ctm"]
    if op == "q":
        stack.append({"ctm": list(st["ctm"]), "fill": st["fill"], "clips": list(st["clips"])})
    elif op == "Q":
        st = stack.pop()
    elif op == "cm":
        st["ctm"] = mul([float(x) for x in o], m)
    elif op in ("m", "l"):
        x, y = float(o[0]), float(o[1])
        sx, sy = to_svg(m, x, y)
        path.append(f"{'M' if op == 'm' else 'L'}{f2(sx)} {f2(sy)}")
        pts.append((sx, sy))
        cur = (x, y)
    elif op in ("c", "v", "y"):
        v = [float(x) for x in o]
        if op == "c":
            ps = [(v[0], v[1]), (v[2], v[3]), (v[4], v[5])]
        elif op == "v":
            ps = [cur, (v[0], v[1]), (v[2], v[3])]
        else:
            ps = [(v[0], v[1]), (v[2], v[3]), (v[2], v[3])]
        q = [to_svg(m, *p) for p in ps]
        path.append("C" + " ".join(f"{f2(a)} {f2(b)}" for a, b in q))
        pts.extend(q)
        cur = ps[-1]
    elif op == "h":
        path.append("Z")
    elif op == "re":
        x, y, w, h = (float(v) for v in o)
        c4 = [to_svg(m, x, y), to_svg(m, x + w, y), to_svg(m, x + w, y + h), to_svg(m, x, y + h)]
        path.append("M" + " L".join(f"{f2(a)} {f2(b)}" for a, b in c4) + "Z")
        pts.extend(c4)
    elif op in ("W", "W*"):
        st["_clip"] = (" ".join(path), list(pts))
    elif op == "n":
        if "_clip" in st:
            st["clips"] = st["clips"] + [st.pop("_clip")]
        path, pts = [], []
    elif op in ("f", "f*", "F"):
        elements.append({"d": " ".join(path), "pts": pts, "fill": st["fill"], "clips": [c[0] for c in st["clips"]]})
        path, pts = [], []
    elif op in ("scn", "sc", "rg"):
        st["fill"] = hexc([float(x) for x in o[-3:]])
    elif op == "g":
        g = float(o[0])
        st["fill"] = hexc([g, g, g])
    elif op == "sh":
        name = o[0][1:]
        if name not in shadings:
            so = doc.xref_object(shading_xref[name])
            shadings[name] = {
                "type": "radial" if int(grab(r"/ShadingType (\d)", so)) == 3 else "linear",
                "coords": nums(grab(r"/Coords \[([^\]]*)\]", so)),
                "stops": [(round(a, 4), hexc(c)) for a, c in fn_stops(int(grab(r"/Function (\d+) 0 R", so)))],
            }
        clip = st["clips"][-1]
        elements.append({"d": clip[0], "pts": clip[1], "shading": name, "matrix": mul(st["ctm"], FLIP),
                         "clips": [c[0] for c in st["clips"][:-1]]})

assert len(elements) == 216, len(elements)

# ---------------------------------------------------------------------------
# Emit typed data
# ---------------------------------------------------------------------------
gradients, clip_ids = [], {}
ARTBOARD = "M0 0 L500 0 L500 500 L0 500Z"


def clip_id(d):
    if d not in clip_ids:
        clip_ids[d] = f"pk-c{len(clip_ids)}"
    return clip_ids[d]


def part(i):
    e = elements[i]
    p = {"d": e["d"]}
    if "shading" in e:
        s = shadings[e["shading"]]
        gid = f"pk-g{i}"
        gradients.append({
            "id": gid,
            "type": s["type"],
            "coords": [round(c, 4) for c in s["coords"]],
            "transform": "matrix(" + " ".join("%.4f" % v for v in e["matrix"]) + ")",
            "stops": s["stops"],
        })
        p["fill"] = f"url(#{gid})"
    else:
        p["fill"] = e["fill"]
    # Drop the artboard clip: feathers must be free to travel beyond the original frame.
    clips = [c for c in e["clips"] if c != ARTBOARD]
    if clips:
        p["clip"] = [clip_id(c) for c in clips]
    return p


def bbox(ids):
    xs = [x for i in ids for x, _ in elements[i]["pts"]]
    ys = [y for i in ids for _, y in elements[i]["pts"]]
    return min(xs), min(ys), max(xs), max(ys)


# Every feather radiates from this point (where the backing spokes converge).
PIVOT = (250.073, PAGE_H - 188.412)


def polar(ids):
    """Axis angle (deg, SVG y-down) and max reach from the pivot for a set of elements."""
    x0, y0, x1, y1 = bbox(ids)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    ang = math.atan2(cy - PIVOT[1], cx - PIVOT[0])
    reach = max(math.hypot(x - PIVOT[0], y - PIVOT[1]) for i in ids for x, y in elements[i]["pts"])
    return ang, reach


backers = []
for i in range(BACKER_END):
    ang, _ = polar([i])
    backers.append({"angle": round(math.degrees(ang), 2), "part": part(i)})

feathers = []
for k in range(FEATHER_COUNT):
    b = FEATHER_START + k * FEATHER_PARTS
    eye_ids = list(range(b + 8, b + 12))
    ex0, ey0, ex1, ey1 = bbox([b + 8])
    ang = math.atan2((ey0 + ey1) / 2 - PIVOT[1], (ex0 + ex1) / 2 - PIVOT[0])
    reach = max(math.hypot(x - PIVOT[0], y - PIVOT[1]) for i in (b, b + 2) for x, y in elements[i]["pts"])
    feathers.append({
        "index": k,
        "angle": round(math.degrees(ang), 3),
        "reach": round(reach, 2),
        "center": [round(PIVOT[0] + math.cos(ang) * reach / 2, 2), round(PIVOT[1] + math.sin(ang) * reach / 2, 2)],
        "eye": [round((ex0 + ex1) / 2, 2), round((ey0 + ey1) / 2, 2)],
        "tip": [round(PIVOT[0] + math.cos(ang) * reach, 2), round(PIVOT[1] + math.sin(ang) * reach, 2)],
        # Outer blade silhouettes double as the hit / focus shape.
        "hit": [elements[b]["d"], elements[b + 2]["d"]],
        "blade": [part(i) for i in range(b, b + 8)],
        "eyeParts": [part(i) for i in eye_ids],
    })

body_ids = list(range(BODY_START, len(elements)))
body = [part(i) for i in body_ids]
bx0, by0, bx1, by1 = bbox([BODY_START + 12])  # the navy body shape
all_x0, all_y0, all_x1, all_y1 = bbox(list(range(len(elements))))

data = {
    "box": [round(all_x0, 2), round(all_y0, 2), round(all_x1 - all_x0, 2), round(all_y1 - all_y0, 2)],
    "pivot": [round(PIVOT[0], 3), round(PIVOT[1], 3)],
    "chest": [round((bx0 + bx1) / 2, 2), round((by0 + by1) / 2, 2)],
    "bodyBox": [round(bx0, 2), round(by0, 2), round(bx1 - bx0, 2), round(by1 - by0, 2)],
    "feet": [round((all_x0 + all_x1) / 2, 2), round(bbox(body_ids)[3], 2)],
    "bodyHit": elements[BODY_START + 12]["d"],
    "clips": [{"id": v, "d": k} for k, v in clip_ids.items()],
    "gradients": gradients,
    "backers": backers,
    "feathers": feathers,
    "body": body,
}

OUT.parent.mkdir(parents=True, exist_ok=True)
header = (
    "// GENERATED by scripts/extract_peacock.py from creative-peacock-design/*.ai — do not edit by hand.\n"
    "// Peacock illustration: Designed by Freepik.\n"
    'import type { PeacockArt } from "./types";\n\n'
)
OUT.write_text(header + "export const peacockArt: PeacockArt = " + json.dumps(data, separators=(",", ":")) + ";\n")
print(f"wrote {OUT.relative_to(ROOT)}: {OUT.stat().st_size // 1024} KB, {len(gradients)} gradients, {len(clip_ids)} clips")
