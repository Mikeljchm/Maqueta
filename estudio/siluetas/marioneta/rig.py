import numpy as np, math, sys
from PIL import Image, ImageDraw
from scipy import ndimage as nd

U = 2                                  # trabajamos al doble de resolucion para bordes suaves
CX0, CY0, CW, CH = 300, 60, 440, 900   # recorte de trabajo en coordenadas de la imagen original

def load(n):
    im = Image.open(f"pose{n}.jpg").convert("L").crop((CX0, CY0, CX0 + CW, CY0 + CH))
    im = im.resize((CW * U, CH * U), Image.LANCZOS)
    a = np.clip((150 - np.array(im, np.float32)) / 100, 0, 1)   # antialias suave
    return a

def P(pts):  # coordenadas originales -> coordenadas de trabajo
    return [((x - CX0) * U, (y - CY0) * U) for x, y in pts]

def poly(pts):
    m = Image.new("L", (CW * U, CH * U), 0); ImageDraw.Draw(m).polygon(P(pts), fill=255)
    return np.array(m, np.float32) / 255

def circle(c, r):
    m = Image.new("L", (CW * U, CH * U), 0); (x, y), = P([c]); ImageDraw.Draw(m).ellipse([x - r * U, y - r * U, x + r * U, y + r * U], fill=255)
    return np.array(m, np.float32) / 255

def side(contour, far, closing):
    """region limitada por un contorno (lista de puntos) cerrada hacia 'far' (puntos extra)"""
    return poly(contour + far + closing)

OV = 5 * U
def dil(r): return nd.binary_dilation(r > 0.5, iterations=OV).astype(np.float32)
def ero(r): return nd.binary_erosion(r > 0.5, iterations=OV).astype(np.float32)
def finish(S, parts):
    """parts: dict nombre -> region binaria exclusiva. Devuelve piezas solapadas y cuerpo debajo"""
    allr = np.clip(sum(parts.values()), 0, 1)
    out = {k: S * dil(v) for k, v in parts.items()}
    out["body"] = S * (1 - allr)
    return out

def xf(a, pivot, ang=0.0, dx=0.0, dy=0.0, sx=1.0, sy=1.0):
    """rota/escala una mascara alrededor de un pivote (coordenadas originales) y la traslada"""
    (px, py), = P([pivot]); c, s = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    # matriz inversa para PIL (de salida a entrada)
    a11, a12, a21, a22 = c / sx, s / sx, -s / sy, c / sy
    ox, oy = px + dx * U, py + dy * U
    data = (a11, a12, px - a11 * ox - a12 * oy, a21, a22, py - a21 * ox - a22 * oy)
    return np.array(Image.fromarray(a, "F").transform(a.shape[::-1], Image.AFFINE, data, resample=Image.BILINEAR), np.float32)

def warp_hair(a, root_y, length, amp, phase):
    """dobla el pelo como tela: desplazamiento horizontal que crece hacia las puntas"""
    h, w = a.shape; yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r0 = (root_y - CY0) * U; k = np.clip((yy - r0) / (length * U), 0, 1) ** 1.6
    dxm = amp * U * k * np.sin(phase + k * 2.2)
    return nd.map_coordinates(a, [yy, xx - dxm], order=1, mode="constant")

# ---------------- POSE A (parada) ----------------
def build_A():
    S = load("A")
    # contorno escondido de la cadera bajo el brazo de la pistola
    tc = [(470, 270), (467, 330), (470, 380), (456, 430), (441, 478), (432, 505)]
    B = (S > 0.01).astype(np.float32)
    armL = B * side(tc, [(432, 660), (330, 660)], [(330, 250), (470, 250)])
    tr = [(575, 245), (585, 300), (590, 380), (598, 470), (610, 520), (614, 620)]
    armR = B * side(tr, [(720, 620)], [(720, 245)])
    head = B * poly([(430, 60), (640, 60), (640, 205), (575, 205), (548, 232), (505, 232), (470, 215), (430, 215)])
    hair = B * poly([(505, 225), (478, 245), (455, 268), (448, 300), (440, 330), (360, 330), (380, 200), (440, 100), (500, 120)])
    hair = hair * (1 - armL) * (1 - head)
    R = finish(S, dict(armL=armL, armR=armR, head=head, hair=hair))
    R["armL"] = np.maximum(R["armL"], S * circle((458, 292), 26)); R["armR"] = np.maximum(R["armR"], S * circle((588, 282), 24))
    R["head"] = np.maximum(R["head"], S * circle((538, 228), 24)); R["S"] = S
    return R

def frame_A(R, t, armL_ang=0, armR_ang=0, head_ang=0, breathe=0, hair_amp=6, hair_ph=0):
    sy = 1 + 0.006 * breathe
    body = xf(R["body"], (520, 880), sy=sy)
    lift = -(1 - sy) * 0  # el pecho sube con la respiracion
    out = body
    out = np.maximum(out, xf(R["armL"], (458, 292), armL_ang, dy=-1.5 * breathe))
    out = np.maximum(out, xf(R["armR"], (588, 282), armR_ang, dy=-1.5 * breathe))
    hd = xf(R["head"], (538, 228), head_ang, dy=-1.2 * breathe)
    hr = warp_hair(R["hair"], 200, 130, hair_amp, hair_ph)
    hr = xf(hr, (538, 228), head_ang * 0.6, dy=-1.2 * breathe)
    out = np.maximum(out, np.maximum(hd, hr))
    return out

# ---------------- POSE B (caminando) ----------------
def build_B():
    S = load("B")
    tc = [(492, 275), (488, 330), (493, 385), (478, 440), (458, 500), (448, 520)]
    Bn = (S > 0.01).astype(np.float32)
    armL = Bn * side(tc, [(448, 660), (330, 660)], [(330, 250), (492, 250)])
    tr = [(585, 245), (595, 300), (601, 380), (602, 470), (602, 600)]
    armR = Bn * side(tr, [(740, 600)], [(740, 245)])
    head = Bn * poly([(440, 60), (650, 60), (650, 205), (590, 205), (562, 228), (520, 230), (480, 215), (440, 215)])
    hair = Bn * poly([(520, 225), (493, 245), (478, 268), (468, 300), (462, 340), (380, 340), (395, 200), (455, 100), (515, 120)])
    hair = hair * (1 - armL) * (1 - head)
    # piernas: componentes conectados por debajo de la entrepierna
    low = (S > 0.01) * poly([(330, 652), (740, 652), (740, 960), (330, 960)])
    lab, n = nd.label(nd.binary_erosion(low > 0.5, iterations=1) | (low > 0.5))
    sizes = nd.sum(low, lab, range(1, n + 1)); order = np.argsort(sizes)[::-1][:2] + 1
    legs = [(lab == o).astype(np.float32) for o in order]
    cxs = [np.mean(np.where(l > 0)[1]) for l in legs]
    back_leg, front_leg = (legs[0], legs[1]) if cxs[0] < cxs[1] else (legs[1], legs[0])
    shinB = back_leg * poly([(330, 735), (520, 770), (520, 960), (330, 960)]); thighB = np.clip(back_leg - shinB, 0, 1)
    shinF = front_leg * poly([(560, 760), (740, 735), (740, 960), (560, 960)]); thighF = np.clip(front_leg - shinF, 0, 1)
    R = finish(S, dict(armL=armL, armR=armR, head=head, hair=hair, thighB=thighB, shinB=shinB, thighF=thighF, shinF=shinF))
    R["shinB"] = np.maximum(R["shinB"], S * dil(back_leg) * circle((478, 748), 28)); R["shinF"] = np.maximum(R["shinF"], S * dil(front_leg) * circle((606, 752), 28))
    R["thighB"] = np.maximum(R["thighB"], S * circle((525, 640), 36)); R["thighF"] = np.maximum(R["thighF"], S * circle((565, 640), 36))
    R["armL"] = np.maximum(R["armL"], S * circle((480, 292), 26)); R["armR"] = np.maximum(R["armR"], S * circle((598, 282), 24))
    R["head"] = np.maximum(R["head"], S * circle((552, 226), 24)); R["S"] = S
    return R

def frame_B(R, ph, hair_ph=0):
    """ciclo de caminar: ph en radianes (2*pi = dos pasos)"""
    s = math.sin(ph); c2 = math.cos(2 * ph)
    bob = -6 * (1 - abs(math.cos(ph)))              # el cuerpo sube en el paso
    out = xf(R["body"], (540, 600), dy=bob)
    # piernas: la de atras y la de adelante se alternan
    aB = 12 * s; aF = -12 * s
    kB = max(0, -s) * 14; kF = max(0, s) * 14          # la rodilla se dobla cuando la pierna va atras
    for th, sh, hip, knee, a, k in ((R["thighB"], R["shinB"], (525, 640), (478, 748), aB, kB), (R["thighF"], R["shinF"], (565, 640), (606, 752), aF, kF)):
        out = np.maximum(out, xf(th, hip, a, dy=bob))
        # la pierna sigue al muslo: rotar la rodilla con el muslo y luego doblarla
        (hx, hy), (kx, ky) = hip, knee; r = math.radians(a)
        nkx = hx + (kx - hx) * math.cos(r) - (ky - hy) * math.sin(r); nky = hy + (kx - hx) * math.sin(r) + (ky - hy) * math.cos(r)
        shr = xf(sh, knee, a + k, dx=nkx - kx, dy=nky - ky + bob)
        out = np.maximum(out, shr)
    out = np.maximum(out, xf(R["armL"], (480, 292), -9 * s, dy=bob))
    out = np.maximum(out, xf(R["armR"], (598, 282), 9 * s, dy=bob))
    hd = xf(R["head"], (552, 226), 1.5 * math.sin(2 * ph), dy=bob)
    hr = warp_hair(R["hair"], 200, 140, 7 + 5 * abs(s), hair_ph)
    out = np.maximum(out, np.maximum(hd, xf(hr, (552, 226), 0, dy=bob)))
    return out

if __name__ == "__main__":
    A = build_A(); B = build_B()
    tests = [frame_A(A, 0), frame_A(A, 0, armL_ang=12, head_ang=-5, hair_amp=12, hair_ph=1.2),
             frame_B(B, 0), frame_B(B, math.pi / 2), frame_B(B, -math.pi / 2)]
    row = [Image.fromarray(((1 - np.clip(x, 0, 1)) * 230 + 20).astype(np.uint8)).resize((CW // 2, CH // 2)) for x in tests]
    # piezas en colores para revisar el corte
    def colorize(R, keys):
        h, w = R["S"].shape; im = np.full((h, w, 3), 235, np.float32)
        pal = [(40, 40, 40), (200, 40, 40), (40, 120, 220), (40, 170, 80), (230, 150, 20), (150, 60, 200), (20, 180, 180), (120, 90, 40), (220, 90, 160)]
        for i, k in enumerate(keys):
            m = R[k][..., None]; im = im * (1 - m) + np.array(pal[i % len(pal)]) * m
        return Image.fromarray(im.astype(np.uint8)).resize((CW // 2, CH // 2))
    cols = [colorize(A, ["body", "armL", "armR", "head", "hair"]), colorize(B, ["body", "armL", "armR", "head", "hair", "thighB", "shinB", "thighF", "shinF"])]
    sheet = Image.new("RGB", ((CW // 2) * 7, CH // 2), "white")
    for i, im in enumerate(cols + row): sheet.paste(im, (i * (CW // 2), 0))
    sheet.save("rigtest.png"); print("ok")
