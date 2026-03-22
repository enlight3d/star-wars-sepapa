import type { Controls } from './controls';
import { drawXWing, drawTIE, drawTurret, drawLaser, drawTrenchWall, drawExplosion } from './sprites';

// ── Types ───────────────────────────────────────────────────────────
interface Vec2 { x: number; y: number; }
interface Entity extends Vec2 { w: number; h: number; }
interface Laser extends Entity { isEnemy: boolean; vy: number; vx: number; }
interface TIEFighter extends Entity {
  speed: number;
  sineOffset: number;
  sineSpeed: number;
  sineAmplitude: number;
  baseX: number;
  fireTimer: number;
}
interface Turret extends Entity {
  facingRight: boolean;
  fireTimer: number;
  hp: number;
}
interface Explosion { x: number; y: number; frame: number; maxFrames: number; }
interface Star { x: number; y: number; brightness: number; speed: number; }

export interface GameState {
  running: boolean;
  score: number;
  completed: boolean;
  elapsed: number;
}

// ── Constants ───────────────────────────────────────────────────────
const DURATION = 35;
const PLAYER_SPEED = 4;
const SCROLL_SPEED = 120; // pixels per second
const FIRE_COOLDOWN = 0.18;
const PLAYER_LASER_SPEED = 450;
const ENEMY_LASER_SPEED = 200;
const TIE_SPAWN_INTERVAL_START = 2.0;
const TIE_SPAWN_INTERVAL_END = 0.7;
const TURRET_SPAWN_INTERVAL = 3.0;
const TURRET_FIRE_INTERVAL = 2.5;
const TIE_FIRE_INTERVAL = 2.0;
const INVINCIBILITY_DURATION = 0.5;
const EXPLOSION_FRAMES = 15;
const SCREEN_SHAKE_DURATION = 0.3;
const SCREEN_SHAKE_INTENSITY = 5;

export function createTrenchRun(
  canvas: HTMLCanvasElement,
  controls: Controls,
  onComplete: () => void
) {
  const ctx = canvas.getContext('2d')!;
  let animId: number;
  let lastTime = 0;
  let tieSpawnTimer = 0;
  let turretSpawnTimer = 0;

  const cw = canvas.width;
  const ch = canvas.height;
  const scale = Math.min(cw, ch) / 400;

  // Trench geometry
  const trenchMarginBase = cw * 0.15;
  const trenchNarrowAmount = cw * 0.04; // total narrowing over game duration

  function getTrenchBounds(elapsed: number) {
    const progress = Math.min(elapsed / DURATION, 1);
    const narrow = trenchNarrowAmount * progress;
    return {
      left: trenchMarginBase + narrow * 0.5,
      right: cw - trenchMarginBase - narrow * 0.5
    };
  }

  const state: GameState = { running: true, score: 0, completed: false, elapsed: 0 };

  // Player (center-bottom of trench)
  const initBounds = getTrenchBounds(0);
  const playerVisualW = 40 * scale;
  const playerVisualH = 40 * scale;
  const player = {
    x: (initBounds.left + initBounds.right) / 2,
    y: ch * 0.78,
    w: playerVisualW,
    h: playerVisualH,
    hitW: playerVisualW * 0.5,
    hitH: playerVisualH * 0.5,
    invincibleTimer: 0,
    flashPhase: 0
  };

  const ties: TIEFighter[] = [];
  const turrets: Turret[] = [];
  const lasers: Laser[] = [];
  const explosions: Explosion[] = [];
  const stars: Star[] = [];
  let fireCooldown = 0;
  let scrollOffset = 0;
  let screenShakeTimer = 0;
  let endFadeAlpha = 0;
  let endShowMessage = false;
  let endTriggered = false;

  // Init stars
  for (let i = 0; i < 60; i++) {
    stars.push({
      x: trenchMarginBase + Math.random() * (cw - trenchMarginBase * 2),
      y: Math.random() * ch,
      brightness: 0.2 + Math.random() * 0.8,
      speed: 20 + Math.random() * 40
    });
  }

  // ── Spawn helpers ─────────────────────────────────────────────────
  function spawnTIE() {
    const bounds = getTrenchBounds(state.elapsed);
    const margin = 30 * scale;
    const spawnX = bounds.left + margin + Math.random() * (bounds.right - bounds.left - margin * 2);
    ties.push({
      x: spawnX, y: -30 * scale,
      w: 30 * scale, h: 30 * scale,
      speed: 60 + Math.random() * 40,
      sineOffset: Math.random() * Math.PI * 2,
      sineSpeed: 1.5 + Math.random() * 2,
      sineAmplitude: 20 + Math.random() * 30,
      baseX: spawnX,
      fireTimer: 1 + Math.random() * TIE_FIRE_INTERVAL
    });
  }

  function spawnTurret() {
    const bounds = getTrenchBounds(state.elapsed);
    const onLeft = Math.random() > 0.5;
    const turretW = 20 * scale;
    const turretH = 20 * scale;
    turrets.push({
      x: onLeft ? bounds.left - turretW * 0.3 : bounds.right - turretW * 0.7,
      y: -turretH,
      w: turretW, h: turretH,
      facingRight: onLeft,
      fireTimer: 0.5 + Math.random() * TURRET_FIRE_INTERVAL,
      hp: 1
    });
  }

  // ── Collision ─────────────────────────────────────────────────────
  function collides(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
    return (
      a.x - a.w / 2 < b.x + b.w / 2 &&
      a.x + a.w / 2 > b.x - b.w / 2 &&
      a.y - a.h / 2 < b.y + b.h / 2 &&
      a.y + a.h / 2 > b.y - b.h / 2
    );
  }

  function playerHitbox() {
    return { x: player.x, y: player.y, w: player.hitW, h: player.hitH };
  }

  function hitPlayer() {
    if (player.invincibleTimer > 0) return;
    player.invincibleTimer = INVINCIBILITY_DURATION;
    screenShakeTimer = SCREEN_SHAKE_DURATION;
  }

  // ── Update ────────────────────────────────────────────────────────
  function update(dt: number) {
    state.elapsed += dt;

    // End sequence
    if (state.elapsed >= DURATION && !endTriggered) {
      endTriggered = true;
    }
    if (endTriggered) {
      endFadeAlpha = Math.min(endFadeAlpha + dt * 1.5, 0.85);
      if (endFadeAlpha >= 0.5 && !endShowMessage) {
        endShowMessage = true;
      }
      if (endFadeAlpha >= 0.85 && !state.completed) {
        state.completed = true;
        state.running = false;
        setTimeout(onComplete, 2000);
      }
      return;
    }

    const bounds = getTrenchBounds(state.elapsed);
    scrollOffset += SCROLL_SPEED * dt;

    // Timers
    player.invincibleTimer = Math.max(0, player.invincibleTimer - dt);
    player.flashPhase += dt * 20;
    screenShakeTimer = Math.max(0, screenShakeTimer - dt);
    fireCooldown = Math.max(0, fireCooldown - dt);

    // Player movement
    if (controls.left) player.x -= PLAYER_SPEED * 60 * dt * scale;
    if (controls.right) player.x += PLAYER_SPEED * 60 * dt * scale;
    if (controls.up) player.y -= PLAYER_SPEED * 60 * dt * scale;
    if (controls.down) player.y += PLAYER_SPEED * 60 * dt * scale;

    // Clamp to trench
    const padX = playerVisualW * 0.4;
    const padY = playerVisualH * 0.4;
    player.x = Math.max(bounds.left + padX, Math.min(bounds.right - padX, player.x));
    player.y = Math.max(padY + 10, Math.min(ch - padY - 10, player.y));

    // Fire
    if (controls.fire && fireCooldown <= 0) {
      // Fire from 4 wing-tip cannons
      const offsets = [
        { x: -18 * scale, y: -16 * scale },
        { x: 18 * scale, y: -16 * scale },
      ];
      for (const off of offsets) {
        lasers.push({
          x: player.x + off.x, y: player.y + off.y,
          w: 3, h: 12,
          isEnemy: false, vy: -PLAYER_LASER_SPEED, vx: 0
        });
      }
      fireCooldown = FIRE_COOLDOWN;
    }

    // Spawn enemies
    const progress = state.elapsed / DURATION;
    const tieInterval = TIE_SPAWN_INTERVAL_START + (TIE_SPAWN_INTERVAL_END - TIE_SPAWN_INTERVAL_START) * progress;
    tieSpawnTimer += dt;
    if (tieSpawnTimer > tieInterval) {
      tieSpawnTimer = 0;
      spawnTIE();
      // Spawn pairs later in the game
      if (progress > 0.5 && Math.random() > 0.5) spawnTIE();
    }

    turretSpawnTimer += dt;
    if (turretSpawnTimer > TURRET_SPAWN_INTERVAL) {
      turretSpawnTimer = 0;
      spawnTurret();
    }

    // Update TIEs
    for (const tie of ties) {
      tie.y += tie.speed * dt;
      tie.sineOffset += tie.sineSpeed * dt;
      tie.baseX = Math.max(bounds.left + 20 * scale, Math.min(bounds.right - 20 * scale, tie.baseX));
      tie.x = tie.baseX + Math.sin(tie.sineOffset) * tie.sineAmplitude * scale;
      tie.x = Math.max(bounds.left + 15 * scale, Math.min(bounds.right - 15 * scale, tie.x));

      // Fire
      tie.fireTimer -= dt;
      if (tie.fireTimer <= 0 && tie.y > 0 && tie.y < ch * 0.6) {
        tie.fireTimer = TIE_FIRE_INTERVAL + Math.random();
        // Aim slightly toward player
        const dx = player.x - tie.x;
        const dist = Math.max(Math.abs(dx), 1);
        const vx = (dx / dist) * 30;
        lasers.push({
          x: tie.x, y: tie.y + 15 * scale,
          w: 3, h: 10,
          isEnemy: true, vy: ENEMY_LASER_SPEED, vx
        });
      }
    }

    // Update turrets (scroll down)
    for (const turret of turrets) {
      turret.y += SCROLL_SPEED * dt;
      // Update x to stick to wall
      const tb = getTrenchBounds(state.elapsed);
      if (turret.facingRight) {
        turret.x = tb.left - turret.w * 0.3;
      } else {
        turret.x = tb.right - turret.w * 0.7;
      }

      // Fire
      turret.fireTimer -= dt;
      if (turret.fireTimer <= 0 && turret.y > 0 && turret.y < ch) {
        turret.fireTimer = TURRET_FIRE_INTERVAL;
        const dx = player.x - turret.x;
        const dy = player.y - turret.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        lasers.push({
          x: turret.x + (turret.facingRight ? turret.w : 0),
          y: turret.y,
          w: 3, h: 10,
          isEnemy: true,
          vx: (dx / dist) * ENEMY_LASER_SPEED * 0.6,
          vy: (dy / dist) * ENEMY_LASER_SPEED * 0.6
        });
      }
    }

    // Update lasers
    for (const l of lasers) {
      l.y += l.vy * dt;
      l.x += l.vx * dt;
    }

    // Update stars
    for (const star of stars) {
      star.y += star.speed * dt;
      if (star.y > ch) {
        star.y = 0;
        const b = getTrenchBounds(state.elapsed);
        star.x = b.left + Math.random() * (b.right - b.left);
      }
    }

    // Player laser vs TIE collisions
    for (let i = lasers.length - 1; i >= 0; i--) {
      if (lasers[i].isEnemy) continue;
      const l = lasers[i];
      for (let j = ties.length - 1; j >= 0; j--) {
        if (collides(l, ties[j])) {
          explosions.push({ x: ties[j].x, y: ties[j].y, frame: 0, maxFrames: EXPLOSION_FRAMES });
          ties.splice(j, 1);
          lasers.splice(i, 1);
          state.score += 100;
          break;
        }
      }
    }

    // Player laser vs turret collisions
    for (let i = lasers.length - 1; i >= 0; i--) {
      if (!lasers[i] || lasers[i].isEnemy) continue;
      const l = lasers[i];
      for (let j = turrets.length - 1; j >= 0; j--) {
        const t = turrets[j];
        if (collides(l, { x: t.x + t.w / 2, y: t.y + t.h / 2, w: t.w, h: t.h })) {
          explosions.push({ x: t.x + t.w / 2, y: t.y + t.h / 2, frame: 0, maxFrames: EXPLOSION_FRAMES });
          turrets.splice(j, 1);
          lasers.splice(i, 1);
          state.score += 100;
          break;
        }
      }
    }

    // Enemy laser vs player
    const ph = playerHitbox();
    for (let i = lasers.length - 1; i >= 0; i--) {
      if (!lasers[i] || !lasers[i].isEnemy) continue;
      if (collides(lasers[i], ph)) {
        hitPlayer();
        lasers.splice(i, 1);
      }
    }

    // TIE vs player collision
    for (let i = ties.length - 1; i >= 0; i--) {
      if (collides(ties[i], ph)) {
        hitPlayer();
        explosions.push({ x: ties[i].x, y: ties[i].y, frame: 0, maxFrames: EXPLOSION_FRAMES });
        ties.splice(i, 1);
        state.score += 50;
      }
    }

    // Cleanup off-screen
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      if (l.y < -20 || l.y > ch + 20 || l.x < -20 || l.x > cw + 20) lasers.splice(i, 1);
    }
    for (let i = ties.length - 1; i >= 0; i--) {
      if (ties[i].y > ch + 50) ties.splice(i, 1);
    }
    for (let i = turrets.length - 1; i >= 0; i--) {
      if (turrets[i].y > ch + 50) turrets.splice(i, 1);
    }

    // Update explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
      explosions[i].frame++;
      if (explosions[i].frame > explosions[i].maxFrames) explosions.splice(i, 1);
    }
  }

  // ── Render ────────────────────────────────────────────────────────
  function render() {
    ctx.save();

    // Screen shake
    if (screenShakeTimer > 0) {
      const intensity = SCREEN_SHAKE_INTENSITY * (screenShakeTimer / SCREEN_SHAKE_DURATION);
      ctx.translate(
        (Math.random() - 0.5) * intensity * 2,
        (Math.random() - 0.5) * intensity * 2
      );
    }

    // Background
    ctx.fillStyle = '#05050a';
    ctx.fillRect(-5, -5, cw + 10, ch + 10);

    const bounds = getTrenchBounds(state.elapsed);

    // Trench floor grid
    ctx.strokeStyle = 'rgba(30, 40, 60, 0.5)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    const gridOffsetY = scrollOffset % gridSize;
    for (let gy = -gridOffsetY; gy < ch; gy += gridSize) {
      ctx.beginPath();
      ctx.moveTo(bounds.left, gy);
      ctx.lineTo(bounds.right, gy);
      ctx.stroke();
    }
    for (let gx = bounds.left; gx <= bounds.right; gx += gridSize) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, ch);
      ctx.stroke();
    }

    // Stars in trench
    for (const star of stars) {
      if (star.x < bounds.left || star.x > bounds.right) continue;
      ctx.globalAlpha = star.brightness * 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(star.x, star.y, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;

    // Trench walls
    drawTrenchWall(ctx, 0, 0, bounds.left, ch, scrollOffset);
    drawTrenchWall(ctx, bounds.right, 0, cw - bounds.right, ch, scrollOffset);

    // Turrets
    for (const t of turrets) {
      drawTurret(ctx, t.x + t.w / 2, t.y + t.h / 2, scale, t.facingRight);
    }

    // TIE Fighters
    for (const tie of ties) {
      drawTIE(ctx, tie.x, tie.y, scale);
    }

    // Lasers
    for (const l of lasers) {
      drawLaser(ctx, l.x, l.y, l.isEnemy);
    }

    // Player
    const showPlayer = player.invincibleTimer <= 0 || Math.sin(player.flashPhase) > 0;
    if (showPlayer) {
      drawXWing(ctx, player.x, player.y, scale);
    }

    // Explosions
    for (const e of explosions) {
      drawExplosion(ctx, e.x, e.y, e.frame, e.maxFrames);
    }

    // HUD - Score
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${Math.round(14 * (cw / 400))}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${state.score}`, 10, 25);

    // HUD - Progress bar (brick style at bottom)
    const progress = Math.min(state.elapsed / DURATION, 1);
    const barHeight = 8;
    const barY = ch - barHeight - 6;
    const barX = bounds.left;
    const barWidth = bounds.right - bounds.left;

    // Bar background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Filled portion with brick segments
    const filledWidth = barWidth * progress;
    ctx.fillStyle = '#4fc3f7';
    ctx.fillRect(barX, barY, filledWidth, barHeight);

    // Brick segments
    const brickWidth = 12;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    for (let bx = barX + brickWidth; bx < barX + filledWidth; bx += brickWidth) {
      ctx.beginPath();
      ctx.moveTo(bx, barY);
      ctx.lineTo(bx, barY + barHeight);
      ctx.stroke();
    }

    // Glow on leading edge
    if (filledWidth > 2) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.6;
      ctx.fillRect(barX + filledWidth - 2, barY, 2, barHeight);
      ctx.globalAlpha = 1;
    }

    // End sequence overlay
    if (endFadeAlpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${endFadeAlpha})`;
      ctx.fillRect(-5, -5, cw + 10, ch + 10);

      if (endShowMessage) {
        ctx.textAlign = 'center';

        // Title
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold ${Math.round(22 * (cw / 400))}px monospace`;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.fillText('BIEN JOUÉ, COMMANDANT !', cw / 2, ch / 2 - 15);
        ctx.shadowBlur = 0;

        // Score
        ctx.fillStyle = '#4fc3f7';
        ctx.font = `${Math.round(14 * (cw / 400))}px monospace`;
        ctx.fillText(`Score final: ${state.score}`, cw / 2, ch / 2 + 20);

        ctx.textAlign = 'left';
      }
    }

    ctx.restore();
  }

  // ── Game Loop ─────────────────────────────────────────────────────
  function gameLoop(timestamp: number) {
    if (!state.running && state.completed) return;
    const dt = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
    lastTime = timestamp;
    update(Math.min(dt, 0.05));
    render();
    animId = requestAnimationFrame(gameLoop);
  }

  animId = requestAnimationFrame(gameLoop);

  return {
    state,
    destroy: () => {
      state.running = false;
      cancelAnimationFrame(animId);
    }
  };
}
