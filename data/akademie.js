// ===== SOLO WING 1990 — AKADEMIE DATA (SIMULATOR-EINSTELLUNGSTEST) =====
// Direkt nach der Rettung aus dem Asteroidenfeld:
// Kurzer Simulator-Test an Bord der TCS Fax-Tragödie, bevor man auf echte Piraten losgelassen wird!

'use strict';

SW.AkademieData = {
  // Der Ausbilder empfängt den frisch aus dem Transporter geretteten Piloten am Simulator:
  dialog: [
    { npc: 'AUSBILDER', text: 'Sie sind also der Überlebende aus dem zerlegten Transporter. Willkommen am Simulator der TCS Fax-Tragödie.' },
    { npc: 'AUSBILDER', text: 'Da Sie ganz allein auf Ihrem Schrotthaufen durchs Asteroidenfeld geflogen sind, sparen wir uns die Grundschule.' },
    { npc: 'AUSBILDER', text: 'Uns fehlen Piloten. Ihr neuer Job ist einfach: Piraten abschießen. Wird deutlich besser bezahlt, als sich von ihnen abschießen zu lassen.' },
    { npc: 'AUSBILDER', text: 'Steuerung der Hornet: W/A/S/D oder Pfeiltasten zum Manövrieren, Q/E zum Rollen, SHIFT für Nachbrenner.' },
    { npc: 'AUSBILDER', text: 'Zielen mit Maus oder Stick, Feuer mit LEERTASTE oder Maustaste. Mit [1-4] geben Sie später Ihrem Flügelmann Befehle.' },
    { npc: 'AUSBILDER', text: 'Autopilot zum nächsten Nav-Punkt ist [A], Sektorkarte ist [K]. Der Autopilot ist Baujahr 1984 — er funktioniert meistens.' },
    { npc: 'AUSBILDER', text: 'Dann zeigen Sie mal, was Sie können: Eine Welle, drei simulierte Piraten-Drohnen. Schießen Sie sie ab, und das Cockpit gehört Ihnen!' }
  ],

  // Bestanden
  bestanden: [
    { npc: 'AUSBILDER', text: 'Sauber geflogen! Simulator-Test bestanden. Ihre Hornet steht im Hangar bereit — gehen wir Piraten jagen!' }
  ],

  // Nicht bestanden (Pro forma: trotzdem eingestellt, weil Piloten fehlen!)
  durchgefallen: [
    { npc: 'AUSBILDER', text: 'Simulator-Schild auf Null. Normalerweise wären Sie durchgefallen — aber uns fehlen Piloten so dringend, dass wir beide Augen zudrücken.' },
    { npc: 'AUSBILDER', text: 'Formular 83-B Teil C: „Unter Vorbehalt eingestellt.“ Üben Sie bei Gelegenheit nochmal am Simulator im Schulraum!' }
  ],

  // Nach der Akademie: Crew-Begrüßung
  crewReaktion: [
    { npc: 'SECHS', text: 'Aus dem Frachter-Wrack direkt ins Hornet-Cockpit? Gefällt mir. Ich halte dir da draußen den Rücken frei.' },
    { npc: 'NEUN', text: 'Hauptsache, jemand schießt endlich diesen Piratenkapitän „Der Kugelschreiber“ aus dem Sektor!' },
    { npc: 'ZWO', text: 'Die Abschussprämien sind pünktlich. Das Essen in der Kantine weniger.' },
    { npc: 'VIER', text: 'Willkommen bei den Lebenden. Hier ist dein Spindschlüssel.' }
  ],

  // Sim-Konfiguration
  sim: {
    wellen: 1,
    feinde: 3,
    zeit: 60
  }
};
