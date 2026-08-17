#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Miki-Astro - ertesites kuldese uj felvetelekrol.

A publish.bat hivja a sikeres feltoltes utan. Osszehasonlitja az albumot az
elozo ertesitesnel rogzitett allapottal, es csak akkor kuld uzenetet, ha
tenylegesen kerult fel uj kep.

A beallitas a data/notify.json fajlban van (nem kerul fel a GitHubra, mert a
tema nevet ismerve barki kuldhetne uzenetet a csaladnak).

Hasznalat:
    python notify.py            # ertesit, ha van uj
    python notify.py --test     # probauzenet, allapot valtoztatasa nelkul
    python notify.py --reset    # a jelenlegi allapot rogzitese ertesites nelkul
"""

import io
import json
import os
import sys
import urllib.error
import urllib.request

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data")
CONFIG = os.path.join(DATA, "notify.json")
STATE = os.path.join(DATA, ".notify-state.json")


def load_json(path, default=None):
    try:
        with io.open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return default


def object_names(lang="hu"):
    """Objektum-azonosito -> megjelenitett nev."""
    db = load_json(os.path.join(DATA, "objects.json"), {}) or {}
    out = {}
    for o in db.get("objects", []):
        name = o.get("name")
        out[o["id"]] = name.get(lang) or name.get("en") if isinstance(name, dict) else name
    return out


def current_files():
    """{fajlut: objektum-azonosito} az aktualis albumbol."""
    lib = load_json(os.path.join(DATA, "library.json"))
    if not lib:
        print("  ! nincs data/library.json - eloszor futtasd a scan.py-t")
        return None
    return {it["file"]: o["id"] for o in lib.get("objects", []) for it in o.get("items", [])}


def build_message(new_files, mapping, names):
    """Rovid, emberi uzenet: hany kep, mely objektumokhoz."""
    per_object = {}
    for f in new_files:
        oid = mapping.get(f, "?")
        per_object[oid] = per_object.get(oid, 0) + 1

    parts = []
    for oid, count in sorted(per_object.items(), key=lambda kv: -kv[1]):
        label = names.get(oid, oid)
        parts.append(f"{label} ({count})" if count > 1 else label)

    n = len(new_files)
    head = f"{n} új felvétel" if n > 1 else "Új felvétel"
    return head + ": " + ", ".join(parts)


def send(cfg, title, message):
    topic = cfg.get("topic")
    if not topic:
        print("  ! nincs 'topic' a data/notify.json fajlban")
        return False
    req = urllib.request.Request(
        cfg.get("server", "https://ntfy.sh").rstrip("/") + "/" + topic,
        data=message.encode("utf-8"),
        headers={
            "Title": title.encode("utf-8"),
            "Tags": cfg.get("tags", "telescope"),
            "Click": cfg.get("site", ""),
            "Priority": cfg.get("priority", "default"),
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status == 200
    except urllib.error.URLError as exc:
        print(f"  ! az ertesites nem ment el: {exc}")
        return False


def main():
    cfg = load_json(CONFIG)
    if not cfg:
        print("  (nincs data/notify.json - ertesites kikapcsolva)")
        return 0
    if not cfg.get("enabled", True):
        print("  (az ertesites ki van kapcsolva a data/notify.json fajlban)")
        return 0

    mapping = current_files()
    if mapping is None:
        return 1
    files = set(mapping)

    if "--reset" in sys.argv:
        json.dump(sorted(files), io.open(STATE, "w", encoding="utf-8"))
        print(f"  allapot rogzitve ({len(files)} felvetel), ertesites nelkul.")
        return 0

    if "--test" in sys.argv:
        ok = send(cfg, cfg.get("title", "Miki-Astro"),
                  "Próbaüzenet – az értesítés működik.")
        print("  probauzenet elkuldve." if ok else "  a probauzenet nem ment el.")
        return 0 if ok else 1

    previous = load_json(STATE)
    if not isinstance(previous, list):
        # elso futas: a jelenlegi album a kiindulopont, nem ertesitunk
        json.dump(sorted(files), io.open(STATE, "w", encoding="utf-8"))
        print(f"  elso futas - {len(files)} felvetel rogzitve kiindulopontkent.")
        return 0

    new_files = sorted(files - set(previous))
    if not new_files:
        print("  nincs uj felvetel - ertesites nem megy.")
        json.dump(sorted(files), io.open(STATE, "w", encoding="utf-8"))
        return 0

    message = build_message(new_files, mapping, object_names(cfg.get("lang", "hu")))
    print(f"  ertesites: {message}")
    if send(cfg, cfg.get("title", "Miki-Astro"), message):
        json.dump(sorted(files), io.open(STATE, "w", encoding="utf-8"))
        print("  elkuldve.")
        return 0
    print("  az allapot valtozatlan marad, a kovetkezo publikalasnal ujraprobalja.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
