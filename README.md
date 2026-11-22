[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/khaliefk/best-heist-game-20261122-0559/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/khaliefk/best-heist-game-20261122-0559/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)

# Velvet Vault

A top-down heist game that runs offline in a desktop browser from static files.
You are Rook, a thief with one night and three rooms. Cross each room, lift the
vault loot, and slip out the green getaway door before the alarm peaks.

## How it plays

- **Guards patrol with vision cones.** Step into a cone and a detection ring
  fills above the guard. Fill it all the way and he chases you. If he catches
  you, you lose a life and wake up back at the door.
- **Cameras sweep the floor.** Their blue cones work like a guard's, and a
  camera that spots you raises the alarm fast and sends the nearest guard to
  look. The EMP is the only way to blind them.
- **Three routes per room.** The top lane, the middle floor, and the bottom
  lane are all open. Walls and crates block sight completely.
- **Shadows and vents hide you.** Dark corners halve detection. The vent ducts
  along the walls hide you almost completely, but you crawl through them.
- **Tools cost something.** Click tosses a ticking pocket watch that pulls
  guards toward the sound (3 per room). Q drops a smoke cloud (2 per room).
  E fires the EMP and blinds every camera for 8 seconds, but it costs $400.
- **Running is loud.** Hold Shift to run, but guards hear your footsteps and
  come to look. Hold C to sneak: slow, and much harder to spot.
- **The alarm meter runs the room.** It climbs while anyone sees you and falls
  when you stay hidden. At 70% the getaway door seals until the alarm drops
  below 50%. Grab the side loot if you dare, and leave unseen for a $500
  ghost bonus.
- **Three jobs, escalating.** The Counting Room, The Vault Floor, then The
  Penthouse Safe with four guards and two cameras.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrow keys | Move |
| Shift | Run (loud) |
| C / Ctrl | Sneak (slow, hard to spot) |
| Mouse click | Toss a ticking watch to distract guards |
| Q | Drop a smoke cloud |
| E | Fire the EMP (blinds cameras 8s, -$400) |
| Space / Enter | Start, continue |
| P / Esc | Pause |

## Play it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network:
every file the game loads sits under `game/`.

## Layout

- `game/index.html` — the page, one canvas
- `game/src/main.js` — boot, the fixed-step loop, the six screens
- `game/src/world.js` — the rules: guards, cones, cameras, noise, loot, alarm
- `game/src/levels.js` — the three rooms: walls, crates, shadows, vents, patrols
- `game/src/render.js` — all drawing: the room, raycast cones, HUD, screens
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — procedural WebAudio sound, no audio files
- `game/src/shots.js` — the staged screenshot scenes (`?shot=start|play|alert|win`)
- `game/src/config.js` — every tuning number and colour
- `main.ts` — the make.fun hand-in program (Node 22)

## License

MIT. See [LICENSE](LICENSE).
