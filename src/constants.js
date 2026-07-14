/** Global game constants and fighter state enum. */

export const FIGHTER_STATE = {
  IDLE: 'IDLE',
  ATTACKING: 'ATTACKING',
  HIT_REACTION: 'HIT_REACTION',
  SPECIAL: 'SPECIAL',
};

export const GAME_PHASE = {
  BETTING: 'BETTING',
  RESOLVING: 'RESOLVING',
  GAME_OVER: 'GAME_OVER',
};

export const CANVAS = {
  WIDTH: 960,
  HEIGHT: 540,
};

/** Feet rest on the stage stone tiles (bottom of fighter sprite). */
export const STAGE = {
  FLOOR_Y: 532,
  PLAYER_X: 250,
  OPPONENT_X: 710,
  FIGHTER_SCALE: 0.46,
};

export const HEALTH = {
  /** Yellow life boxes on each HUD side */
  MAX_BOXES: 5,
  /** Boxes removed from opponent on a successful bet win */
  WIN_COST: 1,
};

export const STREAK = {
  SPECIAL_THRESHOLD: 5,
};

export const TIMING = {
  IDLE_FPS: 10,
  ATTACK_DURATION: 620,
  HIT_DURATION: 400,
  SPECIAL_DURATION: 1200,
  RESOLVE_DELAY: 50,
  /** Kick lunge timeline (ms) */
  KICK_WINDUP: 100,
  KICK_LUNGE: 180,
  KICK_HOLD: 160,
  KICK_RECOVER: 200,
  KICK_REACH: 145,
};

export const COLORS = {
  PLAYER_HP: '#44cc66',
  OPPONENT_HP: '#cc3344',
  HP_BG: '#1a1a2e',
  HP_BORDER: '#d4af37',
  STAGE_SKY: '#2a1f4e',
  STAGE_FLOOR: '#3d2b1f',
  STAGE_FLOOR_LIGHT: '#5c4033',
  SPARK: '#fff8a0',
  FLASH: '#ffffff',
  LIFE_BOX: '#ffd84a',
  LIFE_BOX_EDGE: '#b8860b',
  LIFE_BOX_GLOW: 'rgba(255, 210, 64, 0.45)',
};

/**
 * HUD overlay layout — coords are for the 1016×160 source image.
 * Tracks span the full dark bar including outward arrow tips.
 */
export const HUD = {
  SRC_W: 1016,
  SRC_H: 160,
  /** Draw HUD smaller than full canvas width so it sits in proportion */
  DISPLAY_SCALE: 0.72,
  BOX_COUNT: 5,
  BOX_GAP: 3,
  /** 1P (left) life track — includes left arrow tip */
  PLAYER_TRACK: { x: 48, y: 56, w: 382, h: 44 },
  /** 2P (right) life track — includes right arrow tip */
  OPPONENT_TRACK: { x: 586, y: 56, w: 382, h: 44 },
  /** Center frame for bet multiplier */
  CENTER: { x: 448, y: 42, w: 120, h: 84 },
};

export const MULTIPLIER = {
  START: 1,
  /** Each win doubles the displayed bet multiplier */
  WIN_FACTOR: 2,
  HISTORY_MAX: 8,
};
