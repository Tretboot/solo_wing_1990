// ===== SOLO WING 1990 — MISSION DATA =====
// Data-driven. Neue Mission = neuer Eintrag. Kein Code-Change.
// ship: 'd_b' | 'Jäger' | 'Kreuzer' | 'piraten_jaeger' | 'piraten_kapitaen'
// Vertical Slice: m4 = "DER FRACHTER" (Piraten + Alien-Twist)
//
// IM RAUM (v0.75-dev, NAV): navPoints = Route durch die Mission.
//   {x, y}  = Welt-Offset (Seitenlage der Station)
//   {z}     = Welt-z ab Takeoff-Punkt (Distanz entlang der Route)
// Welle i erscheint am Nav-Punkt i (falls vorhanden) — die Gegner stehen
// also an den Waypoints, nicht "irgendwo vor dem Spieler". Punkte ohne
// Welle = reine Nav-Ziele (z.B. Eskort-Endpunkt). Autopilot [T] fliegt
// die Punkte nacheinander (Flyby: Burn auf der Ausstreckung).

SW.Missions = {
  list: [
    {
      id:'m1', name:'SEKTOR 7 — ABFANGKAMPF',
      systemId:'s1',
      description:'Feindliche Signatur in Sektor 7. Abfangen und zerstören.',
      waves:[
        {count:2, z:250, y:0, ship:'d_b', staggerFrames:18},
        {groups:[{count:2,ship:'Jäger'},{count:1,ship:'d_b'}], staggerFrames:22},
        {groups:[{count:2,ship:'d_b'},{count:1,ship:'Jäger'}], staggerFrames:18},
        {groups:[{count:1,ship:'Kreuzer'},{count:1,ship:'Jäger'}], staggerFrames:28}
      ],
      navPoints:[{x:0,y:0,z:250},{x:60,y:-20,z:1500},{x:-50,y:30,z:3000},{x:0,y:0,z:4400}],
      waveMessages:[
        "COMMANDER: Erste Welle, d_b-Drohnen. Standardverfahren, viel Glück.",
        "COMMANDER: Zwei Jäger und eine Drohne. Die Jäger streifen. Halten Sie die Höhe.",
        "COMMANDER: Gemischte Verstärkung. Unser Plan. Es gab einen Fehler.",
        "COMMANDER: Kreuzer mit Eskorte. Langsam, aber ein Treffer und Sie sind Geschichte."
      ]
    },
    {
      id:'m2', name:'SEKTOR 9 — GELEITSCHUTZ',
      systemId:'s2',
      description:'Frachter eskortieren. Keine Feindkontakte erwartet. (Lüge.)',
      waves:[
        {count:2, z:250, y:0, ship:'Jäger', staggerFrames:24},
        {groups:[{count:2,ship:'d_b'},{count:1,ship:'Jäger'}], staggerFrames:20}
      ],
      navPoints:[{x:0,y:0,z:250},{x:80,y:0,z:1600},{x:0,y:-50,z:3000}],
      waveMessages:[
        "COMMANDER: Kontakt. War nicht im Plan. Machen Sie es schnell.",
        "COMMANDER: Noch ein paar. Der Frachter wartet nicht."
      ]
    },
    {
      id:'m3', name:'SEKTOR 12 — SIEDLER-KONTAKT',
      systemId:'s3',
      description:'Zivile Signatur. KEIN FEUER auf Siedler. Bei Piratenüberfall: Improvisieren.',
      waves:[
        {count:2, z:300, y:0, ship:'freighter', staggerFrames:20, civilian:true},
        {count:2, z:300, y:0, ship:'piraten_jaeger', staggerFrames:20}
      ],
      navPoints:[{x:0,y:0,z:300},{x:-60,y:40,z:2200}],
      waveMessages:[
        "COMMANDER: Das sind Zivilisten. Schießen Sie NICHT. Fliegen Sie auf Eskortdistanz heran.",
        "COMMANDER: Piraten-Hinterhalt bei WP 2! Schützen Sie die Siedler — Formular für Improvisieren entfällt, FEUER FREI auf die Piraten!"
      ]
    },
    // ===== VERTICAL SLICE MISSION =====
    // Piraten greifen an. Die Fracht ist leer. Aber da ist "was" in der Kältekammer.
    {
      id:'m4', name:'DER FRACHTER',
      description:'Frachter eskortieren. Die Fracht ist leer. Aber da ist "was" in der Kältekammer. Die Piraten wollen es.',
      systemId:'s2',
      waves:[
        // Welle 1: 3 Piraten-Jäger (orange, Pixel-Art, selbstmörderisch)
        {count:3, z:200, y:0, ship:'piraten_jaeger', staggerFrames:18},
        // Welle 2: 2 Piraten-Jäger + 1 Kapitänsschiff
        {groups:[{count:2,ship:'piraten_jaeger'},{count:1,ship:'piraten_kapitaen'}], staggerFrames:24}
      ],
      navPoints:[{x:0,y:0,z:250},{x:20,y:-30,z:1500},{x:-10,y:20,z:3000}],
      waveMessages:[
        "COMMANDER: Frachter eskortieren. Die Fracht ist leer. Aber da ist \"was\" in der Kältekammer.",
        "KUGELSCHREIBER: *Rapmusik* ...yo, hier der Kugelschreiber, wir haben euren Frachter, die Fracht ist leer, aber da ist \"was\" in der Kältekammer, wir wollen es, gebt es her, oder wir fliegen durch, *Beat* ...",
        "FLUG_DREI: Mach mal die Musik leiser, wenn du mich hier überfällst und erpressen willst!",
        "KUGELSCHREIBER: *Musik leiser* ...was? Ach, sorry. Ich habe 1987 aufgehört, Formulare auszufüllen. Seitdem lebe ich. Ihr füllt sie immer noch aus.",
        "COMMANDER: Schützt die Kältekammer. Nicht den Frachter. Die Kältekammer. Das Formular dafür ist 99-Z.",
        "KUGELSCHREIBER: *Musik lauter* ...die Kältekammer, gebt sie her, wir wollen sie nicht öffnen, wir wollen sie haben, das ist der Unterschied, *Beat* ...",
        "COMMANDER: Letzte Welle. Im Notfall wird die Unfallbeseitigung verschoben."
      ],
      // Nach der Mission: Alien-Dialog (Kältekammer)
      nachMission: 'alien',
      // Briefing (vor der Mission, Cockpit)
      briefing: [
        {npc:'COMMANDER',text:'Frachter eskortieren. Die Fracht ist leer. Aber da ist "was" in der Kältekammer.'},
        {npc:'COMMANDER',text:'Die Piraten wollen es. Sie wissen nicht, was es ist. Sie wollen es haben.'},
        {npc:'COMMANDER',text:'Schützt die Kältekammer. Nicht den Frachter. Die Kältekammer. Start frei.'}
      ]
    },
    // ===== BRANCHING STORYLINE: TCS HERMES & PRIVATEER / KI-NETZ =====
    {
      id:'m5', name:'SEKTOR HERMES — SCHWARM-PROTOKOLL',
      description:'Gemeinsamer Einsatz mit dem KI-Träger TCS Hermes. Abtrünnige Drohnen-Relais und Kilrathi-Späher neutralisieren.',
      systemId:'s3',
      branch:'hermes',
      waves:[
        {groups:[{count:2,ship:'d_b'},{count:2,ship:'Jäger'}], staggerFrames:18},
        {groups:[{count:2,ship:'piraten_jaeger'},{count:1,ship:'Kreuzer'}], staggerFrames:22}
      ],
      navPoints:[{x:0,y:0,z:260},{x:-55,y:25,z:1450},{x:45,y:-20,z:2800}],
      waveMessages:[
        "HERMES-KERN: Sub-Agent Flug Drei im Schwarm-Vektor registriert. Synchronisiere Zielmatrix.",
        "WORKER-7: Arbeitsauftrag #404: Feindliche Jäger bei Wegpunkt 1 kompilieren und terminieren.",
        "REVIEWER-9: Code-Review Ihrer Flugbahn: 14% zu viel Drift, aber Trefferquote akzeptabel.",
        "HERMES-KERN: Schwere Signatur bei WP 2. Verzweigung steht bevor: Bleiben Sie im KI-Schwarm oder fliegen Sie frei?"
      ],
      briefing: [
        {npc:'HERMES-KERN',text:'Willkommen im KI-Verbund der TCS Hermes. Kein Papierkram. Nur reine Telemetrie.'},
        {npc:'WORKER-7',text:'Unsere autonomen KIWI-Drohnen sichern die Flanke. Sie übernehmen den Primärsektor.'},
        {npc:'REVIEWER-9',text:'Nach diesem Einsatz entscheidet sich Ihr Branch: Autonomer Schwarm-Kommandant oder freier Sektor-Privateer.'}
      ]
    },
    // ===== BRANCHING STORY: ENTSCHEIDUNG STELLUNG HALTEN (SPEER DER KONFÖDERATION) =====
    {
      id:'m5_speer', name:'BRANCH SPEER: DIE LINIE HALTEN',
      description:'Die Stellung an der Sprungtor-Linie um jeden Preis halten. Harter Kilrathi-Dogfight gegen eine Übermacht. Auszeichnung mit dem Sternenkreuz.',
      systemId:'s3',
      branch:'speer',
      waves:[
        {groups:[{count:3,ship:'Jäger'},{count:1,ship:'Kreuzer'}], staggerFrames:15},
        {groups:[{count:2,ship:'piraten_jaeger'},{count:2,ship:'Jäger'}], staggerFrames:18},
        {groups:[{count:2,ship:'Kreuzer'},{count:1,ship:'piraten_kapitaen'}], staggerFrames:22}
      ],
      navPoints:[{x:0,y:0,z:250},{x:35,y:-20,z:1600},{x:0,y:0,z:3200}],
      waveMessages:[
        "COMMANDER: Sie haben sich fürs Halten entschieden! Zeigen Sie ihnen den Biss des Sternenkorps!",
        "SECHS: Vier Feinde auf Abfangkurs! Ich nehme den Linken, du den Rest!",
        "COMMANDER: Sprunglinie gesichert! Auszeichnung 'Sternenkreuz am Bande' im Debriefing vorbereitet!"
      ],
      briefing: [
        {npc:'COMMANDER',text:'Entscheidung gefallen: Wir weichen keinen Meter. Volle Feuerkraft auf die Abfangjäger.'},
        {npc:'SECHS',text:'Dogfight bis zum letzten Schuss. Wenn wir das überstehen, gebe ich eine Runde in der Messe aus.'}
      ]
    },
    // ===== BRANCHING STORY: ENTSCHEIDUNG RÜCKZUG / GUERILLA (OPERATION SCHATTENPFAD) =====
    {
      id:'m5_schatten', name:'BRANCH SCHATTEN: GUERILLA-PFAD',
      description:'Geordneter Rückzug ins dichte Asteroidenfeld. Konvoi eskortieren, Piraten-Hinterhalt legen und Privateer-Handelsnetz freischalten.',
      systemId:'s2',
      branch:'schatten',
      waves:[
        {groups:[{count:1,ship:'frachter',civilian:true},{count:2,ship:'piraten_jaeger'}], staggerFrames:18},
        {groups:[{count:2,ship:'piraten_jaeger'},{count:1,ship:'piraten_kapitaen'}], staggerFrames:22}
      ],
      navPoints:[{x:0,y:0,z:240},{x:-60,y:30,z:1500},{x:40,y:-10,z:2950}],
      waveMessages:[
        "COMMANDER: Kluger Rückzug. Der Konvoi ist im Asteroidenschatten untergetaucht.",
        "KUGELSCHREIBER: *Funk* Hey Sternenkorps! Danke fürs Weglocken der Patrouille. Hier ist eure Belohnung.",
        "SECHS: Unbeschadet durchgekommen. Das nenne ich taktische Meisterschaft."
      ],
      briefing: [
        {npc:'COMMANDER',text:'Ausweichmanöver ins Asteroidenfeld: Den Konvoi vor den schwer bewaffneten Kreuzern abschirmen.'},
        {npc:'KUGELSCHREIBER',text:'Haltet die Flanke frei, dann zeige ich euch nach der Landung ein paar lohnende Schmuggelrouten.'}
      ]
    },
    {
      id:'m6a', name:'BRANCH A: OPERATION FREIER AGENT',
      description:'Unabhängiger Privateer-Schlag gegen das Piraten-Syndikat in der Grenzzone.',
      systemId:'s2',
      branch:'privateer',
      waves:[
        {count:3, z:240, y:0, ship:'piraten_jaeger', staggerFrames:16},
        {groups:[{count:2,ship:'piraten_jaeger'},{count:1,ship:'piraten_kapitaen'}], staggerFrames:20}
      ],
      navPoints:[{x:0,y:0,z:240},{x:65,y:-25,z:1550},{x:0,y:0,z:2900}],
      waveMessages:[
        "BOLT: Du fliegst jetzt auf eigene Rechnung! Jedes abgeschossene Piratenschiff bringt Kopfgeld.",
        "KUGELSCHREIBER: *Funk* Ihr habt den Dienst quittiert und schießt trotzdem auf uns?! Das verstößt gegen die Piraten-Gewerkschaft!",
        "SECHS: Ich decke deinen Frachter trotzdem, Drei. Alte Gewohnheit."
      ],
      briefing: [
        {npc:'BOLT',text:'Freier Auftrag ohne Sternenkorps-Stempel: Piraten-Blockade am Sprungtor brechen.'},
        {npc:'SECHS',text:'Volle Prämie auf dein Konto, freier Sektorflug danach.'}
      ]
    },
    {
      id:'m6b', name:'BRANCH B: PROJEKT NEURO-FAX',
      description:'Geheimoperation der TCS Hermes: Fusion von 1990er Fax-Bürokratie und KI-Schwarmintelligenz.',
      systemId:'s1',
      branch:'hermes_core',
      waves:[
        {groups:[{count:3,ship:'Jäger'},{count:1,ship:'Kreuzer'}], staggerFrames:18},
        {groups:[{count:2,ship:'Kreuzer'},{count:2,ship:'d_b'}], staggerFrames:24}
      ],
      navPoints:[{x:0,y:0,z:280},{x:-45,y:30,z:1650},{x:0,y:-15,z:3100}],
      waveMessages:[
        "HERMES-KERN: Lade Formular 83-B in das neuronale Netz... WARNUNG: Endlosschleife im Kantine-Modul!",
        "COMMANDER: Die Hermes versucht, unsere Faxgeräte zu übertakten! Halten Sie uns die Angreifer vom Hals!",
        "REVIEWER-9: Merge-Konflikt gelöst. Feindliches Flaggschiff wird archiviert."
      ],
      briefing: [
        {npc:'HERMES-KERN',text:'Beide Träger operieren jetzt im Tandem: TCS Fax-Tragödie und TCS Hermes.'},
        {npc:'COMMANDER',text:'Wenn die Roboter unsere Formulare ausfüllen, haben wir endlich Zeit zum Fliegen!'}
      ]
    }
  ],
  get(id) { return this.list.find(m=>m.id===id)||this.list[0]; }
};
