// Tuning numbers and colours for Velvet Vault. One place holds every number
// the rules and the drawing both read, so a balance change never needs a hunt.
export const TILE = 40;
export const COLS = 32;
export const ROWS = 18;
export const FIELD = { width: COLS * TILE, height: ROWS * TILE };
export const STEP = 1 / 60;

export const PLAYER_SPEED = 165;
export const PLAYER_RUN_MULT = 1.55;
export const PLAYER_SNEAK_MULT = 0.55;
export const PLAYER_RADIUS = 13;

export const GUARD_SPEED = 92;
export const GUARD_CHASE_SPEED = 148;
export const GUARD_CONE_RANGE = 235;
export const GUARD_CONE_HALF = 0.48;
export const CAMERA_RANGE = 225;
export const CAMERA_CONE_HALF = 0.42;

export const ALARM_MAX = 100;
export const ALARM_DECAY = 7;
export const LOCKDOWN_AT = 70;
export const GHOST_BELOW = 25;

export const TOOLS = {
  decoys: 3,
  smoke: 2,
  emp: 1,
  empScoreCost: 400,
  decoyRadius: 260,
  smokeRadius: 95,
  smokeSeconds: 4,
  empSeconds: 8,
};

export const COLORS = {
  floor: '#1c1a26',
  floorAlt: '#211e2e',
  carpet: '#3a2333',
  carpetEdge: '#5c2f4d',
  wall: '#4a4458',
  wallTop: '#6b6480',
  crate: '#7a5a34',
  crateTop: '#9c7748',
  shadow: '#14121d',
  vent: '#2c3a4a',
  ventEdge: '#4d6a86',
  player: '#ffd166',
  playerCoat: '#2b2118',
  guard: '#e4572e',
  guardSuit: '#3d2b2b',
  camera: '#c9d1d9',
  cone: 'rgba(255, 214, 90, 0.20)',
  coneHot: 'rgba(255, 90, 60, 0.30)',
  camCone: 'rgba(120, 200, 255, 0.18)',
  loot: '#ffd700',
  exit: '#3ddc84',
  smoke: 'rgba(200, 200, 210, 0.55)',
  hudBg: '#12101a',
  text: '#f2ead8',
  dim: '#a89f8d',
  alarmLow: '#3ddc84',
  alarmMid: '#ffb020',
  alarmHigh: '#ff4d3d',
};
