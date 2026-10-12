// ===== SOLO WING 1990 — QUEST DATA =====
// Fax-basierte Quests. Reine Daten. Kein DOM. Kein Rendering.
// Quests sind ein Overlay. Kein neuer State.

'use strict';

SW.QuestData = {
  quests: [
    {
      id: 'kaltkammer_beschutzen',
      titel: 'Kältekammer beschützen',
      npc: 'COMMANDER',
      fax: 'AUFTRAG: Kältekammer beschützen.\nORT: Frachter, Kältekammer 7.\nBELOHNUNG: Es atmet weiter.',
      bedingung: { typ: 'mission', ergebnis: 'sieg' },
      belohnung: { text: 'Es atmet weiter. Das ist alles.', flag: 'kaltkammer_gesichert' }
    },
    {
      id: 'akte_sechs',
      titel: 'Akte lesen: Sechs',
      npc: 'COMMANDER',
      fax: 'AUFTRAG: Akte lesen.\nORT: Büro, Aktenschrank.\nBELOHNUNG: Er sagt etwas.',
      bedingung: { typ: 'flag', name: 'akte_gelesen_sechs' },
      belohnung: { text: 'Er sagt etwas. Er sagt es nur einmal.', flag: 'akte_sechs_angesprochen' }
    },
    {
      id: 'klo_putzen',
      titel: 'Klo putzen',
      npc: 'KLO',
      fax: 'AUFTRAG: Klo putzen.\nORT: Wo es ist. Sie wissen, wo es ist.\nBELOHNUNG: Sie sagt etwas Wahres.',
      bedingung: { typ: 'flag', name: 'klo_geputzt' },
      belohnung: { text: 'Sie sagt etwas Wahres. Sie sagt es nur einmal.' }
    },
    {
      id: 'optimierer_widerspruch',
      titel: 'Widerspruch einlegen',
      npc: 'OPTIMIERER',
      fax: 'AUFTRAG: Widerspruch einlegen.\nFORMULAR: 91-X.\nBELOHNUNG: Strafversetzung.',
      bedingung: { typ: 'flag', name: 'widerspruch_eingelegt' },
      belohnung: { text: 'Strafversetzung. Das ist die Belohnung. Das ist der Witz.' }
    },
    {
      id: 'kaffee_bringen',
      titel: 'Kaffee bringen',
      npc: 'KANTINE',
      fax: 'AUFTRAG: Kaffee abholen.\nSCHRITT 1: Kantine.\nSCHRITT 2: Büro, Commander.\nBELOHNUNG: Der Kaffee ist warm.',
      bedingung: [
        { typ: 'flag', name: 'kaffee_abgeholt' },
        { typ: 'besuche', raum: 'buerro' }
      ],
      belohnung: { text: 'Der Kaffee ist warm. Das ist alles.' }
    }
  ]
};
