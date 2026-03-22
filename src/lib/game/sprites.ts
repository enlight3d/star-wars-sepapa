export function drawXWing(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  const s = scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ccc';
  ctx.fillRect(-2 * s, -1 * s, 5 * s, 2 * s);
  ctx.fillStyle = '#eee';
  ctx.fillRect(3 * s, -0.5 * s, 2 * s, 1 * s);
  ctx.fillStyle = '#aaa';
  ctx.fillRect(-1 * s, -4 * s, 3 * s, 1 * s);
  ctx.fillRect(-1 * s, 3 * s, 3 * s, 1 * s);
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(2 * s, -4 * s, 1 * s, 1 * s);
  ctx.fillRect(2 * s, 3 * s, 1 * s, 1 * s);
  ctx.fillStyle = '#4fc3f7';
  ctx.fillRect(-3 * s, -0.5 * s, 1 * s, 1 * s);
  ctx.restore();
}

export function drawTIE(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  const s = scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#555';
  ctx.fillRect(-1 * s, -4 * s, 1 * s, 8 * s);
  ctx.fillRect(1 * s, -4 * s, 1 * s, 8 * s);
  ctx.fillStyle = '#888';
  ctx.beginPath();
  ctx.arc(0, 0, 1.5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath();
  ctx.arc(0, 0, 0.8 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawLaser(ctx: CanvasRenderingContext2D, x: number, y: number, isEnemy: boolean) {
  ctx.fillStyle = isEnemy ? '#ff4444' : '#00ff00';
  ctx.fillRect(x, y - 1, 10, 2);
  ctx.shadowColor = isEnemy ? '#ff4444' : '#00ff00';
  ctx.shadowBlur = 5;
  ctx.fillRect(x, y - 1, 10, 2);
  ctx.shadowBlur = 0;
}

export function drawTrenchWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  for (let i = x; i < x + w; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, y);
    ctx.lineTo(i, y + h);
    ctx.stroke();
  }
}

export function drawExplosion(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  const colors = ['#ff4444', '#ff8800', '#ffff00', '#ffffff'];
  const r = frame * 3;
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(px - 2, py - 2, 4, 4);
  }
}
