# QWEN NO THINK — Nutzerhandbuch

## Was sind No-Think-Agenten?

Zwei schnelle, **nicht-denkende** Qwen-Instanzen. Keine lange Reasoning-Phase →
Ergebnisse in **Sekunden** statt Minuten.

| Agent | Typ | Stärken |
|-------|-----|---------|
| **Qwen No Thinking** | general | Text, Dialoge, Rollenspiel, Datenformate, Zusammenfassungen, Gegenlesen |
| **Qwen NoThink Code** | code | JS/Daten-Strukturen, Pixel-Matrizen, Configs, kleine Code-Snippets |

## Wann einsetzen?

| ✅ Ja | ❌ Nein |
|-------|---------|
| Dialoge, Rollenspiel, Beerdigungs-Sequenzen | Komplexe Architektur-Entscheidungen |
| Datenformate (JSON, JS-Objekte) | Tiefes Bug-Fixing / Multi-File Refactoring |
| Pixel-Matrizen, Sprites | Kreative Lore mit 1000+ Wörtern |
| Zusammenfassungen, Gegenlesen, Ideen-Bewertung | — |
| Konfigs, Parameter-Tabellen | — |

**Faustregel:** Wenn es schnell und formatiert sein muss → No Think.
Wenn es tiefes Reasoning braucht → Lead Developer / Commander.

## Prompt-Formel (wichtig!)

No-Think-Agenten brauchen **ENGE Rahmung**. Je präziser der Prompt, desto besser das Ergebnis.

```
[TASK] + [FORMAT] + [TON] + [LÄNGE] + [ABGRENZUNG]
```

### ✅ Gut:
```
Schreibe eine 3-Zeilen-Reaktion von PILOT SECHS in der Bar.
Ton: leicht angetrunken, schiefes Kompliment, eine 90s-Referenz.
Max. 2 Sätze pro Zeile. Deadpan. Auf Deutsch.
```

### ❌ Schlecht (→ Halluzinationsrisiko):
```
Schreib mal was über die Piloten.
```
*(Kein Format, kein Ton, keine Länge → Agent füllt mit Worldbuilding.)*

## Die 6 Regeln

1. **Immer Länge angeben** (X Zeilen, max. Y Wörter).
2. **Immer Ton angeben** (deadpan, bürokratisch, angetrunken, ...).
3. **Immer Format angeben** (JSON, JS-Objekt, Matrix, Labels).
4. **Immer Abgrenzung** ("NUR die angeforderten Texte", "KEIN Worldbuilding").
5. **Deutsch** für alle Spiel-Texte.
6. **Gegenlesen lassen:** No Think kann auch andere No-Think-Outputs gegenlesen (Tonbrüche, Formatfehler).

## Rollen (universell — nicht festgelegt)

No-Think-Agenten sind **NICHT** auf eine Rolle festgelegt. Du kannst sie als:
- **NPC / Rollenspiel** (Pilot, Commander, Barkeep, ...)
- **Daten-Generator** (JSON, JS, Matrizen)
- **Proofreader** (Gegenlesen, Tonbrüche finden)
- **Ideen-Bewerter** (Pro/Contra, Realitätscheck)
- **Reaktor** (auf bestehende Texte/Events reagieren)

...einsetzen. Einfach im Prompt **Rolle + Aufgabe** angeben.

## Konferenz-Modus (Team-Meetings)

1. **Kontext** geben (Phase, was fertig ist).
2. **Gratulation** (1-2 Zeilen) — hält den Ton, motiviert.
3. **Tagesordnung + Subtasks** (klar getrennt pro Agent).
4. **Test** (jeder liefert seinen Subtask).
5. **Evaluation** (Commander fasst zusammen, entscheidet).

## Bekannte Limitationen

- Lange kreative Texte (>500 Wörter) → Qualität sinkt, Halluzinationsrisiko steigt.
- Komplexe Logik/Architektur → zu Lead Developer.
- Widersprüchliche Anweisungen → Agent pickt die erste.
- Kein Langzeit-Gedächtnis → alles Wichtige in den Prompt.

---
*Erstellt: Phase 2, SOLO WING 1990. Für interne Verwendung. Formular NT-1.*
