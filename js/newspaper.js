// ===== SCHIFFSZEITUNG (v0.6.8) =====
// Tägliche Berichte von der Front: Missionsergebnisse, NPC-Gossip, Spieler-Erfolge
// Generiert dynamisch Inhalte basierend auf Events, Quests, Subplot-Stages
SW.Newspaper = {
  // ===== KONFIGURATION =====
  config: {
    maxArticles: 8,           // Max Artikel pro Ausgabe
    gossipChance: 0.4,        // 40% Chance für NPC-Gossip
    subplotHintChance: 0.6,   // 60% Chance für Subplot-Hints
    playerHighlightWeight: 2.0 // Spieler-Erfolge werden 2x gewichtet
  },
  
  // ===== ARTIKEL-TEMPLATES =====
  templates: {
    // Missionserfolge
    mission_success: [
      'PILOT {name} KEHRT ZURÜCK: {mission} abgeschlossen.',
      'ERFOLG IM SEKTOR {sector}: {player} hat {target} neutralisiert.',
      'FRONTBERICHT: {name} liefert erneut – {mission} gesichert.',
      'WIEDER EIN SIEG: {player} kehrt von {mission} zurück.',
      'SEKTOR {sector} SICHER: {name} hat die Piraten vertrieben.'
    ],
    mission_failure: [
      'VERLUST IM SEKTOR {sector}: {player} vermisst.',
      'MISSION {mission} GESCHEITERT: Keine Rückkehr.',
      'TRAUER AN BORD: {name} ist nicht zurückgekehrt.',
      'ABGANG {time}: {player} vermisst. Suchaktion läuft.',
      'SCHLECHTE NACHRICHTEN: {mission} gescheitert.'
    ],
    
    // Besondere Spieler-Ereignisse
    special_event: [
      'ERSTMALS: {player} eliminiert {count} Piraten in einem Einsatz.',
      'GERÜCHTE: {name} hat {object} entdeckt.',
      'UNBESTÄTIGT: {player} sprach mit {npc} über {topic}.',
      'REKORDVERSUCH: {name} schafft {mission} in Rekordzeit.',
      'ÜBERRASCHUNG: {player} kehrt mit {loot} zurück.',
      'WAGNIS: {name} fliegt allein in {sector}.'
    ],
    
    // NPC-Gossip
    npc_gossip: [
      'ROHR murmelt wieder. Diesmal über {topic}.',
      'SECHS und NEUN haben eine Diskussion gehabt. Alle hören zu.',
      'KLO wischt anders heute. Jemand hat Wasser verschüttet.',
      'BOLT zählt wieder. Diesmal nicht Disketten, sondern {topic}.',
      'SECHS lacht. Das ist selten. Jemand hat {topic} gesagt.',
      'NEUN atmet tief. Nicht schlecht – aber tief.',
      'ZWO unterschreibt etwas. Niemand darf zuschauen.',
      'SYSTEM meldet: {topic} ist {value}. Formular 83-B ausstehend.',
      'ROHR hat eine neue Diskette. Seite drei. Bitte nicht umblättern.',
      'KLO wischt um etwas herum. Was es wischt, sagt er nicht.'
    ],
    
    // Subplot-Hints (alien, audit, optimierer)
    subplot_hint: {
      alien: [
        'KÄLTEKAMMER 7: Temperatur anomal. Fragen bleiben.',
        'Piratenflotte: Rückzug nach unbekannte Koordinaten.',
        'Es atmet. Zweimal pro Minute. Was ist es?',
        'Kältekammer 7: Atmung nachgewiesen. Nicht menschlich.',
        'Piraten wollten es. Was ist "es"?'
      ],
      audit: [
        'SEKTOR 7: Stempel statt Waffen. Wer sind die Streifen?',
        'Drohnen ohne Triebwerk. Sie streifen. Sie stempeln.',
        'Formular 99-Z: Vier Kontakte. Alle mit Stempel.',
        'Sektor 7: Keine Waffen. Nur Stempel. Was stempeln sie?'
      ],
      optimierer: [
        'GERÜCHTE: Eine Gruppe nennt sich "Die Optimierer".',
        'Sektor 7: Neue Frequenzen. Keine Sprache. Nur Zahlen.',
        'Piloten berichten: Jemand optimiert die Routen.',
        'Unbekannt: Wer optimiert was?'
      ]
    },
    
    // Allgemeine Front-Berichte
    front_report: [
      'FRONTLAGE: Stabil. Piraten zurückgedrängt.',
      'SEKTOR {sector}: Keine größeren Konflikte.',
      'PATROUILLE: Alle Einheiten melden "Alles klar".',
      'VERSORGUNG: Kaffeevorräte sinken. Neue Lieferung unterwegs.',
      'WARTUNG: Antrieb läuft auf 121 Hertz. Fast im Takt.'
    ]
  },
  
  // ===== STATUS =====
  currentIssue: null,      // Aktuelle Ausgabe (Datum + Artikel)
  lastGenerated: null,     // Timestamp der letzten Generierung
  articleHistory: []       // Letzte 10 Ausgaben für Vermeidung von Duplikaten
};

// ===== GENERIERUNG =====
SW.Newspaper.generate = function(date, events, playerActions, npcStates, subplotStages) {
  const articles = [];
  const usedTemplates = new Set();
  
  // 1. Missionsergebnisse verarbeiten
  const missionEvents = events.filter(e => e.type === 'mission_result');
  for (const event of missionEvents.slice(0, 3)) {
    const template = this._pickTemplate('mission_' + event.ergebnis, usedTemplates);
    if (template) {
      articles.push({
        id: 'mission_' + event.missionId + '_' + event.ergebnis,
        type: 'mission',
        headline: template
          .replace('{name}', event.pilot || 'Unbekannt')
          .replace('{player}', event.player || 'Pilot')
          .replace('{mission}', this._missionName(event.missionId))
          .replace('{sector}', event.sector || 'unbekannt')
          .replace('{target}', event.target || 'Piraten'),
        timestamp: event.timestamp,
        weight: 3.0
      });
    }
  }
  
  // 2. Besondere Spieler-Ereignisse
  for (const action of playerActions.slice(0, 2)) {
    const template = this._pickTemplate('special_event', usedTemplates);
    if (template) {
      articles.push({
        id: 'special_' + action.id,
        type: 'special',
        headline: template
          .replace('{player}', action.player || 'Pilot')
          .replace('{name}', action.name || 'Pilot')
          .replace('{count}', action.count || 'mehrere')
          .replace('{object}', action.object || 'etwas')
          .replace('{npc}', action.npc || 'einen NPC')
          .replace('{topic}', action.topic || 'Unbekanntes')
          .replace('{loot}', action.loot || 'Beute')
          .replace('{sector}', action.sector || 'Sektor X'),
        timestamp: action.timestamp,
        weight: 4.0
      });
    }
  }
  
  // 3. NPC-Gossip (zufällig basierend auf Interaktionen)
  if (Math.random() < this.config.gossipChance) {
    const gossipTopics = this._generateGossipTopics(npcStates);
    for (const topic of gossipTopics.slice(0, 2)) {
      const template = this._pickTemplate('npc_gossip', usedTemplates);
      if (template) {
        articles.push({
          id: 'gossip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          type: 'gossip',
          headline: template.replace('{topic}', topic),
          timestamp: date,
          weight: 1.5
        });
      }
    }
  }
  
  // 4. Subplot-Hints (je nach Stage)
  for (const [subplot, stage] of Object.entries(subplotStages)) {
    if (stage > 0 && Math.random() < this.config.subplotHintChance) {
      const hints = this.templates.subplot_hint[subplot] || [];
      const hint = hints[Math.min(hints.length - 1, stage - 1 + Math.floor(Math.random() * 2))];
      if (hint) {
        articles.push({
          id: 'subplot_' + subplot + '_stage' + stage,
          type: 'subplot',
          subplot: subplot,
          stage: stage,
          headline: hint,
          timestamp: date,
          weight: 2.5
        });
      }
    }
  }
  
  // 5. Allgemeine Front-Berichte (Füller)
  while (articles.length < this.config.maxArticles) {
    const template = this._pickTemplate('front_report', usedTemplates);
    if (template) {
      articles.push({
        id: 'front_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        type: 'front',
        headline: template
          .replace('{sector}', this._randomSector()),
        timestamp: date,
        weight: 1.0
      });
    } else {
      break;
    }
  }
  
  // Sortieren nach Weight (höchste zuerst)
  articles.sort((a, b) => b.weight - a.weight);
  
  // Limitieren
  const issue = {
    date: date,
    articles: articles.slice(0, this.config.maxArticles),
    generatedAt: Date.now()
  };
  
  this.currentIssue = issue;
  this.lastGenerated = Date.now();
  this.articleHistory.push(issue);
  if (this.articleHistory.length > 10) this.articleHistory.shift();
  
  return issue;
};

// ===== HILFSMETHODEN =====
SW.Newspaper._pickTemplate = function(category, usedTemplates) {
  const templates = this.templates[category] || [];
  if (templates.length === 0) return null;
  
  // Filtern: Noch nicht in dieser Ausgabe verwendet
  const available = templates.filter(t => !usedTemplates.has(t));
  if (available.length === 0) return null;
  
  // Zufällig auswählen
  const template = available[Math.floor(Math.random() * available.length)];
  usedTemplates.add(template);
  return template;
};

SW.Newspaper._missionName = function(missionId) {
  const names = {
    m1: 'Sektor 7-Aufklärung',
    m2: 'Piratenjagd',
    m3: 'Siedler-Evac',
    m4: 'Piratenflotte',
    m5: 'Kältekammer-Expedition'
  };
  return names[missionId] || missionId;
};

SW.Newspaper._randomSector = function() {
  const sectors = ['7', '12', 'Alpha-3', 'Beta-9', 'Gamma-4', 'Delta-1'];
  return sectors[Math.floor(Math.random() * sectors.length)];
};

SW.Newspaper._generateGossipTopics = function(npcStates) {
  const topics = [];
  
  // Basierend auf NPC-Interaktionen
  if (npcStates.klo && npcStates.klo.interactions > 5) {
    topics.push('Wasser und Toner');
  }
  if (npcStates.bolt && npcStates.bolt.interactions > 5) {
    topics.push('Disketten und Gebete');
  }
  if (npcStates.rohr && npcStates.rohr.interactions > 3) {
    topics.push('Kassetten-Tapes');
  }
  if (npcStates.sechs && npcStates.sechs.interactions > 3) {
    topics.push('Lachen und Atmen');
  }
  
  // Zufällige Themen
  const randomTopics = ['neue Routen', 'Kaffeevorräte', 'Formular 83-B', 'Schildwerte', 'Triebwerksgeräusche'];
  if (topics.length < 2) {
    topics.push(randomTopics[Math.floor(Math.random() * randomTopics.length)]);
  }
  
  return topics;
};

// ===== RENDERING =====
SW.Newspaper.render = function(ctx, x, y, width, height) {
  if (!this.currentIssue) {
    ctx.fillStyle = '#666';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('KEINE AUSGABE VERFÜGBAR', x + width / 2 - 80, y + height / 2);
    return;
  }
  
  const issue = this.currentIssue;
  const padding = 10;
  const articleHeight = 18;
  
  // Hintergrund
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = '#00aa00';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
  
  // Kopfzeile
  ctx.fillStyle = '#00aaff';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('SCHIFFSZEITUNG — AUSGABE ' + issue.date, x + padding, y + padding + 8);
  
  ctx.fillStyle = '#888';
  ctx.font = '7px monospace';
  ctx.fillText('Generiert: ' + new Date(issue.generatedAt).toLocaleTimeString(), x + padding, y + padding + 18);
  
  // Artikel
  let currentY = y + padding + 30;
  for (const article of issue.articles) {
    // Trennlinie
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(x + padding, currentY - 5);
    ctx.lineTo(x + width - padding, currentY - 5);
    ctx.stroke();
    
    // Artikel-Text
    ctx.fillStyle = this._getTypeColor(article.type);
    ctx.font = 'bold 8px monospace';
    ctx.fillText(article.headline, x + padding, currentY);
    
    currentY += articleHeight;
    if (currentY > y + height - padding) break;
  }
  
  // Fußzeile
  ctx.fillStyle = '#666';
  ctx.font = '6px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('[LEERTASTE: NÄCHSTE SEITE]', x + width - padding, y + height - padding);
  ctx.textAlign = 'left';
};

SW.Newspaper._getTypeColor = function(type) {
  const colors = {
    mission: '#00ff00',
    special: '#ffaa00',
    gossip: '#aaaaaa',
    subplot: '#aa00ff',
    front: '#666666'
  };
  return colors[type] || '#ffffff';
};

// ===== INTERAKTION =====
SW.Newspaper.handleClick = function(x, y) {
  // Prüfen, ob auf Artikel geklickt wurde
  if (!this.currentIssue) return null;
  
  // Detailansicht öffnen (hier: Article-Modal oder NPC-Reaktion)
  return { type: 'article_detail', issue: this.currentIssue };
};

// TTS-Vorlesung der aktuellen Ausgabe
SW.Newspaper.readAloud = function() {
  if (!this.currentIssue) return;
  
  for (const article of this.currentIssue.articles) {
    SW.TTS.speak(article.headline, 'system');
    SW.TTS.speak('Weiter.', 'system');
  }
};

// ===== DEBUG =====
SW.Newspaper.forceGenerate = function() {
  // Test-Funktion: Erzeugt sofortige Ausgabe mit Dummy-Daten
  const mockEvents = [
    { type: 'mission_result', missionId: 'm1', ergebnis: 'sieg', player: 'Spieler', timestamp: Date.now() }
  ];
  const mockActions = [
    { id: 'test1', player: 'Spieler', count: 5, object: 'Piratenflotte', timestamp: Date.now() }
  ];
  const mockNPCStates = { klo: { interactions: 6 }, bolt: { interactions: 6 } };
  const mockSubplotStages = { alien: 1, audit: 0, optimierer: 0 };
  
  return this.generate('TAG_001', mockEvents, mockActions, mockNPCStates, mockSubplotStages);
};