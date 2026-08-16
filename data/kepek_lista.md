# Képlista az albumhoz — 2026-os szezon

**Forrás:** a projekt `master_v5.md` és `master.txt` mesterösszefoglalói (megfigyelési napló + mérési referenciaszámok).
**Készült:** 2026.08.16.

> ⚠️ **Adatállapot:** ahol a napló kockaszámot rögzített, az *mért* adat. Ahol csak integrációs időt, ott a kockaszám **visszaszámolt** (`integráció / szubhossz`) — ezt a táblázat jelöli. Az ellenőrzés minden ismert szettnél stimmelt (pl. 572 × 30 s = 4h46m, 1826 × 20 s = 10h08m), tehát a rekonstrukció megbízható, de nem tartalmazza az eldobott kockákat.

---

## A fő táblázat

| # | Kép | Dátum(ok) | Éj | Mód | Szub | Kocka (megtartott / nyers) | Integráció | LP | Forrás |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **NGC 6992** — Keleti Fátyol | 07.21 | 1 | alt-az | 10s | 1206 / – | **3h 21m** | BE | *számított* |
| 2 | **NGC 6960** — Nyugati Fátyol | 07.22 | 1 | alt-az | 10s | 1080 / – | **3h 00m** | BE | *számított* |
| 3 | **NGC 7000** — Észak-Amerika | 07.21, 07.23, **07.24** | 3 | alt-az → EQ | 20s | **863** / – | **4h 47m** | BE | napló |
| 4 | **NGC 6888** — Crescent, 1. szett | 07.27 | 1 | EQ | 20s | 771 / – | **4h 17m** | BE | *számított* |
| 5 | **Sh2-101** — Tulipán | 07.29 | 1 | EQ | 30s | **572 / 664** | **4h 46m** | BE | napló |
| 6 | **IC 1318** — Sadr-régió | 07.30 | 1 | EQ | 30s | **572 / 662** | **4h 46m** | BE | napló |
| 7 | **IC 5070** — Pelikán | 08.02 + 08.08 | 2 | EQ | 20s | **1608 / 1676** | **8h 56m** | BE | napló |
| 8 | **M27** — Dumbbell | 08.08 + 08.09 + 08.11 | 3 | EQ | 20s | **1826 / 2065** | **10h 08m** | BE | napló |
| 9 | **NGC 7331** + Stephan-kvintett | 08.13 | 1 | EQ | 20s | **886 / 1093** | **4h 55m** | **KI** | napló |
| 10 | **NGC 6888** — Crescent, 2. szett | 08.14 + 08.15 | 2 | EQ | 30s | **931 / 1054** | **7h 46m** | BE | napló |

**Összesen (kész képek):** 10 kép · **56h 42m** · **10 315 kocka**
**Összes rögzített adat** (az NGC 7000 két korábbi mozaikos sessionjével együtt): **61h 11m** · **11 209 kocka** · 15 megfigyelési éjszaka.

---

## Képenkénti kiegészítő adatok (ami az albumban jól mutat)

### 1. NGC 6992 — Keleti Fátyol · 07.21
Az első komoly kép. Alt-az mód, 10 s-os szubok. Szupernova-maradvány, Cygnus.
*Hiányzik:* nyers kockaszám, cull-adat, FWHM.

### 2. NGC 6960 — Nyugati Fátyol · 07.22
57%-os hatásfok — az alt-az mezőforgás ára. Ez a szett vezetett az EQ-módra váltáshoz.

### 3. NGC 7000 — Észak-Amerika köd · 07.21 / 07.23 / 07.24
- 07.21 hajnal — alt-az, 10 s, ~29 min, 44 paneles mozaik (~174 kocka, számított)
- 07.23 — EQ, 20 s, ~4h, véletlen mozaik 90°-os forgatással (~720 kocka, számított)
- **07.24 — EQ, 20 s, 4h 47m, 863 kocka, egy panel** ← ebből készült a kész kép

Több verzió is készült. A 07.23 + 07.24 egyesítése még hátravan.

### 4. NGC 6888 — Crescent, 1. szett · 07.27
**Telehold mellett**, az első HOO-feldolgozás. J/Z (OIII) = 6,7 · SPCC σ = 0,49/0,09. Két verzió: szűk + tág.
🔴 **A nyers FIT-ek elvesztek** — csak a végső PNG van meg, a 2. szettel nem egyesíthető.

### 5. Sh2-101 — Tulipán köd · 07.29
Az első `cloud_cull` bevetés. 78°-os delelés, 30 s-os szub, **100% hatásfok**.
J/Z = 5,8 · SPCC σ = 0,51/0,11 · jel/gradiens arány cropon 5,8 · recomp. BP 0,10.

### 6. IC 1318 — Sadr-régió · 07.30
Az első mezőt kitöltő célpont — itt derült ki, hogy a GraXpert AI háttér-extrakció ilyenkor használhatatlan.
J/Z = 2,0 · SPCC σ = 1,06/0,29 · recomp. BP 0,12. Az alsó 25% levágva.

### 7. IC 5070 — Pelikán köd · 08.02 + 08.08
Az első kétéjszakás szett; az egyik éj 80%-os holddal, a háttér mégis csak 9%-kal tért el.
**FWHM 8,22″** · bgnoise 7,36 · J/Z = 7,8 · SPCC σ = 0,30/0,06 · G−R szórás 243 · recomp. BP 0,08.
Itt mértem ki, hogy a hard FWHM-szűrő tiszta veszteség (1396 vs 1608 kocka azonos FWHM mellett).

### 8. M27 — Dumbbell köd · 08.08 + 08.09 + 08.11
A legjobb emissziós szettem. **2065 nyers → 1924 (szürkület-vágás) → 1826 (Roundness 95%).**
**Nulla regisztrációs bukás** · **FWHM 6,6″** · J/Z (OIII) = **110** · S_Ha 101,1 / S_OIII 132,1 · G−R szórás 29,7.
A külső haló **6,7σ**-val kimutatva. Három verzió: tág, **semitight (a legjobb)**, szűk.

### 9. NGC 7331 + Stephan-kvintett · 08.13
**Az első galaxisom, LP szűrő nélkül.** Roundness 97% · vágási ablak 22:30–04:26 CEST.
**Határfényesség ~16 mag** · **14+ azonosított galaxis** · legtávolabbi: **NGC 7326**, z = 0,0277, ~380 millió fényév.
Három távolság-réteg egy képen: NGC 7331 (~40 M fényév) → Deer Lick + Stephan-kvintett (~290–300 M fényév) → NGC 7326 (~380 M fényév).
A jó vágás **javított** a stacken: 886 kocka SNR-je 103,2% a nyers 1093-hoz képest.

### 10. NGC 6888 — Crescent, 2. szett · 08.14 + 08.15
A legmélyebb emissziós szettem. **Két holdtalan éjszaka**, 99%-os fedéssel (RA/Dec eltérés 1,49′, elforgatás +0,19°).
1054 → **931 kocka (88,3%)** · Roundness 95% · kadencia 33,4 s/kocka · session-hozamok: 262/298, 282/297, 169/230, 218/229.
J/Z = 5,4 · S_Ha 36,2 / S_OIII 11,9 · SPCC K-faktorok 0,830/0,543/1,000 · G−R szórás 373.
**Bónusz mérés:** a Soap Bubble (PN G75.5+1.7) a mezőben van, de 7h46m holdtalan után sem detektálható (+0,02 ADU az OIII-csatornán) — **érvényes negatív eredmény**, a felszerelés határának pontos kimérése.

---

## Nem képek, de a történethez tartoznak

| Dátum | Esemény | Megjegyzés |
|---|---|---|
| ~07.13 | **Első fény — a Nap** | Ismerkedés a műszerrel |
| 07.20 | M20 Trifid + M8 Lagoon | Pár perc, alt-az. Kriensből 19–20°-on delelnek — déli útra való célpontok |
| 07.23 | M13 létra-teszt (10/20/30/60 s) | Az EQ mód bizonyítása; 30 s biztonságos |

---

## Amit már nem lehet előásni

1. **A 07.27-i NGC 6888 nyers FIT-jei** — teljes 4h17m telehold-szett, csak a végső PNG maradt.
2. **A 07.21–07.24 alt-az korszak** pontos kockaszámai és cull-adatai (a fenti számok visszaszámoltak).
3. **FWHM** a legtöbb szettnél — csak M27 (6,6″) és IC 5070 (8,22″) van meg.
4. **Pontos felvételi kezdő/záró időpontok** — csak NGC 7331 és NGC 6888 v1 esetén.
5. **Holdfázis** a legtöbb éjszakára (csak 07.27 telehold, 08.14–15 holdtalan, IC 5070 egyik éje 80%).

---

## Amit a jövőben rögzíts felvételenként

Ha ezt a hat mezőt minden éjszaka után beírod, az album soha többé nem szorul rekonstrukcióra:

`objektum · dátum · szub · nyers kocka · megtartott kocka · vágási ablak (UTC) · holdfázis · delelési magasság · FWHM · a végső fájl neve`

A `masters\` fájlnév-konvenció (`<objektum>_<dátum>_<kockaszám>x<szub>_drz<N>.fit`) ezt már részben hordozza — az album generálható lenne közvetlenül a fájlnevekből.
