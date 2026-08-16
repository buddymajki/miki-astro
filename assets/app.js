/* ==========================================================================
   Miki-Astro Dashboard
   Vanilla JS, build nélkül. Az adatokat a scan.py generálja.
   ========================================================================== */

(() => {
"use strict";

const SERVED = location.protocol === "http:" || location.protocol === "https:";

/* Helyben fut (serve.py) vagy publikált statikus oldal? A helyi szerveren van
   /api/ping; a GitHub Pages-en nincs, ott elrejtjük a helyi funkciókat. */
let IS_LOCAL = false;

async function detectLocal() {
  if (!SERVED) return false;
  try {
    const res = await fetch("api/ping", { cache: "no-store" });
    if (!res.ok) return false;
    return (await res.json()).local === true;
  } catch (_) {
    return false;
  }
}

/* --- nyelvek / i18n ------------------------------------------------------ */

const STRINGS = {
  hu: {
    searchPh: "Keresés objektumra…",
    all: "Mind", deepsky: "Mély-ég", solar: "Naprendszer", atmosphere: "Légkör", other: "Egyéb",
    objects: "Objektumok", overview: "Áttekintés", object: "Objektum",
    back: "Vissza", rescan: "Újraolvasás",
    sortName: "Név szerint", sortCount: "Felvételszám", sortLatest: "Legfrissebb", sortSize: "Adatmennyiség",
    footObjects: "objektum", footShots: "felvétel", footData: "nyersanyag", footScanned: "Beolvasva",

    heroTitle: "Az én univerzumom",
    heroText: "Kattints egy objektumra a képekért.",
    details: "Részletek, adatok, Wikipédia",
    count: "db", noResults: "Nincs találat", noResultsSub: "Próbálj másik keresőszót vagy szűrőt.",
    searchFor: "a(z) „%s” keresésre",

    whatIsIt: "Miről van szó", wikiLive: "Wikipédia – élő összefoglaló",
    highlights: "Érdekességek", data: "Adatok", myStuff: "Az én anyagom",
    extLinks: "Külső hivatkozások", related: "Kapcsolódó",
    noProfile: "Nincs adatlap",
    noProfileText: "Ez az objektum még nincs benne a data/objects.json fájlban. " +
                   "Vedd fel oda \"id\": \"%s\" kulccsal, és itt megjelennek az adatai.",

    fType: "Típus", fConst: "Csillagkép", fDist: "Távolság", fMag: "Fényesség",
    fSize: "Látszó méret", fRaDec: "RA / Dec", fDisc: "Felfedezés", fSeason: "Láthatóság",
    fShots: "Felvételek", fBytes: "Adatmennyiség", fLatest: "Legutóbbi",
    fIndex: "Sorszám", fRes: "Felbontás", fTaken: "Dátum", fAll: "Az albumban",

    acquisition: "Felvételi adatok",
    aFrames: "Képkockák", aTotal: "Összes expozíció", aFilter: "Szűrő", aGain: "Gain",
    aScope: "Távcső / kamera", aFocal: "Fókusztáv", aAperture: "Rekesz", aIso: "ISO",
    aDate: "Rögzítve", aSingle: "egyetlen expozíció",
    aKept: "Nyers → megtartott", aNights: "Éjszakák", aMode: "Mechanika",
    aDrizzle: "Drizzle", aFwhm: "FWHM", aSource: "Adat forrása",
    estimated: "becsült", estimatedWhy: "A kockaszám az integrációs időből visszaszámolt – az eldobott kockákat nem tartalmazza.",
    hUnit: "ó", mUnit: "p", nightUnit: "éj",

    wikiFail: "Most nem sikerült elérni a Wikipédiát (nincs net, vagy nincs szócikk ehhez az objektumhoz).",
    source: "Forrás", wikiHu: "magyar Wikipédia", wikiEn: "angol Wikipédia",

    modePhoto: "Kép", modeInfo: "Infó", modeCompare: "Hasonlítás",
    original: "Eredeti", folder: "Mappa",
    mine: "Az én felvételem", noRef: "Ehhez az objektumhoz nincs összehasonlító kép.",
    proLoading: "Profi felvétel betöltése…",
    proFail: "A profi felvétel nem tölthető be (nincs internet?).",
    credit: "Forrás", viewOnCommons: "Megnyitás a Wikimedia Commons-on",
    kindHubble: "Hubble űrtávcső", kindPro: "Profi obszervatórium", kindAmateur: "Referenciakép",

    hintImage: "Görgetés / kattintás = nagyítás · húzás = mozgatás · ← → = lapozás",
    hintVideo: "Videó – az eredeti fájl játszik le",
    previewNote: "előnézet – az „Eredeti” a teljes felbontás",
    thisShot: "Ez a felvétel",

    rescanOk: "Kész: %s objektum, %s felvétel.",
    rescanFail: "Az újraolvasás nem sikerült: ",
    serverDown: "A szerver nem válaszol.",
    needServer: "Ehhez a start.bat-tal kell indítani a dashboardot.",
    emptyTitle: "Még nincs beolvasott felvétel",
    emptyText: "Indítsd a dashboardot a start.bat fájllal, vagy futtasd a python scan.py parancsot.",
  },
  en: {
    searchPh: "Search objects…",
    all: "All", deepsky: "Deep sky", solar: "Solar system", atmosphere: "Atmosphere", other: "Other",
    objects: "Objects", overview: "Overview", object: "Object",
    back: "Back", rescan: "Rescan",
    sortName: "By name", sortCount: "Shot count", sortLatest: "Newest", sortSize: "Data size",
    footObjects: "objects", footShots: "shots", footData: "of imagery", footScanned: "Scanned",

    heroTitle: "My universe",
    heroText: "Click an object to see the photos.",
    details: "Details, data, Wikipedia",
    count: "", noResults: "No matches", noResultsSub: "Try a different search term or filter.",
    searchFor: "for “%s”",

    whatIsIt: "What it is", wikiLive: "Wikipedia – live summary",
    highlights: "Highlights", data: "Data", myStuff: "My imagery",
    extLinks: "External links", related: "Related",
    noProfile: "No profile yet",
    noProfileText: "This object is not in data/objects.json yet. Add it there with " +
                   "\"id\": \"%s\" and its details will show up here.",

    fType: "Type", fConst: "Constellation", fDist: "Distance", fMag: "Magnitude",
    fSize: "Apparent size", fRaDec: "RA / Dec", fDisc: "Discovery", fSeason: "Visibility",
    fShots: "Shots", fBytes: "Data size", fLatest: "Latest",
    fIndex: "Image", fRes: "Resolution", fTaken: "Date", fAll: "In the album",

    acquisition: "Acquisition",
    aFrames: "Frames", aTotal: "Total integration", aFilter: "Filter", aGain: "Gain",
    aScope: "Telescope / camera", aFocal: "Focal length", aAperture: "Aperture", aIso: "ISO",
    aDate: "Captured", aSingle: "single exposure",
    aKept: "Raw → kept", aNights: "Nights", aMode: "Mount mode",
    aDrizzle: "Drizzle", aFwhm: "FWHM", aSource: "Data source",
    estimated: "estimated", estimatedWhy: "Frame count reconstructed from integration time – it does not account for discarded frames.",
    hUnit: "h", mUnit: "m", nightUnit: "night(s)",

    wikiFail: "Could not reach Wikipedia right now (no connection, or no article for this object).",
    source: "Source", wikiHu: "Hungarian Wikipedia", wikiEn: "English Wikipedia",

    modePhoto: "Photo", modeInfo: "Info", modeCompare: "Compare",
    original: "Original", folder: "Folder",
    mine: "My shot", noRef: "No comparison image available for this object.",
    proLoading: "Loading professional image…",
    proFail: "The professional image could not be loaded (no internet?).",
    credit: "Credit", viewOnCommons: "Open on Wikimedia Commons",
    kindHubble: "Hubble Space Telescope", kindPro: "Professional observatory", kindAmateur: "Reference image",

    hintImage: "Scroll / click = zoom · drag = pan · ← → = next image",
    hintVideo: "Video – playing the original file",
    previewNote: "preview – “Original” opens full resolution",
    thisShot: "This shot",

    rescanOk: "Done: %s objects, %s shots.",
    rescanFail: "Rescan failed: ",
    serverDown: "The server is not responding.",
    needServer: "Start the dashboard with start.bat to use this.",
    emptyTitle: "Nothing scanned yet",
    emptyText: "Start the dashboard with start.bat, or run python scan.py.",
  },
};

// alapból magyar; a fejlécben átváltható, és ?lang=en linkkel is kérhető
const qsLang = new URLSearchParams(location.search).get("lang");
let lang = (qsLang === "hu" || qsLang === "en") ? qsLang : localStorage.getItem("miki:lang");
if (lang !== "hu" && lang !== "en") lang = "hu";
if (qsLang === "hu" || qsLang === "en") localStorage.setItem("miki:lang", lang);

/** UI-szöveg kulcs alapján, %s helyettesítéssel. */
function t(key, ...args) {
  let s = STRINGS[lang][key] ?? STRINGS.hu[key] ?? key;
  for (const a of args) s = s.replace("%s", a);
  return s;
}

/** {hu, en} objektumból az aktuális nyelv; sima sztringet változatlanul enged át. */
function L(v) {
  if (v && typeof v === "object" && !Array.isArray(v)) return v[lang] ?? v.hu ?? v.en ?? "";
  return v ?? "";
}

const locale = () => (lang === "hu" ? "hu-HU" : "en-GB");

/* --- állapot ------------------------------------------------------------- */

const CATEGORY_KEYS = ["deepsky", "solar", "atmosphere", "other"];

const state = {
  library: null,
  db: new Map(),
  filter: "all",
  query: "",
  sort: localStorage.getItem("miki:sort") || "latest",   // alapból a legújabb elöl
  route: { view: "home", id: null, shot: null },
  renderedId: null,      // melyik oldal van jelenleg a #content-ben
};

/* --- apró segédek -------------------------------------------------------- */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const esc = (s) => String(s ?? "").replace(/[&<>"']/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Útvonal → biztonságos URL (a szegmenseket külön kódoljuk). */
const url = (p) => String(p).split("/").map(encodeURIComponent).join("/");

const icon = (name, cls = "") => `<svg class="${cls}"><use href="#i-${name}"/></svg>`;

function bytes(n) {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const v = n / Math.pow(1024, i);
  return `${v.toLocaleString(locale(), { maximumFractionDigits: i === 0 ? 0 : 1 })} ${units[i]}`;
}

function dateLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(locale(), { year: "numeric", month: "short", day: "numeric" });
}

function px(w, h) {
  return w && h ? `${w.toLocaleString(locale())} × ${h.toLocaleString(locale())} px` : "";
}

/** "NGC6888" → "NGC 6888" (Wikipédia-kereséshez, ismeretlen objektumnál). */
const spaced = (id) => String(id).replace(/^([A-Za-z]+)[-]?(\d)/, "$1 $2");

/** A dátum-időbélyeggel elnevezett felvételek címkéje olvasható alakban:
    "2026-08-09-054318" → "2026. aug. 9. 05:43". */
const STAMP_RE = /^(\d{4})-(\d{2})-(\d{2})[-_ ](\d{2})(\d{2})(\d{2})(.*)$/;

function prettyLabel(label) {
  const m = STAMP_RE.exec(String(label).trim());
  if (!m) return label;
  const when = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  if (isNaN(when)) return label;
  const shown = when.toLocaleString(locale(), {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const rest = m[7].replace(/^[-_ ]+/, "").trim();
  return rest ? `${shown} · ${rest}` : shown;
}

/** Wikimedia Commons kép adott szélességre skálázva – stabil URL-forma. */
const commonsImage = (file, width) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;

const commonsPage = (file) =>
  `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`;

/* --- felvételi adatok megjelenítése --------------------------------------- */

/** Másodperc → "7 ó 45 p". A perceket lefelé kerekítjük, hogy sose
    mutassunk több integrációs időt, mint amennyi valójában van. */
function duration(sec) {
  if (!sec || sec <= 0) return "";
  if (sec < 60) return `${Number(sec.toFixed(sec < 1 ? 2 : 0))} s`;
  const mins = Math.floor(sec / 60);
  const h = Math.floor(mins / 60), m = mins % 60;
  if (!h) return `${m} ${t("mUnit")}`;
  return m ? `${h} ${t("hUnit")} ${m} ${t("mUnit")}` : `${h} ${t("hUnit")}`;
}

function expo(sec) {
  if (!sec) return "";
  return sec < 1 ? `${Number(sec.toFixed(3))} s` : `${Number(sec.toFixed(sec % 1 ? 1 : 0))} s`;
}

/** Melyik videófájlt játsszuk le: a webre optimalizált változatot, ha van.
    Helyben az eredeti is elérhető, de a kisebb gyorsabban indul. */
function playableVideo(item) {
  return item.web || item.file;
}

/** A megjelenítendő kockaszám: megtartott, ha van, különben nyers. */
function acqFrames(acq) {
  return acq.frames || acq.framesRaw || 0;
}

/** Rövid összefoglaló a nézegető fejlécébe: "931 × 30 s · 7 ó 46 p".
    Becsült adatnál tildével, hogy sose tűnjön pontosabbnak, mint amilyen. */
function acqSummary(acq) {
  if (!acq) return "";
  const n = acqFrames(acq);
  if (n > 1 && acq.exposure) {
    const tilde = acq.estimated ? "~" : "";
    return `${tilde}${n.toLocaleString(locale())} × ${expo(acq.exposure)} · ${tilde}${duration(acq.total)}`;
  }
  return acq.exposure ? expo(acq.exposure) : "";
}

function acqRows(acq) {
  if (!acq) return "";
  const rows = [];
  const n = acqFrames(acq);
  const tilde = acq.estimated ? "~" : "";

  if (n > 1 && acq.exposure) {
    rows.push([t("aFrames"), `${tilde}${n.toLocaleString(locale())} × ${expo(acq.exposure)}`]);
    if (acq.total) rows.push([t("aTotal"), tilde + duration(acq.total)]);
    if (acq.frames && acq.framesRaw) {
      const kept = Math.round(acq.frames / acq.framesRaw * 100);
      rows.push([t("aKept"), `${acq.framesRaw.toLocaleString(locale())} → ` +
                             `${acq.frames.toLocaleString(locale())} (${kept}%)`]);
    }
  } else if (acq.exposure) {
    rows.push([t("aFrames"), `${expo(acq.exposure)} (${t("aSingle")})`]);
  }

  if (acq.nights) rows.push([t("aNights"), `${acq.nights} ${t("nightUnit")}`]);
  if (acq.filter) rows.push([t("aFilter"), acq.filter]);
  if (acq.gain) rows.push([t("aGain"), String(acq.gain)]);
  if (acq.mode) rows.push([t("aMode"), acq.mode]);
  if (acq.drizzle) rows.push([t("aDrizzle"), acq.drizzle]);
  if (acq.fwhm) rows.push([t("aFwhm"), `${acq.fwhm}″`]);
  if (acq.telescope) rows.push([t("aScope"), acq.telescope]);
  if (acq.focal) rows.push([t("aFocal"), `${Math.round(acq.focal)} mm`]);
  if (acq.fnumber) rows.push([t("aAperture"), `f/${acq.fnumber}`]);
  if (acq.iso) rows.push([t("aIso"), String(acq.iso)]);
  if (acq.date) rows.push([t("aDate"), dateLabel(acq.date)]);
  else if (acq.dates?.length) rows.push([t("aDate"), acq.dates.map(dateLabel).join(", ")]);
  if (acq.source) rows.push([t("aSource"), acq.source]);

  return rows.filter(([, v]) => v)
    .map(([k, v]) => `<div class="kv-row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
}

/** Figyelmeztető sáv a becsült adatokhoz. */
function acqEstimateNote(acq) {
  if (!acq?.estimated) return "";
  return `<p class="acq-estimated">${icon("alert")} <b>${esc(t("estimated"))}</b> – ${esc(t("estimatedWhy"))}</p>`;
}

function toast(msg, kind = "ok") {
  const node = document.createElement("div");
  node.className = `toast ${kind}`;
  node.innerHTML = `${icon(kind === "err" ? "alert" : "check")}<span>${esc(msg)}</span>`;
  $("#toasts").appendChild(node);
  setTimeout(() => {
    node.style.transition = "opacity .3s, transform .3s";
    node.style.opacity = "0";
    node.style.transform = "translateX(20px)";
    setTimeout(() => node.remove(), 320);
  }, 4200);
}

/* --- adatbetöltés -------------------------------------------------------- */

async function loadJson(path, globalFallback) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (_) { /* file:// alatt a fetch elhasal – megy a fallback */ }
  return window[globalFallback] || null;
}

async function loadAll() {
  const [library, objects] = await Promise.all([
    loadJson("data/library.json", "MIKI_LIBRARY"),
    loadJson("data/objects.json", "MIKI_OBJECTS"),
  ]);
  state.library = library || { stats: {}, objects: [] };
  state.db.clear();
  for (const o of (objects?.objects || [])) state.db.set(o.id.toUpperCase(), o);
}

/** Egyesíti a fájlrendszerből jött csoportot az adatbázis-bejegyzéssel.
    A csak helyben elérhető elemeket (videók) a publikált oldalon kihagyjuk,
    és a darabszámot is újraszámoljuk, hogy ne ígérjünk többet a valóságnál. */
function merged(group) {
  const info = state.db.get(group.id.toUpperCase()) || null;
  const items = IS_LOCAL ? group.items : group.items.filter((it) => !it.localOnly);
  return {
    ...group,
    items,
    count: items.length,
    bytes: items.reduce((sum, it) => sum + (it.bytes || 0), 0),
    info,
    name: info ? L(info.name) : spaced(group.id),
    category: info?.category || "other",
  };
}

const allObjects = () =>
  (state.library.objects || []).map(merged).filter((o) => o.count > 0);

/** A statisztikát a ténylegesen látható elemekből számoljuk, hogy a
    publikált oldal ne ígérjen több felvételt, mint amennyi elérhető rajta. */
function visibleStats() {
  const objects = allObjects();
  return {
    objects: objects.length,
    files: objects.reduce((n, o) => n + o.count, 0),
    bytes: objects.reduce((n, o) => n + o.bytes, 0),
  };
}

function visibleObjects() {
  const q = state.query.trim().toLowerCase();
  let list = allObjects();

  if (state.filter !== "all") list = list.filter((o) => o.category === state.filter);

  if (q) {
    list = list.filter((o) => {
      const info = o.info;
      const hay = [
        o.id, o.name,
        info && L(info.name), info && info.name?.hu, info && info.name?.en,
        info && L(info.constellation),
        ...(info?.aliases || []),
        ...o.items.map((i) => i.name),
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  const by = {
    name:   (a, b) => a.name.localeCompare(b.name, locale()),
    count:  (a, b) => b.count - a.count || a.name.localeCompare(b.name, locale()),
    latest: (a, b) => String(b.latest).localeCompare(String(a.latest)),
    size:   (a, b) => b.bytes - a.bytes,
  };
  return list.sort(by[state.sort] || by.name);
}

/* --- Wikipédia (élő, netről) --------------------------------------------- */

const WIKI_TTL = 30 * 24 * 3600 * 1000;

async function wikiFetch(wlang, title) {
  try {
    const res = await fetch(
      `https://${wlang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const j = await res.json();
    if (!j.extract || j.type === "disambiguation") return null;
    return {
      lang: wlang, title: j.title, extract: j.extract,
      page: j.content_urls?.desktop?.page,
      thumb: j.thumbnail?.source || null,
    };
  } catch (_) {
    return null;                        // nincs net – marad a saját leírás
  }
}

async function wikiSummary(obj) {
  const key = `miki:wiki:${lang}:${obj.id}`;
  try {
    const hit = JSON.parse(localStorage.getItem(key) || "null");
    if (hit && Date.now() - hit.t < WIKI_TTL) return hit.d;
  } catch (_) {}

  const titles = {
    hu: obj.info?.wiki?.hu,
    en: obj.info?.wiki?.en || (obj.info ? null : spaced(obj.id)),
  };
  const first = lang, second = lang === "hu" ? "en" : "hu";

  let best = titles[first] ? await wikiFetch(first, titles[first]) : null;
  // a magyar szócikkek gyakran csak tőmondatok – ilyenkor a másik nyelv többet ad
  if (titles[second] && (!best || best.extract.length < 220)) {
    const alt = await wikiFetch(second, titles[second]);
    if (alt && (!best || alt.extract.length > best.extract.length)) best = alt;
  }
  if (best) { try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: best })); } catch (_) {} }
  return best;
}

/* --- videó-borító: nincs ffmpeg, a böngésző rajzolja ki az első kockát ---- */

function hydratePosters(root = document) {
  $$("img[data-vfile]", root).forEach((img) => {
    const file = img.dataset.vfile;
    img.removeAttribute("data-vfile");
    const key = "miki:poster:" + file;
    const cached = localStorage.getItem(key);
    if (cached) { img.src = cached; return; }

    const v = document.createElement("video");
    v.muted = true; v.preload = "auto"; v.playsInline = true;
    v.src = url(file);

    const grab = () => {
      try {
        const w = 480;
        const h = Math.round((v.videoHeight || 270) * w / (v.videoWidth || 480));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(v, 0, 0, w, h);
        const data = canvas.toDataURL("image/jpeg", 0.72);
        try { localStorage.setItem(key, data); } catch (_) {}
        img.src = data;
      } catch (_) { /* file:// alatt a canvas „tainted” – marad a gradiens */ }
      v.removeAttribute("src");
      v.load();
    };

    v.addEventListener("loadeddata", () => {
      const time = Math.min(1.5, (v.duration || 3) / 4);
      if (v.currentTime === time) grab();
      else { try { v.currentTime = time; } catch (_) { grab(); } }
    }, { once: true });
    v.addEventListener("seeked", grab, { once: true });
    v.addEventListener("error", () => {}, { once: true });
  });
}

/* --- csempék ------------------------------------------------------------- */

function shotThumb(item) {
  if (item.kind === "video") {
    // ha az ffmpeg készített borítóképet, azt használjuk; különben a böngésző
    // rajzolja ki az első kockát a videóból
    const poster = item.thumb
      ? `<img src="${url(item.thumb)}" alt="" loading="lazy" decoding="async">`
      : `<img data-vfile="${esc(playableVideo(item))}" alt="">`;
    return `${poster}<span class="play-orb"><b>${icon("play")}</b></span>`;
  }
  const src = item.thumb || item.file;
  return `<img src="${url(src)}" alt="${esc(item.name)}" loading="lazy" decoding="async"
    style="${item.blur ? `background-image:url(${item.blur});background-size:cover;background-position:center` : ""}">`;
}

function shotCard(obj, item, index, delay = 0) {
  return `
    <button class="shot" data-obj="${esc(obj.id)}" data-idx="${index}" style="animation-delay:${delay}ms">
      <span class="shot-media${item.kind === "video" ? " video-tile" : ""}">
        ${shotThumb(item)}
        ${item.kind === "video" ? `<span class="play-tag">${icon("play")} ${esc(lang === "hu" ? "videó" : "video")}</span>` : ""}
        ${item.acq && item.acq.frames > 1 && item.acq.total
          ? `<span class="shot-tag">${esc(duration(item.acq.total))}</span>` : ""}
      </span>
      <span class="shot-cap">
        <span class="shot-name">${esc(prettyLabel(item.label))}</span>
        <span class="shot-meta">
          <span>${esc(bytes(item.bytes))}</span>
          ${item.w ? `<i class="dot"></i><span>${esc(px(item.w, item.h))}</span>` : ""}
        </span>
      </span>
    </button>`;
}

/* Az albumcsempe szándékosan szűkszavú: kép, név, darabszám, dátum.
   Minden más csak akkor jön elő, ha rákattintanak. */
function objectCard(o, index) {
  return `
    <button class="card" data-go="${esc(o.id)}" style="animation-delay:${index * 35}ms;
            --accent-glow:${esc(o.accent || "#5eead4")}88">
      <span class="card-media">
        ${o.cover
          ? `<img src="${url(o.cover)}" alt="${esc(o.name)}" loading="lazy" decoding="async"
               style="${o.blur ? `background-image:url(${o.blur});background-size:cover` : ""}">`
          : `<span style="display:block;width:100%;height:100%;background:linear-gradient(140deg,${esc(o.accent || "#2a3050")},#0a0d16)"></span>`}
        <span class="card-badges">
          <span class="badge">${esc(o.id)}</span>
          <span class="badge count accent">${o.count}</span>
        </span>
      </span>
      <span class="card-body">
        <span class="card-title">${esc(o.name)}</span>
        <span class="card-sub"><i>${esc(dateLabel(o.latest))}</i></span>
      </span>
    </button>`;
}

/* --- oldalsáv ------------------------------------------------------------ */

function renderChips() {
  const present = new Set(allObjects().map((o) => o.category));
  $("#chips").innerHTML = ["all", ...CATEGORY_KEYS]
    .filter((k) => k === "all" || present.has(k))
    .map((k) => `<button class="chip ${state.filter === k ? "on" : ""}" data-cat="${k}">${esc(t(k))}</button>`)
    .join("");
}

function renderSidebar() {
  const list = visibleObjects();
  $("#objlist").innerHTML = list.length ? list.map((o) => `
    <button class="navitem ${state.route.id === o.id ? "on" : ""}" data-go="${esc(o.id)}">
      ${o.cover
        ? `<img class="navitem-thumb" src="${url(o.cover)}" alt="" loading="lazy">`
        : `<span class="navitem-thumb" style="background:linear-gradient(135deg,${esc(o.accent || "#39405a")},#11151f)"></span>`}
      <span class="navitem-txt">
        <span class="navitem-name">${esc(o.name)}</span>
        <span class="navitem-meta">${esc(o.id)}</span>
      </span>
      <span class="navitem-count">${o.count}</span>
    </button>`).join("")
    : `<div class="note" style="padding:12px 8px">${esc(t("noResults"))}</div>`;

  const s = visibleStats();
  $("#sidefoot").innerHTML = `
    <div><b>${s.objects ?? 0}</b> ${esc(t("footObjects"))} &middot; <b>${s.files ?? 0}</b> ${esc(t("footShots"))}</div>
    <div><b>${bytes(s.bytes || 0)}</b> ${esc(t("footData"))}</div>
    <div>${esc(t("footScanned"))}: ${esc(dateLabel(state.library.generated) || "–")}</div>`;
}

/** A HTML-ben statikusan elhelyezett feliratok frissítése nyelvváltáskor. */
function renderStatic() {
  document.documentElement.lang = lang;
  $("#search").placeholder = t("searchPh");
  $("#navLabel").textContent = t("objects");
  $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$("#langs button").forEach((b) => b.classList.toggle("on", b.dataset.lang === lang));

  const sort = $("#sort");
  sort.innerHTML = [["name", "sortName"], ["count", "sortCount"],
                    ["latest", "sortLatest"], ["size", "sortSize"]]
    .map(([v, k]) => `<option value="${v}">${esc(t(k))}</option>`).join("");
  sort.value = state.sort;
}

/* --- kezdőlap ------------------------------------------------------------ */

function renderHome() {
  const list = visibleObjects();
  const s = visibleStats();

  $("#content").innerHTML = `
    <section class="hero">
      <h1>${esc(t("heroTitle"))}</h1>
      <p>${esc(t("heroText"))} &middot;
         <b>${s.objects ?? 0}</b> ${esc(t("footObjects"))},
         <b>${s.files ?? 0}</b> ${esc(t("footShots"))}${
           state.query ? ` &middot; ${esc(t("searchFor", state.query))}` : ""}</p>
    </section>
    ${list.length
      ? `<div class="grid">${list.map(objectCard).join("")}</div>`
      : `<div class="empty"><b>${esc(t("noResults"))}</b>${esc(t("noResultsSub"))}</div>`}
  `;

  $("#crumb").textContent = t("overview");
  $("#backBtn").style.display = "none";
  state.renderedId = "__home__";
  hydratePosters($("#content"));
}

/* --- objektum-adatlap ---------------------------------------------------- */

function factRows(info) {
  const constellation = L(info.constellation);
  const rows = [
    [t("fType"), L(info.type)],
    [t("fConst"), constellation && constellation !== "–"
      ? `${constellation}${info.constellationLat && info.constellationLat !== constellation
          ? ` (${info.constellationLat})` : ""}` : null],
    [t("fDist"), L(info.distance)],
    [t("fMag"), L(info.magnitude) ? `${L(info.magnitude)}<sup>m</sup>` : null],
    [t("fSize"), L(info.size)],
    [t("fRaDec"), info.ra && info.ra !== "–" ? `${info.ra} / ${info.dec}` : null],
    [t("fDisc"), L(info.discovery) && L(info.discovery) !== "–" ? L(info.discovery) : null],
    [t("fSeason"), L(info.season)],
  ].filter(([, v]) => v);
  return rows.map(([k, v]) => `<div class="kv-row"><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("");
}

function externalLinks(o) {
  const info = o.info;
  const links = [];
  const wikiLang = info?.wiki?.[lang] ? lang : (info?.wiki?.hu ? "hu" : "en");
  const wikiTitle = info?.wiki?.[wikiLang] || info?.wiki?.en || spaced(o.id);
  links.push([`https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(wikiTitle)}`, "Wikipedia"]);

  const simbad = info?.simbad || (!info ? spaced(o.id) : null);
  if (simbad) {
    links.push([`https://simbad.cds.unistra.fr/simbad/sim-id?Ident=${encodeURIComponent(simbad)}`, "SIMBAD"]);
    links.push([`https://aladin.cds.unistra.fr/AladinLite/?target=${encodeURIComponent(simbad)}&fov=1.5`,
                lang === "hu" ? "Aladin égtérkép" : "Aladin sky atlas"]);
  }
  return links.map(([href, text]) =>
    `<a class="btn" href="${esc(href)}" target="_blank" rel="noopener">${icon("open")} ${esc(text)}</a>`).join("");
}

function renderObject(id) {
  const o = allObjects().find((x) => x.id === id);
  if (!o) { location.hash = "#/"; return; }

  const info = o.info;
  const cover = o.items.find((i) => i.preview || i.thumb);
  const related = (info?.related || []).map((rid) => allObjects().find((x) => x.id === rid)).filter(Boolean);
  const facts = info ? L(info.facts) : null;
  // az objektum legtöbb expozíciót tartalmazó felvétele képviseli a felszerelést
  const bestAcq = o.items.map((i) => i.acq).filter(Boolean)
    .sort((a, b) => (b.total || 0) - (a.total || 0))[0];

  $("#content").innerHTML = `
  <article class="detail">
    <header class="detail-hero">
      ${cover ? `<img src="${url(cover.preview || cover.thumb)}" alt="${esc(o.name)}">` : ""}
      <div class="detail-hero-in">
        <div class="kicker">
          <span class="badge accent">${esc(o.id)}</span>
          ${info ? `<span>${esc(t(o.category))}</span><i class="dot"></i><span>${esc(L(info.type))}</span>`
                 : `<span>${esc(t("noProfile"))}</span>`}
        </div>
        <h1>${esc(o.name)}</h1>
        ${info && L(info.name) !== (lang === "hu" ? info.name?.en : info.name?.hu)
          ? `<p class="en">${esc(lang === "hu" ? info.name?.en : info.name?.hu)}</p>` : ""}
        ${info?.aliases?.length
          ? `<div class="aliases">${info.aliases.map((a) => `<span class="alias">${esc(a)}</span>`).join("")}</div>` : ""}
      </div>
    </header>

    <div class="shots">${o.items.map((it, i) => shotCard(o, it, i, i * 35)).join("")}</div>

    <details class="details-box">
      <summary>${icon("info")} ${esc(t("details"))}</summary>
      <div class="detail-grid">
      <div class="detail-info">
        ${info?.description ? `
          <section class="panel">
            <h3>${icon("sparkle")} ${esc(t("whatIsIt"))}</h3>
            <p>${esc(L(info.description))}</p>
          </section>` : ""}

        <section class="panel">
          <h3>${icon("globe")} ${esc(t("wikiLive"))}</h3>
          <div id="wikiBody">
            <div class="skeleton" style="width:96%"></div>
            <div class="skeleton" style="width:88%"></div>
            <div class="skeleton" style="width:64%"></div>
          </div>
        </section>

        ${facts?.length ? `
          <section class="panel">
            <h3>${icon("info")} ${esc(t("highlights"))}</h3>
            <ul class="facts">${facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
          </section>` : ""}
      </div>

      <aside class="detail-side">
        ${info ? `
          <section class="panel">
            <h3>${icon("star")} ${esc(t("data"))}</h3>
            <dl class="kv">${factRows(info)}</dl>
          </section>` : `
          <section class="panel">
            <h3>${icon("info")} ${esc(t("noProfile"))}</h3>
            <p class="note">${esc(t("noProfileText", o.id))}</p>
          </section>`}

        <section class="panel">
          <h3>${icon("folder")} ${esc(t("myStuff"))}</h3>
          <dl class="kv">
            <div class="kv-row"><dt>${esc(t("fShots"))}</dt><dd>${o.count} ${esc(t("count"))}</dd></div>
            <div class="kv-row"><dt>${esc(t("fBytes"))}</dt><dd>${esc(bytes(o.bytes))}</dd></div>
            <div class="kv-row"><dt>${esc(t("fLatest"))}</dt><dd>${esc(dateLabel(o.latest))}</dd></div>
          </dl>
        </section>

        ${bestAcq && acqRows(bestAcq) ? `
          <section class="panel">
            <h3>${icon("telescope")} ${esc(t("acquisition"))}
              ${bestAcq.estimated ? `<span class="est-chip">${esc(t("estimated"))}</span>` : ""}</h3>
            <dl class="kv">${acqRows(bestAcq)}</dl>
            ${acqEstimateNote(bestAcq)}
            ${bestAcq.note ? `<p class="note" style="margin-top:10px">${esc(L(bestAcq.note))}</p>` : ""}
          </section>` : ""}

        <section class="panel">
          <h3>${icon("globe")} ${esc(t("extLinks"))}</h3>
          <div class="links">${externalLinks(o)}</div>
        </section>

        ${related.length ? `
          <section class="panel">
            <h3>${icon("sparkle")} ${esc(t("related"))}</h3>
            <div class="links">${related.map((r) =>
              `<button class="btn" data-go="${esc(r.id)}">${esc(r.name)}</button>`).join("")}</div>
          </section>` : ""}
      </aside>
      </div>
    </details>
  </article>`;

  $("#crumb").innerHTML = `<span>${esc(t("object"))} /</span> ${esc(o.name)}`;
  $("#backBtn").style.display = "";
  state.renderedId = o.id;
  hydratePosters($("#content"));
  window.scrollTo({ top: 0 });

  wikiSummary(o).then((w) => {
    const box = $("#wikiBody");
    if (!box) return;
    if (!w) { box.innerHTML = `<p class="note">${esc(t("wikiFail"))}</p>`; return; }
    box.innerHTML = `
      <div class="wiki-body">
        ${w.thumb ? `<img src="${esc(w.thumb)}" alt="" referrerpolicy="no-referrer">` : ""}
        <div>
          <p>${esc(w.extract)}</p>
          <div class="wiki-src">${esc(t("source"))}:
            <a href="${esc(w.page)}" target="_blank" rel="noopener">${esc(w.title)}</a>
            – ${esc(w.lang === "hu" ? t("wikiHu") : t("wikiEn"))}</div>
        </div>
      </div>`;
  });
}

/* ==========================================================================
   Osztott nézegető: bal oldalt a kép (levágás nélkül), jobb oldalt a leírás
   ========================================================================== */

/* A nézegetőnek három, egymást kizáró módja van: csak a kép, kép + leírás,
   vagy összehasonlítás. Egy háromállású kapcsoló vezérli – két külön
   kapcsolóból négy állapot jönne ki, ami mobilon zavaros. */
const MODES = ["photo", "info", "compare"];

const vw = {
  el: null, obj: null, items: [], index: 0,
  mode: "photo",
  compare: false,                                   // származtatott: mode === "compare"
  prefMode: localStorage.getItem("miki:mode") === "info" ? "info" : "photo",
  seq: [], seqPos: 0,
  pushed: false,
  img: null, scale: 1, tx: 0, ty: 0,
};

function currentItem() { return vw.items[vw.index]; }

function referenceOf(obj) { return obj?.info?.reference || null; }

function refKindLabel(ref) {
  return t(ref.kind === "hubble" ? "kindHubble" : ref.kind === "pro" ? "kindPro" : "kindAmateur");
}

/* --- nagyítás: a kép object-fit:contain, ezért a kirajzolt méretet számoljuk */

function paintedSize(item) {
  const pane = $("#vwMine");
  const bw = pane.clientWidth, bh = pane.clientHeight;
  if (!item.w || !item.h) return { w: bw, h: bh };
  const scale = Math.min(bw / item.w, bh / item.h);
  return { w: item.w * scale, h: item.h * scale };
}

function applyZoom() {
  if (!vw.img) return;
  const item = currentItem();
  const pane = $("#vwMine");
  const fit = paintedSize(item);
  const maxX = Math.max(0, (fit.w * vw.scale - pane.clientWidth) / 2);
  const maxY = Math.max(0, (fit.h * vw.scale - pane.clientHeight) / 2);
  vw.tx = Math.min(maxX, Math.max(-maxX, vw.tx));
  vw.ty = Math.min(maxY, Math.max(-maxY, vw.ty));
  vw.img.style.transform = `translate(${vw.tx}px, ${vw.ty}px) scale(${vw.scale})`;
  vw.img.classList.toggle("zoomed", vw.scale > 1.01);
}

function resetZoom() {
  vw.scale = 1; vw.tx = 0; vw.ty = 0;
  if (vw.img) { vw.img.style.transform = ""; vw.img.classList.remove("zoomed"); }
}

function zoomAt(clientX, clientY, next) {
  if (!vw.img || vw.compare) return;
  next = Math.min(8, Math.max(1, next));
  const rect = $("#vwMine").getBoundingClientRect();
  const ox = (clientX - (rect.left + rect.width / 2) - vw.tx) / vw.scale;
  const oy = (clientY - (rect.top + rect.height / 2) - vw.ty) / vw.scale;
  vw.tx += ox * (vw.scale - next);
  vw.ty += oy * (vw.scale - next);
  vw.scale = next;
  if (vw.scale <= 1.01) resetZoom();
  else applyZoom();
}

/* --- összehasonlító panel ------------------------------------------------- */

function renderComparePane() {
  const ref = referenceOf(vw.obj);
  const pane = $("#vwPro");
  const img = $("#vwProImg");
  const stateBox = $("#vwProState");

  if (!vw.compare || !ref) { pane.classList.remove("on"); return; }
  pane.classList.add("on");

  $("#vwTagPro").innerHTML =
    `<b>${esc(L(ref.telescope))}</b><span>${esc(ref.credit)}</span>`;

  const src = commonsImage(ref.file, 1600);
  if (img.dataset.src !== src) {
    img.dataset.src = src;
    img.style.opacity = "0";
    stateBox.textContent = t("proLoading");
    stateBox.style.display = "";
    img.onload = () => { img.style.opacity = ""; stateBox.style.display = "none"; };
    img.onerror = () => { stateBox.textContent = t("proFail"); stateBox.style.display = ""; };
    img.src = src;
  }
}

/** A kapcsoló és a nézegető osztályainak összehangolása az aktuális móddal. */
function applyModeUI() {
  vw.compare = vw.mode === "compare";
  for (const m of MODES) vw.el.classList.toggle("mode-" + m, vw.mode === m);
  const hasRef = !!referenceOf(vw.obj);
  $$("#vwModes button").forEach((b) => {
    b.classList.toggle("on", b.dataset.mode === vw.mode);
    if (b.dataset.mode === "compare") b.disabled = !hasRef;
  });
}

/** A mód a címsorban van, így a link megosztható és a Vissza gomb is kezeli. */
function setMode(mode) {
  if (!MODES.includes(mode) || mode === vw.mode) return;
  if (mode === "compare" && !referenceOf(vw.obj)) { toast(t("noRef"), "err"); return; }
  if (mode !== "compare") {
    vw.prefMode = mode;
    localStorage.setItem("miki:mode", mode);
  }
  gotoShot(vw.obj.id, vw.index, true, mode);
}

/* --- a nézegető jobb oldali paneljei -------------------------------------- */

function renderViewerSide() {
  const o = vw.obj, item = currentItem(), info = o.info;
  const ref = referenceOf(o);
  const facts = info ? L(info.facts) : null;

  $("#vwSide").innerHTML = `
    <div class="vw-head">
      <span class="badge accent">${esc(o.id)}</span>
      <h2>${esc(o.name)}</h2>
      ${info ? `<p class="vw-sub">${esc(L(info.type))}${
        L(info.constellation) && L(info.constellation) !== "–"
          ? " · " + esc(L(info.constellation)) : ""}</p>` : ""}
    </div>

    ${info?.description ? `<p class="vw-desc">${esc(L(info.description))}</p>` : ""}

    ${info ? `<dl class="kv vw-kv">
      ${[[t("fDist"), L(info.distance)], [t("fMag"), L(info.magnitude)], [t("fSize"), L(info.size)]]
        .filter(([, v]) => v)
        .map(([k, v]) => `<div class="kv-row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}
    </dl>` : ""}

    ${vw.compare && ref ? `
      <div class="vw-block">
        <h4>${icon("telescope")} ${esc(refKindLabel(ref))}</h4>
        <p class="vw-desc">${esc(L(ref.telescope))}</p>
        <p class="vw-credit">${esc(t("credit"))}: ${esc(ref.credit)} · ${esc(ref.license)}</p>
        <a class="btn" href="${esc(commonsPage(ref.file))}" target="_blank" rel="noopener">
          ${icon("open")} ${esc(t("viewOnCommons"))}</a>
      </div>` : ""}

    ${!vw.compare && facts?.length ? `
      <div class="vw-block">
        <h4>${icon("info")} ${esc(t("highlights"))}</h4>
        <ul class="facts">${facts.slice(0, 3).map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      </div>` : ""}

    ${item.acq && acqRows(item.acq) ? `
      <div class="vw-block">
        <h4>${icon("telescope")} ${esc(t("acquisition"))}
          ${item.acq.estimated ? `<span class="est-chip">${esc(t("estimated"))}</span>` : ""}</h4>
        <dl class="kv vw-kv">${acqRows(item.acq)}</dl>
        ${acqEstimateNote(item.acq)}
        ${item.acq.note ? `<p class="vw-credit">${esc(L(item.acq.note))}</p>` : ""}
      </div>` : ""}

    <div class="vw-block">
      <h4>${icon("folder")} ${esc(t("thisShot"))}</h4>
      <dl class="kv vw-kv">
        <div class="kv-row"><dt>${esc(t("fIndex"))}</dt><dd>${vw.index + 1} / ${vw.items.length}</dd></div>
        <div class="kv-row"><dt>${esc(t("fAll"))}</dt><dd>${vw.seqPos + 1} / ${vw.seq.length}</dd></div>
        ${item.w ? `<div class="kv-row"><dt>${esc(t("fRes"))}</dt><dd>${esc(px(item.w, item.h))}</dd></div>` : ""}
        <div class="kv-row"><dt>${esc(t("fBytes"))}</dt><dd>${esc(bytes(item.bytes))}</dd></div>
        <div class="kv-row"><dt>${esc(t("fTaken"))}</dt><dd>${esc(dateLabel(item.mtime))}</dd></div>
      </dl>
    </div>

    <div class="vw-block">
      <div class="links">
        ${externalLinks(o)}
        <button class="btn" data-go="${esc(o.id)}">${icon("info")} ${esc(t("data"))}</button>
      </div>
    </div>`;
}

/* --- a nézegető képe ------------------------------------------------------ */

function showSlide() {
  const item = currentItem();
  if (!item) return;

  const media = $("#vwMedia");
  media.innerHTML = "";
  resetZoom();
  vw.img = null;

  if (item.kind === "video") {
    const video = document.createElement("video");
    video.src = url(playableVideo(item));
    if (item.thumb) video.poster = url(item.thumb);
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    media.appendChild(video);
    $("#vwHint").textContent = t("hintVideo");
  } else {
    const img = document.createElement("img");
    img.src = url(item.preview || item.thumb || item.file);
    img.alt = item.name;
    img.draggable = false;
    media.appendChild(img);
    vw.img = img;
    $("#vwHint").textContent = t("hintImage");
  }
  $("#vwStage").classList.toggle("zoomable", item.kind !== "video" && !vw.compare);

  $("#vwTagMine").innerHTML = `<b>${esc(t("mine"))}</b><span>${esc(prettyLabel(item.label))}</span>`;
  $("#vwTitle").textContent = item.name;
  $("#vwMeta").innerHTML = [
    acqSummary(item.acq), px(item.w, item.h), bytes(item.bytes), dateLabel(item.mtime),
    item.preview ? t("previewNote") : "",
  ].filter(Boolean).map(esc).join(' <i class="dot"></i> ');

  $("#vwPrev").disabled = vw.seqPos <= 0;
  $("#vwNext").disabled = vw.seqPos >= vw.seq.length - 1;

  $("#vwRail").innerHTML = vw.items.map((it, i) => {
    const cls = i === vw.index ? "on" : "";
    if (it.thumb) return `<img src="${url(it.thumb)}" data-i="${i}" class="${cls}" alt="" loading="lazy">`;
    return it.kind === "video"
      ? `<img data-vfile="${esc(playableVideo(it))}" data-i="${i}" class="rail-video ${cls}" alt="">`
      : `<img src="${url(it.file)}" data-i="${i}" class="${cls}" alt="" loading="lazy">`;
  }).join("");
  hydratePosters($("#vwRail"));
  const active = $("#vwRail .on");
  if (active) active.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });

  renderComparePane();
  renderViewerSide();
}

function openViewer(objId, index, wantMode) {
  const o = allObjects().find((x) => x.id === objId);
  if (!o || !o.items[index]) return;

  const wasOpen = vw.el.classList.contains("open");
  const sameShot = wasOpen && vw.obj?.id === objId && vw.index === index;
  if (vw.obj?.id !== objId) $("#vwProImg").dataset.src = "";   // új objektum → új profi kép

  vw.obj = o;
  vw.items = o.items;
  vw.index = index;
  // ha összehasonlítást kérnek, de ehhez az objektumhoz nincs kép,
  // essünk vissza a legutóbb választott sima módra
  vw.mode = MODES.includes(wantMode) ? wantMode : vw.prefMode;
  if (vw.mode === "compare" && !referenceOf(o)) vw.mode = vw.prefMode;

  vw.seq = buildSequence();
  vw.seqPos = vw.seq.findIndex((s) => s.id === objId && s.i === index);
  if (vw.seqPos < 0) {                     // szűrő miatt kiesett – csak ezen az objektumon lapozunk
    vw.seq = o.items.map((_it, i) => ({ id: objId, i }));
    vw.seqPos = index;
  }

  vw.el.classList.add("open");
  document.body.classList.add("no-scroll");
  applyModeUI();

  if (sameShot) {                          // csak a mód váltott
    $("#vwStage").classList.toggle("zoomable", !vw.compare && currentItem().kind !== "video");
    resetZoom();
    renderComparePane();
    renderViewerSide();
    return;
  }

  showSlide();

  if (!wasOpen) {
    const hint = $("#vwHint");
    hint.classList.remove("show");
    void hint.offsetWidth;
    hint.classList.add("show");
  }
}

function closeViewer() {
  if (!vw.el.classList.contains("open")) return;
  vw.el.classList.remove("open");
  document.body.classList.remove("no-scroll");
  $$("#vwMedia video").forEach((v) => v.pause());
}

/* A nagyított kép is a címsorban van: a Vissza gomb bezárja, és a konkrét
   felvételre mutató link is elmenthető. */
const shotHash = (id, i, mode) =>
  `#/o/${encodeURIComponent(id)}/${i}` + (mode && mode !== "photo" ? "/" + mode : "");

function gotoShot(id, index, replace, mode) {
  const hash = shotHash(id, index, mode);
  if (replace) location.replace(location.pathname + location.search + hash);
  else { vw.pushed = true; location.hash = hash; }
}

function dismissViewer() {
  if (vw.pushed) { vw.pushed = false; history.back(); }
  else if (vw.obj) location.replace(location.pathname + location.search + `#/o/${encodeURIComponent(vw.obj.id)}`);
  else closeViewer();
}

/** Az összes látható objektum összes felvétele egyetlen sorozatban –
    így a nyilakkal át lehet lapozni a következő objektumra is. */
function buildSequence() {
  return visibleObjects().flatMap((o) => o.items.map((_it, i) => ({ id: o.id, i })));
}

function step(delta) {
  const pos = vw.seqPos + delta;
  if (pos < 0 || pos >= vw.seq.length) return;
  const next = vw.seq[pos];
  // lapozás ne szemetelje tele az előzményeket, de az összehasonlítás maradjon bekapcsolva
  gotoShot(next.id, next.i, true, vw.mode);
}

async function shellAction(action) {
  const item = currentItem();
  if (!item) return;
  if (!IS_LOCAL) { window.open(url(item.file), "_blank"); return; }
  try {
    const res = await fetch(`/api/${action}?p=${encodeURIComponent(item.file)}`);
    const j = await res.json();
    if (!j.ok) toast(j.error || t("serverDown"), "err");
  } catch (_) {
    toast(t("serverDown"), "err");
  }
}

/* --- útvonalkezelés ------------------------------------------------------ */

function render() {
  renderStatic();
  renderChips();
  renderSidebar();
  if (state.route.view === "object") renderObject(state.route.id);
  else renderHome();
}

function applyHash() {
  const m = location.hash.match(/^#\/o\/([^/]+)(?:\/(\d+))?(?:\/(info|compare))?/);
  state.route = m
    ? { view: "object", id: decodeURIComponent(m[1]).toUpperCase(),
        shot: m[2] === undefined ? null : Number(m[2]), mode: m[3] || null }
    : { view: "home", id: null, shot: null, mode: null };

  // Objektumok közti lapozás közben a háttéroldalt nem rajzoljuk újra – a
  // nézegető úgyis eltakarja, és így nem indul fölösleges Wikipédia-kérés.
  const wantedPage = state.route.view === "home" ? "__home__" : state.route.id;
  const stayInViewer = state.route.shot !== null && vw.el.classList.contains("open");

  if (stayInViewer || wantedPage === state.renderedId) renderSidebar();
  else render();

  if (state.route.shot === null) closeViewer();
  else openViewer(state.route.id, state.route.shot, state.route.mode);

  // záráskor a helyes oldal legyen a nézegető alatt
  if (state.route.shot === null && wantedPage !== state.renderedId) render();

  document.body.classList.remove("nav-open");
}

function setLang(next) {
  if (next === lang) return;
  lang = next;
  localStorage.setItem("miki:lang", lang);
  render();
  if (vw.el.classList.contains("open")) {   // a renderStatic visszaírta a gombfeliratokat
    applyModeUI();
    showSlide();
  }
}

/* --- események ----------------------------------------------------------- */

function wire() {
  vw.el = $("#viewer");

  window.addEventListener("hashchange", applyHash);

  $("#langs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-lang]");
    if (b) setLang(b.dataset.lang);
  });

  $("#backBtn").addEventListener("click", () => { location.hash = "#/"; });
  $("#navToggle").addEventListener("click", () => document.body.classList.toggle("nav-open"));
  $("#scrim").addEventListener("click", () => document.body.classList.remove("nav-open"));

  $("#search").addEventListener("input", (e) => {
    state.query = e.target.value;
    if (state.route.view === "object" && state.query) location.hash = "#/";
    else { renderSidebar(); if (state.route.view === "home") renderHome(); }
  });

  $("#sort").addEventListener("change", (e) => {
    state.sort = e.target.value;
    localStorage.setItem("miki:sort", state.sort);
    render();
  });

  $("#chips").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-cat]");
    if (!chip) return;
    state.filter = chip.dataset.cat;
    if (state.route.view === "object") location.hash = "#/";
    else render();
  });

  document.addEventListener("click", (e) => {
    const nav = e.target.closest("[data-go]");
    if (nav) {
      if (vw.el.classList.contains("open")) closeViewer();
      location.hash = "#/o/" + encodeURIComponent(nav.dataset.go);
      return;
    }
    const shot = e.target.closest(".shot");
    if (shot) gotoShot(shot.dataset.obj, Number(shot.dataset.idx), false, vw.prefMode);
  });

  // --- nézegető vezérlés
  $("#vwClose").addEventListener("click", dismissViewer);
  $("#vwPrev").addEventListener("click", () => step(-1));
  $("#vwNext").addEventListener("click", () => step(1));
  $("#vwOpen").addEventListener("click", () => shellAction("open"));
  $("#vwReveal").addEventListener("click", () => shellAction("reveal"));
  $("#vwModes").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-mode]");
    if (btn) setMode(btn.dataset.mode);
  });

  $("#vwRail").addEventListener("click", (e) => {
    const target = e.target.closest("[data-i]");
    if (!target) return;
    vw.index = Number(target.dataset.i);
    showSlide();
    gotoShot(vw.obj.id, vw.index, true, vw.mode);
  });

  const stage = $("#vwStage");

  stage.addEventListener("wheel", (e) => {
    if (!vw.img || vw.compare) return;
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, vw.scale * (e.deltaY < 0 ? 1.22 : 1 / 1.22));
  }, { passive: false });

  let drag = null;
  stage.addEventListener("pointerdown", (e) => {
    if (!vw.img || e.target !== vw.img || vw.compare) return;
    drag = { x: e.clientX, y: e.clientY, tx: vw.tx, ty: vw.ty, moved: false };
    vw.img.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    if (vw.scale > 1.01) {
      vw.img.classList.add("dragging");
      vw.tx = drag.tx + dx; vw.ty = drag.ty + dy;
      applyZoom();
    }
  });
  stage.addEventListener("pointerup", (e) => {
    if (!drag) return;
    const wasDrag = drag.moved;
    drag = null;
    if (vw.img) vw.img.classList.remove("dragging");
    if (!wasDrag) zoomAt(e.clientX, e.clientY, vw.scale > 1.01 ? 1 : 2.8);
  });
  stage.addEventListener("pointercancel", () => { drag = null; });

  window.addEventListener("resize", () => { if (vw.scale > 1.01) applyZoom(); });

  // --- billentyűzet
  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);

    if (vw.el.classList.contains("open")) {
      if (e.key === "Escape") { dismissViewer(); e.preventDefault(); }
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "0") resetZoom();
      else if (e.key === "c" || e.key === "C") setMode(vw.mode === "compare" ? vw.prefMode : "compare");
      else if (e.key === "i" || e.key === "I") setMode(vw.mode === "info" ? "photo" : "info");
      return;
    }
    if (typing) {
      if (e.key === "Escape") { e.target.value = ""; state.query = ""; e.target.blur(); render(); }
      return;
    }
    if (e.key === "/") { e.preventDefault(); $("#search").focus(); }
    if (e.key === "Escape" && state.route.view === "object") location.hash = "#/";
  });

  // --- újraolvasás
  $("#rescan").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    if (!IS_LOCAL) { toast(t("needServer"), "err"); return; }
    btn.classList.add("spin");
    btn.disabled = true;
    try {
      const res = await fetch("/api/rescan");
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "?");
      await loadAll();
      render();
      toast(t("rescanOk", j.stats.objects, j.stats.files));
    } catch (err) {
      toast(t("rescanFail") + err.message, "err");
    } finally {
      btn.classList.remove("spin");
      btn.disabled = false;
    }
  });
}

/* --- indulás ------------------------------------------------------------- */

(async function boot() {
  wire();
  renderStatic();
  IS_LOCAL = await detectLocal();
  // publikált oldalon nincs mit újraolvasni, és nincs eredeti fájl sem
  document.body.classList.toggle("static-site", !IS_LOCAL);
  await loadAll();
  if (!state.library.objects?.length) {
    $("#content").innerHTML =
      `<div class="empty"><b>${esc(t("emptyTitle"))}</b>${esc(t("emptyText"))}</div>`;
    return;
  }
  applyHash();
})();

})();
