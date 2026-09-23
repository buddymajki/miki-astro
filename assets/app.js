/* ==========================================================================
   Miki-Astro Dashboard
   Vanilla JS, build nélkül. Az adatokat a scan.py generálja.
   ========================================================================== */

(() => {
"use strict";

const SERVED = location.protocol === "http:" || location.protocol === "https:";

// a scan.py által generált előnézet szélessége (PREVIEW_W)
const PREVIEW_PX = 2400;

/* Helyben fut (serve.py) vagy publikált statikus oldal? A helyi szerveren van
   /api/ping; a GitHub Pages-en nincs, ott elrejtjük a helyi funkciókat. */
let IS_LOCAL = false;
let PENDING = 0;              // hány változás vár publikálásra (helyi módban)

async function detectLocal() {
  if (!SERVED) return false;
  try {
    const res = await fetch("api/ping", { cache: "no-store" });
    if (!res.ok) return false;
    const info = await res.json();
    PENDING = Number(info.pending) > 0 ? Number(info.pending) : 0;
    return info.local === true;
  } catch (_) {
    return false;
  }
}

/** Helyi módban emlékeztető: a start.bat nem publikál, arra a publish.bat való. */
function renderPublishHint() {
  const bar = $("#publishHint");
  if (!bar) return;
  bar.hidden = !(IS_LOCAL && PENDING > 0);
  if (!bar.hidden) bar.innerHTML = `${icon("alert")}<span>${esc(t("pending", PENDING))}</span>`;
}

/* --- nyelvek / i18n ------------------------------------------------------ */

const STRINGS = {
  hu: {
    searchPh: "Keresés objektumra…",
    all: "Mind", deepsky: "Mély-ég", solar: "Naprendszer", atmosphere: "Légkör", other: "Egyéb",
    galaxy: "Galaxisok", nebula: "Ködök", cluster: "Halmazok",
    viewAlbum: "Album", viewMessier: "Messier-katalógus",
    namesLabel: "Megnevezés", namesCommon: "Név", namesCatalog: "Katalógusjel",
    namesCommonTip: "Közismert név elöl (pl. Androméda-galaxis)",
    namesCatalogTip: "Katalógusjel elöl (pl. M31, NGC 7000)",
    sortCatalog: "Katalógus szerint",
    messierTitle: "Messier-katalógus",
    messierText: "Charles Messier 110 objektuma. A színes lapokról már van saját felvételem, a szürkék még várnak rám.",
    messierDone: "lefotózva", messierLink: "Messier-katalógus: %s / 110",
    mAll: "Mind", mHave: "Lefotózva", mMissing: "Még hiányzik",
    notYet: "Még nincs saját felvétel",
    notYetText: "Erről az objektumról még nem készült képem – addig a katalógusadatok és a Wikipédia-összefoglaló látható.",
    fMessier: "Messier-szám", fCatalogs: "Katalógusjelek",
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
    noProfileText: "Ehhez az objektumhoz még nincs saját adatlap, ezért a leírás és az " +
                   "összehasonlító kép a Wikipédiáról jön. Ha pontos adatokat szeretnél, " +
                   "vedd fel a data/objects.json fájlba \"id\": \"%s\" kulccsal.",

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
    aSite: "Helyszín", aSky: "Égbolt", aSessions: "Felvételi szettek",
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

    hintImage: "Görgetés vagy csippentés = nagyítás · húzás = mozgatás · ← → = lapozás",
    browse: "Lapozás",
    scopeSimilar: "Hasonló", scopeList: "Lista", scopeObject: "Csak ez",
    scopeSimilarTip: "Ugyanolyan típusú objektumok, katalógus szerinti sorrendben",
    scopeListTip: "A bal oldali lista sorrendjében, az összes látható objektum",
    scopeObjectTip: "Csak ennek az objektumnak a felvételei",
    objectsUnit: "objektum", shotsUnit: "kép",
    zoomIn: "Nagyítás", zoomOut: "Kicsinyítés",
    zoomFit: "Teljes kép", zoomOne: "Pixelpontos nézet (1:1)",
    hdLoading: "Nagy felbontás betöltése…", hdReady: "Nagy felbontás",
    fullRes: "Teljes felbontás",
    hintVideo: "Videó – az eredeti fájl játszik le",
    previewNote: "előnézet – nagyításra betölt a nagy felbontás",
    thisShot: "Ez a felvétel",

    newTag: "ÚJ", newCount: "%s új", newInAlbum: "%s új felvétel",
    pending: "%s változás még nincs publikálva – futtasd a publish.bat fájlt, hogy kikerüljön az internetre.",
    rescanOk: "Kész: %s objektum, %s felvétel.",
    rescanFail: "Az újraolvasás nem sikerült: ",
    serverDown: "A szerver nem válaszol.",
    needServer: "Ehhez a start.bat-tal kell indítani a dashboardot.",
    emptyTitle: "Még nincs beolvasott felvétel",
    emptyText: "Indítsd a dashboardot a start.bat fájllal, vagy futtasd a python scan.py parancsot.",
  },
  en: {
    searchPh: "Search objects…",
    all: "All", galaxy: "Galaxies", nebula: "Nebulae", cluster: "Clusters",
    viewAlbum: "Album", viewMessier: "Messier catalogue",
    namesLabel: "Naming", namesCommon: "Name", namesCatalog: "Catalogue ID",
    namesCommonTip: "Common name first (e.g. Andromeda Galaxy)",
    namesCatalogTip: "Catalogue ID first (e.g. M31, NGC 7000)",
    sortCatalog: "By catalogue",
    messierTitle: "Messier catalogue",
    messierText: "Charles Messier's 110 objects. The coloured tiles are ones I have already photographed – the grey ones are still waiting.",
    messierDone: "photographed", messierLink: "Messier catalogue: %s / 110",
    mAll: "All", mHave: "Photographed", mMissing: "Still missing",
    notYet: "No photo of my own yet",
    notYetText: "I haven't imaged this object yet – until then, here are the catalogue data and the Wikipedia summary.",
    fMessier: "Messier number", fCatalogs: "Designations",
    deepsky: "Deep sky", solar: "Solar system", atmosphere: "Atmosphere", other: "Other",
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
    noProfileText: "This object has no profile of its own yet, so the description and the " +
                   "comparison image come from Wikipedia. For exact figures, add it to " +
                   "data/objects.json with \"id\": \"%s\".",

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
    aSite: "Location", aSky: "Sky", aSessions: "Imaging sets",
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

    hintImage: "Scroll or pinch = zoom · drag = pan · ← → = next image",
    browse: "Browsing",
    scopeSimilar: "Similar", scopeList: "List", scopeObject: "This one",
    scopeSimilarTip: "Objects of the same type, in catalogue order",
    scopeListTip: "Every visible object, in the order of the sidebar list",
    scopeObjectTip: "Only the shots of this object",
    objectsUnit: "objects", shotsUnit: "shots",
    zoomIn: "Zoom in", zoomOut: "Zoom out",
    zoomFit: "Whole image", zoomOne: "Pixel-for-pixel view (1:1)",
    hdLoading: "Loading full resolution…", hdReady: "Full resolution",
    fullRes: "Full resolution",
    hintVideo: "Video – playing the original file",
    previewNote: "preview – zooming loads the full-resolution version",
    thisShot: "This shot",

    newTag: "NEW", newCount: "%s new", newInAlbum: "%s new shot(s)",
    pending: "%s change(s) not published yet – run publish.bat to put them online.",
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

/* Típus-szűrők: a mély-ég objektumokat tovább bontjuk, hogy bővülő albumban
   is gyorsan meglegyen, amit keresnek. Az objects.json "kind" mezője dönt. */
const KIND_KEYS = ["galaxy", "nebula", "cluster", "solar", "atmosphere", "other"];

/* A Messier-katalógus típuskódjai → kétnyelvű név és szűrő-csoport. */
const MTYPES = {
  GX:  { hu: "Galaxis",              en: "Galaxy",             kind: "galaxy" },
  GC:  { hu: "Gömbhalmaz",           en: "Globular cluster",   kind: "cluster" },
  OC:  { hu: "Nyílthalmaz",          en: "Open cluster",       kind: "cluster" },
  EN:  { hu: "Emissziós köd",        en: "Emission nebula",    kind: "nebula" },
  RN:  { hu: "Reflexiós köd",        en: "Reflection nebula",  kind: "nebula" },
  PN:  { hu: "Planetáris köd",       en: "Planetary nebula",   kind: "nebula" },
  SNR: { hu: "Szupernóva-maradvány", en: "Supernova remnant",  kind: "nebula" },
  DS:  { hu: "Kettőscsillag",        en: "Double star",        kind: "other" },
  AS:  { hu: "Aszterizma",           en: "Asterism",           kind: "other" },
  SC:  { hu: "Csillagfelhő",         en: "Star cloud",         kind: "other" },
};

const state = {
  library: null,
  db: new Map(),
  messier: [],            // a teljes Messier-katalógus (data/messier.json)
  messierInfo: new Map(), // "M42" → adatlap a katalógusból (ha nincs saját az objects.json-ban)
  section: "album",       // melyik lista van az oldalsávban: album | messier
  names: localStorage.getItem("miki:names") === "catalog" ? "catalog" : "common",
  mfilter: "all",         // Messier-nézet: all | have | missing
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
  if (acq.location) rows.push([t("aSite"), L(acq.location)]);
  if (acq.bortle) rows.push([t("aSky"), `Bortle ${acq.bortle}`]);
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
    // A GitHub Pages 10 percre gyorsítótárazza a fájlokat a CDN-en is, ezért
    // az adatot egyedi paraméterrel kérjük – így publikálás után azonnal
    // a friss album látszik, nem kell a böngészőt üríteni.
    const res = await fetch(`${path}?t=${Date.now()}`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (_) { /* file:// alatt a fetch elhasal – megy a fallback */ }
  return window[globalFallback] || null;
}

async function loadAll() {
  const [library, objects, messier] = await Promise.all([
    loadJson("data/library.json", "MIKI_LIBRARY"),
    loadJson("data/objects.json", "MIKI_OBJECTS"),
    loadJson("data/messier.json", "MIKI_MESSIER"),
  ]);
  state.library = library || { stats: {}, objects: [] };
  state.db.clear();
  for (const o of (objects?.objects || [])) state.db.set(o.id.toUpperCase(), o);
  state.messier = messier?.objects || [];
  state.messierInfo.clear();
  for (const m of state.messier) {
    state.messierInfo.set(`M${m.n}`, messierProfile(m, messier.constellations || {}));
  }
}

/** Egy Messier-katalógusbejegyzésből adatlap, ugyanolyan alakban, mint az
    objects.json bejegyzései – így a helykitöltő oldal is ugyanúgy rajzolódik. */
function messierProfile(m, cons) {
  const type = MTYPES[m.type] || { hu: m.type, en: m.type, kind: "other" };
  const mag = Number(m.mag).toFixed(1);
  return {
    id: `M${m.n}`,
    name: m.name || null,
    aliases: [`M${m.n}`, m.cat].filter(Boolean),
    category: "deepsky",
    kind: type.kind,
    type: { hu: type.hu, en: type.en },
    constellation: { hu: cons[m.con] || m.con, en: m.con },
    constellationLat: m.con,
    magnitude: { hu: mag.replace(".", ","), en: mag },
    wiki: { hu: m.name?.hu || `Messier ${m.n}`, en: `Messier ${m.n}` },
    simbad: `M${m.n}`,
  };
}

/* --- megnevezés: közismert név vagy katalógusjel -------------------------- */

const CATALOG_ID_RE = /^(M|NGC|IC|SH2-|C|UGC|PGC|LDN|LBN|ABELL|HCG|VDB|B)(\d+)$/;
const CATALOG_PRETTY = { "SH2-": "Sh2-", ABELL: "Abell ", VDB: "vdB ", C: "C", M: "M", B: "B" };
const CATALOG_ALIAS_RE = /^(M|NGC|IC|Sh2-|Caldwell|UGC|HCG|Arp|Abell|LBN|LDN|vdB)\s?\d/i;
const squash = (x) => String(x).replace(/\s+/g, "").toUpperCase();

/** Az azonosítóból olvasható katalógusjel: "NGC7000" → "NGC 7000", "SH2-101" → "Sh2-101". */
function designation(id, info) {
  const m = CATALOG_ID_RE.exec(String(id).toUpperCase());
  if (m) return (CATALOG_PRETTY[m[1]] ?? `${m[1]} `) + m[2];
  // nem katalógusjeles azonosító (pl. STEPHAN): az első katalógusos alias
  return (info?.aliases || []).find((a) => CATALOG_ALIAS_RE.test(a)) || null;
}

/** A fő jel, mellette legfeljebb egy további (M/NGC/IC): "M31 · NGC 224". */
function designations(id, info) {
  const main = designation(id, info);
  const list = main ? [main] : [];
  for (const a of info?.aliases || []) {
    if (list.length >= 2) break;
    if (/^(M|NGC|IC)\s?\d/i.test(a) && !list.some((x) => squash(x) === squash(a))) list.push(a);
  }
  return list;
}

/** A katalógus szerinti sorrend kulcsa: előbb Messier, aztán NGC, IC, Sh2, a többi. */
function catalogRank(o) {
  const order = ["M", "NGC", "IC", "SH2-", "C"];
  const m = CATALOG_ID_RE.exec(o.id);
  if (!m) return [9, 0];
  const i = order.indexOf(m[1]);
  return [i < 0 ? 5 : i, Number(m[2])];
}

/** A név, a katalógusjel és a típus kiszámítása – az album és a helykitöltő
    oldalak ugyanezt használják, így mindenhol egyformán jelenik meg. */
function decorate(o, info) {
  const codes = designations(o.id, info);
  const code = codes[0] || null;
  let common = info?.name ? L(info.name) : null;
  if (common && code && squash(common) === squash(code)) common = null;
  const byCatalog = state.names === "catalog";
  const name = (byCatalog ? code || common : common || code) || spaced(o.id);
  // a második sor a másik megnevezés – ha van egyáltalán
  const alt = byCatalog ? (code ? common : null) : (common ? codes.join(" · ") : null);
  const cat = CATALOG_ID_RE.exec(o.id);
  return {
    ...o,
    info,
    name,
    alt: alt || null,
    code,
    common,
    category: info?.category || "other",
    kind: info?.kind || ({ solar: "solar", atmosphere: "atmosphere" }[info?.category] || "other"),
    messierNo: cat?.[1] === "M" ? Number(cat[2]) : null,
  };
}

/** Egyesíti a fájlrendszerből jött csoportot az adatbázis-bejegyzéssel.
    A csak helyben elérhető elemeket (videók) a publikált oldalon kihagyjuk,
    és a darabszámot is újraszámoljuk, hogy ne ígérjünk többet a valóságnál. */
function merged(group) {
  const key = group.id.toUpperCase();
  const info = state.db.get(key) || state.messierInfo.get(key) || null;
  const items = IS_LOCAL ? group.items : group.items.filter((it) => !it.localOnly);
  return decorate({
    ...group,
    items,
    count: items.length,
    bytes: items.reduce((sum, it) => sum + (it.bytes || 0), 0),
  }, info);
}

const allObjects = () =>
  (state.library.objects || []).map(merged).filter((o) => o.count > 0);

/** Kép nélküli objektum (pl. még le nem fotózott Messier-tag) helykitöltő lapja. */
function virtualObject(id) {
  const key = String(id).toUpperCase();
  const info = state.db.get(key) || state.messierInfo.get(key);
  if (!info) return null;
  return decorate({ id: key, items: [], count: 0, bytes: 0, latest: null, cover: null,
                    accent: "#39405a", virtual: true }, info);
}

const findObject = (id) => allObjects().find((x) => x.id === id) || virtualObject(id);

/** A Messier-katalógus sorai: minden tag, a saját albumobjektummal (ha van). */
function messierRows() {
  const album = new Map();
  for (const o of allObjects()) {
    if (o.messierNo) album.set(o.messierNo, o);
    // más azonosítón tárolt objektum, aminek Messier-aliasa van (pl. "M 27")
    for (const a of o.info?.aliases || []) {
      const m = /^M\s?(\d+)$/i.exec(a);
      if (m && !album.has(Number(m[1]))) album.set(Number(m[1]), o);
    }
  }
  return state.messier.map((m) => {
    const own = album.get(m.n);
    return own ? { n: m.n, obj: own, have: true }
               : { n: m.n, obj: virtualObject(`M${m.n}`), have: false };
  });
}

function matchesQuery(o, q) {
  if (!q) return true;
  const info = o.info;
  const hay = [
    o.id, o.name, o.alt, o.code,
    info?.name?.hu, info?.name?.en,
    info && L(info.constellation), info && L(info.type),
    ...(info?.aliases || []),
    ...o.items.map((i) => i.name),
  ].join(" ").toLowerCase();
  // "m 31" és "m31" ugyanazt találja meg
  return hay.includes(q) || hay.replace(/\s+/g, "").includes(q.replace(/\s+/g, ""));
}

function visibleMessier() {
  const q = state.query.trim().toLowerCase();
  return messierRows().filter((r) =>
    r.obj &&
    (state.mfilter === "all" || (state.mfilter === "have") === r.have) &&
    (state.filter === "all" || r.obj.kind === state.filter) &&
    matchesQuery(r.obj, q));
}

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

  if (state.filter !== "all") list = list.filter((o) => o.kind === state.filter);
  if (q) list = list.filter((o) => matchesQuery(o, q));

  const by = {
    catalog: (a, b) => {
      const x = catalogRank(a), y = catalogRank(b);
      return x[0] - y[0] || x[1] - y[1] || a.name.localeCompare(b.name, locale());
    },
    name:   (a, b) => a.name.localeCompare(b.name, locale(), { numeric: true }),
    count:  (a, b) => b.count - a.count || a.name.localeCompare(b.name, locale()),
    latest: (a, b) => String(b.latest).localeCompare(String(a.latest)),
    size:   (a, b) => b.bytes - a.bytes,
  };
  return list.sort(by[state.sort] || by.name);
}

/* --- automatikus összehasonlító kép adatlap nélküli objektumhoz ----------- *
 * Ha egy objektumhoz nincs kézzel felvett referenciakép, a Wikipédia
 * vezérképét használjuk. A szerzőt és a licencet a Wikimedia Commonstól
 * kérdezzük le, hogy a forrásmegjelölés pontos legyen.                      */

const autoRefs = new Map();          // objektum-azonosító -> referencia vagy null

/** A Commons fájlnév kiszedése egy upload.wikimedia.org címből.
    A Wikipédia lekérdezőparamétert fűz a végére, azt le kell vágni. */
function commonsFileFromUrl(url) {
  const clean = String(url || "").split(/[?#]/)[0];
  const m = /\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+)/.exec(clean);
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch (_) { return m[1]; }
}

async function commonsCredit(file) {
  try {
    const api = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*"
      + "&prop=imageinfo&iiprop=extmetadata&titles=" + encodeURIComponent("File:" + file);
    const res = await fetch(api);
    if (!res.ok) return null;
    const pages = (await res.json())?.query?.pages || {};
    const info = Object.values(pages)[0]?.imageinfo?.[0]?.extmetadata;
    if (!info) return null;
    const strip = (v) => String(v?.value || "").replace(/<[^>]+>/g, "").trim();
    return { artist: strip(info.Artist), license: strip(info.LicenseShortName) };
  } catch (_) {
    return null;
  }
}

/** A Wikipédia-összefoglalóból összeállít egy összehasonlító képet. */
function deriveAutoReference(obj, summary) {
  if (obj.info?.reference || autoRefs.has(obj.id)) return;
  const url = summary?.original || summary?.thumb;
  if (!url) { autoRefs.set(obj.id, null); return; }

  const ref = {
    url,
    kind: "amateur",
    credit: summary.title ? `${summary.title} – Wikipédia` : "Wikipédia",
    license: "",
    page: summary.page,
    telescope: { hu: "A Wikipédia szócikk vezérképe", en: "Wikipedia article lead image" },
  };
  autoRefs.set(obj.id, ref);
  if (vw.obj?.id === obj.id) {
    // ha eleve összehasonlító linkre érkeztek, most már meg tudjuk mutatni
    if (state.route.mode === "compare") vw.mode = "compare";
    applyModeUI();
    if (vw.compare) {
      renderComparePane();
      renderViewerSide();
    }
  }

  const file = commonsFileFromUrl(url);
  if (file) {
    ref.commonsFile = file;
    commonsCredit(file).then((meta) => {
      if (!meta) return;
      if (meta.artist) ref.credit = meta.artist;
      if (meta.license) ref.license = meta.license;
      if (vw.obj?.id === obj.id && vw.compare) renderViewerSide();
    });
  }
}

/* --- "ÚJ" jelölés: mit nem nyitott még meg a látogató --------------------- *
 * A böngésző localStorage-ában tartjuk a már megnyitott felvételek listáját.
 * Első látogatáskor az egész album "megnézettnek" számít – így csak az ezután
 * felkerülő képek kapnak jelölést, nem árasztja el a nézőt 66 db ÚJ címke.  */

const SEEN_KEY = "miki:seen";
let seen = new Set();

function persistSeen() {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch (_) {}
}

function loadSeen() {
  const alive = new Set(allObjects().flatMap((o) => o.items.map((it) => it.file)));
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(SEEN_KEY) || "null"); } catch (_) {}

  if (!Array.isArray(stored)) {              // első látogatás → ez a kiindulópont
    seen = alive;
    persistSeen();
    return;
  }
  // a törölt fájlok bejegyzéseit kidobjuk, hogy ne nőjön a végtelenségig
  seen = new Set(stored.filter((f) => alive.has(f)));
  if (seen.size !== stored.length) persistSeen();
}

const isNew = (item) => !!item && !seen.has(item.file);
const unseenCount = (o) => o.items.reduce((n, it) => n + (isNew(it) ? 1 : 0), 0);
const totalUnseen = () => allObjects().reduce((n, o) => n + unseenCount(o), 0);

function markSeen(item) {
  if (!item || seen.has(item.file)) return;
  seen.add(item.file);
  persistSeen();
  refreshNewBadges();
}

/** A jelöléseket helyben frissítjük, hogy ne kelljen újrarajzolni az oldalt. */
function refreshNewBadges() {
  $$(".shot").forEach((el) => {
    const obj = allObjects().find((o) => o.id === el.dataset.obj);
    const item = obj?.items[Number(el.dataset.idx)];
    el.classList.toggle("is-new", isNew(item));
  });
  $$(".card[data-go], .mcard[data-go]").forEach((el) => {
    const obj = allObjects().find((o) => o.id === el.dataset.go);
    const chip = $(".new-count", el);
    if (!obj || !chip) return;
    const n = unseenCount(obj);
    chip.textContent = t("newCount", n);
    chip.hidden = n === 0;
  });
  $$(".navitem[data-go]").forEach((el) => {
    const obj = allObjects().find((o) => o.id === el.dataset.go);
    const dot = $(".new-dot", el);
    if (dot) dot.hidden = !obj || unseenCount(obj) === 0;
  });
  const line = $("#newLine");
  if (line) {
    const n = totalUnseen();
    line.textContent = n ? ` · ${t("newInAlbum", n)}` : "";
  }
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
      original: j.originalimage?.source || null,
    };
  } catch (_) {
    return null;                        // nincs net – marad a saját leírás
  }
}

/** Szócikkcím-tippek katalógusjelből, ha nincs adatlap az objektumhoz.
    Az "M10" például "Messier 10" néven van fent, nem "M 10" néven. */
function wikiTitleGuesses(id) {
  const s = String(id).toUpperCase();
  let m;
  if ((m = /^M(\d+)$/.exec(s))) return [`Messier ${m[1]}`, `M ${m[1]}`];
  // A Caldwell-szam NEM azonos az NGC-szammal (C20 = NGC 7000), ezert itt
  // nincs NGC-tartalek: rossz objektumot hozna be.
  if ((m = /^C(\d+)$/.exec(s))) return [`Caldwell ${m[1]}`];
  if ((m = /^SH2-(\d+)$/.exec(s))) return [`Sh2-${m[1]}`, `Sharpless ${m[1]}`];
  if ((m = /^(NGC|IC|UGC|PGC|LDN|LBN|ABELL|HCG|CR|MEL|VDB)(\d+)$/.exec(s))) {
    const cat = m[1] === "ABELL" ? "Abell" : m[1];
    return [`${cat} ${m[2]}`];
  }
  return [spaced(s)];
}

async function wikiSummary(obj) {
  const key = `miki:wiki:${lang}:${obj.id}`;
  try {
    const hit = JSON.parse(localStorage.getItem(key) || "null");
    if (hit && Date.now() - hit.t < WIKI_TTL) { deriveAutoReference(obj, hit.d); return hit.d; }
  } catch (_) {}

  const guesses = obj.info ? null : wikiTitleGuesses(obj.id);
  const titles = {
    hu: obj.info?.wiki?.hu || (guesses ? guesses[0] : null),
    en: obj.info?.wiki?.en || (guesses ? guesses[0] : null),
  };
  const first = lang, second = lang === "hu" ? "en" : "hu";

  let best = titles[first] ? await wikiFetch(first, titles[first]) : null;
  // a magyar szócikkek gyakran csak tőmondatok – ilyenkor a másik nyelv többet ad
  if (titles[second] && (!best || best.extract.length < 220)) {
    const alt = await wikiFetch(second, titles[second]);
    if (alt && (!best || alt.extract.length > best.extract.length)) best = alt;
  }
  // adatlap nélküli objektumnál a további tippeket is végigpróbáljuk, és a
  // tőmondatos találatot (egyértelműsítő lap) nem fogadjuk el
  if (guesses) {
    for (const title of guesses.slice(1)) {
      if (best && best.extract.length >= 120) break;
      const alt = (await wikiFetch(lang, title)) || (await wikiFetch(second, title));
      if (alt && (!best || alt.extract.length > best.extract.length)) best = alt;
    }
    if (best && best.extract.length < 60) best = null;
  }

  if (best) {
    try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: best })); } catch (_) {}
    deriveAutoReference(obj, best);
  }
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
    <button class="shot${isNew(item) ? " is-new" : ""}" data-obj="${esc(obj.id)}" data-idx="${index}"
            style="animation-delay:${delay}ms">
      <span class="new-tag">${esc(t("newTag"))}</span>
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
          <span class="badge">${esc(o.code || o.id)}</span>
          <span class="badge new-count" ${unseenCount(o) ? "" : "hidden"}>${esc(t("newCount", unseenCount(o)))}</span>
          <span class="badge count accent">${o.count}</span>
        </span>
      </span>
      <span class="card-body">
        <span class="card-title">${esc(o.name)}</span>
        <span class="card-sub">${o.alt ? `<span class="card-alt">${esc(o.alt)}</span><i class="dot"></i>` : ""}<i>${esc(dateLabel(o.latest))}</i></span>
      </span>
    </button>`;
}

/** Egy Messier-csempe: ha van saját kép, színes; ha nincs, szürke helykitöltő. */
function messierCard(r, index) {
  const o = r.obj;
  const type = L(o.info?.type);
  const title = o.common || type;
  const sub = [o.common ? type : null, L(o.info?.constellation)].filter(Boolean).join(" · ");
  return `
    <button class="mcard${r.have ? "" : " missing"}" data-go="${esc(o.id)}"
            style="animation-delay:${Math.min(index, 40) * 18}ms;--accent-glow:${esc(o.accent || "#5eead4")}88">
      <span class="mcard-media">
        ${r.have && o.cover
          ? `<img src="${url(o.cover)}" alt="${esc(o.name)}" loading="lazy" decoding="async"
               style="${o.blur ? `background-image:url(${o.blur});background-size:cover` : ""}">`
          : `<span class="mcard-ph" data-kind="${esc(o.kind)}"></span>`}
        <span class="mcard-no">M${r.n}</span>
        ${r.have ? `<span class="badge count accent">${o.count}</span>` : ""}
      </span>
      <span class="mcard-body">
        <span class="mcard-title">${esc(title)}</span>
        <span class="mcard-sub">${esc(sub)}</span>
      </span>
    </button>`;
}

/* --- oldalsáv ------------------------------------------------------------ */

/** Album / Messier váltó az oldalsáv tetején, a darabszámokkal. */
function renderViews() {
  const have = messierRows().filter((r) => r.have).length;
  const views = [
    ["album", "#/", t("viewAlbum"), String(allObjects().length)],
    ["messier", "#/messier", "Messier", `${have}/${state.messier.length}`],
  ];
  $("#views").innerHTML = views.map(([key, href, label, n]) => `
    <a class="view-tab ${state.section === key ? "on" : ""}" href="${href}">
      <span>${esc(label)}</span><b>${esc(n)}</b></a>`).join("");
}

function renderChips() {
  // a darabszám a kiválasztott nézetre vonatkozik (album vagy Messier)
  const base = state.section === "messier"
    ? messierRows().filter((r) => r.obj && (state.mfilter === "all" || (state.mfilter === "have") === r.have)).map((r) => r.obj)
    : allObjects();
  const counts = {};
  for (const o of base) counts[o.kind] = (counts[o.kind] || 0) + 1;
  $("#chips").innerHTML = ["all", ...KIND_KEYS]
    .filter((k) => k === "all" || counts[k])
    .map((k) => `<button class="chip ${state.filter === k ? "on" : ""}" data-cat="${k}">${esc(t(k))}${
      k === "all" ? "" : ` <em>${counts[k]}</em>`}</button>`)
    .join("");
}

function navItem(o, missing = false) {
  return `
    <button class="navitem ${state.route.id === o.id ? "on" : ""}${missing ? " missing" : ""}" data-go="${esc(o.id)}">
      ${o.cover && !missing
        ? `<img class="navitem-thumb" src="${url(o.cover)}" alt="" loading="lazy">`
        : missing
          ? `<span class="navitem-thumb ph">${esc(o.code || "")}</span>`
          : `<span class="navitem-thumb" style="background:linear-gradient(135deg,${esc(o.accent || "#39405a")},#11151f)"></span>`}
      <span class="navitem-txt">
        <span class="navitem-name">${esc(o.name)}</span>
        <span class="navitem-meta">${esc(o.alt || (o.code && o.code !== o.name ? o.code : "") || L(o.info?.type) || o.id)}</span>
      </span>
      <span class="new-dot" ${!missing && unseenCount(o) ? "" : "hidden"}></span>
      <span class="navitem-count">${missing ? "–" : o.count}</span>
    </button>`;
}

function renderSidebar() {
  renderViews();
  const messier = state.section === "messier";
  const html = messier
    ? visibleMessier().map((r) => navItem(r.obj, !r.have)).join("")
    : visibleObjects().map((o) => navItem(o)).join("");
  $("#navLabel").textContent = messier ? t("viewMessier") : t("objects");
  $("#objlist").innerHTML = html || `<div class="note" style="padding:12px 8px">${esc(t("noResults"))}</div>`;

  const s = visibleStats();
  $("#sidefoot").innerHTML = `
    <div><b>${s.objects ?? 0}</b> ${esc(t("footObjects"))} &middot; <b>${s.files ?? 0}</b> ${esc(t("footShots"))}</div>
    <div><b>${bytes(s.bytes || 0)}</b> ${esc(t("footData"))}</div>
    <div>${esc(t("footScanned"))}: ${esc(dateLabel(state.library.generated) || "–")}</div>`;
}

/** A HTML-ben statikusan elhelyezett feliratok frissítése nyelvváltáskor. */
function renderStatic() {
  renderPublishHint();
  document.documentElement.lang = lang;
  $("#search").placeholder = t("searchPh");
  $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$("[data-i18n-title]").forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  $$("#langs button").forEach((b) => b.classList.toggle("on", b.dataset.lang === lang));

  const sort = $("#sort");
  sort.innerHTML = [["name", "sortName"], ["catalog", "sortCatalog"], ["count", "sortCount"],
                    ["latest", "sortLatest"], ["size", "sortSize"]]
    .map(([v, k]) => `<option value="${v}">${esc(t(k))}</option>`).join("");
  sort.value = state.sort;

  const names = $("#names");
  names.title = t("namesLabel");
  names.innerHTML = [["common", "namesCommon", "namesCommonTip"], ["catalog", "namesCatalog", "namesCatalogTip"]]
    .map(([v, k, tip]) => `<button data-names="${v}" class="${state.names === v ? "on" : ""}"
        title="${esc(t(tip))}">${esc(t(k))}</button>`).join("");
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
         <b>${s.files ?? 0}</b> ${esc(t("footShots"))}<b id="newLine"></b>${
           state.query ? ` &middot; ${esc(t("searchFor", state.query))}` : ""}</p>
      ${state.messier.length ? `<a class="hero-link" href="#/messier">${icon("star")} ${esc(t("messierLink",
         messierRows().filter((r) => r.have).length))} ${icon("next")}</a>` : ""}
    </section>
    ${list.length
      ? `<div class="grid">${list.map(objectCard).join("")}</div>`
      : `<div class="empty"><b>${esc(t("noResults"))}</b>${esc(t("noResultsSub"))}</div>`}
  `;

  $("#crumb").textContent = t("overview");
  $("#backBtn").style.display = "none";
  state.renderedId = "__home__";
  hydratePosters($("#content"));
  refreshNewBadges();
}

/* --- Messier-katalógus ---------------------------------------------------- */

function renderMessier() {
  const rows = messierRows();
  const have = rows.filter((r) => r.have).length;
  const list = visibleMessier();
  const pct = rows.length ? (have / rows.length) * 100 : 0;

  $("#content").innerHTML = `
    <section class="hero">
      <h1>${esc(t("messierTitle"))}</h1>
      <p>${esc(t("messierText"))}${state.query ? ` &middot; ${esc(t("searchFor", state.query))}` : ""}</p>
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${rows.length}" aria-valuenow="${have}">
        <div class="progress-bar" style="width:${pct.toFixed(1)}%"></div>
      </div>
      <div class="progress-row">
        <span><b>${have}</b> / ${rows.length} ${esc(t("messierDone"))}</span>
        <div class="seg" id="mfilter">${[["all", "mAll"], ["have", "mHave"], ["missing", "mMissing"]]
          .map(([v, k]) => `<button data-mfilter="${v}" class="${state.mfilter === v ? "on" : ""}">${esc(t(k))}</button>`)
          .join("")}</div>
      </div>
    </section>
    ${list.length
      ? `<div class="mgrid">${list.map(messierCard).join("")}</div>`
      : `<div class="empty"><b>${esc(t("noResults"))}</b>${esc(t("noResultsSub"))}</div>`}
  `;

  $("#crumb").textContent = t("messierTitle");
  $("#backBtn").style.display = "none";
  state.renderedId = "__messier__";
}

/* --- objektum-adatlap ---------------------------------------------------- */

function factRows(info) {
  const constellation = L(info.constellation);
  const codes = (info.aliases || []).filter((a) => CATALOG_ALIAS_RE.test(a));
  const rows = [
    [t("fCatalogs"), codes.length ? esc(codes.join(" · ")) : null],
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
  const o = findObject(id);
  if (!o) { location.hash = "#/"; return; }

  const info = o.info;
  const cover = o.items.find((i) => i.preview || i.thumb);
  const related = (info?.related || []).map(findObject).filter(Boolean);
  // helykitöltőnél (még nincs saját kép) a másik nyelvű név helyett a jelek
  const otherLang = info?.name ? (lang === "hu" ? info.name.en : info.name.hu) : null;
  const subtitle = state.names === "catalog" ? o.alt
    : (otherLang && otherLang !== o.name ? otherLang : null);
  const facts = info ? L(info.facts) : null;
  // az objektum legtöbb expozíciót tartalmazó felvétele képviseli a felszerelést
  const bestAcq = o.items.map((i) => i.acq).filter(Boolean)
    .sort((a, b) => (b.total || 0) - (a.total || 0))[0];
  // ha az objektumhoz több, eltérő expozíciós szett tartozik, mindet felsoroljuk
  const sessions = [...new Map(o.items.map((i) => i.acq)
    .filter((a) => a && acqFrames(a) > 1 && a.exposure)
    .sort((a, b) => (b.total || 0) - (a.total || 0))
    .map((a) => [`${acqFrames(a)}x${a.exposure}`, acqSummary(a)])).values()];

  $("#content").innerHTML = `
  <article class="detail">
    <header class="detail-hero${o.virtual ? " placeholder" : ""}">
      ${cover ? `<img src="${url(cover.preview || cover.thumb)}" alt="${esc(o.name)}">`
              : o.virtual ? `<span class="ph-code">${esc(o.code || o.id)}</span>` : ""}
      <div class="detail-hero-in">
        <div class="kicker">
          <span class="badge accent">${esc(o.code || o.id)}</span>
          ${info ? `<span>${esc(t(o.category))}</span><i class="dot"></i><span>${esc(L(info.type))}</span>`
                 : `<span>${esc(t("noProfile"))}</span>`}
        </div>
        <h1>${esc(o.name)}</h1>
        ${subtitle ? `<p class="en">${esc(subtitle)}</p>` : ""}
        ${info?.aliases?.length
          ? `<div class="aliases">${info.aliases.map((a) => `<span class="alias">${esc(a)}</span>`).join("")}</div>` : ""}
      </div>
    </header>

    ${o.virtual
      ? `<section class="panel notyet">${icon("telescope")}
           <div><b>${esc(t("notYet"))}</b><p>${esc(t("notYetText"))}</p></div></section>`
      : `<div class="shots">${o.items.map((it, i) => shotCard(o, it, i, i * 35)).join("")}</div>`}

    <details class="details-box"${o.virtual ? " open" : ""}>
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

        ${o.virtual ? "" : `
        <section class="panel">
          <h3>${icon("folder")} ${esc(t("myStuff"))}</h3>
          <dl class="kv">
            <div class="kv-row"><dt>${esc(t("fShots"))}</dt><dd>${o.count} ${esc(t("count"))}</dd></div>
            <div class="kv-row"><dt>${esc(t("fBytes"))}</dt><dd>${esc(bytes(o.bytes))}</dd></div>
            <div class="kv-row"><dt>${esc(t("fLatest"))}</dt><dd>${esc(dateLabel(o.latest))}</dd></div>
          </dl>
        </section>`}

        ${bestAcq && acqRows(bestAcq) ? `
          <section class="panel">
            <h3>${icon("telescope")} ${esc(t("acquisition"))}
              ${bestAcq.estimated ? `<span class="est-chip">${esc(t("estimated"))}</span>` : ""}</h3>
            ${sessions.length > 1 ? `<dl class="kv"><div class="kv-row"><dt>${esc(t("aSessions"))}</dt>
              <dd>${sessions.map(esc).join("<br>")}</dd></div></dl>` : ""}
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

  $("#crumb").innerHTML = `<span>${esc(state.section === "messier" ? t("messierTitle") : t("object"))} /</span> ${esc(o.name)}`;
  $("#backBtn").style.display = "";
  state.renderedId = o.id;
  hydratePosters($("#content"));
  refreshNewBadges();
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

/* Lapozási kör: mihez tartozzon a nyilakkal bejárható sorozat.
   – similar: ugyanolyan típusú objektumok (galaxis → galaxis), katalógus szerint,
     a Messier-nézetben viszont a Messier-sorrend,
   – list:    minden, ami a bal oldali listában látszik, annak sorrendjében,
   – object:  csak az éppen nézett objektum felvételei.                        */
const SCOPES = ["similar", "list", "object"];

const vw = {
  el: null, obj: null, items: [], index: 0,
  mode: "photo",
  compare: false,                                   // származtatott: mode === "compare"
  prefMode: localStorage.getItem("miki:mode") === "info" ? "info" : "photo",
  scope: SCOPES.includes(localStorage.getItem("miki:scope")) ? localStorage.getItem("miki:scope") : "similar",
  seq: [], seqPos: 0,
  pushed: false,
  img: null, scale: 1, tx: 0, ty: 0,
  hd: false, hdLoading: false,      // betöltött-e már a nagyfelbontású változat
  pointers: new Map(),              // csippentéshez: az éppen lenyomott ujjak
};

function currentItem() { return vw.items[vw.index]; }

function referenceOf(obj) {
  return obj?.info?.reference || autoRefs.get(obj?.id) || null;
}

/** A referenciakép címe: Commons-fájlnévből vagy közvetlen URL-ből. */
function refImageUrl(ref, width) {
  return ref.file ? commonsImage(ref.file, width) : ref.url;
}

/** Hova mutasson a "forrás" gomb: Commons fájloldal vagy a szócikk. */
function refSourceUrl(ref) {
  if (ref.file) return commonsPage(ref.file);
  if (ref.commonsFile) return commonsPage(ref.commonsFile);
  return ref.page || "";
}

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

/** Meddig lehet nagyítani: a legnagyobb elérhető változat pixelpontos nézetéig
    (plusz egy kis ráhagyás, hogy a részletek szabad szemmel is kényelmesek legyenek). */
function maxZoom(item) {
  const fit = paintedSize(item);
  const px = item?.zoom ? (item.zoomW || item.w) : Math.min(item?.w || 0, PREVIEW_PX);
  if (!fit.w || !px) return 6;
  return Math.max(2, Math.min(14, (px / fit.w) * 1.35));
}

/** Az a nagyítás, ahol a kép pixelei éppen a képernyő pixeleire esnek. */
function oneToOneZoom(item) {
  const fit = paintedSize(item);
  const px = item?.zoom ? (item.zoomW || item.w) : Math.min(item?.w || 0, PREVIEW_PX);
  if (!fit.w || !px) return 2;
  return Math.max(1, Math.min(maxZoom(item), px / fit.w));
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
  if (vw.scale > 1.15) ensureHD();          // nagyításkor jöjjön a részletgazdag kép
  updateZoomUI();
}

function resetZoom() {
  vw.scale = 1; vw.tx = 0; vw.ty = 0;
  if (vw.img) { vw.img.style.transform = ""; vw.img.classList.remove("zoomed"); }
  updateZoomUI();
}

function zoomAt(clientX, clientY, next) {
  if (!vw.img || vw.compare) return;
  next = Math.min(maxZoom(currentItem()), Math.max(1, next));
  const rect = $("#vwMine").getBoundingClientRect();
  const ox = (clientX - (rect.left + rect.width / 2) - vw.tx) / vw.scale;
  const oy = (clientY - (rect.top + rect.height / 2) - vw.ty) / vw.scale;
  vw.tx += ox * (vw.scale - next);
  vw.ty += oy * (vw.scale - next);
  vw.scale = next;
  if (vw.scale <= 1.01) resetZoom();
  else applyZoom();
}

/** Nagyítás a kép közepéből (gombok, billentyűzet). */
function zoomBy(factor) {
  const rect = $("#vwMine").getBoundingClientRect();
  zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, vw.scale * factor);
}

/** A nagyfelbontású változat betöltése – csak ha tényleg belenagyítanak,
    hogy a lapozás ne töltsön le fölöslegesen több megabájtot. */
function ensureHD() {
  const item = currentItem();
  if (!item || !item.zoom || vw.hd || vw.hdLoading || item.kind === "video") return;
  vw.hdLoading = true;
  setHdChip("loading");
  const pre = new Image();
  pre.onload = () => {
    vw.hdLoading = false;
    if (currentItem() !== item || !vw.img) return;   // közben lapoztak
    vw.hd = true;
    vw.img.src = pre.src;
    setHdChip("ready");
    updateZoomUI();
  };
  pre.onerror = () => { vw.hdLoading = false; setHdChip(""); };
  pre.src = url(item.zoom);
}

function setHdChip(mode) {
  const chip = $("#vwHd");
  if (!chip) return;
  chip.hidden = !mode;
  chip.classList.toggle("loading", mode === "loading");
  chip.textContent = mode === "loading" ? t("hdLoading") : mode === "ready" ? t("hdReady") : "";
}

/** A nagyítás gombsorának frissítése: százalék, tiltott gombok. */
function updateZoomUI() {
  const box = $("#vwZoom");
  if (!box) return;
  const item = currentItem();
  const usable = !!vw.img && !vw.compare && item?.kind !== "video";
  box.hidden = !usable;
  if (!usable) return;
  const max = maxZoom(item);
  $("#vwZoomVal").textContent = Math.round(vw.scale * 100) + "%";
  $$("#vwZoom [data-zoom]").forEach((b) => {
    if (b.dataset.zoom === "out") b.disabled = vw.scale <= 1.01;
    if (b.dataset.zoom === "in") b.disabled = vw.scale >= max - 0.01;
    if (b.dataset.zoom === "fit") b.disabled = vw.scale <= 1.01;
  });
}

/* --- összehasonlító panel ------------------------------------------------- */

function renderComparePane() {
  const ref = referenceOf(vw.obj);
  const pane = $("#vwPro");
  const img = $("#vwProImg");
  const stateBox = $("#vwProState");

  if (!vw.compare || !ref) {
    // ne maradjon bent az elozo objektum kepe es cimkeje
    pane.classList.remove("on");
    img.removeAttribute("src");
    img.dataset.src = "";
    $("#vwTagPro").textContent = "";
    return;
  }
  pane.classList.add("on");

  $("#vwTagPro").innerHTML =
    `<b>${esc(L(ref.telescope))}</b><span>${esc(ref.credit)}</span>`;

  const src = refImageUrl(ref, 1600);
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
      <span class="badge accent">${esc(o.code || o.id)}</span>
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
        <p class="vw-credit">${esc(t("credit"))}: ${esc(ref.credit)}${
          ref.license ? " · " + esc(ref.license) : ""}</p>
        ${refSourceUrl(ref) ? `<a class="btn" href="${esc(refSourceUrl(ref))}" target="_blank" rel="noopener">
          ${icon("open")} ${esc(t("viewOnCommons"))}</a>` : ""}
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
  vw.img = null;
  vw.hd = false;
  vw.hdLoading = false;
  setHdChip("");
  resetZoom();

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

  markSeen(item);                            // ettől tűnik el róla az ÚJ jelölés
  $("#vwTagMine").innerHTML = `<b>${esc(t("mine"))}</b><span>${esc(prettyLabel(item.label))}</span>`;
  $("#vwTitle").textContent = item.name;
  $("#vwMeta").innerHTML = [
    acqSummary(item.acq), px(item.w, item.h), bytes(item.bytes), dateLabel(item.mtime),
    item.zoom ? t("previewNote") : "",
  ].filter(Boolean).map(esc).join(' <i class="dot"></i> ');

  // körbeér, ezért a nyilak sosem tiltottak
  $("#vwPrev").disabled = vw.seq.length < 2;
  $("#vwNext").disabled = vw.seq.length < 2;

  // publikált oldalon nincs eredeti fájl, de a nagyfelbontású változat megnyitható
  const open = $("#vwOpen");
  open.hidden = !IS_LOCAL && !(item.zoom || item.preview || item.web);
  $("span", open).textContent = IS_LOCAL ? t("original") : t("fullRes");
  updateZoomUI();
  renderBrowse();

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

  vw.seq = buildSequence(o);
  vw.seqPos = vw.seq.findIndex((s) => s.id === objId && s.i === index);
  if (vw.seqPos < 0) {                     // szűrő miatt kiesett – csak ezen az objektumon lapozunk
    vw.seq = o.items.map((_it, i) => ({ id: objId, i }));
    vw.seqPos = index;
  }

  // adatlap nélküli objektumnál a Wikipédiából szerezzük az összehasonlító
  // képet – objektumok közti lapozáskor az oldal nem rajzolódik újra,
  // ezért a lekérdezést itt is elindítjuk
  if (!o.info?.reference && !autoRefs.has(o.id)) wikiSummary(o);

  vw.el.classList.add("open");
  document.body.classList.add("no-scroll");
  applyModeUI();

  if (sameShot) {                          // csak a mód váltott
    $("#vwStage").classList.toggle("zoomable", !vw.compare && currentItem().kind !== "video");
    resetZoom();
    renderComparePane();
    renderViewerSide();
    renderBrowse();
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
  vw.pointers.clear();
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

/** Az a lista, amiből a lapozás sorozata készül: a Messier-nézetből nyitva a
    lefotózott Messier-objektumok szám szerint, különben a látható album. */
function browseBase() {
  if (state.section === "messier") {
    const seen = new Set();
    return messierRows().filter((r) => r.have).map((r) => r.obj)
      .filter((o) => !seen.has(o.id) && seen.add(o.id));
  }
  return visibleObjects();
}

/** A lapozási körbe tartozó objektumok, a választott körnek megfelelően. */
function sequenceObjects(obj) {
  if (!obj) return [];
  if (vw.scope === "object") return [obj];
  let list = browseBase();
  if (vw.scope === "similar" && state.section !== "messier") {
    const same = list.filter((o) => o.kind === obj.kind);
    if (same.length > 1) {
      list = same.slice().sort((a, b) => {
        const x = catalogRank(a), y = catalogRank(b);
        return x[0] - y[0] || x[1] - y[1] || a.name.localeCompare(b.name, locale());
      });
    }
  }
  // szűrő miatt kieshetett az éppen nézett objektum – az mindig maradjon benne
  if (!list.some((o) => o.id === obj.id)) list = [obj, ...list];
  return list;
}

/** A lapozási kör összes felvétele egyetlen sorozatban – így a nyilakkal
    át lehet lapozni a következő objektumra is, de nem összevissza. */
function buildSequence(obj) {
  return sequenceObjects(obj).flatMap((o) => o.items.map((_it, i) => ({ id: o.id, i })));
}

/** A lapozósáv: melyik körben vagyunk, és hol tartunk benne. */
function renderBrowse() {
  const box = $("#vwBrowse");
  if (!box || !vw.obj) return;
  const objs = sequenceObjects(vw.obj);
  const at = objs.findIndex((o) => o.id === vw.obj.id);
  // ha egy típusból csak egy objektum van, a "hasonló" kör az egész listára esik
  // vissza – ilyenkor a felirat is azt mondja, ne a típust ígérje
  const sameKind = objs.length > 1 && objs.every((o) => o.kind === vw.obj.kind);
  const listLabel = state.section === "messier" ? t("messierTitle") : t("viewAlbum");
  const label = vw.scope === "object" ? vw.obj.name
    : vw.scope === "similar" && sameKind && state.section !== "messier" ? t(vw.obj.kind)
    : listLabel;
  box.innerHTML = `
    <span class="vw-browse-label">${esc(t("browse"))}</span>
    <div class="seg">${SCOPES.map((sc) => `<button data-scope="${sc}"
        class="${vw.scope === sc ? "on" : ""}" title="${esc(t(sc === "similar" ? "scopeSimilarTip"
          : sc === "list" ? "scopeListTip" : "scopeObjectTip"))}">${esc(t(sc === "similar" ? "scopeSimilar"
          : sc === "list" ? "scopeList" : "scopeObject"))}</button>`).join("")}</div>
    <span class="vw-browse-pos">${esc(label)}${objs.length > 1
      ? ` <i class="dot"></i> ${at + 1} / ${objs.length} ${esc(t("objectsUnit"))}` : ""}
      <i class="dot"></i> ${vw.seqPos + 1} / ${vw.seq.length} ${esc(t("shotsUnit"))}</span>`;
}

function setScope(next) {
  if (!SCOPES.includes(next) || next === vw.scope || !vw.obj) return;
  vw.scope = next;
  localStorage.setItem("miki:scope", next);
  vw.seq = buildSequence(vw.obj);
  const at = vw.seq.findIndex((s) => s.id === vw.obj.id && s.i === vw.index);
  vw.seqPos = at < 0 ? 0 : at;
  renderBrowse();
  renderViewerSide();
}

/** Lapozás a teljes album sorrendjében – az utolsó után az elsőre ér körbe. */
function step(delta) {
  if (!vw.seq.length) return;
  const pos = (vw.seqPos + delta + vw.seq.length) % vw.seq.length;
  const next = vw.seq[pos];
  // lapozás ne szemetelje tele az előzményeket, de a mód maradjon meg
  gotoShot(next.id, next.i, true, vw.mode);
}

/** Ugrás a következő/előző objektum első képére – szintén körbeér. */
function stepObject(delta) {
  const list = sequenceObjects(vw.obj);
  if (list.length < 2) return;
  const at = list.findIndex((o) => o.id === vw.obj?.id);
  const next = list[((at < 0 ? 0 : at) + delta + list.length) % list.length];
  gotoShot(next.id, 0, true, vw.mode);
}

/** Egy befejezett húzásból eldönti, mi történjen.
    Vízszintes = kép a soron belül, függőleges = másik objektum.
    Igazzal tér vissza, ha lapozott – ilyenkor nincs nagyítás. */
function swipeAction(dx, dy, width, height) {
  const minX = Math.max(40, width * 0.07);
  const minY = Math.max(55, height * 0.12);
  if (Math.abs(dx) > minX && Math.abs(dx) > Math.abs(dy) * 1.4) {
    step(dx < 0 ? 1 : -1);                   // balra húzás = következő kép
    return true;
  }
  if (Math.abs(dy) > minY && Math.abs(dy) > Math.abs(dx) * 1.4) {
    stepObject(dy < 0 ? 1 : -1);             // felfelé húzás = következő objektum
    return true;
  }
  return false;
}

async function shellAction(action) {
  const item = currentItem();
  if (!item) return;
  // publikált oldalon az eredeti nincs fent: a legnagyobb webes változat nyílik meg
  if (!IS_LOCAL) { window.open(url(item.zoom || item.preview || item.file), "_blank"); return; }
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
  else if (state.route.view === "messier") renderMessier();
  else renderHome();
}

/** A lista-nézet címe, ahová a Vissza gomb visz. */
const sectionHash = () => (state.section === "messier" ? "#/messier" : "#/");

function applyHash() {
  const m = location.hash.match(/^#\/o\/([^/]+)(?:\/(\d+))?(?:\/(info|compare))?/);
  const prevSection = state.section;
  if (m) {
    state.route = { view: "object", id: decodeURIComponent(m[1]).toUpperCase(),
                    shot: m[2] === undefined ? null : Number(m[2]), mode: m[3] || null };
    // kép nélküli (helykitöltő) lap csak a Messier-katalógusból nyílhat
    if (!allObjects().some((o) => o.id === state.route.id)) state.section = "messier";
  } else if (/^#\/messier\b/.test(location.hash)) {
    state.route = { view: "messier", id: null, shot: null, mode: null };
    state.section = "messier";
  } else {
    state.route = { view: "home", id: null, shot: null, mode: null };
    state.section = "album";
  }
  if (prevSection !== state.section) renderChips();

  // Objektumok közti lapozás közben a háttéroldalt nem rajzoljuk újra – a
  // nézegető úgyis eltakarja, és így nem indul fölösleges Wikipédia-kérés.
  const wantedPage = state.route.view === "home" ? "__home__"
    : state.route.view === "messier" ? "__messier__" : state.route.id;
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

  $("#backBtn").addEventListener("click", () => { location.hash = sectionHash(); });
  $("#navToggle").addEventListener("click", () => document.body.classList.toggle("nav-open"));
  $("#scrim").addEventListener("click", () => document.body.classList.remove("nav-open"));

  $("#search").addEventListener("input", (e) => {
    state.query = e.target.value;
    if (state.route.view === "object" && state.query) location.hash = sectionHash();
    else {
      renderSidebar();
      if (state.route.view === "home") renderHome();
      else if (state.route.view === "messier") renderMessier();
    }
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
    if (state.route.view === "object") location.hash = sectionHash();
    else render();
  });

  $("#names").addEventListener("click", (e) => {
    const b = e.target.closest("[data-names]");
    if (!b || b.dataset.names === state.names) return;
    state.names = b.dataset.names;
    localStorage.setItem("miki:names", state.names);
    render();
  });

  $("#content").addEventListener("click", (e) => {
    const b = e.target.closest("[data-mfilter]");
    if (!b) return;
    state.mfilter = b.dataset.mfilter;
    renderChips();
    renderSidebar();
    renderMessier();
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

  $("#vwZoom").addEventListener("click", (e) => {
    const b = e.target.closest("[data-zoom]");
    if (!b) return;
    const item = currentItem();
    if (b.dataset.zoom === "in") { ensureHD(); zoomBy(1.6); }
    else if (b.dataset.zoom === "out") zoomBy(1 / 1.6);
    else if (b.dataset.zoom === "fit") resetZoom();
    else if (b.dataset.zoom === "one") {
      ensureHD();
      zoomAt(window.innerWidth / 2, window.innerHeight / 2, oneToOneZoom(item));
    }
  });

  $("#vwBrowse").addEventListener("click", (e) => {
    const b = e.target.closest("[data-scope]");
    if (b) setScope(b.dataset.scope);
  });

  /* Egy gesztus négyféle lehet:
     – két ujjal csippentés = nagyítás,
     – nagyítva húzás       = a kép mozgatása,
     – vízszintes húzás     = lapozás (mobilon swipe, mindhárom módban),
     – rövid koppintás      = nagyítás ki/be.                               */
  let gesture = null;
  let pinch = null;

  const pinchInfo = () => {
    const [a, b] = [...vw.pointers.values()];
    return {
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      x: (a.x + b.x) / 2, y: (a.y + b.y) / 2,
    };
  };

  stage.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    if (e.target.closest("video, .vw-nav, .vw-zoom")) return;  // vezérlők maradjanak
    vw.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (vw.pointers.size === 2 && vw.img && !vw.compare) {
      gesture = null;                       // a csippentés elnyomja a húzást
      const info = pinchInfo();
      pinch = { dist: info.dist, scale: vw.scale };
      ensureHD();
      return;
    }
    if (vw.pointers.size > 1) return;

    gesture = {
      x: e.clientX, y: e.clientY, tx: vw.tx, ty: vw.ty,
      onImage: e.target === vw.img,
      panning: vw.scale > 1.01 && e.target === vw.img,
      moved: false,
    };
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  });

  stage.addEventListener("pointermove", (e) => {
    if (vw.pointers.has(e.pointerId)) vw.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch && vw.pointers.size >= 2) {
      const info = pinchInfo();
      if (info.dist > 0) zoomAt(info.x, info.y, pinch.scale * (info.dist / pinch.dist));
      return;
    }
    if (!gesture) return;
    const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) gesture.moved = true;
    if (gesture.panning) {
      vw.img.classList.add("dragging");
      vw.tx = gesture.tx + dx;
      vw.ty = gesture.ty + dy;
      applyZoom();
    }
  });

  const endPointer = (e) => {
    vw.pointers.delete(e.pointerId);
    if (pinch && vw.pointers.size < 2) {
      pinch = null;
      vw.swallowClick = true;               // a csippentés vége ne zárja be a nézegetőt
      gesture = null;
    }
  };

  stage.addEventListener("pointerup", (e) => {
    const wasPinch = !!pinch;
    endPointer(e);
    if (wasPinch || !gesture) return;
    const g = gesture;
    gesture = null;
    if (vw.img) vw.img.classList.remove("dragging");
    vw.swallowClick = g.moved;               // húzás után ne záruljon be a nézegető

    if (g.panning) return;

    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (swipeAction(dx, dy, stage.clientWidth, stage.clientHeight)) return;
    if (!g.moved && g.onImage) {
      if (vw.scale > 1.01) resetZoom();
      else { ensureHD(); zoomAt(e.clientX, e.clientY, 2.8); }
    }
  });

  stage.addEventListener("pointercancel", (e) => {
    endPointer(e);
    gesture = null;
    if (vw.img) vw.img.classList.remove("dragging");
  });

  stage.addEventListener("click", (e) => {
    if (vw.swallowClick) { vw.swallowClick = false; return; }
    if (e.target === stage) dismissViewer();   // a kép melletti üres részre kattintás = bezárás
  });

  /* Az infópanelen is lehet vízszintesen lapozni. Függőlegesen nem nyúlunk
     bele: ott a szöveg görgetése a fontos. */
  const side = $("#vwSide");
  let sideStart = null;

  side.addEventListener("pointerdown", (e) => {
    sideStart = e.target.closest("a, button") ? null
              : { x: e.clientX, y: e.clientY };
  });
  side.addEventListener("pointerup", (e) => {
    if (!sideStart) return;
    const dx = e.clientX - sideStart.x, dy = e.clientY - sideStart.y;
    sideStart = null;
    const minX = Math.max(40, side.clientWidth * 0.07);
    if (Math.abs(dx) > minX && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
  });
  side.addEventListener("pointercancel", () => { sideStart = null; });
  side.addEventListener("pointerleave", () => { sideStart = null; });

  window.addEventListener("resize", () => { if (vw.scale > 1.01) applyZoom(); });

  // --- billentyűzet
  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);

    if (vw.el.classList.contains("open")) {
      if (e.key === "Escape") { dismissViewer(); e.preventDefault(); }
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowUp") { stepObject(-1); e.preventDefault(); }
      else if (e.key === "ArrowDown") { stepObject(1); e.preventDefault(); }
      else if (e.key === "0") resetZoom();
      else if (e.key === "+" || e.key === "=") { ensureHD(); zoomBy(1.6); }
      else if (e.key === "-") zoomBy(1 / 1.6);
      else if (e.key === "1") { ensureHD(); zoomAt(window.innerWidth / 2, window.innerHeight / 2, oneToOneZoom(currentItem())); }
      else if (e.key === "c" || e.key === "C") setMode(vw.mode === "compare" ? vw.prefMode : "compare");
      else if (e.key === "i" || e.key === "I") setMode(vw.mode === "info" ? "photo" : "info");
      return;
    }
    if (typing) {
      if (e.key === "Escape") { e.target.value = ""; state.query = ""; e.target.blur(); render(); }
      return;
    }
    if (e.key === "/") { e.preventDefault(); $("#search").focus(); }
    if (e.key === "Escape" && state.route.view === "object") location.hash = sectionHash();
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
  loadSeen();
  if (!state.library.objects?.length) {
    $("#content").innerHTML =
      `<div class="empty"><b>${esc(t("emptyTitle"))}</b>${esc(t("emptyText"))}</div>`;
    return;
  }
  applyHash();
})();

})();
