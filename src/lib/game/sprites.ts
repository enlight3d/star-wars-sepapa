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
import { base } from '$app/paths';

interface SpriteSet {
  center: HTMLImageElement | null;
  left: HTMLImageElement | null;
  right: HTMLImageElement | null;
  loaded: { center: boolean; left: boolean; right: boolean };
}

const xwing: SpriteSet = { center: null, left: null, right: null, loaded: { center: false, left: false, right: false } };
const tie: SpriteSet = { center: null, left: null, right: null, loaded: { center: false, left: false, right: false } };

let spritesInitialized = false;

function ensureSpritesLoaded() {
  if (spritesInitialized || typeof window === 'undefined') return;
  spritesInitialized = true;

  function loadImg(src: string): [HTMLImageElement, () => boolean] {
    const img = new Image();
    let loaded = false;
    img.onload = () => { loaded = true; };
    img.src = src;
    return [img, () => loaded];
  }

  const [xc, xcl] = loadImg(`${base}/sprites/xwing.png`);
  const [xl, xll] = loadImg(`${base}/sprites/xwing_left.png`);
  const [xr, xrl] = loadImg(`${base}/sprites/xwing_right.png`);
  xwing.center = xc; xwing.left = xl; xwing.right = xr;
  // Update loaded status via getter
  Object.defineProperty(xwing.loaded, 'center', { get: xcl });
  Object.defineProperty(xwing.loaded, 'left', { get: xll });
  Object.defineProperty(xwing.loaded, 'right', { get: xrl });

  const [tc, tcl] = loadImg(`${base}/sprites/tie.png`);
  const [tl, tll] = loadImg(`${base}/sprites/tie_left.png`);
  const [tr, trl] = loadImg(`${base}/sprites/tie_right.png`);
  tie.center = tc; tie.left = tl; tie.right = tr;
  Object.defineProperty(tie.loaded, 'center', { get: tcl });
  Object.defineProperty(tie.loaded, 'left', { get: tll });
  Object.defineProperty(tie.loaded, 'right', { get: trl });
}

// ── Texture images for walls/floor ──
let wallTexture: HTMLImageElement | null = null;
let wallTextureLoaded = false;
let floorTexture: HTMLImageElement | null = null;
let floorTextureLoaded = false;

function ensureTexturesLoaded() {
  if (typeof window === 'undefined') return;
  if (!wallTexture) {
    wallTexture = new Image();
    wallTexture.onload = () => { wallTextureLoaded = true; };
    wallTexture.src = `${base}/sprites/tiles/deathstar_wall.png`;
  }
  if (!floorTexture) {
    floorTexture = new Image();
    floorTexture.onload = () => { floorTextureLoaded = true; };
    floorTexture.src = `${base}/sprites/tiles/deathstar_floor.png`;
  }
}

// Size multiplier — controls how big sprites render (lower = smaller ships)
const SPRITE_SCALE = 0.65;

function drawImgSprite(
  ctx: CanvasRenderingContext2D,
  sprites: SpriteSet,
  x: number, y: number, scale: number,
  bank?: 'left' | 'right' | 'center'
) {
  ensureSpritesLoaded();
  const img = sprites.center;
  if (!img || !sprites.loaded.center || !img.complete) return false;

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

// ── Trench Walls — Death Star surface greebling (enhanced) ───────────
export function drawTrenchWall(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  scrollOffset: number
) {
  const ps = PS;

  // Layer 0: Tile the Death Star texture as base
  ensureTexturesLoaded();
  if (wallTextureLoaded && wallTexture) {
    const tileSize = 128; // scale the 256px texture down for denser greebling
    const tileOffY = scrollOffset % tileSize;
    ctx.save();
    ctx.globalAlpha = 0.7; // blend with dark base
    for (let ty = y - tileOffY - tileSize; ty < y + h + tileSize; ty += tileSize) {
      for (let tx = x; tx < x + w; tx += tileSize) {
        if (ty + tileSize < y || ty > y + h) continue;
        ctx.drawImage(wallTexture, tx, ty, tileSize, tileSize);
      }
    }
    ctx.restore();
  }

  // Layer 1: Base dark metal overlay — semi-transparent to let texture show through
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#0d0d16';
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;

  // Layer 2: Panel grid — two scales with depth illusion
  // Large panels (16x16)
  const largePanelSize = 16;
  const largePanelOff = (scrollOffset * 0.9) % largePanelSize; // parallax: 0.9x
  for (let py = y - largePanelOff - largePanelSize; py < y + h + largePanelSize; py += largePanelSize) {
    for (let px2 = x; px2 < x + w; px2 += largePanelSize) {
      if (py < y - 2 || py > y + h) continue;
      const hash = ((px2 * 7 + py * 13 + 37) & 0xff);
      // Panel fill — darker than base
      const shade = hash % 3 === 0 ? '#0a0a12' : hash % 3 === 1 ? '#0c0c18' : '#0b0b14';
      ctx.fillStyle = shade;
      ctx.fillRect(Math.round(px2), Math.round(py), Math.min(largePanelSize, x + w - px2), largePanelSize);
      // Top/left border (lighter — depth illusion)
      ctx.fillStyle = '#18182a';
      ctx.fillRect(Math.round(px2), Math.round(py), Math.min(largePanelSize, x + w - px2), 1);
      ctx.fillRect(Math.round(px2), Math.round(py), 1, largePanelSize);

      // Small panels (6x8) inside large panels
      for (let sy = py + 2; sy < py + largePanelSize - 2; sy += 8) {
        for (let sx = px2 + 2; sx < px2 + largePanelSize - 2; sx += 6) {
          if (sx >= x + w || sy > y + h) continue;
          const smallHash = ((sx * 3 + sy * 11 + 71) & 0xff);
          ctx.fillStyle = smallHash % 4 === 0 ? '#080810' : '#090912';
          const sw = Math.min(5, x + w - sx);
          ctx.fillRect(Math.round(sx), Math.round(sy), sw, 7);
        }
      }
    }
  }

  // Layer 3: Pipe clusters — horizontal and vertical
  if (w > 16) {
    const isLeft = x < w;
    // Thick pipes (3-4px)
    const pipeX1 = isLeft ? x + w - 10 : x + 4;
    const pipeThick = ps * 2;
    ctx.fillStyle = '#12122a';
    ctx.fillRect(pipeX1, y, pipeThick + ps, h);
    // Highlight on top edge (light from above)
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(pipeX1, y, ps, h);
    // Shadow bottom edge
    ctx.fillStyle = '#080818';
    ctx.fillRect(pipeX1 + pipeThick, y, ps, h);

    // Pipe joints / brackets
    ctx.fillStyle = '#2e2e4a';
    for (let py2 = y - (scrollOffset % 36); py2 < y + h; py2 += 36) {
      if (py2 < y - 4) continue;
      ctx.fillRect(pipeX1 - ps, Math.round(py2), pipeThick + ps * 3, ps * 2);
      ctx.fillStyle = '#3a3a55';
      ctx.fillRect(pipeX1, Math.round(py2 + 1), ps, ps);
      ctx.fillStyle = '#2e2e4a';
    }

    // Second thinner pipe
    if (w > 24) {
      const pipeX2 = isLeft ? x + w - 20 : x + 14;
      ctx.fillStyle = '#10102a';
      ctx.fillRect(pipeX2, y, ps * 2, h);
      ctx.fillStyle = '#222244';
      ctx.fillRect(pipeX2, y, 1, h);
    }

    // Third pipe (vertical)
    if (w > 35) {
      const pipeX3 = isLeft ? x + 8 : x + w - 14;
      ctx.fillStyle = '#0e0e24';
      ctx.fillRect(pipeX3, y, ps + 1, h);
      ctx.fillStyle = '#1e1e3a';
      ctx.fillRect(pipeX3, y, 1, h);
    }
  }

  // Layer 4: Indicator light clusters
  if (w > 14) {
    const lightSpacing = 48;
    const lightOff = scrollOffset % lightSpacing;
    const isLeft = x < w;
    const lightBaseX = isLeft ? x + w - 18 : x + 12;

    for (let ly = y - lightOff; ly < y + h; ly += lightSpacing) {
      if (ly < y - ps || ly > y + h - ps) continue;
      const hash = ((ly * 7 + x * 3) & 0xff);

      // Cluster of 2-3 lights
      const clusterCount = 2 + (hash % 2);
      for (let ci = 0; ci < clusterCount; ci++) {
        const lx = lightBaseX + ci * (ps * 3);
        const lightType = (hash + ci * 37) % 10;

        let color: string;
        let glowColor: string;
        let blink = false;

        if (lightType < 4) {
          // Amber (most common)
          color = '#ff8c00';
          glowColor = '#ff6600';
          blink = lightType === 0;
        } else if (lightType < 7) {
          // Red (warning)
          color = '#cc2222';
          glowColor = '#ff0000';
          blink = lightType === 4;
        } else if (lightType < 9) {
          // Green (status)
          color = '#22aa44';
          glowColor = '#00ff44';
          blink = false;
        } else {
          // Blue (rare)
          color = '#2266cc';
          glowColor = '#4488ff';
          blink = false;
        }

        // Blinking logic
        if (blink && Math.sin(scrollOffset * 0.12 + ly * 0.1 + ci) < 0) continue;

        // Glow halo
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = glowColor;
        ctx.fillRect(Math.round(lx - ps), Math.round(ly - ps), ps * 4, ps * 4);
        ctx.globalAlpha = 1;

        // Light body
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(lx), Math.round(ly), ps * 2, ps * 2);
        // Bright center
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.4;
        ctx.fillRect(Math.round(lx + 1), Math.round(ly + 1), ps, ps);
        ctx.globalAlpha = 1;
      }
    }
  }

  // Layer 5: Depth shadows — inner edge gradient
  if (x <= 1) {
    // Left wall — shadow on right edge (inner trench)
    for (let i = 0; i < 6; i++) {
      ctx.globalAlpha = 0.15 * (1 - i / 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + w - ps * (6 - i), y, ps, h);
    }
    ctx.globalAlpha = 1;
    // Bright inner edge
    ctx.fillStyle = '#2a2a44';
    ctx.fillRect(x + w - ps, y, ps, h);
  } else {
    // Right wall — shadow on left edge (inner trench)
    for (let i = 0; i < 6; i++) {
      ctx.globalAlpha = 0.15 * (1 - i / 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + ps * i, y, ps, h);
    }
    ctx.globalAlpha = 1;
    // Bright inner edge
    ctx.fillStyle = '#2a2a44';
    ctx.fillRect(x, y, ps, h);
  }

  // Layer 6: Surface weathering — streaks and scorch marks
  const streakSpacing = 80;
  const streakOff = scrollOffset % streakSpacing;
  for (let sy = y - streakOff; sy < y + h; sy += streakSpacing) {
    if (sy < y - 8 || sy > y + h) continue;
    const hash = ((sy * 13 + x * 7) & 0xff);
    if (hash % 3 === 0) {
      // Dark streak
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#060608';
      const streakW = 3 + (hash % 8);
      const streakH = 12 + (hash % 20);
      const streakX = x + (hash % Math.max(1, Math.floor(w - streakW)));
      ctx.fillRect(Math.round(streakX), Math.round(sy), streakW, streakH);
      ctx.globalAlpha = 1;
    }
    if (hash % 5 === 0) {
      // Scorch mark (dark radial)
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#080808';
      const scX = x + (hash % Math.max(1, Math.floor(w - 10)));
      ctx.fillRect(Math.round(scX), Math.round(sy), 8, 6);
      ctx.globalAlpha = 1;
    }
  }

  // Vent grates
  if (w > 28) {
    const ventSpacing = 80;
    const ventOff = scrollOffset % ventSpacing;
    const isLeft = x < w;
    const ventX = isLeft ? x + 6 : x + w - 20;
    for (let vy = y - ventOff + 30; vy < y + h; vy += ventSpacing) {
      if (vy < y || vy + 14 > y + h) continue;
      ctx.fillStyle = '#04040a';
      ctx.fillRect(ventX, Math.round(vy), ps * 6, ps * 6);
      ctx.fillStyle = '#161630';
      for (let sl = 0; sl < 6; sl += 2) {
        ctx.fillRect(ventX, Math.round(vy + sl * ps), ps * 6, ps);
      }
      ctx.fillStyle = '#222240';
      ctx.fillRect(ventX, Math.round(vy), ps * 6, 1);
      ctx.fillRect(ventX, Math.round(vy + ps * 6 - 1), ps * 6, 1);
    }
  }

  // Layer 7: Extra horizontal pipe clusters at different depths
  if (w > 20) {
    const isLeft = x < w;
    // Pipe cluster A — thin twin pipes
    const pipeA_X = isLeft ? x + 3 : x + w - 7;
    ctx.fillStyle = '#0d0d22';
    ctx.fillRect(pipeA_X, y, ps + 1, h);
    ctx.fillStyle = '#0d0d22';
    ctx.fillRect(pipeA_X + ps * 2, y, ps, h);
    ctx.fillStyle = '#1a1a36';
    ctx.fillRect(pipeA_X, y, 1, h);
    ctx.fillRect(pipeA_X + ps * 2, y, 1, h);
    // Pipe brackets
    ctx.fillStyle = '#252544';
    for (let pb = y - (scrollOffset % 52); pb < y + h; pb += 52) {
      if (pb < y - 2) continue;
      ctx.fillRect(pipeA_X - 1, Math.round(pb), ps * 3 + 2, ps);
    }

    // Pipe cluster B — offset deeper set
    if (w > 30) {
      const pipeB_X = isLeft ? x + w - 28 : x + 22;
      ctx.fillStyle = '#0b0b20';
      ctx.fillRect(pipeB_X, y, ps * 2, h);
      ctx.fillStyle = '#181834';
      ctx.fillRect(pipeB_X, y, 1, h);
      ctx.fillStyle = '#070718';
      ctx.fillRect(pipeB_X + ps * 2, y, 1, h);
      // Brackets
      ctx.fillStyle = '#222240';
      for (let pb2 = y - (scrollOffset % 44) + 20; pb2 < y + h; pb2 += 44) {
        if (pb2 < y - 2) continue;
        ctx.fillRect(pipeB_X - 1, Math.round(pb2), ps * 2 + 2, ps);
      }
    }
  }

  // Layer 8: Recessed machinery boxes with internal grid
  if (w > 22) {
    const boxSpacing = 64;
    const boxOff = scrollOffset % boxSpacing;
    const isLeft = x < w;
    for (let by = y - boxOff + 10; by < y + h; by += boxSpacing) {
      if (by < y || by + 12 > y + h) continue;
      const bHash = ((by * 11 + x * 5 + 99) & 0xff);
      if (bHash % 3 !== 0) continue; // ~33% of slots get a box
      const bx = isLeft ? x + 12 + (bHash % Math.max(1, Math.floor(w - 30))) : x + 4 + (bHash % Math.max(1, Math.floor(w - 30)));
      const bw = 8 + (bHash % 6);
      const bh = 6 + (bHash % 5);
      // Dark recessed background
      ctx.fillStyle = '#040410';
      ctx.fillRect(Math.round(bx), Math.round(by), bw, bh);
      // Internal grid lines
      ctx.fillStyle = '#0e0e24';
      for (let gx = bx + 2; gx < bx + bw - 1; gx += 3) {
        ctx.fillRect(Math.round(gx), Math.round(by + 1), 1, bh - 2);
      }
      for (let gy = by + 2; gy < by + bh - 1; gy += 3) {
        ctx.fillRect(Math.round(bx + 1), Math.round(gy), bw - 2, 1);
      }
      // Border highlight
      ctx.fillStyle = '#1a1a34';
      ctx.fillRect(Math.round(bx), Math.round(by), bw, 1);
      ctx.fillRect(Math.round(bx), Math.round(by), 1, bh);
      ctx.fillStyle = '#060614';
      ctx.fillRect(Math.round(bx), Math.round(by + bh - 1), bw, 1);
      ctx.fillRect(Math.round(bx + bw - 1), Math.round(by), 1, bh);
    }
  }

  // Layer 9: Extra indicator lights (doubled frequency, blue + white added)
  if (w > 14) {
    const lightSpacing2 = 32;
    const lightOff2 = (scrollOffset + 16) % lightSpacing2;
    const isLeft = x < w;
    const lightBaseX2 = isLeft ? x + 4 : x + w - 10;

    for (let ly = y - lightOff2; ly < y + h; ly += lightSpacing2) {
      if (ly < y - ps || ly > y + h - ps) continue;
      const hash = ((ly * 11 + x * 17 + 53) & 0xff);
      if (hash % 3 !== 0) continue; // ~33% density

      let color: string;
      let glowColor: string;
      const lightType = hash % 12;
      if (lightType < 3) { color = '#2266cc'; glowColor = '#4488ff'; }
      else if (lightType < 5) { color = '#ccccdd'; glowColor = '#ffffff'; }
      else if (lightType < 8) { color = '#ff8c00'; glowColor = '#ff6600'; }
      else { color = '#22aa44'; glowColor = '#00ff44'; }

      const blink = lightType < 2 && Math.sin(scrollOffset * 0.15 + ly * 0.08) < 0;
      if (blink) continue;

      ctx.globalAlpha = 0.2;
      ctx.fillStyle = glowColor;
      ctx.fillRect(Math.round(lightBaseX2 - 1), Math.round(ly - 1), ps * 3, ps * 3);
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(lightBaseX2), Math.round(ly), ps, ps);
    }
  }

  // Layer 10: Surface bolts/rivets at panel intersections
  {
    const boltSpacing = 16;
    const boltOff = (scrollOffset * 0.9) % boltSpacing;
    for (let by = y - boltOff; by < y + h; by += boltSpacing) {
      for (let bx = x + 2; bx < x + w - 2; bx += boltSpacing) {
        if (by < y || by > y + h) continue;
        const bHash = ((bx * 7 + by * 3 + 41) & 0xff);
        if (bHash % 4 !== 0) continue; // ~25% of intersections
        ctx.fillStyle = '#2a2a48';
        ctx.fillRect(Math.round(bx), Math.round(by), 1, 1);
        // Tiny highlight
        ctx.fillStyle = '#3e3e60';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(Math.round(bx), Math.round(by), 1, 1);
        ctx.globalAlpha = 1;
      }
    }
  }

  // Layer 11: Heat vents — small orange-lit rectangles
  if (w > 18) {
    const heatSpacing = 96;
    const heatOff = (scrollOffset + 40) % heatSpacing;
    const isLeft = x < w;
    for (let hy = y - heatOff + 50; hy < y + h; hy += heatSpacing) {
      if (hy < y || hy + 6 > y + h) continue;
      const hHash = ((hy * 9 + x * 13 + 77) & 0xff);
      if (hHash % 4 !== 0) continue;
      const hx = isLeft ? x + 8 + (hHash % Math.max(1, Math.floor(w - 20))) : x + 4 + (hHash % Math.max(1, Math.floor(w - 20)));
      // Orange glow behind
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#ff6600';
      ctx.fillRect(Math.round(hx - 1), Math.round(hy - 1), 8, 6);
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#ff4400';
      ctx.fillRect(Math.round(hx), Math.round(hy), 6, 4);
      ctx.globalAlpha = 1;
      // Vent slats
      ctx.fillStyle = '#1a0a00';
      ctx.fillRect(Math.round(hx), Math.round(hy), 6, 4);
      ctx.fillStyle = '#ff6600';
      ctx.globalAlpha = 0.4;
      for (let sl = 0; sl < 4; sl += 2) {
        ctx.fillRect(Math.round(hx), Math.round(hy + sl), 6, 1);
      }
      ctx.globalAlpha = 1;
    }
  }

  // Outer edge shadow
  if (x <= 1) {
    ctx.fillStyle = '#060610';
    ctx.fillRect(x, y, ps, h);
  } else {
    ctx.fillStyle = '#060610';
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

  // Very dark base
  ctx.fillStyle = '#050510';
  ctx.fillRect(left, 0, w, height);

  // Tile the floor texture at 0.5x parallax (deepest layer)
  ensureTexturesLoaded();
  if (floorTextureLoaded && floorTexture) {
    const tileSize = 128;
    const tileOffY = (scrollOffset * 0.5) % tileSize;
    ctx.save();
    ctx.globalAlpha = 0.6;
    for (let ty = -tileOffY - tileSize; ty < height + tileSize; ty += tileSize) {
      for (let tx = left; tx < right; tx += tileSize) {
        ctx.drawImage(floorTexture, tx, ty, tileSize, tileSize);
      }
    }
    ctx.restore();
  }

  // ── LAYER 1 (deepest, slowest parallax 0.4x): Large structural plates ──
  const deepOff = (scrollOffset * 0.4) % 64;
  const deepShades = ['#040410', '#06060e', '#050512', '#03030c'];
  for (let dy = -deepOff; dy < height; dy += 64) {
    for (let dx = left; dx < right; dx += 48) {
      const hash = ((dx * 3 + dy * 5 + 17) & 0xff);
      ctx.fillStyle = deepShades[hash % deepShades.length];
      ctx.fillRect(Math.round(dx), Math.round(dy), 48, 64);
      // Panel border — subtle depth
      ctx.fillStyle = '#0a0a18';
      ctx.fillRect(Math.round(dx), Math.round(dy), 48, 1);
      ctx.fillRect(Math.round(dx), Math.round(dy), 1, 64);
      ctx.fillStyle = '#020208';
      ctx.fillRect(Math.round(dx), Math.round(dy + 63), 48, 1);
      ctx.fillRect(Math.round(dx + 47), Math.round(dy), 1, 64);
    }
  }

  // ── LAYER 2 (mid, 0.7x parallax): Smaller surface panels + machinery ──
  const midOff = (scrollOffset * 0.7) % 24;
  const panelShades = ['#06061a', '#080814', '#0a0a1e', '#050512'];
  for (let dy = -midOff; dy < height; dy += 24) {
    for (let dx = left; dx < right; dx += 20) {
      const hash = ((dx * 11 + dy * 7 + 53) & 0xff);
      ctx.fillStyle = panelShades[hash % panelShades.length];
      ctx.fillRect(Math.round(dx), Math.round(dy), 20, 24);
    }
  }
  // Mid-layer pipes (horizontal, 0.7x parallax)
  const midPipeOff = (scrollOffset * 0.7) % 80;
  ctx.fillStyle = '#0e0e1e';
  for (let dy = -midPipeOff; dy < height; dy += 80) {
    ctx.fillRect(left, Math.round(dy), w, 3);
    ctx.fillStyle = '#141428';
    ctx.fillRect(left, Math.round(dy), w, 1);
    ctx.fillStyle = '#0e0e1e';
  }

  // ── LAYER 3 (surface, full 1.0x scroll): Grid, details, groove ──

  // Grid lines — dark cyan (#0a2a3a)
  const gridSize = 32;
  const gridOffsetY = scrollOffset % gridSize;

  // Horizontal grid
  ctx.fillStyle = '#0a2a3a';
  for (let gy = -gridOffsetY; gy < height; gy += gridSize) {
    ctx.fillRect(left, Math.round(gy), w, ps);
  }
  // Subtle glow around horizontal lines
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#1a4466';
  for (let gy = -gridOffsetY; gy < height; gy += gridSize) {
    ctx.fillRect(left, Math.round(gy - 1), w, ps + 2);
  }
  ctx.globalAlpha = 1;

  // Vertical grid
  ctx.fillStyle = '#0a2a3a';
  for (let gx = left; gx <= right; gx += gridSize) {
    ctx.fillRect(Math.round(gx), 0, ps, height);
  }
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#1a4466';
  for (let gx = left; gx <= right; gx += gridSize) {
    ctx.fillRect(Math.round(gx - 1), 0, ps + 2, height);
  }
  ctx.globalAlpha = 1;

  // Grid intersections — brighter dots
  ctx.fillStyle = '#104050';
  for (let gy = -gridOffsetY; gy < height; gy += gridSize) {
    for (let gx = left; gx <= right; gx += gridSize) {
      ctx.fillRect(Math.round(gx), Math.round(gy), ps + 1, ps + 1);
    }
  }

  // Center channel with green/cyan glow (exhaust port path)
  const cx = Math.round((left + right) / 2);
  const grooveW = Math.round(w * 0.12);
  ctx.fillStyle = '#030410';
  ctx.fillRect(cx - grooveW / 2, 0, grooveW, height);
  // Groove edge highlights — cyan glow
  ctx.fillStyle = '#0a3a50';
  ctx.fillRect(cx - grooveW / 2, 0, ps, height);
  ctx.fillRect(cx + grooveW / 2 - ps, 0, ps, height);
  // Center subtle green/cyan glow
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#22ccaa';
  ctx.fillRect(cx - grooveW / 4, 0, grooveW / 2, height);
  ctx.globalAlpha = 1;
  // Inner groove detail
  ctx.fillStyle = '#081828';
  ctx.fillRect(cx - ps, 0, ps * 2, height);

  // Floor details: hatches, grates, vent openings
  const blockSpacing = 52;
  const blockOff = scrollOffset % blockSpacing;
  for (let dy = -blockOff; dy < height; dy += blockSpacing) {
    if (dy < -12) continue;
    const hash = ((dy * 17 + 41) & 0xff);
    // Left side detail
    if (hash % 3 === 0) {
      // Hatch
      ctx.fillStyle = '#0c1420';
      ctx.fillRect(left + 8, Math.round(dy + 4), ps * 6, ps * 4);
      ctx.fillStyle = '#142030';
      ctx.fillRect(left + 8, Math.round(dy + 4), ps * 6, 1);
      ctx.fillRect(left + 8, Math.round(dy + 4 + ps * 4 - 1), ps * 6, 1);
      // Handle
      ctx.fillStyle = '#1a3040';
      ctx.fillRect(left + 12, Math.round(dy + 6), ps * 3, ps);
    } else {
      // Grate
      ctx.fillStyle = '#080e18';
      ctx.fillRect(left + 10, Math.round(dy + 6), ps * 5, ps * 3);
      ctx.fillStyle = '#0e1a28';
      ctx.fillRect(left + 10, Math.round(dy + 6), ps * 5, 1);
    }
    // Right side detail
    if (hash % 4 === 0) {
      // Vent opening
      ctx.fillStyle = '#060c14';
      ctx.fillRect(right - 10 - ps * 5, Math.round(dy + 6), ps * 5, ps * 3);
      ctx.fillStyle = '#0a1420';
      for (let sl = 0; sl < 3; sl++) {
        ctx.fillRect(right - 10 - ps * 5, Math.round(dy + 6 + sl * ps), ps * 5, 1);
      }
    } else {
      ctx.fillStyle = '#0a1020';
      ctx.fillRect(right - 10 - ps * 5, Math.round(dy + 6), ps * 5, ps * 3);
      ctx.fillStyle = '#121c30';
      ctx.fillRect(right - 10 - ps * 5, Math.round(dy + 6), ps * 5, 1);
    }
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

// ── Crossbar Obstacle (horizontal bar spanning part of trench) ───────
export function drawCrossbar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, width: number, height: number,
  scrollOffset: number
) {
  const ps = PS;
  ctx.save();

  // Main bar body — dark metallic
  ctx.fillStyle = '#2a2a3e';
  ctx.fillRect(x, y, width, height);

  // Top highlight edge
  ctx.fillStyle = '#4a4a60';
  ctx.fillRect(x, y, width, ps);

  // Bottom shadow edge
  ctx.fillStyle = '#14142a';
  ctx.fillRect(x, y + height - ps, width, ps);

  // Mid-tone panel fill
  ctx.fillStyle = '#323248';
  ctx.fillRect(x + ps, y + ps, width - ps * 2, height - ps * 2);

  // Horizontal groove line (center)
  ctx.fillStyle = '#1a1a2e';
  const midY = y + Math.round(height / 2) - 1;
  ctx.fillRect(x, midY, width, ps);
  ctx.fillStyle = '#3e3e58';
  ctx.fillRect(x, midY + ps, width, 1);

  // Rivets at regular intervals along the bar
  const rivetSpacing = Math.max(12, Math.round(width / 8));
  for (let rx = x + rivetSpacing; rx < x + width - 4; rx += rivetSpacing) {
    // Top rivet row
    ctx.fillStyle = '#5a5a70';
    ctx.fillRect(Math.round(rx), y + ps * 2, ps, ps);
    ctx.fillStyle = '#222238';
    ctx.fillRect(Math.round(rx) + 1, y + ps * 2 + 1, 1, 1);

    // Bottom rivet row
    ctx.fillStyle = '#5a5a70';
    ctx.fillRect(Math.round(rx), y + height - ps * 3, ps, ps);
    ctx.fillStyle = '#222238';
    ctx.fillRect(Math.round(rx) + 1, y + height - ps * 3 + 1, 1, 1);
  }

  // Support brackets at ends
  const bracketW = Math.min(ps * 4, width * 0.1);
  // Left bracket
  ctx.fillStyle = '#3a3a52';
  ctx.fillRect(x, y - ps * 2, bracketW, height + ps * 4);
  ctx.fillStyle = '#4e4e66';
  ctx.fillRect(x, y - ps * 2, ps, height + ps * 4);
  // Right bracket
  ctx.fillStyle = '#3a3a52';
  ctx.fillRect(x + width - bracketW, y - ps * 2, bracketW, height + ps * 4);
  ctx.fillStyle = '#4e4e66';
  ctx.fillRect(x + width - bracketW, y - ps * 2, ps, height + ps * 4);

  // Warning stripes (diagonal hash marks, subtle)
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#ffaa00';
  const stripeSpacing = ps * 6;
  for (let sx = x; sx < x + width; sx += stripeSpacing) {
    ctx.fillRect(Math.round(sx), y, ps * 2, height);
  }
  ctx.globalAlpha = 1;

  // Small blinking indicator light on left bracket
  const blink = Math.sin((scrollOffset * 0.1) + x * 0.01) > 0;
  if (blink) {
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(x + ps, y + Math.round(height / 2) - ps, ps, ps * 2);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(x, y + Math.round(height / 2) - ps * 2, ps * 3, ps * 4);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ── Wall Protrusion Types (varied Death Star machinery) ──────────────
export type ProtrusionType = 'pipes' | 'antenna' | 'sensor' | 'machinery' | 'vent';

export function drawWallProtrusion(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  onLeft: boolean, type: ProtrusionType, scrollOffset: number
) {
  const ps = PS;
  ctx.save();

  // Base block — darker than walls
  ctx.fillStyle = '#1e1e32';
  ctx.fillRect(x, y, w, h);

  // Top highlight
  ctx.fillStyle = '#3a3a54';
  ctx.fillRect(x, y, w, ps);
  // Bottom shadow
  ctx.fillStyle = '#101024';
  ctx.fillRect(x, y + h - ps, w, ps);

  // Inner edge highlight (side facing trench center)
  if (onLeft) {
    ctx.fillStyle = '#44445e';
    ctx.fillRect(x + w - ps, y, ps, h);
  } else {
    ctx.fillStyle = '#44445e';
    ctx.fillRect(x, y, ps, h);
  }

  switch (type) {
    case 'pipes': {
      // Cluster of horizontal pipes
      const pipeCount = Math.max(2, Math.floor(h / (ps * 5)));
      for (let i = 0; i < pipeCount; i++) {
        const py = y + ps * 2 + i * Math.floor((h - ps * 4) / pipeCount);
        const pipeH = ps * 2;
        // Pipe body
        ctx.fillStyle = '#2e2e48';
        ctx.fillRect(x + ps, py, w - ps * 2, pipeH);
        // Pipe highlight (top)
        ctx.fillStyle = '#4a4a66';
        ctx.fillRect(x + ps, py, w - ps * 2, 1);
        // Pipe shadow (bottom)
        ctx.fillStyle = '#161630';
        ctx.fillRect(x + ps, py + pipeH - 1, w - ps * 2, 1);
        // Joint rings
        const jointX = onLeft ? x + w - ps * 3 : x + ps;
        ctx.fillStyle = '#3a3a56';
        ctx.fillRect(jointX, py - 1, ps * 2, pipeH + 2);
      }
      break;
    }
    case 'antenna': {
      // Antenna array — vertical spikes
      const antennaCount = Math.max(2, Math.floor(w / (ps * 5)));
      for (let i = 0; i < antennaCount; i++) {
        const ax = x + ps * 2 + i * Math.floor((w - ps * 4) / antennaCount);
        const antennaH = h * 0.6 + (i % 2) * h * 0.2;
        // Antenna shaft
        ctx.fillStyle = '#383854';
        ctx.fillRect(ax, y + h - antennaH, ps, antennaH);
        // Antenna tip (blinking)
        const tipBlink = Math.sin(scrollOffset * 0.15 + i * 1.5) > 0.3;
        ctx.fillStyle = tipBlink ? '#ff4444' : '#882222';
        ctx.fillRect(ax - 1, y + h - antennaH - ps, ps + 2, ps);
      }
      // Base plate
      ctx.fillStyle = '#282844';
      ctx.fillRect(x + ps, y + h - ps * 3, w - ps * 2, ps * 2);
      break;
    }
    case 'sensor': {
      // Sensor dish — small circular dish
      const dishCx = x + w / 2;
      const dishCy = y + h / 2;
      const dishR = Math.min(w, h) * 0.35;
      // Dish mount arm
      const mountX = onLeft ? x + ps : x + w - ps * 3;
      ctx.fillStyle = '#2a2a46';
      ctx.fillRect(mountX, dishCy - ps, w * 0.3, ps * 2);
      // Dish body (pixelated circle)
      for (let dy = -dishR; dy <= dishR; dy += ps) {
        for (let dx = -dishR; dx <= dishR; dx += ps) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= dishR) {
            ctx.fillStyle = dist < dishR * 0.3 ? '#5a5a78' : dist < dishR * 0.7 ? '#3e3e5a' : '#2a2a46';
            ctx.fillRect(Math.round(dishCx + dx), Math.round(dishCy + dy), ps, ps);
          }
        }
      }
      // Center receiver
      ctx.fillStyle = '#ff8c00';
      ctx.fillRect(Math.round(dishCx - 1), Math.round(dishCy - 1), ps, ps);
      break;
    }
    case 'machinery': {
      // Complex machinery block with panel lines and vents
      const panelRows = Math.max(2, Math.floor(h / (ps * 6)));
      const panelCols = Math.max(2, Math.floor(w / (ps * 6)));
      const pw = (w - ps * 2) / panelCols;
      const ph2 = (h - ps * 2) / panelRows;
      for (let r = 0; r < panelRows; r++) {
        for (let c = 0; c < panelCols; c++) {
          const px2 = x + ps + c * pw;
          const py2 = y + ps + r * ph2;
          const shade = ((r + c) % 2 === 0) ? '#252540' : '#2a2a48';
          ctx.fillStyle = shade;
          ctx.fillRect(Math.round(px2), Math.round(py2), Math.round(pw - 1), Math.round(ph2 - 1));
          // Panel line
          ctx.fillStyle = '#161630';
          ctx.fillRect(Math.round(px2 + pw - 1), Math.round(py2), 1, Math.round(ph2));
          ctx.fillRect(Math.round(px2), Math.round(py2 + ph2 - 1), Math.round(pw), 1);
        }
      }
      // Status light
      ctx.fillStyle = '#22cc44';
      ctx.fillRect(x + ps * 2, y + ps * 2, ps, ps);
      // Small vent
      ctx.fillStyle = '#0a0a1e';
      ctx.fillRect(x + w - ps * 5, y + h - ps * 4, ps * 3, ps * 2);
      break;
    }
    case 'vent': {
      // Large vent grate
      ctx.fillStyle = '#0a0a16';
      ctx.fillRect(x + ps * 2, y + ps * 2, w - ps * 4, h - ps * 4);
      // Horizontal slats
      const slatCount = Math.max(3, Math.floor((h - ps * 4) / (ps * 3)));
      for (let i = 0; i < slatCount; i++) {
        const sy = y + ps * 2 + i * ((h - ps * 4) / slatCount);
        ctx.fillStyle = '#2a2a44';
        ctx.fillRect(x + ps * 2, Math.round(sy), w - ps * 4, ps);
      }
      // Frame
      ctx.fillStyle = '#3a3a56';
      ctx.fillRect(x + ps, y + ps, w - ps * 2, ps);
      ctx.fillRect(x + ps, y + h - ps * 2, w - ps * 2, ps);
      ctx.fillRect(x + ps, y + ps, ps, h - ps * 2);
      ctx.fillRect(x + w - ps * 2, y + ps, ps, h - ps * 2);
      break;
    }
  }

  ctx.restore();
}

// ── Vertical Pipe Obstacle (rising from trench floor) ────────────────
export function drawVerticalPipe(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  scrollOffset: number
) {
  const ps = PS;
  ctx.save();

  // Main pipe body — cylindrical shading
  const segments = Math.max(3, Math.floor(w / ps));
  for (let i = 0; i < segments; i++) {
    const sx = x + i * (w / segments);
    const sw = w / segments;
    // Cylindrical gradient: dark edges, lighter center
    const t = i / (segments - 1);
    const brightness = Math.round(20 + 30 * Math.sin(t * Math.PI));
    ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness + 20})`;
    ctx.fillRect(Math.round(sx), y, Math.ceil(sw), h);
  }

  // Highlight stripe (left of center)
  ctx.fillStyle = '#4a4a66';
  ctx.fillRect(x + Math.round(w * 0.35), y, ps, h);

  // Dark edge lines
  ctx.fillStyle = '#0e0e22';
  ctx.fillRect(x, y, ps, h);
  ctx.fillRect(x + w - ps, y, ps, h);

  // Ring joints at regular intervals
  const ringSpacing = Math.max(20, h * 0.15);
  const ringOff = scrollOffset % ringSpacing;
  for (let ry = y - ringOff; ry < y + h; ry += ringSpacing) {
    if (ry < y - 4 || ry > y + h - ps * 2) continue;
    ctx.fillStyle = '#3e3e5a';
    ctx.fillRect(x - ps, Math.round(ry), w + ps * 2, ps * 2);
    ctx.fillStyle = '#505070';
    ctx.fillRect(x - ps, Math.round(ry), w + ps * 2, 1);
    ctx.fillStyle = '#1a1a34';
    ctx.fillRect(x - ps, Math.round(ry) + ps * 2 - 1, w + ps * 2, 1);
    // Bolts on ring
    ctx.fillStyle = '#585878';
    ctx.fillRect(x + ps, Math.round(ry) + 1, ps, ps);
    ctx.fillRect(x + w - ps * 2, Math.round(ry) + 1, ps, ps);
  }

  // Top cap
  ctx.fillStyle = '#3a3a56';
  ctx.fillRect(x - ps, y, w + ps * 2, ps * 3);
  ctx.fillStyle = '#505070';
  ctx.fillRect(x - ps, y, w + ps * 2, ps);
  // Warning light on top
  const blink = Math.sin(scrollOffset * 0.12 + x * 0.05) > 0;
  ctx.fillStyle = blink ? '#ff6600' : '#662200';
  ctx.fillRect(x + Math.round(w / 2) - ps, y - ps, ps * 2, ps);
  if (blink) {
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(x + Math.round(w / 2) - ps * 3, y - ps * 2, ps * 6, ps * 3);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ── Engine Trails ────────────────────────────────────────────────────
export function drawEngineTrails(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, scale: number,
  type: 'xwing' | 'tie'
) {
  ctx.save();
  const ps = PS;
  if (type === 'xwing') {
    // Two engine trails from X-Wing, blue/cyan fading
    const engineOffsets = [
      { dx: -6 * scale, dy: 18 * scale },
      { dx: 6 * scale, dy: 18 * scale },
    ];
    for (const off of engineOffsets) {
      const ex = x + off.dx;
      const ey = y + off.dy;
      const trailLen = 22;
      for (let i = 0; i < trailLen; i++) {
        const t = i / trailLen;
        const alpha = (1 - t) * 0.7;
        const width = ps * (2.5 - t * 1.5);
        ctx.globalAlpha = alpha;
        // Gradient from bright cyan to blue
        const r = Math.round(100 * (1 - t));
        const g = Math.round(180 + 75 * (1 - t));
        const b = 255;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(
          Math.round(ex - width / 2),
          Math.round(ey + i * ps),
          Math.round(width),
          ps
        );
      }
      // Core glow
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#ccffff';
      ctx.fillRect(Math.round(ex - ps * 0.5), Math.round(ey), ps, ps * 3);
    }
  } else {
    // TIE engine trails — faint blue-white
    const engineOffsets = [
      { dx: -2 * scale, dy: 12 * scale },
      { dx: 2 * scale, dy: 12 * scale },
    ];
    for (const off of engineOffsets) {
      const ex = x + off.dx;
      const ey = y + off.dy;
      const trailLen = 12;
      for (let i = 0; i < trailLen; i++) {
        const t = i / trailLen;
        const alpha = (1 - t) * 0.3;
        const width = ps * (1.5 - t);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(180,200,255)`;
        ctx.fillRect(
          Math.round(ex - width / 2),
          Math.round(ey + i * ps),
          Math.round(Math.max(1, width)),
          ps
        );
      }
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Laser Wall Lighting ──────────────────────────────────────────────
export function drawLaserWallGlow(
  ctx: CanvasRenderingContext2D,
  laserX: number, laserY: number,
  isEnemy: boolean,
  leftWallEdge: number, rightWallEdge: number
) {
  ctx.save();
  const glowRadius = 30;
  const glowColor = isEnemy ? '#ff2222' : '#22ff22';

  // Check proximity to left wall
  const distLeft = laserX - leftWallEdge;
  if (distLeft > 0 && distLeft < glowRadius) {
    const intensity = 1 - distLeft / glowRadius;
    ctx.globalAlpha = 0.15 * intensity;
    ctx.fillStyle = glowColor;
    ctx.fillRect(
      Math.round(leftWallEdge - 5),
      Math.round(laserY - 15),
      10,
      30
    );
  }

  // Check proximity to right wall
  const distRight = rightWallEdge - laserX;
  if (distRight > 0 && distRight < glowRadius) {
    const intensity = 1 - distRight / glowRadius;
    ctx.globalAlpha = 0.15 * intensity;
    ctx.fillStyle = glowColor;
    ctx.fillRect(
      Math.round(rightWallEdge - 5),
      Math.round(laserY - 15),
      10,
      30
    );
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Wall Scrape Sparks ───────────────────────────────────────────────
export interface Spark {
  x: number; y: number; vx: number; vy: number; life: number; maxLife: number;
}

export function spawnWallSparks(px: number, py: number, side: 'left' | 'right'): Spark[] {
  const sparks: Spark[] = [];
  const count = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    sparks.push({
      x: px,
      y: py + (Math.random() - 0.5) * 10,
      vx: (side === 'left' ? 1 : -1) * (40 + Math.random() * 80),
      vy: (Math.random() - 0.5) * 120,
      life: 0.15 + Math.random() * 0.2,
      maxLife: 0.15 + Math.random() * 0.2,
    });
  }
  return sparks;
}

export function updateAndDrawSparks(
  ctx: CanvasRenderingContext2D,
  sparks: Spark[],
  dt: number
) {
  ctx.save();
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    if (s.life <= 0) { sparks.splice(i, 1); continue; }
    const t = s.life / s.maxLife;
    ctx.globalAlpha = t * 0.9;
    // Orange to yellow sparks
    const g = Math.round(120 + 135 * (1 - t));
    ctx.fillStyle = `rgb(255,${g},0)`;
    const size = Math.max(1, Math.round(t * 3));
    ctx.fillRect(Math.round(s.x), Math.round(s.y), size, size);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Screen Flash ─────────────────────────────────────────────────────
export function drawScreenFlash(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number, alpha: number
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(alpha, 0.25);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cw, ch);
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Wingman X-Wing (cosmetic, slightly behind player) ────────────────
export function drawWingmanXWing(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, scale: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  drawEngineTrails(ctx, x, y, scale, 'xwing');
  drawXWing(ctx, x, y, scale * 0.85, 'center');
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Millennium Falcon (simple shape) ─────────────────────────────────
export function drawMillenniumFalcon(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, scale: number
) {
  ctx.save();
  const s = scale * 1.2;
  const ps = PS;

  // Engine trails behind Falcon
  for (let i = 0; i < 18; i++) {
    const t = i / 18;
    ctx.globalAlpha = (1 - t) * 0.6;
    const w = ps * (8 - t * 5) * s;
    ctx.fillStyle = `rgb(${Math.round(100 + 155 * (1 - t))},${Math.round(150 + 105 * (1 - t))},255)`;
    ctx.fillRect(Math.round(x - w / 2), Math.round(y + 22 * s + i * ps * 1.5), Math.round(w), ps * 2);
  }
  ctx.globalAlpha = 1;

  // Main disc body
  const r = 18 * s;
  ctx.fillStyle = '#8888a0';
  for (let dy = -r; dy <= r; dy += ps) {
    for (let dx = -r; dx <= r; dx += ps) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= r) {
        // Shade variation
        const shade = dist < r * 0.5 ? '#9999b0' : dist < r * 0.8 ? '#7777a0' : '#666690';
        ctx.fillStyle = shade;
        ctx.fillRect(Math.round(x + dx), Math.round(y + dy), ps, ps);
      }
    }
  }

  // Cockpit (right side tube)
  ctx.fillStyle = '#6666a0';
  ctx.fillRect(Math.round(x + r * 0.6), Math.round(y - 4 * s), Math.round(8 * s), Math.round(8 * s));
  ctx.fillStyle = '#4499cc';
  ctx.fillRect(Math.round(x + r * 0.6 + 2 * s), Math.round(y - 2 * s), Math.round(3 * s), Math.round(4 * s));

  // Front mandibles
  const mandibleW = 6 * s;
  const mandibleH = 14 * s;
  // Left mandible
  ctx.fillStyle = '#7777a0';
  ctx.fillRect(Math.round(x - mandibleW - 2 * s), Math.round(y - r - mandibleH), Math.round(mandibleW), Math.round(mandibleH));
  ctx.fillStyle = '#8888b0';
  ctx.fillRect(Math.round(x - mandibleW - 2 * s), Math.round(y - r - mandibleH), Math.round(mandibleW), ps);
  // Right mandible
  ctx.fillStyle = '#7777a0';
  ctx.fillRect(Math.round(x + 2 * s), Math.round(y - r - mandibleH), Math.round(mandibleW), Math.round(mandibleH));
  ctx.fillStyle = '#8888b0';
  ctx.fillRect(Math.round(x + 2 * s), Math.round(y - r - mandibleH), Math.round(mandibleW), ps);

  // Radar dish on top
  ctx.fillStyle = '#aaaacc';
  ctx.fillRect(Math.round(x - 3 * s), Math.round(y - 5 * s), Math.round(6 * s), Math.round(6 * s));
  ctx.fillStyle = '#ccccee';
  ctx.fillRect(Math.round(x - 1 * s), Math.round(y - 3 * s), Math.round(2 * s), Math.round(2 * s));

  // Panel lines
  ctx.fillStyle = '#555580';
  ctx.fillRect(Math.round(x - r * 0.7), Math.round(y), Math.round(r * 1.4), 1);
  ctx.fillRect(Math.round(x), Math.round(y - r * 0.5), 1, Math.round(r));

  ctx.restore();
}

// ── Phase Transition Effects ─────────────────────────────────────────
export function drawPhaseTransitionOverlay(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  progress: number, // 0-1
  phase: number,
  warningFlashTimer: number
) {
  ctx.save();

  // Screen dim
  ctx.globalAlpha = 0.7 * Math.min(progress * 4, 1, (1 - progress) * 4);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, cw, ch);

  // Red warning flashes (2 pulses in first 40% of transition)
  if (progress < 0.4) {
    const flashPhase = progress / 0.4 * 2; // 0 to 2
    const flashIntensity = Math.sin(flashPhase * Math.PI);
    if (flashIntensity > 0.3) {
      ctx.globalAlpha = flashIntensity * 0.2;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, cw, ch);
    }
  }

  // Radio static effect (flickering white noise bars)
  if (progress > 0.1 && progress < 0.6) {
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 20; i++) {
      const sy = Math.random() * ch;
      const sh = 1 + Math.random() * 3;
      const bright = Math.round(100 + Math.random() * 155);
      ctx.fillStyle = `rgb(${bright},${bright},${bright})`;
      ctx.fillRect(0, Math.round(sy), cw, sh);
    }
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Green Scan Line (Phase 3 special) ────────────────────────────────
export function drawGreenScanLine(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  progress: number // 0-1, sweeps top to bottom
) {
  if (progress < 0 || progress > 1) return;
  ctx.save();
  const y = progress * ch;
  const lineH = 3;
  // Main bright line
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#44ff44';
  ctx.fillRect(0, Math.round(y), cw, lineH);
  // Glow above
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#22ff22';
  ctx.fillRect(0, Math.round(y - 8), cw, 8);
  // Trail below
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#22ff44';
  ctx.fillRect(0, Math.round(y + lineH), cw, 30);
  ctx.globalAlpha = 1;
  ctx.restore();
}
