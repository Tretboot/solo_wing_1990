// ===== SOLO WING 1990 — SYSTEME (Phase 4) =====
// 3 Sektoren, jeder mit eigenem Char, Location, NPCs.
SW.Systems = [
  {
    id:'s1', name:'SEKTOR 7', farbe:'#3366ff',
    char:'kalt, bläulich, militärisch — hier patrouilliert die Flotte und niemand trinkt umsonst.',
    location:'station', missionId:'m1',
    npcs:['Flug Drei','Zwo']
  },
  {
    id:'s2', name:'SEKTOR 9', farbe:'#ff3333',
    char:'heiß, rot, instabil — Grenzzone mit Piraten und instabilen Sprungpunkten.',
    location:'bar', missionId:'m2',
    npcs:['Sechs','Vier']
  },
  {
    id:'s3', name:'SEKTOR 12', farbe:'#cccccc',
    char:'neutral, staubig, zivil — Siedlerkolonie, wenig Verkehr, viel Ruhe.',
    location:'siedler', missionId:'m3',
    npcs:['Neun']
  }
];

// Scoreboard: 5 Piloten (Bar-Bildschirm)
SW.Scoreboard = [
  { name:'Flug Drei', kills:14, losses:3, status:'aktiv',    farbe:'#3366ff' },
  { name:'Sechs',     kills:9,  losses:5, status:'aktiv',    farbe:'#ff3333' },
  { name:'Neun',      kills:6,  losses:7, status:'urlaub',   farbe:'#cccccc' },
  { name:'Zwo',       kills:11, losses:2, status:'aktiv',    farbe:'#33cc66' },
  { name:'Vier',      kills:0,  losses:1, status:'gefallen', farbe:'#9966ff' }
];
