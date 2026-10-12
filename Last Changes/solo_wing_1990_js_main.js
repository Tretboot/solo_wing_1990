// ===== SOLO WING 1990 — MAIN LOOP & INIT =====
(function() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function resize() {
    const scale = Math.min(window.innerWidth/SW.CANVAS_W, window.innerHeight/SW.CANVAS_H);
    canvas.style.width = (SW.CANVAS_W*scale)+'px';
    canvas.style.height = (SW.CANVAS_H*scale)+'px';
  }
  window.addEventListener('resize', resize);
  resize();

  function handleInput() {
    // State-Wechsel: mouseDown reset (verhindert Klick-Through)
    if (SW._lastState && SW._lastState !== SW.Game.state) {
      SW.Input.mouseDown = false;
    }
    SW._lastState = SW.Game.state;

    // ESCAPE MENÜ (toggle)
    if (SW.Input.keys['Escape'] && !SW._escHeld) {
      SW._escHeld = true;
      if (SW.Game.state === 'MENU') {
        SW.Game.setState(SW.Game._menuReturn || 'COCKPIT');
      } else if (['COCKPIT','SHIP','BRIEFING_BOARD','TAKEOFF','LANDING','BRIEFING'].includes(SW.Game.state)) {
        SW.Game._menuReturn = SW.Game.state;
        SW.Game.state = 'MENU';
      }
    }
    if (!SW.Input.keys['Escape']) SW._escHeld = false;

    // MENÜ-Optionen
    if (SW.Game.state === 'MENU') {
      if (SW.Input.keys['KeyM'] && !SW._mHeld) { SW.TTS.toggle(); SW._mHeld = true; }
      if (!SW.Input.keys['KeyM']) SW._mHeld = false;
      if (SW.Input.keys['KeyO'] && !SW._oHeld) { SW.Audio.toggle(); SW._oHeld = true; }
      if (!SW.Input.keys['KeyO']) SW._oHeld = false;
      // CHEAT: [1] = zum Träger, [2] = Karte
      if (SW.Input.keys['Digit1'] && !SW._c1Held) { SW._c1Held = true; SW.Game.setState('SHIP'); }
      if (!SW.Input.keys['Digit1']) SW._c1Held = false;
      if (SW.Input.keys['Digit2'] && !SW._c2Held) { SW._c2Held = true; SW.Game.state = 'CHEAT_MAP'; }
      if (!SW.Input.keys['Digit2']) SW._c2Held = false;
      // Cheat-Klicks
      if (SW.Input.mouseDown) {
        SW.Input.mouseDown = false;
        const mx = SW.Input.mouseX, my = SW.Input.mouseY;
        if (SW.Game._cheatShipRect) {
          const r = SW.Game._cheatShipRect;
          if (mx>=r.x && mx<=r.x+r.w && my>=r.y && my<=r.y+r.h) { SW.Game.setState('SHIP'); return; }
        }
        if (SW.Game._cheatMapRect) {
          const r = SW.Game._cheatMapRect;
          if (mx>=r.x && mx<=r.x+r.w && my>=r.y && my<=r.y+r.h) { SW.Game.state = 'CHEAT_MAP'; return; }
        }
      }
      return; // Menü: keine andere Eingabe
    }
    // CHEAT_MAP: Fullscreen-Karte, Klick auf Raum = dorthin, ESC = zurück zum Träger
    if (SW.Game.state === 'CHEAT_MAP') {
      if (SW.Input.keys['Escape'] && !SW._escHeld2) { SW._escHeld2 = true; SW.Game.setState('SHIP'); }
      if (!SW.Input.keys['Escape']) SW._escHeld2 = false;
      if (SW.Input.mouseDown) {
        SW.Input.mouseDown = false;
        SW.Ship.handleCheatMapClick(SW.Input.mouseX, SW.Input.mouseY);
      }
      return;
    }

    if (SW.Game.state==='BAR') {
      if (SW.Input.getFirePressed()||SW.Input.getAnyKeyPressed()) {
        SW.Audio.init();
        if(SW.World) SW.World.init('s1', 1990);
        SW.Game.setState('SHIP');
      }
    }
    if (SW.Game.state==='INTRO') {
      // Intro-Input (ESC, Name-Input) läuft in SW.Intro.update()
      // Hier nur Audio-Init beim ersten Kontakt
      if (SW.Input.getAnyKeyPressed() && !SW._introAudioInit) {
        SW.Audio.init(); SW._introAudioInit = true;
      }
    }
    if (SW.Game.state==='AKADEMIE') {
      if (SW.Akademie.phase==='dialog') {
        if (SW.Input.getFirePressed()||SW.Input.keys['Space']) {
          const line = SW.Akademie.nextDialogLine();
          // null = dialog fertig, Sim-Flug startet
        }
      }
    }
    if (SW.Game.state==='SHIP') {
      if (SW.Input.mouseDown) {
        SW.Input.mouseDown = false;
        SW.Ship.handleClick(SW.Input.mouseX, SW.Input.mouseY);
      }
      if (SW.Input.keys['Space'] && SW.Ship.dialogueActive) {
        SW.Ship.advanceDialogue();
      }
    }
    if (SW.Game.state==='BRIEFING_BOARD') {
      if (SW.Input.keys['Space']||SW.Input.getFirePressed()) {
        SW.Game.setState('TAKEOFF');
      }
    }
    if (SW.Game.state==='BRIEFING') {
      if (SW.Input.getFirePressed()||SW.Input.keys['Space']) {
        SW.Briefing.advance();
        if (!SW.Briefing.active) SW.Game.setState('TAKEOFF');
      }
    }
    // TTS-Toggle (M) in allen States
    if (SW.Input.keys['KeyM']&&!SW.Input._mHeld) { SW.TTS.toggle();SW.Input._mHeld=true; }
    if (!SW.Input.keys['KeyM']) SW.Input._mHeld=false;
    if (SW.Game.state==='COCKPIT') {
      // T = Autopilot (statt A)
      if (SW.Input.keys['KeyT']&&!SW.Input._tHeld) { SW.Autopilot.toggle();SW.Input._tHeld=true; }
      if (!SW.Input.keys['KeyT']) SW.Input._tHeld=false;
      // N = Nav/Spacemap Toggle
      if (SW.Input.keys['KeyN']&&!SW.Input._nHeld) { SW.UI.navMapVisible=!SW.UI.navMapVisible;SW.Input._nHeld=true; }
      if (!SW.Input.keys['KeyN']) SW.Input._nHeld=false;
    }
    if (SW.Game.state==='HANGAR') {
      const t = SW.Game._hangarTimer||0;
      const lines = SW.Game._hangarLines||[];
      if (t > 60 + lines.length*120) {
        if (SW.Input.getFirePressed()||SW.Input.getAnyKeyPressed()) {
          SW.Game._hangarTimer=0;
          SW.Game.setState('SHIP');
        }
      }
    }
    if (SW.Game.state==='DEBRIEFING') {
      if (SW.Input.getFirePressed()||SW.Input.getAnyKeyPressed()) SW.Game.setState('SHIP');
    }
  }

  function loop() {
    requestAnimationFrame(loop);
    SW.Game.frame++;
    SW.Input.pollGamepad();
    handleInput();
    const state=SW.Game.state;

    // VGA: scale(2,2) → 320×200 virtuell, 640×400 real
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(SW.VGA_SCALE, SW.VGA_SCALE);

    if (state==='MENU') { SW.Game.renderMenu(ctx); return; }
    if (state==='CHEAT_MAP') { SW.Ship.renderCheatMap(ctx); return; }
    if (state==='INTRO') { SW.Intro.update(SW.Game.frame); SW.Intro.render(ctx); return; }
    if (state==='AKADEMIE') { SW.Akademie.update(); SW.Game.renderAkademie(ctx); return; }
    if (state==='BAR') { SW.Game.renderBar(ctx); return; }
    if (state==='SHIP') { SW.Ship.update();SW.Ship.render(ctx); return; }
    if (state==='BRIEFING_BOARD') { SW.Game.renderBriefingBoard(ctx); return; }
    if (state==='BRIEFING') { SW.Briefing.update();SW.Game.renderBriefing(ctx); return; }
    if (state==='TAKEOFF'||state==='LANDING') {
      SW.Flight.update();SW.Engine.updateStars();
      state==='TAKEOFF'?SW.Game.renderTakeoff(ctx):SW.Game.renderLanding(ctx);
      return;
    }
    if (state==='HANGAR') {
      SW.Game._hangarTimer = (SW.Game._hangarTimer||0)+1;
      SW.Game.renderHangar(ctx); return;
    }
    if (state==='DEBRIEFING') { SW.Game.renderDebriefing(ctx); return; }

    // COCKPIT
    SW.Player.update(SW.Game.frame);
    SW.Engine.updateStars();
    SW.Enemies.update(SW.Game.frame);
    SW.Projectiles.update();
    SW.Collision.check(SW.Game.frame);
    SW.Explosions.update();
    SW.Comm.update();
    SW.Autopilot.update();
    SW.Game.renderCockpit(ctx);
  }

  SW.Sprites.init();
  SW.Engine.initStars();
  SW.Input.init(canvas);
  SW.Quests.init();
  SW.Quests.onNewQuest = (q) => { console.log('[QUEST] Neu:', q.titel); };
  SW.Quests.onReward = (q) => { console.log('[QUEST] Erledigt:', q.titel); };
  SW.Game.setState('INTRO');
  loop();
  console.log('[SOLO WING 1990] Engine geladen. Version 0.6.5-beta (Cheatmenü + Wandkarte + 8 neue NPCs + Raum-Geschichten)');
})();
