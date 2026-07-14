/**
 * Asset loading and animation definitions.
 * Replace procedural idle with sprite-sheet frames when your sheet is ready.
 */

import { TIMING } from './constants.js';

/** @typedef {{ x: number, y: number, duration?: number, offsetX?: number, offsetY?: number, scaleX?: number, scaleY?: number, rotation?: number, alpha?: number }} FrameDef */
/** @typedef {{ sx: number, sy: number, sw: number, sh: number, offsetX: number, offsetY: number, scaleX: number, scaleY: number, rotation: number, alpha?: number }} DrawFrame */
/**
 * @typedef {Object} AnimationDef
 * @property {HTMLImageElement | HTMLCanvasElement | null} [sheet]
 * @property {HTMLImageElement | HTMLCanvasElement | null} [image]
 * @property {number} frameW
 * @property {number} frameH
 * @property {number} [frameDuration]
 * @property {boolean} [loop]
 * @property {FrameDef[]} [frames]
 * @property {boolean} [procedural]
 * @property {FrameDef[]} [proceduralFrames]
 */

/** Classic SF-style idle: 10 frames of weight shift, head bob, knee bend. */
const IDLE_PROCEDURAL = [
  { offsetX: 0, offsetY: 0, scaleY: 1.0, rotation: 0 },
  { offsetX: 1, offsetY: -1, scaleY: 1.008, rotation: 0.003 },
  { offsetX: 2, offsetY: -2, scaleY: 1.012, rotation: 0.005 },
  { offsetX: 2, offsetY: -3, scaleY: 1.015, rotation: 0.006 },
  { offsetX: 1, offsetY: -2, scaleY: 1.012, rotation: 0.004 },
  { offsetX: 0, offsetY: 0, scaleY: 1.0, rotation: 0 },
  { offsetX: -1, offsetY: 1, scaleY: 0.992, rotation: -0.003 },
  { offsetX: -2, offsetY: 2, scaleY: 0.988, rotation: -0.005 },
  { offsetX: -2, offsetY: 3, scaleY: 0.985, rotation: -0.006 },
  { offsetX: -1, offsetY: 2, scaleY: 0.988, rotation: -0.004 },
];

const ATTACK_PROCEDURAL = [
  { offsetX: 0, offsetY: 0, scaleX: 1, rotation: 0 },
  { offsetX: 8, offsetY: -4, scaleX: 1.05, rotation: 0.04 },
  { offsetX: 28, offsetY: -8, scaleX: 1.12, rotation: 0.08 },
  { offsetX: 42, offsetY: -6, scaleX: 1.15, rotation: 0.1 },
  { offsetX: 18, offsetY: -2, scaleX: 1.05, rotation: 0.03 },
  { offsetX: 0, offsetY: 0, scaleX: 1, rotation: 0 },
];

const HIT_PROCEDURAL = [
  { offsetX: 0, offsetY: 0, rotation: 0, alpha: 1 },
  { offsetX: -6, offsetY: -2, rotation: -0.06, alpha: 0.9 },
  { offsetX: -14, offsetY: -4, rotation: -0.1, alpha: 0.85 },
  { offsetX: -10, offsetY: -2, rotation: -0.07, alpha: 0.9 },
  { offsetX: -4, offsetY: 0, rotation: -0.03, alpha: 1 },
  { offsetX: 0, offsetY: 0, rotation: 0, alpha: 1 },
];

const SPECIAL_PROCEDURAL = [
  { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, rotation: 0 },
  { offsetX: -10, offsetY: -12, scaleX: 0.95, scaleY: 1.05, rotation: -0.05 },
  { offsetX: 20, offsetY: -20, scaleX: 1.2, scaleY: 1.1, rotation: 0.12 },
  { offsetX: 55, offsetY: -16, scaleX: 1.35, scaleY: 1.15, rotation: 0.18 },
  { offsetX: 70, offsetY: -8, scaleX: 1.4, scaleY: 1.12, rotation: 0.2 },
  { offsetX: 30, offsetY: 0, scaleX: 1.1, scaleY: 1.05, rotation: 0.05 },
  { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, rotation: 0 },
];

export const assets = {
  playerFighter: /** @type {HTMLImageElement | HTMLCanvasElement | null} */ (null),
  opponentFighter: /** @type {HTMLImageElement | HTMLCanvasElement | null} */ (null),
  loaded: false,
};

/**
 * Load images. Drop sprite sheets into /assets and wire them here.
 * @returns {Promise<void>}
 */
export async function loadAssets() {
  const raw = await loadImage('assets/player-fighter.png');
  // Key out near-black studio backdrop so the fighter composites cleanly
  const player = keyOutBlack(raw, 28);
  // Mirrored opponent placeholder until you drop a second fighter sprite
  assets.playerFighter = player;
  assets.opponentFighter = player;
  assets.loaded = true;
}

/** @param {string} src @returns {Promise<HTMLImageElement>} */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

/**
 * Convert near-black pixels to transparent (for studio-black sprite plates).
 * @param {HTMLImageElement} img
 * @param {number} threshold
 * @returns {HTMLCanvasElement}
 */
function keyOutBlack(img, threshold = 24) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d');
  if (!ctx) return /** @type {any} */ (img);
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i] <= threshold && px[i + 1] <= threshold && px[i + 2] <= threshold) {
      px[i + 3] = 0;
    }
  }
  ctx.putImageData(data, 0, 0);
  return c;
}

/**
 * Build animation defs for the player fighter.
 * @param {HTMLImageElement | HTMLCanvasElement} image
 * @returns {Record<string, AnimationDef>}
 */
export function createPlayerAnimations(image) {
  const frameW = image.width;
  const frameH = image.height;

  return {
    idle: {
      image,
      frameW,
      frameH,
      frameDuration: 1000 / TIMING.IDLE_FPS,
      loop: true,
      procedural: true,
      proceduralFrames: IDLE_PROCEDURAL,
    },
    attack: {
      image,
      frameW,
      frameH,
      frameDuration: TIMING.ATTACK_DURATION / ATTACK_PROCEDURAL.length,
      loop: false,
      procedural: true,
      proceduralFrames: ATTACK_PROCEDURAL,
    },
    hit: {
      image,
      frameW,
      frameH,
      frameDuration: TIMING.HIT_DURATION / HIT_PROCEDURAL.length,
      loop: false,
      procedural: true,
      proceduralFrames: HIT_PROCEDURAL,
    },
    special: {
      image,
      frameW,
      frameH,
      frameDuration: TIMING.SPECIAL_DURATION / SPECIAL_PROCEDURAL.length,
      loop: false,
      procedural: true,
      proceduralFrames: SPECIAL_PROCEDURAL,
    },
  };
}

/**
 * Opponent uses same procedural anims (mirrored at draw time).
 * @param {HTMLImageElement | HTMLCanvasElement} image
 * @returns {Record<string, AnimationDef>}
 */
export function createOpponentAnimations(image) {
  return createPlayerAnimations(image);
}

/**
 * Example sprite-sheet idle — uncomment and fill in when you have a sheet:
 *
 * idle: {
 *   sheet: image,
 *   frameW: 256,
 *   frameH: 400,
 *   frameDuration: 80,
 *   loop: true,
 *   frames: [
 *     { x: 0, y: 0 }, { x: 256, y: 0 }, ...
 *   ],
 * },
 */
