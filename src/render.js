/**
 * Canvas renderer: stage background, fighters, HUD bars, FX overlays.
 */

import { CANVAS, COLORS } from './constants.js';

export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
  }

  resize() {
    const wrap = this.canvas.parentElement;
    const cssW = wrap ? wrap.clientWidth : CANVAS.WIDTH;
    const aspect = CANVAS.WIDTH / CANVAS.HEIGHT;
    let w = cssW;
    let h = cssW / aspect;
    const maxH = window.innerHeight * 0.62;
    if (h > maxH) {
      h = maxH;
      w = h * aspect;
    }

    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.width = Math.floor(CANVAS.WIDTH * this.dpr);
    this.canvas.height = Math.floor(CANVAS.HEIGHT * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  /**
   * @param {{
   *   player: import('./fighter.js').Fighter,
   *   opponent: import('./fighter.js').Fighter,
   *   effects: import('./effects.js').EffectsSystem,
   *   streak: number,
   *   round: number,
   * }} state
   */
  draw(state) {
    const ctx = this.ctx;
    const shake = state.effects.getShakeOffset();

    ctx.save();
    ctx.clearRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
    ctx.translate(shake.x, shake.y);

    this._drawStage(ctx);
    this._drawFighter(ctx, state.opponent);
    this._drawFighter(ctx, state.player);
    this._drawEffects(ctx, state.effects);
    this._drawHud(ctx, state);

    ctx.restore();
    this._drawScreenFlash(ctx, state.effects);
    this._drawSpecialBanner(ctx, state.effects);
  }

  /** @param {CanvasRenderingContext2D} ctx */
  _drawStage(ctx) {
    // Placeholder fighting stage — swap for a real background image later
    const g = ctx.createLinearGradient(0, 0, 0, CANVAS.HEIGHT);
    g.addColorStop(0, '#1a1535');
    g.addColorStop(0.45, '#2a1f4e');
    g.addColorStop(0.55, COLORS.STAGE_FLOOR);
    g.addColorStop(1, '#1a100c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    // Audience / lights hint
    ctx.fillStyle = 'rgba(212, 175, 55, 0.08)';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(80 + i * 110, 90, 18 + (i % 3) * 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floor perspective lines
    const floorY = 380;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(CANVAS.WIDTH, floorY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      const x = 40 + t * (CANVAS.WIDTH - 80);
      ctx.beginPath();
      ctx.moveTo(CANVAS.WIDTH / 2, floorY);
      ctx.lineTo(x, CANVAS.HEIGHT);
      ctx.stroke();
    }

    // Arena name plaque
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(CANVAS.WIDTH / 2 - 110, 55, 220, 28);
    ctx.strokeStyle = COLORS.HP_BORDER;
    ctx.strokeRect(CANVAS.WIDTH / 2 - 110, 55, 220, 28);
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 14px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CASINO ARENA', CANVAS.WIDTH / 2, 74);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./fighter.js').Fighter} fighter
   */
  _drawFighter(ctx, fighter) {
    const img = fighter.anim.image;
    if (!img) return;

    const frame = fighter.anim.getCurrentFrame();
    const sw = frame.sw || img.width;
    const sh = frame.sh || img.height;
    const scale = fighter.drawScale;
    const drawW = sw * scale * (frame.scaleX || 1);
    const drawH = sh * scale * (frame.scaleY || 1);

    ctx.save();
    ctx.translate(fighter.x + frame.offsetX * fighter.facing, fighter.y + frame.offsetY);
    ctx.scale(fighter.facing, 1);
    ctx.rotate(frame.rotation || 0);
    ctx.globalAlpha = frame.alpha ?? 1;

    if (fighter.hitFlash > 0) {
      ctx.filter = 'brightness(2.4) saturate(0.3)';
    } else if (fighter.flashTimer > 0) {
      ctx.filter = 'brightness(1.6) drop-shadow(0 0 12px #ffd700)';
    }

    // Key out near-black background from the sprite
    ctx.drawImage(
      img,
      frame.sx,
      frame.sy,
      sw,
      sh,
      -drawW / 2,
      -drawH,
      drawW,
      drawH
    );

    ctx.filter = 'none';
    ctx.restore();
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./effects.js').EffectsSystem} fx
   */
  _drawEffects(ctx, fx) {
    for (const s of fx.sparks) {
      const a = Math.max(0, s.life / s.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    ctx.font = 'bold 28px "Press Start 2P", Impact, sans-serif';
    for (const t of fx.floatTexts) {
      const a = Math.max(0, t.life / t.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = t.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {{
   *   player: import('./fighter.js').Fighter,
   *   opponent: import('./fighter.js').Fighter,
   *   streak: number,
   *   round: number,
   * }} state
   */
  _drawHud(ctx, state) {
    const barY = 18;
    const barH = 22;
    const barW = 360;
    const pad = 24;

    // Player HP (left)
    this._drawHealthBar(ctx, pad, barY, barW, barH, state.player.health / state.player.maxHealth, COLORS.PLAYER_HP, true);
    ctx.fillStyle = '#eee';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(state.player.name, pad, barY + barH + 16);

    // Opponent HP (right)
    const rightX = CANVAS.WIDTH - pad - barW;
    this._drawHealthBar(ctx, rightX, barY, barW, barH, state.opponent.health / state.opponent.maxHealth, COLORS.OPPONENT_HP, false);
    ctx.textAlign = 'right';
    ctx.fillText(state.opponent.name, CANVAS.WIDTH - pad, barY + barH + 16);

    // Round + streak
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d4af37';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText(`ROUND ${state.round}`, CANVAS.WIDTH / 2, 28);
    ctx.fillStyle = state.streak >= 4 ? '#ffcc33' : '#aaa';
    ctx.fillText(`STREAK ${state.streak}`, CANVAS.WIDTH / 2, barY + barH + 16);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x @param {number} y @param {number} w @param {number} h
   * @param {number} ratio @param {string} color @param {boolean} leftAligned
   */
  _drawHealthBar(ctx, x, y, w, h, ratio, color, leftAligned) {
    ctx.fillStyle = COLORS.HP_BG;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = COLORS.HP_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    const fillW = Math.max(0, w * Math.min(1, Math.max(0, ratio)));
    ctx.fillStyle = color;
    if (leftAligned) {
      ctx.fillRect(x, y, fillW, h);
    } else {
      ctx.fillRect(x + (w - fillW), y, fillW, h);
    }

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x, y, w, h * 0.4);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./effects.js').EffectsSystem} fx
   */
  _drawScreenFlash(ctx, fx) {
    for (const f of fx.flashes) {
      const a = (f.life / f.maxLife) * f.strength;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./effects.js').EffectsSystem} fx
   */
  _drawSpecialBanner(ctx, fx) {
    if (!fx.specialBanner.active) return;
    const t = fx.specialBanner.life / fx.specialBanner.maxLife;
    const pulse = 0.7 + Math.sin(Date.now() / 80) * 0.3;

    ctx.fillStyle = `rgba(0,0,0,${0.55 * Math.min(1, t * 3)})`;
    ctx.fillRect(0, CANVAS.HEIGHT / 2 - 50, CANVAS.WIDTH, 100);

    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
    ctx.font = 'bold 22px "Press Start 2P", monospace';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    const msg = 'SPECIAL ATTACK READY!';
    ctx.strokeText(msg, CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2 + 8);
    ctx.fillText(msg, CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2 + 8);
  }
}
