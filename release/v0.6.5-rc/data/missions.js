// ===== SOLO WING 1990 — MISSION DATA =====
// Data-driven. Neue Mission = neuer Eintrag. Kein Code-Change.
// ship: 'd_b' | 'Jäger' | 'Kreuzer' | 'piraten_jaeger' | 'piraten_kapitaen'
// Vertical Slice: m4 = "DER FRACHTER" (Piraten + Alien-Twist)

SW.Missions = {
  list: [
    {
      id:'m1', name:'SEKTOR 7 — ABFANGKAMPF',
      description:'Feindliche Signatur in Sektor 7. Abfangen und zerstören.',
      waves:[
        {count:2, z:250, y:0, ship:'d_b'},
        {count:3, z:200, y:0, ship:'Jäger'},
        {count:3, z:200, y:0, ship:'d_b'},
        {count:2, z:250, y:0, ship:'Kreuzer'}
      ],
      navPoints:[{x:0,y:0},{x:50,y:-30},{x:-40,y:20}],
      waveMessages:[
        "COMMANDER: Erste Welle, d_b-Drohnen. Standardverfahren, viel Glück.",
        "COMMANDER: Jäger. Die streifen. Halten Sie die Höhe.",
        "COMMANDER: Zweite Welle, Verstärkung. Unser Plan. Es gab einen Fehler.",
        "COMMANDER: Kreuzer. Langsam, aber ein Treffer und Sie sind Geschichte."
      ]
    },
    {
      id:'m2', name:'SEKTOR 9 — GELEITSCHUTZ',
      description:'Frachter eskortieren. Keine Feindkontakte erwartet. (Lüge.)',
      waves:[
        {count:2, z:250, y:0, ship:'Jäger'},
        {count:3, z:200, y:0, ship:'d_b'}
      ],
      navPoints:[{x:0,y:0},{x:80,y:0},{x:0,y:-50}],
      waveMessages:[
        "COMMANDER: Kontakt. War nicht im Plan. Machen Sie es schnell.",
        "COMMANDER: Noch ein paar. Der Frachter wartet nicht."
      ]
    },
    {
      id:'m3', name:'SEKTOR 12 — SIEDLER-KONTAKT',
      description:'Zivile Signatur. KEIN FEUER. Beobachten und eskortieren.',
      waves:[
        {count:2, z:300, y:0, ship:'d_b'}
      ],
      navPoints:[{x:0,y:0},{x:-60,y:40}],
      waveMessages:[
        "COMMANDER: Das sind Zivilisten. Schießen Sie NICHT. Eskortieren Sie sie.",
        "COMMANDER: Sie haben sich verlaufen. Bringen Sie sie nach Hause."
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
        {count:3, z:200, y:0, ship:'piraten_jaeger'},
        // Welle 2: 2 Piraten-Jäger + 1 Kapitänsschiff
        {count:2, z:200, y:0, ship:'piraten_jaeger'},
        {count:1, z:250, y:0, ship:'piraten_kapitaen'}
      ],
      navPoints:[{x:0,y:0},{x:20,y:-30},{x:-10,y:20}],
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
