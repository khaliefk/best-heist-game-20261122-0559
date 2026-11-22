// All drawing for Velvet Vault: the room, the cones, the HUD and the screens.
// Procedural canvas art only, no image files.
import { COLORS, FIELD, TILE } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

/** The vision cone as a polygon, its rays stopped by walls, so cover reads. */
export function conePolygon(solid, cols, rows, x, y, angle, half, range) {
  const pts = [[x, y]];
  const steps = 24;
  for (let i = 0; i <= steps; i += 1) {
    const a = angle - half + (2 * half * i) / steps;
    let r = range;
    for (let d = 8; d < range; d += 8) {
      const tx = Math.floor((x + Math.cos(a) * d) / TILE);
      const ty = Math.floor((y + Math.sin(a) * d) / TILE);
      if (tx < 0 || ty < 0 || tx >= cols || ty >= rows || solid[ty * cols + tx] === 1) { r = d; break; }
    }
    pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
  }
  return pts;
}

function poly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, state, x, y, angle, half, range, fill) {
  poly(ctx, conePolygon(state.solid, 32, 18, x, y, angle, half, range));
  ctx.fillStyle = fill;
  ctx.fill();
}

export function drawWorld(ctx, state, now) {
  const level = state.level;
  // Floor: checkerboard carpet with a deep red runner down the middle.
  for (let ty = 0; ty < 18; ty += 1) {
    for (let tx = 0; tx < 32; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
      ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
    }
  }
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(0, 8 * TILE, FIELD.width, 2 * TILE);
  ctx.strokeStyle = COLORS.carpetEdge;
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 8 * TILE, FIELD.width, 2 * TILE);
  // Shadows: dark corners where detection is halved.
  for (let ty = 0; ty < 18; ty += 1) {
    for (let tx = 0; tx < 32; tx += 1) {
      if (state.shadow[ty * 32 + tx] === 1) {
        ctx.fillStyle = COLORS.shadow;
        ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
      }
    }
  }
  // Vents: a slow, hidden crawl duct along the walls.
  for (let ty = 0; ty < 18; ty += 1) {
    for (let tx = 0; tx < 32; tx += 1) {
      if (state.vent[ty * 32 + tx] === 1) {
        ctx.fillStyle = COLORS.vent;
        ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
        ctx.strokeStyle = COLORS.ventEdge;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx * TILE + 6, ty * TILE + TILE / 2);
        ctx.lineTo(tx * TILE + TILE - 6, ty * TILE + TILE / 2);
        ctx.stroke();
      }
    }
  }
  // Walls and crates.
  for (let ty = 0; ty < 18; ty += 1) {
    for (let tx = 0; tx < 32; tx += 1) {
      if (state.solid[ty * 32 + tx] !== 1) continue;
      const isCrate = level.crates.some(([cx, cy]) => cx === tx && cy === ty);
      ctx.fillStyle = isCrate ? COLORS.crate : COLORS.wall;
      ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
      ctx.fillStyle = isCrate ? COLORS.crateTop : COLORS.wallTop;
      ctx.fillRect(tx * TILE, ty * TILE, TILE, 8);
      if (isCrate) {
        ctx.strokeStyle = '#5d4326';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx * TILE + 5, ty * TILE + 5, TILE - 10, TILE - 10);
      }
    }
  }
  // The getaway door.
  const ex = level.exit;
  ctx.fillStyle = state.exitOpen ? COLORS.exit : '#2a7a4b';
  ctx.fillRect(ex.x * TILE, ex.y * TILE, ex.w * TILE, ex.h * TILE);
  ctx.fillStyle = '#0c2b18';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.exitOpen ? 'EXIT OPEN' : 'EXIT', (ex.x + ex.w / 2) * TILE, (ex.y + ex.h / 2) * TILE + 5);
  ctx.fillStyle = state.exitOpen ? '#eafff1' : '#9fd8b4';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(state.exitOpen ? '>>>' : '---', (ex.x + ex.w / 2) * TILE, (ex.y + ex.h / 2) * TILE + 26);

  // Loot.
  for (const l of state.loot) {
    if (l.taken) continue;
    const pulse = 1 + Math.sin(now * 3 + l.x) * 0.08;
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.scale(pulse, pulse);
    if (l.kind === 'vault') {
      ctx.fillStyle = '#7ee7ff';
      ctx.beginPath();
      ctx.moveTo(0, -14); ctx.lineTo(12, 0); ctx.lineTo(0, 14); ctx.lineTo(-12, 0);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -14); ctx.lineTo(6, 0); ctx.lineTo(0, 14); ctx.lineTo(-6, 0);
      ctx.closePath(); ctx.fill();
    } else if (l.kind === 'cash') {
      ctx.fillStyle = '#3ddc84';
      ctx.fillRect(-11, -7, 22, 14);
      ctx.fillStyle = '#0c5a30';
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
    } else if (l.kind === 'gold') {
      ctx.fillStyle = COLORS.loot;
      ctx.fillRect(-12, -5, 24, 10);
      ctx.fillStyle = '#a88400';
      ctx.fillRect(-12, -5, 24, 3);
    } else {
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(-13, -10, 26, 20);
      ctx.fillStyle = '#e8b64c';
      ctx.fillRect(-9, -6, 18, 12);
      ctx.fillStyle = '#7a3b2e';
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(l.label, l.x, l.y - 20);
  }

  // Cameras and their sweeping cones.
  for (const c of state.cameras) {
    drawCone(ctx, state, c.x, c.y, c.angle, 0.42, 225, c.disabledT > 0 ? 'rgba(120,120,120,0.08)' : COLORS.camCone);
    ctx.fillStyle = c.disabledT > 0 ? '#666' : COLORS.camera;
    ctx.beginPath(); ctx.arc(c.x, c.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.spotting ? '#ff4d3d' : '#222';
    ctx.beginPath(); ctx.arc(c.x + Math.cos(c.angle) * 6, c.y + Math.sin(c.angle) * 6, 4, 0, Math.PI * 2); ctx.fill();
    if (c.disabledT > 0) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OFF', c.x, c.y - 16);
    }
  }

  // Guards, cones, detection rings.
  for (const g of state.guards) {
    const hot = g.state === 'chase';
    drawCone(ctx, state, g.x, g.y, g.angle, 0.48, 235, hot ? COLORS.coneHot : COLORS.cone);
    ctx.fillStyle = COLORS.guardSuit;
    ctx.beginPath(); ctx.arc(g.x, g.y, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath(); ctx.arc(g.x, g.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd9d0';
    ctx.beginPath(); ctx.arc(g.x + Math.cos(g.angle) * 7, g.y + Math.sin(g.angle) * 7, 4, 0, Math.PI * 2); ctx.fill();
    if (g.detection > 0.05) {
      ctx.strokeStyle = g.detection >= 1 ? '#ff4d3d' : '#ffb020';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g.detection);
      ctx.stroke();
    }
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    if (g.state === 'chase') { ctx.fillStyle = '#ff4d3d'; ctx.fillText('!', g.x, g.y - 24); }
    else if (g.state === 'suspicious' || g.state === 'search') { ctx.fillStyle = '#ffb020'; ctx.fillText('?', g.x, g.y - 24); }
  }

  // Smoke clouds and decoy watches.
  for (const c of state.smokeClouds) {
    ctx.fillStyle = COLORS.smoke;
    ctx.beginPath(); ctx.arc(c.x, c.y, 95, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(c.x - 30, c.y + 18, 55, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(c.x + 32, c.y - 14, 50, 0, Math.PI * 2); ctx.fill();
  }
  for (const d of state.decoys) {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(d.x, d.y, 8 + (3 - d.t) * 6, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(d.x, d.y, 5, 0, Math.PI * 2); ctx.fill();
  }

  // The thief: Rook, in a gold-trimmed coat and a wide hat.
  const p = state.player;
  const blink = p.invuln > 0 && Math.floor(now * 8) % 2 === 0;
  if (!blink) {
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 17, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = COLORS.playerCoat;
    ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.player;
    ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b2118';
    ctx.fillRect(p.x - 13, p.y - 8, 26, 5);
    ctx.fillRect(p.x - 6, p.y - 15, 12, 9);
    if (p.sneaking) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SNEAK', p.x, p.y - 22);
    }
  }
}

export function drawHud(ctx, state, best) {
  ctx.fillStyle = 'rgba(10, 8, 16, 0.88)';
  ctx.fillRect(0, 0, FIELD.width, 46);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(state.level.name, 14, 20);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = COLORS.dim;
  ctx.fillText(`Score $${state.score}   Loot ${state.lootTaken}/${state.loot.length}   Best $${best}`, 14, 38);
  // Alarm meter.
  const ax = 560;
  const aw = 300;
  ctx.fillStyle = '#000';
  ctx.fillRect(ax, 10, aw, 26);
  const frac = state.alarm / 100;
  ctx.fillStyle = frac < 0.4 ? COLORS.alarmLow : frac < 0.7 ? COLORS.alarmMid : COLORS.alarmHigh;
  ctx.fillRect(ax + 2, 12, (aw - 4) * frac, 22);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(ax, 10, aw, 26);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`ALARM ${Math.round(state.alarm)}%${state.lockdown ? '  LOCKDOWN' : ''}`, ax + 8, 28);
  // Lives, tools, clock.
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('♥'.repeat(Math.max(0, state.lives)), 920, 28);
  ctx.font = '13px sans-serif';
  ctx.fillText(`⌚ ${state.tools.decoys}   💨 ${state.tools.smoke}   ⚡ ${state.tools.emp}   ${Math.floor(state.time / 60)}:${String(Math.floor(state.time % 60)).padStart(2, '0')}`, 1266, 20);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '12px sans-serif';
  ctx.fillText('Click: watch  •  Q: smoke  •  E: EMP  •  C: sneak  •  Shift: run', 1266, 38);
  if (state.messageT > 0 && state.message) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(10, 8, 16, 0.85)';
    const w = ctx.measureText(state.message).width + 30;
    ctx.fillRect((FIELD.width - w) / 2, 56, w, 30);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(state.message, FIELD.width / 2, 77);
  }
}

function panel(ctx, title, lines, hint) {
  ctx.fillStyle = 'rgba(8, 6, 14, 0.82)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = '#241f33';
  roundRect(ctx, 290, 110, 700, 500, 14);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.player;
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(title, FIELD.width / 2, 185);
  ctx.fillStyle = COLORS.text;
  ctx.font = '17px sans-serif';
  let y = 235;
  for (const line of lines) {
    ctx.fillText(line, FIELD.width / 2, y);
    y += 30;
  }
  if (hint) {
    ctx.fillStyle = COLORS.dim;
    ctx.font = '15px sans-serif';
    ctx.fillText(hint, FIELD.width / 2, 560);
  }
}

export function drawScreen(ctx, screen, state, best, now) {
  drawWorld(ctx, state, now);
  drawHud(ctx, state, best);
  if (screen === SCREEN_TITLE) {
    panel(ctx, 'VELVET VAULT', [
      'You are Rook, a thief with one night and three rooms.',
      'Cross each room, lift the vault loot, and reach the green door.',
      'Guards patrol with vision cones. Cameras sweep the floor.',
      'Shadows hide you. Vents hide you better. Running is loud.',
      'Click tosses a ticking watch. Q drops smoke. E fires the EMP (-$400).',
      'The alarm climbs while anyone sees you. At 70% the door seals.',
      'Grab the side loot if you dare. Leave unseen for a $500 ghost bonus.',
    ], 'Press SPACE or click to start  •  WASD / arrows to move  •  C sneak  •  Shift run');
  } else if (screen === SCREEN_PAUSE) {
    panel(ctx, 'PAUSED', ['The crew is holding its breath.', 'The guards keep their patrols.'], 'Press P or Esc to carry on');
  } else if (screen === SCREEN_CLEAR) {
    panel(ctx, 'CLEAN GETAWAY', [
      `${state.level.name} cleared.`,
      `Score so far: $${state.score}`,
      'One room down. The next one watches harder.',
    ], 'Press SPACE for the next job');
  } else if (screen === SCREEN_WIN) {
    panel(ctx, 'THE VAULT IS EMPTY', [
      'Three rooms, three vaults, and nobody saw a thing that mattered.',
      `Final score: $${state.score}   Best: $${Math.max(best, state.score)}`,
      'Rook walks out into the night with the Star Sapphire.',
    ], 'Press SPACE to run it back');
  } else if (screen === SCREEN_OVER) {
    panel(ctx, 'CAUGHT', [
      'The crew is in the van. You are in a cell.',
      `Score: $${state.score}`,
    ], 'Press SPACE to try the night again');
  }
}
