"""
Rebuild the parcel illustration with a genuinely sharp logo on it.

The source artwork is a low-resolution crop, so the logo printed on the carton
is smeared: "Swift" is unreadable and the descriptor line is mush. The carton
itself is fine. So: repaint the panel where the old logo sits, then composite
the real logo artwork onto that panel with the face's perspective, at twice the
output resolution so it stays crisp on a high density screen.
"""

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np

SRC = "assets/parcel-source.png"
LOGO = "public/brand/swifttrack-logo-light.png"
OUT = "public/brand/parcel.png"

S = 2  # output scale

# Front face corners, read off a coordinate grid overlaid on the source.
FL_TOP, FL_BOT = 100.0, 500.0  # left edge of the front face
FR_TOP, FR_BOT = 148.0, 570.0  # right edge, at the vertical corner
FX0, FX1 = 42.0, 650.0


def face_top(x):
    return FL_TOP + (FR_TOP - FL_TOP) * (x - FX0) / (FX1 - FX0)


def face_bottom(x):
    return FL_BOT + (FR_BOT - FL_BOT) * (x - FX0) / (FX1 - FX0)


def face_y(x, f):
    """Point at fraction f down the face at horizontal position x."""
    t = face_top(x)
    return t + f * (face_bottom(x) - t)


# ---------------------------------------------------------------------------
# 1. Upscale the carton, then repaint the panel the old logo sat on.
# ---------------------------------------------------------------------------

src = Image.open(SRC).convert("RGBA")
W, H = src.size
big = src.resize((W * S, H * S), Image.LANCZOS)
arr = np.array(big).astype(np.float64)

# The region to repaint. Its vertical bounds are given as fractions of the face
# height rather than pixels, so the patch follows the perspective the way the
# panel does - an axis-aligned rectangle leaves a seam that catches the eye
# precisely because nothing else on the box is axis-aligned.
RX0, RX1 = 104.0, 600.0
RF0 = 0.13  # top edge, as a fraction of the face height

# The bottom edge is horizontal rather than following the face, because it has
# only 34 source pixels to live in: the old logo's ink stops at y=416 and the
# handling symbols start at y=450. An iso-height line across this width drops
# further than that gap allows, so following the face here would either leave a
# ghost of the old descriptor or shave the tops off the symbols. The edge lands
# on blank cardboard and is feathered, so its shape is invisible either way.
R_BOTTOM = 434.0
BLUR = 6.0  # source pixels; full opacity by y=420, fully clear by y=448

x0, y0 = int(RX0 * S), int(min(face_y(RX0, RF0), face_y(RX1, RF0)) * S)
x1, y1 = int(RX1 * S), int(R_BOTTOM * S)

# Fill by interpolating inward from the four boundaries. The face is a smooth
# gradient here, so this reconstructs it without a visible seam - far better
# than a flat fill, which would read as a sticker.
left = arr[y0:y1, x0 - 1][:, None, :]
right = arr[y0:y1, x1][:, None, :]
top = arr[y0 - 1, x0:x1][None, :, :]
bottom = arr[y1, x0:x1][None, :, :]

w = x1 - x0
h = y1 - y0
ix = np.arange(w)[None, :, None]
iy = np.arange(h)[:, None, None]

wl = 1.0 / (ix + 1.0)
wr = 1.0 / (w - ix)
wt = 1.0 / (iy + 1.0)
wb = 1.0 / (h - iy)

filled = (left * wl + right * wr + top * wt + bottom * wb) / (wl + wr + wt + wb)

# No grain is added back. Cardboard texture was tried by lifting the high
# frequency detail from a clean patch of the same face and tiling it over the
# repaint; the patch carries the corrugation, and tiling it turned that into
# obvious vertical banding across the panel - a worse artefact than the flat
# fill it was meant to disguise. The panel is smooth enough at this size that
# the interpolation alone is invisible.

# Blend the repaint in behind a feathered mask shaped like the face, so the
# fill fades into the untouched cardboard instead of ending at a hard border.
# The interpolation matches the boundary colour exactly but not its gradient,
# and that discontinuity is what shows up as a seam.
mask = Image.new("L", (W * S, H * S), 0)
ImageDraw.Draw(mask).polygon(
    [
        (RX0 * S, face_y(RX0, RF0) * S),
        (RX1 * S, face_y(RX1, RF0) * S),
        (RX1 * S, R_BOTTOM * S),
        (RX0 * S, R_BOTTOM * S),
    ],
    fill=255,
)
mask = mask.filter(ImageFilter.GaussianBlur(BLUR * S))
m = (np.array(mask).astype(np.float64) / 255.0)[y0:y1, x0:x1, None]

region = arr[y0:y1, x0:x1]
arr[y0:y1, x0:x1] = np.clip(region * (1 - m) + np.clip(filled, 0, 255) * m, 0, 255)
canvas = Image.fromarray(arr.astype(np.uint8), "RGBA")

# ---------------------------------------------------------------------------
# 2. Build the decal: the real logo plus the descriptor, drawn flat.
# ---------------------------------------------------------------------------

# Where the decal sits on the face, as fractions of the face height so it
# follows the perspective rather than sitting at a fixed pixel height.
DX0, DX1 = 132.0, 566.0
# Sits clear of the repaint's lower edge at the right hand side, where the face
# drops away fastest and the handling symbols are closest.
F_TOP, F_BOT = 0.215, 0.665

logo = Image.open(LOGO).convert("RGBA")
decal_w = int((DX1 - DX0) * S * 1.6)  # oversampled, then downscaled by the warp
band_px = face_y(DX0, F_BOT) - face_y(DX0, F_TOP)
decal_h = int(band_px * S * 1.6)

decal = Image.new("RGBA", (decal_w, decal_h), (0, 0, 0, 0))

logo_h = int(decal_w / (logo.width / logo.height))
decal.alpha_composite(logo.resize((decal_w, logo_h), Image.LANCZOS), (0, 0))

# The descriptor is set as live text rather than taken from the artwork, so it
# renders at full resolution instead of inheriting the source crop's blur.
gap = int(decal_h * 0.055)
avail = decal_h - logo_h - gap
if avail > 12:
    size = max(12, int(avail * 0.62))
    font = ImageFont.truetype(
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", size
    )
    text = "PRIVATE DELIVERY COMPANY"
    tracking = size * 0.20

    widths = [font.getlength(ch) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)

    d = ImageDraw.Draw(decal)
    cx = (decal_w - total) / 2
    cy = logo_h + gap
    for ch, cw in zip(text, widths):
        d.text((cx, cy), ch, font=font, fill=(42, 48, 56, 255))
        cx += cw + tracking

# ---------------------------------------------------------------------------
# 3. Warp the decal onto the face and print it onto the carton.
# ---------------------------------------------------------------------------

quad = [
    (DX0 * S, face_y(DX0, F_TOP) * S),
    (DX1 * S, face_y(DX1, F_TOP) * S),
    (DX1 * S, face_y(DX1, F_BOT) * S),
    (DX0 * S, face_y(DX0, F_BOT) * S),
]


def perspective_coeffs(dst, src_pts):
    m = []
    for (dx, dy), (sx, sy) in zip(dst, src_pts):
        m.append([dx, dy, 1, 0, 0, 0, -sx * dx, -sx * dy])
        m.append([0, 0, 0, dx, dy, 1, -sy * dx, -sy * dy])
    A = np.array(m, dtype=np.float64)
    B = np.array(src_pts, dtype=np.float64).reshape(8)
    return np.linalg.solve(A, B)


coeffs = perspective_coeffs(
    quad,
    [(0, 0), (decal_w, 0), (decal_w, decal_h), (0, decal_h)],
)

warped = decal.transform(
    canvas.size, Image.PERSPECTIVE, coeffs, Image.BICUBIC, fillcolor=(0, 0, 0, 0)
)

# Print, rather than paste. Ink on cardboard picks up the panel's shading, so
# carry a little of the surface luminance through the artwork - without it the
# logo reads as a flat sticker floating above the box.
base = np.array(canvas).astype(np.float64)
ink = np.array(warped).astype(np.float64)
a = (ink[:, :, 3:4] / 255.0) * 0.96

lum = base[:, :, :3].mean(axis=2, keepdims=True) / 255.0
shading = 0.86 + 0.14 * (lum / max(lum.mean(), 1e-6))
ink_shaded = np.clip(ink[:, :, :3] * np.clip(shading, 0.7, 1.12), 0, 255)

out = base.copy()
out[:, :, :3] = base[:, :, :3] * (1 - a) + ink_shaded * a
result = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")

# A light unsharp pass: the source crop is soft everywhere, and the carton's
# edges and print marks read better with a little definition restored.
result = result.filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=3))

# Composited at 2x for quality, delivered smaller. The card shows this at 290
# CSS pixels at most, so 1200 across still covers a 4x display, and it costs a
# fraction of what the full size did.
FINAL_W = 1200
result = result.resize((FINAL_W, round(FINAL_W * H / W)), Image.LANCZOS)
result.save(OUT, optimize=True)
print("wrote", OUT, result.size)
