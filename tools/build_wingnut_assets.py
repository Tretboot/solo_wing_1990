#!/usr/bin/env python3
"""
SOLO WING 1990 — Compact Multi-Angle Asset, Lighting & VFX Builder (v2.0)
=========================================================================
Extracts and downscales Howard Day / Arne Niklas Jansson (WCUnity) assets
into crisp, power-of-2 / divisible-by-2 sprite atlases, cockpits, weapon-flash
lightmaps, and space/navigation VFX, plus procedurally renders high-detail
2x-supersampled 80-view 3D pixel-art ship atlases & cockpits for:
  - TCS Fax-Tragödie (Confederation Carrier, 80 views)
  - TCS Hermes (AI/Robot Swarm Carrier, 80 views)
  - KIWI-Mk.IV (Hermes AI Swarm Interceptor, 80 views)
  - Kiste 47 / Tarsus / Dorkir (Privateer Cargo Freighter, 80 views)
  - Scimitar, Freighter & Hermes Cockpits (with LeftGun/RightGun/Damaged layers)

Atlas Format (80 Views per Ship):
  - 16 columns: YAW_STEPS = [31, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29]
    Matches WCUnity SpritePicker.cs (`theta = (yaw + 1) * PI/16`):
      col 0  (yaw 31) =   0.0 deg (Exact Front / Bow)
      col 4  (yaw  7) =  90.0 deg (Exact Starboard / Right Side, nose right)
      col 8  (yaw 15) = 180.0 deg (Exact Rear / Engine Exhaust)
      col 12 (yaw 23) = 270.0 deg (Exact Port / Left Side, nose left)
  - 5 rows: PITCH_SHEETS = [2, 5, 8, 11, 14] (steep up, slight up, level equator, slight down, steep down)
"""

import math
import os
from PIL import Image, ImageDraw, ImageEnhance

WCUNITY_ART = r"G:\agenthome\Referenz\WCUnity\Assets\Art"
OUT_DIR = r"G:\agenthome\solo_wing_1990\sprites"
SHIPS_OUT = os.path.join(OUT_DIR, "ships")
COCKPITS_OUT = os.path.join(OUT_DIR, "cockpits")
VFX_OUT = os.path.join(OUT_DIR, "vfx")

for d in (OUT_DIR, SHIPS_OUT, COCKPITS_OUT, VFX_OUT):
    os.makedirs(d, exist_ok=True)

PITCH_SHEETS = [2, 5, 8, 11, 14]  # 5 elevation rings (sheet 8 = equator/level)
# Odd yaw indices in WCUnity align to exact 0, 22.5, 45, ..., 337.5 degree angles!
YAW_STEPS = [31, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29]


def save_optimized_png(img: Image.Image, path: str, colors: int = 256):
    """Quantize RGBA image to 8-bit indexed PNG with alpha preservation for compact GitHub size."""
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    try:
        q = img.quantize(colors=colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        q.save(path, optimize=True)
    except Exception:
        img.save(path, optimize=True)


def clean_downscale_ship_cell(frame: Image.Image, cell_size: int, hue_shift: float = 0.0, sat_mult: float = 1.0) -> Image.Image:
    """
    Downscale a high-res WCUnity ship cell (256x256..475x475) to cell_size x cell_size
    WITHOUT clipping wingtips/noses and WITHOUT adding a destructive black border.
    Uses a 2px safety pad inside cell_size so full wingspans stay 100% intact.
    """
    import colorsys

    # Keep the entire source frame intact (do NOT crop 4% off wingtips!)
    # Resize into (cell_size - 2) x (cell_size - 2) with LANCZOS and center in cell_size x cell_size
    inner = max(8, cell_size - 2)
    pad = (cell_size - inner) // 2
    small_inner = frame.resize((inner, inner), Image.Resampling.LANCZOS)
    small = Image.new("RGBA", (cell_size, cell_size), (0, 0, 0, 0))
    small.paste(small_inner, (pad, pad))
    spx = small.load()

    cleaned = Image.new("RGBA", (cell_size, cell_size), (0, 0, 0, 0))
    cpx = cleaned.load()

    for y in range(cell_size):
        for x in range(cell_size):
            r, g, b, a = spx[x, y]
            if a >= 68:
                # Recover unpremultiplied color on semi-transparent boundary pixels
                if a < 245:
                    scale = 255.0 / max(68, a)
                    r = min(255, int(r * scale))
                    g = min(255, int(g * scale))
                    b = min(255, int(b * scale))
                # Optional palette hue/saturation shift for faction/squadron variants
                if hue_shift != 0.0 or sat_mult != 1.0:
                    h_val, s_val, v_val = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
                    if s_val > 0.12:
                        h_val = (h_val + hue_shift) % 1.0
                        s_val = max(0.0, min(1.0, s_val * sat_mult))
                        rf, gf, bf = colorsys.hsv_to_rgb(h_val, s_val, v_val)
                        r, g, b = int(rf * 255), int(gf * 255), int(bf * 255)
                # Subtle VGA contrast & brightness boost so hull details pop on dark space
                r = max(16, min(255, int((r - 108) * 1.14 + 118)))
                g = max(16, min(255, int((g - 108) * 1.14 + 118)))
                b = max(16, min(255, int((b - 108) * 1.14 + 118)))
                cpx[x, y] = (r, g, b, 255)

    return cleaned


def build_ship_atlas_from_wcunity(
    folder: str, prefix: str, out_name: str, cell_size: int = 64, hue_shift: float = 0.0, sat_mult: float = 1.0
):
    """Pack 17x32 WCUnity ship sheets into a single 16x5 (80-view) atlas with cell_size x cell_size frames."""
    atlas_w = len(YAW_STEPS) * cell_size
    atlas_h = len(PITCH_SHEETS) * cell_size
    atlas = Image.new("RGBA", (atlas_w, atlas_h), (0, 0, 0, 0))

    ship_dir = os.path.join(WCUNITY_ART, "Ships", folder)
    for row_idx, sheet_num in enumerate(PITCH_SHEETS):
        sheet_path = os.path.join(ship_dir, f"{prefix}{sheet_num}.png")
        if not os.path.exists(sheet_path):
            print(f"  [WARN] Missing {sheet_path}")
            continue
        sheet_img = Image.open(sheet_path).convert("RGBA")
        sw, sh = sheet_img.size
        src_cw = sw // 8
        src_ch = sh // 4

        for col_idx, yaw in enumerate(YAW_STEPS):
            sc = yaw % 8
            sr = yaw // 8
            crop_box = (sc * src_cw, sr * src_ch, (sc + 1) * src_cw, (sr + 1) * src_ch)
            frame = sheet_img.crop(crop_box)
            frame_resized = clean_downscale_ship_cell(frame, cell_size, hue_shift=hue_shift, sat_mult=sat_mult)
            atlas.paste(frame_resized, (col_idx * cell_size, row_idx * cell_size))

    out_path = os.path.join(SHIPS_OUT, f"{out_name}.png")
    save_optimized_png(atlas, out_path, colors=256)
    size_kb = os.path.getsize(out_path) / 1024
    print(f"  [OK] Ship atlas {out_name}.png ({atlas_w}x{atlas_h}, cell={cell_size}) -> {size_kb:.1f} KB")


# ==============================================================================
# 3D SOFTWARE RASTERIZER FOR CUSTOM PIXEL-ART SHIPS (2x SUPERSAMPLED)
# ==============================================================================

BAYER_4X4 = [
    [0,  8,  2, 10],
    [12, 4, 14,  6],
    [3, 11,  1,  9],
    [15, 7, 13,  5],
]


def make_box_faces(x0, y0, z0, x1, y1, z1, base_color, glow=False):
    """Create 6 colored quads for an axis-aligned 3D box in ship space (+Z = bow/nose, -Y = dorsal/up)."""
    v = [
        (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),  # aft/back (z0)
        (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1),  # bow/front (z1)
    ]
    return [
        ([v[0], v[1], v[2], v[3]], (0, 0, -1), base_color, glow),  # aft/back
        ([v[5], v[4], v[7], v[6]], (0, 0,  1), base_color, glow),  # bow/front
        ([v[4], v[0], v[3], v[7]], (-1, 0, 0), base_color, glow),  # port/left
        ([v[1], v[5], v[6], v[2]], (1,  0, 0), base_color, glow),  # starboard/right
        ([v[3], v[2], v[6], v[7]], (0, -1, 0), base_color, glow),  # dorsal/top (Y- is up in screen)
        ([v[4], v[5], v[1], v[0]], (0,  1, 0), base_color, glow),  # ventral/bottom
    ]


def make_wedge_faces(x0, y0, z0, x1, y1, z1, taper_x, taper_y, base_color, glow=False):
    """Create a tapered 3D fuselage/wing/prow wedge where the +Z front end tapers by (taper_x, taper_y)."""
    fx0 = x0 * taper_x
    fx1 = x1 * taper_x
    fy0 = y0 * taper_y
    fy1 = y1 * taper_y
    v = [
        (x0,  y0,  z0), (x1,  y0,  z0), (x1,  y1,  z0), (x0,  y1,  z0),  # aft
        (fx0, fy0, z1), (fx1, fy0, z1), (fx1, fy1, z1), (fx0, fy1, z1),  # tapered bow
    ]
    return [
        ([v[0], v[1], v[2], v[3]], (0, 0, -1), base_color, glow),
        ([v[5], v[4], v[7], v[6]], (0, 0,  1), base_color, glow),
        ([v[4], v[0], v[3], v[7]], (-0.9, 0, 0.4), base_color, glow),
        ([v[1], v[5], v[6], v[2]], (0.9,  0, 0.4), base_color, glow),
        ([v[3], v[2], v[6], v[7]], (0, -0.9, 0.4), base_color, glow),
        ([v[4], v[5], v[1], v[0]], (0,  0.9, 0.4), base_color, glow),
    ]


def render_3d_ship_frame(faces, theta, phi, cell_size, scale):
    """
    Render a 3D mesh at spherical camera angles (theta = yaw, phi = pitch)
    matching WCUnity's exact orientation:
      theta = 0      -> Front/Bow (+Z facing camera)
      theta = PI/2   -> Starboard (+X facing camera, +Z nose pointing right)
      theta = PI     -> Rear/Stern (-Z engines facing camera)
      theta = 3*PI/2 -> Port (-X facing camera, +Z nose pointing left)
    Renders at 3x supersampled resolution with clean VGA shading (no muddy black outline).
    """
    ss = cell_size * 3
    ss_scale = scale * 3.0
    img = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx = ss / 2.0
    cy = ss / 2.0

    cos_t = math.cos(theta)
    sin_t = math.sin(theta)
    cos_p = math.cos(phi)
    sin_p = math.sin(phi)

    def xform(pt):
        x, y, z = pt
        # Yaw rotation matching WCUnity: theta=0 looks at +Z, theta=PI/2 puts +Z to the right (+rx)
        rx = -x * cos_t + z * sin_t
        rz =  x * sin_t + z * cos_t
        # Pitch rotation around screen X
        ry =  y * cos_p - rz * sin_p
        rz2 = y * sin_p + rz * cos_p
        return (rx, ry, rz2)

    light_dir = (-0.38, -0.65, 0.66)  # Top-left-front key light
    fill_dir = (0.45, 0.50, -0.45)    # Secondary bounce light so undersides never turn black

    transformed_faces = []
    for verts, norm, col, glow in faces:
        tverts = [xform(v) for v in verts]
        tnorm = xform(norm)
        avg_z = sum(v[2] for v in tverts) / len(tverts)
        if tnorm[2] < -0.55 and not glow:
            continue
        transformed_faces.append((avg_z, tverts, tnorm, col, glow))

    transformed_faces.sort(key=lambda item: item[0])

    for avg_z, tverts, tnorm, col, glow in transformed_faces:
        pts_2d = []
        for vx, vy, vz in tverts:
            persp = 1.0 / max(0.55, (2.25 - vz * 0.42))
            sx = cx + vx * ss_scale * persp
            sy = cy + vy * ss_scale * persp
            pts_2d.append((sx, sy))

        if glow:
            fill_col = (*col, 255)
            outline_col = (min(255, col[0] + 55), min(255, col[1] + 55), min(255, col[2] + 55), 255)
        else:
            dot = max(0.0, tnorm[0] * light_dir[0] + tnorm[1] * light_dir[1] + tnorm[2] * light_dir[2])
            bounce = max(0.0, tnorm[0] * fill_dir[0] + tnorm[1] * fill_dir[1] + tnorm[2] * fill_dir[2]) * 0.25
            rim = max(0.0, 1.0 - abs(tnorm[2])) * 0.18
            shade = 0.46 + 0.68 * dot + bounce + rim
            r = max(20, min(255, int(col[0] * shade)))
            g = max(20, min(255, int(col[1] * shade)))
            b = max(20, min(255, int(col[2] * shade)))
            fill_col = (r, g, b, 255)
            outline_col = (max(18, int(r * 0.72)), max(18, int(g * 0.74)), max(22, int(b * 0.78)), 255)

        draw.polygon(pts_2d, fill=fill_col, outline=outline_col)

    # Downscale 3x -> 1x with LANCZOS filter + subtle VGA quantization (no destructive black border!)
    small = img.resize((cell_size, cell_size), Image.Resampling.LANCZOS)
    px = small.load()
    out = Image.new("RGBA", (cell_size, cell_size), (0, 0, 0, 0))
    opx = out.load()
    for y in range(cell_size):
        for x in range(cell_size):
            r, g, b, a = px[x, y]
            if a >= 72:
                if a < 245:
                    sc = 255.0 / a
                    r, g, b = min(255, int(r * sc)), min(255, int(g * sc)), min(255, int(b * sc))
                bayer = (BAYER_4X4[y & 3][x & 3] - 7.5) * 0.85
                nr = max(18, min(255, int((r + bayer) // 4) * 4))
                ng = max(18, min(255, int((g + bayer) // 4) * 4))
                nb = max(20, min(255, int((b + bayer) // 4) * 4))
                opx[x, y] = (nr, ng, nb, 255)

    return out


def render_custom_atlas(faces, out_name: str, cell_size: int, scale_mult: float = 0.96):
    atlas_w = len(YAW_STEPS) * cell_size
    atlas_h = len(PITCH_SHEETS) * cell_size
    atlas = Image.new("RGBA", (atlas_w, atlas_h), (0, 0, 0, 0))

    pitch_interval = math.pi / 16.0
    yaw_step = (2.0 * math.pi) / 16.0
    for row_idx, sheet_num in enumerate(PITCH_SHEETS):
        phi = (8 - sheet_num) * pitch_interval  # sheet 8 = 0 deg equator
        # Boost slightly on equator row (row 2) so side profiles have thick, readable hulls
        row_scale = scale_mult * (1.06 if row_idx == 2 else 0.96)
        for col_idx in range(16):
            theta = col_idx * yaw_step  # col 0 = 0 deg front, col 4 = 90 deg, col 8 = 180 deg rear
            frame = render_3d_ship_frame(faces, theta, phi, cell_size, scale=cell_size * row_scale)
            atlas.paste(frame, (col_idx * cell_size, row_idx * cell_size))

    out_path = os.path.join(SHIPS_OUT, f"{out_name}.png")
    save_optimized_png(atlas, out_path, colors=256)
    print(f"  [OK] Custom 3D Atlas {out_name}.png ({atlas_w}x{atlas_h}) -> {os.path.getsize(out_path)/1024:.1f} KB")


def build_fax_traegodie_atlas(cell_size: int = 96):
    """TCS Fax-Tragödie (Tiger's Claw / Confederation Fleet Carrier with Thru-Deck Hangar & Fax-Radar Island)."""
    faces = []
    # Main armored central carrier hull (thickened vertically so equator profile is bold and unmistakable)
    faces += make_box_faces(-0.38, -0.22, -0.98,  0.38,  0.24,  0.84, (112, 128, 150))
    # Tapered Tiger's Claw Hammerhead Bow & Twin Catapult Prongs
    faces += make_wedge_faces(-0.48, -0.18,  0.70,  0.48,  0.18,  1.15, 0.78, 0.72, (130, 146, 168))
    faces += make_box_faces(-0.34, -0.08,  1.06, -0.10,  0.08,  1.18, (60, 230, 255), glow=True)
    faces += make_box_faces( 0.10, -0.08,  1.06,  0.34,  0.08,  1.18, (60, 230, 255), glow=True)
    # Port & Starboard Heavy Sponson Flight Pods
    faces += make_box_faces(-0.68, -0.12, -0.84, -0.34,  0.20,  0.74, (92, 108, 132))
    faces += make_box_faces( 0.34, -0.12, -0.84,  0.68,  0.20,  0.74, (92, 108, 132))
    # Confederation Blue & Gold Squadron Pennant Stripes along Sponsons
    faces += make_box_faces(-0.70, -0.04, -0.64, -0.65,  0.10,  0.60, (55, 130, 230))
    faces += make_box_faces( 0.65, -0.04, -0.64,  0.70,  0.10,  0.60, (55, 130, 230))
    faces += make_box_faces(-0.71,  0.00,  0.12, -0.64,  0.08,  0.54, (245, 200, 55))
    faces += make_box_faces( 0.64,  0.00,  0.12,  0.71,  0.08,  0.54, (245, 200, 55))
    # Dorsal Flight Deck Runway & Yellow Centerline
    faces += make_box_faces(-0.30, -0.26, -0.90,  0.22, -0.20,  0.92, (68, 80, 96))
    faces += make_box_faces(-0.07, -0.28, -0.80,  0.03, -0.24,  0.86, (245, 205, 55))
    # Starboard Conning Tower Island + Command Bridge + Rotating Fax-Dish Array
    faces += make_box_faces( 0.14, -0.52, -0.44,  0.48, -0.20,  0.28, (124, 140, 162))
    faces += make_box_faces( 0.18, -0.66, -0.28,  0.44, -0.50,  0.18, (144, 160, 182))
    faces += make_box_faces( 0.16, -0.62,  0.12,  0.46, -0.52,  0.22, (120, 245, 255), glow=True)
    faces += make_box_faces( 0.26, -0.80, -0.12,  0.36, -0.64,  0.02, (175, 188, 205))
    faces += make_box_faces( 0.14, -0.85, -0.10,  0.48, -0.72,  0.04, (230, 240, 255))
    # Ventral Sensor Keel & Turret Batteries
    faces += make_box_faces(-0.28,  0.22, -0.64,  0.28,  0.38,  0.44, (80, 94, 114))
    # Aft Green Landing Bay Tractor Corridor & Quad Heavy Plasma Thrusters
    faces += make_box_faces(-0.28, -0.13, -1.04,  0.28,  0.13, -0.94, (50, 255, 145), glow=True)
    faces += make_box_faces(-0.62, -0.06, -1.02, -0.36,  0.14, -0.90, (85, 205, 255), glow=True)
    faces += make_box_faces( 0.36, -0.06, -1.02,  0.62,  0.14, -0.90, (85, 205, 255), glow=True)

    render_custom_atlas(faces, "fax_traegodie", cell_size, scale_mult=0.92)


def build_freighter_atlas(cell_size: int = 64):
    """Kiste 47 / Tarsus / Dorkir Modular Cargo Freighter."""
    faces = []
    # Heavy industrial spine & dorsal truss (taller profile so side/equator views are chunky & detailed)
    faces += make_box_faces(-0.34, -0.28, -0.90,  0.34,  0.28,  0.78, (132, 126, 116))
    # Tapered Armored Freighter Head & Amber Greenhouse Canopy
    faces += make_wedge_faces(-0.32, -0.24,  0.68,  0.32,  0.22,  1.12, 0.74, 0.74, (154, 144, 130))
    faces += make_box_faces(-0.24, -0.18,  0.94,  0.24,  0.04,  1.13, (255, 205, 65), glow=True)
    # 4 External Modular ISO Cargo Containers (Orange Fore, Olive/Teal Aft)
    faces += make_box_faces(-0.72, -0.24,  0.04, -0.30,  0.24,  0.66, (225, 145, 55))
    faces += make_box_faces( 0.30, -0.24,  0.04,  0.72,  0.24,  0.66, (225, 145, 55))
    faces += make_box_faces(-0.72, -0.24, -0.68, -0.30,  0.24, -0.04, (108, 148, 104))
    faces += make_box_faces( 0.30, -0.24, -0.68,  0.72,  0.24, -0.04, (108, 148, 104))
    # Dorsal Cargo Crane / Radar Mast & Ventral Landing Skids
    faces += make_box_faces(-0.12, -0.46, -0.28,  0.12, -0.26,  0.28, (168, 168, 178))
    faces += make_box_faces(-0.54,  0.24, -0.60, -0.38,  0.38,  0.60, (92, 96, 106))
    faces += make_box_faces( 0.38,  0.24, -0.60,  0.54,  0.38,  0.60, (92, 96, 106))
    # Twin Heavy Industrial Thrusters at Stern
    faces += make_box_faces(-0.48, -0.18, -0.98, -0.12,  0.18, -0.82, (255, 165, 50), glow=True)
    faces += make_box_faces( 0.12, -0.18, -0.98,  0.48,  0.18, -0.82, (255, 165, 50), glow=True)

    render_custom_atlas(faces, "freighter", cell_size, scale_mult=0.96)


def build_hermes_carrier_atlas(cell_size: int = 96):
    """TCS HERMES (Der Alte Agentenschwarm — AI/Robot Trimaran Carrier)."""
    faces = []
    # Central Neural Spine
    faces += make_box_faces(-0.30, -0.22, -0.96,  0.30,  0.22,  0.90, (64, 80, 112))
    faces += make_wedge_faces(-0.26, -0.16,  0.84,  0.26,  0.16,  1.16, 0.50, 0.55, (108, 140, 184))
    faces += make_box_faces(-0.12, -0.08,  1.08,  0.12,  0.08,  1.18, (0, 255, 255), glow=True)
    # Glowing Cyan Neural Bus along Dorsal Spine
    faces += make_box_faces(-0.16, -0.25, -0.66,  0.16, -0.19,  0.66, (0, 240, 255), glow=True)
    # Port & Starboard Autonomous Drone-Swarm Catamaran Hulls (Worker & Reviewer Docks)
    faces += make_wedge_faces(-0.74, -0.18, -0.84, -0.34,  0.20,  0.84, 0.82, 0.78, (84, 104, 140))
    faces += make_wedge_faces( 0.34, -0.18, -0.84,  0.74,  0.20,  0.84, 0.82, 0.78, (84, 104, 140))
    # Swept Pylon Bridges connecting Spine & Catamaran Pods
    faces += make_box_faces(-0.40, -0.10, -0.54,  0.40,  0.10,  0.54, (104, 126, 164))
    # Glowing Violet/Cyan Swarm Launch Strips
    faces += make_box_faces(-0.62, -0.20, -0.66, -0.46, -0.14,  0.66, (205, 105, 255), glow=True)
    faces += make_box_faces( 0.46, -0.20, -0.66,  0.62, -0.14,  0.66, (205, 105, 255), glow=True)
    # Supervisor AI Citadel Tower (Dorsal Ring-Bridge)
    faces += make_box_faces(-0.24, -0.56, -0.42,  0.24, -0.20,  0.26, (96, 118, 156))
    faces += make_box_faces(-0.18, -0.60,  0.06,  0.18, -0.30,  0.28, (0, 255, 225), glow=True)
    # Aft Quad Ion Thrusters
    faces += make_box_faces(-0.66, -0.12, -0.92, -0.40,  0.14, -0.78, (0, 225, 255), glow=True)
    faces += make_box_faces( 0.40, -0.12, -0.92,  0.66,  0.14, -0.78, (0, 225, 255), glow=True)
    faces += make_box_faces(-0.22, -0.14, -1.04,  0.22,  0.14, -0.92, (160, 250, 255), glow=True)

    render_custom_atlas(faces, "hermes_carrier", cell_size, scale_mult=0.92)


def build_hermes_drone_atlas(cell_size: int = 64):
    """KIWI-Mk.IV (Hermes AI Swarm Interceptor — built via Cyber-Cyan/Violet palette shift of Howard Day's Strakha!)."""
    build_ship_atlas_from_wcunity("Strakha", "HowieStrakhaAce", "hermes_drone", cell_size=cell_size, hue_shift=0.48, sat_mult=1.35)


# ==============================================================================
# COCKPIT & WEAPON-FLASH LIGHTMAP BUILDER (DIVISIBLE BY 2: 340x220)
# ==============================================================================

def create_gun_flash_overlay(front_img: Image.Image, mask_img: Image.Image, tint_rgb=(255, 95, 45)) -> Image.Image:
    """
    Convert WCUnity's opaque-black grayscale *_LeftGun / *_RightGun lightmap mask
    into a true transparent RGBA overlay illuminated by weapon fire (like CockpitFlash.cs shader).
    """
    w, h = front_img.size
    fpx = front_img.load()
    mpx = mask_img.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()

    tr, tg, tb = tint_rgb
    for y in range(h):
        for x in range(w):
            mr, mg, mb, ma = mpx[x, y]
            lum = max(mr, mg, mb)
            if lum <= 6:
                continue
            fr, fg, fb, fa = fpx[x, y]
            intensity = min(1.0, (lum / 255.0) * 1.45)
            if fa > 20:
                # Illuminate cockpit strut/frame/instrument pixel with weapon color
                nr = min(255, int(fr * 0.45 + tr * intensity * 0.95 + lum * 0.35))
                ng = min(255, int(fg * 0.45 + tg * intensity * 0.95 + lum * 0.25))
                nb = min(255, int(fb * 0.45 + tb * intensity * 0.95 + lum * 0.25))
                na = min(255, int(lum * 1.55))
                opx[x, y] = (nr, ng, nb, na)
            else:
                # Subtle canopy glass muzzle glow outside frame
                na = min(135, int(lum * 0.65))
                if na > 10:
                    opx[x, y] = (tr, tg, tb, na)
    return out


def create_synthetic_gun_flash(front_img: Image.Image, side: str, tint_rgb=(255, 95, 45)) -> Image.Image:
    """Generate a procedural LeftGun / RightGun cockpit flash overlay for custom cockpits."""
    w, h = front_img.size
    mask = Image.new("RGBA", (w, h), (0, 0, 0, 255))
    mp = mask.load()
    # Muzzle light originates from lower-left (x=48, y=126) or lower-right (x=w-48, y=126)
    src_x = 52 if side == "left" else (w - 52)
    src_y = 122
    for y in range(h):
        for x in range(w):
            dx = (x - src_x) / (w * 0.52)
            dy = (y - src_y) / (h * 0.62)
            dist = math.hypot(dx, dy)
            if dist < 1.0:
                val = int(((1.0 - dist) ** 1.7) * 235)
                mp[x, y] = (val, val, val, 255)
    return create_gun_flash_overlay(front_img, mask, tint_rgb)


def create_synthetic_damaged_cockpit(front_img: Image.Image) -> Image.Image:
    """Create a damaged variant for custom cockpits by compositing WCUnity ScreenDamage + scorched struts."""
    out = front_img.copy()
    draw = ImageDraw.Draw(out)
    # Cracked VDU glass and scorched metal marks
    dmg_path = os.path.join(WCUNITY_ART, "Cockpits", "DamageMarks", "ScreenDamage01.png")
    if os.path.exists(dmg_path):
        dmg = Image.open(dmg_path).convert("RGBA").resize((76, 56), Image.Resampling.NEAREST)
        out.alpha_composite(dmg, (20, 138))
    # Canopy stress cracks
    crack_col = (190, 230, 255, 195)
    draw.line([(68, 38), (86, 52), (78, 70), (96, 82)], fill=crack_col, width=1)
    draw.line([(86, 52), (104, 46)], fill=crack_col, width=1)
    draw.line([(268, 44), (250, 60), (258, 78)], fill=crack_col, width=1)
    return out


def build_cockpits():
    """
    Downscale all 6 WCUnity cockpits to 340x220 (exact /2 of 680x440),
    convert their LeftGun/RightGun masks into true transparent RGBA colored weapon-flash layers,
    and build 3 custom cockpits (Scimitar, Freighter, Hermes) with full Front/Damaged/LeftGun/RightGun layers!
    """
    cockpit_map = {
        "hornet":  ("Hornet",  "Hornet_Cockpit_Front",  (255, 95, 45)),   # Terran warm laser red-orange
        "valtar":  ("Valtar",  "Valtar_Cockpit_Front",  (255, 110, 50)),  # Terran neutron/laser orange
        "dralthi": ("Dralthi", "Dralthi_Cockpit_Front", (90, 255, 110)),  # Kilrathi green plasma flash
        "krant":   ("Krant",   "Krant_Cockpit_Front",   (90, 255, 110)),
        "salthi":  ("Salthi",  "Salthi_Cockpit_Front",  (90, 255, 110)),
        "strakha": ("Strakha", "Strakha_Cockpit_Front", (130, 220, 255)),
    }

    for key, (folder, base_name, tint) in cockpit_map.items():
        cdir = os.path.join(WCUNITY_ART, "Cockpits", folder)
        front_src = os.path.join(cdir, f"{base_name}.png")
        if not os.path.exists(front_src):
            continue
        front_half = Image.open(front_src).convert("RGBA").resize((340, 220), Image.Resampling.NEAREST)
        save_optimized_png(front_half, os.path.join(COCKPITS_OUT, f"{key}_front.png"), colors=256)

        dmg_src = os.path.join(cdir, f"{base_name}_Damaged.png")
        if os.path.exists(dmg_src):
            dmg_half = Image.open(dmg_src).convert("RGBA").resize((340, 220), Image.Resampling.NEAREST)
            save_optimized_png(dmg_half, os.path.join(COCKPITS_OUT, f"{key}_damaged.png"), colors=256)

        for gun_key, suffix in [("left_gun", "LeftGun"), ("right_gun", "RightGun")]:
            gun_src = os.path.join(cdir, f"{base_name}_{suffix}.png")
            if os.path.exists(gun_src):
                gun_mask = Image.open(gun_src).convert("RGBA").resize((340, 220), Image.Resampling.NEAREST)
                flash_rgba = create_gun_flash_overlay(front_half, gun_mask, tint_rgb=tint)
                save_optimized_png(flash_rgba, os.path.join(COCKPITS_OUT, f"{key}_{gun_key}.png"), colors=192)
        print(f"  [OK] Cockpit {key} (front/damaged/RGBA-left_gun/RGBA-right_gun) -> 340x220")

    # Build Custom Cockpit 7: SCIMITAR Heavy Fighter Cockpit
    hornet_front = Image.open(os.path.join(COCKPITS_OUT, "hornet_front.png")).convert("RGBA")
    scimitar_front = hornet_front.copy()
    sdraw = ImageDraw.Draw(scimitar_front)
    sdraw.polygon([(0, 0), (340, 0), (340, 34), (275, 22), (65, 22), (0, 34)], fill=(42, 48, 58, 255), outline=(24, 28, 36, 255))
    sdraw.line([(65, 22), (88, 134)], fill=(52, 60, 72, 255), width=6)
    sdraw.line([(275, 22), (252, 134)], fill=(52, 60, 72, 255), width=6)
    sdraw.line([(65, 22), (88, 134)], fill=(86, 98, 114, 255), width=2)
    sdraw.line([(275, 22), (252, 134)], fill=(86, 98, 114, 255), width=2)
    sdraw.rectangle([105, 128, 235, 136], fill=(55, 68, 52, 255), outline=(30, 38, 28, 255))
    save_optimized_png(scimitar_front, os.path.join(COCKPITS_OUT, "scimitar_front.png"))
    save_optimized_png(create_synthetic_damaged_cockpit(scimitar_front), os.path.join(COCKPITS_OUT, "scimitar_damaged.png"))
    save_optimized_png(create_synthetic_gun_flash(scimitar_front, "left", (255, 120, 40)), os.path.join(COCKPITS_OUT, "scimitar_left_gun.png"), colors=192)
    save_optimized_png(create_synthetic_gun_flash(scimitar_front, "right", (255, 120, 40)), os.path.join(COCKPITS_OUT, "scimitar_right_gun.png"), colors=192)

    # Build Custom Cockpit 8: FREIGHTER ("Kiste 47" / Privateer Tarsus Industrial Cockpit)
    freighter_front = hornet_front.copy()
    r, g, b, a = freighter_front.split()
    r = ImageEnhance.Brightness(r).enhance(1.12)
    b = ImageEnhance.Brightness(b).enhance(0.82)
    freighter_front = Image.merge("RGBA", (r, g, b, a))
    fdraw = ImageDraw.Draw(freighter_front)
    fdraw.polygon([(0, 0), (340, 0), (340, 28), (0, 28)], fill=(58, 48, 38, 255), outline=(32, 26, 20, 255))
    fdraw.rectangle([118, 4, 222, 22], fill=(18, 24, 18, 255), outline=(110, 95, 70, 255))
    for px_x in (42, 292):
        fdraw.rectangle([px_x, 28, px_x + 8, 136], fill=(68, 58, 46, 255), outline=(32, 26, 20, 255))
        for hy in range(36, 130, 12):
            fdraw.rectangle([px_x + 1, hy, px_x + 7, hy + 5], fill=(210, 165, 35, 255))
    save_optimized_png(freighter_front, os.path.join(COCKPITS_OUT, "freighter_front.png"))
    save_optimized_png(create_synthetic_damaged_cockpit(freighter_front), os.path.join(COCKPITS_OUT, "freighter_damaged.png"))
    save_optimized_png(create_synthetic_gun_flash(freighter_front, "left", (255, 160, 45)), os.path.join(COCKPITS_OUT, "freighter_left_gun.png"), colors=192)
    save_optimized_png(create_synthetic_gun_flash(freighter_front, "right", (255, 160, 45)), os.path.join(COCKPITS_OUT, "freighter_right_gun.png"), colors=192)

    # Build Custom Cockpit 9: HERMES AI-SWARM CYBER-COCKPIT ("KIWI-Mk.IV" Neural Drone Cockpit)
    valtar_front = Image.open(os.path.join(COCKPITS_OUT, "valtar_front.png")).convert("RGBA")
    hermes_front = valtar_front.copy()
    hr, hg, hb, ha = hermes_front.split()
    hr = ImageEnhance.Brightness(hr).enhance(0.68)
    hg = ImageEnhance.Brightness(hg).enhance(1.08)
    hb = ImageEnhance.Brightness(hb).enhance(1.38)
    hermes_front = Image.merge("RGBA", (hr, hg, hb, ha))
    hdraw = ImageDraw.Draw(hermes_front)
    hdraw.polygon([(0, 0), (340, 0), (340, 24), (260, 12), (80, 12), (0, 24)], fill=(20, 28, 44, 255), outline=(0, 220, 255, 255))
    hdraw.rectangle([126, 2, 214, 11], fill=(8, 16, 28, 255), outline=(170, 90, 255, 255))
    for lx in range(132, 210, 8):
        hdraw.rectangle([lx, 4, lx + 4, 9], fill=(0, 240, 255, 255) if (lx // 8) % 2 == 0 else (190, 90, 255, 255))
    hdraw.line([(80, 12), (52, 134)], fill=(28, 40, 62, 255), width=5)
    hdraw.line([(260, 12), (288, 134)], fill=(28, 40, 62, 255), width=5)
    hdraw.line([(80, 12), (52, 134)], fill=(0, 220, 255, 255), width=1)
    hdraw.line([(260, 12), (288, 134)], fill=(0, 220, 255, 255), width=1)
    save_optimized_png(hermes_front, os.path.join(COCKPITS_OUT, "hermes_front.png"))
    save_optimized_png(create_synthetic_damaged_cockpit(hermes_front), os.path.join(COCKPITS_OUT, "hermes_damaged.png"))
    save_optimized_png(create_synthetic_gun_flash(hermes_front, "left", (0, 235, 255)), os.path.join(COCKPITS_OUT, "hermes_left_gun.png"), colors=192)
    save_optimized_png(create_synthetic_gun_flash(hermes_front, "right", (0, 235, 255)), os.path.join(COCKPITS_OUT, "hermes_right_gun.png"), colors=192)
    print("  [OK] Custom Cockpits scimitar, freighter & hermes (with damaged + RGBA gun lightmaps) -> 340x220")


def convert_additive_to_rgba(img: Image.Image) -> Image.Image:
    """Convert an additive black-background VFX sprite into a true transparent RGBA sprite."""
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            lum = max(r, g, b)
            if a < 250:
                opx[x, y] = (r, g, b, a)
            elif lum > 10:
                opx[x, y] = (r, g, b, min(255, int(lum * 1.25)))
    return out


def build_pilot_and_vfx():
    """Pack pilot hands/joystick (Terran & Kilrathi), throttle, reticles, brackets, debris/asteroids, nav lights, shield hits, and explosion strip."""
    pilots_dir = os.path.join(WCUNITY_ART, "Cockpits", "Pilots")
    for src_name, out_name, size in [
        ("Terran_Joystick.png", "terran_joystick.png", (512, 512)),
        ("Terran_JoystickFire.png", "terran_joystick_fire.png", (512, 512)),
        ("Terran_Throttle.png", "terran_throttle.png", (512, 256)),
        ("Kilrathi_Joystick.png", "kilrathi_joystick.png", (512, 512)),
        ("Kilrathi_JoystickFire.png", "kilrathi_joystick_fire.png", (512, 512)),
    ]:
        src = os.path.join(pilots_dir, src_name)
        if os.path.exists(src):
            img = Image.open(src).convert("RGBA").resize(size, Image.Resampling.NEAREST)
            save_optimized_png(img, os.path.join(COCKPITS_OUT, out_name), colors=128)
            print(f"  [OK] Pilot control sheet {out_name} -> {size}")

    # UI reticles, brackets & MFD icons
    ui_dir = os.path.join(WCUNITY_ART, "Cockpits", "UI")
    for fname in [
        "Reticle_Hornet.png", "Reticle_Dralthi.png", "Reticle_Valtar.png", "Reticle_Salthi.png",
        "Human_Bracket_Default.png", "Human_Bracket_Lock.png", "Human_Bracket_Sel.png",
        "Kilrathi_Bracket_Default.png", "Kilrathi_Bracket_Lock.png",
        "MFDIcons_01.png", "RadarBlips_01.png",
    ]:
        src = os.path.join(ui_dir, fname)
        if os.path.exists(src):
            img = Image.open(src).convert("RGBA")
            save_optimized_png(img, os.path.join(VFX_OUT, fname.lower()), colors=128)

    # Pack Space Debris / Asteroids, Nav Lights, Shield Impacts, Engine Flares & Weapon Bolts from WCUnity
    vfx_dir = os.path.join(WCUNITY_ART, "VFX")
    weapons_dir = os.path.join(WCUNITY_ART, "Weapons")
    extra_vfx = [
        (vfx_dir, "Debris01.png", "debris01.png", (64, 64), False),
        (vfx_dir, "Debris02.png", "debris02.png", (64, 64), False),
        (vfx_dir, "NavLight_01.png", "nav_light.png", (48, 48), True),
        (vfx_dir, "ImpactShield_01.png", "shield_impact.png", (64, 64), True),
        (vfx_dir, "EngineFlare_01.png", "engine_flare.png", (48, 48), True),
        (vfx_dir, "EngineFlare_AB.png", "engine_flare_ab.png", (48, 48), True),
        (vfx_dir, "Glow_01.png", "glow_orb.png", (64, 64), True),
        (weapons_dir, "MuzzleFlash_01.png", "muzzle_flash.png", (48, 48), True),
        (weapons_dir, "PhotonBlast_01.png", "photon_blast.png", (32, 32), True),
        (weapons_dir, "MesonBolt_01.png", "meson_bolt.png", (32, 32), True),
    ]
    for folder, src_name, out_name, sz, is_additive in extra_vfx:
        src = os.path.join(folder, src_name)
        if os.path.exists(src):
            im = Image.open(src).convert("RGBA").resize(sz, Image.Resampling.BOX)
            if is_additive:
                im = convert_additive_to_rgba(im)
            save_optimized_png(im, os.path.join(VFX_OUT, out_name), colors=128)
            print(f"  [OK] Extra VFX {out_name} -> {sz}")

    # Pack 16-frame Explosion Strip (64x64 per frame -> 1024x64)
    exp_strip = Image.new("RGBA", (16 * 64, 64), (0, 0, 0, 0))
    for i in range(16):
        frame_num = min(20, int(1 + i * (19 / 15)))
        src = os.path.join(vfx_dir, f"Explode_{frame_num:04d}.png")
        if os.path.exists(src):
            fimg = Image.open(src).convert("RGBA").resize((64, 64), Image.Resampling.BOX)
            exp_strip.paste(fimg, (i * 64, 0))
    save_optimized_png(exp_strip, os.path.join(VFX_OUT, "explode_strip.png"), colors=256)
    print("  [OK] VFX explode_strip.png (1024x64, 16 frames of 64x64)")


def main():
    print("=== Building Solo Wing 1990 Compact Multi-Angle Assets (v2.0) ===")
    ships = [
        ("Hornet",   "ArneHornet",    "hornet",     64),
        ("Hornet",   "ArneHornetAce", "hornet_ace", 64),
        ("Scimitar", "HowieScimitar", "scimitar",   64),
        ("Valtar",   "HowieFirekkan", "valtar",     64),
        ("Talon",    "HowieTalonA",   "talon",      64),
        ("Dralthi",  "HowieDralthi",  "dralthi",    64),
        ("Salthi",   "HowieSalthi",   "salthi",     64),
        ("Krant",    "HowieKrant",    "krant",      64),
        ("Strakha",  "HowieStrakha",  "strakha",    64),
        ("Grikath",  "HowieGrikath",  "grikath",    96),
    ]
    for folder, prefix, out_name, cell_size in ships:
        build_ship_atlas_from_wcunity(folder, prefix, out_name, cell_size)

    build_fax_traegodie_atlas(cell_size=96)
    build_hermes_carrier_atlas(cell_size=96)
    build_hermes_drone_atlas(cell_size=64)
    build_freighter_atlas(cell_size=64)
    build_cockpits()
    build_pilot_and_vfx()

    total_bytes = 0
    for root, _, files in os.walk(OUT_DIR):
        for f in files:
            total_bytes += os.path.getsize(os.path.join(root, f))
    print(f"=== DONE! Total generated asset footprint: {total_bytes / (1024*1024):.2f} MB ===")


if __name__ == "__main__":
    main()
