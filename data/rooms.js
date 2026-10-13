// ===== SOLO WING 1990 — RÄUME (Phase 6.1) =====
// Der Träger als "fliegendes Dorf". 13 statische Räume.
// v0.6.9-final: + SPINDE (Bunker) — eigene Kabine, Save/Load.
// Jeder Raum: Artstyle (prozedural), NPCs, Türen (Nachbarn), Zweck.
// Konferenz: No Thinking + Lead Story Writer, 2 Runden.

SW.Rooms = [
  {
    id: 'bar', name: 'BAR', zweck: 'Piloten, Scoreboard, Dialoge',
    farbe: '#8a6d3b', akzent: '#ffcc00',
    npcs: ['Sechs','Neun','Zwo'],
    toren: ['flugdeck','kantine','kapelle','schule'],
    art: 'bar' // prozedural: Theke, Fenster, Scoreboard
  },
  {
    id: 'flugdeck', name: 'FLUGDECK', zweck: 'Mission-Start, Carrier-Kontrolle',
    farbe: '#2a3a4a', akzent: '#00ccff',
    npcs: ['Commander'],
    toren: ['bar','buerro','maschinenraum'],
    art: 'flugdeck' // prozedural: Konsole, Screens, Start-Button
  },
  {
    id: 'buerro', name: 'KAPITÄN-BÜRO', zweck: 'Akten, Befehle, Formulare',
    farbe: '#3a2a1a', akzent: '#ff9900',
    npcs: ['Commander','Archiv'],
    toren: ['flugdeck','kantine','beobachtung','schule'],
    art: 'buerro' // prozedural: Schreibtisch, Aktenregale, Fax
  },
  {
    id: 'kantine', name: 'KANTINE', zweck: 'Essen, Klatsch, Missionsbriefing mit Resten',
    farbe: '#4a3a2a', akzent: '#ff6644',
    npcs: ['Ragnhild','Löffel'],
    toren: ['bar','buerro','krankenstation','spinde'],
    art: 'kantine' // prozedural: Tische, Neon, Speisekarte
  },
  {
    id: 'kapelle', name: 'KAPELLE', zweck: 'Beerdigung der Gefallenen, Kerzen zünden',
    farbe: '#1a1a2a', akzent: '#6666aa',
    npcs: ['Klopstock','Stille'],
    toren: ['bar','krankenstation','beobachtung'],
    art: 'kapelle' // prozedural: dunkles Holz, Kreuz aus Schraubenziehern, Kerzen
  },
  {
    id: 'reparatur', name: 'REPARATUerraum', zweck: 'Schadensreparatur, meckert bei Beschädigung',
    farbe: '#3a3a2a', akzent: '#ffcc00',
    npcs: ['Bolt','Mutters'],
    toren: ['maschinenraum','flugdeck','kantine'],
    art: 'reparatur' // prozedural: Öl, Kabelsalat, Warnleuchten, alles schief
  },
  {
    id: 'friseur', name: 'FRISUR "SCHNITTSTELLE"', zweck: 'Haarschnitt, Frisuren=Rangabzeichen',
    farbe: '#4a2a4a', akzent: '#ff66cc',
    npcs: ['Scherenflick'],
    toren: ['bar','kantine','beobachtung'],
    art: 'friseur' // prozedural: Spiegelwände, bunte Tücher, Stühle
  },
  {
    id: 'beobachtung', name: 'BEOBACHTUNGSDT', zweck: 'Ausblick ins Nichts, Ruhe, Automata "Sicht 50 Pfennig"',
    farbe: '#0a0a1a', akzent: '#3366ff',
    npcs: ['Spiegel'],
    toren: ['buerro','kapelle','friseur'],
    art: 'beobachtung' // prozedural: Scheibewand ins Nichts, Sterne, Automata
  },
  {
    id: 'maschinenraum', name: 'MASCHINENRAUM', zweck: 'Antrieb, Warpcraft, Kassetten-Tape-Loop',
    farbe: '#2a2a3a', akzent: '#00ff00',
    npcs: ['Diskettens','Rohr'],
    toren: ['flugdeck','reparatur','krankenstation','schule'],
    art: 'maschinenraum' // prozedural: Rohre, Hebel, brummende Motoren
  },
  {
    id: 'krankenstation', name: 'KRANKENSTATION', zweck: 'Heilung, Verletzungen, Check-ups',
    farbe: '#2a3a3a', akzent: '#00ccaa',
    npcs: ['Pflaster','Nadel'],
    toren: ['kantine','kapelle','maschinenraum'],
    art: 'krankenstation' // prozedural: steriles Weiß, grüne Akzente, Bettreihen
  },
  {
    id: 'klo', name: 'KLO', zweck: 'Wasser. Immer Wasser. Und dann kommt das, was nach Wasser kommt.',
    farbe: '#1a2a2a', akzent: '#88ccaa',
    npcs: ['KLO'],
    toren: ['bar','krankenstation'],
    art: 'klo' // prozedural: Kacheln, Spülung, Wischmopp
  },
  {
    id: 'schule', name: 'SCHULRAUM "ZWEIG"', zweck: 'Git-Unterricht, Weiterbildung, Unfall-Analyse',
    farbe: '#1a2a1a', akzent: '#ccff66',
    npcs: ['Diskettens','Archiv'],
    toren: ['maschinenraum','buerro','bar'],
    art: 'schule' // prozedural: Tafel mit Git-Tree, Schülertische, Formular-14-C-Poster, Katze am Fenster
  },
  {
    id: 'spinde', name: 'SPINDE', zweck: 'Eigene Kabine. Save/Load. Hier kommen keine rein.',
    farbe: '#3a3a4a', akzent: '#ffaa00',
    npcs: [],
    toren: ['kantine'],
    art: 'spinde' // prozedural: Spindwand, eigener Spind mit Namensschild, Lagerbett, Bunker-Tür
  }
];

// NPCs pro Raum (aus Crew-Data + neue)
SW.RoomNPCs = {
  Ragnhild: { name:'Ragnhild', posten:'Köchin', farbe:'#ff6644',
    bio:'Meckert über Vorräte. Das Menü ist im Stil der Bedienungsanleitung gedruckt.',
    quote:'Die Kantine riecht nach Toner-Leck. Ist \'n Eigengeschmack, das.' },
  Klopstock: { name:'Pfarrer Klopstock', posten:'Kapelle', farbe:'#6666aa',
    bio:'Spricht nur in Floskeln. Hat 47 Beerdigungen gehalten, alle mit derselben Formel.',
    quote:'In stiller Trauer. In stiller Trauer. In stiller Trauer.' },
  Bolt: { name:'Ingenieur Bolt', posten:'Reparatur', farbe:'#ffcc00',
    bio:'Flucht auf Dialekt, zickt bei jedem Fehler. Hat das Schiff zusammengehalten, seit Diskettens das letzte Mal ein Gebet gesprochen hat.',
    quote:'Das Schiff blutet. Ich sag\'s euch: DAS Schiff blutet. Und ich soll\'s flicken?' },
  Scherenflick: { name:'Scherenflick', posten:'Friseur', farbe:'#ff66cc',
    bio:'Redet nur in Metaphern. Frisuren = Rangabzeichen. Ein Haarschnitt kostet 3 Formulare.',
    quote:'Dein Haar ist wie ein ungelöstes Formular. Ich schneide es frei.' },
  Pflaster: { name:'Frau Pflaster', posten:'Sanitäterin', farbe:'#00ccaa',
    bio:'Sanft, aber direkt. Kennt jede Wunde beim Namen. Hat ein Tamagotchi am Herzmonitor.',
    quote:'Du blutest. Setz dich. Ich hol\'s Pflaster. Und das Tamagotchi.' },
  Diskettens: { name:'Ottovian Diskettens', posten:'Maschinenraum', farbe:'#00ff00',
    bio:'Erklärt das Warpcraft auf einem Kassetten-Tape-Loop. Kalte Dose Cola noch in der Faust.',
    quote:'Läuft mit zwei Disketten und einem Gebet. Zwei Disketten reichen.' },
  KLO: { name:'KLO', posten:'Klo', farbe:'#88ccaa',
    bio:'Keine Klofrau. Keine Alien. Beides. Oder nichts. Sie putzt. Sie weiß. Sie sagt wenig. Aber was sie sagt, ist wahr.',
    quote:'Das Klo stinkt nach Toner. Wie die Kantine. Das Schiff stinkt überall nach Toner. Ich wische.' },
  Archiv: { name:'Archiv', posten:'Büroklammer', farbe:'#ff9900',
    bio:'Stempelt was der Commander nicht liest. Kennt jede Akte. Spricht nie. Nur das Klicken der Klammer.',
    quote:'*Klicken.*' },
  Löffel: { name:'Löffel', posten:'Kellner', farbe:'#ff6644',
    bio:'Serviert die Suppe. Spricht nie. Nur das Klirren der Löffel. Man hört ihn, bevor man ihn sieht.',
    quote:'*Klirren.*' },
  Stille: { name:'Stille', posten:'Novize', farbe:'#6666aa',
    bio:'Hat noch nie etwas gesagt. Aber alle hören zu. Sitzt in der letzten Reihe. Die Kerze neben ihr brennt länger.',
    quote:'...' },
  Mutters: { name:'Mutters', posten:'Schweißerin', farbe:'#ffcc00',
    bio:'Schweißt Metall. Bolt repariert Elektronik. Sie streiten sich um das letzte Stück Isolierband. Seit 1987.',
    quote:'Das Band ist MEINS. Ich hab es zuerst gesehen.' },
  Spiegel: { name:'Spiegel', posten:'Astronom', farbe:'#3366ff',
    bio:'Starrt durchs Okular. Sieht nur den leeren Bildschirm. Wartet auf ein Signal, das nie kommt. Oder doch.',
    quote:'Da. Nichts. Aber da.' },
  Rohr: { name:'Rohr', posten:'Kühlsystem', farbe:'#00ff00',
    bio:'Pflegt die Rohre. Das Schiff kocht vor, aber der Kaffee ist kalt. Er weiß warum. Er sagt es nicht.',
    quote:'Die Rohre atmen. 2/min. Wie Kältekammer 7.' },
  Nadel: { name:'Nadel', posten:'Sanitäter', farbe:'#00ccaa',
    bio:'Sticht. Pflaster klebt. Sie arbeiten in stiller Schichtarbeit. Niemand weiß, wer wer ist.',
    quote:'*Stechen.*' }
};

// "Hinter der Tür" (erwähnt, nicht implementiert)
SW.RoomsBehindDoor = [
  { name:'Sicherheitsbüro', hint:'Dunkle Tür, Schild "Nur mit Durchlass." Der Durchlass ist ein Foto einer Katze. Die Katze ist gegangen.' },
  { name:'Lukschleuse', hint:'Eine Tür auf Kälte hin. Die rote Lampe flackert, nicht kaputt — gerührt.' },
  { name:'Galerie der verlorenen Namen', hint:'Gerahmte Postkarten aller, die das Dorf zurückgelassen hat. Alle ohne Text. Jemand hängt wöchentlich neue leere hin.' },
  { name:'Papierkathedrale (Fax-Archiv)', hint:'340.000 Blätter des Fax-Protokolls von 1987 wuchsen eigene Architektur.' }
];
