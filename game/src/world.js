// The rules of Velvet Vault: patrols, vision cones, cameras, the alarm,
// tools with a cost, loot, and the getaway. No drawing here, no DOM.
import {
  ALARM_DECAY, ALARM_MAX, CAMERA_CONE_HALF, CAMERA_RANGE, COLS, FIELD,
  GUARD_CHASE_SPEED, GUARD_CONE_HALF, GUARD_CONE_RANGE, GUARD_SPEED,
  LOCKDOWN_AT, PLAYER_RADIUS, PLAYER_RUN_MULT, PLAYER_SNEAK_MULT,
  PLAYER_SPEED, ROWS, STEP, TILE, TOOLS,
} from './config.js';
import { LEVELS } from './levels.js';

export const EVENT_NONE = 0;
export const EVENT_LOOT = 1;
export const EVENT_CAUGHT = 2;
export const EVENT_LEVEL_CLEAR = 4;
export const EVENT_WIN = 8;
export const EVENT_GAME_OVER = 16;
export const EVENT_ALARM = 32;
export const EVENT_TOOL = 64;

function angleDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/** True when no solid tile stands between two points. */
export function lineClear(solid, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const tx = Math.floor((ax + dx * t) / TILE);
    const ty = Math.floor((ay + dy * t) / TILE);
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return false;
    if (solid[ty * COLS + tx] === 1) return false;
  }
  return true;
}

function tileAt(solid, x, y) {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return 1;
  return solid[ty * COLS + tx];
}

function moveCircle(solid, p, dx, dy, radius) {
  let nx = p.x + dx;
  if (tileAt(solid, nx + Math.sign(dx) * radius, p.y - radius * 0.7) === 0
    && tileAt(solid, nx + Math.sign(dx) * radius, p.y + radius * 0.7) === 0
    && tileAt(solid, nx + Math.sign(dx) * radius, p.y) === 0) p.x = nx;
  let ny = p.y + dy;
  if (tileAt(solid, p.x - radius * 0.7, ny + Math.sign(dy) * radius) === 0
    && tileAt(solid, p.x + radius * 0.7, ny + Math.sign(dy) * radius) === 0
    && tileAt(solid, p.x, ny + Math.sign(dy) * radius) === 0) p.y = ny;
  p.x = Math.max(radius, Math.min(FIELD.width - radius, p.x));
  p.y = Math.max(radius, Math.min(FIELD.height - radius, p.y));
}

export function createWorld() {
  const world = {
    state: null,
    loadLevel(index) {
      const level = LEVELS[index];
      const solid = new Uint8Array(COLS * ROWS);
      const shadow = new Uint8Array(COLS * ROWS);
      const vent = new Uint8Array(COLS * ROWS);
      for (let x = 0; x < COLS; x += 1) {
        solid[x] = 1; solid[(ROWS - 1) * COLS + x] = 1;
      }
      for (let y = 0; y < ROWS; y += 1) {
        solid[y * COLS] = 1; solid[y * COLS + COLS - 1] = 1;
      }
      for (const [x, y, w, h] of level.walls) {
        for (let ty = y; ty < y + h; ty += 1) for (let tx = x; tx < x + w; tx += 1) solid[ty * COLS + tx] = 1;
      }
      for (const [x, y] of level.crates) solid[y * COLS + x] = 1;
      for (const [x, y, w, h] of level.shadows) {
        for (let ty = y; ty < y + h; ty += 1) for (let tx = x; tx < x + w; tx += 1) shadow[ty * COLS + tx] = 1;
      }
      for (const [x, y, w, h] of level.vents) {
        for (let ty = y; ty < y + h; ty += 1) for (let tx = x; tx < x + w; tx += 1) vent[ty * COLS + tx] = 1;
      }
      // The exit door and the vent mouths are passable, never solid.
      for (let ty = level.exit.y; ty < level.exit.y + level.exit.h; ty += 1) solid[ty * COLS + level.exit.x] = 0;
      this.state = {
        levelIndex: index,
        level,
        solid,
        shadow,
        vent,
        player: { x: level.playerStart.x, y: level.playerStart.y, sneaking: false, running: false, invuln: 0 },
        guards: level.guards.map((g) => ({
          x: g.waypoints[0].x, y: g.waypoints[0].y, angle: 0,
          waypoints: g.waypoints, wp: 1, pause: g.pause, pauseT: 0,
          state: 'patrol', detection: 0, target: { x: 0, y: 0 }, searchT: 0, chaseT: 0,
        })),
        cameras: level.cameras.map((c) => ({
          x: c.at.x, y: c.at.y, base: c.base, sweep: c.sweep, speed: c.speed,
          angle: c.base, t: Math.random() * 6, disabledT: 0, spotting: false,
        })),
        loot: level.loot.map((l) => ({ ...l, taken: false })),
        exitOpen: false,
        vaultTaken: false,
        lootTaken: 0,
        score: this.state ? this.state.score : 0,
        lives: this.state ? this.state.lives : 3,
        alarm: 0,
        alarmPeak: 0,
        time: 0,
        tools: { decoys: TOOLS.decoys, smoke: TOOLS.smoke, emp: TOOLS.emp },
        smokeClouds: [],
        decoys: [],
        empT: 0,
        lockdown: false,
        message: '',
        messageT: 0,
      };
      const s = this.state;
      s.player.x = level.playerStart.x;
      s.player.y = level.playerStart.y;
    },
    resetRun() {
      this.loadLevel(0);
      this.state.score = 0;
      this.state.lives = 3;
    },
    inShadow(x, y) {
      const s = this.state;
      return s.shadow[Math.floor(y / TILE) * COLS + Math.floor(x / TILE)] === 1;
    },
    inVent(x, y) {
      const s = this.state;
      return s.vent[Math.floor(y / TILE) * COLS + Math.floor(x / TILE)] === 1;
    },
    inSmoke(x, y) {
      const s = this.state;
      return s.smokeClouds.some((c) => Math.hypot(c.x - x, c.y - y) < TOOLS.smokeRadius);
    },
    /** How visible the player is to a watcher at (wx, wy): 0 means unseen. */
    visibility(wx, wy, range, halfAngle, angle) {
      const s = this.state;
      const p = s.player;
      if (p.invuln > 0) return 0;
      const dx = p.x - wx;
      const dy = p.y - wy;
      const dist = Math.hypot(dx, dy);
      if (dist > range) return 0;
      if (dist > 1 && angleDiff(angle, Math.atan2(dy, dx)) > halfAngle) return 0;
      if (!lineClear(s.solid, wx, wy, p.x, p.y)) return 0;
      if (this.inSmoke(p.x, p.y) || this.inSmoke(wx, wy)) return 0;
      if (this.inVent(p.x, p.y) && dist > 55) return 0;
      let v = 1 - (dist / range) * 0.6;
      if (this.inShadow(p.x, p.y)) v *= 0.5;
      if (p.sneaking) v *= 0.45;
      if (p.running) v *= 1.25;
      return Math.min(1.4, Math.max(0, v));
    },
    step(dt, input) {
      const s = this.state;
      let events = EVENT_NONE;
      s.time += dt;
      if (s.messageT > 0) s.messageT -= dt;
      if (s.player.invuln > 0) s.player.invuln -= dt;
      if (s.empT > 0) s.empT -= dt;
      for (const c of s.smokeClouds) c.t -= dt;
      s.smokeClouds = s.smokeClouds.filter((c) => c.t > 0);
      for (const d of s.decoys) d.t -= dt;
      s.decoys = s.decoys.filter((d) => d.t > 0);

      // Tools, each with a cost: a decoy is free but limited, smoke is limited,
      // the EMP costs score and is the only way to blind cameras.
      if (input.throwDecoy && s.tools.decoys > 0) {
        s.tools.decoys -= 1;
        s.decoys.push({ x: input.throwDecoy.x, y: input.throwDecoy.y, t: 3 });
        for (const g of s.guards) {
          if (Math.hypot(g.x - input.throwDecoy.x, g.y - input.throwDecoy.y) < TOOLS.decoyRadius) {
            g.state = 'suspicious'; g.target = { ...input.throwDecoy }; g.searchT = 3;
          }
        }
        events |= EVENT_TOOL;
      }
      if (input.smoke && s.tools.smoke > 0) {
        s.tools.smoke -= 1;
        s.smokeClouds.push({ x: s.player.x, y: s.player.y, t: TOOLS.smokeSeconds });
        events |= EVENT_TOOL;
      }
      if (input.emp && s.tools.emp > 0 && s.empT <= 0) {
        s.tools.emp -= 1;
        s.empT = TOOLS.empSeconds;
        s.score = Math.max(0, s.score - TOOLS.empScoreCost);
        for (const c of s.cameras) c.disabledT = TOOLS.empSeconds;
        s.message = 'EMP fired: cameras blind for 8s (-$400)';
        s.messageT = 2.5;
        events |= EVENT_TOOL;
      }

      // Player movement.
      const p = s.player;
      p.sneaking = !!input.sneak;
      p.running = !!input.run && !p.sneaking;
      let speed = PLAYER_SPEED * (p.running ? PLAYER_RUN_MULT : p.sneaking ? PLAYER_SNEAK_MULT : 1);
      if (this.inVent(p.x, p.y)) speed *= 0.6;
      const len = Math.hypot(input.mx, input.my);
      if (len > 0) moveCircle(s.solid, p, (input.mx / len) * speed * dt, (input.my / len) * speed * dt, PLAYER_RADIUS);
      // Running is loud: guards nearby come to look.
      if (p.running && len > 0) {
        for (const g of s.guards) {
          if (g.state === 'patrol' && Math.hypot(g.x - p.x, g.y - p.y) < 150) {
            g.state = 'suspicious'; g.target = { x: p.x, y: p.y }; g.searchT = 2;
          }
        }
      }

      // Guards.
      let anyoneSees = false;
      let worstSee = 0;
      for (const g of s.guards) {
        const see = this.visibility(g.x, g.y, GUARD_CONE_RANGE, GUARD_CONE_HALF, g.angle);
        if (see > 0) {
          anyoneSees = true;
          worstSee = Math.max(worstSee, see);
          g.detection = Math.min(1, g.detection + dt * (0.55 + see * 0.9));
          g.target = { x: p.x, y: p.y };
          if (g.detection >= 1 && g.state !== 'chase') {
            g.state = 'chase'; g.chaseT = 4;
            s.message = 'SPOTTED! Run or break line of sight!';
            s.messageT = 1.6;
          }
        } else {
          g.detection = Math.max(0, g.detection - dt * 0.5);
          if (g.detection > 0.55 && g.state === 'patrol') g.state = 'suspicious';
        }
        if (g.state === 'chase') {
          g.chaseT -= dt;
          const dx = p.x - g.x;
          const dy = p.y - g.y;
          const d = Math.hypot(dx, dy);
          if (d > 1) {
            const sp = GUARD_CHASE_SPEED * (s.lockdown ? 1.15 : 1);
            moveCircle(s.solid, g, (dx / d) * sp * dt, (dy / d) * sp * dt, 13);
            g.angle = Math.atan2(dy, dx);
          }
          if (d < 26 && p.invuln <= 0) {
            events |= this.caught();
            if (events & (EVENT_GAME_OVER | EVENT_LEVEL_CLEAR)) return events;
          }
          if (see <= 0 && g.chaseT <= 0) { g.state = 'search'; g.searchT = 3; }
        } else if (g.state === 'suspicious' || g.state === 'search') {
          g.searchT -= dt;
          const dx = g.target.x - g.x;
          const dy = g.target.y - g.y;
          const d = Math.hypot(dx, dy);
          if (d > 24) {
            moveCircle(s.solid, g, (dx / d) * GUARD_SPEED * 1.25 * dt, (dy / d) * GUARD_SPEED * 1.25 * dt, 13);
            g.angle = Math.atan2(dy, dx);
          } else {
            g.angle += dt * 1.5;
          }
          if (g.searchT <= 0) { g.state = 'patrol'; g.detection = Math.max(0, g.detection - 0.3); }
        } else {
          // Patrol: walk the waypoints, pause and look around at each one.
          if (g.pauseT > 0) {
            g.pauseT -= dt;
            g.angle += dt * 0.9;
          } else {
            const wp = g.waypoints[g.wp];
            const dx = wp.x - g.x;
            const dy = wp.y - g.y;
            const d = Math.hypot(dx, dy);
            if (d < 10) {
              g.wp = (g.wp + 1) % g.waypoints.length;
              g.pauseT = g.pause;
            } else {
              moveCircle(s.solid, g, (dx / d) * GUARD_SPEED * dt, (dy / d) * GUARD_SPEED * dt, 13);
              g.angle = Math.atan2(dy, dx);
            }
          }
        }
      }

      // Cameras sweep. A camera that spots the player raises the alarm fast
      // and sends the nearest guard to investigate.
      for (const c of s.cameras) {
        c.t += dt;
        c.angle = c.base + Math.sin(c.t * c.speed) * c.sweep;
        if (c.disabledT > 0) { c.disabledT -= dt; c.spotting = false; continue; }
        const see = this.visibility(c.x, c.y, CAMERA_RANGE, CAMERA_CONE_HALF, c.angle);
        c.spotting = see > 0;
        if (see > 0) {
          anyoneSees = true;
          worstSee = Math.max(worstSee, see);
          s.alarm = Math.min(ALARM_MAX, s.alarm + dt * (10 + see * 16));
          let nearest = null;
          let nd = Infinity;
          for (const g of s.guards) {
            const d = Math.hypot(g.x - p.x, g.y - p.y);
            if (d < nd) { nd = d; nearest = g; }
          }
          if (nearest && nearest.state === 'patrol') {
            nearest.state = 'suspicious'; nearest.target = { x: p.x, y: p.y }; nearest.searchT = 3;
          }
        }
      }

      // The alarm climbs while anyone sees the thief, falls when hidden.
      if (anyoneSees) {
        s.alarm = Math.min(ALARM_MAX, s.alarm + dt * worstSee * 9);
        if (s.alarm >= LOCKDOWN_AT && !s.lockdown) {
          s.lockdown = true;
          s.exitOpen = false;
          s.message = 'LOCKDOWN! The getaway door is sealed until the alarm drops.';
          s.messageT = 3;
          events |= EVENT_ALARM;
        }
      } else {
        s.alarm = Math.max(0, s.alarm - dt * ALARM_DECAY);
        if (s.lockdown && s.alarm < 50) {
          s.lockdown = false;
          if (s.vaultTaken) s.exitOpen = true;
          s.message = 'Lockdown lifted. The door is open again.';
          s.messageT = 2;
        }
      }
      s.alarmPeak = Math.max(s.alarmPeak, s.alarm);

      // Loot.
      for (const l of s.loot) {
        if (!l.taken && Math.hypot(l.x - p.x, l.y - p.y) < 28) {
          l.taken = true;
          s.lootTaken += 1;
          s.score += l.value;
          events |= EVENT_LOOT;
          if (l.kind === 'vault') {
            s.vaultTaken = true;
            if (!s.lockdown) s.exitOpen = true;
            s.message = `${l.label} secured! Get to the green getaway door!`;
            s.messageT = 3;
          } else {
            s.message = `+ $${l.value} ${l.label}`;
            s.messageT = 1.5;
          }
        }
      }

      // Getaway: the exit only counts once the vault loot is taken. The
      // player counts as out when they step into the door's tiles.
      if (s.exitOpen) {
        const ex = s.level.exit;
        const inDoorX = p.x < (ex.x + ex.w) * TILE + 12;
        const inDoorY = p.y > ex.y * TILE - 6 && p.y < (ex.y + ex.h) * TILE + 6;
        if (inDoorX && inDoorY) {
          const timeBonus = Math.max(0, Math.round((s.level.parSeconds - s.time) * 10));
          const ghost = s.alarmPeak < 25 ? 500 : 0;
          s.score += timeBonus + ghost;
          if (s.levelIndex >= LEVELS.length - 1) {
            events |= EVENT_WIN;
          } else {
            events |= EVENT_LEVEL_CLEAR;
          }
          return events;
        }
      }
      return events;
    },
    caught() {
      const s = this.state;
      s.lives -= 1;
      s.alarm = 40;
      s.lockdown = false;
      if (s.lives <= 0) return EVENT_CAUGHT | EVENT_GAME_OVER;
      s.player.x = s.level.playerStart.x;
      s.player.y = s.level.playerStart.y;
      s.player.invuln = 2;
      for (const g of s.guards) {
        g.x = g.waypoints[0].x; g.y = g.waypoints[0].y;
        g.wp = 1; g.state = 'patrol'; g.detection = 0; g.pauseT = 0;
      }
      s.message = 'Caught! Back at the door, one life down.';
      s.messageT = 2.5;
      return EVENT_CAUGHT;
    },
  };
  return world;
}

export { STEP };
