// ===== SOLO WING 1990 — UI SYSTEMS =====
// Cockpit overlay, Radar, Space Map, Comm, Briefing.
//
// WIEDERHERSTELLUNG (2026-10-12): Die Datei war bei einer Shell-Operation in
// eine einzige Zeile zerlegt worden. Da Zeile 1 mit "//" beginnt, war das
// komplette File zu einem Kommentar verkommen — SW.UI und SW.Comm liefen
// still als undefined durch (Smoke-Test brach in startMission()).
// Basis: release/v0.6.5-rc/js/ui.js (intakt), dazu v0.6.6-Features nach
// KONZEPTE.md/PATCHNOTES.md nachgebaut:
//   - SW.Comm.render(): Cockpit-Video (NPC-Gesicht 2 s pro Funkzeile,
//     System-Farb-Rahmen) via SW.NPC.renderCockpitVideo
//   - SW.BriefingBoard: Typing-State-Machine (start/advance/update/render),
//     Zeilen aus SW.Dialogues.briefingBoards (m1–m3) bzw. mission.briefing (m4)

SW.UI = {
  navMapVisible: false,  // N = Nav/Spacemap Toggle (Cockpit)
  commMenuOpen: false,   // [1..4] In-Flight Squadron Comms VDU Menu

  isWingnutCockpitActive() {
    if (!SW.Sprites || SW.Sprites.graphicsMode === 'classic_1990') return false;
    const cls = (SW.Player && SW.Player.getShipClass) ? SW.Player.getShipClass() : { cockpitKey: 'hornet' };
    const ck = SW.Sprites.cockpits && SW.Sprites.cockpits[cls.cockpitKey || 'hornet'];
    return !!(ck && ck.front && ck.front._ready && ck.front.width > 0);
  },

  renderCockpit(ctx) {
    const ox = Math.round((SW.Player && SW.Player.cockpitShiftX) || 0);
    const oy = Math.round((SW.Player && SW.Player.cockpitShiftY) || 0);
    const useWingnut = this.isWingnutCockpitActive();

    if (useWingnut) {
      const cls = SW.Player.getShipClass();
      const ck = SW.Sprites.cockpits[cls.cockpitKey || 'hornet'] || SW.Sprites.cockpits.hornet;
      const cap = SW.Player.shieldCapacity ? SW.Player.shieldCapacity() : SW.SHIELD_MAX;
      const frontImg = (ck.front && ck.front._ready) ? ck.front : null;
      const dmgImg = (ck.damaged && ck.damaged._ready) ? ck.damaged : null;

      // 1. Basis-Cockpit (immer sauberes Basis-Frame wie im Original)
      if (frontImg) {
        ctx.drawImage(frontImg, -10 + ox, -10 + oy, 340, 220);
      }

      // 2. Partielle Schadens-Overlays (Wing Commander 1/2 Stil):
      // Beschädigte Bereiche werden nur dort überblendet, wo tatsächlich Systeme
      // oder Schilde ausgefallen sind (Konsolen-Sprünge, Funkenflug, zersplittertes Glas).
      if (dmgImg) {
        const sys = SW.Player.systems || {};
        const leftDamaged = (sys.weapons !== undefined && sys.weapons < 50) || (SW.Player.frontShield < cap * 0.28);
        const rightDamaged = (sys.engines !== undefined && sys.engines < 50) || (SW.Player.rearShield < cap * 0.28);
        const canopyDamaged = (sys.sensors !== undefined && sys.sensors < 45) || (SW.Player.frontShield < cap * 0.12 && SW.Player.rearShield < cap * 0.12);
        const catastrophic = (sys.shields !== undefined && sys.shields < 30) && (leftDamaged && rightDamaged);

        if (catastrophic) {
          // Gesamtschaden: voller Schadens-Frame
          ctx.drawImage(dmgImg, -10 + ox, -10 + oy, 340, 220);
        } else {
          // Linke Konsole / Waffen-Panel (x: 0..115)
          if (leftDamaged) {
            ctx.drawImage(dmgImg, 0, 0, 115, 220, -10 + ox, -10 + oy, 115, 220);
            // Elektrische Funken auf der linken Konsole
            if (Math.sin(frame * 0.35) > 0.8) {
              ctx.fillStyle = '#ffff66';
              ctx.fillRect(45 + ox + (frame % 15), 155 + oy + ((frame * 3) % 20), 2, 2);
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(44 + ox + (frame % 15), 154 + oy + ((frame * 3) % 20), 1, 1);
            }
          }
          // Rechte Konsole / Triebwerks-Panel (x: 225..340)
          if (rightDamaged) {
            ctx.drawImage(dmgImg, 225, 0, 115, 220, -10 + ox + 225, -10 + oy, 115, 220);
            // Elektrische Funken auf der rechten Konsole
            if (Math.cos(frame * 0.42) > 0.82) {
              ctx.fillStyle = '#66ffff';
              ctx.fillRect(255 + ox + (frame % 12), 160 + oy + ((frame * 2) % 18), 2, 2);
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(256 + ox + (frame % 12), 159 + oy + ((frame * 2) % 18), 1, 1);
            }
          }
          // Kanzel / Frontglas-Risse (x: 95..245, y: 0..115)
          if (canopyDamaged) {
            ctx.drawImage(dmgImg, 95, 0, 150, 115, -10 + ox + 95, -10 + oy, 150, 115);
          }
        }
      }

      // RGBA Weapon-Fire Lightmap Overlay (CockpitFlash.cs style: illuminates struts & canopy when firing!)
      if (SW.Player.gunFlashTimer > 0) {
        const gunImg = SW.Player.gunFlashSide === 0 ? ck.leftGun : ck.rightGun;
        if (gunImg && gunImg._ready) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, SW.Player.gunFlashTimer / 4.5);
          ctx.drawImage(gunImg, -10 + ox, -10 + oy, 340, 220);
          ctx.restore();
        }
      }

      // Dynamic Real-Time Cockpit Lighting (Weapon Fire, Nearby Explosions, Passing Plasma & Shield Impacts)
      this.renderCockpitDynamicLighting(ctx, ox, oy, cls);

      // LEFT VDU (Wing Commander 3 Style: In-Flight Squadron Comms & Portrait on the LEFT! x=22..94, y=138..194)
      this.renderWingnutCommsVDU(ctx, 22 + ox, 138 + oy, 72, 55);

      // Center Radar (Spherical WC1 Radar: cx=160, cy=175, r=20)
      this.renderWingnutCenterRadar(ctx, 160 + ox, 175 + oy, 20);

      // RIGHT VDU (Target Schematic, Shields, Speed & Ship Systems on the RIGHT! x=226..298, y=138..194)
      this.renderWingnutLeftVDU(ctx, 226 + ox, 138 + oy, 72, 55);

      // WC3 Upper-Left Comms Video Pop-Up Monitor (only while an active transmission is speaking!)
      this.renderWC3LeftVideoComm(ctx, 8 + ox, 11 + oy);

      // Animated Pilot Hand & Joystick + Throttle (Howard Day JoystickThrottle.cs logic)
      this.renderPilotControls(ctx, ox, oy);

      // 1990s VGA Pixel-Dither & CRT Scanline Beauty Filter over Cockpit Instruments
      this.renderCockpitPixelFilter(ctx, ox, oy, cls);

      // Top subtle tactical status bar (Ship Class, Graphics Mode [G], Cockpit Switch [B])
      const isHermes = cls.cockpitKey === 'hermes';
      ctx.fillStyle = isHermes ? 'rgba(6, 18, 32, 0.80)' : 'rgba(6, 14, 22, 0.72)';
      ctx.fillRect(62, 0, 196, 9);
      ctx.fillStyle = isHermes ? '#00f0ff' : '#57c8df';
      ctx.font = '4px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(cls.codename + ' [' + (cls.cockpitKey || 'hornet').toUpperCase() + ']  [B:SCHIFF] [G:' +
        (SW.Sprites.graphicsMode === 'amiga_vga' ? 'AMIGA/2' : 'HD-80') + '] [1-4:FUNK LINKS]', SW.CX, 6);
      ctx.textAlign = 'left';
      return;
    }

    // Classic 1990 Procedural Cockpit Frame v2 (Fallback & Classic Mode)
    if (SW.Sprites.cockpitFrame) {
      ctx.drawImage(SW.Sprites.cockpitFrame, 0, 0);
    } else {
      ctx.fillStyle = '#536777';
      ctx.fillRect(0, 0, SW.W, 16);
      ctx.fillRect(0, 0, 5, SW.H-40);
      ctx.fillRect(SW.W-5, 0, 5, SW.H-40);
      ctx.fillRect(0, 150, SW.W, 50);
      ctx.fillStyle = '#111c25';
      ctx.fillRect(3, 48, 46, 99);
      ctx.fillRect(SW.W-49, 48, 46, 99);
    }

    // Shield and speed readings live in the lower-left multifunction display.
    const front = Math.max(0, Math.min(1, SW.Player.frontShield / SW.SHIELD_MAX));
    const rear = Math.max(0, Math.min(1, SW.Player.rearShield / SW.SHIELD_MAX));
    const speed = Math.max(0, Math.min(1,
      (SW.Player.speed - SW.FORWARD_BASE) / (SW.FORWARD_BURN - SW.FORWARD_BASE)));
    ctx.font = '4px monospace';
    ctx.fillStyle = '#a9bbc5';
    ctx.fillText('F', 80, 163); ctx.fillText('R', 80, 170);
    ctx.fillStyle = '#26343d'; ctx.fillRect(89, 162, 30, 3); ctx.fillRect(89, 169, 30, 3);
    ctx.fillStyle = front > 0.3 ? '#59d17d' : '#f05050'; ctx.fillRect(89, 162, 30 * front, 3);
    ctx.fillStyle = rear > 0.3 ? '#59d17d' : '#f05050'; ctx.fillRect(89, 169, 30 * rear, 3);
    ctx.fillStyle = '#a9bbc5'; ctx.fillText('V', 80, 181);
    ctx.fillStyle = '#26343d'; ctx.fillRect(89, 178, 30, 3);
    ctx.fillStyle = SW.Player.burning ? '#ff9b3d' : '#55bed5';
    ctx.fillRect(89, 178, 30 * speed, 3);
    ctx.fillStyle = SW.Player.burning ? '#ff9b3d' : '#dce7ed';
    ctx.fillText(String(Math.round(SW.Player.speed * 12)).padStart(3, '0') + 'KT', 80, 188);

    // Radar is the round center instrument, with contacts relative to the player.
    ctx.strokeStyle = '#45c97a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(160, 173, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(146, 173); ctx.lineTo(174, 173);
    ctx.moveTo(160, 159); ctx.lineTo(160, 187); ctx.stroke();
    ctx.fillStyle = '#45c97a'; ctx.fillRect(159, 172, 2, 2);
    for (const enemy of SW.Enemies.list) {
      if (SW.Player.systems.sensors<=0) break;
      if (!enemy.alive || enemy.z <= SW.Player.z) continue;
      const dx = Math.max(-12, Math.min(12, (enemy.x - SW.Player.x) * 0.08));
      const dy = Math.max(-12, Math.min(12, (enemy.y - SW.Player.y) * 0.08));
      ctx.fillStyle = enemy.civilian ? '#45c97a' : '#ff5b58';
      ctx.fillRect(Math.round(160 + dx), Math.round(173 + dy), 2, 2);
    }
    if (SW.Player.systems.sensors > 0 && SW.Wingman && SW.Wingman.alive && SW.Wingman.z > SW.Player.z) {
      const wx = Math.max(-12, Math.min(12, (SW.Wingman.x - SW.Player.x) * 0.08));
      const wy = Math.max(-12, Math.min(12, (SW.Wingman.y - SW.Player.y) * 0.08));
      ctx.fillStyle = '#4488ff';
      ctx.fillRect(Math.round(160 + wx), Math.round(173 + wy), 2, 2);
    }

    // The right instrument reports only a real, live contact ahead of the ship.
    const target = SW.Player.systems.sensors<=0 ? null : SW.Enemies.list
      .filter(enemy => enemy.alive && enemy.z > SW.Player.z)
      .sort((a, b) => (a.z - SW.Player.z) - (b.z - SW.Player.z))[0];
    ctx.fillStyle = SW.Player.systems.sensors>50 ? '#57c8df' : '#e49b4b';
    ctx.font = '5px monospace';
    if (SW.Player.systems.sensors<=0) {
      ctx.fillText('SENSOREN AUS', SW.W - 59, 69);
    } else if (target) {
      const targetInfo = SW.ShipRegistry[target.shipId];
      const targetName = target.civilian ? 'SIEDLER' : (targetInfo ? target.shipId : 'KONTAKT').toUpperCase().substring(0, 11);
      const dx = target.x - SW.Player.x, dy = target.y - SW.Player.y, dz = target.z - SW.Player.z;
      const range = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));
      const maxHp = targetInfo ? targetInfo.hp : Math.max(1, target.hp);
      const health = Math.max(0, Math.min(1, target.hp / maxHp));
      ctx.fillStyle = target.civilian ? '#65d481' : (SW.Player.systems.sensors>50 ? '#57c8df' : '#e49b4b');
      ctx.fillText(targetName, SW.W - 59, 66);
      ctx.fillText('RNG ' + String(range).padStart(3, '0'), SW.W - 59, 74);
      ctx.fillStyle = '#26343d'; ctx.fillRect(SW.W - 59, 78, 50, 4);
      ctx.fillStyle = health > 0.5 ? '#65d481' : '#f0a64a';
      ctx.fillRect(SW.W - 59, 78, 50 * health, 4);
    } else {
      ctx.fillText('KEIN KONTAKT', SW.W - 59, 69);
      ctx.fillStyle = '#26343d'; ctx.fillRect(SW.W - 59, 78, 50, 4);
    }

    // Weapon state and score sit inside the lower-right multifunction display.
    const slots = SW.Input.getLaserSlots();
    ctx.fillStyle = '#9bb0bd'; ctx.font = '4px monospace';
    ctx.fillText('L' + (SW.Player.systems.weapons>0?slots:0), 260, 177);
    ctx.fillStyle = '#0f0'; ctx.font = '5px monospace';
    ctx.fillText(String(SW.Game.score).padStart(5,'0'), 260, 186);
    ctx.font = '3px monospace'; ctx.fillStyle = '#9bb0bd';
    ctx.fillText('E'+Math.round(SW.Player.systems.engines)+' W'+Math.round(SW.Player.systems.weapons)+
      ' S'+Math.round(SW.Player.systems.shields)+' R'+Math.round(SW.Player.systems.sensors), 198, 164);
    ctx.textAlign = 'left';
  },

  renderWingnutLeftVDU(ctx, x, y, w, h) {
    // Semi-transparent CRT VDU backing
    ctx.fillStyle = 'rgba(6, 16, 22, 0.86)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#1f4d5e';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    const front = Math.max(0, Math.min(1, SW.Player.frontShield / SW.SHIELD_MAX));
    const rear = Math.max(0, Math.min(1, SW.Player.rearShield / SW.SHIELD_MAX));
    ctx.font = 'bold 4px monospace';
    ctx.fillStyle = '#57c8df';
    ctx.fillText('STATUS / ZIEL', x + 3, y + 6);

    // Shield & Speed bars
    ctx.font = '4px monospace';
    ctx.fillStyle = '#9bb0bd';
    ctx.fillText('SHD-V', x + 3, y + 13);
    ctx.fillStyle = '#1a2d38'; ctx.fillRect(x + 24, y + 10, 44, 3);
    ctx.fillStyle = front > 0.3 ? '#45c97a' : '#ff4444'; ctx.fillRect(x + 24, y + 10, Math.round(44 * front), 3);

    ctx.fillStyle = '#9bb0bd';
    ctx.fillText('SHD-H', x + 3, y + 19);
    ctx.fillStyle = '#1a2d38'; ctx.fillRect(x + 24, y + 16, 44, 3);
    ctx.fillStyle = rear > 0.3 ? '#45c97a' : '#ff4444'; ctx.fillRect(x + 24, y + 16, Math.round(44 * rear), 3);

    // Speed + Afterburner
    const kps = String(Math.round(SW.Player.speed * 12)).padStart(3, '0');
    ctx.fillStyle = SW.Player.burning ? '#ff9b3d' : '#65d481';
    ctx.fillText('SPD:' + kps + (SW.Player.burning ? ' [BURN]' : ' [CRS]'), x + 3, y + 26);

    // Target VDU Readout + Live Mini Wireframe/Sprite Preview
    const target = (SW.Player.systems.sensors <= 0) ? null :
      (SW.Enemies.getSelectedTarget ? SW.Enemies.getSelectedTarget() : null);
    ctx.fillStyle = '#1f4d5e';
    ctx.fillRect(x + 2, y + 29, w - 4, 1);

    if (SW.Player.systems.sensors <= 0) {
      ctx.fillStyle = '#ff5555';
      ctx.fillText('SENSOREN AUS', x + 3, y + 38);
    } else if (target) {
      const targetInfo = SW.ShipRegistry[target.shipId];
      const name = target.civilian ? 'SIEDLER' : (targetInfo ? target.shipId : 'KONTAKT').toUpperCase().substring(0, 10);
      const dist = Math.round(Math.hypot(target.x - SW.Player.x, target.y - SW.Player.y, target.z - SW.Player.z));
      const maxHp = target.maxHp || (targetInfo ? targetInfo.hp : 50);
      const hpPct = Math.max(0, Math.min(1, target.hp / maxHp));
      ctx.fillStyle = target.civilian ? '#45c97a' : '#ffaa33';
      ctx.fillText('ZIEL: ' + name, x + 3, y + 36);
      ctx.fillStyle = '#dce7ed';
      ctx.fillText('DIST: ' + dist + 'm', x + 3, y + 43);
      ctx.fillStyle = '#1a2d38'; ctx.fillRect(x + 3, y + 46, 42, 3);
      ctx.fillStyle = hpPct > 0.4 ? '#45c97a' : '#ff4444'; ctx.fillRect(x + 3, y + 46, Math.round(42 * hpPct), 3);
      // Draw mini schematic of target on right side of Left VDU
      const atlasKey = SW.Sprites.mapShipIdToAtlas(target.shipId, target.civilian);
      SW.Sprites.drawMultiAngle(ctx, atlasKey, x + w - 13, y + 41, 0.7, 0, 0, -10, target.heading || 0, 0, SW.Sprites.enemy, 20);
    } else {
      ctx.fillStyle = '#627984';
      ctx.fillText('KEIN ZIEL [Y]', x + 3, y + 38);
      ctx.fillStyle = '#57c8df';
      ctx.fillText('PKT: ' + String(SW.Game.score).padStart(5, '0'), x + 3, y + 46);
    }
    ctx.fillStyle = '#8297a8';
    ctx.font = '3px monospace';
    ctx.fillText('E' + Math.round(SW.Player.systems.engines) + ' W' + Math.round(SW.Player.systems.weapons) +
      ' S' + Math.round(SW.Player.systems.shields) + ' R' + Math.round(SW.Player.systems.sensors), x + 3, y + 53);
  },

  renderWingnutCenterRadar(ctx, rx, ry, rr) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(rx, ry, rr, 0, Math.PI * 2);
    ctx.fillStyle = '#051014';
    ctx.fill();
    ctx.strokeStyle = '#38b86e';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Inner cross & range ring
    ctx.strokeStyle = '#17472b';
    ctx.beginPath();
    ctx.arc(rx, ry, Math.round(rr * 0.6), 0, Math.PI * 2);
    ctx.moveTo(rx - rr, ry); ctx.lineTo(rx + rr, ry);
    ctx.moveTo(rx, ry - rr); ctx.lineTo(rx, ry + rr);
    ctx.stroke();

    const P = SW.Player;
    if (P.systems.sensors > 0) {
      // Carrier blip (cyan bar)
      if (SW.Carrier && SW.Carrier.visible) {
        const cx = rx + Math.max(-rr + 3, Math.min(rr - 3, (SW.Carrier.x - P.x) * 0.06));
        const cy = ry + Math.max(-rr + 3, Math.min(rr - 3, (SW.Carrier.y - P.y) * 0.06));
        ctx.fillStyle = '#00ddff';
        ctx.fillRect(Math.round(cx) - 2, Math.round(cy) - 1, 4, 2);
      }
      // Enemy blips
      for (const e of SW.Enemies.list) {
        if (!e.alive) continue;
        const bx = rx + Math.max(-rr + 2, Math.min(rr - 2, (e.x - P.x) * 0.08));
        const by = ry + Math.max(-rr + 2, Math.min(rr - 2, (e.y - P.y) * 0.08));
        ctx.fillStyle = e.civilian ? '#44ff88' : (e.z > P.z ? '#ff3333' : '#ffaa00');
        ctx.fillRect(Math.round(bx) - 1, Math.round(by) - 1, 2, 2);
      }
      // Wingman blip
      if (SW.Wingman && SW.Wingman.alive) {
        const wx = rx + Math.max(-rr + 2, Math.min(rr - 2, (SW.Wingman.x - P.x) * 0.08));
        const wy = ry + Math.max(-rr + 2, Math.min(rr - 2, (SW.Wingman.y - P.y) * 0.08));
        ctx.fillStyle = '#4488ff';
        ctx.fillRect(Math.round(wx) - 1, Math.round(wy) - 1, 2, 2);
      }
    }
    // Center crosshair blip
    ctx.fillStyle = '#45c97a';
    ctx.fillRect(rx - 1, ry - 1, 2, 2);
    ctx.restore();
  },

  renderWingnutCommsVDU(ctx, x, y, w, h) {
    // Right VDU: In-Flight Squadron Comms & Live Animated NPC Portrait!
    ctx.fillStyle = 'rgba(6, 16, 22, 0.88)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#255c42';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    const latestMsg = SW.Comm.messages.length ? SW.Comm.messages[SW.Comm.messages.length - 1] : null;
    ctx.font = 'bold 4px monospace';
    ctx.fillStyle = '#8bdc74';
    ctx.fillText('VDU KOMM / STAFFEL', x + 3, y + 6);

    if (latestMsg) {
      const colonIdx = latestMsg.text.indexOf(':');
      const speaker = colonIdx > 0 ? latestMsg.text.substring(0, colonIdx).trim() : 'FUNK';
      const body = colonIdx > 0 ? latestMsg.text.substring(colonIdx + 1).trim() : latestMsg.text;
      const faceId = SW.NPC ? SW.NPC.resolve(speaker) : null;

      // Draw Live Animated Talking NPC Portrait in left box of Right VDU (20x24)
      ctx.fillStyle = '#0a1e18';
      ctx.fillRect(x + 3, y + 9, 20, 22);
      ctx.strokeStyle = latestMsg.channel === 'squadron' ? '#8bdc74' : '#57c8df';
      ctx.strokeRect(x + 3, y + 9, 20, 22);
      if (faceId && SW.NPC && SW.NPC.registry[faceId]) {
        SW.NPC.drawFace(ctx, faceId, x + 13, y + 20, 14, { animated: true, frame: SW.Comm.radioTimer });
      } else {
        ctx.fillStyle = '#57c8df';
        ctx.fillRect(x + 10, y + 17, 6, 6);
      }
      // CRT Scanlines over portrait
      ctx.fillStyle = 'rgba(0, 255, 140, 0.12)';
      for (let sy = y + 10; sy < y + 30; sy += 2) ctx.fillRect(x + 4, sy, 18, 1);

      // Speaker & wrapped dialogue text next to portrait
      ctx.fillStyle = latestMsg.channel === 'squadron' ? '#8bdc74' : '#57c8df';
      ctx.font = 'bold 4px monospace';
      ctx.fillText(speaker.substring(0, 11), x + 26, y + 13);

      ctx.fillStyle = '#dce7ed';
      ctx.font = '4px monospace';
      const words = body.split(/\s+/), lines = [];
      let line = '';
      for (const word of words) {
        if ((line + word).length > 11 && line) { lines.push(line.trim()); line = word + ' '; }
        else line += word + ' ';
      }
      if (line) lines.push(line.trim());
      for (let i = 0; i < Math.min(4, lines.length); i++) {
        ctx.fillText(lines[i], x + 26, y + 19 + i * 5);
      }
    } else {
      ctx.fillStyle = '#57c8df';
      ctx.font = '4px monospace';
      ctx.fillText('KANAL BEREIT', x + 4, y + 16);
      if (SW.Wingman && SW.Wingman.active) {
        ctx.fillStyle = '#8bdc74';
        ctx.fillText('SECHS: MODUS ' + (SW.Wingman.orderMode || 'form').toUpperCase(), x + 4, y + 24);
      }
    }

    // Bottom Interactive Squadron Orders Strip on the Left VDU (WC3 style)!
    ctx.fillStyle = '#18382c';
    ctx.fillRect(x + 2, y + 34, w - 4, 1);
    ctx.font = '3.5px monospace';
    ctx.fillStyle = '#8bdc74';
    ctx.fillText('[1] ANGRIFF  [2] FORM', x + 3, y + 41);
    ctx.fillStyle = '#57c8df';
    ctx.fillText('[3] DECKUNG  [4] FUNK', x + 3, y + 47);
    ctx.fillStyle = '#ffcc44';
    ctx.fillText(SW.Carrier && SW.Carrier.canDock && SW.Carrier.canDock() ? '[L] TRÄGER-LANDUNG!' : '[Y] ZIELWECHSEL', x + 3, y + 53);
  },

  // Wing Commander 3 Style Upper-Left Comms Video Pop-Up Monitor (shows live talking pilot on the left)
  renderWC3LeftVideoComm(ctx, x, y) {
    if (!SW.Comm || !SW.Comm.showFace || SW.Comm.faceTimer <= 0 || !SW.Comm.messages.length) return;
    const latestMsg = SW.Comm.messages[SW.Comm.messages.length - 1];
    if (!latestMsg) return;
    const colonIdx = latestMsg.text.indexOf(':');
    const speaker = colonIdx > 0 ? latestMsg.text.substring(0, colonIdx).trim() : 'FUNK';
    const body = colonIdx > 0 ? latestMsg.text.substring(colonIdx + 1).trim() : latestMsg.text;
    const faceId = SW.NPC ? SW.NPC.resolve(speaker) : null;
    const w = 104, h = 34;

    ctx.save();
    // Dithered CRT Monitor Frame on Upper-Left Canopy
    ctx.fillStyle = 'rgba(4, 12, 18, 0.88)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = latestMsg.channel === 'squadron' ? '#65d481' : '#44bbff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#1d3240';
    ctx.fillRect(x + 1, y + 1, w - 2, 5);
    ctx.fillStyle = latestMsg.channel === 'squadron' ? '#8bdc74' : '#7ae2ff';
    ctx.font = 'bold 3.5px monospace';
    ctx.fillText('◀ WC3-KOMM // ' + speaker.substring(0, 14), x + 3, y + 5);

    // Talking Portrait Box on the Left (24x24)
    ctx.fillStyle = '#071612';
    ctx.fillRect(x + 3, y + 8, 22, 23);
    ctx.strokeStyle = '#285e48';
    ctx.strokeRect(x + 3, y + 8, 22, 23);
    if (faceId && SW.NPC && SW.NPC.registry[faceId]) {
      SW.NPC.drawFace(ctx, faceId, x + 14, y + 20, 14, { animated: true, frame: SW.Comm.radioTimer });
    } else {
      // Static / Drone Eye for AI/Unknown
      ctx.fillStyle = '#00eeff';
      ctx.fillRect(x + 11, y + 16, 6, 6);
    }
    // CRT Scanlines & Bayer Pixel Filter over Video Feed
    ctx.fillStyle = 'rgba(0, 255, 160, 0.14)';
    for (let sy = y + 8; sy < y + 31; sy += 2) ctx.fillRect(x + 4, sy, 20, 1);

    // Compact wrapped transmission text
    ctx.fillStyle = '#e4f2f8';
    ctx.font = '3.8px monospace';
    const words = body.split(/\s+/), lines = [];
    let line = '';
    for (const word of words) {
      if ((line + word).length > 19 && line) { lines.push(line.trim()); line = word + ' '; }
      else line += word + ' ';
    }
    if (line) lines.push(line.trim());
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      ctx.fillText(lines[i], x + 28, y + 14 + i * 6);
    }
    ctx.restore();
  },

  // 1990s VGA Pixel-Dither, Bezel Rivets & CRT Scanline Beauty Pass for Cockpit UI
  renderCockpitPixelFilter(ctx, ox, oy, cls) {
    ctx.save();
    const isHermes = cls && cls.cockpitKey === 'hermes';
    // 1. Subtle CRT Scanlines & Phosphor Glow over Left VDU, Right VDU & Center Radar
    ctx.fillStyle = isHermes ? 'rgba(0, 240, 255, 0.07)' : 'rgba(80, 255, 150, 0.06)';
    for (let sy = 139 + oy; sy < 193 + oy; sy += 2) {
      ctx.fillRect(23 + ox, sy, 70, 1);   // Left Comms VDU scanlines
      ctx.fillRect(227 + ox, sy, 70, 1);  // Right Target VDU scanlines
    }
    for (let sy = 156 + oy; sy < 194 + oy; sy += 2) {
      ctx.fillRect(142 + ox, sy, 36, 1);  // Center Radar scanlines
    }

    // 2. Ordered Pixel-Dither Bezel Shadowing & Corner Rivets on Left/Right VDUs
    const vduBoxes = [[22 + ox, 138 + oy, 72, 55], [226 + ox, 138 + oy, 72, 55]];
    for (const [vx, vy, vw, vh] of vduBoxes) {
      // Inner top/left CRT shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.fillRect(vx + 1, vy + 1, vw - 2, 1);
      ctx.fillRect(vx + 1, vy + 1, 1, vh - 2);
      // Outer metallic highlight & corner rivets
      ctx.fillStyle = isHermes ? '#00d8ff' : '#6e8496';
      ctx.fillRect(vx - 1, vy - 1, 2, 2);
      ctx.fillRect(vx + vw - 1, vy - 1, 2, 2);
      ctx.fillRect(vx - 1, vy + vh - 1, 2, 2);
      ctx.fillRect(vx + vw - 1, vy + vh - 1, 2, 2);
    }

    // 3. Canopy Glass Corner Dither / Tint (gives real 90s VGA cockpit glass depth)
    ctx.fillStyle = isHermes ? 'rgba(0, 210, 255, 0.04)' : 'rgba(140, 190, 230, 0.03)';
    for (let dy = 12; dy < 44; dy += 4) {
      ctx.fillRect(14 + (dy % 8), dy, 2, 1);
      ctx.fillRect(SW.W - 18 - (dy % 8), dy, 2, 1);
    }
    ctx.restore();
  },

  // Real-time Dynamic Cockpit Lighting: Weapon Muzzle Flash, Nearby Explosions, Passing Enemy Plasma & Shield Hits
  renderCockpitDynamicLighting(ctx, ox, oy, cls) {
    if (!ctx.save || !SW.Player) return;
    const P = SW.Player;
    const ckKey = (cls && cls.cockpitKey) || 'hornet';
    const isKilrathi = ['dralthi', 'salthi', 'krant', 'strakha'].includes(ckKey);
    const isHermes = ckKey === 'hermes';
    const vfx = (SW.Sprites && SW.Sprites.vfx) || {};

    ctx.save();
    // 1. Own Weapon Fire Rim & Dashboard Glare
    if (P.gunFlashTimer > 0) {
      const fAlpha = (P.gunFlashTimer / 5) * 0.24;
      const fireCol = isHermes ? '#00e5ff' : (isKilrathi ? '#44ff66' : '#ff5522');
      const sideX = P.gunFlashSide === 0 ? (18 + ox) : (SW.W - 98 + ox);
      ctx.fillStyle = fireCol;
      ctx.globalAlpha = fAlpha;
      // Directional dashboard & strut wash on firing side
      ctx.fillRect(sideX, 118 + oy, 80, 82);
      ctx.fillRect(P.gunFlashSide === 0 ? 0 : SW.W - 36, 18, 36, 110);
      if (vfx.muzzleFlash && vfx.muzzleFlash._ready && ctx.drawImage) {
        ctx.globalAlpha = Math.min(0.85, P.gunFlashTimer / 4);
        const mx = P.gunFlashSide === 0 ? (28 + ox) : (SW.W - 60 + ox);
        ctx.drawImage(vfx.muzzleFlash, mx, 108 + oy, 32, 32);
      }
    }

    // 2. Nearby Explosion Bloom on Cockpit Frame & Canopy
    if (SW.Explosions && SW.Explosions.list && SW.Explosions.list.length) {
      for (const ex of SW.Explosions.list) {
        const dz = ex.z - P.z;
        if (dz <= 0 || dz > 260) continue;
        const dist = Math.hypot(ex.x - P.x, ex.y - P.y, dz);
        if (dist < 260) {
          const life = 1 - (ex.frame / (SW.EXPLOSION_FRAMES || 20));
          const intensity = (1 - dist / 260) * life * 0.32;
          if (intensity > 0.02) {
            ctx.fillStyle = '#ff8822';
            ctx.globalAlpha = intensity;
            const dirX = ex.x - P.x;
            if (dirX < -15) ctx.fillRect(0, 0, 120, SW.H);
            else if (dirX > 15) ctx.fillRect(SW.W - 120, 0, 120, SW.H);
            else ctx.fillRect(0, 0, SW.W, SW.H);
          }
        }
      }
    }

    // 3. Passing Enemy Plasma Bolts Illuminating Canopy Struts
    if (SW.Projectiles && SW.Projectiles.list && SW.Projectiles.list.length) {
      let nearestEnemyBolt = 999;
      let boltSide = 0;
      for (const pr of SW.Projectiles.list) {
        if (pr.friendly) continue;
        const d = Math.hypot(pr.x - P.x, pr.y - P.y, pr.z - P.z);
        if (d < nearestEnemyBolt) {
          nearestEnemyBolt = d;
          boltSide = pr.x - P.x;
        }
      }
      if (nearestEnemyBolt < 75) {
        ctx.fillStyle = '#33ff66';
        ctx.globalAlpha = (1 - nearestEnemyBolt / 75) * 0.22;
        ctx.fillRect(boltSide < 0 ? 0 : SW.W - 110, 16, 110, SW.H - 16);
      }
    }

    // 4. Shield Impact Energy Ripple on Canopy Glass (WCUnity ImpactShield_01.png)
    const frame = (SW.Game && SW.Game.frame) || 0;
    const hitAge = Math.min(frame - (P.frontLastHit || -999), frame - (P.rearLastHit || -999));
    if (hitAge >= 0 && hitAge < 14) {
      const hitAlpha = (1 - hitAge / 14) * 0.65;
      ctx.globalAlpha = hitAlpha;
      if (vfx.shieldImpact && vfx.shieldImpact._ready && ctx.drawImage) {
        ctx.drawImage(vfx.shieldImpact, SW.CX - 64 + ox, SW.CY - 58 + oy, 128, 96);
      }
      ctx.fillStyle = '#00ddff';
      ctx.globalAlpha = hitAlpha * 0.25;
      ctx.fillRect(0, 0, SW.W, 138);
    }
    ctx.restore();
  },

  renderPilotControls(ctx, ox, oy) {
    if (!SW.Sprites || !SW.Sprites.cockpits) return;
    const cls = (SW.Player && SW.Player.getShipClass) ? SW.Player.getShipClass() : { cockpitKey: 'hornet' };
    const isKilrathi = ['dralthi', 'salthi', 'krant', 'strakha'].includes(cls.cockpitKey);
    const isFiring = SW.Player && SW.Player.gunFlashTimer > 0;
    const baseJoy = isKilrathi ? (SW.Sprites.cockpits.kilrathiJoystick || SW.Sprites.cockpits.joystick) : SW.Sprites.cockpits.joystick;
    const fireJoy = isKilrathi ? (SW.Sprites.cockpits.kilrathiJoystickFire || baseJoy) : (SW.Sprites.cockpits.joystickFire || baseJoy);
    const joySheet = isFiring ? fireJoy : baseJoy;
    const thrSheet = SW.Sprites.cockpits.throttle;

    // Throttle hand on lower-left dash (8x4 grid of 64x64 cells in 512x256 sheet)
    if (thrSheet && thrSheet._ready) {
      const spdNorm = Math.max(0, Math.min(0.99, (SW.Player.speed - 1.5) / 4.5));
      const tFrame = Math.min(31, Math.floor(spdNorm * 31));
      const tc = tFrame % 8, tr = Math.floor(tFrame / 8);
      ctx.drawImage(thrSheet, tc * 64, tr * 64, 64, 64, 92 + ox, 152 + oy, 48, 48);
    }

    // Joystick + Pilot Hand in lower-center (8x8 grid of 64x64 cells in 512x512 sheet)
    if (joySheet && joySheet._ready) {
      const sx = SW.Player.steerX !== undefined ? SW.Player.steerX : 0.5;
      const sy = SW.Player.steerY !== undefined ? SW.Player.steerY : 0.5;
      const jRow = Math.max(0, Math.min(7, Math.floor((1 - sy) * 7)));
      const jCol = Math.max(0, Math.min(7, Math.floor(sx * 7)));
      ctx.drawImage(joySheet, jCol * 64, jRow * 64, 64, 64, 178 + ox, 148 + oy, 54, 54);
    }
  },

  // WC1-Zielerfassungs-Klammer + Vorhaltepunkt (Lead Indicator) für das nächste Ziel
  renderTargetBracket(ctx) {
    if (!SW.Player || SW.Player.systems.sensors <= 0) return;
    const target = (SW.Enemies.getSelectedTarget ? SW.Enemies.getSelectedTarget() : null) ||
      SW.Enemies.list
        .filter(e => e.alive && e.z > SW.Player.z + 5 && e._screenPos)
        .sort((a, b) => (a.z - SW.Player.z) - (b.z - SW.Player.z))[0];
    if (!target || !target._screenPos) return;
    const { sx, sy } = target._screenPos;
    const sz = Math.max(7, Math.min(22, (target._screenSize || 14) * 0.7));
    const col = target.civilian ? '#44ff88' : '#ffaa00';
    ctx.save();
    const isLocked = Math.hypot(sx - SW.CX, sy - SW.CY) < 28 && (target.z - SW.Player.z) < 420;
    const bracketImg = SW.Sprites && SW.Sprites.vfx && (isLocked ? SW.Sprites.vfx.bracketLock : SW.Sprites.vfx.bracketDefault);
    if (bracketImg && bracketImg._ready && SW.Sprites.graphicsMode !== 'classic_1990' && ctx.drawImage && !target.civilian) {
      ctx.drawImage(bracketImg, Math.round(sx - sz), Math.round(sy - sz), Math.round(sz * 2), Math.round(sz * 2));
    } else {
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      const c = Math.max(3, Math.round(sz * 0.35));
      // 4 Eck-Klammern im Stil von Wing Commander 1990
      ctx.beginPath();
      ctx.moveTo(sx - sz, sy - sz + c); ctx.lineTo(sx - sz, sy - sz); ctx.lineTo(sx - sz + c, sy - sz);
      ctx.moveTo(sx + sz - c, sy - sz); ctx.lineTo(sx + sz, sy - sz); ctx.lineTo(sx + sz, sy - sz + c);
      ctx.moveTo(sx - sz, sy + sz - c); ctx.lineTo(sx - sz, sy + sz); ctx.lineTo(sx - sz + c, sy + sz);
      ctx.moveTo(sx + sz - c, sy + sz); ctx.lineTo(sx + sz, sy + sz); ctx.lineTo(sx + sz, sy + sz - c);
      ctx.stroke();
    }
    // Distanz- & Zivil-Warnung unter der Klammer
    const dz = Math.max(1, target.z - SW.Player.z);
    ctx.fillStyle = col;
    ctx.font = '4px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(target.civilian ? 'ZIVIL [KEIN FEUER]' : ('D:' + Math.round(dz)), sx, sy + sz + 5);
    // Vorhaltepunkt (Lead Pip) für bewegte Feindziele
    if (!target.civilian && SW.Engine.view.mode !== 'topdown') {
      const tFlight = Math.min(45, dz / (SW.LASER_SPEED || 12));
      const leadX = target.x + (target._vx || 0) * tFlight;
      const leadY = target.y + (target._vy || 0) * tFlight;
      const lp = SW.Engine.project(leadX, leadY, target.z);
      if (lp && lp.sx > 10 && lp.sx < SW.W - 10 && lp.sy > 10 && lp.sy < SW.H - 45) {
        ctx.strokeStyle = 'rgba(255, 80, 80, 0.75)';
        ctx.beginPath();
        ctx.arc(lp.sx, lp.sy, 2.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  },

  // Mini-HUD für Chase-Cam + Top-Down (ohne Cockpit-Frame)
  renderMiniHud(ctx) {
    ctx.fillStyle='rgba(10,10,16,0.75)';
    ctx.fillRect(0,0,SW.W,14);              // Balken oben
    ctx.fillRect(0,SW.H-12,SW.W,12);        // Balken unten
    // IM RAUM: Geschwindigkeit + Nachbrenner-Indikator
    ctx.fillStyle = SW.Player.burning ? '#ff8800' : '#0f0';
    ctx.font = '6px monospace';
    ctx.fillText('V:' + Math.round(SW.Player.speed * 12) + (SW.Player.burning ? ' [AB]' : ''), SW.W - 58, 10);
    ctx.fillStyle='#14141a';
    ctx.fillRect(2,16,48,24);               // Schild-Panel
    ctx.fillRect(SW.W-50,16,48,24);         // Score-Panel
    ctx.fillStyle='#666'; ctx.font='5px monospace';
    ctx.fillText('FRONT',6,24);
    const fw=(SW.Player.frontShield/SW.SHIELD_MAX)*17;
    ctx.fillStyle='#222'; ctx.fillRect(30,20,17,5);
    ctx.fillStyle=SW.Player.frontShield>30?'#0f0':'#f00';
    ctx.fillRect(30,20,fw,5);
    ctx.fillStyle='#666'; ctx.fillText('REAR',6,36);
    const rw=(SW.Player.rearShield/SW.SHIELD_MAX)*17;
    ctx.fillStyle='#222'; ctx.fillRect(30,32,17,5);
    ctx.fillStyle=SW.Player.rearShield>30?'#0f0':'#f00';
    ctx.fillRect(30,32,rw,5);
    ctx.fillStyle='#0f0'; ctx.font='6px monospace';
    ctx.fillText('SCORE',SW.W-46,26);
    ctx.fillStyle='#fff'; ctx.font='8px monospace';
    ctx.fillText(String(SW.Game.score).padStart(5,'0'),SW.W-46,37);
    // Radar-Kreis (in diesem Modus fehlt er im Frame)
    ctx.fillStyle='rgba(0,20,10,0.7)';
    ctx.beginPath(); ctx.arc(26,125,15,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#0f0'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(26,125,15,0,Math.PI*2); ctx.stroke();
    const slots=SW.Input.getLaserSlots();
    ctx.fillStyle='#0f0'; ctx.font='6px monospace'; ctx.textAlign='center';
    ctx.fillText('LASER:'+slots+'   [V] '+SW.Engine.viewName(),SW.CX,SW.H-3);
    ctx.textAlign='left';
  },

  renderRadar(ctx) {
    if (this.isWingnutCockpitActive && this.isWingnutCockpitActive() &&
        SW.Engine && SW.Engine.view && SW.Engine.view.mode === 'cockpit') {
      return; // Center radar rendered directly inside Wingnut cockpit!
    }
    const rx=26, ry=125, rr=15;
    const P=SW.Player;
    // Blips (der Kreis ist im Frame) — IM RAUM: RELATIV zum Spieler
    ctx.fillStyle='#fff'; ctx.fillRect(rx-1,ry-1,2,2);
    if (SW.Player.systems.sensors>0) {
      for (const e of SW.Enemies.list) {
        if (!e.alive) continue;
        ctx.fillStyle = e.civilian ? '#44ff88' : '#f00';
        const bx=rx+((e.x-P.x)*0.08), by=ry+((e.y-P.y)*0.08);
        if (Math.sqrt((bx-rx)*(bx-rx)+(by-ry)*(by-ry))<rr) ctx.fillRect(Math.round(bx),Math.round(by),2,2);
      }
      if (SW.Wingman && SW.Wingman.alive) {
        ctx.fillStyle = '#4488ff';
        const wx=rx+((SW.Wingman.x-P.x)*0.08), wy=ry+((SW.Wingman.y-P.y)*0.08);
        if (Math.sqrt((wx-rx)*(wx-rx)+(wy-ry)*(wy-ry))<rr) ctx.fillRect(Math.round(wx),Math.round(wy),2,2);
      }
    }
    ctx.fillStyle='#0af';
    for (const np of SW.Autopilot.navPoints) {
      if (np.z!==undefined && np.z-P.z<-100) continue;  // passiert
      const bx=rx+((np.x-P.x)*0.08), by=ry+((np.y-P.y)*0.08);
      if (Math.sqrt((bx-rx)*(bx-rx)+(by-ry)*(by-ry))<rr) ctx.fillRect(Math.round(bx)-1,Math.round(by)-1,3,3);
    }
  },

  renderSpaceMap(ctx) {
    const mx=5,my=5,mw=60,mh=40;
    const P=SW.Player;
    ctx.fillStyle='rgba(0,10,20,0.8)';ctx.fillRect(mx,my,mw,mh);
    ctx.strokeStyle='#003344';ctx.strokeRect(mx,my,mw,mh);
    // IM RAUM: alles RELATIV zum Spieler (Spieler steht in der Mitte)
    const sx=mw/400,sy=mh/300,cx=mx+mw/2,cy=my+mh/2;
    if (SW.Carrier.visible) { ctx.fillStyle='#4488aa';ctx.fillRect(cx+(SW.Carrier.x-P.x)*sx-3,cy+(SW.Carrier.y-P.y)*sy-1,6,2); }
    ctx.fillStyle='#00aaff';
    for (const np of SW.Autopilot.navPoints) {
      if (np.z!==undefined && np.z-P.z<-100) continue;
      ctx.fillRect(cx+((np.x-P.x)*sx),cy+((np.y-P.y)*sy),2,2);
    }
    if (SW.Player.systems.sensors>0) {
      for (const e of SW.Enemies.list) {
        if(!e.alive)continue;
        ctx.fillStyle = e.civilian ? '#44ff88' : '#ff0000';
        ctx.fillRect(cx+((e.x-P.x)*sx),cy+((e.y-P.y)*sy),1,1);
      }
      if (SW.Wingman && SW.Wingman.alive) {
        ctx.fillStyle='#4488ff';
        ctx.fillRect(cx+((SW.Wingman.x-P.x)*sx),cy+((SW.Wingman.y-P.y)*sy),2,2);
      }
    }
    ctx.fillStyle='#00ff00';ctx.fillRect(cx-1,cy-1,3,3);
    ctx.fillStyle='#004455';ctx.font='5px monospace';ctx.fillText('TAKTISCH',mx+2,my+mh-2);
  },

  // In-Flight Sector Jump Trigger ([J] im Cockpit / Nav-Karte): Springt direkt zum nächsten verbundenen Sektor!
  jumpToNextConnectedSector() {
    if (!SW.ArmadaMap || !SW.ArmadaMap.SECTORS) return false;
    const cur = SW.ArmadaMap.getCurrentSector ? SW.ArmadaMap.getCurrentSector() : SW.ArmadaMap.SECTORS[0];
    const links = (cur && cur.links && cur.links.length) ? cur.links : ['s2'];
    this._navLinkIdx = ((this._navLinkIdx || 0) + 1) % links.length;
    const targetId = links[this._navLinkIdx];
    const targetSec = SW.ArmadaMap.SECTORS.find(s => s.id === targetId) || SW.ArmadaMap.SECTORS[1];
    this.navMapVisible = false;
    return SW.ArmadaMap.startSectorTransit(targetSec);
  },

  // Nav-Karte (N): Taktischer Sektor-Navigationscomputer + Sprungtor-Routen (Privateer / WC1 Stil)
  renderNavMap(ctx) {
    const mx = 28, my = 20, mw = 264, mh = 112;
    const P = SW.Player || { x: 0, y: 0, z: 0, systems: { sensors: 100 } };
    const nps = (SW.Autopilot && SW.Autopilot.navPoints) || [];
    const vfx = (SW.Sprites && SW.Sprites.vfx) || {};
    const curSec = (SW.ArmadaMap && SW.ArmadaMap.getCurrentSector)
      ? SW.ArmadaMap.getCurrentSector()
      : { id: 's1', name: 'SEKTOR 7', planet: 'Station Sieben-B', faction: 'STERNENKORPS', links: ['s2', 's4', 's5'] };

    ctx.save();
    ctx.fillStyle = 'rgba(4, 14, 24, 0.92)';
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = '#38b6ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, mw, mh);

    // Top Header Bar
    ctx.fillStyle = '#0e2a44';
    ctx.fillRect(mx + 1, my + 1, mw - 2, 10);
    ctx.fillStyle = '#7ae2ff';
    ctx.font = 'bold 5px monospace';
    ctx.fillText('NAV-COMPUTER // ' + curSec.name + ' (' + curSec.planet.substring(0, 18) + ')', mx + 5, my + 8);

    // Left Sub-Panel: Local 3D Sector Radar & Nav Waypoints (x=32..168, y=33..120)
    const lx = mx + 4, ly = my + 13, lw = 136, lh = 86;
    ctx.fillStyle = '#030a12';
    ctx.fillRect(lx, ly, lw, lh);
    ctx.strokeStyle = '#1d4c70';
    ctx.strokeRect(lx, ly, lw, lh);

    const sx = lw / 420, sy = lh / 320, cx = lx + lw / 2, cy = ly + lh / 2;
    // Grid crosshairs
    ctx.strokeStyle = 'rgba(40, 110, 160, 0.25)';
    ctx.beginPath();
    ctx.moveTo(lx, cy); ctx.lineTo(lx + lw, cy);
    ctx.moveTo(cx, ly); ctx.lineTo(cx, ly + lh);
    ctx.stroke();

    // Carrier / Station Anchor
    if (SW.Carrier && SW.Carrier.visible) {
      const caX = Math.max(lx + 4, Math.min(lx + lw - 4, cx + (SW.Carrier.x - P.x) * sx));
      const caY = Math.max(ly + 4, Math.min(ly + lh - 4, cy - (SW.Carrier.z - P.z) * 0.06));
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(caX - 3, caY - 2, 6, 4);
      ctx.font = '4px monospace';
      ctx.fillText('ANKER [L]', caX + 5, caY + 2);
    }

    // Route Line through Nav Waypoints
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.45)';
    ctx.beginPath();
    for (let i = 0; i < nps.length; i++) {
      const px = Math.max(lx + 4, Math.min(lx + lw - 4, cx + ((nps[i].x || 0) - P.x) * sx));
      const py = Math.max(ly + 4, Math.min(ly + lh - 4, cy - ((nps[i].z || (i + 1) * 200) - P.z) * 0.07));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    let nextIdx = -1;
    if (SW.Autopilot && SW.Autopilot.active && SW.Autopilot.currentNavIndex > 0) nextIdx = SW.Autopilot.currentNavIndex - 1;
    else {
      for (let i = 0; i < nps.length; i++) {
        if (nps[i].z === undefined || P.z < nps[i].z + 150) { nextIdx = i; break; }
      }
    }

    for (let i = 0; i < nps.length; i++) {
      const np = nps[i];
      const px = Math.max(lx + 6, Math.min(lx + lw - 28, cx + ((np.x || 0) - P.x) * sx));
      const py = Math.max(ly + 6, Math.min(ly + lh - 6, cy - ((np.z || (i + 1) * 200) - P.z) * 0.07));
      if (vfx.navLight && vfx.navLight._ready && ctx.drawImage) {
        ctx.drawImage(vfx.navLight, Math.round(px - 5), Math.round(py - 5), 10, 10);
      } else {
        ctx.fillStyle = (i === nextIdx) ? '#ffffff' : '#00ccff';
        ctx.fillRect(px - 1, py - 1, 3, 3);
      }
      ctx.fillStyle = (i === nextIdx) ? '#ffffff' : '#66ccff';
      ctx.font = '4.2px monospace';
      let label = np.label || ('WP' + (i + 1));
      if (np.z !== undefined && np.z - P.z > 0) label += ' ' + Math.round(np.z - P.z) + 'm';
      ctx.fillText(label.substring(0, 14), px + 5, py + 2);
    }

    // Contacts (Enemies & Wingman)
    if (!P.systems || P.systems.sensors > 0) {
      for (const e of (SW.Enemies ? SW.Enemies.list : [])) {
        if (!e.alive) continue;
        const ex = Math.max(lx + 2, Math.min(lx + lw - 2, cx + (e.x - P.x) * sx));
        const ey = Math.max(ly + 2, Math.min(ly + lh - 2, cy - (e.z - P.z) * 0.07));
        ctx.fillStyle = e.civilian ? '#44ff88' : '#ff4444';
        ctx.fillRect(ex - 1, ey - 1, 2, 2);
      }
      if (SW.Wingman && SW.Wingman.alive) {
        ctx.fillStyle = '#4488ff';
        ctx.fillRect(cx + (SW.Wingman.x - P.x) * sx - 1, cy - (SW.Wingman.z - P.z) * 0.07 - 1, 2, 2);
      }
    }
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(cx - 1, cy - 1, 3, 3);

    // Right Sub-Panel: Connected Jump Gates & Sector Transit Computer (x=172..288, y=33..120)
    const rx = mx + 144, ry = my + 13, rw = 116, rh = 86;
    ctx.fillStyle = '#06121e';
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = '#1d4c70';
    ctx.strokeRect(rx, ry, rw, rh);

    ctx.fillStyle = '#ffcc55';
    ctx.font = 'bold 4.5px monospace';
    ctx.fillText('SPRUNGTORE AB ' + curSec.name.split(' ')[0] + ':', rx + 4, ry + 8);

    const links = curSec.links || ['s2', 's4'];
    links.slice(0, 4).forEach((lid, idx) => {
      const tSec = (SW.ArmadaMap && SW.ArmadaMap.SECTORS)
        ? SW.ArmadaMap.SECTORS.find(s => s.id === lid)
        : null;
      if (!tSec) return;
      const itemY = ry + 17 + idx * 12;
      ctx.fillStyle = tSec.color || '#66ccff';
      ctx.fillRect(rx + 4, itemY - 3, 3, 3);
      ctx.fillStyle = '#dce8f2';
      ctx.font = '4.2px monospace';
      ctx.fillText('▶ ' + tSec.name.split(' (')[0].substring(0, 18), rx + 10, itemY);
      ctx.fillStyle = '#7799b4';
      ctx.fillText('  ' + tSec.faction.substring(0, 16), rx + 10, itemY + 5);
    });

    // 3D Multi-Angle Ship Preview in Bottom-Right of Nav Computer
    const cls = (P.getShipClass && P.getShipClass()) || { atlasKey: 'hornet', codename: 'HORNET' };
    if (SW.Sprites && SW.Sprites.drawMultiAngle) {
      const spin = ((SW.Game && SW.Game.frame) || 0) * 0.04;
      SW.Sprites.drawMultiAngle(ctx, cls.atlasKey || 'hornet', rx + rw - 20, ry + rh - 14, 24, spin, 0.2, '#44ccff', SW.Sprites.playerShip);
    }
    ctx.fillStyle = '#65d481';
    ctx.font = '4px monospace';
    ctx.fillText('[A] AUTOPILOT ZU WP', rx + 4, ry + rh - 12);
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('[J] DIREKT-SPRUNG', rx + 4, ry + rh - 5);

    // Bottom Legend Bar
    ctx.fillStyle = '#88ccff';
    ctx.font = '4.2px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[A] AUTOPILOT  [J] NÄCHSTES SPRUNGTOR ANFLIEGEN  [K] 16-SEKTOR-KARTE & HANDEL  [N] SCHLIEßEN', mx + mw / 2, my + mh - 3);
    ctx.restore();
  },

  renderCrosshair(ctx) {
    const vfx = (SW.Sprites && SW.Sprites.vfx) || {};
    const cls = (SW.Player && SW.Player.getShipClass) ? SW.Player.getShipClass() : { cockpitKey: 'hornet' };
    const isKilrathi = ['dralthi', 'salthi', 'krant', 'strakha'].includes(cls.cockpitKey);
    const retImg = isKilrathi ? vfx.reticleDralthi : (cls.cockpitKey === 'valtar' || cls.cockpitKey === 'hermes' ? vfx.reticleValtar : vfx.reticleHornet);
    if (retImg && retImg._ready && SW.Sprites.graphicsMode !== 'classic_1990' && ctx.drawImage) {
      ctx.drawImage(retImg, Math.round(SW.Input.mouseX - 8), Math.round(SW.Input.mouseY - 8), 16, 16);
      return;
    }
    ctx.strokeStyle='#0f0';ctx.lineWidth=1;ctx.beginPath();
    ctx.moveTo(SW.Input.mouseX-5,SW.Input.mouseY);ctx.lineTo(SW.Input.mouseX+5,SW.Input.mouseY);
    ctx.moveTo(SW.Input.mouseX,SW.Input.mouseY-5);ctx.lineTo(SW.Input.mouseX,SW.Input.mouseY+5);
    ctx.stroke();
  }
};

SW.Comm = {
  messages:[],queue:[],radioTimer:0,
  clear(){this.messages=[];this.queue=[];this.radioTimer=0;this.showFace=false;this.faceTimer=0;this.lastNpc='commander';this.lastText='';},
  add(text, channel){
    const colonIdx=text.indexOf(':');
    const speaker=colonIdx>0?text.substring(0,colonIdx).trim():'';
    const squadronSpeakers=['SECHS','NEUN','ZWO','VIER','WINGMAN','WORKER-7','HERMES-KERN','REVIEWER-9'];
    const inferredChannel=squadronSpeakers.some(name=>speaker.toUpperCase()===name||speaker.toUpperCase().startsWith(name+' '))
      ?'squadron':'public';
    const ch = channel==='squadron'?'squadron':(channel==='public'?'public':inferredChannel);
    // Keep in-flight comms crisp and un-spammed: cap queue to max 2 waiting messages
    if (this.queue.length >= 2) this.queue.shift();
    this.queue.push({text,timer:210,channel:ch});
    SW.Audio.playCommBeep();
    // TTS: extract NPC name from text (e.g. "COMMANDER: ...")
    if(colonIdx>0){ const npc=text.substring(0,colonIdx); SW.TTS.speak(text.substring(colonIdx+1).trim(), npc); }
    else { SW.TTS.speak(text, 'commander'); }
    this.lastNpc = colonIdx>0?speaker:'commander';
    this.lastText = colonIdx>0?text.substring(colonIdx+1).trim():text;
    this.showFace = true;
    this.faceTimer = 110; // show WC3 video comm face for ~1.8 seconds
  },
  update() {
    if (this.queue.length>0&&this.messages.length<2) this.messages.push(this.queue.shift());
    for (let i=this.messages.length-1;i>=0;i--) {
      this.messages[i].timer--;
      if (this.messages[i].timer<=0) this.messages.splice(i,1);
    }
    if(this.faceTimer>0)this.faceTimer--;
    if(this.faceTimer<=0)this.showFace=false;
    this.radioTimer++;
    // Deutlich reduzierte Hintergrund-Funksprüche (nur nach langer Funkstille statt alle 10s)
    if (this.radioTimer>4200&&this.messages.length===0&&this.queue.length===0&&SW.Enemies.waveActive) {
      this.radioTimer=0;
      const lines=SW.Dialogues.radioStatic;
      if (lines&&lines.length>0) this.queue.push({text:'[FUNK] '+lines[Math.floor(Math.random()*lines.length)],timer:160,channel:'public'});
    }
  },
  renderChannel(ctx, message, bounds, label, color) {
    const {x,y,w,h}=bounds;
    ctx.fillStyle=color;
    ctx.font='bold 5px monospace';
    if (!message) {
      ctx.fillStyle='#627984';
      ctx.font='4px monospace';
      ctx.fillText('KANAL BEREIT',x+4,y+h-4);
      return;
    }

    const colonIdx=message.text.indexOf(':');
    const speaker=colonIdx>0?message.text.substring(0,colonIdx).trim():'FUNK';
    const text=colonIdx>0?message.text.substring(colonIdx+1).trim():message.text;
    ctx.fillStyle='#dce7ed';
    ctx.font='bold 4px monospace';
    ctx.fillText(speaker.substring(0,15),x+4,y+15);
    const faceId=SW.NPC?SW.NPC.resolve(speaker):null;
    if (faceId && SW.NPC.registry[faceId]) {
      SW.NPC.drawFace(ctx,faceId,x+w-9,y+h-8,10,{animated:true,frame:this.radioTimer});
    } else {
      ctx.fillStyle=color;
      ctx.fillRect(x+w-12,y+h-12,6,6);
      ctx.fillStyle='#14232e';
      ctx.fillRect(x+w-11,y+h-11,4,4);
      ctx.fillStyle=color;
      ctx.fillRect(x+w-10,y+h-10,2,2);
    }

    ctx.fillStyle='#b8d4df';
    ctx.font='4px monospace';
    const words=text.split(/\s+/), lines=[];
    let line='';
    for (const word of words) {
      if ((line+word).length>18 && line) { lines.push(line.trim()); line=word+' '; }
      else line+=word+' ';
    }
    if (line) lines.push(line.trim());
    const visible=lines.slice(0,4);
    if (lines.length>4) visible[3]=visible[3].substring(0,15)+'...';
    for (let i=0;i<visible.length;i++) ctx.fillText(visible[i],x+4,y+22+i*5);
  },
  render(ctx) {
    if (SW.UI && SW.UI.isWingnutCockpitActive && SW.UI.isWingnutCockpitActive() &&
        SW.Engine && SW.Engine.view && SW.Engine.view.mode === 'cockpit') {
      return; // Rendered directly inside the Right Cockpit Comms VDU!
    }
    const publicMessage=this.messages.slice().reverse().find(message=>message.channel!=='squadron');
    const squadronMessage=this.messages.slice().reverse().find(message=>message.channel==='squadron');
    this.renderChannel(ctx,publicMessage,{x:5,y:47,w:57,h:45},'PUBLIC','#57c8df');
    this.renderChannel(ctx,squadronMessage,{x:5,y:100,w:57,h:45},'STAFFEL','#8bdc74');
  }
};

SW.Briefing = {
  active:false,lines:[],currentIndex:0,charIndex:0,typing:true,
  start(lines){this.lines=lines;this.currentIndex=0;this.charIndex=0;this.typing=true;this.active=true;},
  advance() {
    if (this.typing) { this.typing=false;this.charIndex=this.lines[this.currentIndex].text.length;return; }
    this.currentIndex++;
    if (this.currentIndex>=this.lines.length) { this.active=false;return; }
    this.charIndex=0;this.typing=true;
  },
  update() {
    if (!this.active) return;
    if (this.typing) { this.charIndex++;if(this.charIndex>=this.lines[this.currentIndex].text.length)this.typing=false; }
  },
  render(ctx) {
    if (!this.active) return;
    const line=this.lines[this.currentIndex];
    const displayText=this.typing?line.text.substring(0,this.charIndex):line.text;
    ctx.fillStyle='rgba(0,0,0,0.85)';ctx.fillRect(20,SW.H-70,SW.W-40,45);
    ctx.strokeStyle='#00aa00';ctx.strokeRect(20,SW.H-70,SW.W-40,45);
    ctx.fillStyle='#00aaff';ctx.font='bold 8px monospace';ctx.fillText(line.npc,28,SW.H-58);
    ctx.fillStyle='#00ff00';ctx.font='7px monospace';
    const words=displayText.split(' ');let l='';const lines=[];
    for (const w of words) { if((l+w).length>40){lines.push(l);l=w+' ';}else{l+=w+' ';} }
    lines.push(l);
    for (let i=0;i<Math.min(lines.length,3);i++) ctx.fillText(lines[i].trim(),28,SW.H-48+i*9);
    if (!this.typing) { ctx.fillStyle='#444';ctx.font='6px monospace';ctx.textAlign='right';ctx.fillText('[LEERTASTE]',SW.W-28,SW.H-28);ctx.textAlign='left'; }
  }
};


// ===== BAR SCENE (Phase 4) =====
// Piloten in der Bar, Scoreboard, optionale Dialoge.
SW.BarScene = {
  systemIndex: 0,
  dialogueActive: false,
  dialogueLines: [],
  dialogueIndex: 0,
  charIndex: 0,
  typing: true,
  _frame: 0,

  init(systemId) {
    const idx = SW.Systems.findIndex(s=>s.id===systemId);
    this.systemIndex = idx>=0?idx:0;
    const sys = SW.Systems[this.systemIndex];
    this.dialogueLines = SW.Dialogues.barScenes[sys.id] || [];
    this.dialogueIndex = 0;
    this.charIndex = 0;
    this.typing = false;
    this.dialogueActive = this.dialogueLines.length > 0;
    this._frame = 0;
  },

  advanceDialogue() {
    if (!this.dialogueActive) { this.dialogueActive=false; return; }
    if (this.typing) {
      this.typing = false;
      this.charIndex = this.dialogueLines[this.dialogueIndex].text.length;
      return;
    }
    this.dialogueIndex++;
    if (this.dialogueIndex >= this.dialogueLines.length) {
      this.dialogueActive = false;
      return;
    }
    this.charIndex = 0;
    this.typing = true;
    const line = this.dialogueLines[this.dialogueIndex];
    SW.TTS.speak(line.text, line.npc);
  },

  update() {
    this._frame++;
    if (!this.dialogueActive) return;
    if (this.typing) {
      this.charIndex++;
      if (this.charIndex >= this.dialogueLines[this.dialogueIndex].text.length) this.typing = false;
    }
  },

  render(ctx) {
    const sys = SW.Systems[this.systemIndex];
    // Background
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0,0,SW.W,SW.H);

    // === FENSTER (oben, polygonal/spacig, mit Sternen) ===
    const win = { x:20, y:10, w:100, h:50, cut:12 };
    // 8-eckiges Polygon (abgeschnittene Ecken)
    ctx.beginPath();
    ctx.moveTo(win.x+win.cut, win.y);
    ctx.lineTo(win.x+win.w-win.cut, win.y);
    ctx.lineTo(win.x+win.w, win.y+win.cut);
    ctx.lineTo(win.x+win.w, win.y+win.h-win.cut);
    ctx.lineTo(win.x+win.w-win.cut, win.y+win.h);
    ctx.lineTo(win.x+win.cut, win.y+win.h);
    ctx.lineTo(win.x, win.y+win.h-win.cut);
    ctx.lineTo(win.x, win.y+win.cut);
    ctx.closePath();
    ctx.fillStyle = '#050510';
    ctx.fill();
    ctx.strokeStyle = sys.farbe;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Sterne im Fenster (geclippt)
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#fff';
    for (let i=0; i<20; i++) {
      const sx = win.x+3 + (i*13)%94;
      const sy = win.y+3 + (i*17)%44;
      ctx.fillRect(sx, sy, 1, 1);
    }
    // Nebel/Galaxie (spacig)
    ctx.fillStyle = sys.farbe;
    ctx.globalAlpha = 0.15;
    ctx.beginPath(); ctx.arc(win.x+60, win.y+25, 18, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    // Fenster-Rahmen (diagonal, spacig)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(win.x+win.cut, win.y); ctx.lineTo(win.x+win.w-win.cut, win.y+win.h);
    ctx.moveTo(win.x+win.w-win.cut, win.y); ctx.lineTo(win.x+win.cut, win.y+win.h);
    ctx.stroke();

    // === BAR-THEKE (unten) ===
    ctx.fillStyle = '#1a1208';
    ctx.fillRect(0, SW.H-45, SW.W, 45);
    ctx.fillStyle = '#2a1e0e';
    ctx.fillRect(0, SW.H-45, SW.W, 3);
    // Theken-Kante
    ctx.fillStyle = '#3a2a15';
    ctx.fillRect(0, SW.H-45, SW.W, 2);
    // Flaschen auf der Theke
    const bottleColors = ['#44aa44','#aa4444','#4444aa','#aaaa44','#aa44aa'];
    for (let i=0; i<8; i++) {
      const bx = 30 + i*35;
      ctx.fillStyle = bottleColors[i%5];
      ctx.globalAlpha = 0.6;
      ctx.fillRect(bx, SW.H-55, 4, 10); // Flaschenkörper
      ctx.fillRect(bx+1, SW.H-58, 2, 3); // Flaschenhals
      ctx.globalAlpha = 1;
    }

    // === SCOREBOARD ("PILOTS" an der Wand, groß) ===
    const sbX = 140, sbY = 10, sbW = 110, sbH = 65;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(sbX, sbY, sbW, sbH);
    ctx.strokeStyle = sys.farbe;
    ctx.lineWidth = 1;
    ctx.strokeRect(sbX, sbY, sbW, sbH);
    // Titel
    ctx.fillStyle = sys.farbe;
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('P I L O T S', sbX+sbW/2, sbY+10);
    ctx.textAlign = 'left';
    // Trennlinie
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(sbX+5, sbY+13);
    ctx.lineTo(sbX+sbW-5, sbY+13);
    ctx.stroke();
    // Piloten
    for (let i=0; i<SW.Scoreboard.length; i++) {
      const p = SW.Scoreboard[i];
      const py = sbY + 20 + i*9;
      ctx.fillStyle = p.farbe;
      ctx.fillRect(sbX+5, py-4, 4, 4);
      ctx.fillStyle = p.status==='gefallen' ? '#555' : '#ccc';
      ctx.font = '6px monospace';
      ctx.fillText(p.name, sbX+13, py);
      ctx.fillStyle = '#888';
      ctx.textAlign = 'right';
      ctx.fillText(p.kills+'/'+p.losses, sbX+sbW-5, py);
      ctx.textAlign = 'left';
    }

    // === SYSTEM-NAME (oben rechts) ===
    ctx.fillStyle = sys.farbe;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(sys.name, SW.W-10, 20);
    ctx.font = '5px monospace';
    ctx.fillStyle = '#555';
    ctx.fillText(sys.char.substring(0,35), SW.W-10, 30);
    ctx.textAlign = 'left';

    // === PILOTEN (sitzend, detaillierter) ===
    // Pilot 1 (links, an Theke)
    this.renderPilotDetailed(ctx, 50, SW.H-65, sys.farbe, 'SECHS', true);
    // Pilot 2 (Mitte, an Tisch)
    this.renderPilotDetailed(ctx, 130, SW.H-60, '#ff6644', 'NEUN', false);
    // Pilot 3 (rechts, an Theke)
    this.renderPilotDetailed(ctx, 220, SW.H-65, '#88aa88', 'ZWO', true);

    // Tisch (Mitte)
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(115, SW.H-50, 30, 3); // Tischplatte
    ctx.fillRect(128, SW.H-47, 4, 10); // Tischbein

    // === DIALOG-BOX (unten, groß) ===
    if (this.dialogueActive) {
      const line = this.dialogueLines[this.dialogueIndex];
      const displayText = this.typing ? line.text.substring(0, this.charIndex) : line.text;
      // Box (height increased from 38 to 60px)
      ctx.fillStyle = 'rgba(0,0,0,0.9)';
      ctx.fillRect(15, SW.H-85, SW.W-30, 60);
      ctx.strokeStyle = sys.farbe;
      ctx.lineWidth = 1;
      ctx.strokeRect(15, SW.H-85, SW.W-30, 60);
      // Unscharfes Gesicht
      this.renderBlurryFace(ctx, 22, SW.H-78, sys.farbe);
      // NPC Name
      ctx.fillStyle = sys.farbe;
      ctx.font = 'bold 7px monospace';
      ctx.fillText(line.npc, 42, SW.H-72);
      // Text (wrapped to max 65 characters per line)
      ctx.fillStyle = '#0f0';
      ctx.font = '7px monospace';
      const words = displayText.split(' ');
      let l=''; const lines=[];
      for (const w of words) { if((l+w).length>65){lines.push(l);l=w+' ';}else{l+=w+' ';} }
      lines.push(l);
      for (let i=0;i<Math.min(lines.length,2);i++) ctx.fillText(lines[i].trim(), 42, SW.H-62+i*9);
      // Weiter-Prompt
      if (!this.typing) {
        const blink = Math.floor(this._frame/30)%2===0;
        ctx.fillStyle = blink?'#fff':'#666';
        ctx.font = '6px monospace';
        ctx.textAlign='right';
        ctx.fillText('[LEER: weiter]', SW.W-22, SW.H-50);
        ctx.textAlign='left';
      }
    } else {
      // "Zur Briefing-Tafel" Prompt
      const blink = Math.floor(this._frame/30)%2===0;
      ctx.fillStyle = blink?'#fff':'#666';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ ZUR BRIEFING-TAFEL ]', SW.CX, SW.H-25);
      ctx.textAlign = 'left';
    }
  },

  // Detaillierter Pilot (sitzend)
  renderPilotDetailed(ctx, x, y, color, name, atBar) {
    ctx.save();
    // Kopf
    ctx.fillStyle = '#cc9966'; // Haut
    ctx.fillRect(x-4, y-14, 8, 8);
    // Haare
    ctx.fillStyle = color;
    ctx.fillRect(x-4, y-16, 8, 3);
    // Augen
    ctx.fillStyle = '#000';
    ctx.fillRect(x-2, y-11, 1, 1);
    ctx.fillRect(x+1, y-11, 1, 1);
    // Körper (Jacke)
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(x-6, y-6, 12, 12);
    ctx.globalAlpha = 1;
    // Arme
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;
    if (atBar) {
      // Arme auf Theke
      ctx.fillRect(x-8, y+2, 4, 3);
      ctx.fillRect(x+4, y+2, 4, 3);
    } else {
      // Arme am Tisch
      ctx.fillRect(x-7, y+0, 3, 5);
      ctx.fillRect(x+4, y+0, 3, 5);
    }
    ctx.globalAlpha = 1;
    // Beine (sitzend)
    ctx.fillStyle = '#333';
    ctx.fillRect(x-5, y+6, 4, 6);
    ctx.fillRect(x+1, y+6, 4, 6);
    // Name
    ctx.fillStyle = '#666';
    ctx.font = '5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y+18);
    ctx.textAlign = 'left';
    ctx.restore();
  },

  // Unscharfes Gesicht
  renderBlurryFace(ctx, x, y, color) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 14, 16);
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x+1, y+1, 12, 14);
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#000';
    ctx.fillRect(x+3, y+5, 3, 2);
    ctx.fillRect(x+9, y+5, 3, 2);
    ctx.fillRect(x+4, y+11, 6, 1);
    ctx.restore();
  }
};

SW.BriefingBoard = {
  // v0.6.6: Briefing-Tafel als Typing-State-Machine (statt statischer Tafel).
  // Flow: main.js → advance() pro Leertaste; nach der letzten Zeile →
  // !active → SW.Game.startJump(). states.js ruft render(ctx) auf.
  active:false, lines:[], currentIndex:0, charIndex:0, typing:true, mission:null,

  start(mission) {
    this.mission = mission || SW.Missions.list[0];
    // m1–m3: briefingBoards (Strings → Commander), m4: mission.briefing ({npc,text})
    const raw = SW.Dialogues.briefingBoards[this.mission.id];
    this.lines = raw
      ? raw.map(t => ({ npc: 'COMMANDER', text: t }))
      : (this.mission.briefing || []).slice();
    this.currentIndex = 0; this.charIndex = 0; this.typing = true; this.active = true;
    if (this.lines.length && SW.TTS) SW.TTS.speak(this.lines[0].text, this.lines[0].npc);
  },

  advance() {
    if (!this.active) return;
    if (this.typing) { this.typing=false; this.charIndex=this.lines[this.currentIndex].text.length; return; }
    this.currentIndex++;
    if (this.currentIndex>=this.lines.length) { this.active=false; return; }
    this.charIndex=0; this.typing=true;
    if (SW.TTS) SW.TTS.speak(this.lines[this.currentIndex].text, this.lines[this.currentIndex].npc);
  },

  update() {
    if (!this.active) return;
    if (this.typing) { this.charIndex++; if (this.charIndex>=this.lines[this.currentIndex].text.length) this.typing=false; }
  },

  render(ctx) {
    const mission = this.mission || SW.Missions.list[0];
    const sys = SW.Systems.find(s=>s.missionId===mission.id) || SW.Systems[0];
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0,0,SW.W,SW.H);
    // Tafel (grün)
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(30, 20, SW.W-60, 150);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 20, SW.W-60, 150);
    // Kopf
    ctx.fillStyle = sys.farbe;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BRIEFING — ' + mission.name, SW.CX, 38);
    ctx.textAlign = 'left';
    // Mission-Info
    ctx.fillStyle = '#666';
    ctx.font = '6px monospace';
    ctx.fillText('WELLEN: ' + mission.waves.length, 45, 52);
    ctx.fillText('SCHIFFE: ' + mission.waves.map(w=>w.ship||'d_b').join(', '), 45, 62);
    // Commander-Zeile mit Typing (eine Zeile nach der anderen)
    const line = this.lines[this.currentIndex];
    if (line) {
      const displayText = this.typing ? line.text.substring(0, this.charIndex) : line.text;
      ctx.fillStyle = '#00ff00';
      ctx.font = '8px monospace';
      const words = displayText.split(' '); let l=''; const ls=[];
      for (const w of words) { if((l+w).length>55){ls.push(l);l=w+' ';}else{l+=w+' ';} }
      ls.push(l);
      for (let i=0;i<Math.min(ls.length,3);i++) ctx.fillText(ls[i].trim(), 45, 85 + i*14);
      if (!this.typing) {
        const blink = Math.floor(Date.now()/500)%2===0;
        ctx.fillStyle = blink?'#fff':'#666';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[ LEERTASTE: WEITER ]', SW.CX, 155);
        ctx.textAlign = 'left';
      }
    }
  }
};

// ===== THERMOPAPIER-FAX-OVERLAY (Quests & Formulare, v0.75-dev) =====
// Rollt bei neuen Aufträgen (SW.Quests.onNewQuest) oder Erledigungen (onReward)
// als vergilbter Thermopapier-Streifen oben rechts ins Bild.
SW.Fax = {
  queue: [],
  current: null,
  timer: 0,
  slide: 0,

  push(title, body, stamp) {
    this.queue.push({
      title: String(title || 'TELEFAX 1988'),
      lines: String(body || '').split('\n').slice(0, 4),
      stamp: stamp || 'EINGANG'
    });
    if (SW.Audio && SW.Audio.playFax) SW.Audio.playFax();
  },

  onQuest(q) {
    if (!q) return;
    this.push('FAX-AUFTRAG: ' + q.titel.toUpperCase(), q.fax || '', ' OFFEN ');
  },

  onReward(q) {
    if (!q) return;
    const txt = (q.belohnung && q.belohnung.text) ? q.belohnung.text : 'Akte geschlossen.';
    this.push('ERLEDIGT: ' + q.titel.toUpperCase(), txt, 'STEMPEL');
  },

  update() {
    if (!this.current && this.queue.length > 0) {
      this.current = this.queue.shift();
      this.timer = 210; // ~3.5 Sekunden
      this.slide = 0;
    }
    if (!this.current) return;
    if (this.timer > 30 && this.slide < 1) this.slide = Math.min(1, this.slide + 0.1);
    else if (this.timer <= 30) this.slide = Math.max(0, this.slide - 0.08);
    this.timer--;
    if (this.timer <= 0) this.current = null;
  },

  render(ctx) {
    if (!this.current) return;
    const w = 138, h = 48;
    const x = SW.W - w - 6;
    const y = Math.round(-h + this.slide * (h + 18));
    ctx.save();
    // Thermopapier-Hintergrund
    ctx.fillStyle = '#d8d2c2';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#6e6858';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    // Abrisskante unten (Zacken)
    ctx.fillStyle = '#1a1a1a';
    for (let zx = x + 2; zx < x + w - 2; zx += 6) {
      ctx.fillRect(zx, y + h - 1, 3, 1);
    }
    // Kopfzeile
    ctx.fillStyle = '#332e24';
    ctx.font = 'bold 5px monospace';
    ctx.fillText(this.current.title.substring(0, 26), x + 4, y + 8);
    ctx.strokeStyle = '#999282';
    ctx.beginPath(); ctx.moveTo(x + 3, y + 10); ctx.lineTo(x + w - 3, y + 10); ctx.stroke();
    // Textzeilen
    ctx.fillStyle = '#221f18';
    ctx.font = '4px monospace';
    for (let i = 0; i < this.current.lines.length; i++) {
      ctx.fillText(this.current.lines[i].substring(0, 32), x + 4, y + 17 + i * 7);
    }
    // Bürokratie-Stempel rechts unten
    const isDone = this.current.stamp === 'STEMPEL';
    ctx.strokeStyle = isDone ? '#227733' : '#aa2222';
    ctx.fillStyle = isDone ? '#227733' : '#aa2222';
    ctx.strokeRect(x + w - 36, y + h - 14, 32, 9);
    ctx.font = 'bold 4px monospace';
    ctx.fillText(this.current.stamp, x + w - 33, y + h - 8);
    ctx.restore();
  }
};

