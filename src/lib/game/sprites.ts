// ── SNES-Style Pixel Art Sprites ─────────────────────────────────────
// All drawing uses ctx.fillRect() for chunky pixel blocks.
// Pixel scale (ps) = 2-3px per "pixel" for that 16-bit look.

const PS = 2; // pixel scale — each "pixel" is 2x2 real pixels

// Helper: draw a single pixel block
function px(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(PS * s), Math.round(PS * s));
}

// Helper: draw a row of pixels from a pattern string
// Each char maps to a color in the palette, '.' = transparent
function drawRow(
  ctx: CanvasRenderingContext2D,
  row: string,
  palette: Record<string, string>,
  startX: number, y: number, s: number
) {
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '.' || ch === ' ') continue;
    const color = palette[ch];
    if (color) {
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(startX + i * PS * s),
        Math.round(y),
        Math.round(PS * s),
        Math.round(PS * s)
      );
    }
  }
}

// Draw a sprite from an array of pattern rows
function drawSprite(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  palette: Record<string, string>,
  cx: number, cy: number, s: number
) {
  const w = rows[0].length;
  const h = rows.length;
  const startX = cx - (w * PS * s) / 2;
  const startY = cy - (h * PS * s) / 2;
  for (let r = 0; r < h; r++) {
    drawRow(ctx, rows[r], palette, startX, startY + r * PS * s, s);
  }
}

// ── X-Wing (top-down, nose up, ~30 pixel-rows) ─────────────────────
// Palette: L=light gray, D=dark gray, B=blue engine, R=red accent,
// K=black outline, C=cockpit dark blue, c=cockpit light, W=white highlight
const XWING_PALETTE: Record<string, string> = {
  'K': '#1a1a2e', // black outline
  'L': '#b8b8c8', // light gray body
  'D': '#707888', // dark gray panels
  'G': '#585868', // darker gray
  'R': '#cc2222', // red stripe
  'r': '#ff4444', // red tip bright
  'B': '#2266dd', // blue engine
  'b': '#44aaff', // blue engine glow
  'C': '#1a3355', // cockpit dark
  'c': '#3388bb', // cockpit highlight
  'W': '#e0e0f0', // white highlight
  'P': '#888898', // panel line
};

// 30 rows x 31 cols sprite
const XWING_ROWS = [
  // Laser cannon tips (4 cannons at wing tips)
  '...r...........r.r...........r...',
  '...R...........K.K...........R...',
  '...G...........L.L...........G...',
  // Upper wings spread
  '..KG..........KLWLK..........GK..',
  '.KDG.........KLWWWLK.........GDK.',
  'KDRGK........KLWPWLK........KGRDK',
  'KDRG.........KDLPLDK.........GRDK',
  '.KGK..........KDLDK..........KGK.',
  '..K...........KDLDK...........K..',
  // Body continues with cockpit
  '..............KDCDK..............',
  '..............KCcCK..............',
  '..............KCcCK..............',
  '..............KDCDK..............',
  '..............KLPLK..............',
  // Lower wings spread
  '..K...........KDLDK...........K..',
  '.KGK..........KDLDK..........KGK.',
  'KDRG.........KDLPLDK.........GRDK',
  'KDRGK........KLWPWLK........KGRDK',
  '.KDG.........KLWWWLK.........GDK.',
  '..KG..........KLWLK..........GK..',
  // Engine section
  '..............KDDDK..............',
  '..............KGGDK..............',
  '.............KBbBbBK.............',
  '.............KBbBbBK.............',
  '...r...........K.K...........r...',
];

export function drawXWing(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  drawSprite(ctx, XWING_ROWS, XWING_PALETTE, x, y, scale);
  ctx.restore();
}

// ── TIE Fighter (top-down, ~24 pixel-rows) ──────────────────────────
const TIE_PALETTE: Record<string, string> = {
  'K': '#0a0a1a', // black outline
  'D': '#2a2a3e', // dark panel
  'P': '#3a3a50', // panel grid line
  'G': '#4a4a5e', // gray cockpit outer
  'L': '#6a6a7e', // lighter gray
  'C': '#555570', // cockpit body
  'R': '#cc2222', // red viewport
  'r': '#ff4444', // red viewport bright
  'S': '#383850', // strut
  'W': '#8888a0', // highlight
};

const TIE_ROWS = [
  '.KKK.........KKK.',
  'KDDDKK.....KKDDDK',
  'KDPDK.......KDPDK',
  'KDDDKK.....KKDDDK',
  'KDPDKKK...KKKDPDK',
  'KDDDKSSK.SSKDDDK',
  'KDPDKSSGKSSKDPDK',
  'KDDDKSSGKSSKDDDK',
  'KDPDKSSRRSKKDPDK',
  'KDDDKSSRRSKKDDDK',
  'KDPDKSSGKSSKDPDK',
  'KDDDKSSGKSSKDDDK',
  'KDPDKSSK.SSKDPDK',
  'KDDDKK.....KKDDDK',
  'KDPDKKK...KKKDPDK',
  'KDDDKK.....KKDDDK',
  'KDPDK.......KDPDK',
  'KDDDKK.....KKDDDK',
  '.KKK.........KKK.',
];

export function drawTIE(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  drawSprite(ctx, TIE_ROWS, TIE_PALETTE, x, y, scale);
  ctx.restore();
}

// ── Turret (wall-mounted) ───────────────────────────────────────────
const TURRET_PALETTE: Record<string, string> = {
  'K': '#1a1a2e',
  'D': '#333348',
  'G': '#555570',
  'L': '#777790',
  'R': '#cc2222',
  'r': '#ff4444',
  'B': '#444460',
};

const TURRET_ROWS_RIGHT = [
  '....KKKKK.',
  '...KDDDDK.',
  '..KDGGLDK.',
  '.KDGBBGDK.',
  'KDGBBBGDKr',
  'KDGBBBGDKr',
  '.KDGBBGDK.',
  '..KDGGLDK.',
  '...KDDDDK.',
  '....KKKKK.',
];

const TURRET_ROWS_LEFT = [
  '.KKKKK....',
  '.KDDDDK...',
  '.KDLGGDK..',
  '.KDGBBGDK.',
  'rKDGBBBGDK',
  'rKDGBBBGDK',
  '.KDGBBGDK.',
  '.KDLGGDK..',
  '.KDDDDK...',
  '.KKKKK....',
];

export function drawTurret(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  scale: number,
  facingRight: boolean,
  _aimAngle: number = 0
) {
  ctx.save();
  const rows = facingRight ? TURRET_ROWS_RIGHT : TURRET_ROWS_LEFT;
  drawSprite(ctx, rows, TURRET_PALETTE, x, y, scale);
  ctx.restore();
}

// ── Lasers (pixel-block style) ──────────────────────────────────────
export function drawLaser(ctx: CanvasRenderingContext2D, x: number, y: number, isEnemy: boolean) {
  ctx.save();
  const ps = PS;

  if (isEnemy) {
    // Red enemy bolt — 3px wide, 8px tall pixel blocks
    ctx.fillStyle = '#ff6666';
    ctx.fillRect(x - ps, y - ps * 4, ps * 2, ps * 8);
    // Bright core
    ctx.fillStyle = '#ffcccc';
    ctx.fillRect(x - ps * 0.5, y - ps * 3, ps, ps * 6);
    // Tip glow
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(x - ps * 1.5, y - ps * 5, ps * 3, ps);
    ctx.fillRect(x - ps * 1.5, y + ps * 4, ps * 3, ps);
  } else {
    // Green player bolt — longer
    ctx.fillStyle = '#44ff44';
    ctx.fillRect(x - ps, y - ps * 5, ps * 2, ps * 10);
    // Bright core
    ctx.fillStyle = '#ccffcc';
    ctx.fillRect(x - ps * 0.5, y - ps * 4, ps, ps * 8);
    // Tip glow
    ctx.fillStyle = '#22ff22';
    ctx.fillRect(x - ps * 1.5, y - ps * 6, ps * 3, ps);
    ctx.fillRect(x - ps * 1.5, y + ps * 5, ps * 3, ps);
  }

  ctx.restore();
}

// ── Trench Walls with SNES pixel art details ────────────────────────
export function drawTrenchWall(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  scrollOffset: number
) {
  const ps = PS;

  // Base wall color — dark metallic
  ctx.fillStyle = '#1c1c28';
  ctx.fillRect(x, y, w, h);

  // Panel grid (chunky pixel lines)
  const panelSize = 28;
  const offsetY = scrollOffset % panelSize;

  // Horizontal panel lines
  ctx.fillStyle = '#2a2a3a';
  for (let py = y - offsetY; py < y + h; py += panelSize) {
    if (py < y - ps) continue;
    ctx.fillRect(x, Math.round(py), w, ps);
  }

  // Vertical panel lines
  for (let px2 = x; px2 < x + w; px2 += panelSize) {
    ctx.fillRect(Math.round(px2), y, ps, h);
  }

  // Dithered shading on alternating panels (checkerboard pattern)
  for (let py = y - offsetY; py < y + h; py += panelSize) {
    for (let px2 = x; px2 < x + w; px2 += panelSize) {
      const col = Math.floor((px2 - x) / panelSize);
      const row = Math.floor((py - y + offsetY) / panelSize);
      if ((col + row) % 2 === 0) {
        // Dithered darker panel
        ctx.fillStyle = '#141420';
        for (let dy = 0; dy < panelSize; dy += ps * 2) {
          for (let dx = 0; dx < panelSize; dx += ps * 2) {
            const realX = px2 + dx + ((dy / (ps * 2)) % 2 === 0 ? 0 : ps);
            const realY = py + dy;
            if (realX >= x && realX < x + w && realY >= y && realY < y + h) {
              ctx.fillRect(Math.round(realX), Math.round(realY), ps, ps);
            }
          }
        }
      }
    }
  }

  // Pipes (vertical, near inner edge) — chunky pixel blocks
  if (w > 20) {
    const isLeft = x < w;
    const pipeX = isLeft ? x + w - 8 : x + 4;
    ctx.fillStyle = '#282840';
    ctx.fillRect(pipeX, y, ps * 2, h);
    ctx.fillStyle = '#3a3a50';
    ctx.fillRect(pipeX + ps, y, ps, h);

    // Pipe joints
    ctx.fillStyle = '#3a3a55';
    for (let py2 = y - (scrollOffset % 56); py2 < y + h; py2 += 56) {
      if (py2 < y - 4) continue;
      ctx.fillRect(pipeX - ps, Math.round(py2), ps * 4, ps * 2);
    }
  }

  // Small amber/red lights
  if (w > 16) {
    const lightSpacing = 84;
    const lightOff = scrollOffset % lightSpacing;
    const isLeft = x < w;
    const lightX = isLeft ? x + w - 16 : x + 12;

    for (let ly = y - lightOff; ly < y + h; ly += lightSpacing) {
      if (ly < y - ps || ly > y + h) continue;
      // Amber light pixel block
      ctx.fillStyle = '#ff8c00';
      ctx.fillRect(Math.round(lightX), Math.round(ly), ps * 2, ps * 2);
      // Glow (dithered)
      ctx.fillStyle = '#cc6600';
      ctx.fillRect(Math.round(lightX - ps), Math.round(ly - ps), ps, ps);
      ctx.fillRect(Math.round(lightX + ps * 2), Math.round(ly - ps), ps, ps);
      ctx.fillRect(Math.round(lightX - ps), Math.round(ly + ps * 2), ps, ps);
      ctx.fillRect(Math.round(lightX + ps * 2), Math.round(ly + ps * 2), ps, ps);
    }

    // Red lights (offset)
    for (let ly = y - ((scrollOffset + 42) % lightSpacing); ly < y + h; ly += lightSpacing) {
      if (ly < y - ps || ly > y + h) continue;
      ctx.fillStyle = '#cc2222';
      ctx.fillRect(Math.round(lightX + 6), Math.round(ly), ps * 2, ps * 2);
    }
  }

  // Vent grates
  if (w > 30) {
    const ventSpacing = 112;
    const ventOff = scrollOffset % ventSpacing;
    const isLeft = x < w;
    const ventX = isLeft ? x + 8 : x + w - 18;
    for (let vy = y - ventOff + 30; vy < y + h; vy += ventSpacing) {
      if (vy < y || vy + 12 > y + h) continue;
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(ventX, Math.round(vy), ps * 5, ps * 5);
      // Slats
      ctx.fillStyle = '#222238';
      for (let sl = 0; sl < 5; sl += 2) {
        ctx.fillRect(ventX, Math.round(vy + sl * ps), ps * 5, ps);
      }
    }
  }

  // Inner edge highlight
  if (x <= 1) {
    // Left wall — bright edge on right
    ctx.fillStyle = '#3a3a50';
    ctx.fillRect(x + w - ps, y, ps, h);
  } else {
    // Right wall — bright edge on left
    ctx.fillStyle = '#3a3a50';
    ctx.fillRect(x, y, ps, h);
  }
}

// ── Trench Floor with glowing grid ──────────────────────────────────
export function drawTrenchFloor(
  ctx: CanvasRenderingContext2D,
  left: number, right: number, height: number,
  scrollOffset: number
) {
  const w = right - left;
  const ps = PS;

  // Dark floor base
  ctx.fillStyle = '#08080e';
  ctx.fillRect(left, 0, w, height);

  // Grid lines — pixel blocks
  const gridSize = 36;
  const gridOffsetY = scrollOffset % gridSize;

  // Horizontal grid — dim blue
  ctx.fillStyle = '#141830';
  for (let gy = -gridOffsetY; gy < height; gy += gridSize) {
    ctx.fillRect(left, Math.round(gy), w, ps);
  }

  // Vertical grid
  for (let gx = left; gx <= right; gx += gridSize) {
    ctx.fillRect(Math.round(gx), 0, ps, height);
  }

  // Center groove (trench channel)
  const cx = Math.round((left + right) / 2);
  const grooveW = Math.round(w * 0.08);
  ctx.fillStyle = '#0c0c18';
  ctx.fillRect(cx - grooveW / 2, 0, grooveW, height);
  // Groove edge highlights
  ctx.fillStyle = '#1a1a35';
  ctx.fillRect(cx - grooveW / 2, 0, ps, height);
  ctx.fillRect(cx + grooveW / 2 - ps, 0, ps, height);

  // Surface detail blocks
  ctx.fillStyle = '#0e0e1a';
  const detailSpacing = 72;
  const detailOff = scrollOffset % detailSpacing;
  for (let dy = -detailOff; dy < height; dy += detailSpacing) {
    if (dy < -10) continue;
    ctx.fillRect(left + 12, Math.round(dy + 8), ps * 6, ps * 3);
    ctx.fillRect(right - 12 - ps * 6, Math.round(dy + 8), ps * 6, ps * 3);
  }
}

// ── Explosions — SNES style with pixel debris ───────────────────────
export function drawExplosion(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  frame: number, maxFrames: number,
  big: boolean = false
) {
  const progress = frame / maxFrames;
  const ps = PS;
  const sizeBase = big ? 16 : 10;
  const particleCount = big ? 16 : 10;

  ctx.save();

  // Stage 1: White flash (0-15%)
  if (progress < 0.15) {
    const flashSize = Math.round(sizeBase * (1 - progress / 0.15));
    ctx.fillStyle = '#ffffff';
    for (let dy = -flashSize; dy <= flashSize; dy += ps) {
      for (let dx = -flashSize; dx <= flashSize; dx += ps) {
        if (Math.abs(dx) + Math.abs(dy) < flashSize * 1.5) {
          ctx.fillRect(Math.round(x + dx), Math.round(y + dy), ps, ps);
        }
      }
    }
  }

  // Stage 2: Orange/yellow fireball (5-60%)
  if (progress > 0.05 && progress < 0.6) {
    const fbProgress = (progress - 0.05) / 0.55;
    const fbSize = Math.round(sizeBase * 0.8 * fbProgress);
    const alpha = 1 - fbProgress;
    ctx.globalAlpha = alpha;

    // Outer orange pixels
    ctx.fillStyle = '#ff6600';
    for (let dy = -fbSize; dy <= fbSize; dy += ps) {
      for (let dx = -fbSize; dx <= fbSize; dx += ps) {
        if (Math.abs(dx) + Math.abs(dy) < fbSize * 1.4) {
          // Dithered edge
          const dist = Math.abs(dx) + Math.abs(dy);
          if (dist > fbSize * 0.8 && (dx + dy) % (ps * 2) === 0) continue;
          ctx.fillRect(Math.round(x + dx), Math.round(y + dy), ps, ps);
        }
      }
    }

    // Inner yellow
    ctx.fillStyle = '#ffcc00';
    const innerSize = Math.round(fbSize * 0.5);
    for (let dy = -innerSize; dy <= innerSize; dy += ps) {
      for (let dx = -innerSize; dx <= innerSize; dx += ps) {
        if (Math.abs(dx) + Math.abs(dy) < innerSize * 1.4) {
          ctx.fillRect(Math.round(x + dx), Math.round(y + dy), ps, ps);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // Stage 3: Debris particles (10-85%)
  if (progress > 0.1 && progress < 0.85) {
    const debrisProgress = (progress - 0.1) / 0.75;
    ctx.globalAlpha = (1 - debrisProgress) * 0.9;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (i * 1.37);
      const speed = 0.4 + ((i * 7 + 3) % 5) / 5 * 0.6;
      const dist = sizeBase * 2 * debrisProgress * speed;
      const ppx = x + Math.cos(angle) * dist;
      const ppy = y + Math.sin(angle) * dist;
      const size = Math.round((1 - debrisProgress) * ps * (1 + (i % 3)));

      ctx.fillStyle = debrisProgress < 0.3 ? '#ffcc00' :
                      debrisProgress < 0.6 ? '#ff8800' : '#cc4400';
      ctx.fillRect(Math.round(ppx), Math.round(ppy), size, size);
    }
    ctx.globalAlpha = 1;
  }

  // Stage 4: Smoke (50-100%) — dithered gray
  if (progress > 0.5) {
    const smokeProgress = (progress - 0.5) / 0.5;
    ctx.globalAlpha = (1 - smokeProgress) * 0.3;
    const smokeSize = Math.round(sizeBase * 0.6 * (0.5 + smokeProgress * 0.5));
    ctx.fillStyle = '#555566';
    for (let dy = -smokeSize; dy <= smokeSize; dy += ps * 2) {
      for (let dx = -smokeSize; dx <= smokeSize; dx += ps * 2) {
        if (Math.abs(dx) + Math.abs(dy) < smokeSize * 1.2) {
          ctx.fillRect(Math.round(x + dx), Math.round(y + dy), ps, ps);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ── Pixel Font Renderer (5x7 per character) ─────────────────────────
// Each char is a 5-wide, 7-tall bitmap stored as 7 numbers (bits 0-4)
const PIXEL_FONT: Record<string, number[]> = {
  'A': [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  'B': [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  'C': [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  'D': [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  'E': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  'F': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  'G': [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01110],
  'H': [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  'I': [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b11111],
  'J': [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  'K': [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  'L': [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  'M': [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  'N': [0b10001, 0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001],
  'O': [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  'P': [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  'Q': [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  'R': [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  'S': [0b01110, 0b10001, 0b10000, 0b01110, 0b00001, 0b10001, 0b01110],
  'T': [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  'U': [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  'V': [0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b01010, 0b00100],
  'W': [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  'X': [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  'Y': [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  'Z': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  '0': [0b01110, 0b10011, 0b10101, 0b10101, 0b10101, 0b11001, 0b01110],
  '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b11111],
  '2': [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  '3': [0b01110, 0b10001, 0b00001, 0b00110, 0b00001, 0b10001, 0b01110],
  '4': [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  '5': [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  '6': [0b01110, 0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  '8': [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00001, 0b01110],
  ':': [0b00000, 0b00100, 0b00100, 0b00000, 0b00100, 0b00100, 0b00000],
  '/': [0b00001, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b10000],
  ' ': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
  '!': [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
  '.': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00100],
  ',': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00100, 0b01000],
  '-': [0b00000, 0b00000, 0b00000, 0b11111, 0b00000, 0b00000, 0b00000],
  "'": [0b00100, 0b00100, 0b01000, 0b00000, 0b00000, 0b00000, 0b00000],
  '?': [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b00000, 0b00100],
  'x': [0b00000, 0b00000, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001],
  '[': [0b01110, 0b01000, 0b01000, 0b01000, 0b01000, 0b01000, 0b01110],
  ']': [0b01110, 0b00010, 0b00010, 0b00010, 0b00010, 0b00010, 0b01110],
  '|': [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
};

// Accented characters mapped to base
const ACCENT_MAP: Record<string, string> = {
  '\u00c0': 'A', '\u00c1': 'A', '\u00c2': 'A', '\u00c3': 'A', '\u00c4': 'A',
  '\u00c8': 'E', '\u00c9': 'E', '\u00ca': 'E', '\u00cb': 'E',
  '\u00cc': 'I', '\u00cd': 'I', '\u00ce': 'I', '\u00cf': 'I',
  '\u00d2': 'O', '\u00d3': 'O', '\u00d4': 'O', '\u00d5': 'O', '\u00d6': 'O',
  '\u00d9': 'U', '\u00da': 'U', '\u00db': 'U', '\u00dc': 'U',
  '\u00e0': 'A', '\u00e1': 'A', '\u00e2': 'A', '\u00e3': 'A', '\u00e4': 'A',
  '\u00e8': 'E', '\u00e9': 'E', '\u00ea': 'E', '\u00eb': 'E',
  '\u00ec': 'I', '\u00ed': 'I', '\u00ee': 'I', '\u00ef': 'I',
  '\u00f2': 'O', '\u00f3': 'O', '\u00f4': 'O', '\u00f5': 'O', '\u00f6': 'O',
  '\u00f9': 'U', '\u00fa': 'U', '\u00fb': 'U', '\u00fc': 'U',
};

export function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  color: string, pixelSize: number = 2,
  align: 'left' | 'center' | 'right' = 'left',
  maxChars: number = text.length
) {
  const charW = 6; // 5 pixels + 1 gap
  const visibleText = text.substring(0, maxChars);
  const totalW = visibleText.length * charW * pixelSize;
  let startX = x;
  if (align === 'center') startX = x - totalW / 2;
  else if (align === 'right') startX = x - totalW;

  ctx.fillStyle = color;

  for (let ci = 0; ci < visibleText.length; ci++) {
    let ch = visibleText[ci].toUpperCase();
    // Map accented characters
    if (ACCENT_MAP[ch]) ch = ACCENT_MAP[ch];
    if (ACCENT_MAP[visibleText[ci]]) ch = ACCENT_MAP[visibleText[ci]];

    const glyph = PIXEL_FONT[ch];
    if (!glyph) continue;

    const cx = startX + ci * charW * pixelSize;
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row] & (1 << (4 - col))) {
          ctx.fillRect(
            Math.round(cx + col * pixelSize),
            Math.round(y + row * pixelSize),
            pixelSize,
            pixelSize
          );
        }
      }
    }
  }
}

// ── Shield Icon (SNES style) ────────────────────────────────────────
export function drawShieldIcon(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number,
  filled: boolean
) {
  const ps = Math.max(1, Math.round(size / 6));
  if (filled) {
    // Filled shield — bright blue
    ctx.fillStyle = '#44aaff';
    // Top row
    ctx.fillRect(x + ps, y, ps * 4, ps);
    // Middle rows
    ctx.fillRect(x, y + ps, ps * 6, ps);
    ctx.fillRect(x, y + ps * 2, ps * 6, ps);
    ctx.fillRect(x, y + ps * 3, ps * 6, ps);
    // Narrowing
    ctx.fillRect(x + ps, y + ps * 4, ps * 4, ps);
    ctx.fillRect(x + ps * 2, y + ps * 5, ps * 2, ps);
    // Highlight
    ctx.fillStyle = '#88ccff';
    ctx.fillRect(x + ps, y + ps, ps * 2, ps);
  } else {
    // Empty shield — dark outline only
    ctx.fillStyle = '#333344';
    ctx.fillRect(x + ps, y, ps * 4, ps);
    ctx.fillRect(x, y + ps, ps, ps * 3);
    ctx.fillRect(x + ps * 5, y + ps, ps, ps * 3);
    ctx.fillRect(x + ps, y + ps * 4, ps, ps);
    ctx.fillRect(x + ps * 4, y + ps * 4, ps, ps);
    ctx.fillRect(x + ps * 2, y + ps * 5, ps * 2, ps);
  }
}

// ── Targeting Reticle (for Phase 3) ─────────────────────────────────
export function drawTargetingReticle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number,
  progress: number, // 0-1 how locked on
  time: number
) {
  const ps = PS;
  const r = size * (1 - progress * 0.6);
  const pulse = Math.sin(time * 4) * 0.3 + 0.7;

  ctx.save();
  ctx.globalAlpha = 0.7 * pulse;

  // Outer brackets — pixel blocks
  ctx.fillStyle = '#44ff44';
  const bLen = Math.round(r * 0.3);

  // Top-left bracket
  ctx.fillRect(Math.round(cx - r), Math.round(cy - r), bLen, ps);
  ctx.fillRect(Math.round(cx - r), Math.round(cy - r), ps, bLen);

  // Top-right bracket
  ctx.fillRect(Math.round(cx + r - bLen), Math.round(cy - r), bLen, ps);
  ctx.fillRect(Math.round(cx + r - ps), Math.round(cy - r), ps, bLen);

  // Bottom-left bracket
  ctx.fillRect(Math.round(cx - r), Math.round(cy + r - ps), bLen, ps);
  ctx.fillRect(Math.round(cx - r), Math.round(cy + r - bLen), ps, bLen);

  // Bottom-right bracket
  ctx.fillRect(Math.round(cx + r - bLen), Math.round(cy + r - ps), bLen, ps);
  ctx.fillRect(Math.round(cx + r - ps), Math.round(cy + r - bLen), ps, bLen);

  // Crosshair lines (dashed pixel blocks)
  ctx.fillStyle = '#22cc22';
  const dashLen = ps * 2;
  const gapLen = ps * 2;
  // Horizontal
  for (let dx = -r + bLen + ps * 2; dx < -ps * 3; dx += dashLen + gapLen) {
    ctx.fillRect(Math.round(cx + dx), Math.round(cy - ps / 2), dashLen, ps);
  }
  for (let dx = ps * 3; dx < r - bLen - ps * 2; dx += dashLen + gapLen) {
    ctx.fillRect(Math.round(cx + dx), Math.round(cy - ps / 2), dashLen, ps);
  }
  // Vertical
  for (let dy = -r + bLen + ps * 2; dy < -ps * 3; dy += dashLen + gapLen) {
    ctx.fillRect(Math.round(cx - ps / 2), Math.round(cy + dy), ps, dashLen);
  }
  for (let dy = ps * 3; dy < r - bLen - ps * 2; dy += dashLen + gapLen) {
    ctx.fillRect(Math.round(cx - ps / 2), Math.round(cy + dy), ps, dashLen);
  }

  // Center dot
  ctx.fillStyle = '#44ff44';
  ctx.fillRect(Math.round(cx - ps), Math.round(cy - ps), ps * 2, ps * 2);

  // "DISTANCE" readout (flashing)
  if (progress > 0.2) {
    ctx.globalAlpha = 0.6;
    const dist = Math.round((1 - progress) * 999);
    drawPixelText(ctx, `DST:${String(dist).padStart(3, '0')}M`, cx, cy + r + ps * 4, '#44ff44', 1, 'center');
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Exhaust Port ────────────────────────────────────────────────────
export function drawExhaustPort(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number,
  time: number
) {
  const ps = PS;
  const r = Math.round(size / 2);
  const pulse = Math.sin(time * 3) * 0.2 + 0.8;

  ctx.save();

  // Outer ring — dark metal
  ctx.fillStyle = '#2a2a3e';
  for (let dy = -r - ps * 2; dy <= r + ps * 2; dy += ps) {
    for (let dx = -r - ps * 2; dx <= r + ps * 2; dx += ps) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= r + ps * 2 && dist >= r - ps) {
        ctx.fillRect(Math.round(cx + dx), Math.round(cy + dy), ps, ps);
      }
    }
  }

  // Inner glow — orange/red
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ff4400';
  for (let dy = -r + ps; dy <= r - ps; dy += ps) {
    for (let dx = -r + ps; dx <= r - ps; dx += ps) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= r - ps * 2) {
        // Dithered inner
        if ((dx + dy) % (ps * 2) === 0) {
          ctx.fillStyle = '#ff8800';
        } else {
          ctx.fillStyle = '#ff4400';
        }
        ctx.fillRect(Math.round(cx + dx), Math.round(cy + dy), ps, ps);
      }
    }
  }

  // Bright center
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(Math.round(cx - ps), Math.round(cy - ps), ps * 2, ps * 2);

  ctx.globalAlpha = 1;
  ctx.restore();
}
