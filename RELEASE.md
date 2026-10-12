# SOLO WING 1990 — RELEASE NOTES

## v0.6.9-rc — "Musik, Optik, Katalog & Website"

**Release Candidate** | Sternenkorps Internes Netzwerk | Formular 12-B erforderlich

---

### ✨ NEUE FEATURES

#### **INGAME HANDBUCH** [Taste H]
- 6 Kapitel: Einführung, Steuerung, Cockpit, Kampf, Missionen, Crew
- Progressiv freigeschaltet (Missionen m1, m2 erforderlich für spätere Kapitel)
- NPCs zitieren in jedem Kapitel
- Ingame-Overlay mit [ESC] schließen, Pfeiltasten zum Wechseln

#### **EXTERNES HANDBUCH**
- Vollständiges HTML-Handbuch unter `site/manual/`
- 6 Kapitel mit detaillierten Erklärungen
- Corporate Design (Sternenkorps-Standard)
- Verknüpft mit Ingame-Inhalten

#### **WEBSITE-ÜBERARBEITUNG**
- Neues **Corporate Design v0.6.9**:
  - Sternenkorps-Farben (Blau, Dunkelblau, Warnung)
  - Professionelle Typografie (Monospace + Sans-Serif)
  - Responsive Layout (Desktop, Mobile, Switch)
- **Game ↔ Website Bridge**:
  - Ingame [H] öffnet Handbuch
  - Website verlinkt zurück zum Spiel
  - Handbuch-Links in Navigation

#### **SWITCH-PORT VORBEREITUNG**
- CSS Media Queries für Switch-Display (1280×720)
- UI-Scaling-System
- Touch-Controls geplant (nicht implementiert)
- Performance-Checks laufen

---

### 📝 TECHNISCHE DETAILS

**Neue Dateien:**
- `js/manual.js` — Handbuch-Engine (6 Kapitel, progressiv unlock)
- `site/manual/index.html` — Handbuch-Index
- `site/manual/chapter[1-6].html` — Kapitel 1-6
- `site/style.css` — Corporate Design (neu)

**Geänderte Dateien:**
- `index.html` — Handbuch-Script-Include
- `js/main.js` — [H] Input Handler, Handbuch-Overlay
- `site/index.html` — v0.6.9-rc Announcement, Handbuch-Links
- `TODO.md` — v0.6.9 Status

---

### 🧪 TESTANWEISUNGEN

1. **Ingame Handbuch testen:**
   ```
   index.html öffnen
   Spiel starten
   [H] drücken → Handbuch-Overlay erscheint
   Pfeiltasten → Kapitel wechseln
   [ESC] → Schließen
   ```

2. **Externes Handbuch testen:**
   ```
   site/manual/index.html im Browser öffnen
   Kapitel durchklicken
   Navigation prüfen (Vorherig/Nächster)
   ```

3. **Website-Design testen:**
   ```
   site/index.html öffnen
   Corporate Design prüfen
   Handbuch-Link klicken
   ```

4. **Switch-Compatibility (simuliert):**
   ```
   Browser-DevTools öffnen
   Viewport auf 1280×720 setzen
   UI-Scaling prüfen
   ```

---

### 🚧 OFFENE AUFGABEN (v0.6.9)

- [ ] **Musik-System:** 7 Instrumentierungen pro Raum
- [ ] **Sprite-Pass:** Schiffe, Planeten, Sternenbasis
- [ ] **Schiffskatalog:** 12. Raum, X-Wing-Style
- [ ] **JUMP-Polish:** Quell-System schrumpft, Ziel wächst

---

### 🔜 NÄCHSTE SCHRITTE

**v0.6.9-final:**
- Musik-System implementieren
- Sprite-Pass abschließen
- Schiffskatalog-Raum erstellen
- Testing + Bugfixing

**v0.70 — "Enden & Papierkram":**
- 3 Enden (Sieg / Tod / Geheim)
- Fax-Drucker UI
- Aktenschrank-Raum
- Optimierer-Erscheinen

---

### 📋 CHANGELOG

**v0.6.9-rc** (2026-10-10)
- ✨ Ingame Handbuch [H] mit 6 Kapiteln
- ✨ Externes Handbuch (site/manual/)
- ✨ Website-Überarbeitung (Corporate Design)
- ✨ Game ↔ Website Bridge
- ✨ Switch-Port-Vorbereitung (CSS)
- 🐛 Bugfixes: Handbuch-Input, Overlay-Rendering

**v0.6.7** (vorherig)
- Schiffszeitung-Engine
- Git-Setup
- NPC-Dialoge

---

### 🎮 SPIELINFORMATIONEN

**Titel:** SOLO WING 1990  
**Version:** 0.6.9-rc  
**Entwickler:** Sternenkorps Interne Entwicklung  
**Lizenz:** MIT  
**Plattform:** Web (Browser), Switch (vorbereitet)  
**Steuerung:** Tastatur, Maus, Gamepad  

---

### 📞 KONTAKT

**Sternenkorps Internes Netzwerk**  
Formular 12-B erforderlich  
Nur für autorisiertes Personal  

*"Wir fliegen allein. Wir fliegen zusammen."*
