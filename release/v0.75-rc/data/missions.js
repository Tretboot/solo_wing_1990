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
        {count:2, z:300, y:0, ship:'d_b', staggerFrames:20, civilian:true},
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
    }
  ],
  get(id) { return this.list.find(m=>m.id===id)||this.list[0]; }
};
