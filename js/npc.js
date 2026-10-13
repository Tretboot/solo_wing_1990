// ===== SOLO WING 1990 — NPC OVERHAUL (Gesichter, Stimmen, Video) =====
// Jeder NPC hat ein generiertes Gesicht (Canvas-Primitives), das zur TTS-Stimme passt.
// Verwendung: Briefing-Szene, Cockpit-Video, Träger-Räume.

SW.NPC = {
  // ===== NPC REGISTRY =====
  registry: {
    commander: {
      id: 'commander', name: 'COMMANDER', voice: 'male-older',
      age: 52, skin: '#d8b48c', hair: '#8a8a8a', hairStyle: 'short-military',
      uniform: '#2a3442', rank: 'commander', features: ['mustache', 'scar-left'],
      personality: 'stoic', videoPose: 'standing', briefingPos: { x: 96, y: 168 }
    },
    sechs: {
      id: 'sechs', name: 'SECHS', voice: 'male-young',
      age: 25, skin: '#f5d5b8', hair: '#f0e68c', hairStyle: 'messy-blonde',
      uniform: '#335577', rank: 'pilot', features: ['smirk', 'glasses'],
      personality: 'sarcastic', videoPose: 'cockpit-left', briefingPos: { x: 220, y: 140 }
    },
    neun: {
      id: 'neun', name: 'NEUN', voice: 'male-young-high',
      age: 23, skin: '#e8c4a8', hair: '#6b4423', hairStyle: 'short-brown',
      uniform: '#44608a', rank: 'pilot', features: ['sweat', 'wide-eyes'],
      personality: 'anxious', videoPose: 'cockpit-center', briefingPos: { x: 300, y: 140 }
    },
    zwo: {
      id: 'zwo', name: 'ZWO', voice: 'female-mature',
      age: 35, skin: '#d4a574', hair: '#2c1810', hairStyle: 'ponytail',
      uniform: '#2f4a6b', rank: 'pilot-senior', features: ['serious', 'ear-rings'],
      personality: 'professional', videoPose: 'cockpit-right', briefingPos: { x: 380, y: 140 }
    },
    vier: {
      id: 'vier', name: 'VIER', voice: 'male-young',
      age: 21, skin: '#f0d5a8', hair: '#a0522d', hairStyle: 'crop',
      uniform: '#3a5a7a', rank: 'cadet', features: ['smile', 'freckles'],
      personality: 'optimistic', videoPose: 'standing-relaxed', briefingPos: null
    },
    barkeep: {
      id: 'barkeep', name: 'BARKEEP', voice: 'synthetic',
      age: 0, skin: '#c0c0c0', hair: null, hairStyle: 'none',
      uniform: '#1a1a1a', rank: 'automaton', features: ['metal-skin', 'glowing-eyes'],
      personality: 'literal', videoPose: 'behind-counter', briefingPos: null
    },
    bolt: {
      id: 'bolt', name: 'BOLT', voice: 'male-middle',
      age: 40, skin: '#c9a67a', hair: '#3a3a3a', hairStyle: 'balding',
      uniform: '#1a2a1a', rank: 'technician', features: ['oil-smudge', 'beard'],
      personality: 'grumpy', videoPose: 'holding-wrench', briefingPos: null
    },
    pflaster: {
      id: 'pflaster', name: 'FRAU PFLASTER', voice: 'female-mature-soft',
      age: 38, skin: '#e8c498', hair: '#4a3728', hairStyle: 'bun',
      uniform: '#2a4a3a', rank: 'medic', features: ['kind-eyes', 'stethoscope'],
      personality: 'caring', videoPose: 'holding-medkit', briefingPos: null
    },
    diskettens: {
      id: 'diskettens', name: 'DISKETTENS', voice: 'male-middle-flat',
      age: 45, skin: '#d0b088', hair: '#5a4a3a', hairStyle: 'side-part',
      uniform: '#2a2a3a', rank: 'engineer', features: ['glasses', 'serious'],
      personality: 'technical', videoPose: 'holding-datapad', briefingPos: null
    },
    klo: {
      id: 'klo', name: 'KLO', voice: 'female-older-whisper',
      age: 67, skin: '#c4a484', hair: '#a0a0a0', hairStyle: 'short-grey',
      uniform: '#3a3a2a', rank: 'janitor', features: ['wrinkles', 'kind-smile'],
      personality: 'wise', videoPose: 'holding-mop', briefingPos: null
    },
    system: {
      id: 'system', name: 'SYSTEM', voice: 'synthetic-neutral',
      age: 0, skin: null, hair: null, hairStyle: 'none',
      uniform: null, rank: 'ai', features: ['hologram'],
      personality: 'neutral', videoPose: 'hologram', briefingPos: null
    }
  },

  // Kopf zeichnen
  _drawHead(ctx, x, y, size, npc) {
    const headSize = size * 0.6;
    ctx.fillStyle = npc.skin;
    ctx.fillRect(x - headSize * 0.2, y + headSize * 0.3, headSize * 0.4, headSize * 0.2);
    ctx.beginPath();
    ctx.ellipse(x, y, headSize * 0.5, headSize * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    if (npc.hair && npc.hairStyle !== 'none') this._drawHair(ctx, x, y, headSize, npc.hair, npc.hairStyle);
  },

  // Haar-Stile
  _drawHair(ctx, x, y, size, color, style) {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    switch (style) {
      case 'short-military':
        ctx.beginPath(); ctx.ellipse(x, y - size * 0.1, size * 0.55, size * 0.25, 0, Math.PI, 0); ctx.fill(); break;
      case 'messy-blonde':
        ctx.beginPath();
        ctx.moveTo(x - size * 0.5, y); ctx.quadraticCurveTo(x - size * 0.6, y - size * 0.3, x - size * 0.3, y - size * 0.2);
        ctx.quadraticCurveTo(x, y - size * 0.4, x + size * 0.3, y - size * 0.2);
        ctx.quadraticCurveTo(x + size * 0.6, y - size * 0.3, x + size * 0.5, y); ctx.stroke(); break;
      case 'short-brown':
        ctx.beginPath(); ctx.ellipse(x, y - size * 0.15, size * 0.52, size * 0.28, 0, Math.PI, 0); ctx.fill(); break;
      case 'ponytail':
        ctx.beginPath(); ctx.ellipse(x, y - size * 0.1, size * 0.48, size * 0.25, 0, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + size * 0.3, y + size * 0.1, size * 0.2, size * 0.3, 0.3, 0, Math.PI * 2); ctx.fill(); break;
      case 'crop':
        ctx.beginPath(); ctx.ellipse(x, y - size * 0.12, size * 0.5, size * 0.22, 0, Math.PI, 0); ctx.fill(); break;
      case 'bun':
        ctx.beginPath(); ctx.ellipse(x, y - size * 0.1, size * 0.45, size * 0.23, 0, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.arc(x - size * 0.35, y + size * 0.05, size * 0.15, 0, Math.PI * 2); ctx.fill(); break;
      case 'balding':
        ctx.beginPath(); ctx.ellipse(x - size * 0.15, y - size * 0.1, size * 0.3, size * 0.18, 0, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + size * 0.15, y - size * 0.1, size * 0.3, size * 0.18, 0, Math.PI, 0); ctx.fill(); break;
      case 'short-grey':
        ctx.beginPath(); ctx.ellipse(x, y - size * 0.08, size * 0.48, size * 0.2, 0, Math.PI, 0); ctx.fill(); break;
      case 'side-part':
        ctx.beginPath();
        ctx.moveTo(x - size * 0.5, y); ctx.lineTo(x - size * 0.4, y - size * 0.25);
        ctx.lineTo(x + size * 0.2, y - size * 0.28); ctx.lineTo(x + size * 0.45, y); ctx.fill(); break;
      default: break;
    }
  },

  // Gesichtszüge zeichnen
  _drawFeatures(ctx, x, y, size, npc) {
    const eyeSize = size * 0.08, eyeY = y + size * 0.05;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x - size * 0.15, eyeY, eyeSize * 1.2, eyeSize, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + size * 0.15, eyeY, eyeSize * 1.2, eyeSize, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this._getEyeColor(npc);
    const pupilOffset = npc.personality === 'anxious' ? size * 0.02 : 0;
    ctx.beginPath(); ctx.arc(x - size * 0.15 + pupilOffset, eyeY, eyeSize * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + size * 0.15 + pupilOffset, eyeY, eyeSize * 0.4, 0, Math.PI * 2); ctx.fill();
    
    ctx.strokeStyle = '#6a4a3a'; ctx.lineWidth = 1.5; ctx.beginPath();
    if (npc.personality === 'sarcastic') {
      ctx.moveTo(x - size * 0.15, y + size * 0.22); ctx.quadraticCurveTo(x, y + size * 0.18, x + size * 0.15, y + size * 0.24);
    } else if (npc.personality === 'anxious') {
      ctx.moveTo(x - size * 0.1, y + size * 0.23); ctx.quadraticCurveTo(x, y + size * 0.26, x + size * 0.1, y + size * 0.23);
    } else if (npc.personality === 'stoic' || npc.personality === 'neutral') {
      ctx.moveTo(x - size * 0.12, y + size * 0.23); ctx.lineTo(x + size * 0.12, y + size * 0.23);
    } else if (npc.personality === 'caring' || npc.personality === 'optimistic') {
      ctx.moveTo(x - size * 0.12, y + size * 0.22); ctx.quadraticCurveTo(x, y + size * 0.28, x + size * 0.12, y + size * 0.22);
    } else {
      ctx.moveTo(x - size * 0.1, y + size * 0.23); ctx.lineTo(x + size * 0.1, y + size * 0.23);
    }
    ctx.stroke();

    if (npc.features.includes('mustache')) {
      ctx.fillStyle = '#8a8a8a';
      ctx.beginPath(); ctx.ellipse(x - size * 0.08, y + size * 0.19, size * 0.1, size * 0.05, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + size * 0.08, y + size * 0.19, size * 0.1, size * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (npc.features.includes('glasses')) {
      ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(x - size * 0.15, eyeY, size * 0.12, size * 0.09, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x + size * 0.15, eyeY, size * 0.12, size * 0.09, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - size * 0.03, eyeY); ctx.lineTo(x + size * 0.03, eyeY); ctx.stroke();
    }
    if (npc.features.includes('metal-skin')) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath();
      ctx.ellipse(x - size * 0.2, y - size * 0.1, size * 0.15, size * 0.1, -0.3, 0, Math.PI * 2); ctx.fill();
    }
    if (npc.features.includes('glowing-eyes')) {
      ctx.fillStyle = '#0f0'; ctx.shadowColor = '#0f0'; ctx.shadowBlur = 5;
      ctx.beginPath(); ctx.arc(x - size * 0.15, eyeY, size * 0.05, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + size * 0.15, eyeY, size * 0.05, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  },

  // Körper zeichnen (pose: 'standing' = default, 'holding-wrench' ...)
  _drawBody(ctx, x, y, size, color, pose, npc) {
    const bodyWidth = size * 0.8, bodyHeight = size * 1.2;
    switch (pose) {
      case 'cockpit-left': case 'cockpit-center': case 'cockpit-right':
        ctx.fillStyle = color; ctx.fillRect(x - bodyWidth * 0.5, y + size * 0.3, bodyWidth, size * 0.5);
        ctx.fillStyle = this._shadeColor(color, -20);
        ctx.fillRect(x - bodyWidth * 0.55, y + size * 0.3, bodyWidth * 0.15, size * 0.2);
        ctx.fillRect(x + bodyWidth * 0.4, y + size * 0.3, bodyWidth * 0.15, size * 0.2); break;
      case 'behind-counter':
        ctx.fillStyle = color; ctx.fillRect(x - bodyWidth * 0.4, y + size * 0.2, bodyWidth * 0.8, size * 0.6);
        ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x - bodyWidth * 0.6, y + size * 0.6, bodyWidth * 1.4, size * 0.3); break;
      case 'holding-wrench':
        ctx.fillStyle = color; ctx.fillRect(x - bodyWidth * 0.4, y + size * 0.2, bodyWidth * 0.8, bodyHeight);
        ctx.strokeStyle = '#6a6a6a'; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(x + size * 0.3, y + size * 0.5); ctx.lineTo(x + size * 0.6, y + size * 0.8); ctx.stroke(); break;
      case 'holding-medkit':
        ctx.fillStyle = color; ctx.fillRect(x - bodyWidth * 0.4, y + size * 0.2, bodyWidth * 0.8, bodyHeight);
        ctx.fillStyle = '#fff'; ctx.fillRect(x - size * 0.2, y + size * 0.6, size * 0.4, size * 0.3);
        ctx.fillStyle = '#f00'; ctx.fillRect(x - size * 0.05, y + size * 0.65, size * 0.1, size * 0.2);
        ctx.fillRect(x - size * 0.1, y + size * 0.7, size * 0.2, size * 0.1); break;
      case 'holding-datapad':
        ctx.fillStyle = color; ctx.fillRect(x - bodyWidth * 0.4, y + size * 0.2, bodyWidth * 0.8, bodyHeight);
        ctx.fillStyle = '#2a2a3a'; ctx.fillRect(x - size * 0.15, y + size * 0.65, size * 0.3, size * 0.25);
        ctx.fillStyle = '#0af'; ctx.fillRect(x - size * 0.12, y + size * 0.68, size * 0.24, size * 0.18); break;
      case 'holding-mop':
        ctx.fillStyle = color; ctx.fillRect(x - bodyWidth * 0.35, y + size * 0.2, bodyWidth * 0.7, bodyHeight);
        ctx.strokeStyle = '#8a6d3b'; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(x + size * 0.25, y + size * 0.4); ctx.lineTo(x + size * 0.5, y + size * 1.0); ctx.stroke();
        ctx.fillStyle = '#6a6a8a'; ctx.fillRect(x + size * 0.35, y + size * 0.95, size * 0.3, size * 0.1); break;
      default:
        ctx.fillStyle = color; ctx.fillRect(x - bodyWidth * 0.4, y + size * 0.2, bodyWidth * 0.8, bodyHeight);
        if (npc.rank === 'commander' || npc.rank === 'pilot-senior') {
          ctx.fillStyle = '#c9a227';
          ctx.fillRect(x - size * 0.15, y + size * 0.25, size * 0.1, size * 0.1);
          ctx.fillRect(x + size * 0.05, y + size * 0.25, size * 0.1, size * 0.1);
        } break;
    }
  },

  // Haupt-Funktion: Gesicht zeichnen (Kopf + optional Körper + Accessoires).
  // Eine API für alle Szenen (Briefing, Cockpit-Video, Träger-Räume).
  // options: { showBody, showUniform, pose, animated, frame }
  drawFace(ctx, npcId, x, y, size, options = {}) {
    const npc = this.registry[npcId];
    if (!npc) return;
    const frame = options.frame || 0;
    // Leichter Bob (Atmen), wenn animiert
    const py = y + (options.animated ? Math.sin(frame * 0.08) * size * 0.02 : 0);
    const pose = options.pose || npc.videoPose || 'standing';
    // Reihenfolge: Körper (hinten) → Kopf → Accessoires (vorne)
    if (options.showBody && npc.uniform) this._drawBody(ctx, x, py, size, npc.uniform, pose, npc);
    this._drawHead(ctx, x, py, size, npc);
    this._drawAccessories(ctx, x, py, size, npc, pose, frame);
  },

  // Name (z.B. 'COMMANDER' aus einer Funkzeile) → Registry-Key (z.B. 'commander').
  // Fallback: Teil-Treffer (z.B. 'PFLASTER' → 'pflaster'), sonst null.
  resolve(npcName) {
    if (!npcName) return null;
    const n = String(npcName).toUpperCase();
    const ids = Object.keys(this.registry);
    for (const id of ids) {
      const e = this.registry[id];
      if (e.name === n || id.toUpperCase() === n) return id;
    }
    for (const id of ids) {
      const e = this.registry[id];
      if (e.name.indexOf(n) >= 0 || n.indexOf(e.name) >= 0) return id;
    }
    return null;
  },

  // Accessoires zeichnen
  _drawAccessories(ctx, x, y, size, npc, pose, frame) {
    if (npc.features.includes('stethoscope')) {
      ctx.strokeStyle = '#2a4a3a'; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(x - size * 0.2, y + size * 0.3); ctx.quadraticCurveTo(x, y + size * 0.5, x + size * 0.2, y + size * 0.3); ctx.stroke();
    }
    if (npc.features.includes('ear-rings')) {
      ctx.fillStyle = '#c9a227';
      ctx.beginPath(); ctx.arc(x - size * 0.42, y + size * 0.08, size * 0.03, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + size * 0.42, y + size * 0.08, size * 0.03, 0, Math.PI * 2); ctx.fill();
    }
    if (npc.features.includes('hologram')) {
      const alpha = 0.5 + Math.sin(frame * 0.1) * 0.2;
      ctx.globalAlpha = alpha; ctx.fillStyle = '#0af'; ctx.beginPath();
      ctx.ellipse(x, y, size * 0.6, size * 0.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
  },

  _getEyeColor(npc) {
    const map = { 'stoic': '#4a6a4a', 'sarcastic': '#6a6a2a', 'anxious': '#8a6a4a', 'professional': '#2a4a6a',
      'optimistic': '#4a8a4a', 'literal': '#0f0', 'grumpy': '#6a4a4a', 'caring': '#4a6a6a',
      'technical': '#3a3a3a', 'wise': '#6a6a4a', 'neutral': '#8a8a8a' };
    return map[npc.personality] || '#4a4a4a';
  },

  _shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16), amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  },

  // Raum-Gesicht Renderer (für Bar-Szene & andere Räume):
  // npcId: Registry-Key ODER Name, x/y: Position, size: Größe, showBody: Jacke anzeigen, showUniform: Uniform anzeigen
  renderRoomFace(ctx, npcId, x, y, size, { showBody = true, showUniform = true, pose = 'standing' } = {}) {
    const npc = this.registry[this.resolve(npcId) || npcId];
    if (!npc) { ctx.fillStyle = '#555'; ctx.font = '6px monospace'; ctx.fillText('?', x, y); return; }
    ctx.save();
    ctx.fillStyle = npc.skin || '#f0d5a8';
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.45, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = npc.uniform || '#335577';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Haare
    if (npc.hair && npc.hairStyle && npc.hairStyle !== 'none') {
      this._drawHair(ctx, x, y, size, npc.hair, npc.hairStyle);
    }
    // Augen
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x - size * 0.1, y - size * 0.05, size * 0.12, 0, Math.PI * 2);
    ctx.arc(x + size * 0.1, y - size * 0.05, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    // Pupillen
    ctx.fillStyle = npc.features?.includes('wide-eyes') ? '#888' : '#000';
    ctx.beginPath();
    ctx.arc(x - size * 0.1, y - size * 0.05, size * 0.08, 0, Math.PI * 2);
    ctx.arc(x + size * 0.1, y - size * 0.05, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    // Mund
    ctx.fillStyle = npc.personality === 'grumpy' ? '#666' : '#555';
    ctx.beginPath();
    ctx.arc(x, y + size * 0.15, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    // Jacke/Uniform (falls gewünscht)
    if (showBody && npc.uniform) {
      ctx.fillStyle = npc.uniform;
      ctx.fillRect(x - size * 0.3, y + size * 0.4, size * 0.6, size * 0.3);
    }
    // Namenslabel (klein)
    ctx.fillStyle = npc.uniform || '#335577';
    ctx.font = '5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.resolve(npcId) || npcId, x, y + size * 0.55);
    ctx.restore();
  },

  // Cockpit-Video Renderer (280×160): Porträt + Sprechblase + TTS-Indikator.
  // npcId: Registry-Key ODER Display-Name (wird über resolve() aufgelöst).
  renderCockpitVideo(ctx, npcId, text, frame) {
    const npc = this.registry[this.resolve(npcId) || npcId];
    if (!npc) return;
    ctx.fillStyle = 'rgba(10, 15, 20, 0.95)'; ctx.fillRect(20, 20, 280, 160);
    const sysColor = SW.World?.currentSystem ? SW.Systems.getSystem(SW.World.currentSystem)?.farbe || '#0af' : '#0af';
    ctx.strokeStyle = sysColor; ctx.lineWidth = 2; ctx.strokeRect(20, 20, 280, 160);
    this.drawFace(ctx, npcId, 240, 100, 60, { showBody: true, showUniform: true, pose: npc.videoPose, animated: true, frame });
    const bubbleX = 30, bubbleY = 40, bubbleW = 180, bubbleH = 100;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.fillRect(bubbleX, bubbleY, bubbleW, bubbleH);
    ctx.strokeStyle = sysColor; ctx.lineWidth = 1; ctx.strokeRect(bubbleX, bubbleY, bubbleW, bubbleH);
    ctx.fillStyle = sysColor; ctx.font = 'bold 7px monospace'; ctx.fillText(npc.name, bubbleX + 8, bubbleY + 12);
    // Sprechblasen-Text (Umbruch, max. 4 Zeilen)
    ctx.fillStyle = '#0f0'; ctx.font = '6px monospace';
    const words = text.split(' '), lines = []; let line = '';
    for (const word of words) { if ((line + word).length > 28) { lines.push(line); line = word + ' '; } else { line += word + ' '; } }
    lines.push(line);
    for (let i = 0; i < Math.min(lines.length, 4); i++) ctx.fillText(lines[i].trim(), bubbleX + 8, bubbleY + 22 + i * 10);
    // TTS-Indikator: blinkender Punkt, solange TTS an ist
    if (SW.TTS?.enabled) { const blink = Math.floor(frame / 10) % 2 === 0; ctx.fillStyle = blink ? '#fff' : '#666'; ctx.font = '5px monospace'; ctx.fillText('●', bubbleX + bubbleW - 12, bubbleY + 10); }
  }
};