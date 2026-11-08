// ===== SOLO WING 1990 — CARRIER ECONOMY & DUAL CAREER (ARMADA / PRIVATEER) =====
// Träger-Versorgungsökonomie und Duale Karriere-Progression:
// - Militär-Karriere (Sternenkorps / TCS Fax-Tragödie):
//     Rang 1: Fähnrich / Gefreiter (Automatische Versorgung durch KI-Quartiermeister)
//     Rang 2: Captain / Staffelführer (Budgetkontrolle, Staffel-Entsendung auf der Sektorkarte)
//     Rang 3: Flotten-Admiral (Armada-Modus: Träger & Kampfgruppen in allen 16 Sektoren befehligen!)
// - Privateer-Karriere (Freier Händler & Söldner auf "Kiste 47"):
//     Einstieg jederzeit über [DIENST QUITTIEREN] auf der Sektorkarte ODER automatisch bei Entlassung!
//     Startkapital + eigener Frachter "Kiste 47" (Tarsus-Klasse), freier Rohstoffhandel,
//     Kopfgeld-/Schmuggel-Aufträge und Kauf aller 8 fliegbaren Schiffsklassen & Cockpits!

'use strict';

window.SW1990 = window.SW1990 || {};

SW.CarrierEconomy = {
  carrierName: 'TCS Fax-Tragödie',
  careerMode: 'military', // 'military' | 'privateer'
  tier: 1, // 1: Gefreiter, 2: Captain, 3: Admiral (bzw. im Privateer-Modus: Freibeuter)
  credits: 1250,
  cargoHold: {
    toner: 2,
    ersatzteile: 4,
    erz: 0,
    kaffee: 2,
    schmuggelware: 0
  },

  resources: {
    fuel: 85,
    spareParts: 42,
    torpedoes: 18,
    rations: 94,
    tonerPaper: 12
  },

  deliveries: [
    {
      id: 'FR-101',
      freighter: 'Kiste 47 (Versorger)',
      cargo: 'Ersatzteilkisten & Ionen-Düsen',
      amount: 15,
      etaMinutes: 0,
      status: 'DOCKED',
      origin: 'Hephaestus Minen (Sektor 8)'
    },
    {
      id: 'FR-102',
      freighter: 'Bex Express Delivery',
      cargo: 'Protonen-Torpedos & Faxrollen',
      amount: 8,
      etaMinutes: 14,
      status: 'IN_TRANSIT',
      origin: 'Bex Raumwerft (Sektor 11)'
    },
    {
      id: 'FR-103',
      freighter: 'Siedler-Konvoi Alpha',
      cargo: 'Treibstoff-Zellen & Kaffeepulver-Ersatz',
      amount: 30,
      etaMinutes: 38,
      status: 'WARPING',
      origin: 'Station Gemma 4 (Sektor 4)'
    }
  ],

  init() {
    this.loadState();
  },

  loadState() {
    try {
      const saved = localStorage.getItem('sw_carrier_economy_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(this, parsed);
      }
    } catch (e) {}
  },

  saveState() {
    try {
      const data = {
        careerMode: this.careerMode,
        tier: this.tier,
        credits: this.credits,
        cargoHold: this.cargoHold,
        resources: this.resources,
        deliveries: this.deliveries
      };
      localStorage.setItem('sw_carrier_economy_v2', JSON.stringify(data));
    } catch (e) {}
  },

  spend(amountCredits, partsNeeded) {
    if (this.careerMode === 'military' && this.tier === 1) {
      if (partsNeeded && this.resources.spareParts < partsNeeded) return false;
      if (partsNeeded) this.resources.spareParts -= partsNeeded;
      this.saveState();
      return true;
    }
    if (this.credits < amountCredits) return false;
    if (partsNeeded && this.resources.spareParts < partsNeeded) return false;
    this.credits -= amountCredits;
    if (partsNeeded) this.resources.spareParts -= partsNeeded;
    this.saveState();
    return true;
  },

  addReward(creditsEarned, salvageParts) {
    this.credits += (creditsEarned || 0);
    this.resources.spareParts += (salvageParts || 0);
    // Auto-promotion check in military career
    if (this.careerMode === 'military') {
      const completed = (SW.World && Array.isArray(SW.World.missionProgress)) ? SW.World.missionProgress.length : 0;
      if (completed >= 2 && this.tier < 2) this.tier = 2;
      if (completed >= 4 && this.tier < 3) this.tier = 3;
    }
    this.saveState();
  },

  promote() {
    this.careerMode = 'military';
    if (this.tier < 3) {
      this.tier += 1;
    }
    if (SW.Squadron && SW.Squadron.promotePlayer) {
      SW.Squadron.promotePlayer();
    }
    this.saveState();
    return true;
  },

  // Wechsel in den Privateer-Modus (freiwillige Kündigung oder Entlassung)
  // Berechnet Abfindung nach gespielten Missionen + schenkt dem Piloten ein ausgemustertes Veteranen-Schiff!
  enterPrivateerMode(reason, triggerCutscene) {
    this.careerMode = 'privateer';
    const progCount = (SW.World && Array.isArray(SW.World.missionProgress)) ? SW.World.missionProgress.length : 0;
    const scoreCount = (SW.Game && SW.Game.score) ? Math.floor(SW.Game.score / 300) : 0;
    const missionsPlayed = Math.max(progCount, scoreCount, this._missionsCompleted || 0);

    // Abfindung steigt mit jeder gespielten Mission (Basis 1.800 CR + 950 CR pro Einsatz)
    const baseSeverance = 1800;
    const missionBonus = missionsPlayed * 950;
    const totalSeverance = baseSeverance + missionBonus;
    this.lastSeverance = totalSeverance;
    this._lastSeverance = totalSeverance;
    this.lastMissionsPlayed = missionsPlayed;
    this._missionsAtExit = missionsPlayed;

    if (missionsPlayed > 0) {
      this.credits += totalSeverance;
    } else if (this.credits < baseSeverance) {
      this.credits = baseSeverance;
    }

    // Geschenktes altes Schiff je nach Dienstzeit / gespielten Missionen
    this.ownedShips = this.ownedShips || ['frachter'];
    let giftId = 'frachter';
    let giftName = 'Frachter „Kiste 47“ (Tarsus-Klasse)';
    let giftNote = 'Ausgemusterter Versorgungsfrachter aus Hangar-Bucht 4';
    if (missionsPlayed >= 4) {
      giftId = 'hermes';
      giftName = 'KIWI-Mk.IV „Schwarm-Null“ (KI-Prototyp)';
      giftNote = 'Geheimer Beute-Jäger aus dem alten Hermes-Schwarm';
      if (!this.ownedShips.includes('ueberlegenheit')) this.ownedShips.push('ueberlegenheit');
      if (!this.ownedShips.includes('bomber')) this.ownedShips.push('bomber');
    } else if (missionsPlayed >= 3) {
      giftId = 'dralthi';
      giftName = 'Beute-Dralthi „Kilrathi-Fundstück 88“';
      giftNote = 'Von Bolt zusammengeflickter Grenzsektor-Abfangjäger';
      if (!this.ownedShips.includes('bomber')) this.ownedShips.push('bomber');
    } else if (missionsPlayed >= 1) {
      giftId = 'bomber';
      giftName = 'Alte Scimitar Mk.I „Rostiger Amboss“';
      giftNote = 'Ausgemusterter schwerer Jäger mit handsigniertem Aschenbecher';
    }
    if (!this.ownedShips.includes(giftId)) this.ownedShips.push(giftId);
    this.giftedShipId = giftId;
    this.giftedShip = giftId;
    this.giftedShipName = giftName;
    this.giftedShipNote = giftNote;
    this.giftedShipDesc = giftNote;
    this.resignationReason = reason || 'Formular 99-P (Dienst auf eigenen Wunsch quittiert)';

    // Rüste Kiste 47 als Standard-Handelsschiff aus (oder Veteranen-Schiff per [B] wählbar)
    if (SW.Player) {
      SW.Player.shipClassId = 'frachter';
    }
    if (SW.Comm) {
      SW.Comm.add('COMMANDER: ' + this.resignationReason + ' Abfindung: ' + totalSeverance + ' CR + Geschenk: ' + giftName + '!');
    }
    this.saveState();

    // Starte die animierte Zwischensequenz „Dienst Quittieren“, falls im laufenden Spiel ausgelöst
    if (triggerCutscene && SW.Game && typeof SW.Game.startResignation === 'function') {
      SW.Game.startResignation();
    }
    return true;
  },

  returnToMilitary() {
    this.careerMode = 'military';
    if (SW.Comm) {
      SW.Comm.add('COMMANDER: Wiedereinstellungs-Formular 12-R akzeptiert. Willkommen zurück im Sternenkorps!');
    }
    this.saveState();
    return true;
  },

  getCargoUsed() {
    return Object.values(this.cargoHold || {}).reduce((a, b) => a + (b || 0), 0);
  },

  getCargoMax() {
    const cls = (SW.Player && SW.Player.getShipClass) ? SW.Player.getShipClass() : null;
    return (cls && cls.cargoMax) || (this.careerMode === 'privateer' ? 60 : 25);
  },

  tickEconomy() {
    let updated = false;
    this.deliveries.forEach(del => {
      if (del.status === 'IN_TRANSIT' || del.status === 'WARPING') {
        del.etaMinutes = Math.max(0, del.etaMinutes - 5);
        if (del.etaMinutes === 0) {
          del.status = 'DOCKED';
          if (del.cargo.includes('Ersatzteil')) this.resources.spareParts += del.amount;
          if (del.cargo.includes('Torpedo')) this.resources.torpedoes += del.amount;
          if (del.cargo.includes('Treibstoff')) this.resources.fuel = Math.min(100, this.resources.fuel + del.amount);
          updated = true;
        }
      }
    });
    if (updated) this.saveState();
  },

  getSummary() {
    const rankLabels = {
      1: 'Gefreiter (KI-Quartiermeister)',
      2: 'Captain / Staffelführer (Budget & Staffel)',
      3: 'Flotten-Admiral (Armada-Oberkommando)'
    };
    const shortLabels = {
      1: 'RANG: GEFREITER',
      2: 'RANG: CAPTAIN',
      3: 'RANG: ADMIRAL'
    };
    const isPriv = this.careerMode === 'privateer';
    return {
      rank: isPriv ? 'Freibeuter / Privateer (Kapitän der Kiste 47)' : rankLabels[this.tier],
      rankShort: isPriv ? 'MODUS: PRIVATEER' : shortLabels[this.tier],
      careerMode: this.careerMode,
      tier: this.tier,
      credits: this.credits,
      resources: this.resources,
      dockedFreighters: this.deliveries.filter(d => d.status === 'DOCKED').length
    };
  }
};

if (typeof window !== 'undefined') {
  SW.CarrierEconomy.init();
}
