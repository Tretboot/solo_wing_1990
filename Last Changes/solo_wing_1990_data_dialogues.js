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
    ]
  },

  getBriefing(id) { return this.briefings[id]||this.briefings.m1; }
};
