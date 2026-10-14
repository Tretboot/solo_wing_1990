# SPEC: FLUGMODELL — „NÄHER AM ORIGINAL"

> Stand: v0.75-dev (IM RAUM), 10.13.2026
> Ziel: Das Fliegen soll sich wie Wing Commander 1 anfühlen — echtes
> Vektor-Flugmodell statt Pseudo-3D, Bewegung AUF DER KARTE (x/y/z bleiben
> bestehen), Navigation über Waypoints, Autopilot mit Flyby.
> Recherche-Basis: wc1-re / wc2-re / OpenReliant (siehe KONZEPTE.md → v0.75).

---

## 1. Ist-Zustand (v0.75-dev heute)

| System | Heute | Datei |
|---|---|---|
| Spieler-Position | `x, y, z` (Welt), `z` wächst permanent mit `speed` | `js/entities.js` → `SW.Player` |
| Seitliches Driften | `vx, vy` mit Trägheit (Thrust 0.4, Drag 0.96, Max 4) | `SW.Player.update` |
| Vorschub | Cruise `FORWARD_BASE=2.2`, Burn `[SHIFT]` → `FORWARD_BURN=5.5`, Glättung `FORWARD_ACCEL=0.05` | `js/config.js` |
| Blick | Kamera steht AM Spieler (`project()` rechnet `x-P.x, y-P.y, z-P.z`), Roll Q/E + Bank aus `vx` (`BANK_FACTOR=0.05`) | `js/engine.js` |
| Sterne | Flow = Vorschub, laterales Gleiten = Drift (Parallax nach z) | `Engine.updateStars` |
| Gegner | Weltkoordinaten, Brains `approach/strafe/break`, erscheinen an Nav-Punkten (Welle i → WP i) | `SW.Enemies`, `data/missions.js` |
| Navigation | `navPoints [{x,y,z}]` = Route; [N] Nav-Karte (relativ), [T] Autopilot fliegt die WPs mit Burn-Flyby | `SW.Autopilot` (systems.js) |
| Ansichten | cockpit / chase / topdown ([V]), alle projection-basiert | `SW.Engine.view` |

**Was fehlt zum Original-Gefühl:**
1. Die Bewegungsrichtung ist immer +z (weltraum-fest). W/S/D/A driften
   orthogonal — das Schiff „zeigt" nie in die Flugrichtung. In WC1 fliegt
   das Schiff, wo es HINZEIGT; die Ansicht dreht sich mit.
2. Es gibt keine echte Geschwindigkeits-VEKTOR-Physik (`v` = Richtung ×
   Betrag, Trägheit in 3D).
3. Die „Karte" ist nur ein x/y-Schnipsel um den Spieler (±200 px); es gibt
   keine echte Sektor-Geometrie, an der man sich orientiert.

---

## 2. WC1-Referenz (was wc1-re zeigt)

- **Schiffszustand:** `position` (Vektor), `velocity` (Vektor),
  `orientation` (Pitch/Yaw/Roll), pro Schifftyp Konstanten
  (`accel`, `maxSpeed`, `turnRate`, `rollRate` …).
- **Steuerung (Stick/Joypad):** Yaw/Pitch-Raten drehen die ORIENTIERUNG
  (nicht die Geschwindigkeit); Gas skaliert den Antrieb entlang der
  Orientierung; Trägheit: alte Geschwindigkeit bleibt erhalten, bis der
  Antrieb sie umdreht. Auto-Bank: Rollwinkel folgt der Yaw-Rate.
- **Kamera:** Blickrichtung = Orientierung des Schiffs; Projektion =
  Welt→Kamera-Rotation, dann Perspektiv-Division (genau unser
  `project()`, nur mit Rotations-Schritt davor).
- **Nav:** Missionsroute als Waypoint-Liste; Autopilot übernimmt, fliegt
  die Punkte mit Kurven (Flyby) ab; HUD zeigt Distanz + Richtung.
- **Gegner/Objekte:** stehen an festen WELT-Positionen (Stationen,
  Eskort-Objekte); Sensoren-Reichweite weckt sie.
- **Formation:** Wingman hält relativen Offset-VEKTOR zum Leader.

**Unsere Entsprechung 1:1 möglich**, weil wir bereits Weltkoordinaten +
relative Projektion + Brains + Formation haben. Es fehlen der
Rotations-Schritt (Orientierung) und der Vektor-Antrieb.
---

## 3. Zielmodell (Zusammenfassung)

```
Zustand:   pos (x,y,z)          — wie heute, bleibt bestehen
           vel (vx,vy,vz)       — NEU: 3D-Geschwindigkeitsvektor
           orient (yaw,pitch)   — NEU: Blick- = Flugrichtung
           roll                 — wie heute (visuell, Q/E + Auto-Bank)

Antrieb:   vel += dir(orient) * accel * throttle * dt
           (Trägheit: vel wird NICHT zurückgesetzt — Drift bleibt)
Gas:       Cruise = 0.5, [SHIFT] = 1.0 (Sanftanlauf wie heute)
Kamera:    Welt → rotiere um orient → project() (heute: ohne Rotation)
Sterne:    Flow = -vel (Kamera-Space) — wie heute, nur mit |vel|
Nav:       WP-Route + Autopilot + Flyby (P1, steht) — in P4 auf echte
           Sektor-Geometrie aufgesetzt
```

---

## 4. Phasen (je Phase = eigenes Arbeitspaket, getrennt testbar)

### P1 — NAV & Flyby ✅ (diese Runde, 10.13.2026)
Umgesetzt:
- `navPoints` mit Welt-`z` (Route ab Takeoff); Welle i erscheint am WP i
  (`SW.Enemies.spawnWave`) — Gegner stehen an den Waypoints.
- Autopilot [T] mit z-Ebenen-Passage (keine Verhakung), WP-Handover,
  Abschluss-Funk („Alle Nav-Punkte durch.").
- **Flyby-Animation:** Autopilot zündet auf der Ausstreckung
  (`zLeft>400 || lat>90`) den Nachbrenner → Stern-Flow + Motor-Sound +
  VORW-Balken reagieren; die Bank entsteht aus der Seitengeschwindigkeit.
  Manuelle Eingaben überschreiben jederzeit (wie in WC1).
- Nav-Karte [N]: Routenlinie, nächster WP weiß, Distanz-Label;
  Radar/Space-Map/Nav-Karte jetzt spieler-relativ.
- HUD: `NAV WPn D:xxxx` mit Richtungs-Pfeil (alle drei Ansichten).
- Bug-Fix: [A] driftet endlich links (das Menü versprach WASD).

**Abnahme (Smoke-Test, Abschnitt 6c):** 4 WPs mit z, Welle 0 am WP1,
Welle 1 am WP2, Flyby-Burn, WP-Handover, [A] — alles grün.

### P2 — Vektor-Flugmodell (KERN, nächstes Arbeitspaket)
**Was sich ändert:** `z += speed` wird ersetzt durch `vel`-Vektor-Physik.

Mechanik:
1. Neue Felder: `vel = {x, y, z}`, init `vel.z = FORWARD_BASE` bei Takeoff.
2. Blickrichtung `dir(yaw, pitch)`:
   - `yaw += input.x * YAW_RATE * dt` (A/D), `pitch += input.y * PITCH_RATE * dt` (W/S),
     beide mit Decay bei losgelassenen Tasten (wie Roll heute).
   - `dir = (sin(yaw)*cos(pitch), sin(pitch), cos(yaw)*cos(pitch))`.
3. Antrieb: `vel += dir * ACCEL * throttle * dt`; `throttle` = Cruise 0.5 /
   Burn 1.0; Sanftanlauf wie heute (`FORWARD_ACCEL`-Glättung auf `throttle`).
4. Weltraum-Druckung: `vel *= DRAG3D` (z.B. 0.995 — sehr leicht).
5. Position: `pos += vel * dt`.
6. Kamera: `project()` rotiert den relativen Vektor um `-yaw, -pitch`
   (Formel in Abschnitt 5), dann wie heute `f/rz`. Roll bleibt Bild-Rotation.
7. Sterne: `s.pos -= vel * dt` (Kamera-Space), Wrap wie heute.
8. **Maus-Ziel bleibt entkoppelt** (wie WC1-Joystick-Ziel):
   `getAimDirection()` = Blickrichtung + Maus-Offset.

Konstanten (Startwerte, `js/config.js`):
| Name | Wert | Bedeutung |
|---|---|---|
| `YAW_RATE` | 0.028 rad/f | Yaw-Rate (A/D) |
| `PITCH_RATE` | 0.022 rad/f | Pitch-Rate (W/S) |
| `YAW_DECAY` | 0.90 | Blick federt zur Geradeaus |
| `ACCEL` | 0.25 px/f² | Antrieb |
| `DRAG3D` | 0.995 | Weltraum-Druckung (sehr leicht) |
| `THR_CRUISE` | 0.5 | Gas Cruise |
| `THR_BURN` | 1.0 | Gas Burn |
| `MAX_VEL` | 12 px/f | Obergrenze |

Akzeptanz (neuer Smoke-Test-Abschnitt):
- 60 f [D]: `yaw > 0.3`, `pos.x` wächst > 20 px (man fliegt, wo man zeigt).
- 60 f [W]: `pitch > 0.2`, `pos.y` sinkt (Blick unten = fliegen unten).
- Loslassen: `|vel|` bleibt 45 f messbar erhalten (Trägheit), Blick federt.
- [SHIFT]: `|vel|` steigt; Stern-Flow + Motor-Tonhöhe folgen.
- Objekt genau in Blickrichtung = Bildschirmmitte (yaw/pitch < 0.5).

Risiken & Gegenmaßnahmen:
- **Seeadfahrt/Schwindel** → `YAW_DECAY` bringt den Blick automatisch
  zurück; Winkel clampen (±0.6 rad).
- **Aim** → Maus-Offset relativ zum Blick, also kein neues Gefühl.
- **Autopilot** → P2-Zwischenschritt: bleibt auf x/y (x/y gehen weiterhin
  in pos auf); P4 rüstet um auf yaw/pitch-Ansatz.
- **Save/Load** → `vel, yaw, pitch` ins Save-Format; alte Saves:
  Defaults (`vel={0,0,baseSpeed}`, yaw=pitch=0).
### P3 — Auto-Bank & Fein-Feel
- Bank = `clamp(k * d(yaw)/dt)` (Auto-Bank aus Yaw-Rate, wie WC1) +
  manuelles Roll (Q/E) zusätzlich; Chase-/Top-Down-Sprite drehen mit.
- Schiffsdaten-Vorbereitung: `turnRate/accel/maxSpeed` pro Typ in
  `ShipRegistry` (nutzen, wenn der Schiffskatalog kommt).
- Sound: Motor-Tonhöhe = |vel| (steht schon), optional Seitenakzent bei
  hohem Queranteil.
- Akzeptanz: 90°-Kurve zeigt Bank innerhalb 30 f, federt nach Ende.

### P4 — Bewegung AUF DER KARTE (Sektor-Geometrie)
**Ziel:** x/y/z sind echte Positionen im Sektor; man kann sich verfahren,
Punkte liegen „da", die Nav-Karte zeigt die Wahrheit.

- `data/missions.js` bekommt `world: { bounds: {x, y, z}, stationen: [...] }`
  (Sektor-Layout, pro Mission/System).
- Welt-Grenzen: sanfter Abpraller + Funk („Du verlässt den Einsatzraum.
  Formular 44-K wäre schön vorher.").
- Nav-Karte [N] zeigt die ECHTE Route (x/y im Sektor, nicht nur
  ±200-Schnipsel); Spieler bleibt in der Mitte (relativ), [2×] =
  absolute Sektorkarte (Zoom).
- Objekte in der Welt: Träger mit Landebahn-Koordinaten (Rückkehr-Ziel),
  Eskort-Objekte (m2/m3/m4: Frachter/Civile als Welt-Objekt am WP),
  Gegner-Stationen am WP (steht seit P1).
- Landung: holt die Landebahn-Koordinaten aus der Welt; Cinematic bleibt
  relativ, nur das Ziel ist jetzt echt.
- Akzeptanz: m3 — die Zivile ist ein sichtbares Welt-Objekt; eskortieren =
  Distanz halten (neuer Missions-Check statt Zeit-Timer).

### P5 — WC1-Details (Polish-Backlog)
- Target-Bracket ([Tab] = Ziel, HUD-Distanz, Autopilot feuert auf Ziel).
- Nav-Ziel-Auswahl ([Tab] durch WPs, nicht nur Auto-Advance).
- Sensoren: Gegner-Stationen wachen bei `SENSOR_RANGE` auf (Idle-Phase).
- Wingman-Offset als VEKTOR (Formation hält den Winkel auch in Kurven).
- Radar: echtes 3D (z-Ringe) statt x/y-Kreis.

---

## 5. Mathematik (P2-Kern, für die Implementierung)

Rotations-Schritt in `project()` (Kamera blickt in `dir(yaw,pitch)`):
```
// relativ zum Spieler
rx = x - P.x;  ry = y - P.y;  rz = z - P.z;
// um Yaw (Y-Achse) drehen
cx = cos(P.yaw);  sx = sin(P.yaw);
rx1 =  rx*cx + rz*sx;
rz1 = -rx*sx + rz*cx;
// um Pitch (X-Achse) drehen
cp = cos(P.pitch);  sp = sin(P.pitch);
ry1 =  ry*cp - rz1*sp;
rz2 =  ry*sp + rz1*cp;
// Projektion (wie heute)
if (rz2 <= 0.1) return null;
sx = (rx1/rz2)*f + CX;   sy = (ry1/rz2)*f + CY;
```
Blickrichtung (für Antrieb & Sterne):
```
dir = ( sin(yaw)*cos(pitch),  sin(pitch),  cos(yaw)*cos(pitch) )
```
Sterne (Kamera-Space): `s.pos -= vel`; Wrap in der Kamera-Box (wie heute).

Top-Down bleibt UNVERÄNDERT (`projectTop`, Welt-x/y/z) — sie ist die
Karten-Ansicht und soll genau das zeigen.

---

## 6. Dateien pro Phase

| Phase | Dateien |
|---|---|
| P1 ✅ | `data/missions.js`, `js/entities.js` (spawnWave, Player.update), `js/systems.js` (Autopilot), `js/ui.js` (radar/navmap/spacemap), `js/states.js` (NAV-HUD), `js/input.js` (KeyA), `js/manual.js` |
| P2 | `js/entities.js` (Player: vel/yaw/pitch), `js/engine.js` (project-Rotation, updateStars), `js/input.js` (Aim mit Blick), `js/config.js` (Konstanten), `js/savegame.js` (vel/yaw/pitch), `_smoke_test.js` |
| P3 | `js/entities.js` (Bank aus yaw-Rate), `js/ui.js` (Sprite-Rotation), `js/config.js` |
| P4 | `data/missions.js` (world/stationen), `js/states.js` (Grenzen, Landung), `js/ui.js` (Sektorkarte), `js/systems.js` (Sensoren), `data/systems.js` (Layout) |
| P5 | `js/ui.js` (Target-Bracket, Radar-3D), `js/input.js` (Tab), `js/systems.js` (Ziel-Autopilot) |

## 7. Nicht-Ziele (bewusst)
- Kein echtes 6-DoF mit Gravity/Kollision gegen Objekte.
- Kein Waffen-Physik-Overhaul (Laser bleiben Instanz-Strahlen).
- Brains bleiben deterministisch pro Frame (kein Think-Overhead).
- P2–P5 sind NICHT Teil von v0.75-rc — sie kommen nach dem Playtest in
  eigenen dev-Runden (jede Phase = eigener Smoke-Test-Abschnitt).
