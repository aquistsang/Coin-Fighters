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

export const HEALTH = {
  MAX: 100,
  HI_DAMAGE: 12,
  LO_DAMAGE: 10,
  SPECIAL_DAMAGE: 35,
};

export const STREAK = {
  SPECIAL_THRESHOLD: 5,
};

export const TIMING = {
  IDLE_FPS: 10,
  ATTACK_DURATION: 450,
  HIT_DURATION: 400,
  SPECIAL_DURATION: 1200,
  RESOLVE_DELAY: 50,
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
};
