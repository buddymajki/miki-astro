# Miki-Astro Dashboard

Lokális, offline működő nézegető a saját asztrofotóidhoz és videóidhoz.
Objektumonként csoportosítja az anyagot, ad hozzá egy rövid szakmai adatlapot,
és ha van net, élő Wikipédia-összefoglalót is húz mellé.

## Két üzemmód

| | Helyi (`start.bat`) | Publikált (GitHub Pages) |
|---|---|---|
| Címe | `http://127.0.0.1:8765` | https://buddymajki.github.io/miki-astro/ |
| Képek | eredetik + WebP előnézetek | csak a WebP előnézetek |
| Videók | igen | nem (túl nagyok a repóhoz) |
| Újraolvasás gomb | igen | automatikusan eltűnik |
| Eredeti / Mappa gomb | igen | automatikusan eltűnik |

A felület indításkor lekérdezi az `/api/ping` végpontot. Ha válaszol, helyi
módban fut; ha nem (statikus tárhely), magától elrejti azokat a gombokat,
amiknek ott nincs értelmük, és kihagyja a nem publikált fájlokat. Nincs külön
build, ugyanaz a kód fut mindkét helyen.

### Publikálás

Dupla kattintás a **`publish.bat`** fájlra. Ez beolvassa az új képeket,
legenerálja a WebP változatokat, commitol és feltölt. Pár perc múlva frissül
a publikus oldal.

A `start.bat` **nem** publikál – az csak megnyitja helyben az albumot.

### Mi kerül fel és mi nem

| | |
|---|---|
| Felkerül | kód, objektum-adatbázis, felvételi adatok, `thumbs/` WebP (~9 MB) |
| Nem kerül fel | `DONE/` eredetik (~830 MB), videók (~146 MB) |

Az eredetiket nincs értelme feltölteni: a nagy nézet úgyis a 2400 px-es
előnézetet mutatja, és a GitHub 100 MB felett nem is fogadna el fájlt (a
legnagyobb PNG-d 156 MB). A WebP ugyanazt a minőséget 58%-kal kisebb fájlban
adja, mint a JPEG – ezért fér el az egész képanyag 9 MB-ban.

Ha a videókat is meg akarod osztani, töltsd fel őket YouTube-ra vagy pCloudra,
és tegyél linket az objektum leírásába.

## Indítás

Dupla kattintás a **`start.bat`** fájlra.

Ez elvégzi a következőket:

1. beolvassa a `DONE` mappát (az újonnan bemásolt fájlokat is),
2. rendbe teszi a fájlneveket,
3. legenerálja a hiányzó bélyegképeket,
4. elindít egy helyi webszervert, és megnyitja a böngészőt.

A szerver csak a `127.0.0.1` címen figyel, kívülről nem érhető el.
Leállítás: `Ctrl+C` a fekete ablakban.

## Új képek hozzáadása

Másold be őket a `DONE` mappába úgy, hogy a fájlnév **az objektum nevével
kezdődjön**, utána egy aláhúzás:

```
NGC6888_HOO_v2.png
M31_mozaik_final.png
SH2-101_Tulip_wide.png
```

Ezután vagy indítsd újra a `start.bat`-ot, vagy nyomd meg a dashboard jobb
felső sarkában az **Újraolvasás** gombot – nem kell újratölteni az oldalt.

Támogatott formátumok: `jpg`, `jpeg`, `png`, `tif`, `tiff`, `webp`, `bmp`, `gif`,
valamint `mp4`, `mov`, `webm`, `m4v`, `avi`, `mkv`.

## Fájlnév-szabványosítás

A szkenner automatikusan rendet rak a neveken (minden átnevezést naplóz a
`data/rename-log.txt` fájlba):

| Előtte | Utána |
|---|---|
| `IC 1318_Sadr.png` | `IC1318_Sadr.png` |
| `NGC_6960_1.png` | `NGC6960_1.png` |
| `NGC_6992_Végleges.png` | `NGC6992_Vegleges.png` |
| `NGC_7000_NorthAmerican Nebula.png` | `NGC7000_NorthAmerican_Nebula.png` |
| `Aurora_...NIGHT~2.jpg` | `Aurora_..._NIGHT_2.jpg` |

Vagyis: szóköz és egyéb furcsa karakter helyett `_`, ékezetek nélkül, és a
katalógusjel a számmal egybeírva (`NGC`, `IC`, `M`, `SH2`, `Abell`, `LDN`, `LBN`,
`Cr`, `Mel`, `vdB`, `UGC`, `PGC` …).

Ha előbb meg akarod nézni, mit csinálna:

```
python scan.py --dry-run
```

## Nyelv

A felület magyarul és angolul is megy. Váltás a bal felső sarokban lévő
**HU / EN** kapcsolóval; a választás megjegyződik. Angol nyelvű linket így
tudsz küldeni valakinek:

```
http://127.0.0.1:8765/?lang=en
```

## Hogyan használja egy vendég

A dashboard szándékosan fotóalbumként viselkedik: **alapból alig van rajta
szöveg**.

1. A kezdőlap egy képrács – objektumonként egy borítókép, alatta a név és a
   dátum. Rendezés a jobb felső legördülővel (**Legfrissebb** az alapértelmezés,
   így az új anyag mindig elöl van), szűrés a bal oldali gombokkal
   (Mély-ég / Naprendszer / Légkör), kereső a `/` billentyűvel.
2. Egy objektumra kattintva jönnek a képei – megint csak képek. Az összes
   szakmai infó egyetlen lenyitható sávban van a lap alján
   (*Részletek, adatok, Wikipédia*), tehát csak akkor látszik, ha kérik.
3. Egy képre kattintva teljes képernyős nézegető nyílik – **csak a kép**,
   levágás nélkül. Az **Infó** gomb (`I`) hozza elő mellé a leírást.

A lapozás kétirányú, mint egy telefonos galériában:

- **Vízszintesen** (nyilak vagy swipe) végiglapozol az egész albumon – az
  egyik objektum utolsó képe után a következő objektum első képére lép, a
  legvégén pedig körbeér az elsőre.
- **Függőlegesen** (swipe fel/le, vagy `↑` `↓`) egyben ugrasz a következő
  vagy előző objektumra – így nem kell végigpörgetni például a Hold
  tizenkilenc felvételét.

Infó módban a leírás panelen is lehet vízszintesen lapozni; függőlegesen
ott a szöveg görgetése marad.

## Felvételi adatok (amatőrcsillagászoknak)

A dashboard kiírja, hány képkockából és mennyi expozícióból készült egy kép,
milyen távcsővel, szűrővel és gainnel. Ez három helyen látszik:

- a nézegető fejlécében mindig (`931 × 30 s · 7 ó 45 p`),
- az **Infó** panelen részletesen,
- az objektumoldal *Részletek* blokkjában.

A stackelt felvételek csempéjén ott a **teljes integrációs idő** kis címkeként.
Egyszeri expozícióknál (telefonos kép) nem jelenik meg, hogy ne zavarja a
családi böngészést.

## Sorrend és albumborító

Két jelölő van, alulvonással határolva, kis- és nagybetű mindegy:

| Jelölő | Mit csinál |
|---|---|
| `_MAIN_` | Ez a kép megy **legelőre**, és ez lesz az **albumborító** |
| `_ANNOT_` | Feliratozott változat – közvetlenül a `MAIN` után jön |

```
M31_MAIN_378x20sec_7560s_drizzle-2-0x_IRCUT_AW.png     ← 1. + borító
M31_ANNOT_378x20sec_7560s_drizzle-2-0x_IRCUT_AW.png    ← 2.
M31_378x20sec_..._v2.png                                ← 3., név szerint
M31_1.png                                               ← 4.
```

A `MAIN` és az `ANNOT` szó **nem jelenik meg a képaláírásban** – csak sorrendet
jelöl. A videók mindig a lista végére kerülnek.

Ha nincs `_MAIN_` jelölés, a borító automatikusan az első olyan kép lesz,
aminek a nevében nincs `annot`, `zoom`, `invert` vagy `mask`. Ha véletlenül két
képre is `_MAIN_`-t írsz, a szkenner szól, és az elsőt használja.

A jelölőt bárhová teheted a névben, de az objektum neve után a legolvashatóbb:
`M31_MAIN_...`. Az `ANNOT` már a régi neveidben is működik (`..._aNNOT.png`),
azt nem kell átírni.

### Írd bele a fájlnévbe

A legegyszerűbb: a fájlnévbe beírod, és a szkenner kiolvassa.

```
NGC6888_931x30s_HOO_final.png
M31_250x60sec_gain100.png
SH2-101_120x120s_Ha_v2.png
```

| Amit felismer | Példa | Megjegyzés |
|---|---|---|
| kockaszám × expozíció | `931x30s`, `250x60sec`, `40x2min` | **az egység kötelező** (`s`, `sec`, `min`, `m`, `ms`) |
| gain | `gain200`, `g200` | |
| szűrő | `HOO`, `SHO`, `LRGB`, `RGB`, `Ha`, `OIII`, `SII`, `LP`, `IRCUT`, `UHC`, `dual`, `NB`, `BB` | |

Az egység azért kötelező, mert e nélkül a `2160x3840` képméret is
kockaszámnak látszana.

### Ami magától is megvan

- **Stackelt FITS-ekből.** A szkenner végignézi a feldolgozó mappákat
  (alapból a `viewer` szülőmappáját), és a stackelő által generált
  `..._931x30sec_27930s_....fit` nevű fájlokból kiolvassa a kockaszámot,
  a távcsövet, a szűrőt, a gaint és a dátumot. Objektumonként a legtöbb
  kockát tartalmazó fájl nyer.
- **EXIF-ből.** Telefonos és egyedi felvételeknél az expozíció, ISO, rekesz,
  fókusztáv és a kamera neve.

Fontos: a szkenner **csak a fájlnévben szereplő kockaszámot fogadja el**, a
FITS-fejléc `STACKCNT` mezőjét nem. A feldolgozás során ugyanis a
csatorna-szétbontásnál ez az érték összeadódik – az NGC 6888 HOO-fájljában
például 4655 áll a valós 931 helyett.

### Kézi felülbírálás

A `data/equipment.json` fájlban:

```json
"telescopeNames": { "S30 Pro": "ZWO Seestar S30 Pro" },
"byObject": { "M27": { "telescope": "ZWO Seestar S30 Pro" } },
"byFile":   { "M31_2_AW.png": { "frames": 250, "exposure": 60, "filter": "LP",
                                "note": {"hu": "Két éjszaka", "en": "Two nights"} } }
```

Sorrend: FITS → EXIF → fájlnév → `byObject` → `byFile`. Ami lejjebb van, az nyer.

## Vízjel

A `data/logo.png` rákerül minden megjelenített képre (jobb alsó sarok, lágy
fénykoszorúval, hogy sötét égen is olvasható legyen).

**Az eredeti fájlokhoz a program soha nem nyúl hozzá** – a vízjel csak a
generált bélyegképekre és előnézetekre kerül rá, tehát arra, amit a böngésző
mutat. Az **Eredeti** gomb a tiszta, vízjel nélküli fájlt nyitja meg.

Ha lecseréled a logót, a következő indításkor minden kép újragenerálódik.
Vízjel nélkül szeretnéd? Nevezd át vagy töröld a `data/logo.png`-t.
A méret és az átlátszóság a `scan.py` tetején állítható (`LOGO_RATIO`,
`LOGO_ALPHA`).

## Összehasonlítás

Az **Összehasonlítás** gomb (`C`) mellétesz egy másik felvételt ugyanarról az
objektumról, forrás- és licencmegjelöléssel, a Wikimedia Commonsról. Ehhez
internet kell.

A címke mindig megmondja, mit látsz, és ez szándékosan őszinte:

| Címke | Mit jelent | Hol |
|---|---|---|
| **Hubble űrtávcső** | valódi Hubble-felvétel | Fátyol-köd (mindkét ív) |
| **Profi obszervatórium** | NASA / űreszköz felvétele | Hold (LRO), sarki fény (ISS) |
| **Összehasonlító felvétel** | jó minőségű referenciafotó a Commonsról | a többi |

A legtöbb objektumhoz **nincs jól használható Hubble-kép**: a Hubble
látómezeje sokkal kisebb, mint egy 18 ívperces köd, ezért csak apró,
felismerhetetlen szélrészletek léteznek, fekete detektor-hézagokkal. Ezeknél
tisztább összehasonlítást ad egy jól exponált referenciafotó, ami ugyanazt az
objektumot ugyanabban a kivágásban mutatja.

A nagy nézet URL-je megosztható és elmenthető:

```
#/o/M27/4            → M27, 5. felvétel
#/o/M27/4/compare    → ugyanaz az összehasonlító képpel egymás mellett
```

## Kezelés

| Billentyű / művelet | Mit csinál |
|---|---|
| `/` | ugrás a keresőbe |
| kattintás egy felvételre | teljes képernyős nézegető |
| `←` `→` vagy **swipe balra / jobbra** | következő / előző kép – az objektumok között is, a végén körbeér |
| `↑` `↓` vagy **swipe fel / le** | ugrás a következő / előző objektumra |
| `I` | leírás ki/be a kép mellett |
| `C` | összehasonlító kép |
| görgetés / kattintás | nagyítás, `0` = alaphelyzet |
| húzás | mozgatás nagyítás közben |
| `Esc` vagy a Vissza gomb | bezárás |
| **Eredeti** gomb | az eredeti (vízjel nélküli) fájl megnyitása |
| **Mappa** gomb | a fájl megmutatása az Intézőben |

A nagy nézet egy ~2400 px széles előnézetet mutat, nem a több tíz megabájtos
eredetit – ezért gyors. A teljes felbontáshoz való az **Eredeti** gomb.

## Objektum-adatbázis

A `data/objects.json` tartalmazza a leírásokat és adatokat. Új objektum
felvételéhez másolj le egy meglévő blokkot, és az `"id"` legyen pontosan az,
ami a fájlnév elején áll (pl. `"id": "NGC7331"`).

Ami nincs benne, az is megjelenik a dashboardon – csak adatlap nélkül, és a
Wikipédiát ilyenkor a katalógusjel alapján próbálja megkeresni.

**Minden szöveges mező kétnyelvű**, `{"hu": "…", "en": "…"}` alakban:
`name`, `type`, `constellation`, `distance`, `magnitude`, `size`,
`discovery`, `season`, `description`, `facts`.

Egynyelvű mezők: `id`, `aliases`, `category` (`deepsky` / `solar` /
`atmosphere`), `constellationLat`, `ra`, `dec`, `simbad`, `related`,
valamint `wiki` (`hu` / `en` szócikkcím, vagy `null` ha nincs).

Az összehasonlító kép:

```json
"reference": {
  "file": "Return to the Veil Nebula.jpg",   ← Wikimedia Commons fájlnév
  "kind": "hubble",                          ← hubble | pro | amateur
  "credit": "ESA/Hubble & NASA, Z. Levay",
  "license": "CC BY 4.0",
  "telescope": {"hu": "Hubble űrtávcső", "en": "Hubble Space Telescope"}
}
```

A `kind` csak a címkét dönti el (`hubble` → Hubble űrtávcső, `pro` → Profi
obszervatórium, `amateur` → Összehasonlító felvétel). Legyen őszinte, hogy a
nézőt ne vezesse félre.

Új összehasonlító kép kereséséhez a Wikimedia Commons a legegyszerűbb: keresd
meg a képet, és a fájlnevét (a `File:` előtag nélkül) írd a `file` mezőbe.
A `credit` és a `license` a Commons fájloldalán található – ezeket kötelező
feltüntetni.

## Miért kell a webszerver?

Mert a böngésző önmagában nem tud belenézni egy mappába. A `serve.py` végzi a
mappa beolvasását, és ő tudja megnyitni az eredeti fájlokat is.

Az `index.html` dupla kattintással (`file://`) is megnyílik és böngészhető,
de ilyenkor nem működik az **Újraolvasás**, a **Mappa** gomb és a videó-borító.

## Fájlszerkezet

```
viewer/
├─ start.bat            ← ezt kell indítani
├─ serve.py             helyi webszerver + API
├─ scan.py              mappa-beolvasó, átnevező, bélyegkép-generáló
├─ index.html
├─ assets/              style.css, app.js
├─ data/
│  ├─ objects.json      ← a kézzel szerkeszthető objektum-adatbázis
│  ├─ library.json/.js  generált – ne szerkeszd
│  └─ rename-log.txt    átnevezési napló
├─ thumbs/              generált bélyegképek – nyugodtan törölhető
└─ DONE/                a saját felvételeid
```

A `thumbs/` mappa és a `data/library.*` bármikor törölhető, a következő
indításkor újra elkészül. Az eredeti képekhez a program soha nem nyúl hozzá –
a fájlnév-szabványosításon kívül.

## Követelmények

- Python 3 (a `start.bat` ellenőrzi)
- Pillow (a `start.bat` telepíti, ha hiányzik)
