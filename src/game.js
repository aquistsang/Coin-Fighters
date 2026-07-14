/**
 * Casino Fighters — core game loop & Hi/Lo resolution.
 *
 * Flow: BETTING → (HI or LO) → RESOLVING (animations) → BETTING | GAME_OVER
 * Streak of 5 HI wins → triggerSpecialAttack() placeholder.
 */

import { GAME_PHASE, HEALTH, STREAK, TIMING } from './constants.js';
import { Fighter } from './fighter.js';
import { EffectsSystem } from './effects.js';
import { InputHandler } from './input.js';
import { Renderer } from './render.js';
import {
  assets,
  loadAssets,
  createPlayerAnimations,
  createOpponentAnimations,
} from './assets.js';

export class Game {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{
   *   btnHi: HTMLButtonElement,
   *   btnLo: HTMLButtonElement,
   *   btnRestart: HTMLButtonElement,
   *   overlay: HTMLElement,
   *   overlayTitle: HTMLElement,
   *   overlaySub: HTMLElement,
   *   streakEl: HTMLElement,
   * }} ui
   */
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ui = ui;
    this.renderer = new Renderer(canvas);
    this.effects = new EffectsSystem();
    this.phase = GAME_PHASE.BETTING;
    this.streak = 0;
    this.round = 1;
    this.lastTime = 0;
    this.running = false;

    // Grounded near the arena floor line
    this.player = new Fighter({
      name: 'YOU',
      x: 260,
      y: 430,
      facing: 1,
      drawScale: 0.42,
      isPlayer: true,
    });

    this.opponent = new Fighter({
      name: 'CPU',
      x: 700,
      y: 430,
      facing: -1,
      drawScale: 0.42,
      isPlayer: false,
    });

    this.input = new InputHandler({
      onHi: () => this.placeBet('HI'),
      onLo: () => this.placeBet('LO'),
      onRestart: () => this.restart(),
    });
    this.input.bindUI(ui);

    window.addEventListener('resize', () => this.renderer.resize());
  }

  async init() {
    await loadAssets();
    if (!assets.playerFighter || !assets.opponentFighter) {
      throw new Error('Fighter sprites failed to load');
    }
    this.player.registerAnimations(createPlayerAnimations(assets.playerFighter));
    this.opponent.registerAnimations(createOpponentAnimations(assets.opponentFighter));
    // SOUND: start ambient / idle music loop here
    this._syncHud();
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this._frame(t));
  }

  /** @param {number} time */
  _frame(time) {
    if (!this.running) return;
    const dt = Math.min(50, time - this.lastTime);
    this.lastTime = time;

    this.player.update(dt);
    this.opponent.update(dt);
    this.effects.update(dt);

    this.renderer.draw({
      player: this.player,
      opponent: this.opponent,
      effects: this.effects,
      streak: this.streak,
      round: this.round,
    });

    requestAnimationFrame((t) => this._frame(t));
  }

  /**
   * Hi = player wins the hand (attack). Lo = player loses (gets hit).
   * Fair 50/50 for now — swap for casino RNG / server seed later.
   * @param {'HI' | 'LO'} choice
   */
  placeBet(choice) {
    if (this.phase !== GAME_PHASE.BETTING) return;
    if (this.player.isBusy || this.opponent.isBusy) return;

    this.phase = GAME_PHASE.RESOLVING;
    this.input.setEnabled(false);
    this._setButtonsDisabled(true);

    // True Hi-Lo: card is "high" or "low"; player's pick matches = win
    const cardIsHigh = Math.random() < 0.5;
    const playerWon =
      (choice === 'HI' && cardIsHigh) || (choice === 'LO' && !cardIsHigh);

    // Hint: card outcome for polish later (could show a card flip UI)
    this._lastCard = cardIsHigh ? 'HI' : 'LO';

    setTimeout(() => {
      if (playerWon) {
        this._resolveWin(choice);
      } else {
        this._resolveLoss();
      }
    }, TIMING.RESOLVE_DELAY);
  }

  /**
   * @param {'HI' | 'LO'} choice
   */
  _resolveWin(choice) {
    // Only HI bets count toward the consecutive-win special streak
    if (choice === 'HI') {
      this.streak += 1;
    } else {
      this.streak = 0;
    }
    this._syncHud();

    this.player.playAttack(() => {
      const dmg = HEALTH.HI_DAMAGE;
      this.opponent.takeDamage(dmg);
      this.opponent.playHitReaction();

      this.effects.spawnSparks(this.opponent.x, this.opponent.y - 160, 16);
      this.effects.spawnDamageNumber(this.opponent.x, this.opponent.y - 220, dmg, 'dealt');
      this.effects.triggerFlash(0.4, 100);
      this.effects.triggerShake(6, 160);
      // SOUND: play impact / hit confirm SFX here

      this._afterResolve();
    });
  }

  _resolveLoss() {
    this.streak = 0;
    this._syncHud();

    this.opponent.playAttack(() => {
      const dmg = HEALTH.LO_DAMAGE;
      this.player.takeDamage(dmg);
      this.player.playHitReaction();

      this.effects.spawnSparks(this.player.x, this.player.y - 160, 14);
      this.effects.spawnDamageNumber(this.player.x, this.player.y - 220, dmg, 'received');
      this.effects.triggerFlash(0.35, 90);
      this.effects.triggerShake(7, 180);
      // SOUND: play player hurt / block SFX here

      this._afterResolve();
    });
  }

  _afterResolve() {
    if (this.opponent.health <= 0) {
      this._endMatch(true);
      return;
    }
    if (this.player.health <= 0) {
      this._endMatch(false);
      return;
    }

    this.round += 1;

    if (this.streak >= STREAK.SPECIAL_THRESHOLD && this.streak % STREAK.SPECIAL_THRESHOLD === 0) {
      this.triggerSpecialAttack();
      return;
    }

    this._returnToBetting();
  }

  /**
   * SPECIAL EVENT — called at 5 consecutive HI wins.
   * Implement your ultra move animation / damage here.
   * Currently: flashy banner + placeholder special anim on player.
   */
  triggerSpecialAttack() {
    // Leave this function clear for you to expand into a full ultra.
    this.effects.showSpecialBanner(2000);
    this.effects.triggerFlash(0.8, 280);
    this.effects.triggerShake(14, 400);
    // SOUND: special charge / super flash SFX here

    this.player.playSpecial(() => {
      const dmg = HEALTH.SPECIAL_DAMAGE;
      this.opponent.takeDamage(dmg);
      this.opponent.playHitReaction(() => {
        this.effects.spawnSparks(this.opponent.x, this.opponent.y - 180, 28);
        this.effects.spawnDamageNumber(this.opponent.x, this.opponent.y - 240, dmg, 'dealt');
        this.effects.triggerFlash(0.7, 180);
        this.effects.triggerShake(12, 300);

        if (this.opponent.health <= 0) {
          this._endMatch(true);
          return;
        }
        this._returnToBetting();
      });
    });
  }

  /** @param {boolean} playerWon */
  _endMatch(playerWon) {
    this.phase = GAME_PHASE.GAME_OVER;
    this.input.setEnabled(false);
    this._setButtonsDisabled(true);

    this.ui.overlay.hidden = false;
    this.ui.overlay.classList.toggle('win', playerWon);
    this.ui.overlay.classList.toggle('lose', !playerWon);
    this.ui.overlayTitle.textContent = playerWon ? 'YOU WIN!' : 'YOU LOSE';
    this.ui.overlaySub.textContent = playerWon
      ? 'Opponent KO — Casino Fighters champion!'
      : 'Your HP hit zero. Press Restart to fight again.';
    // SOUND: win / lose jingle here
  }

  _returnToBetting() {
    this.phase = GAME_PHASE.BETTING;
    this.input.setEnabled(true);
    this._setButtonsDisabled(false);
  }

  restart() {
    this.player.reset();
    this.opponent.reset();
    this.streak = 0;
    this.round = 1;
    this.phase = GAME_PHASE.BETTING;
    this.effects.sparks = [];
    this.effects.floatTexts = [];
    this.effects.flashes = [];
    this.effects.specialBanner.active = false;
    this.ui.overlay.hidden = true;
    this._syncHud();
    this._returnToBetting();
  }

  _syncHud() {
    if (this.ui.streakEl) {
      this.ui.streakEl.textContent = String(this.streak);
    }
  }

  /** @param {boolean} disabled */
  _setButtonsDisabled(disabled) {
    this.ui.btnHi.disabled = disabled;
    this.ui.btnLo.disabled = disabled;
  }
}
