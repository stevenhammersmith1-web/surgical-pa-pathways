"""Builds the two-panel subclavian venipuncture figure:

  images/subclavian_deep.webp     skeleton + subclavian artery/vein, IJ, brachiocephalic v., needle path
  images/subclavian_surface.webp  skin surface with notch, clavicle thirds, entry point, aiming arrow

Bases (both public domain):
  source/skeleton_upper_chest.png  Mikael Häggström after Mariana Ruiz Villarreal,
      https://commons.wikimedia.org/wiki/File:Human_skeleton_front_-_no_labels.svg
      (rendered at w=2600, cropped to (500, 760, 2100, 1400))
  source/gray1219_torso.png        Gray's Anatomy (1918) fig. 1219,
      https://commons.wikimedia.org/wiki/File:Gray1219.png

Vessel paths are schematic, drawn in the frontal projection: the vein runs just
below/behind the clavicle across the first rib; the artery arches higher and
behind it (separated by anterior scalene) before passing under the clavicle.
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = Path(__file__).parent
S = 2  # supersample factor

INK = (17, 27, 25)
TEAL = (12, 107, 96)
AMBER = (168, 91, 8)
STEEL = (96, 106, 112)
VEIN = (46, 104, 196)
ARTERY = (196, 44, 52)


def font(size, bold=False):
    name = 'segoeuib.ttf' if bold else 'segoeui.ttf'
    return ImageFont.truetype(f'C:/Windows/Fonts/{name}', int(size * S))


class Canvas:
    def __init__(self, base, scale=1):
        """`scale` maps base-image pixels to canvas coordinates before supersampling."""
        self.k = scale * S
        self.img = base.resize((round(base.width * self.k), round(base.height * self.k)), Image.LANCZOS).convert('RGBA')
        self.d = ImageDraw.Draw(self.img)

    def P(self, x, y):
        return (x * self.k, y * self.k)

    def px(self, v):
        return max(1, round(v * S))

    def overlay_path(self, pts, color, width, alpha=150, outline=None):
        """Smooth translucent tube along a polyline (Catmull-Rom sampled)."""
        layer = Image.new('RGBA', self.img.size, (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        sm = catmull(pts)
        xy = [self.P(*p) for p in sm]
        w = self.px(width)
        if outline:
            ld.line(xy, fill=outline + (220,), width=w + self.px(3), joint='curve')
            for p in (xy[0], xy[-1]):
                r = (w + self.px(3)) / 2
                ld.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=outline + (220,))
        ld.line(xy, fill=color + (alpha,), width=w, joint='curve')
        for p in (xy[0], xy[-1]):
            r = w / 2
            ld.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=color + (alpha,))
        self.img.alpha_composite(layer)
        self.d = ImageDraw.Draw(self.img)

    def label(self, xy, lines, f, fill, pad=5, anchor='l'):
        d = self.d
        lh = f.size * 1.28
        w = max(d.textlength(t, font=f) for t in lines)
        x, y = self.P(*xy)
        if anchor == 'r':
            x -= w
        elif anchor == 'c':
            x -= w / 2
        d.rounded_rectangle([x - pad * S, y - pad * S * .4, x + w + pad * S, y + lh * len(lines) + pad * S * .5],
                            radius=5 * S, fill=(255, 255, 255, 235))
        for i, t in enumerate(lines):
            d.text((x, y + i * lh), t, font=f, fill=fill)

    def leader(self, a, b, color, width=1.6):
        self.d.line([self.P(*a), self.P(*b)], fill=color, width=self.px(width))

    def ring(self, c, r, color, width=3, dot=True):
        x, y = c
        self.d.ellipse([self.P(x - r, y - r), self.P(x + r, y + r)], outline=color, width=self.px(width))
        if dot:
            self.d.ellipse([self.P(x - r * .25, y - r * .25), self.P(x + r * .25, y + r * .25)], fill=color)

    def dashed_arrow(self, a, b, color, width=2.6, seg=10, gap=7, head=13, trim_end=0):
        ux, uy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(ux, uy); ux, uy = ux / L, uy / L
        end = (b[0] - trim_end * ux, b[1] - trim_end * uy)
        total = L - trim_end - head * .6
        t = 0.0
        while t < total:
            e = min(t + seg, total)
            self.d.line([self.P(a[0] + ux * t, a[1] + uy * t), self.P(a[0] + ux * e, a[1] + uy * e)],
                        fill=color, width=self.px(width))
            t += seg + gap
        pxv, pyv = -uy, ux
        self.d.polygon([self.P(*end),
                        self.P(end[0] - head * ux + head * .55 * pxv, end[1] - head * uy + head * .55 * pyv),
                        self.P(end[0] - head * ux - head * .55 * pxv, end[1] - head * uy - head * .55 * pyv)],
                       fill=color)

    def syringe(self, tip, toward, needle=80, barrel=92, bw=12, plunger=26):
        ux, uy = toward[0] - tip[0], toward[1] - tip[1]
        L = math.hypot(ux, uy); ux, uy = ux / L, uy / L
        pxv, pyv = -uy, ux
        hub = (tip[0] - needle * ux, tip[1] - needle * uy)
        P = self.P
        self.d.line([P(*hub), P(*tip)], fill=STEEL, width=self.px(2.6))
        self.d.polygon([P(*tip), P(tip[0] - 8 * ux + 1.8 * pxv, tip[1] - 8 * uy + 1.8 * pyv),
                        P(tip[0] - 8 * ux - 1.8 * pxv, tip[1] - 8 * uy - 1.8 * pyv)], fill=INK)
        h1 = (hub[0] - 13 * ux, hub[1] - 13 * uy)
        hw = 6
        self.d.polygon([P(hub[0] + hw * .6 * pxv, hub[1] + hw * .6 * pyv), P(hub[0] - hw * .6 * pxv, hub[1] - hw * .6 * pyv),
                        P(h1[0] - hw * pxv, h1[1] - hw * pyv), P(h1[0] + hw * pxv, h1[1] + hw * pyv)], fill=(40, 120, 180))
        b1 = (h1[0] - barrel * ux, h1[1] - barrel * uy)
        self.d.polygon([P(h1[0] + bw * pxv, h1[1] + bw * pyv), P(h1[0] - bw * pxv, h1[1] - bw * pyv),
                        P(b1[0] - bw * pxv, b1[1] - bw * pyv), P(b1[0] + bw * pxv, b1[1] + bw * pyv)],
                       fill=(236, 242, 246), outline=STEEL, width=self.px(1.6))
        for k in range(1, 5):
            m = (h1[0] - 18 * k * ux, h1[1] - 18 * k * uy)
            self.d.line([P(m[0] + bw * pxv, m[1] + bw * pyv), P(m[0] + (bw - 6) * pxv, m[1] + (bw - 6) * pyv)],
                        fill=STEEL, width=self.px(1))
        p1 = (b1[0] - plunger * ux, b1[1] - plunger * uy)
        self.d.line([P(*b1), P(*p1)], fill=STEEL, width=self.px(3.4))
        self.d.line([P(p1[0] + 10 * pxv, p1[1] + 10 * pyv), P(p1[0] - 10 * pxv, p1[1] - 10 * pyv)],
                    fill=STEEL, width=self.px(4))

    def thirds_bar(self, lat, med, y, lf, color=INK, drop_to=None):
        j = (med[0] + (lat[0] - med[0]) / 3, med[1] + (lat[1] - med[1]) / 3)
        for x in (lat[0], j[0], med[0]):
            self.leader((x, y - 7), (x, y + 7), color, 2.6)
        self.leader((lat[0], y), (med[0], y), color, 1.8)
        for (x, yy) in (lat, med):
            self.leader((x, y + 7), (x, yy - 8), (150, 150, 150), 1)
        if drop_to is not None:
            self.leader((j[0], y + 7), (j[0], drop_to), AMBER, 1.8)
        f = lf
        cx1, cx2 = (lat[0] + j[0]) / 2, (j[0] + med[0]) / 2
        for cx, t in ((cx1, 'Lateral ⅔'), (cx2, 'Medial ⅓')):
            w = self.d.textlength(t, font=f) / self.k
            self.d.text(self.P(cx - w / 2, y - 26), t, font=f, fill=color)
        return j

    def finish(self, box, out_name, max_w):
        k = self.k
        out = self.img.crop(tuple(round(v * k) for v in box)).convert('RGB')
        out = out.resize((round(out.width / S), round(out.height / S)), Image.LANCZOS)
        out.thumbnail((max_w, max_w), Image.LANCZOS)
        out.save(HERE / 'images' / f'{out_name}.webp', 'WEBP', quality=84, method=6)
        out.save(HERE / 'source' / f'{out_name}_preview.png')
        print(out_name, out.size)


def catmull(pts, n=14):
    if len(pts) < 3:
        return pts
    P = [pts[0]] + list(pts) + [pts[-1]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for s in range(n):
            t = s / n
            t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
                                    + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in (0, 1)))
    out.append(pts[-1])
    return out


# ------------------------------------------------------------------ deep panel
def deep_panel():
    base = Image.open(HERE / 'source' / 'skeleton_upper_chest.png').convert('RGB')
    c = Canvas(base)
    lat_end, med_end = (250, 112), (662, 182)
    notch = (713, 181)
    # first rib lateral border ~ (455, 210); SC joint ~ (650, 200)

    # artery first (it is posterior), then vein on top
    bif = (656, 206)                      # brachiocephalic trunk bifurcation, behind right SC joint
    carotid = [bif, (640, 160), (626, 110), (616, 70)]
    subcl_a = [bif, (640, 178), (610, 150), (570, 138), (520, 140), (470, 150), (420, 164), (360, 177), (238, 188)]
    brachio_trunk = [(706, 334), (692, 284), (672, 232), bif]
    c.overlay_path(brachio_trunk, ARTERY, 11, alpha=120, outline=(120, 20, 28))
    c.overlay_path(carotid, ARTERY, 9, alpha=120, outline=(120, 20, 28))
    c.overlay_path(subcl_a, ARTERY, 10, alpha=150, outline=(120, 20, 28))

    conf = (644, 212)                     # IJ + subclavian -> brachiocephalic v., behind SC joint
    ij = [(590, 70), (596, 120), (612, 170), (632, 198), conf]
    subcl_v = [(238, 206), (330, 192), (400, 176), (470, 164), (523, 160), (575, 170), (615, 192), conf]
    brachio_v = [conf, (650, 260), (656, 334)]
    c.overlay_path(ij, VEIN, 13, alpha=150, outline=(20, 52, 120))
    c.overlay_path(brachio_v, VEIN, 15, alpha=150, outline=(20, 52, 120))
    c.overlay_path(subcl_v, VEIN, 14, alpha=165, outline=(20, 52, 120))

    f_dim = font(15, bold=True)
    j = c.thirds_bar(lat_end, med_end, 50, f_dim, drop_to=142)
    c.ring((j[0], 150), 7, AMBER, 2.6, dot=False)
    entry = (j[0], 178)

    c.ring(notch, 11, TEAL, 3.4)
    c.dashed_arrow((entry[0] + 22, entry[1] + .2), notch, TEAL, trim_end=16)
    c.syringe((entry[0] + 22, entry[1]), notch)
    c.d.ellipse([c.P(entry[0] - 4, entry[1] - 4), c.P(entry[0] + 4, entry[1] + 4)], fill=AMBER)

    fl = font(14, bold=True)
    c.label((760, 118), ['Sternal notch'], fl, TEAL)
    c.leader((722, 172), (770, 138), TEAL)
    c.label((244, 212), ['Subclavian vein'], fl, VEIN)
    c.label((244, 148), ['Subclavian artery'], fl, ARTERY)
    c.leader((300, 166), (306, 180), ARTERY)
    c.label((556, 84), ['Internal', 'jugular v.'], font(13, bold=True), VEIN, anchor='r')
    c.leader((558, 100), (594, 104), VEIN)
    c.label((714, 300), ['Brachiocephalic v.'], font(13, bold=True), VEIN)
    c.leader((716, 308), (656, 310), VEIN)
    c.label((718, 226), ['Brachiocephalic trunk'], font(12.5, bold=True), ARTERY)
    c.leader((720, 236), (684, 262), ARTERY)
    c.label((452, 272), ['1st rib'], font(13), STEEL)
    c.leader((468, 270), (470, 232), STEEL, 1.2)
    c.label((246, 324), ["Deep: patient's right, vessels schematic"], font(12.5), STEEL, pad=4)
    c.finish((230, 6, 900, 346), 'subclavian_deep', 760)


# --------------------------------------------------------------- surface panel
def surface_panel():
    base = Image.open(HERE / 'source' / 'gray1219_torso.png').convert('RGB')
    # erase Gray's original "Infrasternal notch" leader line where it crosses the crop
    px = base.load()
    x0, y0, x1, y1 = 266, 75, 193, 250
    for s in range(0, 400):
        t = s / 399
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        for dx in (-2, -1, 0, 1, 2):
            xi, yi = int(round(x + dx)), int(round(y))
            if 0 <= xi < base.width and 0 <= yi < base.height:
                px[xi, yi] = px[min(base.width - 1, xi + 5), yi]
    c = Canvas(base, scale=3.4)

    notch = (191, 128)
    lat_end, med_end = (64, 120), (180, 128)
    j = (med_end[0] + (lat_end[0] - med_end[0]) / 3, med_end[1] + (lat_end[1] - med_end[1]) / 3)
    entry = (j[0], j[1] + 12)   # ~1.5 cm below at this plate's scale (~8 px/cm)

    # clavicle course (dashed) along the subtle ridge under the shoulder contour
    clav = catmull([lat_end, (95, 121), (130, 124), (160, 126), med_end])
    for i in range(0, len(clav) - 1, 2):
        c.d.line([c.P(*clav[i]), c.P(*clav[i + 1])], fill=STEEL + (230,), width=c.px(2.4))

    # thirds bar above the shoulder
    f_dim = font(14, bold=True)
    bar_y = 104
    for x in (lat_end[0], j[0], med_end[0]):
        c.leader((x, bar_y - 2), (x, bar_y + 2), INK, 2.6)
    c.leader((lat_end[0], bar_y), (med_end[0], bar_y), INK, 1.8)
    c.leader((j[0], bar_y + 2), (j[0], j[1] - 2), AMBER, 1.6)
    for cx, t in (((lat_end[0] + j[0]) / 2, 'Lateral ⅔'), ((j[0] + med_end[0]) / 2, 'Medial ⅓')):
        c.label((cx, bar_y - 9.5), [t], f_dim, INK, pad=3, anchor='c')

    c.ring(notch, 3.6, TEAL, 3)
    c.dashed_arrow((entry[0] + 7, entry[1] - .5), notch, TEAL, width=2.4, seg=3, gap=2, head=4.2, trim_end=4.6)
    # entry mark: an X
    e = entry; r = 2.6
    c.d.line([c.P(e[0] - r, e[1] - r), c.P(e[0] + r, e[1] + r)], fill=AMBER, width=c.px(3.4))
    c.d.line([c.P(e[0] - r, e[1] + r), c.P(e[0] + r, e[1] - r)], fill=AMBER, width=c.px(3.4))

    fl = font(14, bold=True)
    c.label((200, 112), ['Sternal notch'], fl, TEAL)
    c.leader((194, 125), (203, 118), TEAL)
    c.label((56, 150), ['Entry: 1–2 cm below the clavicle', 'at the medial ⅓ / lateral ⅔ point'], fl, AMBER)
    c.leader((entry[0] - 3, entry[1] + 3), (entry[0] - 8, 150), AMBER)
    c.label((56, 126), ['Clavicle'], font(13), STEEL, pad=3)
    c.label((158, 139), ['Aim at the notch'], font(13.5, bold=True), TEAL)
    c.label((56, 186), ["Surface: patient's right"], font(12.5), STEEL, pad=3)
    c.finish((44, 92, 252, 196), 'subclavian_surface', 760)


deep_panel()
surface_panel()
