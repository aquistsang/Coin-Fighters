/**
 * Fighter entity: state machine + animation + health.
 * States: IDLE | ATTACKING | HIT_REACTION | SPECIAL
 */

import { AnimationManager } from './animation-manager.js';
import { FIGHTER_STATE, HEALTH } from './constants.js';

export class Fighter {
  /**
   * @param {{
   *   name: string,
   *   x: number,
   *   y: number,
   *   facing: 1 | -1,
   *   drawScale: number,
   *   isPlayer: boolean,
   * }} opts
   */
  constructor(opts) {
    this.name = opts.name;
    this.x = opts.x;
    this.y = opts.y;
    this.facing = opts.facing;
    this.drawScale = opts.drawScale;
    this.isPlayer = opts.isPlayer;

    this.health = HEALTH.MAX;
    this.maxHealth = HEALTH.MAX;
    this.state = FIGHTER_STATE.IDLE;
    this.anim = new AnimationManager();
    this.flashTimer = 0;
    this.hitFlash = 0;
  }

  /** @param {Record<string, import('./assets.js').AnimationDef>} defs */
  registerAnimations(defs) {
    for (const [name, def] of Object.entries(defs)) {
      this.anim.register(name, def);
    }
    this.anim.play('idle');
  }

  /** @param {number} dt */
  update(dt) {
    this.anim.update(dt);
    if (this.flashTimer > 0) this.flashTimer = Math.max(0, this.flashTimer - dt);
    if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);
  }

  setIdle() {
    this.state = FIGHTER_STATE.IDLE;
    this.anim.play('idle', { loop: true });
  }

  /**
   * @param {() => void} [onComplete]
   */
  playAttack(onComplete) {
    this.state = FIGHTER_STATE.ATTACKING;
    // SOUND: play attack whoosh / punch SFX here
    // SOUND: optional voice line — "hyaa!"
    this.anim.play('attack', {
      loop: false,
      onComplete: () => {
        this.setIdle();
        onComplete?.();
      },
    });
  }

  /**
   * @param {() => void} [onComplete]
   */
  playHitReaction(onComplete) {
    this.state = FIGHTER_STATE.HIT_REACTION;
    this.hitFlash = 120;
    // SOUND: play hit / impact SFX here
    // SOUND: optional grunt voice line
    this.anim.play('hit', {
      loop: false,
      onComplete: () => {
        this.setIdle();
        onComplete?.();
      },
    });
  }

  /**
   * Placeholder ultra move — flesh this out when you implement specials.
   * @param {() => void} [onComplete]
   */
  playSpecial(onComplete) {
    this.state = FIGHTER_STATE.SPECIAL;
    this.flashTimer = 200;
    // SOUND: play special / ultra SFX here
    // SOUND: optional special voice line
    this.anim.play('special', {
      loop: false,
      onComplete: () => {
        this.setIdle();
        onComplete?.();
      },
    });
  }

  /**
   * @param {number} amount
   * @returns {number} remaining health
   */
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    return this.health;
  }

  reset() {
    this.health = this.maxHealth;
    this.setIdle();
    this.flashTimer = 0;
    this.hitFlash = 0;
  }

  get isBusy() {
    return (
      this.state === FIGHTER_STATE.ATTACKING ||
      this.state === FIGHTER_STATE.HIT_REACTION ||
      this.state === FIGHTER_STATE.SPECIAL
    );
  }
}
