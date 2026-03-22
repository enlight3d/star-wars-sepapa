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

// ── X-Wing (top-down, nose up) ───────────────────────────────────
// Designed with THICK prominent wings in a clear X shape
const XWING_PALETTE: Record<string, string> = {
  'K': '#1a1a2e', // outline
  'L': '#c8c8d8', // light gray body
  'D': '#808898', // dark gray
  'G': '#606070', // darker gray
  'M': '#a0a0b0', // mid gray
  'R': '#cc2222', // red stripe
  'r': '#ff4444', // red tip / cannon
  'B': '#2266dd', // engine blue
  'b': '#55bbff', // engine glow
  'n': '#88ddff', // engine cyan
  'C': '#1a3355', // cockpit dark
  'c': '#4499cc', // cockpit light
  'W': '#e8e8f8', // white highlight
  'P': '#707080', // panel line
  'T': '#484858', // dark accent
};

// Clear X-Wing shape: thick 3px wings forming a visible X
// 33 rows x 33 cols
const XWING_ROWS = [
  'r..............W..............r', //  0 cannon tips top
  'RR.............W.............RR', //  1
  'GRR...........WLW...........RRG', //  2 upper wings start
  'GGRR..........WLW..........RRGG', //  3
  '.GGRR........WLLLW........RRGG.', //  4
  '..GGRR.......WLPLW.......RRGG..', //  5
  '...GGRR......WLPLW......RRGG...', //  6
  '....GGRR.....WLPLW.....RRGG....', //  7
  '.....GGRR....DLPDL....RRGG.....', //  8
  '......GGRR...DLPDL...RRGG......', //  9
  '.......GGR...DLPDL...RGG.......', // 10
  '..............DLPDL.............', // 11
  '..............DLWDL.............', // 12
  '.............KDLWLDK............', // 13 cockpit area
  '.............KTCcCTK............', // 14
  '.............KTCccCTK...........', // 15
  '.............KTCccCTK...........', // 16
  '.............KTCcCTK............', // 17
  '.............KDLWLDK............', // 18
  '..............DLWDL.............', // 19
  '..............DLPDL.............', // 20
  '.......GGR...DLPDL...RGG.......', // 21 lower wings start
  '......GGRR...DLPDL...RRGG......', // 22
  '.....GGRR....DLPDL....RRGG.....', // 23
  '....GGRR.....WLPLW.....RRGG....', // 24
  '...GGRR......WLPLW......RRGG...', // 25
  '..GGRR.......WLPLW.......RRGG..', // 26
  '.GGRR........WLLLW........RRGG.', // 27
  'GGRR..........WLW..........RRGG', // 28
  'GRR...........WLW...........RRG', // 29
  'RR.............W.............RR', // 30
  'r..............T..............r', // 31 cannon tips bottom
  '..............TBnBT.............', // 32 engines
  '.............TBbnbBT............', // 33
];

// ── Image-based sprites (loaded from PNG files) ─────────────────────
interface SpriteSet {
  center: HTMLImageElement;
  left: HTMLImageElement;
  right: HTMLImageElement;
  loaded: { center: boolean; left: boolean; right: boolean };
}

const xwing: SpriteSet = {
  center: new Image(), left: new Image(), right: new Image(),
  loaded: { center: false, left: false, right: false }
};

const tie: SpriteSet = {
  center: new Image(), left: new Image(), right: new Image(),
  loaded: { center: false, left: false, right: false }
};

function initSprites() {
  xwing.center.onload = () => { xwing.loaded.center = true; };
  xwing.left.onload = () => { xwing.loaded.left = true; };
  xwing.right.onload = () => { xwing.loaded.right = true; };
  xwing.center.src = '/sprites/xwing.png';
  xwing.left.src = '/sprites/xwing_left.png';
  xwing.right.src = '/sprites/xwing_right.png';

  tie.center.onload = () => { tie.loaded.center = true; };
  tie.left.onload = () => { tie.loaded.left = true; };
  tie.right.onload = () => { tie.loaded.right = true; };
  tie.center.src = '/sprites/tie.png';
  tie.left.src = '/sprites/tie_left.png';
  tie.right.src = '/sprites/tie_right.png';
}

initSprites();

// Size multiplier — controls how big sprites render (lower = smaller ships)
const SPRITE_SCALE = 0.65;

function drawImgSprite(
  ctx: CanvasRenderingContext2D,
  sprites: SpriteSet,
  x: number, y: number, scale: number,
  bank?: 'left' | 'right' | 'center'
) {
  const img = sprites.center;
  if (!sprites.loaded.center || !img.complete) return false;

  const w = img.width * scale * SPRITE_SCALE;
  const h = img.height * scale * SPRITE_SCALE;

  // Banking angle — subtle tilt
  const bankAngle = bank === 'left' ? -0.15 : bank === 'right' ? 0.15 : 0;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  if (bankAngle !== 0) ctx.rotate(bankAngle);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
  return true;
}

export function drawXWing(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, bank?: 'left' | 'right' | 'center') {
  if (!drawImgSprite(ctx, xwing, x, y, scale, bank)) {
    // Fallback
    ctx.save();
    drawSprite(ctx, XWING_ROWS, XWING_PALETTE, x, y, scale);
    ctx.restore();
  }
}

// ── TIE Fighter (top-down, ~32 rows x 33 cols) ─────────────────────
const TIE_PALETTE: Record<string, string> = {
  'K': '#0a0a1a', // black outline
  'D': '#1e1e30', // dark panel fill
  'P': '#2a2a40', // panel mid
  'Q': '#323248', // panel grid line light
  'G': '#4a4a5e', // gray cockpit outer
  'L': '#6a6a7e', // lighter gray
  'C': '#555570', // cockpit body
  'H': '#7a7a90', // cockpit highlight
  'R': '#cc3322', // red viewport
  'r': '#ff5544', // red viewport bright
  'O': '#ff8844', // orange viewport glow
  'S': '#383850', // strut
  's': '#444460', // strut highlight
  'W': '#8888a0', // highlight
  'B': '#161628', // darkest panel
  'g': '#353550', // grid line inside panel
};

// 32 rows x 33 cols — large hexagonal panels with grid pattern
const TIE_ROWS = [
  // Top edges of hexagonal panels
  '..KKKK...................KKKK..', // row 0
  '.KBDDDK.................KDDDBK.', // row 1
  'KBDgDgDKK.............KKDgDgDBK', // row 2
  'KDgPgPgDKK...........KKDgPgPgDK', // row 3
  'KBDgDgDgDKK.........KKDgDgDgDBK', // row 4
  'KDgPgPgPgDKK.......KKDgPgPgPgDK', // row 5
  'KBDgDgDgDgDKK.....KKDgDgDgDgDBK', // row 6
  'KDgPgPgPgPgDKK...KKDgPgPgPgPgDK', // row 7
  'KBDgDgDgDgDgDKK.KKDgDgDgDgDgDBK', // row 8
  'KDgPgPgPgPgPgDKSKDgPgPgPgPgPgDK', // row 9
  'KBDgDgDgDgDgDgKSKgDgDgDgDgDgDBK', // row 10
  'KDgPgPgPgPgPgDKSKDgPgPgPgPgPgDK', // row 11
  'KBDgDgDgDgDgDgKsKgDgDgDgDgDgDBK', // row 12
  'KDgPgPgPgPgPgDKGKDgPgPgPgPgPgDK', // row 13
  'KBDgDgDgDgDgDgKCKgDgDgDgDgDgDBK', // row 14
  'KDgPgPgPgPgPgDKRKDgPgPgPgPgPgDK', // row 15  cockpit center with viewport
  'KBDgDgDgDgDgDgKrKgDgDgDgDgDgDBK', // row 16
  'KDgPgPgPgPgPgDKRKDgPgPgPgPgPgDK', // row 17
  'KBDgDgDgDgDgDgKCKgDgDgDgDgDgDBK', // row 18
  'KDgPgPgPgPgPgDKGKDgPgPgPgPgPgDK', // row 19
  'KBDgDgDgDgDgDgKsKgDgDgDgDgDgDBK', // row 20
  'KDgPgPgPgPgPgDKSKDgPgPgPgPgPgDK', // row 21
  'KBDgDgDgDgDgDgKSKgDgDgDgDgDgDBK', // row 22
  'KDgPgPgPgPgPgDKSKDgPgPgPgPgPgDK', // row 23
  'KBDgDgDgDgDgDKK.KKDgDgDgDgDgDBK', // row 24
  'KDgPgPgPgPgDKK...KKDgPgPgPgPgDK', // row 25
  'KBDgDgDgDgDKK.....KKDgDgDgDgDBK', // row 26
  'KDgPgPgPgDKK.......KKDgPgPgPgDK', // row 27
  'KBDgDgDgDKK.........KKDgDgDgDBK', // row 28
  'KDgPgPgDKK...........KKDgPgPgDK', // row 29
  '.KBDDDK.................KDDDBK.', // row 30
  '..KKKK...................KKKK..', // row 31
];

export function drawTIE(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, bank?: 'left' | 'right' | 'center') {
  if (!drawImgSprite(ctx, tie, x, y, scale, bank)) {
    ctx.save();
    drawSprite(ctx, TIE_ROWS, TIE_PALETTE, x, y, scale);
    ctx.restore();
  }
}

// ── Turret (wall-mounted, ~16 rows x 16 cols) ──────────────────────
const TURRET_PALETTE: Record<string, string> = {
  'K': '#1a1a2e', // outline
  'D': '#2a2a40', // dark base
  'G': '#555570', // mid gray
  'M': '#444458', // mount gray
  'L': '#777790', // light gray barrel
  'H': '#9090a8', // highlight
  'R': '#cc2222', // red glow
  'r': '#ff4444', // red tip bright
  'g': '#22cc22', // green glow
  'e': '#44ff44', // green tip bright
  'B': '#333348', // base dark
  'V': '#222236', // rivet / bolt
  'S': '#666680', // barrel shine
  'T': '#3a3a50', // turret body mid
};

const TURRET_ROWS_RIGHT = [
  '....KKKKKKKKK.......',
  '...KVDDDDDDDVK......',
  '..KVDBBGGGBBDVK.....',
  '.KVDBTTTTTTTBDVK....',
  'KVDBTTGLLGTTTBDVK...',
  'KVDBTGLHHLGTBDVKSSS.',
  'KVDBTGLHHLGTBDVKSeSe',
  'KVDBTGLHHLGTBDVKSeSe',
  'KVDBTGLHHLGTBDVKSSS.',
  'KVDBTTGLLGTTTBDVK...',
  '.KVDBTTTTTTTBDVK....',
  '..KVDBBGGGBBDVK.....',
  '...KVDDDDDDDVK......',
  '....KKKKKKKKK.......',
];

const TURRET_ROWS_LEFT = [
  '.......KKKKKKKKK....',
  '......KVDDDDDDDVK...',
  '.....KVDBBGGGBBDVK..',
  '....KVDBTTTTTTTBDVK.',
  '...KVDBTTGLLGTTTBDVK',
  '.SSSKVDBTGLHHLGTBDVK',
  'eSeSKVDBTGLHHLGTBDVK',
  'eSeSKVDBTGLHHLGTBDVK',
  '.SSSKVDBTGLHHLGTBDVK',
  '...KVDBTTGLLGTTTBDVK',
  '....KVDBTTTTTTTBDVK.',
  '.....KVDBBGGGBBDVK..',
  '......KVDDDDDDDVK...',
  '.......KKKKKKKKK....',
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

// ── Lasers (pixel-block style with glow) ─────────────────────────────
export function drawLaser(ctx: CanvasRenderingContext2D, x: number, y: number, isEnemy: boolean) {
  ctx.save();
  const ps = PS;

  if (isEnemy) {
    // Red enemy bolt — glow aura
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(x - ps * 3, y - ps * 5, ps * 6, ps * 10);
    ctx.globalAlpha = 1;
    // Outer darker red
    ctx.fillStyle = '#aa1111';
    ctx.fillRect(x - ps * 1.5, y - ps * 5, ps * 3, ps * 10);
    // Main body
    ctx.fillStyle = '#ff5555';
    ctx.fillRect(x - ps, y - ps * 4, ps * 2, ps * 8);
    // Bright core
    ctx.fillStyle = '#ffbbbb';
    ctx.fillRect(x - ps * 0.5, y - ps * 3.5, ps, ps * 7);
    // Tips
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(x - ps * 2, y - ps * 6, ps * 4, ps);
    ctx.fillRect(x - ps * 2, y + ps * 5, ps * 4, ps);
    ctx.fillStyle = '#ffcccc';
    ctx.fillRect(x - ps * 0.5, y - ps * 6, ps, ps);
    ctx.fillRect(x - ps * 0.5, y + ps * 5, ps, ps);
  } else {
    // Green player bolt — longer, with glow
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#22ff22';
    ctx.fillRect(x - ps * 3, y - ps * 7, ps * 6, ps * 14);
    ctx.globalAlpha = 1;
    // Outer darker green
    ctx.fillStyle = '#11aa11';
    ctx.fillRect(x - ps * 1.5, y - ps * 6, ps * 3, ps * 12);
    // Main body
    ctx.fillStyle = '#44ff44';
    ctx.fillRect(x - ps, y - ps * 5, ps * 2, ps * 10);
    // Bright core
    ctx.fillStyle = '#ccffcc';
    ctx.fillRect(x - ps * 0.5, y - ps * 4.5, ps, ps * 9);
    // Tips
    ctx.fillStyle = '#22ff22';
    ctx.fillRect(x - ps * 2, y - ps * 7, ps * 4, ps);
    ctx.fillRect(x - ps * 2, y + ps * 6, ps * 4, ps);
    ctx.fillStyle = '#eeffee';
    ctx.fillRect(x - ps * 0.5, y - ps * 7, ps, ps);
    ctx.fillRect(x - ps * 0.5, y + ps * 6, ps, ps);
  }

  ctx.restore();
}

// ── Trench Walls — Death Star surface greebling ──────────────────────
export function drawTrenchWall(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  scrollOffset: number
) {
  const ps = PS;

  // Base wall color — dark metallic
  ctx.fillStyle = '#1a1a26';
  ctx.fillRect(x, y, w, h);

  // Dense greebling: many small rectangles at slightly different shades
  const greebleShades = ['#16161f', '#1e1e2c', '#222234', '#262638', '#1c1c28', '#202030'];
  const greebleH = 14;
  const greebleOff = scrollOffset % greebleH;

  // Seed-based pseudo-random for consistent greeble pattern
  for (let gy = y - greebleOff - greebleH; gy < y + h + greebleH; gy += greebleH) {
    for (let gx = x; gx < x + w; gx += 8) {
      if (gy < y - 2 || gy > y + h) continue;
      const hash = ((gx * 7 + gy * 13 + 37) & 0xff);
      const shade = greebleShades[hash % greebleShades.length];
      const gw = 4 + (hash % 5) * 2;
      const gh = 4 + ((hash >> 3) % 4) * 2;
      ctx.fillStyle = shade;
      ctx.fillRect(
        Math.round(gx),
        Math.round(gy),
        Math.min(gw, x + w - gx),
        Math.min(gh, y + h - gy)
      );
    }
  }

  // Horizontal panel seam lines (conduits)
  const panelH = 32;
  const panelOff = scrollOffset % panelH;
  ctx.fillStyle = '#0e0e18';
  for (let py = y - panelOff; py < y + h; py += panelH) {
    if (py < y - ps) continue;
    ctx.fillRect(x, Math.round(py), w, ps);
  }
  // Highlight below each seam
  ctx.fillStyle = '#2e2e42';
  for (let py = y - panelOff + ps; py < y + h; py += panelH) {
    if (py < y) continue;
    ctx.fillRect(x, Math.round(py), w, 1);
  }

  // Vertical panel seam lines at regular intervals
  const vertSpacing = 24;
  ctx.fillStyle = '#0e0e18';
  for (let vx = x; vx < x + w; vx += vertSpacing) {
    ctx.fillRect(Math.round(vx), y, 1, h);
  }
  // Highlight next to each vertical seam
  ctx.fillStyle = '#2a2a3c';
  for (let vx = x + 1; vx < x + w; vx += vertSpacing) {
    ctx.fillRect(Math.round(vx), y, 1, h);
  }

  // Horizontal pipe / conduit (chunky, near inner edge)
  if (w > 20) {
    const isLeft = x < w;
    const pipeX = isLeft ? x + w - 10 : x + 4;
    // Dark pipe body
    ctx.fillStyle = '#1c1c2e';
    ctx.fillRect(pipeX, y, ps * 3, h);
    // Pipe highlight (top edge)
    ctx.fillStyle = '#3a3a52';
    ctx.fillRect(pipeX, y, ps, h);
    // Pipe shadow (bottom edge)
    ctx.fillStyle = '#101020';
    ctx.fillRect(pipeX + ps * 2, y, ps, h);

    // Pipe joints / brackets
    ctx.fillStyle = '#3a3a55';
    for (let py2 = y - (scrollOffset % 48); py2 < y + h; py2 += 48) {
      if (py2 < y - 4) continue;
      ctx.fillRect(pipeX - ps, Math.round(py2), ps * 5, ps * 2);
      // Bolt on bracket
      ctx.fillStyle = '#4a4a60';
      ctx.fillRect(pipeX, Math.round(py2 + 1), ps, ps);
      ctx.fillStyle = '#3a3a55';
    }

    // Second pipe (thinner)
    if (w > 30) {
      const pipe2X = isLeft ? x + w - 20 : x + 14;
      ctx.fillStyle = '#1e1e30';
      ctx.fillRect(pipe2X, y, ps * 2, h);
      ctx.fillStyle = '#2e2e44';
      ctx.fillRect(pipe2X, y, 1, h);
    }
  }

  // Amber indicator lights
  if (w > 16) {
    const lightSpacing = 64;
    const lightOff = scrollOffset % lightSpacing;
    const isLeft = x < w;
    const lightX = isLeft ? x + w - 18 : x + 14;

    for (let ly = y - lightOff; ly < y + h; ly += lightSpacing) {
      if (ly < y - ps || ly > y + h) continue;
      // Amber light pixel block
      ctx.fillStyle = '#ff8c00';
      ctx.fillRect(Math.round(lightX), Math.round(ly), ps * 2, ps * 2);
      // Glow halo (dithered)
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(Math.round(lightX - ps), Math.round(ly - ps), ps * 4, ps * 4);
      ctx.globalAlpha = 1;
      // Bright center
      ctx.fillStyle = '#ffcc44';
      ctx.fillRect(Math.round(lightX + 1), Math.round(ly + 1), ps, ps);
    }

    // Red lights (offset from amber)
    for (let ly = y - ((scrollOffset + 32) % lightSpacing); ly < y + h; ly += lightSpacing) {
      if (ly < y - ps || ly > y + h) continue;
      ctx.fillStyle = '#cc2222';
      ctx.fillRect(Math.round(lightX + 8), Math.round(ly), ps, ps * 2);
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(Math.round(lightX + 8), Math.round(ly), ps, ps);
    }

    // Green status lights (sparse)
    for (let ly = y - ((scrollOffset + 50) % (lightSpacing * 2)); ly < y + h; ly += lightSpacing * 2) {
      if (ly < y - ps || ly > y + h) continue;
      ctx.fillStyle = '#22aa44';
      ctx.fillRect(Math.round(lightX - 6), Math.round(ly), ps, ps);
    }
  }

  // Vent grates
  if (w > 30) {
    const ventSpacing = 96;
    const ventOff = scrollOffset % ventSpacing;
    const isLeft = x < w;
    const ventX = isLeft ? x + 6 : x + w - 20;
    for (let vy = y - ventOff + 30; vy < y + h; vy += ventSpacing) {
      if (vy < y || vy + 14 > y + h) continue;
      // Vent recess
      ctx.fillStyle = '#08080e';
      ctx.fillRect(ventX, Math.round(vy), ps * 6, ps * 6);
      // Horizontal slats
      ctx.fillStyle = '#1e1e30';
      for (let sl = 0; sl < 6; sl += 2) {
        ctx.fillRect(ventX, Math.round(vy + sl * ps), ps * 6, ps);
      }
      // Border
      ctx.fillStyle = '#2a2a3e';
      ctx.fillRect(ventX, Math.round(vy), ps * 6, 1);
      ctx.fillRect(ventX, Math.round(vy + ps * 6 - 1), ps * 6, 1);
    }
  }

  // Inner edge highlight (where trench floor meets wall)
  if (x <= 1) {
    // Left wall — bright edge on right
    ctx.fillStyle = '#3e3e56';
    ctx.fillRect(x + w - ps, y, ps, h);
    ctx.fillStyle = '#2a2a40';
    ctx.fillRect(x + w - ps * 2, y, ps, h);
  } else {
    // Right wall — bright edge on left
    ctx.fillStyle = '#3e3e56';
    ctx.fillRect(x, y, ps, h);
    ctx.fillStyle = '#2a2a40';
    ctx.fillRect(x + ps, y, ps, h);
  }

  // Outer edge shadow
  if (x <= 1) {
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(x, y, ps, h);
  } else {
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(x + w - ps, y, ps, h);
  }
}

// ── Trench Floor with glowing grid and detail panels ─────────────────
export function drawTrenchFloor(
  ctx: CanvasRenderingContext2D,
  left: number, right: number, height: number,
  scrollOffset: number
) {
  const w = right - left;
  const ps = PS;

  // Dark floor base
  ctx.fillStyle = '#060610';
  ctx.fillRect(left, 0, w, height);

  // Surface detail panels (subtle shade variation)
  const detailH = 24;
  const detailW = 20;
  const detailOff = scrollOffset % detailH;
  const panelShades = ['#08081a', '#0a0a16', '#0c0c1e', '#070714'];
  for (let dy = -detailOff; dy < height; dy += detailH) {
    for (let dx = left; dx < right; dx += detailW) {
      const hash = ((dx * 11 + dy * 7 + 53) & 0xff);
      ctx.fillStyle = panelShades[hash % panelShades.length];
      ctx.fillRect(Math.round(dx), Math.round(dy), detailW, detailH);
    }
  }

  // Grid lines — glowing cyan/blue
  const gridSize = 32;
  const gridOffsetY = scrollOffset % gridSize;

  // Horizontal grid — dim cyan
  ctx.fillStyle = '#0c1830';
  for (let gy = -gridOffsetY; gy < height; gy += gridSize) {
    ctx.fillRect(left, Math.round(gy), w, ps);
  }
  // Brighter blue glow around horizontal lines
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#2244aa';
  for (let gy = -gridOffsetY; gy < height; gy += gridSize) {
    ctx.fillRect(left, Math.round(gy - 1), w, ps + 2);
  }
  ctx.globalAlpha = 1;

  // Vertical grid
  ctx.fillStyle = '#0c1830';
  for (let gx = left; gx <= right; gx += gridSize) {
    ctx.fillRect(Math.round(gx), 0, ps, height);
  }
  // Glow
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#2244aa';
  for (let gx = left; gx <= right; gx += gridSize) {
    ctx.fillRect(Math.round(gx - 1), 0, ps + 2, height);
  }
  ctx.globalAlpha = 1;

  // Grid intersections — brighter dots
  ctx.fillStyle = '#1a3060';
  for (let gy = -gridOffsetY; gy < height; gy += gridSize) {
    for (let gx = left; gx <= right; gx += gridSize) {
      ctx.fillRect(Math.round(gx), Math.round(gy), ps, ps);
    }
  }

  // Center groove (trench channel)
  const cx = Math.round((left + right) / 2);
  const grooveW = Math.round(w * 0.1);
  ctx.fillStyle = '#040410';
  ctx.fillRect(cx - grooveW / 2, 0, grooveW, height);
  // Groove edge highlights — cyan glow
  ctx.fillStyle = '#1a2a50';
  ctx.fillRect(cx - grooveW / 2, 0, ps, height);
  ctx.fillRect(cx + grooveW / 2 - ps, 0, ps, height);
  // Subtle inner groove detail
  ctx.fillStyle = '#0a1228';
  ctx.fillRect(cx - ps, 0, ps * 2, height);

  // Surface detail blocks (equipment, hatches)
  const blockSpacing = 64;
  const blockOff = scrollOffset % blockSpacing;
  for (let dy = -blockOff; dy < height; dy += blockSpacing) {
    if (dy < -12) continue;
    // Left side equipment block
    ctx.fillStyle = '#0e1020';
    ctx.fillRect(left + 10, Math.round(dy + 6), ps * 5, ps * 3);
    ctx.fillStyle = '#141830';
    ctx.fillRect(left + 10, Math.round(dy + 6), ps * 5, 1);
    // Right side
    ctx.fillStyle = '#0e1020';
    ctx.fillRect(right - 10 - ps * 5, Math.round(dy + 6), ps * 5, ps * 3);
    ctx.fillStyle = '#141830';
    ctx.fillRect(right - 10 - ps * 5, Math.round(dy + 6), ps * 5, 1);
  }
}

// ── Explosions — SNES style spectacular ──────────────────────────────
export function drawExplosion(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  frame: number, maxFrames: number,
  big: boolean = false
) {
  const progress = frame / maxFrames;
  const ps = PS;
  const sizeBase = big ? 28 : 14;
  const particleCount = big ? 24 : 14;

  ctx.save();

  // Stage 1: White flash (0-12%)
  if (progress < 0.12) {
    const flashIntensity = 1 - progress / 0.12;
    const flashSize = Math.round(sizeBase * 0.8 * flashIntensity);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = flashIntensity;
    for (let dy = -flashSize; dy <= flashSize; dy += ps) {
      for (let dx = -flashSize; dx <= flashSize; dx += ps) {
        if (Math.abs(dx) + Math.abs(dy) < flashSize * 1.6) {
          ctx.fillRect(Math.round(x + dx), Math.round(y + dy), ps, ps);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // Stage 2: Yellow core (5-40%)
  if (progress > 0.05 && progress < 0.4) {
    const coreProgress = (progress - 0.05) / 0.35;
    const coreSize = Math.round(sizeBase * 0.5 * (0.3 + coreProgress * 0.7));
    const alpha = (1 - coreProgress) * 0.95;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffee44';
    for (let dy = -coreSize; dy <= coreSize; dy += ps) {
      for (let dx = -coreSize; dx <= coreSize; dx += ps) {
        if (Math.abs(dx) + Math.abs(dy) < coreSize * 1.4) {
          ctx.fillRect(Math.round(x + dx), Math.round(y + dy), ps, ps);
        }
      }
    }
    // White hot center
    ctx.fillStyle = '#ffffff';
    const innerSize = Math.round(coreSize * 0.3);
    for (let dy = -innerSize; dy <= innerSize; dy += ps) {
      for (let dx = -innerSize; dx <= innerSize; dx += ps) {
        if (Math.abs(dx) + Math.abs(dy) < innerSize * 1.2) {
          ctx.fillRect(Math.round(x + dx), Math.round(y + dy), ps, ps);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // Stage 3: Orange fireball (8-55%)
  if (progress > 0.08 && progress < 0.55) {
    const fbProgress = (progress - 0.08) / 0.47;
    const fbSize = Math.round(sizeBase * 0.9 * fbProgress);
    const alpha = (1 - fbProgress) * 0.85;
    ctx.globalAlpha = alpha;

    // Outer dark red
    ctx.fillStyle = '#aa2200';
    for (let dy = -fbSize; dy <= fbSize; dy += ps) {
      for (let dx = -fbSize; dx <= fbSize; dx += ps) {
        if (Math.abs(dx) + Math.abs(dy) < fbSize * 1.4) {
          const dist = Math.abs(dx) + Math.abs(dy);
          if (dist > fbSize * 0.9 && (dx + dy) % (ps * 2) === 0) continue;
          ctx.fillRect(Math.round(x + dx), Math.round(y + dy), ps, ps);
        }
      }
    }

    // Mid orange
    ctx.fillStyle = '#ff6600';
    const midSize = Math.round(fbSize * 0.7);
    for (let dy = -midSize; dy <= midSize; dy += ps) {
      for (let dx = -midSize; dx <= midSize; dx += ps) {
        if (Math.abs(dx) + Math.abs(dy) < midSize * 1.3) {
          ctx.fillRect(Math.round(x + dx), Math.round(y + dy), ps, ps);
        }
      }
    }

    // Inner yellow
    ctx.fillStyle = '#ffcc00';
    const innerSize = Math.round(fbSize * 0.35);
    for (let dy = -innerSize; dy <= innerSize; dy += ps) {
      for (let dx = -innerSize; dx <= innerSize; dx += ps) {
        if (Math.abs(dx) + Math.abs(dy) < innerSize * 1.4) {
          ctx.fillRect(Math.round(x + dx), Math.round(y + dy), ps, ps);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // Stage 4: Debris particles flying outward (10-85%)
  if (progress > 0.1 && progress < 0.85) {
    const debrisProgress = (progress - 0.1) / 0.75;
    ctx.globalAlpha = (1 - debrisProgress) * 0.9;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (i * 1.37);
      const speed = 0.3 + ((i * 7 + 3) % 5) / 5 * 0.7;
      const dist = sizeBase * 2.5 * debrisProgress * speed;
      const ppx = x + Math.cos(angle) * dist;
      const ppy = y + Math.sin(angle) * dist;
      const size = Math.round((1 - debrisProgress) * ps * (1 + (i % 3)));

      // Color gradient based on progress: white -> yellow -> orange -> red -> dark red
      if (debrisProgress < 0.15) {
        ctx.fillStyle = '#ffffff';
      } else if (debrisProgress < 0.3) {
        ctx.fillStyle = '#ffee44';
      } else if (debrisProgress < 0.5) {
        ctx.fillStyle = '#ff8800';
      } else if (debrisProgress < 0.7) {
        ctx.fillStyle = '#cc4400';
      } else {
        ctx.fillStyle = '#882200';
      }
      ctx.fillRect(Math.round(ppx), Math.round(ppy), size, size);
    }

    // Secondary smaller debris (for big explosions)
    if (big) {
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12 + 0.5;
        const speed = 0.6 + ((i * 3 + 1) % 4) / 4 * 0.4;
        const dist = sizeBase * 1.5 * debrisProgress * speed;
        const ppx = x + Math.cos(angle) * dist;
        const ppy = y + Math.sin(angle) * dist;
        const size = Math.round((1 - debrisProgress) * ps);
        ctx.fillStyle = debrisProgress < 0.4 ? '#ffaa22' : '#664422';
        ctx.fillRect(Math.round(ppx), Math.round(ppy), size, size);
      }
    }
    ctx.globalAlpha = 1;
  }

  // Stage 5: Smoke ring (40-100%) — dithered multi-shade gray
  if (progress > 0.4) {
    const smokeProgress = (progress - 0.4) / 0.6;
    ctx.globalAlpha = (1 - smokeProgress) * 0.35;
    const smokeSize = Math.round(sizeBase * 0.7 * (0.4 + smokeProgress * 0.6));
    const smokeColors = ['#444455', '#555566', '#3a3a4a', '#4e4e5e'];
    for (let dy = -smokeSize; dy <= smokeSize; dy += ps * 2) {
      for (let dx = -smokeSize; dx <= smokeSize; dx += ps * 2) {
        if (Math.abs(dx) + Math.abs(dy) < smokeSize * 1.2) {
          const hash = ((dx * 3 + dy * 7) & 0xff);
          ctx.fillStyle = smokeColors[hash % smokeColors.length];
          ctx.fillRect(Math.round(x + dx), Math.round(y + dy), ps, ps);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // Stage 6: Final dark red embers (big only, 60-95%)
  if (big && progress > 0.6 && progress < 0.95) {
    const emberProgress = (progress - 0.6) / 0.35;
    ctx.globalAlpha = (1 - emberProgress) * 0.5;
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + 2.1;
      const dist = sizeBase * 0.8 * (0.5 + emberProgress * 0.5);
      const ex = x + Math.cos(angle) * dist;
      const ey = y + Math.sin(angle) * dist;
      ctx.fillStyle = '#aa3300';
      ctx.fillRect(Math.round(ex), Math.round(ey), ps, ps);
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
