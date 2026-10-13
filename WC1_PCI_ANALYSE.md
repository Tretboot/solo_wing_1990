# SOLO WING 1990 — WC1 NPC-PILOT-INTELLIGENCE (Referenz-Analyse)

> Quelle: `wingleader.c` (Wing Commander 1, 1989/1990, Chris Roberts).
> Zweck: Referenz für unsere Flug-KI (Autopilot, Formation, Piraten-KI, Waffen).
> Ton: 1990-Deadpan. "State of the art. Von 1986."

---

## 1. WAS IST DAS?

Der echte WC1-Quellcode für die **NPC-Pilot-Intelligenz** ("PCI"). Er steuert, wie
jedes Schiff (außer dem Spieler) denkt: Patrouille, Eskorte, Angriff, Verteidigung,
Flucht. Kein Zufall — eine **State-Machine pro Schiff** mit Taktiken und Zielen.

Das ist exakt das Muster, das wir für unsere Flug-KI brauchen. Wir haben es schon
teilweise (ShipRegistry: drone / interceptor / bomber). WC1 zeigt, wie man es
**richtig** aufbaut.

---

## 2. DIE 3 EBERGRIFFE (was wir übernehmen)

### A. Mission-Types (die "Was machst du gerade?"-Ebene)
```
patrol, escort, strike, defend, wingman, rendezvous, rout, come_home,
goto_warp, warp_arrive
```
Jedes Schiff hat genau EINEN `ship_mission_type`. Die `ship_intelligence()`-Funktion
ist ein großer `switch` darüber. **Das ist unser Muster:** Wir haben `ai:'drone' |
'interceptor' | 'bomber'` — wir machen das zu echten Mission-Types.

### B. Taktiken (die "Wie machst du es?"-Ebene)
```
cruise, look_out, head_home, approach_target, engage, destroy, sit_still,
warp_in, warp_out, self_defense
```
Innerhalb eines Mission-Types gibt es Taktiken. `ship_tactic` wechselt je nach
Distanz/Drohung. **Zwei Ebenen: Mission (was) → Taktik (wie).** Wir haben das
flach (nur `pattern`). Wir bauen die zweite Ebene.

### C. DETERMINATION (KI-Schwierigkeit)
Im Original wird DETERMINATION als Makro berechnet: Startwert 70, abzüglich
20 pro Pilot-Level (auf 3 Level gedeckelt). Je höher das Pilot-Level, desto
niedriger der DETERMINATION-Wert → die KI greift **früher** an (wenn der
Schadens-Wert die Schwelle überschreitet). **Das ist der Knob für
Schwierigkeit.** Wir haben feste `fireMin/fireMax`. Wir machen daraus
`DETERMINATION` pro Schiffstyp.

---

## 3. DIE 5 TRICKS (die wir konkret bauen)

### 1. "Kilrathi flee straight down" (Rout)
Im Originalcode: das Zielflugvektor wird auf "gerade nach unten" gesetzt
(mit einem Bit als Vorzeichen-Umkehr für die andere Bildhälfte), das Schiff
wird in diese Richtung gedreht, und mit 5-prozentiger Chance pro Frame wird
ein doppelter Afterburner-Schub ausgelöst.
Beim Verlieren fliehen die Feinde also **gerade nach unten** (mit Afterburner-Salven).
**Für uns:** Wenn der Spieler fast gewinnt (wenige Feinde übrig), fliehen die
Piraten "straight down" — visuell klar, dass sie verlieren. Deadpan: "Die
Piraten fliehen gerade nach unten. Das ist kein Bug. Das ist Physik."

Im Originalcode: ein eigener Zähler pro Schiff wird jeden Frame hochgezählt
und mit Vollgas zum Ziel angenähert; sobald der Burst-Timer überschritten
ist, greift das Schiff an (Ziel: Zerstören).
Die Formation hält also, bis ein Timer abläuft → dann **alle gleichzeitig angreifen**.
Die Formation hält, bis ein Timer abläuft → dann **alle gleichzeitig angreifen**.
**Für uns:** Piraten kommen in Wellen. Welle hält Formation → Burst → Angriff.
Das machen wir schon (waves), aber der Burst-Timer macht es **visuell** (alle
drehen sich gleichzeitig zum Ziel).

Im Originalcode: ist der Eskorten-Partner in Gefahr und der Gegner näher
als die Eskorten-Gefahren-Distanz, wechselt der Pilot in den Angriffsmodus;
ist die Distanz zum Partner größer als die Eskorten-Drift-Grenze, wird das
Ziel auf "Heimbasis" zurückgesetzt (Kehrt machen).
Der Eskorten-Pilot greift an, wenn der Buddy in Gefahr ist, und kehrt zurück,
wenn er zu weit weg ist. **Für uns:** Der Frachter (Kiste 47) ist der "buddy".
wenn er zu weit weg ist. **Für uns:** Der Frachter (Kiste 47) ist der "buddy".
Unsere KI (oder ein NPC-Wingman) schützt ihn. Das ist Mission m4 "DER FRACHTER".

### 4. Heat-Seeking-Missile (Waffen-Upgrade)
Im Originalcode: innerhalb des Scan-Bereichs wird nur gelockt, wenn das
Ziel "wegsieht" (Facing-Wert negativ) — die Rakete richtet sich auf den
nächsten "heißesten" Ziel (Abgas-Wärme).
Hitzesuchende Raketen locken auf **Abgas** (Ziel muss wegsehen). **Für uns:**
Waffen-Upgrade "Hitzesuchend" — lockt auf den Triebwerk-Flammen des Ziels.
Das ist das "mit besseren Waffen kann man mehr Zielen" aus der Nutzer-Answer.

### 5. Futurion ("Velveteen Rabbit")
Im Originalcode: ein Zähler pro Objekt wird hochgezählt; erst nach einer
Mindest-Anwesenheits-Zeit ODER wenn der Spieler nah (unter 7000 Einheiten)
und fast frontal (Richtung über 80) ist, wechselt das Objekt mit 1-in-8-Chance
pro Frame in seine echte Schiffsklasse — vorher bleibt es "unbekannt".
Ein Schiff ist also **unsichtbar**, bis man nah dran ist und hinschaut → dann wird es
ein echtes Schiff. **Für uns:** Das eingefrorene Alien / das Audit — es "wird
real", wenn man es sieht. "Es atmet. Das ist kein Formular. Das ist ein Atemzug."

---

## 4. WAS WIR NICHT ÜBERNEHMEN

- **C-Syntax, `#define`, `IntFract`** — das ist 1990-C. Wir machen Vanilla-JS.
- **`remove_object()`, `warp()`** — wir haben kein Warp-System (noch).
- **`fanatical`-Flag** — zu komplex für den Vertical Slice.
- **`x()` Funktion** ("PAUL! what is this garbage!!! -RKLD") — das ist ein
  Debug-Hack. Wir bauen das nicht. (Aber der Kommentar ist Gold.)

---

## 5. ÜBERSETZUNG FÜR UNSERE ARCHITEKTUR

| WC1 (C) | Wir (Vanilla-JS) | Status |
|---------|------------------|--------|
| `ship_mission_type[obj]` | `SW.Enemies.list[i].mission` | zu bauen |
| `ship_tactic[obj]` | `SW.Enemies.list[i].tactic` | zu bauen |
| `ship_target[obj]` | `SW.Enemies.list[i].target` (Spieler) | teilweise |
| `DETERMINATION` | `SW.ShipRegistry[ship].determination` | zu bauen |
| `ship_count[obj]` (Burst-Timer) | `SW.Enemies.list[i].burstTimer` | zu bauen |
| `ship_seq[obj]` (Formation-Break) | `SW.Enemies.list[i].seq` | zu bauen |
| `run_away()` (straight down) | `SW.Enemies.flee()` | zu bauen |
| `escort_mission()` | `SW.Enemies.escort(frachter)` | zu bauen (m4) |
| `heat_seeking_missile` | `SW.Projectiles.heatSeek()` | Upgrade |
| `futurion_intelligence` | `SW.Alien.reveal()` | zu bauen (Kältekammer) |

---

## 6. NÄCHSTER SCHRITT (delegiert, NEU-Orchestrierung)

1. **Lead Dev (Top-Level):** Spec für die 2-Ebenen-KI (Mission + Taktik) +
   DETERMINATION-Knob. Edge-Cases: Rout, Escort, Burst.
2. **Non-Thinking (Code):** Implementiert `SW.Enemies`-Erweiterung (mission,
   tactic, determination, flee, escort, burst).
3. **Pingpong (R2):** No Thinking + NoThink Code (mit mehr Limit) härten.
4. **Code Review:** Score 1-5 → in `site/agent_benchmarks.html` erfassen.

> "Die Piraten fliehen gerade nach unten. Das ist kein Bug. Das ist Physik."
> — COMMANDER, Briefing
