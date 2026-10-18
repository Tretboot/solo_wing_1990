// ===== SOLO WING 1990 — FLOTTE & POSTINGS =====
// Stabile IDs sind Savegame-Daten. Bestehende IDs niemals umbenennen oder wiederverwenden.

SW.PostingData = [
  {
    id: 'fax-traegodie',
    name: 'FAX-TRAGÖDIE',
    mapLabel: 'TRÄGER',
    type: 'carrier',
    startRoom: 'bar',
    roomIds: SW.Rooms.map(room => room.id),
    crew: Object.keys(SW.RoomNPCs).concat(['Commander', 'Sechs', 'Neun', 'Zwo', 'Vier', 'Optimierer'])
  },
  {
    id: 'test-destroyer',
    name: 'VERSUCHSZERSTÖRER',
    mapLabel: 'ZERSTÖRER',
    type: 'destroyer',
    startRoom: 'bar',
    roomIds: ['bar', 'flugdeck', 'kantine', 'maschinenraum', 'quartiere', 'player_quarters'],
    crew: ['Sechs', 'Bolt'],
    crewRooms: {
      bar: ['Sechs'],
      maschinenraum: ['Bolt']
    },
    playerBerth: true,
    stationedCraft: [
      { id: 'jaeger-01', shipClassId: 'jaeger' },
      { id: 'jaeger-02', shipClassId: 'jaeger' }
    ],
    missionProfile: ['patrol', 'courier', 'sensor_watch']
  },
  {
    id: 'outpost-31',
    name: 'AUSSENPOSTEN 31',
    mapLabel: 'POSTEN 31',
    type: 'outpost',
    startRoom: 'bar',
    roomIds: ['bar', 'flugdeck', 'kantine', 'beobachtung', 'quartiere', 'player_quarters'],
    crew: ['Zwo', 'Spiegel', 'Ragnhild'],
    crewRooms: {
      bar: ['Zwo'],
      kantine: ['Ragnhild'],
      beobachtung: ['Spiegel']
    },
    playerBerth: true,
    stationedCraft: [
      { id: 'jaeger-31', shipClassId: 'jaeger' }
    ],
    missionProfile: ['routine_patrol', 'radar_calibration']
  }
];
