/** Central mutable game state — single source of truth. */

import { CONFIG, GAME_PHASE } from './constants.js';

export function createInitialState() {
  return {
    phase: GAME_PHASE.BETTING,
    playerHealth: CONFIG.maxHealth,
    opponentHealth: CONFIG.maxHealth,
    consecutiveHiWins: 0,
    specialReady: false,
    specialTriggered: false,
    round: 1,
    currentCard: null,
    nextCard: null,
    lastBet: null,
    winner: null,
    inputLocked: false,
  };
}

export let state = createInitialState();

export function resetState() {
  Object.assign(state, createInitialState());
}

export function lockInput() {
  state.inputLocked = true;
}

export function unlockInput() {
  state.inputLocked = false;
}
