/**
 * Hit sparks, floating damage numbers, screen shake, impact flashes.
 */

export class EffectsSystem {
  constructor() {
    /** @type {Array<{ x: number, y: number, life: number, maxLife: number, size: number, vx: number, vy: number, color: string }>} */
    this.sparks = [];
    /** @type {Array<{ x: number, y: number, text: string, color: string, life: number, maxLife: number, vy: number }>} */
    this.floatTexts = [];
    /** @type {Array<{ life: number, maxLife: number, color: string, strength: number }>} */
    this.flashes = [];
    this.shake = { intensity: 0, duration: 0, elapsed: 0 };
    this.specialBanner = { active: false, life: 0, maxLife: 1800 };
  }

  /** @param {number} dt */
  update(dt) {
    this.sparks = this.sparks.filter((s) => {
      s.life -= dt;
      s.x += s.vx * (dt / 16);
      s.y += s.vy * (dt / 16);
      s.vy += 0.15;
      return s.life > 0;
    });

    this.floatTexts = this.floatTexts.filter((t) => {
      t.life -= dt;
      t.y += t.vy * (dt / 16);
      return t.life > 0;
    });

    this.flashes = this.flashes.filter((f) => {
      f.life -= dt;
      return f.life > 0;
    });

    if (this.shake.duration > 0) {
      this.shake.elapsed += dt;
      if (this.shake.elapsed >= this.shake.duration) {
        this.shake.intensity = 0;
        this.shake.duration = 0;
        this.shake.elapsed = 0;
      }
    }

    if (this.specialBanner.active) {
      this.specialBanner.life -= dt;
      if (this.specialBanner.life <= 0) {
        this.specialBanner.active = false;
      }
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} [count]
   */
  spawnSparks(x, y, count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 2 + Math.random() * 5;
      this.sparks.push({
        x,
        y,
        life: 280 + Math.random() * 200,
        maxLife: 400,
        size: 2 + Math.random() * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: Math.random() > 0.4 ? '#fff8a0' : '#ffaa33',
      });
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} amount
   * @param {'dealt' | 'received'} kind
   */
  spawnDamageNumber(x, y, amount, kind) {
    this.floatTexts.push({
      x,
      y,
      text: String(amount),
      color: kind === 'dealt' ? '#44ff77' : '#ff4455',
      life: 900,
      maxLife: 900,
      vy: -2.2,
    });
  }

  /** @param {number} [strength] 0–1 @param {number} [duration] ms */
  triggerFlash(strength = 0.55, duration = 120) {
    this.flashes.push({
      life: duration,
      maxLife: duration,
      color: '#ffffff',
      strength,
    });
  }

  /** @param {number} intensity @param {number} duration ms */
  triggerShake(intensity = 8, duration = 200) {
    this.shake.intensity = intensity;
    this.shake.duration = duration;
    this.shake.elapsed = 0;
  }

  showSpecialBanner(duration = 1800) {
    this.specialBanner.active = true;
    this.specialBanner.life = duration;
    this.specialBanner.maxLife = duration;
  }

  getShakeOffset() {
    if (this.shake.intensity <= 0) return { x: 0, y: 0 };
    const fade = 1 - this.shake.elapsed / this.shake.duration;
    const i = this.shake.intensity * fade;
    return {
      x: (Math.random() - 0.5) * 2 * i,
      y: (Math.random() - 0.5) * 2 * i,
    };
  }
}
