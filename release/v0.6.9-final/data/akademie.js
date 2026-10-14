// ===== SOLO WING 1990 — AKADEMIE DATA =====
// Tutorial. Pro forma. Jeder besteht. Sogar die, die nicht.
// Reine Daten. Kein DOM. Kein Rendering.

'use strict';

SW.AkademieData = {
  // Der Ausbilder ist müde. Er erklärt die Steuerung IN DER STORY.
  dialog: [
    { npc: 'AUSBILDER', text: 'Akademie. Willkommen. Setzen Sie sich. Die Stühle sind aus 1984.' },
    { npc: 'AUSBILDER', text: 'Bewegen: W/S/D. Oder Pfeile. Oder Controller. Wer mehr hat, der kann mehr. Das ist kein Bug.' },
    { npc: 'AUSBILDER', text: 'Zielen: Maus. Oder Joystick. Wer einen Joystick hat, der zielt besser. Das ist auch kein Bug.' },
    { npc: 'AUSBILDER', text: 'Feuer: Leertaste. Oder Trigger. Wer einen Trigger hat, der schießt schneller. Das ist ein Feature.' },
    { npc: 'AUSBILDER', text: 'Autopilot: A. Der Autopilot ist aus 1984. Er funktioniert. Meistens.' },
    { npc: 'AUSBILDER', text: 'TTS: M. Die Stimmen sind aus 1990. Sie klingen wie 1990. Das ist korrekt.' },
    { npc: 'AUSBILDER', text: 'Dann fliegen Sie. Eine Welle. Drei Feinde. Überleben Sie. Das ist die Prüfung.' }
  ],

  // Bestanden
  bestanden: [
    { npc: 'AUSBILDER', text: 'Bestanden. Sie werden dem Träger FAX-TRAGÖDIE zugeteilt. Formular 83-B liegt bereit.' }
  ],

  // Nicht bestanden (Pro forma: trotzdem zugeteilt)
  durchgefallen: [
    { npc: 'AUSBILDER', text: 'Nicht bestanden. Sie werden trotzdem dem Träger FAX-TRAGÖDIE zugeteilt. Formular 83-B liegt bereit. Teil C: "Nicht bestanden."' },
    { npc: 'AUSBILDER', text: 'Sie dürfen erst fliegen, wenn Sie den Simulator an Board gut genug machen. Das Formular dafür ist 83-B. Teil D: "Simulator-Nachholung."' }
  ],

  // Nach der Akademie: Crew lacht (nicht böse, müde)
  crewReaktion: [
    { npc: 'SECHS', text: 'Der hat die Prüfung nicht bestanden. Das ist okay. Ich habe sie auch nicht bestanden. 1987. Seitdem trinke ich.' },
    { npc: 'NEUN', text: 'Ist es ... ist es furchtbar?' },
    { npc: 'ZWO', text: 'Nein. Es ist ein Formular. Ein leeres.' },
    { npc: 'VIER', text: 'Ich lache. Das ist mein Formular.' }
  ],

  // Sim-Konfiguration
  sim: {
    wellen: 1,
    feinde: 3,
    zeit: 60 // Sekunden (generös)
  }
};
