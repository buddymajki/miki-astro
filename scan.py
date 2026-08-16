#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Miki-Astro Dashboard - konyvtar szkenner.

Mit csinal:
  1. Vegigjarja a DONE mappat (rekurzivan).
  2. Szabvanyosítja a fajlneveket (szokoz -> _, "NGC_6960" -> "NGC6960",
     "IC 1318" -> "IC1318", ekezetek es furcsa karakterek eltavolitasa).
  3. Objektumonkent csoportosit a fajlnev elso tagja alapjan.
  4. Bebyegeket (thumbnail) es kozepes meretu elonezeteket general,
     hogy a bongeszo ne a 160 MB-os eredetiket toltse be.
  5. Kiirja a data/library.json + data/library.js manifesztet.

Hasznalat:
    python scan.py                # teljes szkennelés + atnevezes
    python scan.py --dry-run      # csak megmutatja, mit csinalna
    python scan.py --no-rename    # atnevezes nelkul
    python scan.py --force        # minden bebyeget ujragener
"""

import argparse
import base64
import colorsys
import glob
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from datetime import datetime

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.dirname(os.path.abspath(__file__))
MEDIA_DIR = os.path.join(ROOT, "DONE")
THUMB_DIR = os.path.join(ROOT, "thumbs")
DATA_DIR = os.path.join(ROOT, "data")
RENAME_LOG = os.path.join(DATA_DIR, "rename-log.txt")

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp", ".bmp", ".gif"}
VIDEO_EXT = {".mp4", ".mov", ".webm", ".m4v", ".avi", ".mkv"}

THUMB_W = 760          # a kartyakon lathato kis kep
PREVIEW_W = 2400       # a nezegetoben megnyilo kozepes kep
BLUR_W = 20            # base64 elmosott helykitolto

# A generalt kepek WebP-ben keszulnek: ugyanaz a minoseg ~58%-kal kisebb
# fajlban, mint JPEG-ben - igy a publikus oldal is elfer a repoban.
ASSET_EXT = ".webp"
ASSET_FORMAT = "WEBP"
ASSET_VERSION = "webp1"       # a gyorsitotar kulcsaban: formatumvaltasnal ujragenerlas
THUMB_QUALITY = 78
PREVIEW_QUALITY = 80

# Vizjel: a data/logo.png rakerul a GENERALT kepekre (bebyeg + elonezet).
# Az eredeti fajlokhoz a program soha nem nyul hozza.
LOGO_PATH = os.path.join(DATA_DIR, "logo.png")
LOGO_RATIO = 0.20      # a logo szelessege a kep szelessegehez kepest
LOGO_ALPHA = 0.78

# Egyszeri kezi javitasok elrontott fajlnevekre
MANUAL_FIXES = {
    "SUN_olar_Eclipse+Airplane.png": "SUN_Solar_Eclipse_Airplane.png",
}

# Ismert katalogusok: "NGC_6960" / "NGC 6960" / "ngc6960" -> "NGC6960"
CATALOG_RE = re.compile(
    r"^(MESSIER|CALDWELL|ABELL|SH2|SH|NGC|IC|LDN|LBN|VDB|CED|UGC|PGC|HCG|CR|MEL|M|C|B)"
    r"[\s_]*-?[\s_]*(\d+)",
    re.IGNORECASE,
)


# --------------------------------------------------------------------------
# fajlnev-szabvanyositas
# --------------------------------------------------------------------------

def deaccent(text):
    """Ekezetek levalasztasa: 'Végleges' -> 'Vegleges'."""
    decomposed = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in decomposed if not unicodedata.combining(ch))


def canonical_catalog(match):
    cat = match.group(1).upper()
    num = match.group(2).lstrip("0") or "0"
    if cat == "MESSIER":
        cat = "M"
    if cat == "CALDWELL":
        cat = "C"
    if cat in ("SH", "SH2"):
        return "SH2-" + num
    return cat + num


def normalize_name(filename):
    """Egy fajlnevbol tiszta, URL-baratsagos nevet csinal."""
    filename = MANUAL_FIXES.get(filename, filename)
    stem, ext = os.path.splitext(filename)
    ext = ext.lower()

    stem = deaccent(stem)

    m = CATALOG_RE.match(stem)
    if m:
        stem = canonical_catalog(m) + stem[m.end():]

    # minden nem alfanumerikus (a kotojelen kivul) alahuzas lesz -
    # ez rendezi a szokozoket, a '+', '~', '#' es a belso pontokat is
    stem = re.sub(r"[^A-Za-z0-9\-]+", "_", stem)
    stem = re.sub(r"_+", "_", stem).strip("_-") or "kep"
    return stem + ext


def object_key(stem):
    """Az objektum azonositoja a fajlnev elso tagjabol."""
    m = CATALOG_RE.match(stem)
    if m:
        return canonical_catalog(m)
    # katalogusjel nelkuli nevnel az alahuzas es a kotojel is hatarnak szamit,
    # igy a "MOON-100.jpg" is a MOON objektumhoz kerul
    return re.split(r"[_\-]", stem)[0].upper()


def variant_label(stem, key):
    """A fajlnev maradeka emberi cimkeve alakitva."""
    rest = stem[len(key):] if stem.upper().startswith(key) else stem
    rest = rest.strip("_-")
    rest = rest.replace("_", " ").strip()
    return rest or "eredeti"


# --------------------------------------------------------------------------
# atnevezes
# --------------------------------------------------------------------------

def unique_target(directory, wanted, source_path):
    """Utkozesmentes celnev ugyanabban a mappaban."""
    target = os.path.join(directory, wanted)
    if not os.path.exists(target) or os.path.samefile(target, source_path):
        return wanted
    stem, ext = os.path.splitext(wanted)
    i = 2
    while os.path.exists(os.path.join(directory, f"{stem}_{i}{ext}")):
        i += 1
    return f"{stem}_{i}{ext}"


def rename_pass(dry_run=False):
    """Vegigmegy a media mappan es szabvanyositja a neveket."""
    renames = []
    for dirpath, _dirnames, filenames in os.walk(MEDIA_DIR):
        for name in sorted(filenames):
            ext = os.path.splitext(name)[1].lower()
            if ext not in IMAGE_EXT and ext not in VIDEO_EXT:
                continue
            wanted = normalize_name(name)
            if wanted == name:
                continue
            src = os.path.join(dirpath, name)
            wanted = unique_target(dirpath, wanted, src)
            if wanted == name:
                continue
            dst = os.path.join(dirpath, wanted)
            renames.append((src, dst))
            if not dry_run:
                # ket lepesben, hogy a csak kis/nagybetuben eltero nevek is menjenek
                tmp = dst + ".tmp-rename"
                os.replace(src, tmp)
                os.replace(tmp, dst)

    if renames and not dry_run:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(RENAME_LOG, "a", encoding="utf-8") as fh:
            fh.write(f"\n--- {datetime.now().isoformat(timespec='seconds')} ---\n")
            for src, dst in renames:
                fh.write(f"{os.path.basename(src)}  ->  {os.path.basename(dst)}\n")
    return renames


# --------------------------------------------------------------------------
# kepfeldolgozas
# --------------------------------------------------------------------------

def load_pillow():
    from PIL import Image, ImageFile
    Image.MAX_IMAGE_PIXELS = None          # a 160 MB-os PNG-k miatt
    ImageFile.LOAD_TRUNCATED_IMAGES = True
    return Image


def to_rgb(image, Image):
    """Barmilyen szinmodbol 8 bites RGB, fekete hatterre kompozitalva."""
    if image.mode in ("I", "I;16", "I;16B", "I;16L", "F"):
        extrema = image.getextrema()
        peak = extrema[1] or 1
        scale = 255.0 / peak
        image = image.point(lambda v: v * scale).convert("L")
    if image.mode in ("RGBA", "LA", "PA", "P"):
        image = image.convert("RGBA")
        canvas = Image.new("RGBA", image.size, (0, 0, 0, 255))
        canvas.alpha_composite(image)
        image = canvas
    return image.convert("RGB")


def accent_color(image):
    """A kep hangulatat ado kiemelo szin (a legfenyesebb negyed atlaga)."""
    small = image.resize((16, 16))
    raw = small.tobytes()
    pixels = [tuple(raw[i:i + 3]) for i in range(0, len(raw), 3)]
    pixels.sort(key=lambda p: -(0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]))
    top = pixels[: max(1, len(pixels) // 4)]
    r = sum(p[0] for p in top) / len(top) / 255
    g = sum(p[1] for p in top) / len(top) / 255
    b = sum(p[2] for p in top) / len(top) / 255
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    s = min(1.0, max(s, 0.45))            # sose legyen teljesen szurke
    v = 0.78
    r, g, b = colorsys.hsv_to_rgb(h, s, v)
    return "#%02x%02x%02x" % (int(r * 255), int(g * 255), int(b * 255))


def blur_placeholder(image):
    """Pici base64 JPEG, amit a bongeszo azonnal ki tud rajzolni."""
    w, h = image.size
    small = image.resize((BLUR_W, max(1, round(BLUR_W * h / w))))
    buf = io.BytesIO()
    small.save(buf, "JPEG", quality=35)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def resize_to_width(image, width, Image):
    w, h = image.size
    if w <= width:
        return image.copy()
    return image.resize((width, max(1, round(h * width / w))), Image.LANCZOS, reducing_gap=2.0)


# --------------------------------------------------------------------------
# felveteli adatok (hany kocka, mennyi expozicio, milyen tavcso)
# --------------------------------------------------------------------------

# "931x30sec", "250x60s", "120x120sec" - a kockaszam es a kockankenti expo.
# Az egyseg KOTELEZO, kulonben a kepmeret (2160x3840) is talalatot adna.
ACQ_RE = re.compile(r"(?<![0-9])(\d{1,5})\s*[xX]\s*(\d+(?:[.,]\d+)?)\s*(ms|sec|secs|s|min|m)(?![a-z0-9])", re.I)
GAIN_RE = re.compile(r"(?:gain|g)[\s_-]?(\d{2,4})(?![0-9])", re.I)

UNIT_SECONDS = {"ms": 0.001, "s": 1, "sec": 1, "secs": 1, "m": 60, "min": 60}

# ismert szurojelolesek a fajlnevben
FILTER_TOKENS = {
    "HOO": "HOO", "SHO": "SHO", "HSO": "HSO", "LRGB": "LRGB", "RGB": "RGB",
    "HA": "Ha", "OIII": "OIII", "SII": "SII", "LP": "LP", "IRCUT": "IR-cut",
    "UHC": "UHC", "DUAL": "dual-band", "DUALBAND": "dual-band", "DUOBAND": "dual-band",
    "NB": "narrowband", "BB": "broadband",
}


def parse_acq_tokens(stem):
    """Felveteli adatok kiolvasasa egy fajlnevbol."""
    acq = {}
    m = ACQ_RE.search(stem)
    if m:
        frames = int(m.group(1))
        exposure = float(m.group(2).replace(",", ".")) * UNIT_SECONDS[m.group(3).lower()]
        if 1 <= frames <= 99999 and 0 < exposure <= 3600:
            acq["frames"] = frames
            acq["exposure"] = round(exposure, 3)
            acq["total"] = round(frames * exposure, 1)
    g = GAIN_RE.search(stem)
    if g:
        acq["gain"] = int(g.group(1))
    for token in re.split(r"[^A-Za-z0-9]+", stem):
        key = token.upper()
        if key in FILTER_TOKENS:
            acq["filter"] = FILTER_TOKENS[key]
            break
    return acq


def read_fits_header(path, blocks=12):
    """A FITS fejlec sima ASCII, 80 karakteres kartyakban - nem kell kulso konyvtar."""
    header = {}
    try:
        with open(path, "rb") as fh:
            for _ in range(blocks):
                block = fh.read(2880)
                if not block:
                    break
                for i in range(0, 2880, 80):
                    card = block[i:i + 80].decode("ascii", "replace")
                    key = card[:8].strip()
                    if key == "END":
                        return header
                    if "=" in card and key:
                        header[key] = card[10:].split("/")[0].strip().strip("'").strip()
    except OSError:
        pass
    return header


def scan_processing_fits(roots, gear):
    """A feldolgozo mappakban levo stackelt FITS-ekbol objektumonkenti felveteli adat.

    Csak azokat a fajlokat nezzuk, amiknek a NEVEBEN benne van a kockaszam
    (a stackelo igy nevezi el a kimenetet). A szarmaztatott fajlok fejleceben
    a STACKCNT osszeadodik a csatornak kozott - az felfele torzitana."""
    found = {}
    for root in roots:
        if not os.path.isdir(root):
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames
                           if os.path.abspath(os.path.join(dirpath, d)) != ROOT]
            for name in filenames:
                if not name.lower().endswith((".fit", ".fits")):
                    continue
                tokens = parse_acq_tokens(os.path.splitext(name)[0])
                if "frames" not in tokens:
                    continue
                header = read_fits_header(os.path.join(dirpath, name))
                obj = header.get("OBJECT") or os.path.splitext(name)[0]
                key = object_key(normalize_name(obj + ".x")[:-2])
                prev = found.get(key)
                if prev and prev["frames"] >= tokens["frames"]:
                    continue                       # a legtobb kockat tartalmazo a teljes stack
                acq = dict(tokens)
                live = header.get("LIVETIME")
                if live:
                    try:
                        acq["total"] = round(float(live), 1)
                    except ValueError:
                        pass
                if header.get("TELESCOP"):
                    acq["telescope"] = gear_name(header["TELESCOP"], gear)
                if header.get("FILTER") and header["FILTER"].lower() != "mixed":
                    acq["filter"] = FILTER_TOKENS.get(header["FILTER"].upper(), header["FILTER"])
                if header.get("GAIN"):
                    try:
                        acq["gain"] = int(float(header["GAIN"]))
                    except ValueError:
                        pass
                if header.get("DATE-OBS"):
                    acq["date"] = header["DATE-OBS"][:10]
                if header.get("FOCALLEN"):
                    try:
                        acq["focal"] = round(float(header["FOCALLEN"]))
                    except ValueError:
                        pass
                acq["source"] = "fits"
                found[key] = acq
    return found


def gear_name(raw, gear):
    """A nyers TELESCOP/Model erteket emberi nevre forditja."""
    raw = (raw or "").strip()
    names = (gear or {}).get("telescopeNames", {})
    for needle, pretty in names.items():
        if needle.lower() in raw.lower():
            return pretty
    return re.sub(r"_[0-9a-f]{6,}$", "", raw)       # "S30 Pro_2b9a21b2" -> "S30 Pro"


def exif_acq(path, gear, Image):
    """Egyetlen expozicio adatai a JPEG EXIF-jebol (telefon, Seestar egyedi kep)."""
    acq = {}
    try:
        from PIL import ExifTags
        with Image.open(path) as im:
            exif = im.getexif()
            if not exif:
                return acq
            data = {ExifTags.TAGS.get(k, k): v for k, v in exif.items()}
            data.update({ExifTags.TAGS.get(k, k): v
                         for k, v in exif.get_ifd(0x8769).items()})
    except Exception:
        return acq

    model = data.get("Model")
    if model:
        acq["telescope"] = gear_name(str(model), gear)
    exposure = data.get("ExposureTime")
    if exposure:
        try:
            acq["exposure"] = round(float(exposure), 4)
            acq.setdefault("frames", 1)
            acq["total"] = acq["exposure"]
        except (TypeError, ValueError):
            pass
    for src, dst, cast in (("ISOSpeedRatings", "iso", int),
                           ("FNumber", "fnumber", float),
                           ("FocalLength", "focal", float)):
        if data.get(src):
            try:
                value = cast(data[src])
                if value:
                    acq[dst] = round(value, 2) if cast is float else value
            except (TypeError, ValueError):
                pass
    taken = data.get("DateTimeOriginal")
    if taken:
        acq["date"] = str(taken)[:10].replace(":", "-")
    if acq:
        acq["source"] = "exif"
    return acq


def load_gear():
    path = os.path.join(DATA_DIR, "equipment.json")
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return {}


# --- a megfigyelesi naplobol (data/album_adatok.json) ----------------------

def load_album_sets():
    """A naplo szettjeit objektum-kulcsra kepezve adja vissza.

    Egy objektumhoz tobb szett is tartozhat (pl. NGC 6888 ket kulon eszaka-
    sorozata); a kepeket kesobb datum alapjan rendeljuk hozzajuk."""
    path = os.path.join(DATA_DIR, "album_adatok.json")
    try:
        with open(path, "r", encoding="utf-8") as fh:
            album = json.load(fh)
    except Exception:
        return {}

    sets = {}
    for rec in album.get("kepek", []):
        dates = sorted(rec.get("datumok") or [])
        # "szamitott ..." = a kockaszam integraciobol visszaszamolt, nem mert
        source = (rec.get("kockaszam_forras") or "").lower()
        estimated = source.startswith("szamitott") or "szamitott" in source

        acq = {
            "exposure": rec.get("szub_s"),
            "nights": rec.get("ejszakak"),
            "mode": rec.get("mod"),
            "drizzle": rec.get("drizzle"),
            "dates": dates,
            "estimated": estimated,
            "source": "napló" if not estimated else "napló (visszaszámolt)",
        }
        if rec.get("kocka_megtartott"):
            acq["frames"] = rec["kocka_megtartott"]
        if rec.get("kocka_nyers"):
            acq["framesRaw"] = rec["kocka_nyers"]
        if rec.get("integracio_perc"):
            acq["total"] = rec["integracio_perc"] * 60
        if rec.get("lp_szuro") is True:
            acq["filter"] = "LP dual-band"
        elif rec.get("lp_szuro") is False:
            acq["filter"] = "IR-cut (LP nélkül)"
        fwhm = (rec.get("meresek") or {}).get("FWHM_ivmasodperc")
        if fwhm:
            acq["fwhm"] = fwhm
        if rec.get("megjegyzes"):
            acq["note"] = {"hu": rec["megjegyzes"], "en": rec["megjegyzes"]}

        key = object_key(normalize_name((rec.get("id") or "") + ".x")[:-2])
        sets.setdefault(key, []).append({"last": dates[-1] if dates else "", "acq": acq})

    for key in sets:
        sets[key].sort(key=lambda s: s["last"])
    return sets


def pick_album_set(sets, key, taken):
    """Egy kephez az a szett tartozik, aminek az utolso eszakaja meg a kep
       elkeszulte elott (vagy aznap) volt - igy a tobbszettes objektumoknal is
       a helyes sorozat kerul a kephez."""
    candidates = sets.get(key)
    if not candidates:
        return {}
    day = (taken or "")[:10]
    chosen = None
    for entry in candidates:
        if entry["last"] and day and entry["last"] <= day:
            chosen = entry
    return dict((chosen or candidates[0])["acq"])


# --------------------------------------------------------------------------
# videok webes valtozata (ffmpeg, ha van)
# --------------------------------------------------------------------------

VIDEO_LONG_EDGE = 1920     # a hosszabbik oldal a webes valtozatban
VIDEO_CRF = 26             # 4K telefonos felvetelnel ~86%-ot sporol
_ffmpeg = None


def find_ffmpeg():
    """ffmpeg a PATH-on, vagy a winget telepitesi helyen (uj shell nelkul is)."""
    global _ffmpeg
    if _ffmpeg is not None:
        return _ffmpeg or None

    found = shutil.which("ffmpeg")
    if not found:
        pattern = os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "WinGet",
                               "Packages", "Gyan.FFmpeg*", "*", "bin", "ffmpeg.exe")
        matches = sorted(glob.glob(pattern))
        found = matches[-1] if matches else ""
    _ffmpeg = found or False
    return _ffmpeg or None


def run_ffmpeg(args):
    exe = find_ffmpeg()
    if not exe:
        return False
    try:
        proc = subprocess.run([exe, "-y", "-v", "error", *args],
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=1800)
        return proc.returncode == 0
    except Exception:
        return False


def transcode_video(src, dst):
    """Webre optimalizalt valtozat: hosszabbik oldal 1920 px, hang nelkul.
       A +faststart miatt azonnal indul a lejatszas letoltes kozben."""
    scale = (f"scale=w={VIDEO_LONG_EDGE}:h={VIDEO_LONG_EDGE}"
             ":force_original_aspect_ratio=decrease:force_divisible_by=2")
    return run_ffmpeg(["-i", src, "-vf", scale, "-c:v", "libx264", "-crf", str(VIDEO_CRF),
                       "-preset", "medium", "-pix_fmt", "yuv420p",
                       "-movflags", "+faststart", "-an", dst])


def grab_video_frame(src, dst_png, seconds=1.5):
    """Egy kocka a videobol - ebbol keszul a boritokep (vizjellel egyutt)."""
    return run_ffmpeg(["-ss", str(seconds), "-i", src, "-frames:v", "1", dst_png])


_logo = None


def load_logo(Image):
    """A logot egyszer toltjuk be; False = nincs logo."""
    global _logo
    if _logo is None:
        try:
            _logo = Image.open(LOGO_PATH).convert("RGBA")
        except Exception:
            _logo = False
    return _logo or None


def logo_signature():
    """A bebyeg-gyorsitotar kulcsaba is bekerul, hogy logocsere ujragenerlast valtson ki."""
    try:
        st = os.stat(LOGO_PATH)
        return f"{int(st.st_mtime)}-{st.st_size}-{LOGO_RATIO}-{LOGO_ALPHA}"
    except OSError:
        return "nologo"


def stamp_logo(image, Image):
    """Vizjel a jobb also sarokba, lagy fenykoszoruval, hogy sotet egen is olvashato legyen."""
    from PIL import ImageFilter

    logo = load_logo(Image)
    if logo is None:
        return image

    w, h = image.size
    tw = max(90, int(w * LOGO_RATIO))
    th = max(1, round(logo.height * tw / logo.width))
    if th > h * 0.14:                       # nagyon alacsony kepnel ne nojon tul
        th = max(1, int(h * 0.14))
        tw = max(1, round(logo.width * th / logo.height))
    mark = logo.resize((tw, th), Image.LANCZOS)

    alpha = mark.getchannel("A").point(lambda v: int(v * LOGO_ALPHA))
    mark.putalpha(alpha)

    margin = max(10, int(w * 0.022))
    pos = (w - tw - margin, h - th - margin)

    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    # fenykoszoru: a logo sziluettje elmosva, hogy a sotetkek reszek is elvaljanak
    halo_alpha = Image.new("L", (w, h), 0)
    halo_alpha.paste(alpha, pos)
    halo_alpha = halo_alpha.filter(ImageFilter.GaussianBlur(max(2, tw // 40)))
    halo_alpha = halo_alpha.point(lambda v: min(255, int(v * 1.5)))
    halo = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    halo.putalpha(halo_alpha.point(lambda v: int(v * 0.34)))
    layer = Image.alpha_composite(layer, halo)
    layer.paste(mark, pos, mark)

    return Image.alpha_composite(image.convert("RGBA"), layer).convert("RGB")


def build_thumbs(src, thumb_path, preview_path, Image):
    """Visszaadja: (szelesseg, magassag, accent, blur) vagy None hiba eseten."""
    with Image.open(src) as raw:
        raw.load()
        image = to_rgb(raw, Image)

    width, height = image.size
    accent = accent_color(image)            # a vizjel elott, hogy ne befolyasolja
    blur = blur_placeholder(image)

    preview = resize_to_width(image, PREVIEW_W, Image)
    thumb = resize_to_width(preview, THUMB_W, Image)   # meg vizjel nelkul, hogy ne duplazodjon

    stamp_logo(preview, Image).save(preview_path, ASSET_FORMAT, quality=PREVIEW_QUALITY, method=5)
    stamp_logo(thumb, Image).save(thumb_path, ASSET_FORMAT, quality=THUMB_QUALITY, method=5)

    return width, height, accent, blur


# --------------------------------------------------------------------------
# szkennelés
# --------------------------------------------------------------------------

def media_files():
    out = []
    for dirpath, _dirnames, filenames in os.walk(MEDIA_DIR):
        for name in sorted(filenames, key=str.lower):
            ext = os.path.splitext(name)[1].lower()
            if ext in IMAGE_EXT or ext in VIDEO_EXT:
                out.append(os.path.join(dirpath, name))
    return out


def rel_url(path):
    return os.path.relpath(path, ROOT).replace("\\", "/")


def scan(force=False, quiet=False):
    Image = load_pillow()
    os.makedirs(THUMB_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)

    cache_path = os.path.join(DATA_DIR, ".thumb-cache.json")
    cache = {}
    if os.path.exists(cache_path) and not force:
        try:
            with open(cache_path, "r", encoding="utf-8") as fh:
                cache = json.load(fh)
        except Exception:
            cache = {}

    logo_sig = logo_signature()
    if load_logo(Image) is None:
        print(f"  (nincs {os.path.basename(LOGO_PATH)} a data mappaban - vizjel nelkul)")

    gear = load_gear()
    album_sets = load_album_sets()
    if album_sets and not quiet:
        print(f"  megfigyelesi naplo: {sum(len(v) for v in album_sets.values())} szett "
              f"{len(album_sets)} objektumhoz")
    roots = gear.get("processingRoots") or [os.path.dirname(ROOT)]
    roots = [r if os.path.isabs(r) else os.path.join(ROOT, r) for r in roots]
    fits_acq = scan_processing_fits(roots, gear)
    if fits_acq and not quiet:
        for key, acq in sorted(fits_acq.items()):
            print(f"  felveteli adat ({key}): {acq['frames']}x{acq['exposure']:g}s "
                  f"= {acq['total'] / 3600:.1f} ora")

    groups = {}
    new_cache = {}
    keep_thumbs = set()
    total_bytes = 0
    n_images = n_videos = 0

    files = media_files()
    for index, path in enumerate(files, 1):
        name = os.path.basename(path)
        stem, ext = os.path.splitext(name)
        ext = ext.lower()
        stat = os.stat(path)
        rel = rel_url(path)
        key = object_key(stem)
        is_video = ext in VIDEO_EXT
        total_bytes += stat.st_size

        signature = f"{rel}|{int(stat.st_mtime)}|{stat.st_size}|{logo_sig}|{ASSET_VERSION}"
        digest = hashlib.md5(signature.encode("utf-8")).hexdigest()[:16]
        thumb_name = digest + "_t" + ASSET_EXT
        preview_name = digest + "_p" + ASSET_EXT
        thumb_path = os.path.join(THUMB_DIR, thumb_name)
        preview_path = os.path.join(THUMB_DIR, preview_name)

        item = {
            "file": rel,
            "name": name,
            "label": variant_label(stem, key),
            "kind": "video" if is_video else "image",
            "bytes": stat.st_size,
            "mtime": datetime.fromtimestamp(stat.st_mtime).isoformat(timespec="minutes"),
        }

        # Felveteli adatok. Sorrend: FITS -> EXIF -> naplo -> fajlnev -> kezi.
        # Ami kesobb jon, az nyer.
        acq = dict(fits_acq.get(key, {}))
        if not is_video:
            acq.update({k: v for k, v in exif_acq(path, gear, Image).items() if v not in (None, "")})
        acq.update({k: v for k, v in
                    pick_album_set(album_sets, key, item["mtime"]).items() if v not in (None, "")})
        tokens = parse_acq_tokens(stem)
        if tokens:
            acq.update(tokens)
            if "frames" in tokens:
                acq["source"] = "filename"
        acq.update((gear.get("byObject") or {}).get(key, {}))
        acq.update((gear.get("byFile") or {}).get(name, {}))
        if acq.get("frames") and acq.get("exposure") and not acq.get("total"):
            acq["total"] = round(acq["frames"] * acq["exposure"], 1)
        if acq:
            item["acq"] = acq

        if is_video:
            n_videos += 1
            item["accent"] = "#7c8cff"
            web_name = digest + "_v.mp4"
            web_path = os.path.join(THUMB_DIR, web_name)
            cached = cache.get(signature)

            if cached and os.path.exists(web_path) and not force:
                meta = cached
            elif find_ffmpeg():
                if not quiet:
                    print(f"  [{index}/{len(files)}] video atkodolas: {name}")
                meta = None
                if transcode_video(path, web_path):
                    meta = {"webBytes": os.path.getsize(web_path)}
                    frame = os.path.join(THUMB_DIR, digest + "_frame.png")
                    if grab_video_frame(path, frame):
                        try:
                            width, height, accent, blur = build_thumbs(
                                frame, thumb_path, preview_path, Image)
                            meta.update({"w": width, "h": height, "accent": accent, "blur": blur})
                        except Exception as exc:
                            print(f"  ! boritokep nem keszult: {name} ({exc})")
                        finally:
                            try:
                                os.remove(frame)
                            except OSError:
                                pass
                else:
                    print(f"  ! a video atkodolasa nem sikerult: {name}")
            else:
                meta = None                       # nincs ffmpeg -> marad helyi

            if meta:
                new_cache[signature] = meta
                keep_thumbs.add(web_name)
                item["web"] = f"thumbs/{web_name}"
                item["webBytes"] = meta.get("webBytes")
                for key_name in ("w", "h", "accent", "blur"):
                    if meta.get(key_name):
                        item[key_name] = meta[key_name]
                if meta.get("w"):
                    keep_thumbs.update((thumb_name, preview_name))
                    item["thumb"] = f"thumbs/{thumb_name}"
                    item["preview"] = f"thumbs/{preview_name}"
            else:
                # ffmpeg nelkul a videot nem tudjuk webre keszíteni - marad helyi
                item["localOnly"] = True
        else:
            n_images += 1
            cached = cache.get(signature)
            have_files = os.path.exists(thumb_path) and os.path.exists(preview_path)
            if cached and have_files and not force:
                meta = cached
            else:
                if not quiet:
                    print(f"  [{index}/{len(files)}] bebyeg keszul: {name}")
                try:
                    width, height, accent, blur = build_thumbs(
                        path, thumb_path, preview_path, Image
                    )
                    meta = {"w": width, "h": height, "accent": accent, "blur": blur}
                except Exception as exc:                       # serult / ismeretlen kep
                    print(f"  ! nem sikerult feldolgozni: {name} ({exc})")
                    meta = None

            if meta:
                new_cache[signature] = meta
                keep_thumbs.update((thumb_name, preview_name))
                item.update(meta)
                item["thumb"] = f"thumbs/{thumb_name}"
                item["preview"] = f"thumbs/{preview_name}"

        groups.setdefault(key, []).append(item)

    # elavult bebyegek takaritasa
    removed = 0
    for name in os.listdir(THUMB_DIR):
        if name.endswith((".jpg", ".jpeg", ".webp", ".mp4", ".png")) and name not in keep_thumbs:
            try:
                os.remove(os.path.join(THUMB_DIR, name))
                removed += 1
            except OSError:
                pass

    with open(cache_path, "w", encoding="utf-8") as fh:
        json.dump(new_cache, fh)

    objects = []
    for key, items in groups.items():
        items.sort(key=lambda it: (it["kind"] == "video", it["name"].lower()))
        cover = next(
            (it for it in items if it.get("thumb")),
            items[0] if items else None,
        )
        objects.append({
            "id": key,
            "count": len(items),
            "bytes": sum(it["bytes"] for it in items),
            "latest": max(it["mtime"] for it in items),
            "cover": (cover or {}).get("thumb"),
            "accent": (cover or {}).get("accent", "#6ea8ff"),
            "blur": (cover or {}).get("blur"),
            "items": items,
        })
    objects.sort(key=lambda o: o["id"])

    library = {
        "generated": datetime.now().isoformat(timespec="seconds"),
        "mediaDir": os.path.basename(MEDIA_DIR),
        "stats": {
            "objects": len(objects),
            "files": len(files),
            "images": n_images,
            "videos": n_videos,
            "bytes": total_bytes,
        },
        "objects": objects,
    }

    payload = json.dumps(library, ensure_ascii=False, indent=1)
    with open(os.path.join(DATA_DIR, "library.json"), "w", encoding="utf-8") as fh:
        fh.write(payload)
    # ez teszi lehetove, hogy az index.html sima dupla kattintassal (file://) is menjen
    with open(os.path.join(DATA_DIR, "library.js"), "w", encoding="utf-8") as fh:
        fh.write("window.MIKI_LIBRARY = " + payload + ";\n")
    mirror_objects_js()

    library["_removedThumbs"] = removed
    return library


def mirror_objects_js():
    """A kezzel szerkesztett objects.json-t atmasolja JS valtozatba,
    hogy a dashboard file:// alol (dupla kattintassal) is lassa."""
    src = os.path.join(DATA_DIR, "objects.json")
    if not os.path.exists(src):
        return
    try:
        with open(src, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    except Exception as exc:
        print(f"  ! a data/objects.json nem olvashato: {exc}")
        return
    with open(os.path.join(DATA_DIR, "objects.js"), "w", encoding="utf-8") as fh:
        fh.write("window.MIKI_OBJECTS = " + json.dumps(data, ensure_ascii=False) + ";\n")


def human_bytes(n):
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if n < 1024 or unit == "TB":
            return f"{n:.1f} {unit}" if unit != "B" else f"{n} B"
        n /= 1024


def main():
    parser = argparse.ArgumentParser(description="Miki-Astro konyvtar szkenner")
    parser.add_argument("--dry-run", action="store_true", help="csak mutatja az atnevezeseket")
    parser.add_argument("--no-rename", action="store_true", help="ne nevezze at a fajlokat")
    parser.add_argument("--force", action="store_true", help="minden bebyeg ujragenerelasa")
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    if not os.path.isdir(MEDIA_DIR):
        print(f"HIBA: nincs meg a media mappa: {MEDIA_DIR}")
        return 1

    if not args.no_rename:
        renames = rename_pass(dry_run=args.dry_run)
        if renames:
            print(f"Fajlnev-szabvanyositas ({len(renames)} db):")
            for src, dst in renames:
                print(f"   {os.path.basename(src)}  ->  {os.path.basename(dst)}")
        else:
            print("Fajlnevek: minden rendben, nincs atnevezendo.")

    if args.dry_run:
        print("(--dry-run: bebyegek nem keszultek)")
        return 0

    lib = scan(force=args.force, quiet=args.quiet)
    s = lib["stats"]
    print(
        f"Kesz: {s['objects']} objektum, {s['files']} fajl "
        f"({s['images']} kep, {s['videos']} video), {human_bytes(s['bytes'])}."
    )
    if lib.get("_removedThumbs"):
        print(f"Elavult bebyegek torolve: {lib['_removedThumbs']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
