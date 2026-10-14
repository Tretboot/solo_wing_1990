// ===== SOLO WING 1990 — LORE DATA =====
// Das eingefrorene Alien, Piraten, Optimierer, Strafversetzte, KLO.
// Reine Daten. Kein DOM. Kein Rendering.

'use strict';

SW.Lore = {

  // ===== DAS EINGEFRORENE ALIEN ("DAS GEPÄCK") =====
  // Der eigentliche "Wert" an Bord des Frachters.
  // Man weiß nicht, was es ist. Man weiß nur: es atmet.
  alien: {
    name: 'DAS GEPÄCK',
    codename: 'KÄLTEKAMMER 7',
    status: 'eingefroren',
    atmet: true,
    // Funk-Meldungen, wenn man den Frachter erreicht
    funkMeldungen: [
      'Kältekammer 7: Temperatur stabil. Atmung: 2/min. Keine Anomalien.',
      'Kältekammer 7: Atmung: 3/min. Temperatur: stabil. Anomalie: keine. Noch nicht.',
      'Kältekammer 7: Atmung: 4/min. Temperatur: sinkt. Anomalie: es hat sich bewegt.'
    ],
    // Dialog, wenn man es "sieht" (Ende der Mission)
    dialog: [
      { npc: 'COMMANDER', text: 'Kältekammer 7. Es ist da. Es atmet. Das ist alles, was ich weiß.' },
      { npc: 'KLO', text: 'Atmen ist kein Formular. Atmen ist kein Formular.' },
      { npc: 'COMMANDER', text: 'Beförderung oder nicht? Das Formular dafür ist 99-Z. "Gefährliche Fracht." Teil A: Was ist es. Teil B: Was ist es nicht. Teil C: Was es sein könnte. Teil C ist immer leer.' },
      { npc: 'SECHS', text: 'Ich trink was. Es atmet. Ich trink was. Das ist mein Formular.' },
      { npc: 'KLO', text: 'Es weiß, was kommt. Ich sage es nicht. Ich putze.' }
    ],
    // Der Optimierer will es "optimieren"
    optimiererReaktion: [
      { npc: 'OPTIMIERER', text: 'Kältekammer 7. Ich habe es gesehen. Es ist ineffizient. Es atmet zu oft. Ich empfehle: 1 Atemzug weniger pro Minute.' },
      { npc: 'OPTIMIERER', text: 'Das ist kein Vorschlag. Das ist eine Empfehlung. Die Empfehlung ist verbindlich.' },
      { npc: 'OPTIMIERER', text: 'Sie können widersprechen. Formular 91-X. "Widerspruch gegen Optimierung." Teil C ist immer: "Strafversetzung."' }
    ]
  },

  // ===== PIRATEN =====
  // Selbstmörderisch. Unterlegene Schiffe. Lernen sie es nicht.
  // In Schwärmen lästig. Tutorial-Gegner.
  piraten: {
    name: 'DIE KUGELSCHREIBER-FLOTTE',
    kapitaen: 'DER KUGELSCHREIBER',
    // Warum sie angreifen:
    motivation: 'Sie haben gehört, dass "was" an Bord ist. Sie wollen es haben. Sie wissen nicht, was es ist.',
    // Funk-Dialoge (während der Mission)
    // NOTE: Der Kugelschreiber hört RAP-MUSIK. Man versteht ihn kaum.
    // Der Witz: Er funkts über der Musik, und man muss "mach mal die Musik leiser" sagen.
    funk: [
      { npc: 'KUGELSCHREIBER', text: '*Rapmusik* ...yo, hier der Kugelschreiber, wir haben euren Frachter, die Fracht ist leer, aber da ist "was" in der Kältekammer, wir wollen es, gebt es her, oder wir fliegen durch, *Beat* ...' },
      { npc: 'FLUG_DREI', text: 'Mach mal die Musik leiser, wenn du mich hier überfällst und erpressen willst!' },
      { npc: 'KUGELSCHREIBER', text: '*Musik leiser* ...was? Ach, sorry. *Musik leiser* Ich habe 1987 aufgehört, Formulare auszufüllen. Seitdem lebe ich. Ihr füllt sie immer noch aus. Seitdem... existiert ihr.' },
      { npc: 'KUGELSCHREIBER', text: '*Musik lauter* ...wir sind zu viert, ihr seid zu eins, das ist keine Bedrohung, das ist eine Statistik, *Beat* ...' },
      { npc: 'KUGELSCHREIBER', text: '*Musik leiser* Die Kältekammer. Gebt sie her. Wir wollen sie nicht öffnen. Wir wollen sie haben. Das ist der Unterschied. *Musik lauter* ...' }
    ],
    // Der Rap-Witz (Lore)
    rap: 'Der Kugelschreiber hört Rapmusik. Immer. Auch wenn er funkts. Man versteht ihn kaum. Wenn er einen überfällt, muss man erst "mach mal die Musik leiser" sagen. Er findet das fair. Er dreht runter. Dann dreht er wieder auf. Das ist kein Bug. Das ist Rap.',
    // Schiff-Namen (Pixel-Art, krumm, fleckig, mit Aufklebern)
    schiffe: [
      { name: 'DER KUGELSCHREIBER', typ: 'kapitaen', farbe: '#ff6633' },
      { name: 'DIE LUNCHDOSE', typ: 'jaeger', farbe: '#ff4422' },
      { name: 'DAS MODEM', typ: 'jaeger', farbe: '#ff5511' },
      { name: 'DER DRUCKER', typ: 'jaeger', farbe: '#ff3344' }
    ]
  },

  // ===== DER OPTIMIERER =====
  // Ein Kollege des Audits. Kein Bösewicht. Ein Kollege, der von der Heimatbasis kommt.
  // Er hat recht. Und das ist schlimmer.
  optimierer: {
    name: 'DER OPTIMIERER',
    // TTS-Profil: perfekt. Nicht zu tief. Nicht zu hoch. Nicht zu schnell. Nicht zu langsam.
    tts: { rate: 1.0, pitch: 1.0, lang: 'de-DE' },
    // Er erscheint nach der Mission in der Bar.
    erscheinung: [
      { npc: 'OPTIMIERER', text: 'Guten Tag. Ich bin der Optimierer. Ich komme von der Heimatbasis. Ich bin hier, um zu optimieren.' },
      { npc: 'OPTIMIERER', text: 'Ihre Effizienz liegt bei 34%. Das ist unter dem Durchschnitt. Der Durchschnitt ist 72%. Sie sind 38% unter dem Durchschnitt.' },
      { npc: 'OPTIMIERER', text: 'Ich empfehle: 2 Piloten weniger. 1 Kaffee weniger. 1 Aufzug weniger. 1 Torte weniger. 1 Würfelspiel weniger.' },
      { npc: 'OPTIMIERER', text: 'Das ist kein Vorschlag. Das ist eine Empfehlung. Die Empfehlung ist verbindlich.' },
      { npc: 'SECHS', text: 'Der trinkt Wasser. Seit 1989 trinke ich Schnaps. Er trinkt Wasser. Ich trinke Schnaps. Wer hat recht?' },
      { npc: 'ZWO', text: 'Keiner. Aber er hat den Ordner.' }
    ]
  },

  // ===== STRAFVERSETZTE (Backstory pro Pilot) =====
  // Im Aktenschrank. Wenn gelesen → ansprechen → neuer Dialog.
  akten: {
    sechs: {
      titel: 'AKTE: SECHS',
      grund: 'Übermäßige Alkoholisierung im Dienst (1987)',
      backstory: 'Sechs wurde 1987 aus dem aktiven Dienst entlassen. Grund: "Übermäßige Alkoholisierung im Dienst." Er war nicht betrunken. Er war optimiert. Der Schnaps war ein Upgrade. Seitdem fliegt er. Seitdem trinkt er. Das ist kein Widerspruch.',
      ansprechen: { npc: 'SECHS', text: 'Sie haben meine Akte gelesen. Gut. Ich war nicht betrunken. Ich war optimiert. Der Schnaps war ein Upgrade. Das Formular hat das nicht verstanden. Das Formular versteht nichts.' }
    },
    neun: {
      titel: 'AKTE: NEUN',
      grund: 'Formular 83-B dreimal falsch ausgefüllt',
      backstory: 'Neun hat Formular 83-B dreimal falsch ausgefüllt. Das Formular war falsch. Nicht er. Dreimal. Dreimal falsch. Das Formular 83-B ist in zwei Teilen. Teil B ist "Wer ist schuld." Teil B ist immer leer. Weil wir es nicht wissen. Aber das Formular will eine Antwort.',
      ansprechen: { npc: 'NEUN', text: 'Sie haben meine Akte gelesen. Das Formular war falsch. Nicht ich. Dreimal. Dreimal falsch. Ich habe es dreimal ausgefüllt. Dreimal. Das Formular war falsch.' }
    },
    zwo: {
      titel: 'AKTE: ZWO',
      grund: 'Keine Angabe',
      backstory: 'Zwo wurde strafversetzt. Grund: keine Angabe. Die Akte ist leer. Das ist keine Angabe. Das ist eine Aussage. Zwo trinkt Wasser. Der Schnaps hat seit 1989 denselben Geschmack. Das ist kein Alkohol mehr. Das ist eine Erinnerung.',
      ansprechen: { npc: 'ZWO', text: 'Sie haben meine Akte gelesen. Leere Akte. Das ist keine Angabe. Das ist eine Aussage. Ich trink Wasser. Der Schnaps ist eine Erinnerung. An 1989. Ja.' }
    },
    vier: {
      titel: 'AKTE: VIER',
      grund: 'Freiwillig. Grund: keine Angabe.',
      backstory: 'Vier ist nicht strafversetzt. Vier ist freiwillig da. Niemand fragt, warum. Aber alle denken darüber nach. Und das ist schlimmer als jede Frage. Vier lacht. Vier ist der Einzige, der lacht. Das ist der Witz.',
      ansprechen: { npc: 'VIER', text: 'Sie haben meine Akte gelesen. Freiwillig. Grund: keine Angabe. Das ist der Witz. Niemand fragt. Aber alle denken. Ich lache. Das ist mein Formular.' }
    },
    flugDrei: {
      titel: 'AKTE: FLUG DREI',
      grund: 'Neu. Keine Vorgeschichte.',
      backstory: 'Flug Drei ist neu. Keine Vorgeschichte. Die Akte ist leer. Das ist gut. Leere Akten sind die einzigen, die noch funktionieren. Vier Piloten vor Ihnen. Keiner hat unterschrieben. Das Formular liegt trotzdem bereit. Für Sie.',
      ansprechen: { npc: 'COMMANDER', text: 'Ihre Akte ist leer. Das ist gut. Leere Akten sind die einzigen, die noch funktionieren. Vier Piloten vor Ihnen. Keiner hat unterschrieben. Das Formular liegt trotzdem bereit. Für Sie. Formular 83-B.' }
    }
  },

  // ===== KLO =====
  // Keine Klofrau. Keine Alien. Beides. Oder nichts. Sie putzt. Sie weiß.
  klo: {
    name: 'KLO',
    // Erstkontakt (auf dem Klo)
    erstkontakt: [
      { npc: 'KLO', text: 'Das Klo stinkt nach Toner.' },
      { npc: 'KLO', text: 'Wie die Kantine. Das Schiff stinkt überall nach Toner. Ich wische.' }
    ],
    // Vor Missionen (ein Satz, nur)
    vorMission: {
      m1: { npc: 'KLO', text: 'Drei Wellen. Keine Verspätung. Das Formular ist gestempelt.' },
      m2: { npc: 'KLO', text: 'Der Frachter hat eine Kältekammer. Die Kältekammer atmet. Das ist kein Formular.' },
      m3: { npc: 'KLO', text: 'KEIN FEUER. Wiederholung: KEIN FEUER. Das Formular dafür gibt es nicht.' }
    },
    // Tratsch (später, Romantik-System)
    tratsch: [
      { npc: 'KLO', text: 'Sie fragen mich nach dem Tratsch. Sechs hat die VHS-Karte nie bezahlt. Neun hat die VHS-Karte nie bezahlt. Zwo hat die VHS-Karte nie bezahlt. Vier hat die VHS-Karte nie bezahlt. Der Commander hat die VHS-Karte nie bezahlt. Das ist kein Tratsch. Das ist eine Statistik.' },
      { npc: 'KLO', text: 'Der Optimierer trinkt Wasser. Seit 1989 trinkt Sechs Schnaps. Das ist kein Tratsch. Das ist eine Empfehlung.' }
    ],
    // Ihre Quest (keine klassische Quest)
    quest: {
      text: 'Sie fragen mich, was kommt. Ich sage: Wasser. Immer Wasser. Und dann kommt das, was nach Wasser kommt.',
      belohnung: 'Sie sagt etwas Wahres. Sie sagt es nur einmal.'
    }
  },

  // ===== DAS AUDIT (Feind, Mostly Blank) =====
  // Geometrische Formen. Wireframe. Keine Details. Nur Linien.
  audit: {
    name: 'DAS AUDIT',
    // Ihr "Krieg" ist ein Audit. Ihre "Waffen" sind Fristen. Ihre "Explosionen" sind Stempel.
    schiffStyle: 'wireframe', // graue Linien, keine Füllung
    farbe: '#888888',
    // Wenn sie "explodieren": keine Explosion. Die Linien verschwinden. Grüner Stempel bleibt.
    explosion: 'stempel',
    // Ihre Sprache: Formularnummern. Kein Smalltalk.
    sprache: [
      'Formular 7.2.1.4. Antwort innerhalb von 3 Zyklen.',
      'Ihr System ist überbesetzt. Umstrukturierung in 5 Zyklen.',
      'Ihre Effizienz liegt bei 34%. Das ist unter dem Durchschnitt.',
      'Optimierung empfohlen. Empfehlung ist verbindlich.'
    ]
  },

  // ===== SEKTOR-INFO =====
  sektoren: {
    s1: {
      name: 'SEKTOR 7',
      char: 'militärisch, staubig, alt — Heimat, Training',
      // Was ist dort los?
      hintergrund: 'Sektor 7 ist Heimat. Hier trainiert man. Hier fliegt man. Hier stempelt man. Die Revision ist noch nicht da. Aber sie kommt. In 5 Zyklen.'
    },
    s2: {
      name: 'SEKTOR 9',
      char: 'industrial, laut, fracht — Handelsroute, Frachter',
      hintergrund: 'Sektor 9 ist Fracht. Hier fliegen die Kisten. Hier sind die Piraten. Hier ist die Kältekammer. Hier atmet das Gepäck.'
    },
    s3: {
      name: 'SEKTOR 12',
      char: 'neutral, staubig, zivil — Siedlerkolonie, wenig Verkehr',
      hintergrund: 'Sektor 12 ist zivil. Hier wohnen die Siedler. Sie sind 1987 angekommen. Niemand hat ihnen gesagt, warum. Sie wohnen trotzdem.'
    }
  }
};
