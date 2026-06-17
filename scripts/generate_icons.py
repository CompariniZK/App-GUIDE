"""
Boussole — Icon generator
─────────────────────────
Produces production-ready icons for Expo / Play Store from scratch using PIL.

Outputs (1024x1024 by default, see SIZES below):
  - assets/icon.png             : dark blue bg + gold compass rose
  - assets/adaptive-icon.png    : transparent bg + gold compass rose (Android adaptive)
  - assets/splash.png           : dark blue bg + centered logo + wordmark
  - assets/favicon.png          : 48x48 favicon
  - assets/playstore-icon.png   : 512x512 (Play Store listing)

Brand colors:
  primary  = #1A237E (dark navy)
  accent   = #F5A623 (gold)
  white    = #FFFFFF
"""

import os
from PIL import Image, ImageDraw, ImageFont
from math import cos, sin, radians

# ─── Brand ──────────────────────────────────────────────────────────────────
PRIMARY = (26, 35, 126)      # #1A237E
PRIMARY_LIGHT = (57, 73, 171)  # #3949AB
ACCENT = (245, 166, 35)      # #F5A623
ACCENT_DARK = (224, 148, 26)
WHITE = (255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)

# ─── Compass rose drawing ───────────────────────────────────────────────────
def draw_compass_rose(draw, cx, cy, radius, fill_main=ACCENT, fill_secondary=ACCENT_DARK, ring=True, ring_color=ACCENT):
    """Draw an 8-pointed compass star centered at (cx, cy)."""
    # Outer ring
    if ring:
        ring_w = max(int(radius * 0.06), 4)
        draw.ellipse(
            [cx - radius, cy - radius, cx + radius, cy + radius],
            outline=ring_color, width=ring_w,
        )

    inner_r = radius * 0.78
    short_r = inner_r * 0.32

    # 8-point star — 4 main directions (N, S, E, W) + 4 diagonals
    # Main 4-point star (longer arms)
    main_pts = []
    for i in range(4):
        a = radians(i * 90 - 90)         # N first
        # tip
        main_pts.append((cx + inner_r * cos(a), cy + inner_r * sin(a)))
        # side toward next direction
        a2 = a + radians(45)
        main_pts.append((cx + short_r * cos(a2), cy + short_r * sin(a2)))
    draw.polygon(main_pts, fill=fill_main)

    # Secondary 4-point star (diagonals) — slightly darker for depth
    sec_inner = inner_r * 0.62
    sec_pts = []
    for i in range(4):
        a = radians(i * 90 - 45)         # NE first
        sec_pts.append((cx + sec_inner * cos(a), cy + sec_inner * sin(a)))
        a2 = a + radians(45)
        sec_pts.append((cx + short_r * 0.85 * cos(a2), cy + short_r * 0.85 * sin(a2)))
    draw.polygon(sec_pts, fill=fill_secondary)

    # Center dot
    dot = radius * 0.07
    draw.ellipse([cx - dot, cy - dot, cx + dot, cy + dot], fill=WHITE)


def draw_north_arrow(draw, cx, cy, radius):
    """Highlight the North direction with a white tip."""
    inner_r = radius * 0.78
    short_r = inner_r * 0.32
    pts = [
        (cx, cy - inner_r),                          # tip (north)
        (cx - short_r * 0.7, cy - short_r * 0.7),    # left base
        (cx, cy - short_r * 0.2),                    # belly
        (cx + short_r * 0.7, cy - short_r * 0.7),    # right base
    ]
    draw.polygon(pts, fill=WHITE)


# ─── Icons ──────────────────────────────────────────────────────────────────
def make_main_icon(size=1024):
    """Solid dark blue background + gold compass rose. Clean, brand-aligned."""
    img = Image.new("RGBA", (size, size), PRIMARY + (255,))
    d = ImageDraw.Draw(img)

    cx = cy = size // 2
    rose_r = int(size * 0.40)
    draw_compass_rose(d, cx, cy, rose_r)
    draw_north_arrow(d, cx, cy, rose_r)
    return img


def make_adaptive_icon(size=1024):
    """Foreground only — transparent background, compass rose centered with safe area."""
    img = Image.new("RGBA", (size, size), TRANSPARENT)
    d = ImageDraw.Draw(img)
    cx = cy = size // 2
    # Android adaptive icon: safe zone is the inner 66% of the canvas
    rose_r = int(size * 0.33)
    draw_compass_rose(d, cx, cy, rose_r)
    draw_north_arrow(d, cx, cy, rose_r)
    return img


def make_splash(w=1284, h=2778):
    """iPhone X portrait splash — Expo resizes for other devices."""
    img = Image.new("RGBA", (w, h), PRIMARY + (255,))
    d = ImageDraw.Draw(img)

    # Logo centered upper-mid
    cx = w // 2
    cy = int(h * 0.42)
    rose_r = int(min(w, h) * 0.18)
    draw_compass_rose(d, cx, cy, rose_r)
    draw_north_arrow(d, cx, cy, rose_r)

    # Wordmark "Boussole" below
    try:
        font_path = None
        for candidate in [
            "C:/Windows/Fonts/segoeuib.ttf",   # Segoe UI Bold
            "C:/Windows/Fonts/arialbd.ttf",    # Arial Bold
            "C:/Windows/Fonts/seguibl.ttf",    # Segoe UI Black
        ]:
            if os.path.exists(candidate):
                font_path = candidate
                break
        font_size = int(min(w, h) * 0.075)
        font = ImageFont.truetype(font_path, font_size) if font_path else ImageFont.load_default()

        text = "Boussole"
        bbox = d.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        d.text(((w - tw) // 2, cy + rose_r + 60), text, fill=WHITE, font=font)

        # Tagline
        try:
            font_small = ImageFont.truetype(font_path.replace("seguibl", "segoeui").replace("segoeuib", "segoeui").replace("arialbd", "arial"), int(font_size * 0.35))
        except Exception:
            font_small = ImageFont.truetype(font_path, int(font_size * 0.3)) if font_path else font
        tag = "Votre guide pour la France"
        bbox2 = d.textbbox((0, 0), tag, font=font_small)
        tw2 = bbox2[2] - bbox2[0]
        d.text(((w - tw2) // 2, cy + rose_r + 60 + th + 24), tag, fill=ACCENT, font=font_small)
    except Exception as e:
        print(f"  (skipped wordmark — {e})")
    return img


# ─── Pipeline ───────────────────────────────────────────────────────────────
HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.normpath(os.path.join(HERE, "..", "assets"))
os.makedirs(ASSETS, exist_ok=True)

def save(img, name):
    path = os.path.join(ASSETS, name)
    img.save(path, format="PNG", optimize=True)
    size_kb = os.path.getsize(path) / 1024
    print(f"  OK {name:30s}  {img.size[0]}x{img.size[1]}  {size_kb:.1f} KB")
    return path

print("Generating Boussole icons...")
save(make_main_icon(1024), "icon.png")
save(make_adaptive_icon(1024), "adaptive-icon.png")
save(make_splash(1284, 2778), "splash.png")

# 512x512 for Play Store listing
save(make_main_icon(512), "playstore-icon.png")

# 48x48 favicon
save(make_main_icon(48), "favicon.png")

print("\nDone! Output in:", ASSETS)
