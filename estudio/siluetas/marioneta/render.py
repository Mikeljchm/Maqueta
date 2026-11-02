import numpy as np, math, os
from PIL import Image
from scipy import ndimage as nd
import rig
os.makedirs("out", exist_ok=True)
W, H, FPS = 1920, 1080, 30; N = 450; CUT = 210
A = rig.build_A(); B = rig.build_B()
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
rng = np.random.default_rng(5)
def radial(cx, cy, r): return np.exp(-(((xx - cx) / r) ** 2 + ((yy - cy) / (r * 0.8)) ** 2))
def ease(a, b, t):
    k = np.clip((t - a) / (b - a), 0, 1); return k * k * (3 - 2 * k)
def fogtile(seed, s):
    r = np.random.default_rng(seed).random((H // s + 4, W // s + 8)).astype(np.float32); return nd.zoom(nd.gaussian_filter(r, 2), s, order=1)
F1 = fogtile(1, 24); F2 = fogtile(2, 40)
rain = [(rng.uniform(0, W), rng.uniform(0, H), rng.uniform(40, 90), rng.uniform(0.15, 0.4)) for _ in range(240)]
vig = np.clip(1 - 0.75 * (((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2), 0.15, 1)
steps = []

def place(fig, cx, feet_y, height):
    """coloca la mascara de la figura (resolucion de trabajo) en el lienzo"""
    sc = height / (855 * rig.U)  # 855 = alto de la figura en la imagen original
    h, w = fig.shape; im = Image.fromarray(fig, "F").resize((max(1, int(w * sc)), max(1, int(h * sc))), Image.BILINEAR)
    a = np.array(im, np.float32); can = np.zeros((H, W), np.float32)
    # en coordenadas de trabajo, la figura va de y=(84-60)*U a y=(939-60)*U ; centro x en (512-300)*U
    fx = int(cx - (512 - rig.CX0) * rig.U * sc); fy = int(feet_y - (939 - rig.CY0) * rig.U * sc)
    x0, y0 = max(0, fx), max(0, fy); x1, y1 = min(W, fx + a.shape[1]), min(H, fy + a.shape[0])
    if x1 > x0 and y1 > y0: can[y0:y1, x0:x1] = a[y0 - fy:y1 - fy, x0 - fx:x1 - fx]
    return can

ONLY = [int(x) for x in os.environ.get("ONLY", "").split(",") if x]
for i in (ONLY or range(N)):
    t = i / FPS
    if i < CUT:
        br = math.sin(t * 2 * math.pi / 3.2)
        head = -5 * ease(1.0, 2.2, t) + 8 * ease(4.6, 5.8, t)
        arm = 13 * ease(3.0, 4.6, t)
        fig = rig.frame_A(A, t, armL_ang=arm, armR_ang=-2.5 * ease(3.2, 4.8, t), head_ang=head, breathe=br,
                          hair_amp=7 + 4 * math.sin(t * 0.9), hair_ph=t * 1.7)
        m = place(fig, 960, 1030, 940)
        glow_c = (960, 400); floor = False; zoom = 1.0 + 0.14 * (i / CUT); zy = 0.30
    else:
        tt = (i - CUT) / FPS; ph = 2 * math.pi * 0.9 * tt
        if i > CUT and math.floor(ph / math.pi) != math.floor((2 * math.pi * 0.9 * (tt - 1 / FPS)) / math.pi): steps.append(t)
        fig = rig.frame_B(B, ph, hair_ph=t * 2.2)
        cx = -260 + tt * 310
        m = place(fig, cx, 985, 760)
        glow_c = (cx + 40, 420); floor = True; zoom = 1.0; zy = 0.5
    m = np.clip(m, 0, 1)
    flick = 0.92 + 0.08 * math.sin(t * 23) * math.sin(t * 7.1)
    bg = np.zeros((H, W, 3), np.float32); bg[...] = (0.035, 0.012, 0.018)
    bg += radial(*glow_c, 640)[..., None] * np.array([0.85, 0.16, 0.12]) * 0.9 * flick
    bg += radial(glow_c[0], glow_c[1] - 40, 260)[..., None] * np.array([1.0, 0.55, 0.35]) * 0.42
    blinds = (np.sin((yy + xx * 0.35) / 26.0) > 0.35).astype(np.float32) * radial(glow_c[0] + 40, 420, 520)
    bg += nd.gaussian_filter(blinds, 3)[..., None] * np.array([0.9, 0.3, 0.2]) * 0.11
    side = radial(1760, 520, 380); pol = (math.sin(t * 9) > 0)
    bg += side[..., None] * (np.array([0.5, 0.02, 0.05]) if pol else np.array([0.03, 0.08, 0.45])) * (0.55 if floor else 0.3)
    f2 = np.roll(F2, int(t * 18), axis=1)[:H, :W]; bg += (f2 * 0.12)[..., None] * np.array([0.8, 0.35, 0.35])
    if floor:
        fl = np.clip((yy - 960) / 120, 0, 1); bg = bg * (1 - 0.55 * fl[..., None]) + fl[..., None] * np.array([0.05, 0.02, 0.03])
        # sombra larga en el piso (silueta reflejada y aplastada)
        sh = np.flipud(m); sh = np.roll(sh, -(H - 2 * 985), axis=0)
        sh = nd.zoom(sh, (1, 1), order=1)[:H, :W]
        sh = np.array(Image.fromarray(sh, "F").transform((W, H), Image.AFFINE, (1, 0.9, -0.9 * 985, 0, 2.6, -2.6 * 985 + 985), resample=Image.BILINEAR))
        sh = nd.gaussian_filter(sh * (yy > 985), 4) * 0.7
        bg *= (1 - sh[..., None] * 0.8)
    edge = np.clip(m - nd.grey_erosion(m, size=(7, 7)), 0, 1); edge = nd.gaussian_filter(edge, 2.2)
    img = bg * (1 - m[..., None]) + np.array([0.008, 0.004, 0.006]) * m[..., None]
    img += edge[..., None] * np.array([1.0, 0.35, 0.25]) * 0.85 * flick
    f1 = np.roll(F1, -int(t * 35), axis=1)[:H, :W]; fogf = f1 * np.clip((yy - H * 0.55) / (H * 0.45), 0, 1) * 0.33
    img = img * (1 - fogf[..., None] * 0.6) + fogf[..., None] * np.array([0.35, 0.14, 0.15])
    rl = np.zeros((H, W), np.float32)
    for (x0, y0, l, a) in rain:
        y = (y0 + t * 1400) % (H + 100) - 100; x = int(x0 + (y - y0) * 0.08) % W; y1 = int(max(0, y)); y2 = int(min(H, y + l))
        if y2 > y1: rl[y1:y2, x] = np.maximum(rl[y1:y2, x], a)
    img += nd.gaussian_filter(rl, 0.6)[..., None] * np.array([0.7, 0.6, 0.65]) * 0.55
    img *= vig[..., None]; img += (rng.random((H, W))[..., None] - 0.5) * 0.035
    # destello del corte y fundido final
    if CUT - 2 <= i <= CUT + 3: img = img + (1 - abs(i - CUT) / 4) * 0.9
    if i >= N - 24: img *= (N - i) / 24
    out = Image.fromarray((np.clip(img, 0, 1) ** 0.95 * 255).astype(np.uint8))
    if zoom != 1.0:
        cw, ch = int(W / zoom), int(H / zoom); x0 = (W - cw) // 2; y0 = int((H - ch) * zy)
        out = out.crop((x0, y0, x0 + cw, y0 + ch)).resize((W, H), Image.BICUBIC)
    # glitch en el corte: bandas desplazadas
    if CUT - 1 <= i <= CUT + 4:
        a = np.array(out);
        for _ in range(9):
            y = rng.integers(0, H - 40); h = rng.integers(8, 40); a[y:y + h] = np.roll(a[y:y + h], rng.integers(-120, 120), axis=1)
        a[..., 0] = np.roll(a[..., 0], 8, axis=1); a[..., 2] = np.roll(a[..., 2], -8, axis=1); out = Image.fromarray(a)
    out.save("out/%04d.png" % i)
    if i % 50 == 0: print(i, flush=True)
np.save("steps.npy", np.array(steps)); print("ok", len(steps), "pasos")
