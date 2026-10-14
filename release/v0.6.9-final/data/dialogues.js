// ===== SOLO WING 1990 — DIALOGUE DATA (Phase 4) =====
// NPC conversations. Linear arrays. Click/Space advances.
// Phase 4: Bar-Dialoge (3 Systeme), Funksprüche, Briefing-Tafel.

SW.Dialogues = {
  // Backstory / Handbuch-Einleitung (BAR state)
  backstory: [
    "Jahr 1990. Sternenschiff 'FAX-TRAGÖDIE'. Flug Drei, Solo-Posten, Sektor 7.",
    "Das Sternenkorps ist müde, unterbesetzt und stempelt mehr, als es fliegt.",
    "Ihr Befehl: Einzelne Interception, laut Briefing auf zwei Fax-Seiten.",
    "Die Gegenseite fliegt Technik aus 1986. Die sind zwei Jahre voraus. Wir nicht.",
    "Ihre Rolle: Pilot. Keine Fragen. Formular 83-B liegt im Cockpit.",
    "Vier Ihrer Vorgänger haben dasselbe Fax bekommen. Keiner hat unterschrieben.",
    "Start frei, sofern das Faxgerät im Cockpit funktioniert.",
    "Willkommen an Bord, Flug Drei. Die Kantine ist zu. Der Kaffee auch."
  ],

  // BAR-SCENE Dialoge (pro System, optional durchklickbar)
  barScenes: {
    s1: [
      {npc:"SECHS",text:"Du fliegst heute? Du hast echt eine schlanke Linie. Mein Vorschlag: weniger Treibstoff, mehr Anzug."},
      {npc:"NEUN",text:"Stimmt das mit den drei Wellen? Ich hab das Formular dreimal gelesen. Ist da eine Welle vier? Nur zur Sicherheit."},
      {npc:"SECHS",text:"Es gibt keine Welle vier, Neun. Es gibt Welle drei und dann die Kantine."},
      {npc:"ZWO",text:"Ich hab mal gefragt, warum wir 'Sternenkorps' heißen. Der Commander hat gesagt: 'Weil wir unterbesetzt sind.'"},
      {npc:"NEUN",text:"Und die anderen vier Vorgänger? Was ist mit denen passiert?"},
      {npc:"SECHS",text:"Sie haben das Fax nicht unterschrieben. Das ist kein Vorwurf. Das ist ein Muster."}
    ],
    s2: [
      {npc:"ZWO",text:"Frachter eskortieren. Wie letzte Woche, nur diesmal explodiert er vielleicht."},
      {npc:"VIER",text:"Ich bin sicher, klappt alles! Ich hab sogar einen Notfallplan: Ich lache."},
      {npc:"ZWO",text:"Dein Notfallplan ist ein Formular. Ein leeres."},
      {npc:"VIER",text:"Wissen Sie was, Zwo? Sie sind wie ein Faxgerät. Funktionieren immer. Aber niemand will Sie."},
      {npc:"ZWO",text:"...Das war fast beleidigend. Fast."},
      {npc:"SECHS",text:"Der Frachter hat eine Torte an Bord. Falls er überlebt. Falls WIR überleben. Doppelte Bedingung."}
    ],
    s3: [
      {npc:"NEUN",text:"Also, KEIN FEUER, hab ich verstanden. Aber was ist, wenn einer schaut wie eine Waffe? Zünde ich dann?"},
      {npc:"BARKEEP",text:"*Klicken* Koffein nicht verfügbar. Wiederkehr in 40 Zyklen."},
      {npc:"NEUN",text:"Kann ich wenigstens ein Fax bekommen?"},
      {npc:"BARKEEP",text:"*Klicken* Faxgerät in Wartung. Wartung seit 1988. Formular 83-B liegt bereit."},
      {npc:"SECHS",text:"Sektor 12 ist zivil. Das heißt: Sie schießen nicht. Das heißt auch: Sie fliegen nicht schnell. Das heißt: Sie langweilen sich."},
      {npc:"NEUN",text:"Kann ich wenigstens flüstern?"},
      {npc:"SECHS",text:"Im Vakuum? Nein, Neun. Auch das geht nicht."}
    ]
  },

  // BRIEFING-TAFEL (Commander erklärt Mission vor dem Schnitt)
  briefingBoards: {
    m1: [
      "Drei Wellen, keine Verspätung. Destruktoren, Jäger, ein Kreuzer.",
      "Schützen Sie die Formation, halten Sie die Geschosse. Keine Helden, nur Arbeit.",
      "Bewertung erfolgt nach Resten."
    ],
    m2: [
      "Frachter eskortieren, bis er ankommt. Oder bis er weg ist.",
      "Feind ist aggressiv, Frachter ist empfindlich. Priorität bleibt oben.",
      "Melden Sie Schäden, bevor sie zum Formular werden."
    ],
    m3: [
      "KEIN FEUER. Wiederholung: KEIN FEUER.",
      "Sie eskortieren, Sie schützen, Sie schießen nicht. Selbst wenn es flüstert.",
      "Siedler sind zäh, aber nicht unsterblich."
    ]
  },

  // Pre-mission briefings (Cockpit, nach Takeoff)
  briefings: {
    m1: [
      {npc:"COMMANDER",text:"Flug Drei. Einzelne Interception, Sektor 7. Vier Ihrer Vorgänger haben dieses Briefing auch bekommen."},
      {npc:"COMMANDER",text:"Die Gegenseite fliegt state of the art Technik. Von 1986."},
      {npc:"COMMANDER",text:"Start frei. Benutzen Sie das Faxgerät im Cockpit nur im Notfall."}
    ],
    m2: [
      {npc:"COMMANDER",text:"Geleitschutz, Sektor 9. Der Frachter fliegt auf Windows 95. Der Schieße-Modus kommt erst nach dem dritten Neustart hoch."},
      {npc:"COMMANDER",text:"Start frei. Der Frachter hat eine Torte an Bord. Für den Fall, dass es klappt."}
    ],
    m3: [
      {npc:"COMMANDER",text:"Sektor 12. Zivile Signatur. Sie fliegen verloren. Eskortieren Sie sie. KEIN FEUER."},
      {npc:"COMMANDER",text:"Dann ist es nicht zivil. Aber das Formular dafür gibt es nicht. Improvisieren Sie."}
    ]
  },

  // Post-mission (Bar scene)
  postVictory: [
    {npc:"SECHS",text:"Du fliegst wie ein Modem unter Last: laut, langsam, aber es kommt Signal an. Respekt."},
    {npc:"SECHS",text:"Gibst du mir noch was vom Schnaps? Die haben 90er drauf, das ist ein gutes Zeichen."},
    {npc:"SECHS",text:"Nächsten Einsatz bekommst du per Fax. Ich hab's schon vorgedruckt, Formular 12-A."},
    {npc:"COMMANDER",text:"Beförderung laut Formular 41-C. Der Aufzug zum Stab ist in Arbeit, Sie steigen die Treppe."}
  ],

  postDeath: [
    {npc:"SECHS",text:"Der hat die VHS-Karte nie bezahlt. Kopfhörer sind noch in der Spinde."},
    {npc:"NEUN",text:"Ist es ... ist es furchtbar für ihn?"},
    {npc:"COMMANDER",text:"Nächster."}
  ],

  // Beerdigungs-Sequenz
  funeral: [
    "Abgang 07:30, Kapelle B, hinterm Waschtrakt. Bitte nicht im Regen aufmarschieren.",
    "Blumen sind Formular 9-C. Wer eine Vase mitbringt, kriegt das Formular 10-A.",
    "Er hat bis 1990 keinen einzigen Kaffee mehr getrunken. Das ist seine letzte Kündigungsfrist.",
    "Die Urne wird in Spinde 14 gelagert. Schlüssel liegt bei Sechs.",
    "Abschlussrede: keine. Die Stempelstift ist trotzdem schon da."
  ],

  // UNSCHARFE FUNKSPRÜCHE (mit unscharfen Gesichtern)
  radioStatic: [
    "Hat jemand meinen Kugelschreiber gesehen? Er ist in der Waffenkammer.",
    "Der Drucker frisst wieder Seiten, er will vermutlich einen Urlaub.",
    "Jemand hat meine Lunchdose mit der Torte verwechselt.",
    "Das Modem rauscht wie ein Wüstensturm, bitte nicht auflegen.",
    "Formular 42 ist nicht ausgefüllt, alle bleiben in Deckung.",
    "Die VHS-Kassette mit dem Briefing klemmt, es ist ein Drama.",
    "Mein Kaffeeautomat hat sich in eine Waffe verwandelt.",
    "Der Fluchtweg B ist ein Büro, in dem niemand mehr arbeitet.",
    "Wer hat das Fenster aufgemacht? Hier draußen ist Vakuum.",
    "Das Windows-Fenster im Bordrechner ist seit 1995 offen.",
    "Formular 83-B ist in zwei Teilen. Teil B ist 'Wer ist schuld'. Bitte nicht ausfüllen. Es gibt keine Antwort.",
    "Der Aufzug zum Stab ist immer noch in Arbeit. Seit 1986. Die Treppe hat 14 Stockwerke. Das ist keine Strafe.",
    "Jemand hat das Faxgerät repariert. Es funktioniert jetzt. Es hat ein Formular gedruckt. 'Faxgerät funktioniert jetzt.' Formular 99-X.",
    "Die Kantine hat heute 'Experiment'. Das heißt: Niemand weiß, was es ist. Es schmeckt nach Suppe. Meistens.",
    "Der Schrauber aus 1983 passt nicht zu den Schrauben aus 1986. Wir drehen trotzdem. Das ist Ingenieurskunst.",
    "Die Diskette A hat einen Kratzer. Die Diskette B hat zwei. Zusammen: drei. Das ist ein Rekord. Es war ein Dienstag.",
    "Wer hat die Torte auf dem Frachter gefressen? Die Torte war für den Fall, dass es klappt. Es hat geklappt. Die Torte ist weg.",
    "Formular 55-K: 'Helm zu eng.' Ja, das gibt es wirklich. Der Friseur schneidet auch Helme.",
    "Die Wand mit den Piloten ist voll. Wir suchen eine neue Wand. Seit 1985. Die neue Wand ist auch schon voll."
  ],

  // WINGMAN "SECHS" — Idle-Funk (IM RAUM, v0.75-dev)
  wingmanIdle: [
    "Immer noch da. Gut.",
    "Ich würde 'bleib am Leben' sagen, aber Formular 83-B geht davon schon aus.",
    "Der Kaffee auf dem Träger ist wieder kalt. Irgendeiner schuld. Wahrscheinlich Sie.",
    "Wenn ich nächsten Monat noch fliege, gibt es eine Beförderung. Formular 9-E, Teil C.",
    "Sie fliegen wie ein Formular. Immer gradeaus. Aber es funktioniert.",
    "Der Radar zeigt drei Kontakte. Zwei sind Sie und ich. Das sind keine Feinde."
  ],

  // RAUM-DIALOGE (Ship-Interior, Phase 6.1)
  rooms: {
    bar: [
      {npc:"SECHS",text:"Du fliegst heute? Du hast echt eine schlanke Linie. Mein Vorschlag: weniger Treibstoff, mehr Anzug."},
      {npc:"NEUN",text:"Stimmt das mit den drei Wellen? Ich hab das Formular dreimal gelesen. Ist da eine Welle vier?"},
      {npc:"SECHS",text:"Es gibt keine Welle vier, Neun. Es gibt Welle drei und dann die Kantine."},
      {npc:"ZWO",text:"Ich trink hier nur noch Wasser. Der Schnaps hat seit 1989 denselben Geschmack. Das ist kein Alkohol mehr. Das ist eine Erinnerung."},
      {npc:"NEUN",text:"Was ist die Erinnerung an?"},
      {npc:"ZWO",text:"An 1989. Ja."}
    ],
    flugdeck: [
      {npc:"COMMANDER",text:"Flugdeck. Alle Systeme nominal, außer das Faxgerät. Das ist nie nominal."},
      {npc:"COMMANDER",text:"Wenn Sie bereit sind, drücken Sie START. Wenn nicht, drücken Sie auch START. Es gibt keine andere Taste."},
      {npc:"COMMANDER",text:"Die Instrumente sind aus 1984. Die funktionieren. Die Instrumente aus 1987 funktionieren auch. Aber wir fliegen 1984. Budget."},
      {npc:"COMMANDER",text:"Vier Piloten vor Ihnen. Keiner hat unterschrieben. Das Formular liegt trotzdem bereit. Für Sie. Formular 83-B."}
    ],
    buerro: [
      {npc:"COMMANDER",text:"Mein Büro. Akten, Formulare, und ein Faxgerät, das seit 1988 nicht mehr funktioniert."},
      {npc:"COMMANDER",text:"Lesen Sie die Akten, wenn Sie wollen. Ich lese sie nicht. Ich stempel sie nur."},
      {npc:"ARCHIV",text:"*Klicken.* Akte 4471-B. 'Schiff explodiert.' Teil B: Wer ist schuld. Lege sie in den Ordner 'Noch nicht entschieden.'"},
      {npc:"COMMANDER",text:"Wissen Sie, was das Schlimmste an diesem Job ist? Nicht die Kriege. Die Kriege sind klar. Das Schlimmste ist, dass das Formular für 'Schiff explodiert' in zwei Teilen ausgefüllt werden muss."},
      {npc:"COMMANDER",text:"Teil A: Was ist explodiert. Teil B: Wer ist schuld. Teil B ist immer leer. Weil wir es nicht wissen. Aber das Formular will eine Antwort."},
      {npc:"ARCHIV",text:"*Klicken.* Ordner 'Noch nicht entschieden' ist voll. Ich baue einen neuen. Formular 99-N: 'Ordner voll.'"},
      {npc:"COMMANDER",text:"Der Aufzug zum Stab ist in Arbeit. Seit 1986. Sie steigen die Treppe. 14 Stockwerke. Das ist keine Strafe. Das ist Fitness."}
    ],
    kantine: [
      {npc:"RAGNHILD",text:"Suppe, Nudeln, oder Kaffee. Kaffee ist aus. Wie immer. Wie immer, wie immer."},
      {npc:"LÖFFEL",text:"*Klirren.*"},
      {npc:"RAGNHILD",text:"Die Kantine riecht nach Toner-Leck. Ist 'n Eigengeschmack, das. Gewöhnt euch dran."},
      {npc:"RAGNHILD",text:"Jemand hat gefragt, ob es mal was Besseres gibt. Ich hab gesagt: Ja. 1987. Aber das Budget war 1988."},
      {npc:"LÖFFEL",text:"*Klirren.* *Klirren.*"},
      {npc:"RAGNHILD",text:"Die Suppe ist heute 'Experiment'. Das heißt: Ich weiß es auch nicht. Es schmeckt nach Suppe. Meistens."}
    ],
    kapelle: [
      {npc:"KLOPSTOCK",text:"In stiller Trauer. In stiller Trauer. In stiller Trauer."},
      {npc:"STILLE",text:"..."},
      {npc:"KLOPSTOCK",text:"47 Beerdigungen, alle mit derselben Formel. Die 48. wird anders. Versprochen. Nein."},
      {npc:"KLOPSTOCK",text:"Die Blumen sind Formular 9-C. Die Vase ist Formular 10-A. Die Tränen sind Formular 11-Z. Aber das Formular 11-Z gibt es nicht. Also weinen Sie einfach."},
      {npc:"STILLE",text:"..."},
      {npc:"KLOPSTOCK",text:"Jeder Pilot, der hier begraben wird, kriegt einen Platz an der Wand. Die Wand ist voll. Wir suchen eine neue Wand. Seit 1985."}
    ],
    reparatur: [
      {npc:"BOLT",text:"Das Schiff blutet. Ich sag's euch: DAS Schiff blutet. Und ich soll's flicken?"},
      {npc:"MUTTERS",text:"Das Band ist MEINS. Ich hab es zuerst gesehen."},
      {npc:"BOLT",text:"Kommt nicht mit beschädigtem Flugzeug rein, ohne vorher ein Formular auszufüllen. Formular 77-R."},
      {npc:"BOLT",text:"Der Schrauber ist aus 1983. Die Schrauben sind aus 1986. Die passen nicht zusammen. Aber wir drehen trotzdem. Das ist Ingenieurskunst."},
      {npc:"MUTTERS",text:"Das Metall schweißt sich nicht. Es will nicht. Ich frage es höflich."},
      {npc:"BOLT",text:"Jemand hat gefragt, warum wir nicht einfach neue Teile nehmen. Ich hab gesagt: Neue Teile brauchen ein Formular. Altes Blech braucht auch ein Formular. Aber das alte Blech hat das Formular schon."}
    ],
    friseur: [
      {npc:"SCHERENFLICK",text:"Dein Haar ist wie ein ungelöstes Formular. Ich schneide es frei."},
      {npc:"SCHERENFLICK",text:"Frisur = Rang. Heute: Gefreiter. Das kostet drei Formulare. Und einen Kuss auf die Wange. Optional."},
      {npc:"SCHERENFLICK",text:"Der Commander hat mal eine Frisur gewollt. Ich hab gesagt: 'Das geht nur mit Formular 44-H.' Er hat das Formular nicht ausgefüllt. Seitdem hat er dieselbe Frisur."},
      {npc:"SCHERENFLICK",text:"Ich schneide auch Helme. Für die, die ihre Helme zu eng finden. Das Formular dafür ist 55-K. 'Helm zu eng.' Ja, das gibt es wirklich."}
    ],
    beobachtung: [
      {npc:"SYSTEM",text:"Beobachtungsdeck. Ausblick ins Nichts. Automata: Sicht 50 Pfennig."},
      {npc:"SPIEGEL",text:"Da. Nichts. Aber da."},
      {npc:"SYSTEM",text:"Kein NPC. Nur Sterne und das leise Summen eines Automaten, der nie einwirft."},
      {npc:"SPIEGEL",text:"Ich warte auf ein Signal. Es kommt nie. Oder doch. Ich weiß nicht mehr, wann ich zuletzt etwas gesehen habe."},
      {npc:"SYSTEM",text:"Der Automat hat einmal gewirkt. 1989. Er hat eine Tasse Kaffee ausgespuckt. Der Kaffee war kalt. Seitdem funktioniert er nicht mehr. Aus Respekt."},
      {npc:"SYSTEM",text:"Manche Piloten sitzen hier stundenlang. Nicht wegen der Sterne. Wegen der Stille. Im Rest des Schiffs gibt es immer ein Formular, das nicht ausgefüllt ist."}
    ],
    maschinenraum: [
      {npc:"DISKETTENS",text:"Läuft mit zwei Disketten und einem Gebet. Zwei Disketten reichen, das Gebet ist redundant."},
      {npc:"ROHR",text:"Die Rohre atmen. 2/min. Wie Kältekammer 7."},
      {npc:"DISKETTENS",text:"Das Warpcraft erkläre ich auf einem Kassetten-Tape-Loop. Seite um Seite, Baud um Baud."},
      {npc:"DISKETTENS",text:"Die Diskette A hat ein Kratzer. Die Diskette B hat zwei. Zusammen: drei Kratzer. Das ist ein Rekord. Wir haben es nicht gefeiert. Es war ein Dienstag."},
      {npc:"ROHR",text:"Das Schiff kocht vor. Aber der Kaffee ist kalt. Ich weiß warum. Ich sage es nicht."},
      {npc:"DISKETTENS",text:"Jemand hat gefragt, warum wir nicht auf Festplatten umsteigen. Ich hab gesagt: 'Festplatten brauchen ein Formular.' Disketten brauchen auch ein Formular. Aber die Diskette hat das Formular schon."}
    ],
    krankenstation: [
      {npc:"PFLASTER",text:"Du blutest. Setz dich. Ich hol's Pflaster. Und das Tamagotchi."},
      {npc:"NADEL",text:"*Stechen.*"},
      {npc:"PFLASTER",text:"Das Tamagotchi am Herzmonitor ist nicht kaputt. Es hat nur beschlossen, allein zu sein."},
      {npc:"PFLASTER",text:"Die Pflaster sind aus 1988. Die Wunden sind aus heute. Das passt. Alles passt. Meistens."},
      {npc:"NADEL",text:"*Stechen.* *Stechen.*"},
      {npc:"PFLASTER",text:"Jemand hat gefragt, warum wir kein Krankenhaus haben. Ich hab gesagt: 'Krankhäuser brauchen Formulare.' Wir haben Formulare. Also haben wir ein Krankenhaus. Theoretisch."}
    ],
    klo: [
      {npc:"KLO",text:"Das Klo stinkt nach Toner."},
      {npc:"KLO",text:"Wie die Kantine. Das Schiff stinkt überall nach Toner. Ich wische."},
      {npc:"KLO",text:"Sie fragen mich, was kommt. Ich sage: Wasser. Immer Wasser. Und dann kommt das, was nach Wasser kommt."},
      {npc:"KLO",text:"Die Revision hat ein Schiff umstrukturiert. Ich war da. Ich habe es geputzt. Danach. Es roch besser."},
      {npc:"KLO",text:"Kältekammer 7. Es atmet. 2/min. Das ist kein Formular. Das ist ein Atemzug."}
    ],
    schule: [
      {npc:"DISKETTENS",text:"Willkommen im Kurs 'Versionskontrolle für Leute, die mit verbundenen Augen auf die Tastatur drücken.' Formular 14-C ausfüllen. Selbstanzeige."},
      {npc:"DISKETTENS",text:"Lehrplan, Lektion eins: git status. VOR JEDEM COMMIT. Damit weißt du, was im Baum steht. Und was du fast mitgebracht hast."},
      {npc:"DISKETTENS",text:"Lektion zwei: git add <datei>. Gezielt. Nicht add -A. Der ganze Baum war bisher nicht deine Idee. Die Katze weist jede Verantwortung von sich."},
      {npc:"ARCHIV",text:"*Klicken.*"},
      {npc:"DISKETTENS",text:"Lektion drei: git commit -m 'Text'. Zeile eins sachlich. Zeile zwei darf Deadpan sein. 'Ich weiß nicht warum ich das kommentieren soll' ist keine Convention. Das ist ein Geständnis."},
      {npc:"DISKETTENS",text:"Lektion vier: git log --oneline. Die Historie. Unänderlich. Die letzten zwei Wochen hat es nicht gegeben."},
      {npc:"ARCHIV",text:"*Klicken.*"},
      {npc:"DISKETTENS",text:"Und die wichtigste Regel: Git lehnt leere Commits ab. Das ist auf diesem Schiff das Einzige, was zuverlässig funktioniert. Anwesenheit ist trotzdem Pflicht."},
      {npc:"DISKETTENS",text:"Hausaufgabe: README, GIT-Sektion. Dort liegt das Unfall-Protokoll. Die Katze hat den Vorfall nicht bestritten."}
    ]
  },

  // Sprung-Sequenzen (Zwischenszene: Träger springt zum Einsatz-System)
  // Backdrop = System-Farbe/Planet. Story läuft mit TTS, während das Schiff fliegt.
  jumps: {
    m1: [
      {npc:"SYSTEM",text:"Sprungvorbereitung. Ziel: SEKTOR 7. Kalt, blau, militärisch. Die Flotte patrouilliert."},
      {npc:"COMMANDER",text:"Vier Ihrer Vorgänger sind hier gestartet. Sie sind Nummer fünf. Das ist kein Versprechen. Das ist eine Statistik."},
      {npc:"SECHS",text:"Der Kaffee in Sektor 7 schmeckt nach Blech. Der auf dem Träger schmeckt nach nichts. Ich nehme beides."}
    ],
    m2: [
      {npc:"SYSTEM",text:"Sprungvorbereitung. Ziel: SEKTOR 9. Heiß, rot, instabil. Sprungpunkte ohne Gewähr."},
      {npc:"COMMANDER",text:"Grenzzone. Die Piraten zahlen keine Steuern. Das Formular für 'Piraten' gibt es nicht. Improvisieren Sie."},
      {npc:"SECHS",text:"In Sektor 9 hat die Kantine mal 'Experiment' serviert. Seitdem gibt es nur noch Suppe. Aus Respekt."}
    ],
    m3: [
      {npc:"SYSTEM",text:"Sprungvorbereitung. Ziel: SEKTOR 12. Neutral, staubig, zivil. Viel Ruhe."},
      {npc:"COMMANDER",text:"Siedlerkolonie. KEIN FEUER. Wiederholung: KEIN FEUER. Sie eskortieren. Sie schützen. Sie schießen nicht."},
      {npc:"NEUN",text:"Die Siedler sind zäher als ich. Ich passe trotzdem auf sie auf. Wahrscheinlich."}
    ],
    m4: [
      {npc:"SYSTEM",text:"Sprungvorbereitung. Ziel: SEKTOR 9. Nochmal derselbe. Formular 88-R: 'Wiederholung.'"},
      {npc:"COMMANDER",text:"Der Frachter fliegt auf Windows 95. Die Kältekammer ist versiegelt. Was immer darin ist: Es bleibt darin."},
      {npc:"KUGELSCHREIBER",text:"*Beat* ...der Frachter, die Kältekammer, das Formular, die Frage, ob ihr es öffnen sollt. *Beat* ...nein."}
    ]
  },
  getJump(id) { return this.jumps[id]||this.jumps.m1; },
  getBriefing(id) { return this.briefings[id]||this.briefings.m1; }
};

// ===== SOLO WING 1990 — SMART DIALOGUE POOLS (v0.6.7) =====
// Das Dorf reagiert. Jede Zeile: { id, text, req?, w? }
// req: null | 'm1_sieg' | 'flag:xxx' | 'quest:xxx' | 'event:xxx' | 'stage:alien>=2'
//      | {mission, ergebnis} | {flag} | {quest} | {questDone} | [Array = UND]
// Pools pro NPC: base (eigener Ton), mission (Reaktionen), quest, events, subplot.
// A/B-Check-Regel: Eine Zeile, die über ein Ereignis HINAUSWEIST (Spoiler),
// braucht immer ein req-Gate. Zeilen OHNE req dürfen nur Alltägliches sagen.
SW.Dialogues.smart = {
  commander: {
    base: [
      { id:'cmd_b1', text:'Formular 83-B liegt auf dem Tisch. Die Unterschrift fehlt. Sie fehlen nicht.' },
      { id:'cmd_b2', text:'Vier Vorgänger. Kein einziger hat unterschrieben. Sie sind der Fünfte.' },
      { id:'cmd_b3', text:'Ich habe keine Zeit für Mut. Mut braucht Personalabbau.' },
      { id:'cmd_b4', text:'Der Kaffee in der Kantine ist eine Bestrafung. Nehmen Sie ihn trotzdem.' },
      { id:'cmd_b5', text:'Wenn Sie mich fragen, ob ich zittere: Nein. Fragen Sie mich nicht, ob ich zittere.' },
      { id:'cmd_b6', text:'Der Aufzug zum Stab ist in Arbeit. Sie steigen die Treppe. Wie alle.' },
      { id:'cmd_b7', text:'Unterschreiben Sie dort. Ja, dort. Das Formular hat es eilig.' },
      { id:'cmd_b8', text:'Sternenkorps. Unterbesetzt. Aber nicht unter Ihnen.' },
      { id:'cmd_b9', text:'Die Gegenseite fliegt 1986. Wir fliegen 1990. Zwei Jahre besser. Reicht.' },
      { id:'cmd_b10', text:'Die Kantine ist zu. Der Kaffee auch. Das ist keine Metapher. Das ist eine Inventurlage.' }
    ],
    mission: [
      { id:'cmd_m1s', text:'Sektor 7. Abgeschlossen. Bewertung erfolgt nach Resten. Sie haben welche.', req:'m1_sieg' },
      { id:'cmd_m1t', text:'Sektor 7. Abbruch. Das Formular dafür habe ich nicht. Improvisieren Sie.', req:'m1_tod' },
      { id:'cmd_m2s', text:'Der Frachter ist angekommen. Die Torte habe ich nicht gesehen. Das Formular auch nicht.', req:'m2_sieg' },
      { id:'cmd_m3s', text:'Die Siedler sind zu Hause. KEIN FEUER war korrekt. Das notiere ich. Ohne Kommentar.', req:'m3_sieg' },
      { id:'cmd_m4s', text:'Kältekammer. Gesichert. Formular 99-Z liegt bereit. Unterschrift: später.', req:'m4_sieg' },
      { id:'cmd_m4s2', text:'Sie waren in der Kältekammer. Sie sagen, es atmet. Das Formular hat dafür ein Feld: „Temperatur stabil.“', req:'m4_sieg' },
      { id:'cmd_m4t', text:'Kältekammer. Abbruch. Das Formular dafür gibt es nicht. Es atmet weiter. Wir auch.', req:'m4_tod' }
    ],
    events: {
      first_kill: [ { id:'cmd_e1', text:'Erster Abschuss. Angemerktes Notat. Das ist kein Lob. Das ist Buchhaltung.' } ],
      shield_low: [ { id:'cmd_e2', text:'Abschirmladung. Ich sehe es. Sie müssen es nicht. Kommen Sie runter.' } ]
    }
  },
  sechs: {
    base: [
      { id:'s6_b1', text:'Du hast echt eine schlanke Linie. Mein Vorschlag: weniger Treibstoff, mehr Anzug.' },
      { id:'s6_b2', text:'Es gibt keine Welle vier. Es gibt Welle drei und dann die Kantine.' },
      { id:'s6_b3', text:'Sie haben das Fax nicht unterschrieben. Das ist kein Vorwurf. Das ist ein Muster.' },
      { id:'s6_b4', text:'Der Commander flüstert nie. Das heißt nur: Es steht im Formular.' },
      { id:'s6_b5', text:'Ich habe einen Notfallplan. Er heißt: Ich fliege nicht.' },
      { id:'s6_b6', text:'Zwo ist wie ein Faxgerät. Funktioniert immer. Niemand will sie.' },
      { id:'s6_b7', text:'90er Schnaps. Gutes Zeichen. Für wen, steht nicht drauf.' },
      { id:'s6_b8', text:'Wenn ich Angst habe, sage ich es. Das ist mein Trick.' },
      { id:'s6_b9', text:'Die Torte des Frachters. Falls er überlebt. Falls WIR überleben. Doppelte Bedingung.' },
      { id:'s6_b10', text:'Mein Vorschlag: weniger Fliegen. Mehr Funksprüche. Noch besser: weniger beides.' }
    ],
    mission: [
      { id:'s6_m1s', text:'Du lebst. Fortschritt. Mehr habe ich nicht erwartet. Genau das.', req:'m1_sieg' },
      { id:'s6_m1t', text:'Abgang. Kapelle B. Die Kopfhörer aus der Spinde bringe ich mit. Die hat er nie bezahlt.', req:'m1_tod' },
      { id:'s6_m2s', text:'Die Torte ist angekommen. Wir teilen. Das Formular für den Rest gibt es nicht. Improvisieren.', req:'m2_sieg' },
      { id:'s6_m3s', text:'Zivilisten. Lebend. Ohne Schuss. Das Formular war korrekt. Ich bin schockiert. Sarkastisch.', req:'m3_sieg' },
      { id:'s6_m4s', text:'Die Piraten haben Rap gespielt. Wir haben überlebt. In dieser Reihenfolge.', req:'m4_sieg' },
      { id:'s6_m4s2', text:'Du warst drin. Du bist draußen. Ich schenk dir nichts ein. Ich schenk dir etwas ein.', req:'m4_sieg' },
      { id:'s6_m4t', text:'Kältekammer 7 atmet zweimal pro Minute. Ich habe gezählt. Das dritte Mal war für dich.', req:'m4_tod' }
    ],
    events: {
      first_kill: [ { id:'s6_e1', text:'Erster Abschuss. Kein Rap. Kein Applaus. Nur ein Formular weniger. Stark.' } ],
      heard_rap: [ { id:'s6_e2', text:'Rapmusik im Vakuum? Der Kugelschreiber hat keine Ahnung von Physik. Von Rhythmus schon gar nicht.' } ],
      player_down: [ { id:'s6_e3', text:'Ich sag es laut: Es hat sich nicht angefühlt. Ich sag es leise: Es hat sich angefühlt.' } ]
    },
    subplot: [
      { id:'s6_al2', text:'Die Piraten wollten die Kältekammer. Nicht öffnen. HABEN. Das ist der Unterschied. Wer will eine Kältekammer haben?', req:'stage:alien>=2' },
      { id:'s6_au1', text:'1986-Technik. Die Gegenseite. Ich frag mich, wer die stempelt. Stempeln ist doch 1990.', req:['m1_sieg','stage:audit>=1'] }
    ]
  },
  neun: {
    base: [
      { id:'s9_b1', text:'Stimmt das mit den drei Wellen? Ich hab das Formular dreimal gelesen. Ist da eine Welle vier? Nur zur Sicherheit.' },
      { id:'s9_b2', text:'Und die anderen vier Vorgänger? Was ist mit denen passiert?' },
      { id:'s9_b3', text:'Also, KEIN FEUER, hab ich verstanden. Aber was ist, wenn einer schaut wie eine Waffe? Zünde ich dann?' },
      { id:'s9_b4', text:'Kann ich wenigstens flüstern?' },
      { id:'s9_b5', text:'Ich atme durch. Das steht so in Formular 12-C.' },
      { id:'s9_b6', text:'Hast du das Formular auch schon dreimal gelesen? Dann hast du es verstanden.' },
      { id:'s9_b7', text:'Mein Notizblock ist ganz weiß. Ich bin froh.' },
      { id:'s9_b8', text:'Wenn ich mich irre, sag mir Bescheid. Bitte sag mir Bescheid.' },
      { id:'s9_b9', text:'Die Kantine ist zu. Ich frage trotzdem immer. Sie sagt nein. Ich lerne.' },
      { id:'s9_b10', text:'Vier sagt, es klappt alles. Ich sage: Das Formular ist korrekt. Wir ergänzen uns.' }
    ],
    mission: [
      { id:'s9_m1s', text:'Ich... ich lebe. Ich atme durch. Das Formular hat es bestätigt.', req:'m1_sieg' },
      { id:'s9_m1t', text:'Ist es ... ist es furchtbar für ihn? Ich frage wegen des Formulars.', req:'m1_tod' },
      { id:'s9_m2s', text:'Der Frachter wartet nicht. Er wartet. Das ist... das ist beruhigend.', req:'m2_sieg' },
      { id:'s9_m3s', text:'Kein Feuer. Kein einziges. Ich habe gezählt. Es waren null.', req:'m3_sieg' },
      { id:'s9_m4s', text:'Die Musik war laut. Ich habe gezählt. Es waren 99 Schläge. Dann war Schluss.', req:'m4_sieg' },
      { id:'s9_m4s2', text:'Zweimal pro Minute. Das ist kein Formularfehler. Ich habe nachgezählt. Ich glaube, es atmet. Ich frage wegen des Formulars.', req:'m4_sieg' },
      { id:'s9_m4t', text:'Die Kältekammer atmet weiter. Das ist beruhigend. Oder furchtbar. Ich weiß nicht, welches Formular das ist.', req:'m4_tod' }
    ],
    events: {
      first_kill: [ { id:'s9_e1', text:'Ich habe abgeschossen. Ich atme durch. Formular 12-C sagt, das darf ich.' } ],
      shield_low: [ { id:'s9_e2', text:'Meine Hände. Die sind nicht ruhig. Ich habe gezählt. Es wird besser.' } ]
    },
    subplot: [
      { id:'s9_al2', text:'Ich habe gezählt, wie oft Kältekammer in der Mission vorkam. Es waren vier. Das Formular hatte nur drei.', req:'stage:alien>=2' }
    ]
  },
  zwo: {
    base: [
      { id:'s2_b1', text:'Ich hab mal gefragt, warum wir Sternenkorps heißen. Der Commander hat gesagt: Weil wir unterbesetzt sind.' },
      { id:'s2_b2', text:'Frachter eskortieren. Wie letzte Woche, nur diesmal explodiert er vielleicht.' },
      { id:'s2_b3', text:'Dein Notfallplan ist ein Formular. Ein leeres.' },
      { id:'s2_b4', text:'...Das war fast beleidigend. Fast.' },
      { id:'s2_b5', text:'Mein Kaffee ist schwarz. Das ist kein Fehler. Das ist Erfahrung.' },
      { id:'s2_b6', text:'Wenn du fragst, ob ich nervös bin, dann sage ich: Die Formulare sind ausgefüllt.' },
      { id:'s2_b7', text:'Ich fliege seit neun Jahren. Die anderen fliegen, seit sie können. Der Unterschied ist die Papierausbildung.' },
      { id:'s2_b8', text:'Priorität bleibt oben. Auch wenn alles unten explodiert.' },
      { id:'s2_b9', text:'Vier lacht. Das ist keine Taktik. Das ist ein Zustand.' },
      { id:'s2_b10', text:'Manchmal ist Ja, Sir die genaueste Antwort, die es gibt.' }
    ],
    mission: [
      { id:'s2_m1s', text:'Drei Wellen. Keine Verspätung. Das Formular ist ausgefüllt. Ich bin zufrieden.', req:'m1_sieg' },
      { id:'s2_m2s', text:'Geleitschutz. Erledigt. Der Frachter fliegt auf Windows 95. Der Schieße-Modus kam nie hoch.', req:'m2_sieg' },
      { id:'s2_m3s', text:'Siedler eskortiert. Keine Schüsse. Die Priorität bleibt oben. Wie immer.', req:'m3_sieg' },
      { id:'s2_m4s', text:'Kältekammer 7. Priorität oben. Ich wiederhole: oben. Über der Fracht. Über allem.', req:'m4_sieg' },
      { id:'s2_m4s2', text:'Kältekammer gesichert. Fracht intakt. Der Frachter fliegt noch auf Windows 95. Der Schieße-Modus kam wieder nicht hoch.', req:'m4_sieg' },
      { id:'s2_m4t', text:'Abbruch. Die Kältekammer bleibt versiegelt. Priorität oben. Ich wiederhole: oben. Alles andere ist unten.', req:'m4_tod' }
    ],
    events: {
      shield_low: [ { id:'s2_e1', text:'Schild unter dreißig. Formular 44-D: Drücken Sie die Daumen. Ich drücke sie.' } ]
    },
    subplot: [
      { id:'s2_al3', text:'Die Priorität bleibt oben. Auch wenn es jetzt unten atmet.', req:'stage:alien>=3' }
    ]
  },
  vier: {
    base: [
      { id:'s4_b1', text:'Ich bin sicher, klappt alles! Ich hab sogar einen Notfallplan: Ich lache.' },
      { id:'s4_b2', text:'Wissen Sie was, Zwo? Sie sind wie ein Faxgerät. Funktionieren immer. Aber niemand will Sie.' },
      { id:'s4_b3', text:'Heute wird ein guter Tag! Glauben Sie mir. Ich hab es geahnt.' },
      { id:'s4_b4', text:'Wenn es explodiert, explodiert es mit Stil. Ich bin mir sicher.' },
      { id:'s4_b5', text:'Ich habe eine Idee! Die Idee ist gut. Sie hat nur noch kein Formular.' },
      { id:'s4_b6', text:'Neun atmet durch. Ich lache. Wir sind ein Team.' },
      { id:'s4_b7', text:'Die Torte! Die hat doch bestimmt auch Überlebenschancen.' },
      { id:'s4_b8', text:'Formular 12-A ist vorgedruckt. Das Universum ist vorbereitet.' },
      { id:'s4_b9', text:'Ich würde sagen: Risiko! Aber das Formular sagt: Nein.' },
      { id:'s4_b10', text:'Morgen ist auch noch ein Tag. Oder übermorgen. Mit Formular.' }
    ],
    mission: [
      { id:'s4_m1s', text:'Es hat geklappt! Ich war mir sicher! Das Formular stimmt mit dem Universum überein!', req:'m1_sieg' },
      { id:'s4_m2s', text:'Die Torte! Die Torte hat überlebt! Doppelte Bedingung erfüllt!', req:'m2_sieg' },
      { id:'s4_m3s', text:'Sie sind zu Hause! Die Siedler! Mit Formular und allem!', req:'m3_sieg' },
      { id:'s4_m4s', text:'Rap! Piraten rappen! Ich hätte nie gedacht, dass der Raum Musik machen kann!', req:'m4_sieg' },
      { id:'s4_m4s2', text:'Es atmet! Zweimal pro Minute! Das ist ein sehr ruhiger Atem! Ich bin mir sicher, das ist das Ruhigste auf dem Schiff!', req:'m4_sieg' },
      { id:'s4_m4t', text:'Ich habe meinen Notfallplan ausprobiert. Ich habe gelacht. Es hat nicht geholfen. Aber das Formular stimmt. Das Formular stimmt immer.', req:'m4_tod' }
    ],
    events: {
      first_kill: [ { id:'s4_e1', text:'Ich war mir sicher! Das Universum ist vorbereitet! Auch dafür!' } ],
      heard_rap: [ { id:'s4_e2', text:'MUSIK! Im Universum! Das ist doch genau das, was mir gefehlt hat!' } ]
    }
  },
  barkeep: {
    base: [
      { id:'bar_b1', text:'*Klicken* Koffein nicht verfügbar. Wiederkehr in 40 Zyklen.' },
      { id:'bar_b2', text:'*Klicken* Faxgerät in Wartung. Wartung seit 1988. Formular 83-B liegt bereit.' },
      { id:'bar_b3', text:'*Klicken* Bestätigung. Bestätigung. Bestätigung.' },
      { id:'bar_b4', text:'*Klicken* Die Torte ist eine Bedingung. Bedingungen sind fragil.' },
      { id:'bar_b5', text:'*Klicken* Schnaps 90er: Bestand 12. Die Formulierung viel Glück ist nicht verfügbar.' },
      { id:'bar_b6', text:'*Klicken* Ich bediene in der Reihenfolge der Aktennummer.' },
      { id:'bar_b7', text:'*Klicken* Stille ist ein Getränk. Es kostet nichts. Es wird nie fertig.' },
      { id:'bar_b8', text:'*Klicken* Wiederholte Bestellung nicht erforderlich. Aber erlaubt.' }
    ],
    mission: [
      { id:'bar_m4s', text:'*Klicken* Einsatz: Kältekammer. Ergebnis: versiegelt. Temperatur: stabil. Empfehlung: Fenster.', req:'m4_sieg' },
      { id:'bar_m4t', text:'*Klicken* Einsatz abgebrochen. Kältekammer: stabil. Bestätigung. Bestätigung. Bestätigung.', req:'m4_tod' }
    ],
    events: {
      heard_rap: [ { id:'bar_e1', text:'*Klicken* Rhythmus erkannt. Quelle: Kugelschreiber. Empfehlung: Fenster.' } ],
      mission_sieg: [ { id:'bar_e2', text:'*Klicken* Einsatz erfolgreich. Koffein-Vorrat unverändert. Formular 12-A vorgedruckt.' } ]
    }
  },
  bolt: {
    base: [
      { id:'bol_b1', text:'Das Schiff blutet. Ich sag\'s euch: DAS Schiff blutet. Und ich soll\'s flicken?' },
      { id:'bol_b2', text:'Mutters schweißt. Ich repariere. Wir streiten um das letzte Stück Isolierband. Seit 1987.' },
      { id:'bol_b3', text:'Diskettens betet. Ich schwöre. Besser: Wir beide halten das Schiff am Leben.' },
      { id:'bol_b4', text:'Wenn Sie wieder zu früh gezogen haben: Ja. Ich weiß es. Das Schiff hat es gehört.' },
      { id:'bol_b5', text:'Werkzeug ist nicht verloren. Werkzeug ist vertieft.' },
      { id:'bol_b6', text:'Der Antrieb hat heute Morgen geschrien. Ich hab nicht hingeschaut. Er weiß, dass ich es weiß.' },
      { id:'bol_b7', text:'Sie fliegen wie ein Formblatt. Ich repariere wie ein Fluch. Das ist Balance.' },
      { id:'bol_b8', text:'Nein, die Tür klemmt nicht. Die Tür hat eine Meinung.' }
    ],
    mission: [
      { id:'bol_m1s', text:'Sie haben das Schiff zerkratzt. Ich sag\'s euch: JEDEN KRATZER hab ich gesehen. Rechnung folgt.', req:'m1_sieg' },
      { id:'bol_m2s', text:'Der Frachter ist ganz. Das Schiff auch. Fast. Fast ist mein Wort. Ich behalte es.', req:'m2_sieg' },
      { id:'bol_m4s', text:'Der Frachter hat Kälte bekommen. Die Rohre summen in einer Tonart. Ich sag\'s euch: DAS ist kein Motor. Rechnung folgt.', req:'m4_sieg' },
      { id:'bol_m4t', text:'Das Schiff ist zurück. Ohne Sie. Der Plan bleibt. Die Dichtung auch. Die Rechnung auch.', req:'m4_tod' }
    ],
    events: {
      shield_low: [ { id:'bol_e1', text:'Noch ein Schild. Ich wette auf das Filterproblem. Es ist immer das Filterproblem.' } ],
      first_kill: [ { id:'bol_e2', text:'Feindliches Blei weniger. Mein Werkzeug ist mir lieber. Aber gut.' } ]
    },
    subplot: [
      { id:'bol_al1', text:'Kältekammer 7. Die Dichtung ist neu. Seit wann? Ich hab die Rechnung nicht gefunden.', req:'stage:alien>=1' }
    ]
  },
  pflaster: {
    base: [
      { id:'pf_b1', text:'Du blutest. Setz dich. Ich hol\'s Pflaster. Und das Tamagotchi.' },
      { id:'pf_b2', text:'Trockene Haut ist keine Wunde. Wird aber eine, wenn du so weiterfliegst.' },
      { id:'pf_b3', text:'Das Tamagotchi ist ausgehungert. Wie du aussiehst. Wir sind heute alle hungrig.' },
      { id:'pf_b4', text:'Nimm die Tabletten. Nein, keine. Die anderen. Mit dem Formular?' },
      { id:'pf_b5', text:'Deine Handschuhe sind durch. Neue liegen hier. Unterschrift nicht vergessen.' },
      { id:'pf_b6', text:'Schlaf ist keine Belohnung. Kommt aber einer nahe.' },
      { id:'pf_b7', text:'Neun atmet. Ich zähle mit. Das hilft.' },
      { id:'pf_b8', text:'Wenn du nach Toner stinkst, warst du im Büro. Nach Öl: Reparatur. Nach nichts: Komm später.' }
    ],
    mission: [
      { id:'pf_m1s', text:'Keine Blutung. Keine Schramme. Nur der Schweiß. Den hab ich auch gepflastert.', req:'m1_sieg' },
      { id:'pf_m1t', text:'Setz dich. Du zitterst. Das ist okay. Ich zähle mit.', req:'m1_tod' },
      { id:'pf_m4s', text:'Die Kältekammer. Du warst da. Du riechst nicht nach Kälte. Das ist gut.', req:'m4_sieg' },
      { id:'pf_m4s2', text:'Deine Hände waren blau. Ich habe gezählt, bis sie rosa waren. Neunundneunzig. Das war die richtige Zahl.', req:'m4_sieg' },
      { id:'pf_m4t', text:'Ich zähle weiter. Auch heute. Das Formular hat ein Feld: „Bemerkung.“ Ich schreibe: weiter.', req:'m4_tod' }
    ],
    events: {
      first_kill: [ { id:'pf_e1', text:'Du hast etwas getroffen. Deine Hände zittern. Das ist nicht Schwäche. Das ist neu.' } ],
      player_down: [ { id:'pf_e2', text:'Ich war bereit. Ich bin immer bereit. Ich will es nicht sein.' } ]
    },
    subplot: [
      { id:'pf_al3', text:'Es ist gesund. Ich habe es nicht untersucht. Ich habe gelauscht. Es ist gesund.', req:'stage:alien>=3' }
    ]
  },
  diskettens: {
    base: [
      { id:'dis_b1', text:'Läuft mit zwei Disketten und einem Gebet. Zwei Disketten reichen.' },
      { id:'dis_b2', text:'Das Warpcraft erklärt sich auf einem Kassetten-Tape-Loop. Seite drei. Bitte nicht umblättern.' },
      { id:'dis_b3', text:'Wenn der Antrieb brummt, ist das kein Fehler. Das ist ein Lied. 441 Hertz. Tonart: Bitte.' },
      { id:'dis_b4', text:'Rohr weiß, warum der Kaffee kalt ist. Ich weiß, warum Rohr schweigt.' },
      { id:'dis_b5', text:'Kalte Cola. Noch in der Faust. Seit 1986. Ich trink sie, wenn alles vorbei ist.' },
      { id:'dis_b6', text:'Formular 83-B habe ich nicht ausgefüllt. Ich habe das Formular gelehrt.' },
      { id:'dis_b7', text:'Zwei Disketten. Ein Gebet. Es reicht. Ich wiederhole: Es reicht.' },
      { id:'dis_b8', text:'Sie fliegen auf Windows 95. Ich fliege auf zwei Disketten. Die Frage ist nur, wer neu startet.' }
    ],
    mission: [
      { id:'dis_m4s', text:'Kältekammer. Zwei pro Minute. Auf Diskette B. Diskette A bleibt leer. Für die Antwort, die noch fehlt.', req:'m4_sieg' },
      { id:'dis_m4t', text:'Diskette B ist voll. Diskette A bleibt leer. Die kalte Cola ist noch in der Faust. Es ist nicht vorbei.', req:'m4_tod' }
    ],
    events: {
      shield_low: [ { id:'dis_e1', text:'Schildwerte fallen. Wie ein Kassetten-Tape: erst leiser, dann weg. Dann ist es weg.' } ],
      heard_rap: [ { id:'dis_e2', text:'Rhythmus. 120 Schläge. Der Antrieb läuft auf 121. Fast im Takt.' } ]
    },
    subplot: [
      { id:'dis_al2', text:'Kältekammer 7. Zwei pro Minute. Das ist kein Kühlkreislauf. Das ist ein Atemrhythmus. Ich habe nicht umgeblättert.', req:'stage:alien>=2' },
      { id:'dis_au1', text:'In Sektor 7 waren Drohnen. Keine Triebwerke. Keine Waffen. Stempel. Die streifen. Sie stempeln.', req:['m1_sieg','stage:audit>=1'] }
    ]
  },
  klo: {
    base: [
      { id:'klo_b1', text:'Das Klo stinkt nach Toner. Wie die Kantine. Das Schiff stinkt überall nach Toner. Ich wische.' },
      { id:'klo_b2', text:'Wasser. Immer Wasser. Und dann kommt das, was nach Wasser kommt.' },
      { id:'klo_b3', text:'Du schaust müde aus. Müde ist gut. Tot ist auch gut. Aber heute noch nicht.' },
      { id:'klo_b4', text:'Ich habe alle 340.000 Fax-Seiten gesehen. Keine hat unterschrieben.' },
      { id:'klo_b5', text:'Sechs lacht. Neun atmet. Zwo unterschreibt. Und ich wische. So läuft das hier.' },
      { id:'klo_b6', text:'Die Kerze brennt länger, wenn man leise ist. Probier es.' },
      { id:'klo_b7', text:'Wahrheit ist wie Toner. Setzt sich überall fest. Wischt man nicht weg.' }
    ],
    mission: [
      { id:'klo_m1s', text:'Du bist wieder da. Ich wische trotzdem weiter. Aber das Wischen ist leichter.', req:'m1_sieg' },
      { id:'klo_m1t', text:'Abgang 07:30. Ich habe die Kerze länger gemacht. Wasser. Immer Wasser.', req:'m1_tod' },
      { id:'klo_m2s', text:'Eine Torte mehr im Dorf. Das Schiff wird süßer. Und kleiner. Und näher am Ziel.', req:'m2_sieg' },
      { id:'klo_m3s', text:'Die Siedler sind zu Hause. In der Kapelle brennt eine Kerze weniger. Das ist gut.', req:'m3_sieg' },
      { id:'klo_m4s', text:'Die Kältekammer stinkt nicht. Das ist das neue Problem. Es stinkt NICHT. Ich wische trotzdem.', req:'m4_sieg' },
      { id:'klo_m4t', text:'Abgang. Ich habe die Kältekammer gewischt. Sie ist sauber. Das ist nichts. Aber es ist heute das Einzige.', req:'m4_tod' }
    ],
    events: {
      player_down: [ { id:'klo_e1', text:'Wasser. Immer Wasser. Ich habe einen Platz frei gelassen. Den brauche ich jetzt.' } ],
      heard_rap: [ { id:'klo_e2', text:'Der Rhythmus. Den hat es schon mal gegeben. Vor dir. Ich habe ihn gewischt. Er kam zurück.' } ]
    },
    subplot: [
      { id:'klo_al1', text:'In Kältekammer 7 atmet etwas. Zweimal pro Minute. Wie die Rohre.', req:'stage:alien>=1' },
      { id:'klo_al2', text:'Es atmet. Es hat immer geatmet. Ich wische um es herum. Das ist die ganze Geschichte. Bis jetzt.', req:'stage:alien>=2' }
    ]
  },
  system: {
    base: [
      { id:'sys_b1', text:'SYSTEM: Formular 83-B ausstehend.' },
      { id:'sys_b2', text:'SYSTEM: Wiederholung nicht erforderlich.' },
      { id:'sys_b3', text:'SYSTEM: Kaffeeversorgung nicht verfügbar.' },
      { id:'sys_b4', text:'SYSTEM: Bestätigung.' }
    ],
    mission: [
      { id:'sys_m4s', text:'SYSTEM: Kältekammer 7. Versiegelt. Temperatur: stabil. Atmung: 2/min. Quelle: unbekannt.', req:'m4_sieg' },
      { id:'sys_m4t', text:'SYSTEM: Einsatz abgebrochen. Kältekammer 7: stabil. Atmung: 2/min. Quelle: unbekannt. Personal: minus eins.', req:'m4_tod' }
    ],
    events: {
      first_kill: [ { id:'sys_e1', text:'SYSTEM: Kontakt neutralisiert. Bewertung: 4/10. Formular ausgefüllt.' } ],
      heard_rap: [ { id:'sys_e2', text:'SYSTEM: Rhythmus erkannt. 120 Schläge. Quelle: Piratenschiff.' } ]
    },
    subplot: [
      { id:'sys_al1', text:'SYSTEM: Kältekammer 7. Temperatur stabil. Atmung: 2/min.', req:'stage:alien>=1' },
      { id:'sys_al2', text:'SYSTEM: Kältekammer 7. Frage: Was atmet? Antwort: Formular 99-Z.', req:'stage:alien>=2' },
      { id:'sys_au1', text:'SYSTEM: Sektor 7. Vier Kontakte. Alle ohne Triebwerk. Alle mit Stempel.', req:['m1_sieg','stage:audit>=1'] }
    ]
  }
};

// ===== SUBPLOT-STUFEN (A/B-Story-Checks) =====
// alien: 1 = erste Hinweise (Klo/Bolt/System wispern), 2 = nach m4 (Piraten
//       wollten es haben), 3 = aufgedeckt (Quest kaltkammer_beschützen erledigt).
// audit: 1 = nach m1 (Sektor 7: Stempel statt Waffen).
// optimierer: 0 = noch nie gehört. 1 = erscheint nach m4 (v0.70).
// Stufen steigen NUR über SW.SmartDialogues.setStage() (in js/quests.js,
// flight-Handler) — nie aus Dialogen heraus. Keinerlei Spoiler-Rücknahme.
SW.Dialogues.smartSubplots = {
  alien: { start: 1 },
  audit: { start: 0 },
  optimierer: { start: 0 }
};
