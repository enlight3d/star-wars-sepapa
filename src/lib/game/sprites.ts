// ── X-Wing (top-down, nose pointing UP) ─────────────────────────────
// Approx 40×40 at scale=1
export function drawXWing(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  const s = scale;
  ctx.save();
  ctx.translate(x, y);

  // Engine glow (bottom)
  ctx.fillStyle = '#1e90ff';
  ctx.shadowColor = '#4fc3f7';
  ctx.shadowBlur = 8 * s;
  ctx.fillRect(-2 * s, 14 * s, 2 * s, 4 * s);
  ctx.fillRect(1 * s, 14 * s, 2 * s, 4 * s);
  ctx.shadowBlur = 0;

  // Fuselage (center body)
  ctx.fillStyle = '#bbb';
  ctx.fillRect(-3 * s, -16 * s, 7 * s, 32 * s);
  // Nose taper
  ctx.fillStyle = '#ddd';
  ctx.beginPath();
  ctx.moveTo(-2 * s, -16 * s);
  ctx.lineTo(0.5 * s, -20 * s);
  ctx.lineTo(3 * s, -16 * s);
  ctx.closePath();
  ctx.fill();

  // Cockpit
  ctx.fillStyle = '#4fc3f7';
  ctx.fillRect(-1.5 * s, -10 * s, 4 * s, 5 * s);
  ctx.fillStyle = '#2196f3';
  ctx.fillRect(-1 * s, -9 * s, 3 * s, 3 * s);

  // Upper-left wing
  ctx.fillStyle = '#999';
  ctx.beginPath();
  ctx.moveTo(-3 * s, -8 * s);
  ctx.lineTo(-18 * s, -16 * s);
  ctx.lineTo(-18 * s, -12 * s);
  ctx.lineTo(-3 * s, -2 * s);
  ctx.closePath();
  ctx.fill();

  // Upper-right wing
  ctx.beginPath();
  ctx.moveTo(4 * s, -8 * s);
  ctx.lineTo(19 * s, -16 * s);
  ctx.lineTo(19 * s, -12 * s);
  ctx.lineTo(4 * s, -2 * s);
  ctx.closePath();
  ctx.fill();

  // Lower-left wing
  ctx.beginPath();
  ctx.moveTo(-3 * s, 2 * s);
  ctx.lineTo(-18 * s, 12 * s);
  ctx.lineTo(-18 * s, 16 * s);
  ctx.lineTo(-3 * s, 8 * s);
  ctx.closePath();
  ctx.fill();

  // Lower-right wing
  ctx.beginPath();
  ctx.moveTo(4 * s, 2 * s);
  ctx.lineTo(19 * s, 12 * s);
  ctx.lineTo(19 * s, 16 * s);
  ctx.lineTo(4 * s, 8 * s);
  ctx.closePath();
  ctx.fill();

  // Wing struts (laser cannons)
  ctx.fillStyle = '#777';
  ctx.fillRect(-19 * s, -17 * s, 2 * s, 6 * s);
  ctx.fillRect(18 * s, -17 * s, 2 * s, 6 * s);
  ctx.fillRect(-19 * s, 11 * s, 2 * s, 6 * s);
  ctx.fillRect(18 * s, 11 * s, 2 * s, 6 * s);

  // Red wing-tip accents
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(-19 * s, -18 * s, 2 * s, 2 * s);
  ctx.fillRect(18 * s, -18 * s, 2 * s, 2 * s);
  ctx.fillRect(-19 * s, 16 * s, 2 * s, 2 * s);
  ctx.fillRect(18 * s, 16 * s, 2 * s, 2 * s);

  // Body panel lines
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 0.5 * s;
  ctx.beginPath();
  ctx.moveTo(0.5 * s, -16 * s);
  ctx.lineTo(0.5 * s, 14 * s);
  ctx.stroke();

  ctx.restore();
}

// ── TIE Fighter (top-down) ──────────────────────────────────────────
// Approx 30×30 at scale=1
export function drawTIE(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  const s = scale;
  ctx.save();
  ctx.translate(x, y);

  // Wing panels (hexagonal)
  ctx.fillStyle = '#444';
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1 * s;

  // Left wing panel
  ctx.beginPath();
  ctx.moveTo(-14 * s, -12 * s);
  ctx.lineTo(-8 * s, -14 * s);
  ctx.lineTo(-8 * s, 14 * s);
  ctx.lineTo(-14 * s, 12 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right wing panel
  ctx.beginPath();
  ctx.moveTo(14 * s, -12 * s);
  ctx.lineTo(8 * s, -14 * s);
  ctx.lineTo(8 * s, 14 * s);
  ctx.lineTo(14 * s, 12 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wing panel detail lines
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 0.5 * s;
  for (let i = -10; i <= 10; i += 5) {
    ctx.beginPath();
    ctx.moveTo(-14 * s, i * s);
    ctx.lineTo(-8 * s, i * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8 * s, i * s);
    ctx.lineTo(14 * s, i * s);
    ctx.stroke();
  }

  // Connecting struts
  ctx.fillStyle = '#555';
  ctx.fillRect(-8 * s, -1 * s, 4 * s, 2 * s);
  ctx.fillRect(4 * s, -1 * s, 4 * s, 2 * s);

  // Cockpit ball
  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.arc(0, 0, 5 * s, 0, Math.PI * 2);
  ctx.fill();

  // Cockpit window
  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath();
  ctx.arc(0, 0, 3 * s, 0, Math.PI * 2);
  ctx.fill();

  // Cockpit highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(-1 * s, -1 * s, 1.5 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ── Turret (wall-mounted) ───────────────────────────────────────────
export function drawTurret(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, facingRight: boolean) {
  const s = scale;
  ctx.save();
  ctx.translate(x, y);
  if (!facingRight) ctx.scale(-1, 1);

  // Base
  ctx.fillStyle = '#555';
  ctx.fillRect(-4 * s, -5 * s, 8 * s, 10 * s);

  // Gun barrel
  ctx.fillStyle = '#777';
  ctx.fillRect(4 * s, -2 * s, 8 * s, 4 * s);

  // Barrel tip
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(11 * s, -1 * s, 2 * s, 2 * s);

  // Detail lines
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 0.5 * s;
  ctx.strokeRect(-3 * s, -4 * s, 6 * s, 8 * s);

  ctx.restore();
}

// ── Lasers ──────────────────────────────────────────────────────────
export function drawLaser(ctx: CanvasRenderingContext2D, x: number, y: number, isEnemy: boolean) {
  ctx.save();
  const color = isEnemy ? '#ff4444' : '#00ff44';
  const glow = isEnemy ? '#ff6666' : '#66ff88';

  // Glow
  ctx.shadowColor = glow;
  ctx.shadowBlur = 6;

  // Bolt (vertical - elongated in Y)
  ctx.fillStyle = color;
  if (isEnemy) {
    // Enemy: red, going downward
    ctx.fillRect(x - 1.5, y - 5, 3, 10);
    ctx.fillStyle = '#ffaaaa';
    ctx.fillRect(x - 0.5, y - 4, 1, 8);
  } else {
    // Player: green, going upward
    ctx.fillRect(x - 1.5, y - 6, 3, 12);
    ctx.fillStyle = '#aaffaa';
    ctx.fillRect(x - 0.5, y - 5, 1, 10);
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Trench Walls ────────────────────────────────────────────────────
export function drawTrenchWall(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  scrollOffset: number
) {
  // Base wall color
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(x, y, w, h);

  // Panel grid lines (scrolling)
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  const panelSize = 30;
  const offsetY = scrollOffset % panelSize;

  // Horizontal lines
  for (let py = y - offsetY; py < y + h; py += panelSize) {
    if (py < y) continue;
    ctx.beginPath();
    ctx.moveTo(x, py);
    ctx.lineTo(x + w, py);
    ctx.stroke();
  }

  // Vertical lines
  for (let px = x; px < x + w; px += panelSize) {
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px, y + h);
    ctx.stroke();
  }

  // Inner panel detail (every other panel gets a recessed look)
  ctx.fillStyle = '#222';
  for (let py = y - offsetY; py < y + h; py += panelSize * 2) {
    for (let px = x; px < x + w; px += panelSize * 2) {
      const ry = Math.max(py + 3, y);
      const rh = Math.min(panelSize - 6, y + h - ry);
      if (rh > 0 && px + 3 < x + w) {
        const rw = Math.min(panelSize - 6, x + w - px - 3);
        if (rw > 0) ctx.fillRect(px + 3, ry, rw, rh);
      }
    }
  }

  // Wall edge highlight
  ctx.fillStyle = '#555';
  if (x === 0) {
    // Left wall - highlight on right edge
    ctx.fillRect(x + w - 2, y, 2, h);
  } else {
    // Right wall - highlight on left edge
    ctx.fillRect(x, y, 2, h);
  }
}

// ── Explosions ──────────────────────────────────────────────────────
export function drawExplosion(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, maxFrames: number) {
  const progress = frame / maxFrames;
  const particleCount = 12;
  const maxRadius = 25;

  ctx.save();

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + (i % 2) * 0.3;
    const dist = maxRadius * progress * (0.5 + 0.5 * ((i * 7) % 3) / 2);
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist;

    const size = (1 - progress) * (3 + (i % 3));

    // Color progression: white -> yellow -> orange -> red
    let color: string;
    if (progress < 0.2) color = '#ffffff';
    else if (progress < 0.4) color = '#ffff44';
    else if (progress < 0.7) color = '#ff8800';
    else color = '#ff4400';

    ctx.globalAlpha = 1 - progress;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.fillRect(px - size / 2, py - size / 2, size, size);
  }

  // Central flash (early frames only)
  if (progress < 0.3) {
    ctx.globalAlpha = (0.3 - progress) / 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, 8 * (1 - progress / 0.3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
