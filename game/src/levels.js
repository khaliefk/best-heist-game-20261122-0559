// The three rooms of Velvet Vault. Each level is one room the thief crosses:
// walls make three routes (top lane, middle floor, bottom lane), crates and
// shadows are cover, vents are a slow hidden crawl. Tile coords, 32 by 18.
// Loot kinds: vault (the job's main target), cash, gold, art.
import { TILE } from './config.js';

const px = (tx, ty) => ({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE });

export const LEVELS = [
  {
    name: 'Job 1: The Counting Room',
    brief: 'The Marlow Diamond sits in the cage at the far end. Grab it, then slip out the green door. The counting tables are cover, the dark corners hide you.',
    playerStart: px(2, 9),
    exit: { x: 0, y: 8, w: 1, h: 2, label: 'GETAWAY DOOR' },
    walls: [
      [10, 2, 1, 6], [10, 11, 1, 6],
      [21, 2, 1, 4], [21, 9, 1, 8],
      [14, 5, 5, 1], [14, 13, 5, 1],
      [26, 4, 1, 3],
    ],
    crates: [[5, 4], [6, 4], [16, 9], [17, 9], [24, 11], [13, 15], [28, 15], [7, 13]],
    shadows: [[1, 1, 4, 2], [27, 1, 4, 2], [1, 15, 3, 2], [22, 15, 3, 2]],
    vents: [[12, 1, 8, 1], [3, 16, 6, 1]],
    guards: [
      { waypoints: [px(8, 3), px(8, 14)], pause: 1.2 },
      { waypoints: [px(14, 12), px(27, 12), px(27, 6), px(14, 6)], pause: 0.9 },
    ],
    cameras: [{ at: px(16, 1), base: Math.PI / 2, sweep: 0.9, speed: 0.45 }],
    loot: [
      { ...px(29, 9), kind: 'vault', value: 1000, label: 'MARLOW DIAMOND' },
      { ...px(15, 3), kind: 'cash', value: 250, label: 'CASH' },
      { ...px(24, 14), kind: 'cash', value: 250, label: 'CASH' },
      { ...px(6, 14), kind: 'art', value: 400, label: 'PAINTING' },
    ],
    parSeconds: 90,
  },
  {
    name: 'Job 2: The Vault Floor',
    brief: 'Gold bars behind the vault cage, two cameras sweeping the floor. The vent runs the whole top wall. Take the gold, mind the second guard on the middle lane.',
    playerStart: px(2, 9),
    exit: { x: 0, y: 8, w: 1, h: 2, label: 'GETAWAY DOOR' },
    walls: [
      [8, 2, 1, 5], [8, 10, 1, 7],
      [16, 3, 1, 4], [16, 11, 1, 6],
      [24, 2, 1, 6], [24, 11, 1, 6],
      [11, 8, 4, 1], [19, 14, 4, 1],
    ],
    crates: [[4, 5], [12, 4], [13, 4], [20, 9], [21, 9], [28, 13], [5, 14], [18, 5], [27, 5]],
    shadows: [[1, 1, 4, 2], [27, 1, 4, 2], [1, 15, 4, 2], [26, 15, 4, 2], [13, 1, 4, 1]],
    vents: [[10, 1, 12, 1], [3, 16, 7, 1], [24, 16, 6, 1]],
    guards: [
      { waypoints: [px(6, 3), px(6, 14)], pause: 1.0 },
      { waypoints: [px(13, 13), px(22, 13), px(22, 5), px(13, 5)], pause: 0.8 },
      { waypoints: [px(28, 4), px(28, 14)], pause: 1.4 },
    ],
    cameras: [
      { at: px(12, 1), base: Math.PI / 2, sweep: 1.0, speed: 0.55 },
      { at: px(22, 16), base: -Math.PI / 2, sweep: 1.0, speed: 0.5 },
    ],
    loot: [
      { ...px(29, 9), kind: 'vault', value: 1500, label: 'GOLD BARS' },
      { ...px(11, 2), kind: 'cash', value: 300, label: 'CASH' },
      { ...px(19, 10), kind: 'art', value: 500, label: 'PAINTING' },
      { ...px(27, 14), kind: 'cash', value: 300, label: 'CASH' },
      { ...px(4, 2), kind: 'cash', value: 300, label: 'CASH' },
    ],
    parSeconds: 120,
  },
  {
    name: 'Job 3: The Penthouse Safe',
    brief: 'The last job. Four guards, two cameras, and the Star Sapphire in the penthouse safe. Every lane is watched by someone. Use the smoke, spend the EMP, and do not rush the cones.',
    playerStart: px(2, 9),
    exit: { x: 0, y: 8, w: 1, h: 2, label: 'GETAWAY DOOR' },
    walls: [
      [7, 2, 1, 6], [7, 11, 1, 6],
      [14, 2, 1, 4], [14, 9, 1, 8],
      [21, 3, 1, 5], [21, 11, 1, 6],
      [27, 5, 1, 4],
      [10, 14, 4, 1], [18, 4, 4, 1],
    ],
    crates: [[4, 4], [11, 7], [12, 7], [17, 12], [25, 14], [5, 14], [24, 7], [29, 13], [16, 15]],
    shadows: [[1, 1, 4, 2], [27, 1, 4, 2], [1, 15, 4, 2], [26, 15, 4, 2]],
    vents: [[9, 1, 10, 1], [3, 16, 6, 1], [23, 16, 7, 1]],
    guards: [
      { waypoints: [px(5, 3), px(5, 14)], pause: 0.9 },
      { waypoints: [px(11, 13), px(18, 13), px(18, 6), px(11, 6)], pause: 0.7 },
      { waypoints: [px(25, 3), px(25, 14)], pause: 1.1 },
      { waypoints: [px(29, 12), px(19, 12), px(19, 16), px(29, 16)], pause: 0.8 },
    ],
    cameras: [
      { at: px(10, 1), base: Math.PI / 2, sweep: 1.1, speed: 0.6 },
      { at: px(24, 1), base: Math.PI / 2, sweep: 1.1, speed: 0.55 },
    ],
    loot: [
      { ...px(29, 9), kind: 'vault', value: 2000, label: 'STAR SAPPHIRE' },
      { ...px(10, 2), kind: 'art', value: 600, label: 'PAINTING' },
      { ...px(18, 15), kind: 'cash', value: 350, label: 'CASH' },
      { ...px(26, 2), kind: 'cash', value: 350, label: 'CASH' },
      { ...px(4, 13), kind: 'gold', value: 700, label: 'GOLD' },
    ],
    parSeconds: 150,
  },
];
