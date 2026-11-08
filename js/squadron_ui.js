// ===== SOLO WING 1990 — SQUADRON UI (ARMADA HANGAR-MANAGEMENT) =====
// Detail-Staffelverwaltung im Hangar der TCS Fax-Tragödie:
// - Anzeige aller Jäger & Frachter mit Zustand, 80-Ansichten-3D-Vorschau & Pilotenzuweisung
// - Einzelreparaturen & Upgrades mit direkter Kostenabbuchung (CarrierEconomy)
// - [F] wählt das markierte Schiff + Cockpit direkt für den nächsten Flug des Spielers!

'use strict';

window.SW1990 = window.SW1990 || {};

SW.SquadronUI = {
  active: false,
  selectedShipIndex: 0,
  selectedTab: 'status',
  _previewTick: 0,

  open() {
    this.active = true;
    if (SW.Audio && typeof SW.Audio.playBeep === 'function') {
      SW.Audio.playBeep(700, 0.08);
    }
  },

  close() {
    this.active = false;
    if (SW.Audio && typeof SW.Audio.playBeep === 'function') {
      SW.Audio.playBeep(400, 0.06);
    }
  },

  handleKeyDown(e) {
    if (!this.active) return false;

    if (e.key === 'Escape' || e.key === 's' || e.key === 'S') {
      this.close();
      return true;
    }

    const ships = SW.Squadron ? SW.Squadron.ships : [];
    if (!ships.length) return false;

    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      this.selectedShipIndex = (this.selectedShipIndex - 1 + ships.length) % ships.length;
      if (SW.Audio && typeof SW.Audio.playBeep === 'function') SW.Audio.playBeep(600, 0.03);
      return true;
    }
    if (e.key === 'ArrowDown') {
      this.selectedShipIndex = (this.selectedShipIndex + 1) % ships.length;
      if (SW.Audio && typeof SW.Audio.playBeep === 'function') SW.Audio.playBeep(600, 0.03);
      return true;
    }

    const curShip = ships[this.selectedShipIndex];

    // [P]: Nächsten Piloten zuweisen
    if (e.key === 'p' || e.key === 'P') {
      this.cyclePilot(curShip);
      return true;
    }

    // [F] oder [B]: Dieses Schiff & Cockpit als eigenes Spielerschiff übernehmen!
    if (e.key === 'f' || e.key === 'F' || e.key === 'b' || e.key === 'B') {
      if (SW.Player && curShip) {
        SW.Player.shipClassId = curShip.classId || 'jaeger';
        SW.Squadron.assignPilot(curShip.id, (SW.World && SW.World.pilotName) || 'Flug Drei');
        if (SW.Audio && typeof SW.Audio.playBeep === 'function') SW.Audio.playBeep(980, 0.08);
      }
      return true;
    }

    // [R]: Hülle / Triebwerk reparieren
    if (e.key === 'r' || e.key === 'R') {
      if (SW.Squadron) {
        const repSuccess = SW.Squadron.repairComponent(curShip.id, 'hull') ||
                           SW.Squadron.repairComponent(curShip.id, 'engine') ||
                           SW.Squadron.repairComponent(curShip.id, 'leftGun') ||
                           SW.Squadron.repairComponent(curShip.id, 'rightGun');
        if (repSuccess && SW.Audio && typeof SW.Audio.playBeep === 'function') {
          SW.Audio.playBeep(920, 0.08);
        }
      }
      return true;
    }

    // [U]: Upgrade installieren
    if (e.key === 'u' || e.key === 'U') {
      if (SW.Squadron) {
        const upgrades = Object.keys(SW.Squadron.UPGRADES);
        const available = upgrades.find(up => !curShip.upgrades.includes(up));
        if (available && SW.Squadron.installUpgrade(curShip.id, available)) {
          if (SW.Audio && typeof SW.Audio.playBeep === 'function') {
            SW.Audio.playBeep(1100, 0.1);
          }
        }
      }
      return true;
    }

    return false;
  },

  cyclePilot(ship) {
    if (!SW.Crew) return;
    const pilots = SW.Crew.filter(c => c.posten.includes('Pilot') || c.name === 'Flug Drei');
    const pilotNames = [null, ...pilots.map(p => p.name)];
    const curIdx = pilotNames.indexOf(ship.pilot);
    const nextName = pilotNames[(curIdx + 1) % pilotNames.length];
    if (SW.Squadron) {
      if (nextName) {
        SW.Squadron.assignPilot(ship.id, nextName);
      } else {
        SW.Squadron.unassignPilot(ship.id);
      }
      if (SW.Audio && typeof SW.Audio.playBeep === 'function') {
        SW.Audio.playBeep(840, 0.05);
      }
    }
  },

  render(ctx) {
    if (!this.active) return;
    this._previewTick++;

    const ships = SW.Squadron ? SW.Squadron.ships : [];
    const curShip = ships[this.selectedShipIndex];

    ctx.save();
    // Wichtig: 640x400 native Auflösung für gestochen scharfes Terminal-Layout!
    if (ctx.setTransform) ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Hintergrund
    ctx.fillStyle = 'rgba(12, 18, 28, 0.96)';
    ctx.fillRect(35, 20, 570, 360);

    // Rahmen
    ctx.strokeStyle = '#225588';
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 20, 570, 360);
    ctx.strokeStyle = '#4488cc';
    ctx.strokeRect(38, 23, 564, 354);

    // Titel
    ctx.fillStyle = '#162842';
    ctx.fillRect(39, 24, 562, 28);
    ctx.fillStyle = '#88ccff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('STAFFEL-LEITUNG // TCS FAX-TRAGÖDIE HANGAR (ARMADA-MODELL)', 48, 42);

    // Wirtschaftskopfzeile
    const econ = SW.CarrierEconomy ? SW.CarrierEconomy.getSummary() : null;
    if (econ) {
      ctx.fillStyle = '#ffcc44';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('CR: ' + econ.credits + ' | TEILE: ' + econ.resources.spareParts + ' | SPRIT: ' + econ.resources.fuel + '% | ' + econ.rankShort, 592, 42);
    }

    // Linke Spalte: Schiffsliste
    ctx.fillStyle = '#0f1724';
    ctx.fillRect(42, 56, 180, 280);
    ctx.strokeStyle = '#224466';
    ctx.strokeRect(42, 56, 180, 280);

    ctx.fillStyle = '#88aacc';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SCHIFFE AN BORD:', 50, 72);

    ships.forEach((s, idx) => {
      const y = 92 + idx * 38;
      const isSel = idx === this.selectedShipIndex;
      if (isSel) {
        ctx.fillStyle = '#224477';
        ctx.fillRect(45, y - 12, 174, 34);
      }
      ctx.fillStyle = s.status === 'READY' ? '#44ff88' : '#ffaa44';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(s.id + ' — ' + s.status, 50, y);

      ctx.fillStyle = '#cccccc';
      ctx.font = '8px monospace';
      ctx.fillText('Pilot: ' + (s.pilot || '[FREI]'), 50, y + 12);
    });

    // Rechte Spalte: Detailkarte des gewählten Jägers + 3D Drehscheibe
    if (curShip) {
      ctx.fillStyle = '#0d1522';
      ctx.fillRect(228, 56, 370, 280);
      ctx.strokeStyle = '#224466';
      ctx.strokeRect(228, 56, 370, 280);

      ctx.fillStyle = '#66aaff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(curShip.callsign + ' (' + curShip.id + ')', 240, 76);

      const cls = SW.ShipClasses ? SW.ShipClasses.get(curShip.classId) : null;
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '9px monospace';
      ctx.fillText('Typ: ' + (cls ? cls.name : curShip.classId.toUpperCase()) + ' | Kills: ' + curShip.kills, 240, 92);

      // 3D Turntable Preview Box (oben rechts in der Detailkarte)
      ctx.fillStyle = '#060c14';
      ctx.fillRect(500, 66, 86, 86);
      ctx.strokeStyle = '#336699';
      ctx.strokeRect(500, 66, 86, 86);
      if (SW.Sprites && SW.Sprites.drawMultiAngle) {
        const atlasKey = (cls && cls.atlasKey) || SW.Sprites.mapShipIdToAtlas(curShip.classId, false);
        const heading = this._previewTick * 0.04;
        const pitch = Math.sin(this._previewTick * 0.02) * 0.35;
        // Direkter Winkel-Aufruf ohne 3D-Kameraverzerrung: butterweiche Turntable-Rotation ohne Zuckeln
        SW.Sprites.drawMultiAngle(ctx, atlasKey, 543, 109, 68, heading, pitch, '#44ccff', SW.Sprites.playerShip);
      }

      // Statusbalken
      const drawBar = (label, val, y, color) => {
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px monospace';
        ctx.fillText(label + ':', 240, y);
        ctx.fillStyle = '#112233';
        ctx.fillRect(345, y - 9, 110, 10);
        ctx.fillStyle = color;
        ctx.fillRect(345, y - 9, Math.round(110 * (val / 100)), 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(val + '%', 462, y);
      };

      drawBar('HÜLLEN-INTEGRITÄT', curShip.hull, 115, curShip.hull > 60 ? '#44cc44' : '#ff4444');
      drawBar('SCHILDGENERATOR', curShip.shieldGen, 133, '#3388ff');
      drawBar('TRIEBWERK', curShip.engine, 151, '#ffaa33');

      // Waffensysteme
      ctx.fillStyle = '#88bbdd';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('BEWAFFNUNG & COCKPIT:', 240, 180);
      ctx.font = '9px monospace';
      ctx.fillStyle = curShip.leftGun.status === 'OK' ? '#44ff88' : '#ff4444';
      ctx.fillText('Links:  ' + curShip.leftGun.name + ' [' + curShip.leftGun.status + ' ' + curShip.leftGun.integrity + '%]', 240, 196);
      ctx.fillStyle = curShip.rightGun.status === 'OK' ? '#44ff88' : '#ff4444';
      ctx.fillText('Rechts: ' + curShip.rightGun.name + ' [' + curShip.rightGun.status + ' ' + curShip.rightGun.integrity + '%]', 240, 212);
      ctx.fillStyle = '#ffaa44';
      ctx.fillText('Torpedos: ' + curShip.torpedoes + ' Stk. | Cockpit: ' + ((cls && cls.cockpitKey) || 'hornet').toUpperCase(), 240, 228);

      // Upgrades
      ctx.fillStyle = '#88bbdd';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('INSTALLIERTE UPGRADES:', 240, 252);
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px monospace';
      if (curShip.upgrades.length > 0) {
        curShip.upgrades.forEach((uKey, uIdx) => {
          const uData = SW.Squadron.UPGRADES[uKey];
          ctx.fillText('• ' + (uData ? uData.name : uKey), 240, 268 + uIdx * 14);
        });
      } else {
        ctx.fillStyle = '#777777';
        ctx.fillText('(Keine Upgrades installiert)', 240, 268);
      }

      if (SW.Player && SW.Player.shipClassId === curShip.classId) {
        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('★ AKTIVES SPIELER-SCHIFF & COCKPIT', 240, 322);
      }
    }

    // Fußzeile: Shortcuts
    ctx.fillStyle = '#101c2e';
    ctx.fillRect(42, 342, 556, 28);
    ctx.strokeStyle = '#224466';
    ctx.strokeRect(42, 342, 556, 28);
    ctx.fillStyle = '#88ccff';
    ctx.font = '8.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[↑/↓] SCHIFF  [F] SELBST FLIEGEN  [P] PILOT  [R] REPARATUR (25 CR)  [U] UPGRADE  [ESC] ZURÜCK', 320, 360);

    ctx.restore();
  }
};
