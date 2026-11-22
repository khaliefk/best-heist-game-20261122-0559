// Boot and the fixed-step loop for Velvet Vault. Screens: title, play, pause,
// level clear, win, game over. With ?shot=start|play|alert|win the page
// stages that scene from the real rules and holds it for a screenshot.
import { FIELD, STEP } from './config.js';
import { createWorld, EVENT_ALARM, EVENT_CAUGHT, EVENT_GAME_OVER, EVENT_LEVEL_CLEAR, EVENT_LOOT, EVENT_TOOL, EVENT_WIN } from './world.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { drawScreen, SCREEN_CLEAR, SCREEN_OVER, SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const world = createWorld();
const input = createInput(canvas);
const audio = createAudio();
input.attach();

let best = 0;
try { best = Number(window.localStorage.getItem('velvet-vault-best') || 0) || 0; } catch { best = 0; }
function saveBest() {
  try { window.localStorage.setItem('velvet-vault-best', String(best)); } catch { /* offline play, no storage */ }
}

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
let screen = SCREEN_TITLE;
let staged = null;
if (shotName) {
  staged = stageShot(shotName, world);
  screen = staged.screen;
  best = Math.max(best, staged.best);
}
if (!shotName) world.resetRun();

let last = performance.now();
let acc = 0;

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function handleEvents(events) {
  const s = world.state;
  if (events & EVENT_LOOT) {
    audio.loot();
    if (s.vaultTaken) audio.vault();
    announce(`Loot taken. Score $${s.score}.`);
  }
  if (events & EVENT_TOOL) audio.tool();
  if (events & EVENT_ALARM) audio.alarm();
  if (events & EVENT_CAUGHT) {
    audio.caught();
    announce(s.lives > 0 ? `Caught. ${s.lives} lives left.` : 'Caught. Game over.');
  }
  if (events & EVENT_LEVEL_CLEAR) {
    audio.clear();
    best = Math.max(best, s.score);
    saveBest();
    screen = SCREEN_CLEAR;
    announce(`${s.level.name} cleared. Score $${s.score}.`);
  }
  if (events & EVENT_WIN) {
    audio.clear();
    best = Math.max(best, s.score);
    saveBest();
    screen = SCREEN_WIN;
    announce(`You cleared all three jobs. Final score $${s.score}.`);
  }
  if (events & EVENT_GAME_OVER) {
    audio.caught();
    best = Math.max(best, s.score);
    saveBest();
    screen = SCREEN_OVER;
    announce('Caught. Game over.');
  }
}

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (!shotName) {
    if (input.consume(' ') || input.consume('Enter') || input.consume('click')) {
      audio.unlock();
      if (screen === SCREEN_TITLE) { world.resetRun(); screen = SCREEN_PLAY; }
      else if (screen === SCREEN_CLEAR) { world.loadLevel(world.state.levelIndex + 1); screen = SCREEN_PLAY; }
      else if (screen === SCREEN_WIN || screen === SCREEN_OVER) { world.resetRun(); screen = SCREEN_PLAY; }
    }
    if (input.consume('p') || input.consume('Escape')) {
      if (screen === SCREEN_PLAY) screen = SCREEN_PAUSE;
      else if (screen === SCREEN_PAUSE) screen = SCREEN_PLAY;
    }
    if (screen === SCREEN_PLAY) {
      acc += dt;
      while (acc >= STEP) {
        acc -= STEP;
        handleEvents(world.step(STEP, input.poll()));
        if (screen !== SCREEN_PLAY) break;
      }
    }
    input.clearPressed();
  }
  drawScreen(ctx, screen, world.state, best, now / 1000);
  requestAnimationFrame(frame);
}

canvas.width = FIELD.width;
canvas.height = FIELD.height;
requestAnimationFrame(frame);
