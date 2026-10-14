// ===== SOLO WING 1990 — CONFIG & CONSTANTS =====
const SW = window.SW1990 = window.SW1990 || {};

// VGA-Auflösung: intern 640×400, virtuell 320×200 (ctx.scale(2,2))
SW.W = 320; SW.H = 200;
SW.CANVAS_W = 640; SW.CANVAS_H = 400;
SW.VGA_SCALE = 2;
SW.FOCAL = 120; SW.CX = 160; SW.CY = 100;

// Player (Inertial Physik: Thrust + Drift)
SW.PLAYER_THRUST = 0.4;
SW.PLAYER_DRAG = 0.96;
SW.PLAYER_MAX_SPEED = 4;
SW.PLAYER_MAX_X = 200; SW.PLAYER_MAX_Y = 150;
SW.SHIELD_MAX = 100; SW.SHIELD_REGEN_DELAY = 60;
SW.LASER_COOLDOWN = 15; SW.LASER_SPEED = 12; SW.LASER_DAMAGE = 25;

// Enemy
SW.ENEMY_SPEED = 1.5; SW.ENEMY_HP = 50; SW.ENEMY_LASER_SPEED = 8;
SW.ENEMY_LASER_DAMAGE = 10; SW.ENEMY_FIRE_MIN = 60; SW.ENEMY_FIRE_MAX = 90;

// World
SW.COLLISION_DIST = 5; SW.STAR_COUNT = 100; SW.STAR_SPEED = 2;
SW.WAVE_SPACING = 400; SW.EXPLOSION_FRAMES = 20;
SW.FIRST_WAVE_DELAY = 300; // entspannter Start

// Autopilot
SW.AUTOPILOT_SPEED = 2.5; SW.AUTOPILOT_TOLERANCE = 3;

// Flight
SW.FLIGHT_SPEED = 4; SW.CARRIER_Z = 80; SW.CARRIER_X = 0; SW.CARRIER_Y = 10;

// IM RAUM (v0.75-dev): Vorschub + Nachbrenner [SHIFT]
// Speed-Gefühl: Sternenfeld-Flow hängt an der Vorschub-Geschwindigkeit,
// Sternengleit beim Driften, Banken (Wankwinkel) an der Seitengeschwindigkeit.
SW.FORWARD_BASE = 2.2;      // Cruise (px/Frame)
SW.FORWARD_BURN = 5.5;      // Nachbrenner
SW.FORWARD_ACCEL = 0.05;    // Glättung hin zur Zielgeschwindigkeit
SW.STAR_LATERAL = 1.0;      // Sternengleit beim Driften (Parallax-Faktor)
SW.BANK_FACTOR = 0.05;      // Blick wankt mit der Seitengeschwindigkeit
SW.CARRIER_FIELD_Z = 420;   // Träger im Feld nach dem Takeoff (relatives z)

// Roll (Q/E) — reine Sicht-Rotation im Cockpit
SW.ROLL_SPEED = 0.06; SW.ROLL_MAX = 0.7; SW.ROLL_DECAY = 0.9;

// Feature-Flags (Release: cheatEnabled = false)
SW.Config = {
  cheatEnabled: true  // Cheatmenü im ESC-Menü [1]/[2]
};
