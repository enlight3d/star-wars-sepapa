import type { Controls } from './controls';
import { drawXWing, drawTIE, drawLaser, drawTrenchWall, drawExplosion } from './sprites';

interface Entity { x: number; y: number; w: number; h: number; }
interface Laser extends Entity { isEnemy: boolean; }
interface Explosion { x: number; y: number; frame: number; }

export interface GameState {
  running: boolean;
  score: number;
  completed: boolean;
  elapsed: number;
}

const DURATION = 35;
const PLAYER_SPEED = 5;
const SCROLL_SPEED = 3;

export function createTrenchRun(
  canvas: HTMLCanvasElement,
  controls: Controls,
  onComplete: () => void
) {
  const ctx = canvas.getContext('2d')!;
  let animId: number;
  let lastTime = 0;
  let spawnTimer = 0;

  const state: GameState = { running: true, score: 0, completed: false, elapsed: 0 };
  const player = { x: 80, y: canvas.height / 2, w: 30, h: 20 };
  const obstacles: Entity[] = [];
  const enemies: (Entity & { speed: number })[] = [];
  const lasers: Laser[] = [];
  const explosions: Explosion[] = [];
  let fireCooldown = 0;
  const trenchTop = 40;
  const trenchBottom = canvas.height - 40;

  function spawnObstacle() {
    const gapSize = 120 + Math.random() * 80;
    const gapY = trenchTop + 60 + Math.random() * (trenchBottom - trenchTop - gapSize - 120);
    obstacles.push({ x: canvas.width, y: trenchTop, w: 30, h: gapY - trenchTop });
    obstacles.push({ x: canvas.width, y: gapY + gapSize, w: 30, h: trenchBottom - gapY - gapSize });
  }

  function spawnEnemy() {
    const y = trenchTop + 60 + Math.random() * (trenchBottom - trenchTop - 120);
    enemies.push({ x: canvas.width, y, w: 20, h: 20, speed: 2 + Math.random() * 2 });
  }

  function collides(a: Entity, b: Entity): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt: number) {
    state.elapsed += dt;
    if (state.elapsed >= DURATION) {
      state.completed = true;
      state.running = false;
      cancelAnimationFrame(animId);
      setTimeout(onComplete, 1500);
      return;
    }
    if (controls.up) player.y -= PLAYER_SPEED;
    if (controls.down) player.y += PLAYER_SPEED;
    player.y = Math.max(trenchTop + 10, Math.min(trenchBottom - 10, player.y));
    fireCooldown -= dt;
    if (controls.fire && fireCooldown <= 0) {
      lasers.push({ x: player.x + 20, y: player.y, w: 10, h: 2, isEnemy: false });
      fireCooldown = 0.2;
    }
    spawnTimer += dt;
    if (spawnTimer > 1.5) {
      spawnTimer = 0;
      if (Math.random() > 0.4) spawnObstacle();
      if (Math.random() > 0.5) spawnEnemy();
    }
    for (const o of obstacles) o.x -= SCROLL_SPEED;
    for (const e of enemies) e.x -= e.speed;
    for (const l of lasers) l.x += l.isEnemy ? -6 : 8;
    for (let i = lasers.length - 1; i >= 0; i--) {
      if (lasers[i].isEnemy) continue;
      for (let j = enemies.length - 1; j >= 0; j--) {
        if (collides(lasers[i], enemies[j])) {
          explosions.push({ x: enemies[j].x, y: enemies[j].y, frame: 0 });
          enemies.splice(j, 1);
          lasers.splice(i, 1);
          state.score += 100;
          break;
        }
      }
    }
    for (let i = explosions.length - 1; i >= 0; i--) {
      explosions[i].frame++;
      if (explosions[i].frame > 10) explosions.splice(i, 1);
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].x + obstacles[i].w < 0) obstacles.splice(i, 1);
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (enemies[i].x + enemies[i].w < 0) enemies.splice(i, 1);
    }
    for (let i = lasers.length - 1; i >= 0; i--) {
      if (lasers[i].x > canvas.width || lasers[i].x < 0) lasers.splice(i, 1);
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawTrenchWall(ctx, 0, 0, canvas.width, trenchTop);
    drawTrenchWall(ctx, 0, trenchBottom, canvas.width, canvas.height - trenchBottom);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    const offset = (state.elapsed * SCROLL_SPEED * 20) % 40;
    for (let x = -offset; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, trenchTop);
      ctx.lineTo(x, trenchBottom);
      ctx.stroke();
    }
    for (const o of obstacles) drawTrenchWall(ctx, o.x, o.y, o.w, o.h);
    const scale = Math.min(canvas.width, canvas.height) / 200;
    for (const e of enemies) drawTIE(ctx, e.x, e.y, scale);
    for (const l of lasers) drawLaser(ctx, l.x, l.y, l.isEnemy);
    drawXWing(ctx, player.x, player.y, scale);
    for (const e of explosions) drawExplosion(ctx, e.x, e.y, e.frame);
    ctx.fillStyle = '#ffd700';
    ctx.font = `${14 * (canvas.width / 400)}px monospace`;
    ctx.fillText(`SCORE: ${state.score}`, 10, 25);
    const progress = Math.min(state.elapsed / DURATION, 1);
    const barWidth = canvas.width - 20;
    ctx.fillStyle = '#333';
    ctx.fillRect(10, trenchBottom + 10, barWidth, 6);
    ctx.fillStyle = '#4fc3f7';
    ctx.fillRect(10, trenchBottom + 10, barWidth * progress, 6);
    if (state.completed) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffd700';
      ctx.font = `bold ${24 * (canvas.width / 400)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('BIEN JOUÉ, COMMANDANT !', canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = `${14 * (canvas.width / 400)}px monospace`;
      ctx.fillText(`Score: ${state.score}`, canvas.width / 2, canvas.height / 2 + 20);
      ctx.textAlign = 'left';
    }
  }

  function gameLoop(timestamp: number) {
    if (!state.running) return;
    const dt = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
    lastTime = timestamp;
    update(Math.min(dt, 0.05));
    render();
    animId = requestAnimationFrame(gameLoop);
  }

  animId = requestAnimationFrame(gameLoop);
  return { state, destroy: () => { state.running = false; cancelAnimationFrame(animId); } };
}
