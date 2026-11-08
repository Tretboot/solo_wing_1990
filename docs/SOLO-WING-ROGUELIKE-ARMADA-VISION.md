# SOLO WING: ROGUELIKE ARMADA & DIE NADIR-CHRONIKEN
## Master-Konzept, Universum, Schiffe, Roguelike-Loop & KI-Architektur

---

### 1. Das Grosse Bild (Vision & Genre)
*Solo Wing 1990* entwickelt sich von einem einfachen 2D-Canvas-Shooter zu einer **Open-World Roguelike Raumjäger- & Trägersimulation** im Geiste von *Wing Commander: Armada*, *Privateer 2: The Darkening* und *FTL: Faster Than Light*, verpackt in den visuellen Glanz handgezeichneter 90er-Jahre High-End Pixel-Art (Arne Niklas Jansson & Howard Day).

#### Kernpfeiler:
1. **Das Trägerschiff ist dein Zuhause (*Die Nadir* / *Die Nemotron*):**
   - Kein anonymer Menü-Hub, sondern ein lebendiger Mikrokosmos aus Hangar, Flight Deck, Krankenstation, Wartungsbucht, Kantine und Brücke.
   - Start- und Lande-Sequenzen sind spielbare Kern-Erlebnisse: Vom Katapult-Abschuss ins kalte Vakuum bis zum zittrigen Landeanflug mit zerfetztem Schild und brennendem linken Laser.
2. **Das Armada-Sektor-Interface (Open World Roguelike):**
   - Der Träger springt entlang von Sprungtoren und Nav-Bojen durch dynamisch generierte Sektoren.
   - Auf der Strategiekarte (Armada-Stil) sieht man verbündete Konvois, Patrouillenrouten, Minenfelder und feindliche Kilrathi-Flottenbewegungen.
3. **Die Piloten-Heldenreise (Rang & Verantwortung):**
   - **Rookie / Flight Officer:** Man fliegt reine Einsätze, folgt Befehlen und versucht zu überleben.
   - **Squadron Leader / Captain:** Man bestimmt die Einsätze des Geschwaders, teilt Flügelmänner ein und entscheidet, wohin der Träger als Nächstes springt.
   - **Admiral:** Man koordiniert die gesamte Trägergruppe, befiehlt Reparatur-Schichten, schickt Piloten auf Begleitschutz für Nachschubtransporter oder schwingt sich im ultimativen Notfall selbst ins Cockpit ("Wenn es hart auf hart kommt, fliegt der Admiral selbst!").

---

### 2. Das Universum der KI-Schiffe, Systeme & Fraktionen
Die Namensgebung verwebt historische Sci-Fi-Elemente mit einer augenzwinkernden Hommage an moderne KI-Meilensteine:

* **Die Nadir:** Unser treuer, rostiger Standard-Flottenträger ("Wartungsbuch Seite 83-D fehlt seit 12 Jahren").
* **Die Nemotron-Klasse (z.B. *TCS Nemotron-Bolt*):** Ein experimenteller Prototyp-Superträger mit Tarnvorrichtung (Stealth-Carrier), High-Energy-Kondensatoren und autarkem Wartungsdock. Taucht als legendäres Flaggschiff oder Deep-Space-Auftrag auf.
* **Station Gemma 4:** Ein abgelegener Forschungsaußenposten im Orbit eines Gasriesen mit orbitalen Raffinerien. Schauplatz für schräge Zwischensequenzen, Geheimaufträge und seltene Waffen-Upgrades.
* **Sektor Gemini:** Historischer Grenzsektor voller Piraten, Schrottplätze und verlassener Asteroidenbasen (Reminiszenz an Privateer).
* **Flottenschiffe & Stationen:**
  - *TCS Haiku:* Schneller Aufklärer und Kurier-Fregatte.
  - *TCS Kimi:* Schwerer Frachter und Treibstofftanker.
  - *TCS Fable:* Medizinisches Hospitalschiff für verwundete Piloten.
* **Charaktere & Skurriles (Privateer-2-Vibe):**
  - *Bolt:* Chefingenieur oder zynischer Testpilot auf Station Gemma 4.
  - *Unit 0-B (Der Wand-Hauer):* Ein ausgemusterter Wartungsdroide in der Ecke des Hangars, der rhythmisch seinen Kopf gegen das Panzerglas rammt, wenn Ersatzteile fehlen.
  - *Flügelmann Sechs:* Ewig nörgelnder Wingman, der bürokratische Formulare penibel während des Dogfights vorliest.

---

### 3. Hangar-Management, Ersatzteil-Puzzle & Piloten-Ökonomie
Der Verlust eines Schiffes ist permanent (Permadeath für Schiffe & Piloten):
* **Pilotenpool & Moral:**
  - Piloten ermüden, werden verwundet (Krankenstation) oder sterben.
  - Nachschub kommt nur über Transportschiffe. Wird ein Transporter abgefangen, steht man plötzlich allein im Hangar:
    *"Wo sind denn alle?!? Ist das ein neues Schiff?!?"*
* **Schiffs-Wartung & Min-Maxing:**
  - Schiffe kommen mit Hüllenbrüchen, verschmortem Radar oder defekter Waffenaufhängung zurück.
  - **Automatischer Modus:** Der Chefmechaniker repariert nach Standard-Protokoll.
  - **Experten-Modus (Min-Maxing):** Der Spieler baut Bauteile aus zwei schrottreifen Schiffen zusammen, um ein voll funktionsfähiges Ass-Schiff zu schmieden (Triebwerkstuning, überladene Schilde, asymmetrische Laser).

---

### 4. Technische Architektur: Sprite-Engine & Normal-Mapping
* **Cockpit mit Dynamischer Beleuchtung:**
  - Normal-Maps (`Hornet_Cockpit_Front_Normals.png`, `Joystick_Normals.png`, `SphereNormals.png`) werden im WebGL/Canvas-Shader gegen dynamische Lichtquellen (Laserblitze, Explosionen, Notlicht-Dunkelheit) verrechnet.
  - CRT-Scanline- & Pixel-Shader simulieren authentische 90er-Jahre Monitore.
* **Charakter- & Stations-Engine:**
  - Übernahme der Schiffs-Rotations- & Skalierungslogik für animierte Charakter-Sprites in Bars, Hangars und Kommunikations-Bildschirmen.
* **Funk-Engine & Holo-IRC:**
  - Anbindung an das reaktive Dialogsystem des IRC-Simulators für dynamische, kontextsensitive Funksprüche und Wingman-Befehle.
