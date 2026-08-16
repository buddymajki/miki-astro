#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Miki-Astro Dashboard - lokalis webszerver.

Inditaskor beszipkazza az uj fajlokat a DONE mappabol, majd megnyitja
a bongeszot. Csak a 127.0.0.1 cimen figyel, kifele nem latszik.

Hasznalat:
    python serve.py                 # szkennel, indul, bongeszot nyit
    python serve.py --port 9000
    python serve.py --no-open       # ne nyisson bongeszot
    python serve.py --no-scan       # ne szkenneljen indulaskor
"""

import argparse
import json
import mimetypes
import os
import re
import subprocess
import sys
import threading
import urllib.parse
import webbrowser
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import scan as scanner

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.dirname(os.path.abspath(__file__))
OPENABLE_EXT = scanner.IMAGE_EXT | scanner.VIDEO_EXT

mimetypes.add_type("video/mp4", ".mp4")
mimetypes.add_type("video/webm", ".webm")
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("application/javascript", ".js")

_scan_lock = threading.Lock()


def safe_media_path(raw):
    """A kapott relativ utvonalat a media mappara korlatozza."""
    if not raw:
        return None
    candidate = os.path.normpath(os.path.join(ROOT, urllib.parse.unquote(raw)))
    try:
        base = os.path.realpath(scanner.MEDIA_DIR)
        real = os.path.realpath(candidate)
    except OSError:
        return None
    if os.path.commonpath([base, real]) != base:
        return None
    if not os.path.isfile(real):
        return None
    if os.path.splitext(real)[1].lower() not in OPENABLE_EXT:
        return None
    return real


class Handler(SimpleHTTPRequestHandler):
    server_version = "MikiAstro/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    # -- naplo: csak a lenyeg ---------------------------------------------
    def log_message(self, fmt, *args):
        if self.path.startswith("/api/"):
            sys.stderr.write("  api %s\n" % self.path)

    def end_headers(self):
        # a bebyegek es az eredeti fajlok tartalma nem valtozik (a nevukben van a hash),
        # a kod es a manifeszt viszont mindig frissuljon
        path = urllib.parse.urlparse(self.path).path
        if path.startswith("/thumbs/"):
            self.send_header("Cache-Control", "public, max-age=604800, immutable")
        else:
            self.send_header("Cache-Control", "no-cache")
        if path.startswith("/DONE/") and self.__dict__.get("_ranged") is not True:
            self.send_header("Accept-Ranges", "bytes")     # videok tekeresehez
        super().end_headers()

    # -- API ---------------------------------------------------------------
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith("/api/"):
            return self.handle_api(parsed)
        return super().do_GET()

    def do_HEAD(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith("/api/"):
            return self.send_json({"ok": True})
        return super().do_HEAD()

    def send_json(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_api(self, parsed):
        route = parsed.path[len("/api/"):]
        query = urllib.parse.parse_qs(parsed.query)

        if route == "rescan":
            if not _scan_lock.acquire(blocking=False):
                return self.send_json({"ok": False, "error": "Mar fut egy szkenneles."}, HTTPStatus.CONFLICT)
            try:
                scanner.rename_pass()
                library = scanner.scan(quiet=True)
                return self.send_json({"ok": True, "stats": library["stats"],
                                       "generated": library["generated"]})
            except Exception as exc:
                return self.send_json({"ok": False, "error": str(exc)},
                                      HTTPStatus.INTERNAL_SERVER_ERROR)
            finally:
                _scan_lock.release()

        if route in ("open", "reveal"):
            target = safe_media_path((query.get("p") or [""])[0])
            if not target:
                return self.send_json({"ok": False, "error": "Ismeretlen fajl."},
                                      HTTPStatus.BAD_REQUEST)
            try:
                if route == "open":
                    os.startfile(target)                        # noqa: S606 (Windows)
                else:
                    subprocess.Popen(["explorer", "/select,", target])
                return self.send_json({"ok": True})
            except Exception as exc:
                return self.send_json({"ok": False, "error": str(exc)},
                                      HTTPStatus.INTERNAL_SERVER_ERROR)

        return self.send_json({"ok": False, "error": "Ismeretlen vegpont."},
                              HTTPStatus.NOT_FOUND)

    # -- Range tamogatas (a videok tekerhetosegehez) ------------------------
    def send_head(self):
        range_header = self.headers.get("Range")
        if not range_header:
            return super().send_head()

        path = self.translate_path(self.path)
        if os.path.isdir(path) or not os.path.isfile(path):
            return super().send_head()

        match = re.match(r"bytes=(\d*)-(\d*)$", range_header.strip())
        if not match:
            return super().send_head()

        size = os.path.getsize(path)
        start_raw, end_raw = match.groups()
        if start_raw:
            start = int(start_raw)
            end = int(end_raw) if end_raw else size - 1
        else:                                   # "bytes=-500" = utolso 500 bajt
            if not end_raw:
                return super().send_head()
            start = max(0, size - int(end_raw))
            end = size - 1
        end = min(end, size - 1)

        if start >= size or start > end:
            self.send_response(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None

        try:
            handle = open(path, "rb")
        except OSError:
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return None

        handle.seek(start)
        self._ranged = True
        self.send_response(HTTPStatus.PARTIAL_CONTENT)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        return _RangeReader(handle, end - start + 1)


class _RangeReader:
    """Csak a kert bajtokat adja vissza a copyfile()-nak."""

    def __init__(self, handle, remaining):
        self.handle = handle
        self.remaining = remaining

    def read(self, amount=-1):
        if self.remaining <= 0:
            return b""
        if amount is None or amount < 0:
            amount = self.remaining
        chunk = self.handle.read(min(amount, self.remaining))
        self.remaining -= len(chunk)
        return chunk

    def close(self):
        self.handle.close()


def main():
    parser = argparse.ArgumentParser(description="Miki-Astro Dashboard szerver")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--no-open", action="store_true")
    parser.add_argument("--no-scan", action="store_true")
    args = parser.parse_args()

    if not args.no_scan:
        print("Konyvtar beolvasasa...")
        try:
            scanner.rename_pass()
            library = scanner.scan(quiet=False)
            s = library["stats"]
            print(f"  {s['objects']} objektum, {s['files']} fajl, "
                  f"{scanner.human_bytes(s['bytes'])}")
        except Exception as exc:
            print(f"  ! a szkenneles nem sikerult: {exc}")

    port = args.port
    server = None
    for attempt in range(20):
        try:
            server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
            break
        except OSError:
            port += 1
    if server is None:
        print("HIBA: nem talaltam szabad portot.")
        return 1

    url = f"http://127.0.0.1:{port}/"
    print(f"\n  Miki-Astro Dashboard fut:  {url}")
    print("  Leallitas: Ctrl+C\n")
    if not args.no_open:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nLeallitva.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
