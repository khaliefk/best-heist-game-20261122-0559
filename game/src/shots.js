// The screenshot scenes behind ?shot=start|play|alert|win. Each one plays the
// real rules forward from a fresh world, steered by a simple autopilot that
// walks toward the nearest loot and waits rather than cross a vision cone,
// so the frame is what a short game really looks like and the same seed
// always gives the same frame.
import { FIELD, STEP, TILE } from './config.js';
import { EVENT_LEVEL_CLEAR, EVENT_WIN, lineClear } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 22;

const DIRS = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

function angleDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/** How exposed the point (x, y) is: 0 when no cone or camera reaches it. */
function pointExposure(state, x, y) {
  let worst = 0;
  const watchers = [];
  for (const g of state.guards) watchers.push({ x: g.x, y: g.y, angle: g.angle, range: 235, half: 0.48 });
  for (const c of state.cameras) {
    if (c.disabledT > 0) continue;
    watchers.push({ x: c.x, y: c.y, angle: c.angle, range: 225, half: 0.42 });
  }
  for (const w of watchers) {
    const dx = x - w.x;
    const dy = y - w.y;
    const dist = Math.hypot(dx, dy);
    if (dist > w.range) continue;
    if (dist > 1 && angleDiff(w.angle, Math.atan2(dy, dx)) > w.half) continue;
    if (!lineClear(state.solid, w.x, w.y, x, y)) continue;
    worst = Math.max(worst, 1 - dist / 400);
    if (dist < 70) worst = Math.max(worst, 1.5);
  }
  return worst;
}

/** The autopilot: of the nine ways to move, the one closest to the target that no cone sees. */
function autopilot(world) {
  const state = world.state;
  const p = state.player;
  let target = null;
  let targetDist = Infinity;
  for (const l of state.loot) {
    if (l.taken) continue;
    const d = Math.hypot(l.x - p.x, l.y - p.y);
    if (d < targetDist) { targetDist = d; target = l; }
  }
  if (!target || state.vaultTaken) target = { x: (state.level.exit.x + 0.5) * TILE, y: (state.level.exit.y + 1) * TILE };
  let best = DIRS[0];
  let bestScore = Infinity;
  for (const [dx, dy] of DIRS) {
    const x = p.x + dx * 30;
    const y = p.y + dy * 30;
    if (x < TILE || y < TILE || x > FIELD.width - TILE || y > FIELD.height - TILE) continue;
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    if (state.solid[ty * 32 + tx] === 1) continue;
    let score = Math.hypot(target.x - x, target.y - y);
    score += pointExposure(state, x, y) * 2500;
    score += pointExposure(state, x + dx * 30, y + dy * 30) * 1200;
    for (const g of state.guards) {
      const d = Math.hypot(g.x - x, g.y - y);
      if (d < 160) score += (160 - d) * 14;
    }
    if (score < bestScore) { bestScore = score; best = [dx, dy]; }
  }
  // Sneak whenever the pilot is anywhere a cone can reach: slow, but the
  // cones sweep past before the thief is ever really seen.
  const sneak = pointExposure(state, p.x, p.y) > 0 || pointExposure(state, p.x + best[0] * 30, p.y + best[1] * 30) > 0;
  return { mx: best[0], my: best[1], run: false, sneak, throwDecoy: null, smoke: false, emp: false };
}

const IDLE = { mx: 0, my: 0, run: false, sneak: false, throwDecoy: null, smoke: false, emp: false };

/**
 * Set `world` to the named scene (start, play, alert or win; any other name
 * is start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  const { state } = world;
  world.resetRun();
  if (name === 'win') {
    world.loadLevel(2);
    for (const l of world.state.loot) l.taken = true;
    world.state.lootTaken = world.state.loot.length;
    world.state.vaultTaken = true;
    world.state.exitOpen = true;
    world.state.score = 2450;
    world.state.player.x = world.state.level.exit.x * TILE + 70;
    world.state.player.y = (world.state.level.exit.y + 1) * TILE;
    return { screen: SCREEN_WIN, best: 2450 };
  }
  if (name === 'alert') {
    for (let i = 0; i < 3 / STEP; i += 1) world.step(STEP, IDLE);
    const guard = world.state.guards[0];
    world.state.player.x = guard.x + Math.cos(guard.angle) * 120;
    world.state.player.y = guard.y + Math.sin(guard.angle) * 120;
    guard.detection = 0.7;
    guard.state = 'suspicious';
    guard.target.x = world.state.player.x;
    guard.target.y = world.state.player.y;
    guard.searchT = 3;
    world.state.alarm = 58;
    for (let i = 0; i < 0.25 / STEP; i += 1) world.step(STEP, IDLE);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'play') {
    for (let i = 0; i < PLAY_SECONDS / STEP; i += 1) {
      const events = world.step(STEP, autopilot(world));
      if (events & (EVENT_LEVEL_CLEAR | EVENT_WIN)) break;
    }
    return { screen: world.state.lives === 0 ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
  }
  for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, IDLE);
  return { screen: SCREEN_TITLE, best: 0 };
}
