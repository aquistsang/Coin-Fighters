/**
 * Casino Fighters — entry point
 */

import { Game } from './game.js';

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('gameCanvas'));
const btnHi = /** @type {HTMLButtonElement} */ (document.getElementById('btnHi'));
const btnLo = /** @type {HTMLButtonElement} */ (document.getElementById('btnLo'));
const btnRestart = /** @type {HTMLButtonElement} */ (document.getElementById('btnRestart'));
const overlay = /** @type {HTMLElement} */ (document.getElementById('gameOverlay'));
const overlayTitle = /** @type {HTMLElement} */ (document.getElementById('overlayTitle'));
const overlaySub = /** @type {HTMLElement} */ (document.getElementById('overlaySub'));
const streakEl = /** @type {HTMLElement} */ (document.getElementById('streakValue'));
const roundHistoryEl = /** @type {HTMLElement} */ (document.getElementById('roundHistory'));
const rtpPercentEl = /** @type {HTMLElement} */ (document.getElementById('rtpPercent'));
const rtpHashEl = /** @type {HTMLElement} */ (document.getElementById('rtpHash'));
const rtpClientEl = /** @type {HTMLElement} */ (document.getElementById('rtpClient'));
const rtpNonceEl = /** @type {HTMLElement} */ (document.getElementById('rtpNonce'));
const rtpLastEl = /** @type {HTMLElement} */ (document.getElementById('rtpLast'));

const game = new Game(canvas, {
  btnHi,
  btnLo,
  btnRestart,
  overlay,
  overlayTitle,
  overlaySub,
  streakEl,
  roundHistoryEl,
  rtpPercentEl,
  rtpHashEl,
  rtpClientEl,
  rtpNonceEl,
  rtpLastEl,
});

overlay.hidden = false;
overlayTitle.textContent = 'LOADING';
overlaySub.textContent = 'Loading fight assets…';
btnRestart.hidden = true;

game.init()
  .then(() => {
    overlay.hidden = true;
    btnRestart.hidden = false;
  })
  .catch((err) => {
    console.error(err);
    overlay.hidden = false;
    overlayTitle.textContent = 'LOAD ERROR';
    overlaySub.textContent = String(err.message || err);
    btnRestart.hidden = false;
  });
