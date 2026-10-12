// ===== SOLO WING 1990 — INPUT SYSTEM =====
// Keyboard + Mouse + Gamepad. Multi-Input = more laser slots.
SW.Input = {
  keys: {}, mouseX: SW.CX, mouseY: SW.CY, mouseDown: false,
  gamepadData: null, devices: { keyboard: false, mouse: false, gamepad: false },
  _aHeld: false, _mHeld: false,

  init(canvas) {
    document.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      this.devices.keyboard = true;
      if (e.code === 'Space') e.preventDefault();
    });
    document.addEventListener('keyup', e => { this.keys[e.code] = false; });
    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - r.left) / r.width * SW.W;
      this.mouseY = (e.clientY - r.top) / r.height * SW.H;
      this.devices.mouse = true;
    });
    canvas.addEventListener('mousedown', e => {
      this.mouseDown = true; this.devices.mouse = true; SW.Audio.init(); SW.TTS.init();
    });
    document.addEventListener('mouseup', () => { this.mouseDown = false; });
    // Touch support (Android/Tablet)
    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0];
      const r = canvas.getBoundingClientRect();
      this.mouseX = (t.clientX - r.left) / r.width * SW.W;
      this.mouseY = (t.clientY - r.top) / r.height * SW.H;
      this.mouseDown = true; this.devices.mouse = true;
      SW.Audio.init(); SW.TTS.init();
    }, {passive: false});
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const t = e.touches[0];
      const r = canvas.getBoundingClientRect();
      this.mouseX = (t.clientX - r.left) / r.width * SW.W;
      this.mouseY = (t.clientY - r.top) / r.height * SW.H;
    }, {passive: false});
    canvas.addEventListener('touchend', () => { this.mouseDown = false; });
  },

  pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (pad && pad.connected) { this.gamepadData = pad; this.devices.gamepad = true; return; }
    }
    this.gamepadData = null; this.devices.gamepad = false;
  },

  getLaserSlots() {
    let s = 1;
    if (this.devices.mouse) s++;
    if (this.devices.gamepad) s++;
    return Math.min(s, 3);
  },

  // Inertial: returns thrust direction (not velocity)
  getThrust() {
    let ix = 0, iy = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) iy -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) iy += 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) ix += 1;
    if (this.keys['ArrowLeft']) ix -= 1; // A = Autopilot
    if (this.gamepadData) {
      const ax = this.gamepadData.axes[0] || 0, ay = this.gamepadData.axes[1] || 0;
      if (Math.abs(ax) > 0.2) ix = ax;
      if (Math.abs(ay) > 0.2) iy = ay;
    }
    return { x: ix, y: iy };
  },

  getAimDirection() {
    let dx, dy, dz;
    if (SW.Engine && SW.Engine.view.mode === 'topdown') {
      // Top-Down: Ziel = Maus relativ zum Schiff (unten Mitte), vorne = +z
      const t = SW.Engine.view.top;
      dx = (this.mouseX - t.shipX) / (t.xScale * 80);
      dz = Math.max(0.35, (t.shipY - this.mouseY) / (t.zScale * 80));
      dy = 0;
      if (this.gamepadData) {
        const rax = this.gamepadData.axes[2] || 0, ray = this.gamepadData.axes[3] || 0;
        if (Math.abs(rax) > 0.1 || Math.abs(ray) > 0.1) { dx = rax * 2; dz = Math.max(0.35, -ray * 2); dy = 0; }
      }
      const lenT = Math.sqrt(dx*dx + dy*dy + dz*dz);
      return { x: dx/lenT, y: dy/lenT, z: dz/lenT };
    }
    dx = (this.mouseX - SW.CX) / SW.FOCAL; dy = (this.mouseY - SW.CY) / SW.FOCAL; dz = 1;
    if (this.gamepadData) {
      const rax = this.gamepadData.axes[2] || 0, ray = this.gamepadData.axes[3] || 0;
      if (Math.abs(rax) > 0.1 || Math.abs(ray) > 0.1) { dx = rax; dy = ray; }
    }
    const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
    return { x: dx/len, y: dy/len, z: dz/len };
  },

  getFirePressed() {
    return this.keys['Space'] || this.mouseDown ||
      (this.gamepadData && this.gamepadData.buttons[7] && this.gamepadData.buttons[7].pressed);
  },

  getAnyKeyPressed() { return Object.values(this.keys).some(v => v); }
};
