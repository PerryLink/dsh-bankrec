#!/usr/bin/env python3
"""Generate README visuals for dsh-bankrec (docs/assets/).

Outputs (idempotent overwrite):
  dsh-bankrec-hero-{zh,en}-{light,dark}.webp   1440x576 raster hero (Pillow)
  dsh-bankrec-flow-v5-{light,dark}.svg         1100x660 hand-written SVG

Design notes
------------
* Hero: the left column is prose (kicker / title / two value lines / one
  subtitle / one meta line / footer). The right column is this repository's
  own semantic figure: a two-sided match board. Bank rows (left) and GL rows
  (right) face each other across one gate rule - exact integer cents and a
  date delta within +/-3 days, consumed 1:1 - with a green delta chip on every
  accepted pair. The surviving TRANSFER-01 / TRANSFER-02 rows keep the same
  amount but sit five days apart, so they fall out unmatched (orange, broken
  bridge). Three sheet tabs close the board: Bank 6 / GL 6 / Matches 5.
  Every row, amount and delta comes from the checked-in quickstart fixture
  (samples/quickstart/input/{bank,gl}.csv and expected/result.json:
  bank 6, gl 6, matched 5, unmatched bank TRANSFER-01, unmatched gl
  TRANSFER-02, sheet rows 7 / 7 / 6, CAMT opening 1000.00 + net 820.00 =
  closing 1820.00). Nothing is invented.
* Flow: a "two-ledger gate" grammar, not a row of boxes. Two independent
  lanes are ingested into the transactions table; the match gate holds the
  rule spec and five consumed pairs; only the accepted pairs cross to the
  3-sheet workpaper. Two boundaries sit underneath: the residue rail
  (unmatched bank / GL rows, manual review) and the CAMT balance identity
  (opening + net = closing, read-only). Text is tokens and short labels only
  (tool names, field names, sheet names, fixture numbers), so all five README
  languages share the same pair.

Run once:  python scripts/gen-readme-assets.py
Requires:  Python 3.10+ with Pillow; Windows fonts msyh.ttc / msyhbd.ttc /
           consola.ttf / segoeui.ttf / segoeuib.ttf.
"""
from __future__ import annotations

import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "assets")

FONT_CJK = r"C:\Windows\Fonts\msyh.ttc"
FONT_CJK_BOLD = r"C:\Windows\Fonts\msyhbd.ttc"
FONT_MONO = r"C:\Windows\Fonts\consola.ttf"
FONT_EN = r"C:\Windows\Fonts\segoeui.ttf"
FONT_EN_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"

for _path in (FONT_CJK, FONT_CJK_BOLD, FONT_MONO, FONT_EN, FONT_EN_BOLD):
    if not os.path.exists(_path):
        raise SystemExit(f"FATAL: font missing: {_path}")

WARNINGS: list[str] = []

SKIN = {
    "light": dict(
        bg_from="#f9f6fd", bg_to="#e4eaf8", card="#ffffff",
        card_edge="#e4e1ee", zone="#f7f4fc", zone_edge="#e5e0f1",
        text="#141419", sub="#4d5261", faint="#8f94a4",
        accent="#4B67B4", good="#16a34a", warn="#c2410c",
        pill="#ece7f9", track="#eae6f3", grid="#e7e4f0",
        good_bg="#e9f6ee", warn_bg="#fdf0e7", shadow=(32, 26, 64),
    ),
    "dark": dict(
        bg_from="#131a2a", bg_to="#0c1016", card="#1b2231",
        card_edge="#2e374b", zone="#171e2d", zone_edge="#2b3448",
        text="#f0f3f9", sub="#a8b1c4", faint="#737b8d",
        accent="#8496f5", good="#3fb950", warn="#e0a85a",
        pill="#242d42", track="#243049", grid="#1e2636",
        good_bg="#16301f", warn_bg="#35271b", shadow=(0, 0, 0),
    ),
}

# real quickstart fixture: bank.csv / gl.csv / expected/result.json
PAIRS = [
    ("INV-7001", "1250.00", "+1d"),
    ("INV-7002", "860.50", "+1d"),
    ("REFUND-01", "-430.00", "+2d"),
    ("INV-7003", "2150.00", "+2d"),
    ("FEE-01", "99.90", "+1d"),
]
UNMATCHED = ("TRANSFER-01", "500.00", "TRANSFER-02", "500.00", "5d > 3d")

HERO = {
    "zh": dict(
        kicker="DeepSeek Harness · 银行对账插件",
        title="dsh-bankrec",
        value=["银行流水与总账，逐笔 1:1 勾对", "未达行与三表底稿一起交"],
        sub="银行流水 + 总账 → 本地 1:1 勾对 → 三表 xlsx",
        meta="R0 只读 / R1 本地写 · 无网络 · 不调模型",
        foot="Apache-2.0 · PerryLink DSH plugin family",
        board_kicker="BANK / GL · 1:1 勾对",
        board_title="逐笔勾对 · 5 对",
        board_rule="金额完全相同 且 |日期差| ≤ 3 天",
        board_sub="逐笔消费一次 · 命中即写 matches",
        bank_label="BANK · 6 行",
        gl_label="GL · 6 行",
        delta_label="Δ 日期",
        file_line="未达 1 + 1 · exports/ACC-SYN-001-2026-03.xlsx · 3 sheets",
        balance="CAMT 1000 + 820 = 1820 · diff 0",
    ),
    "en": dict(
        kicker="DeepSeek Harness · bank reconciliation plugin",
        title="dsh-bankrec",
        value=["Bank and GL, matched row by row 1:1",
               "Unmatched rows plus a 3-sheet workpaper"],
        sub="bank + GL → local 1:1 match → xlsx",
        meta="R0 read-only / R1 local write · no network · no model",
        foot="Apache-2.0 · PerryLink DSH plugin family",
        board_kicker="BANK / GL · 1:1 MATCH",
        board_title="5 matched pairs",
        board_rule="exact amount & |date Δ| ≤ 3 days",
        board_sub="consume once · write matches",
        bank_label="BANK · 6 rows",
        gl_label="GL · 6 rows",
        delta_label="date Δ",
        file_line="unmatched 1 + 1 · exports/ACC-SYN-001-2026-03.xlsx · 3 sheets",
        balance="CAMT 1000 + 820 = 1820 · diff 0",
    ),
}


def font(size, kind="cjk"):
    return ImageFont.truetype(
        {"cjk": FONT_CJK, "cjk_bold": FONT_CJK_BOLD, "mono": FONT_MONO,
         "en": FONT_EN, "en_bold": FONT_EN_BOLD}[kind], max(8, int(size)))


def hx(value):
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def gradient(w, h, c1, c2):
    img = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = 0.25 * (y / h) + 0.75 * (y / h) ** 1.6
        d.line([(0, y), (w, y)],
               fill=tuple(int(p + (q - p) * t) for p, q in zip(hx(c1), hx(c2))))
    return img


def glow(img, cx, cy, r, color, alpha=40):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(10, 0, -1):
        rr = r * i / 10
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr],
                  fill=color + (int(alpha * (1 - i / 11)),))
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


def card(img, box, skin, radius=22, shadow=28):
    x0, y0, x1, y1 = box
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    for i in range(shadow, 0, -3):
        sd.rounded_rectangle([x0 - i // 5, y0 + i // 2, x1 + i // 5, y1 + i],
                             radius=radius + i // 5,
                             fill=skin["shadow"] + (int(7 * (1 - i / shadow)),))
    base = Image.alpha_composite(
        img.convert("RGBA"), sh.filter(ImageFilter.GaussianBlur(13)))
    d = ImageDraw.Draw(base)
    d.rounded_rectangle(box, radius=radius, fill=hx(skin["card"]),
                        outline=hx(skin["card_edge"]), width=2)
    return base.convert("RGB")


def fit(d, text, kind, max_w, size, min_size=14):
    size = int(size)
    while size > min_size:
        if d.textlength(text, font=font(size, kind)) <= max_w:
            return size
        size -= 2
    return max(min_size, size)


def write(img, xy, text, skin, size, kind="cjk", color="text",
          max_w=None, min_size=14, tag="", anchor=None):
    d = ImageDraw.Draw(img)
    if max_w is not None:
        size = fit(d, text, kind, max_w, size, min_size)
        if d.textlength(text, font=font(size, kind)) > max_w:
            WARNINGS.append(f"{tag}: {text!r} exceeds {max_w}px at {size}px")
            print(f"WARN {tag}: {text!r} exceeds {max_w}px at {size}px")
    d.text(xy, text, font=font(size, kind), fill=hx(skin[color]), anchor=anchor)
    return size


def pill(img, xy, text, skin, size=19, kind="cjk_bold",
         fg="accent", bg="pill", pad_x=18, pad_y=10):
    d = ImageDraw.Draw(img)
    f = font(size, kind)
    tw = d.textlength(text, font=f)
    x, y = xy
    h = size + pad_y * 2
    d.rounded_rectangle([x, y, x + tw + pad_x * 2, y + h], radius=h // 2,
                        fill=hx(skin[bg]))
    d.text((x + pad_x, y + pad_y - 1), text, font=f, fill=hx(skin[fg]))
    return img, x + tw + pad_x * 2


def dashed_hline(d, x0, x1, y, color, dash=7, gap=6, width=2):
    x = x0
    while x < x1:
        d.line([x, y, min(x + dash, x1), y], fill=color, width=width)
        x += dash + gap


def hero(lang, skin_name):
    s = SKIN[skin_name]
    m = HERO[lang]
    w, h = 1440, 576
    img = gradient(w, h, s["bg_from"], s["bg_to"])
    img = glow(img, 1210, 34, 430, hx(s["accent"]),
               20 if skin_name == "light" else 38)
    img = glow(img, 120, 570, 300, hx(s["accent"]),
               8 if skin_name == "light" else 14)

    # ------------------------------------------------------------- left copy
    img, _ = pill(img, (60, 58), m["kicker"], s,
                  size=20 if lang == "zh" else 18,
                  kind="cjk_bold" if lang == "zh" else "en_bold")

    d = ImageDraw.Draw(img)
    tsize = fit(d, m["title"], "mono", 560, 84, 64)
    d.text((60, 118), m["title"], font=font(tsize, "mono"), fill=hx(s["text"]))

    vkind = "cjk_bold" if lang == "zh" else "en_bold"
    vsize = 36 if lang == "zh" else 32
    for line in m["value"]:
        vsize = min(vsize, fit(d, line, vkind, 570, vsize, 24))
    for i, line in enumerate(m["value"]):
        write(img, (60, 258 + i * (vsize + 16)), line, s, vsize, vkind,
              "text", 570, 24, f"hero.{lang}.value{i}")

    sub_size = write(img, (60, 388), m["sub"], s, 26,
                     "cjk" if lang == "zh" else "en", "sub", 570, 22,
                     f"hero.{lang}.sub")
    if sub_size < 26:
        WARNINGS.append(f"hero.{lang}.sub shrank to {sub_size}px")
    if sub_size * 880 / 1440 < 15:
        WARNINGS.append(f"hero.{lang}.sub below 15px displayed")

    meta_size = write(img, (60, 444), m["meta"], s, 20,
                      "cjk" if lang == "zh" else "en", "faint", 570, 17,
                      f"hero.{lang}.meta")
    if meta_size * 880 / 1440 < 12:
        WARNINGS.append(f"hero.{lang}.meta below 12px displayed")

    d = ImageDraw.Draw(img)
    d.line([60, 482, 630, 482], fill=hx(s["grid"]), width=2)
    write(img, (60, 498), m["foot"], s, 17, "en", "faint", 570, 14,
          f"hero.{lang}.foot")

    # --------------------------------------------------------- match board
    img = card(img, (652, 44, 1392, 552), s, radius=22)
    d = ImageDraw.Draw(img)

    write(img, (678, 66), m["board_kicker"], s, 17,
          "cjk_bold" if lang == "zh" else "mono", "accent",
          420, 13, f"hero.{lang}.board_kicker")
    d.text((1366, 66), "ACC-SYN-001 · 2026-03 · EUR", font=font(17, "mono"),
           fill=hx(s["faint"]), anchor="ra")

    write(img, (678, 90), m["board_title"], s, 28,
          "cjk_bold" if lang == "zh" else "en_bold", "text", 420, 20,
          f"hero.{lang}.board_title")
    write(img, (1366, 92), m["balance"], s, 18, "mono", "good", 330, 13,
          f"hero.{lang}.balance", anchor="ra")

    write(img, (678, 130), m["board_rule"], s, 22,
          "cjk_bold" if lang == "zh" else "en_bold", "accent", 650, 17,
          f"hero.{lang}.board_rule")
    write(img, (678, 158), m["board_sub"], s, 16,
          "cjk" if lang == "zh" else "en", "sub", 650, 13,
          f"hero.{lang}.board_sub")

    d = ImageDraw.Draw(img)
    d.line([678, 178, 1366, 178], fill=hx(s["grid"]), width=2)
    label_kind = "cjk_bold" if lang == "zh" else "mono"
    write(img, (678, 186), m["bank_label"], s, 17, label_kind, "sub", 240, 12,
          f"hero.{lang}.bank_label")
    d.text((1028, 186), m["delta_label"], font=font(15, "cjk" if lang == "zh" else "en"),
           fill=hx(s["faint"]), anchor="ma")
    write(img, (1366, 186), m["gl_label"], s, 17, label_kind, "sub", 240, 12,
          f"hero.{lang}.gl_label", anchor="ra")

    # five accepted pairs: bank left, GL right, delta chip on the bridge
    for i, (ref, amount, delta) in enumerate(PAIRS):
        y = 208 + i * 44
        d.rounded_rectangle([678, y, 944, y + 38], radius=12,
                            fill=hx(s["zone"]), outline=hx(s["zone_edge"]),
                            width=1)
        d.rounded_rectangle([1112, y, 1366, y + 38], radius=12,
                            fill=hx(s["zone"]), outline=hx(s["zone_edge"]),
                            width=1)
        d.text((692, y + 8), ref, font=font(20, "mono"), fill=hx(s["sub"]))
        d.text((928, y + 6), amount, font=font(23, "mono"), fill=hx(s["text"]),
               anchor="ra")
        d.text((1126, y + 6), amount, font=font(23, "mono"), fill=hx(s["text"]))
        d.text((1352, y + 8), ref, font=font(20, "mono"), fill=hx(s["sub"]),
               anchor="ra")
        d.line([944, y + 19, 1000, y + 19], fill=hx(s["good"]), width=2)
        d.line([1056, y + 19, 1112, y + 19], fill=hx(s["good"]), width=2)
        d.ellipse([941, y + 16, 947, y + 22], fill=hx(s["good"]))
        d.ellipse([1109, y + 16, 1115, y + 22], fill=hx(s["good"]))
        d.rounded_rectangle([1000, y + 7, 1056, y + 31], radius=12,
                            fill=hx(s["good_bg"]))
        d.text((1028, y + 9), delta, font=font(15, "mono"),
               fill=hx(s["good"]), anchor="ma")

    # the two rows that keep the amount but miss the +/-3 day window
    y = 432
    d.rounded_rectangle([678, y, 944, y + 38], radius=12,
                        fill=hx(s["warn_bg"]), outline=hx(s["warn"]), width=2)
    d.rounded_rectangle([1112, y, 1366, y + 38], radius=12,
                        fill=hx(s["warn_bg"]), outline=hx(s["warn"]), width=2)
    d.text((692, y + 8), UNMATCHED[0], font=font(20, "mono"), fill=hx(s["warn"]))
    d.text((928, y + 6), UNMATCHED[1], font=font(23, "mono"),
           fill=hx(s["warn"]), anchor="ra")
    d.text((1126, y + 6), UNMATCHED[3], font=font(23, "mono"),
           fill=hx(s["warn"]))
    d.text((1352, y + 8), UNMATCHED[2], font=font(20, "mono"),
           fill=hx(s["warn"]), anchor="ra")
    dashed_hline(d, 944, 1000, y + 19, hx(s["warn"]))
    dashed_hline(d, 1056, 1112, y + 19, hx(s["warn"]))
    d.rounded_rectangle([972, y + 7, 1085, y + 31], radius=12,
                        fill=hx(s["warn_bg"]), outline=hx(s["warn"]), width=1)
    d.text((1028, y + 9), UNMATCHED[4], font=font(15, "mono"),
           fill=hx(s["warn"]), anchor="ma")

    d.line([678, 480, 1366, 480], fill=hx(s["grid"]), width=2)

    # three sheet tabs = the exported workpaper
    x = 678
    tabs = [("Bank 6", "accent", "pill"), ("GL 6", "accent", "pill"),
            ("Matches 5", "good", "good_bg")]
    for text, fg, bg in tabs:
        d = ImageDraw.Draw(img)
        f = font(17, "mono")
        tw = d.textlength(text, font=f)
        d.rounded_rectangle([x, 488, x + tw + 30, 514], radius=13,
                            fill=hx(s[bg]))
        d.text((x + 15, 491), text, font=f, fill=hx(s[fg]))
        x += tw + 30 + 14

    write(img, (678, 522), m["file_line"], s, 17,
          "cjk" if lang == "zh" else "mono", "faint", 688, 13,
          f"hero.{lang}.file_line")

    path = os.path.join(OUT, f"dsh-bankrec-hero-{lang}-{skin_name}.webp")
    img.save(path, "WEBP", quality=92, method=6)
    print(f"wrote dsh-bankrec-hero-{lang}-{skin_name}.webp")


# --------------------------------------------------------------- flow (SVG)
FLOW = {
    "light": dict(
        bg_from="#f9f6fd", bg_to="#e4eaf8", card="#ffffff",
        edge="#e4e1ee", zone="#f5f2fb", zone_edge="#e3def1",
        text="#141419", sub="#4d5261", faint="#8f94a4",
        accent="#4B67B4", good="#16a34a", warn="#c2410c",
        pill="#ece7f9", track="#eae6f3", grid="#e7e4f0", dot="#d9d3ea",
    ),
    "dark": dict(
        bg_from="#131a2a", bg_to="#0c1016", card="#1b2231",
        edge="#2e374b", zone="#171e2d", zone_edge="#2b3448",
        text="#f0f3f9", sub="#a8b1c4", faint="#737b8d",
        accent="#8496f5", good="#3fb950", warn="#d9a03c",
        pill="#242d42", track="#243049", grid="#1e2636", dot="#26314a",
    ),
}

MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
SANS = ("ui-sans-serif, system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', "
        "sans-serif")


def esc(text):
    return (text.replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;"))


def flow_svg(skin_name):
    s = FLOW[skin_name]
    p: list[str] = []
    shadow_op = "0.10" if skin_name == "light" else "0.55"
    shadow_col = "#1b1735" if skin_name == "light" else "#000000"

    def t(x, y, text, size, color="text", family=MONO, weight=400,
          anchor="start", spacing=None, opacity=None):
        extra = f' letter-spacing="{spacing}"' if spacing else ""
        extra += f' opacity="{opacity}"' if opacity else ""
        p.append(
            f'<text x="{x}" y="{y}" fill="{s[color]}" font-family="{family}" '
            f'font-size="{size}" font-weight="{weight}" '
            f'text-anchor="{anchor}"{extra}>{esc(text)}</text>')

    def box(x, y, w, h, fill="card", stroke="edge", r=18, sw=1.5, extra=""):
        p.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
            f'fill="{s[fill]}" stroke="{s[stroke]}" stroke-width="{sw}"{extra}/>')

    def line(x1, y1, x2, y2, color="grid", width=1.5, dash=None, opacity=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        o = f' opacity="{opacity}"' if opacity else ""
        p.append(
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
            f'stroke="{s[color]}" stroke-width="{width}"{d}{o}/>')

    def arrow(x1, y1, x2, y2, color="accent", width=2.2):
        p.append(
            f'<path d="M{x1} {y1} L{x2 - 7} {y2} M{x2 - 13} {y2 - 5} '
            f'L{x2 - 7} {y2} L{x2 - 13} {y2 + 5}" fill="none" '
            f'stroke="{s[color]}" stroke-width="{width}" stroke-linecap="round" '
            f'stroke-linejoin="round"/>')

    def chip(x, y, w, h, label, fg="accent", bg="pill", size=13.5,
             family=MONO):
        p.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h / 2}" '
            f'fill="{s[bg]}"/>')
        t(x + w / 2, y + h / 2 + size * 0.36, label, size, fg, family,
          anchor="middle")

    p.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="660" '
        f'viewBox="0 0 1100 660" role="img" aria-label="dsh-bankrec structure: '
        f'bank side (CSV, CAMT.053/054, MT940) and GL side (CSV) both ingest '
        f'into the local transactions table; the match gate applies exact '
        f'integer cents and a date delta within 3 days, consuming pairs 1:1; '
        f'accepted pairs become the Bank / GL / Matches workpaper, while the '
        f'unmatched rows and the CAMT balance identity sit on two boundary '
        f'rails">\n<title>dsh-bankrec: two sides, one match gate, two boundaries</title>\n'
        f'<defs>\n'
        f'  <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">\n'
        f'    <stop offset="0" stop-color="{s["bg_from"]}"/>\n'
        f'    <stop offset="1" stop-color="{s["bg_to"]}"/>\n'
        f'  </linearGradient>\n'
        f'  <filter id="soft" x="-30%" y="-30%" width="160%" height="180%">\n'
        f'    <feDropShadow dx="0" dy="8" stdDeviation="11" '
        f'flood-color="{shadow_col}" flood-opacity="{shadow_op}"/>\n'
        f'  </filter>\n'
        f'  <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">\n'
        f'    <circle cx="1.4" cy="1.4" r="1.4" fill="{s["dot"]}"/>\n'
        f'  </pattern>\n'
        f'</defs>\n'
        f'<rect width="1100" height="660" fill="url(#bg)"/>\n'
        f'<rect width="1100" height="660" fill="url(#dots)" opacity=".42"/>')

    # header
    t(44, 60, "dsh-bankrec", 34, "text", MONO, 700)
    t(44, 86, "two sides · one match gate · three sheets, all local", 15,
      "sub", SANS)
    p.append(f'<rect x="788" y="40" width="268" height="34" rx="17" '
             f'fill="{s["pill"]}"/>')
    t(922, 62, "ACC-SYN-001 · 2026-03 · EUR", 14, "accent", MONO,
      anchor="middle")
    line(44, 104, 1056, 104, "grid", 1.5)

    # ---- left lanes: bank side / GL side
    p.append(f'<g filter="url(#soft)">')
    box(40, 120, 252, 168)
    p.append('</g>')
    t(58, 146, "BANK SIDE", 17, "accent", MONO, 700)
    t(274, 146, "6 rows", 14, "faint", MONO, anchor="end")
    line(58, 156, 274, 156, "grid", 1.3)
    chip(58, 166, 46, 22, "CSV", "accent", "pill", 14)
    chip(112, 166, 116, 22, "CAMT.053/054", "accent", "pill", 14)
    chip(58, 192, 62, 22, "MT940", "accent", "pill", 14)
    t(58, 236, "bankrec_ingest", 17, "text", MONO, 700)
    t(58, 254, "ingest_camt · ingest_mt940", 14, "sub", MONO)
    t(58, 272, "ingest_camt054 · sha256", 14, "sub", MONO)

    p.append(f'<g filter="url(#soft)">')
    box(40, 296, 252, 156)
    p.append('</g>')
    t(58, 322, "GL SIDE", 17, "accent", MONO, 700)
    t(274, 322, "6 rows", 14, "faint", MONO, anchor="end")
    line(58, 332, 274, 332, "grid", 1.3)
    chip(58, 342, 46, 22, "CSV", "accent", "pill", 14)
    t(112, 358, "date,amount[,reference]", 13.5, "sub", MONO)
    t(58, 388, "bankrec_ingest", 17, "text", MONO, 700)
    t(58, 410, "date · amount_cents", 14, "sub", MONO)
    t(58, 428, "reference · sha256", 14, "sub", MONO)

    # lane arrows into the gate
    arrow(292, 204, 312, 204)
    arrow(292, 374, 312, 374)

    # ---- match gate
    p.append(f'<rect x="312" y="120" width="364" height="332" rx="20" '
             f'fill="{s["zone"]}" stroke="{s["zone_edge"]}" stroke-width="1.5"/>')
    t(330, 146, "MATCH GATE", 18, "accent", MONO, 700)
    t(658, 146, "bankrec_match · R1", 14, "faint", MONO, anchor="end")

    # rule spec card
    p.append(f'<g filter="url(#soft)">')
    box(328, 158, 332, 96, "card", "edge", 16, 1.5)
    p.append('</g>')
    for yy, label, value in ((184, "amount_cents", "equal"),
                             (208, "date Δ", "≤ 3 days"),
                             (232, "consume", "1:1 once")):
        t(344, yy, label, 15, "sub", MONO)
        t(644, yy, value, 17, "text", MONO, 700, anchor="end")

    t(330, 276, "pairs consumed · 5", 17, "accent", MONO, 700)
    t(658, 276, "matches 5", 14, "faint", MONO, anchor="end")

    for i, (ref, amount, delta) in enumerate(PAIRS):
        y = 286 + i * 25
        if i:
            line(330, y - 4, 658, y - 4, "grid", 1, opacity=".8")
        t(338, y + 16, ref, 14, "sub", MONO)
        t(480, y + 16, amount, 15, "text", MONO, 700, anchor="end")
        t(494, y + 16, "=", 15, "faint", MONO, anchor="middle")
        t(508, y + 16, amount, 15, "text", MONO, 700)
        p.append(f'<circle cx="606" cy="{y + 11}" r="3.2" fill="{s["good"]}"/>')
        t(650, y + 16, delta, 14, "good", MONO, 700, anchor="end")

    p.append(f'<rect x="328" y="418" width="332" height="22" rx="11" '
             f'fill="{s["pill"]}"/>')
    t(344, 433, "12 txns · 5 matches · storageDomain", 14, "accent", MONO)

    # gate -> workpaper
    arrow(676, 204, 700, 204)
    arrow(676, 300, 700, 300)

    # ---- right column: 3-sheet workpaper
    p.append(f'<g filter="url(#soft)">')
    box(700, 120, 360, 332)
    p.append('</g>')
    t(720, 146, "3-SHEET WORKPAPER", 16.5, "accent", MONO, 700)
    t(1040, 146, "bankrec_export · R1", 14, "faint", MONO, anchor="end")
    t(720, 172, "ACC-SYN-001-2026-03.xlsx", 15, "text", MONO)
    line(720, 186, 1040, 186, "grid", 1.3)

    sheets = [
        (200, "Bank", "6 data rows", "date · amount_cents · ref · txn_id"),
        (248, "GL", "6 data rows", "date · amount_cents · ref · txn_id"),
        (296, "Matches", "5 data rows", "bank_id · gl_id · date_delta · cents"),
    ]
    for y, name, count, cols in sheets:
        t(720, y + 14, name, 18, "text", MONO, 700)
        t(1040, y + 14, count, 14, "faint", MONO, anchor="end")
        t(720, y + 36, cols, 14, "sub", MONO)

    line(720, 356, 1040, 356, "grid", 1.3)
    t(720, 378, "write → $DSH_HOME/storages/", 14, "sub", MONO)
    t(720, 398, "dsh-bankrec/exports/", 14, "text", MONO, 700)
    t(720, 420, "ACC-SYN-001-2026-03.xlsx", 14, "accent", MONO)
    t(720, 440, "sha256 in result · originals untouched", 14, "sub", SANS)

    # ---- bottom-left: residue rail
    p.append(f'<g filter="url(#soft)">')
    box(40, 468, 636, 88, "card", "edge", 18)
    p.append('</g>')
    t(60, 492, "RESIDUE · UNMATCHED", 17, "warn", MONO, 700)
    t(656, 492, "manual review · no auto-posting", 14, "sub", SANS,
      anchor="end")
    p.append(f'<rect x="60" y="502" width="280" height="30" rx="10" '
             f'fill="{s["card"]}" stroke="{s["warn"]}" stroke-width="1.4"/>')
    t(72, 522, "bank 1 · TRANSFER-01 · 500.00", 14, "warn", MONO)
    p.append(f'<rect x="356" y="502" width="280" height="30" rx="10" '
             f'fill="{s["card"]}" stroke="{s["warn"]}" stroke-width="1.4"/>')
    t(368, 522, "gl 1 · TRANSFER-02 · 500.00", 14, "warn", MONO)
    t(60, 548, "5d > 3d → outside the match gate", 14, "sub", MONO)

    # ---- bottom-right: CAMT balance rail
    p.append(f'<g filter="url(#soft)">')
    box(700, 468, 360, 88, "card", "edge", 18)
    p.append('</g>')
    t(720, 490, "CAMT BALANCE · R0", 17, "accent", MONO, 700)
    t(1040, 490, "reconcile_camt", 14, "faint", MONO, anchor="end")
    t(720, 514, "OPBD 1000.00 + net 820.00", 15, "text", MONO, 700)
    t(720, 536, "= CLBD 1820.00 · diff 0.00", 15, "good", MONO, 700)

    # arrows from the gate to the residue rail are implied by the gate sitting
    # directly above it; a 16px gap is left clear on purpose.

    # footer rules
    t(44, 584, "match: amount_cents equal · |date Δ| ≤ 3 days · 1:1 · "
      "originals untouched · sha256 evidence", 14.5, "sub", MONO)
    t(44, 606, "ingest: CSV · CAMT.053/054 · MT940 → transactions   |   "
      "export: Bank / GL / Matches xlsx", 14, "sub", MONO)
    t(44, 628, "R0: reconcile_camt · iban_check · camt056_list (no cancel) | "
      "R1: ingest · match · export | no network/no model", 14,
      "sub", SANS)

    p.append('</svg>')

    path = os.path.join(OUT, f"dsh-bankrec-flow-v5-{skin_name}.svg")
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(p) + "\n")
    print(f"wrote dsh-bankrec-flow-v5-{skin_name}.svg")


def main():
    os.makedirs(OUT, exist_ok=True)
    for skin_name in ("light", "dark"):
        for lang in ("zh", "en"):
            hero(lang, skin_name)
        flow_svg(skin_name)
    if WARNINGS:
        print(f"{len(WARNINGS)} layout warning(s)")
    else:
        print("no layout warnings")


if __name__ == "__main__":
    main()
