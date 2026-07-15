/**
 * Canvas renderer: stage background, fighters, HUD bars, FX overlays.
 */

import { CANVAS, COLORS, HUD } from './constants.js';
import { assets } from './assets.js';

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
   *   multiplier: number,
   *   multiplierHistory: Array<{ value: number, won: boolean }>,
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

    ctx.restore();

    this._drawHud(ctx, state);
    // After HUD so multipliers sit in the gap above the fighter head
    this._drawMultiplierPopups(ctx, state.effects);
    this._drawScreenFlash(ctx, state.effects);
    this._drawSpecialBanner(ctx, state.effects);
  }

  /** @param {CanvasRenderingContext2D} ctx */
  _drawStage(ctx) {
    const bg = assets.stageBackground;
    if (bg) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(bg, 0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
      ctx.imageSmoothingEnabled = false;
      return;
    }

    const g = ctx.createLinearGradient(0, 0, 0, CANVAS.HEIGHT);
    g.addColorStop(0, '#1a1535');
    g.addColorStop(0.45, '#2a1f4e');
    g.addColorStop(0.55, COLORS.STAGE_FLOOR);
    g.addColorStop(1, '#1a100c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
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

    let scale = fighter.drawScale;
    const idleDef = fighter.anim.definitions.get('idle');
    if (fighter.anim.currentName === 'attack' && idleDef?.frameH && sh > 0) {
      scale = (idleDef.frameH * fighter.drawScale) / sh;
    }

    const drawW = sw * scale * (frame.scaleX || 1);
    const drawH = sh * scale * (frame.scaleY || 1);

    ctx.save();
    ctx.translate(fighter.x + frame.offsetX * fighter.facing, fighter.y + 2);
    ctx.scale(1, 0.28);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, drawW * 0.38, drawW * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

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
   * Multiplier popups on the left between HUD and character head.
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./effects.js').EffectsSystem} fx
   */
  _drawMultiplierPopups(ctx, fx) {
    for (const p of fx.multiplierPopups) {
      const a = Math.max(0, p.life / p.maxLife);
      const fade = a > 0.2 ? 1 : a / 0.2;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.scale(p.scale || 1, p.scale || 1);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#000';
      ctx.fillStyle = p.color;
      ctx.font = 'bold 22px "Press Start 2P", monospace';
      ctx.strokeText(p.text, 0, 0);
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {{
   *   player: import('./fighter.js').Fighter,
   *   opponent: import('./fighter.js').Fighter,
   *   multiplier: number,
   * }} state
   */
  _drawHud(ctx, state) {
    const hud = assets.hudOverlay;
    if (!hud) return;

    const display = HUD.DISPLAY_SCALE;
    const drawW = CANVAS.WIDTH * display;
    const drawH = (HUD.SRC_H / HUD.SRC_W) * drawW;
    const ox = (CANVAS.WIDTH - drawW) / 2;
    const oy = 6;
    const unit = drawW / HUD.SRC_W;

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(hud, 0, 0, HUD.SRC_W, HUD.SRC_H, ox, oy, drawW, drawH);
    ctx.imageSmoothingEnabled = false;

    this._drawLifeBoxes(ctx, HUD.PLAYER_TRACK, state.player.health, unit, ox, oy, true);
    this._drawLifeBoxes(ctx, HUD.OPPONENT_TRACK, state.opponent.health, unit, ox, oy, false);
    this._drawKoLabel(ctx, unit, ox, oy);
  }

  /**
   * Yellow life segments that fill the entire track (no gaps).
   * Outer boxes use an arrow tip so they meet the chrome ends.
   * @param {CanvasRenderingContext2D} ctx
   * @param {{ x: number, y: number, w: number, h: number }} track
   * @param {number} boxes
   * @param {number} unit
   * @param {number} ox
   * @param {number} oy
   * @param {boolean} leftSide
   */
  _drawLifeBoxes(ctx, track, boxes, unit, ox, oy, leftSide) {
    const count = HUD.BOX_COUNT;
    const filled = Math.max(0, Math.min(count, Math.round(boxes)));
    if (filled <= 0) return;

    const x = ox + track.x * unit;
    const y = oy + track.y * unit;
    const w = track.w * unit;
    const h = track.h * unit;

    // Per-slot widths — tip box can be shorter; others share the rest
    /** @type {number[]} */
    const widths = [];
    const tipSlot = leftSide ? 0 : count - 1;
    const tipScale = leftSide
      ? (HUD.TIP_BOX_SCALE_LEFT ?? 1)
      : (HUD.TIP_BOX_SCALE_RIGHT ?? 1);
    const tipW = (w / count) * tipScale;
    const otherW = (w - tipW) / (count - 1);
    for (let s = 0; s < count; s++) {
      widths.push(s === tipSlot ? tipW : otherW);
    }

    /** @type {number[]} */
    const starts = [];
    let cursor = x;
    for (let s = 0; s < count; s++) {
      starts.push(cursor);
      cursor += widths[s];
    }

    const tipDepth = leftSide ? HUD.TIP_DEPTH_LEFT : HUD.TIP_DEPTH_RIGHT;

    for (let i = 0; i < filled; i++) {
      // Deplete from outer tip inward — remaining boxes stay near center
      const slot = leftSide ? count - filled + i : i;
      const bw = widths[slot];
      const tip = Math.min(tipDepth * unit, bw * 0.55);
      const tipSide =
        leftSide && slot === 0 ? 'left' : !leftSide && slot === count - 1 ? 'right' : 'none';
      this._fillLifeBox(ctx, starts[slot], y, bw, h, tipSide, tip);
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} bx
   * @param {number} by
   * @param {number} bw
   * @param {number} bh
   * @param {'left' | 'right' | 'none'} tipSide
   * @param {number} tip
   */
  _fillLifeBox(ctx, bx, by, bw, bh, tipSide, tip) {
    ctx.beginPath();
    if (tipSide === 'left') {
      ctx.moveTo(bx + tip, by);
      ctx.lineTo(bx + bw, by);
      ctx.lineTo(bx + bw, by + bh);
      ctx.lineTo(bx + tip, by + bh);
      ctx.lineTo(bx, by + bh / 2);
    } else if (tipSide === 'right') {
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + bw - tip, by);
      ctx.lineTo(bx + bw, by + bh / 2);
      ctx.lineTo(bx + bw - tip, by + bh);
      ctx.lineTo(bx, by + bh);
    } else {
      ctx.rect(bx, by, bw, bh);
    }
    ctx.closePath();

    const grad = ctx.createLinearGradient(bx, by, bx, by + bh);
    grad.addColorStop(0, '#ffe98a');
    grad.addColorStop(0.45, COLORS.LIFE_BOX);
    grad.addColorStop(1, '#e0a820');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = COLORS.LIFE_BOX_EDGE;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /**
   * Center frame shows KO (classic fighting HUD).
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} unit
   * @param {number} ox
   * @param {number} oy
   */
  _drawKoLabel(ctx, unit, ox, oy) {
    const c = HUD.CENTER;
    const x = ox + c.x * unit;
    const y = oy + c.y * unit;
    const w = c.w * unit;
    const h = c.h * unit;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = 8;
    const size = Math.max(31, Math.round(22 * unit * 3 * 0.65));
    ctx.font = `bold ${size}px "Press Start 2P", monospace`;

    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#ffe566');
    grad.addColorStop(0.55, '#ff9a1a');
    grad.addColorStop(1, '#e04810');
    ctx.fillStyle = grad;

    ctx.strokeText('KO', x + w / 2, y + h / 2);
    ctx.fillText('KO', x + w / 2, y + h / 2);
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
