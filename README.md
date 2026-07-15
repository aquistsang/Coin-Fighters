# Casino Fighters

Street Fighter–inspired web mini-game fused with Hi/Lo casino mechanics.

## Play

Bet **HI** or **LO** (buttons or keys `1` / `2`). Correct guess → your fighter attacks and removes an opponent life box. Wrong guess → they hit you and you lose a box. Empty your boxes and you lose.

## Stack

- HTML5 Canvas
- Vanilla ES modules (no build step)
- Deployed on Vercel

## Local

Open `index.html` via any static server (ES modules need HTTP):

```bash
npx serve .
```

## Assets

Drop fighter sprites into `assets/`. The player idle plate is `assets/player-fighter.png`. See comments in `src/assets.js` for sprite-sheet wiring.

## Structure

| Path | Role |
|------|------|
| `src/main.js` | Entry |
| `src/game.js` | Hi/Lo loop, streak, win/lose |
| `src/fighter.js` | States: IDLE, ATTACKING, HIT_REACTION, SPECIAL |
| `src/animation-manager.js` | Frame / procedural idle |
| `src/effects.js` | Sparks, damage pops, shake |
| `src/render.js` | Stage + HUD |
| `src/input.js` | Keyboard + buttons |
