// ===== SOLO WING 1990 — FLOTTE & POSTINGS =====
// Stabile IDs sind Savegame-Daten. Bestehende IDs niemals umbenennen oder wiederverwenden.

SW.PostingData = [
  {
    id: 'fax-traegodie',
    name: 'FAX-TRAGÖDIE',
    mapLabel: 'TRÄGER',
    type: 'carrier',
    carrierAtlasKey: 'fax_traegodie',
    defaultShipClassId: 'jaeger',
    squadronName: 'Staffel 7 — "Die Geduldigen"',
    startRoom: 'bar',
    roomIds: SW.Rooms.map(room => room.id),
    stationedCraft: [
      { id: 'FLUG-03', shipClassId: 'jaeger', cockpitKey: 'hornet', callsign: 'Fliege Drei (Hornet)' },
      { id: 'FLUG-06', shipClassId: 'jaeger', cockpitKey: 'hornet', callsign: 'Fliege Sechs (Hornet)' },
      { id: 'FLUG-09', shipClassId: 'bomber', cockpitKey: 'scimitar', callsign: 'Scimitar Neun (Bomber)' },
      { id: 'FLUG-02', shipClassId: 'ueberlegenheit', cockpitKey: 'valtar', callsign: 'Raptor Zwo (Valtar)' }
    ],
    crew: Object.keys(SW.RoomNPCs).concat(['Commander', 'Sechs', 'Neun', 'Zwo', 'Vier', 'Optimierer'])
  },
  {
    id: 'tcs-hermes',
    name: 'TCS HERMES (KI-SCHWARM)',
    mapLabel: 'HERMES-KI',
    type: 'ai-carrier',
    carrierAtlasKey: 'hermes_carrier',
    defaultShipClassId: 'hermes',
    squadronName: 'Schwarm 0 — "KIWI-Handoff"',
    startRoom: 'bar',
    roomIds: ['bar', 'flugdeck', 'buerro', 'kantine', 'reparatur', 'beobachtung', 'maschinenraum', 'schule', 'quartiere', 'player_quarters'],
    crew: ['Hermes-Kern', 'Worker-7', 'Reviewer-9', 'Sechs', 'Diskettens'],
    crewRooms: {
      bar: ['Hermes-Kern', 'Sechs'],
      flugdeck: ['Hermes-Kern'],
      buerro: ['Reviewer-9'],
      kantine: ['Worker-7'],
      reparatur: ['Worker-7'],
      beobachtung: ['Reviewer-9'],
      maschinenraum: ['Worker-7', 'Diskettens'],
      schule: ['Diskettens', 'Hermes-Kern']
    },
    playerBerth: true,
    stationedCraft: [
      { id: 'KIWI-01', shipClassId: 'hermes', cockpitKey: 'hermes', callsign: 'KIWI-Alpha (Cyber-Jäger)' },
      { id: 'KIWI-02', shipClassId: 'hermes', cockpitKey: 'hermes', callsign: 'Worker-Drohne 7' },
      { id: 'KIWI-03', shipClassId: 'ueberlegenheit', cockpitKey: 'valtar', callsign: 'Supervisor-Raptor' },
      { id: 'KIWI-04', shipClassId: 'strakha', cockpitKey: 'strakha', callsign: 'Sandbox-Phantom' }
    ],
    missionProfile: ['swarm_defense', 'context_rescue', 'neural_audit']
  },
  {
    id: 'test-destroyer',
    name: 'VERSUCHSZERSTÖRER',
    mapLabel: 'ZERSTÖRER',
    type: 'destroyer',
    carrierAtlasKey: 'fax_traegodie',
    defaultShipClassId: 'bomber',
    squadronName: ' Zerstörer-Rotte — "Eisenvogel"',
    startRoom: 'bar',
    roomIds: ['bar', 'flugdeck', 'kantine', 'maschinenraum', 'quartiere', 'player_quarters'],
    crew: ['Sechs', 'Bolt'],
    crewRooms: {
      bar: ['Sechs'],
      maschinenraum: ['Bolt']
    },
    playerBerth: true,
    stationedCraft: [
      { id: 'jaeger-01', shipClassId: 'bomber', cockpitKey: 'scimitar' },
      { id: 'jaeger-02', shipClassId: 'jaeger', cockpitKey: 'hornet' }
    ],
    missionProfile: ['patrol', 'courier', 'sensor_watch']
  },
  {
    id: 'outpost-31',
    name: 'AUSSENPOSTEN 31',
    mapLabel: 'POSTEN 31',
    type: 'outpost',
    carrierAtlasKey: 'freighter',
    defaultShipClassId: 'ueberlegenheit',
    squadronName: 'Grenzstaffel 31 — "Nebelwache"',
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
      { id: 'jaeger-31', shipClassId: 'ueberlegenheit', cockpitKey: 'valtar' }
    ],
    missionProfile: ['routine_patrol', 'radar_calibration']
  }
];
