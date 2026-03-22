import type { Controls } from './controls';
import { drawXWing, drawTIE, drawTurret, drawLaser, drawTrenchWall, drawTrenchFloor, drawExplosion } from './sprites';
import { playLaserShoot, playEnemyLaser, playExplosion, playPlayerHit, playGameOver, playVictory } from '$lib/audio/audioManager';

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
  hp: number;
}
interface Turret extends Entity {
  facingRight: boolean;
  fireTimer: number;
  hp: number;
  aimAngle: number;
}
interface Explosion { x: number; y: number; frame: number; maxFrames: number; big: boolean; }
interface Star { x: number; y: number; brightness: number; speed: number; twinklePhase: number; twinkleSpeed: number; }

export interface GameState {
  running: boolean;
  score: number;
  completed: boolean;
  elapsed: number;
  hp: number;
  maxHp: number;
  gameOver: boolean;
  kills: number;
  combo: number;
  bestCombo: number;
  noHitStreak: number;
}

// ── Constants ───────────────────────────────────────────────────────
const DURATION = 35; // DEBUG: change to 35 for production
const PLAYER_SPEED = 4.5;
const SCROLL_SPEED = 130; // pixels per second
const FIRE_COOLDOWN = 0.16;
const PLAYER_LASER_SPEED = 500;
const ENEMY_LASER_SPEED = 220;
const TIE_SPAWN_INTERVAL_START = 2.0;
const TIE_SPAWN_INTERVAL_END = 0.6;
const TURRET_SPAWN_INTERVAL = 3.5;
const TURRET_FIRE_INTERVAL = 2.2;
const TIE_FIRE_INTERVAL = 1.8;
const INVINCIBILITY_DURATION = 0.6;
const EXPLOSION_FRAMES = 20;
const BIG_EXPLOSION_FRAMES = 28;
const SCREEN_SHAKE_DURATION = 0.3;
const SCREEN_SHAKE_INTENSITY = 6;
const BIG_SHAKE_INTENSITY = 12;
const BOSS_WAVE_TIME = DURATION - 5; // Boss wave starts 5 seconds before end
const COMBO_TIMEOUT = 2.0; // seconds to maintain combo

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
  let bossWaveSpawned = false;

  const cw = canvas.width;
  const ch = canvas.height;
  const scale = Math.min(cw, ch) / 400;

  // Trench geometry
  const trenchMarginBase = cw * 0.15;
  const trenchNarrowAmount = cw * 0.04;

  function getTrenchBounds(elapsed: number) {
    const progress = Math.min(elapsed / DURATION, 1);
    const narrow = trenchNarrowAmount * progress;
    return {
      left: trenchMarginBase + narrow * 0.5,
      right: cw - trenchMarginBase - narrow * 0.5
    };
  }

  const MAX_HP = 5;
  const state: GameState = {
    running: true, score: 0, completed: false, elapsed: 0,
    hp: MAX_HP, maxHp: MAX_HP, gameOver: false,
    kills: 0, combo: 0, bestCombo: 0, noHitStreak: 0
  };

  // Player
  const initBounds = getTrenchBounds(0);
  const playerVisualW = 50 * scale;
  const playerVisualH = 50 * scale;
  const player = {
    x: (initBounds.left + initBounds.right) / 2,
    y: ch * 0.78,
    w: playerVisualW,
    h: playerVisualH,
    hitW: playerVisualW * 0.35,
    hitH: playerVisualH * 0.4,
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
  let screenShakeIntensity = SCREEN_SHAKE_INTENSITY;
  let endFadeAlpha = 0;
  let endShowMessage = false;
  let endTriggered = false;
  let comboTimer = 0;
  let lastKillTime = 0;

  // Init stars (twinkling)
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: trenchMarginBase + Math.random() * (cw - trenchMarginBase * 2),
      y: Math.random() * ch,
      brightness: 0.2 + Math.random() * 0.8,
      speed: 15 + Math.random() * 35,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 1 + Math.random() * 3
    });
  }

  // ── Spawn helpers ─────────────────────────────────────────────────
  function spawnTIE(overrideX?: number) {
    const bounds = getTrenchBounds(state.elapsed);
    const margin = 30 * scale;
    const spawnX = overrideX ?? (bounds.left + margin + Math.random() * (bounds.right - bounds.left - margin * 2));
    const progress = Math.min(state.elapsed / DURATION, 1);
    ties.push({
      x: spawnX, y: -35 * scale,
      w: 35 * scale, h: 35 * scale,
      speed: (70 + Math.random() * 50) * (1 + progress * 0.4),
      sineOffset: Math.random() * Math.PI * 2,
      sineSpeed: 1.5 + Math.random() * 2.5,
      sineAmplitude: 20 + Math.random() * 35,
      baseX: spawnX,
      fireTimer: 0.8 + Math.random() * TIE_FIRE_INTERVAL,
      hp: 1
    });
  }

  function spawnTurret() {
    const bounds = getTrenchBounds(state.elapsed);
    const onLeft = Math.random() > 0.5;
    const turretW = 24 * scale;
    const turretH = 24 * scale;
    turrets.push({
      x: onLeft ? bounds.left - turretW * 0.3 : bounds.right - turretW * 0.7,
      y: -turretH,
      w: turretW, h: turretH,
      facingRight: onLeft,
      fireTimer: 0.5 + Math.random() * TURRET_FIRE_INTERVAL,
      hp: 2,
      aimAngle: 0
    });
  }

  function spawnBossWave() {
    if (bossWaveSpawned) return;
    bossWaveSpawned = true;
    const bounds = getTrenchBounds(state.elapsed);
    const trenchW = bounds.right - bounds.left;

    // V-formation: 5 TIEs
    const positions = [0, -0.3, 0.3, -0.55, 0.55];
    const center = (bounds.left + bounds.right) / 2;
    for (let i = 0; i < positions.length; i++) {
      const tx = center + positions[i] * trenchW * 0.35;
      setTimeout(() => spawnTIE(tx), i * 200);
    }
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

  function registerKill(points: number) {
    state.kills++;
    const now = state.elapsed;
    if (now - lastKillTime < COMBO_TIMEOUT) {
      state.combo++;
    } else {
      state.combo = 1;
    }
    lastKillTime = now;
    if (state.combo > state.bestCombo) state.bestCombo = state.combo;

    // Combo bonus
    const comboMultiplier = Math.min(state.combo, 5);
    state.score += points * comboMultiplier;
    comboTimer = 2.0;

    // No-hit streak bonus: +50 per kill while unhit
    if (state.noHitStreak > 0) {
      state.score += 50;
    }
    state.noHitStreak++;
  }

  function hitPlayer() {
    if (player.invincibleTimer > 0) return;
    player.invincibleTimer = INVINCIBILITY_DURATION;
    screenShakeTimer = SCREEN_SHAKE_DURATION;
    screenShakeIntensity = SCREEN_SHAKE_INTENSITY;
    state.hp--;
    state.noHitStreak = 0;
    state.combo = 0;
    playPlayerHit();
    if (state.hp <= 0) {
      state.gameOver = true;
      state.running = false;
      playGameOver();
    }
  }

  // ── Update ────────────────────────────────────────────────────────
  function update(dt: number) {
    state.elapsed += dt;

    // Boss wave
    if (state.elapsed >= BOSS_WAVE_TIME && !bossWaveSpawned && !endTriggered) {
      spawnBossWave();
    }

    // End sequence
    if (state.elapsed >= DURATION && !endTriggered) {
      endTriggered = true;
      playVictory();
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
    comboTimer = Math.max(0, comboTimer - dt);
    if (comboTimer <= 0) state.combo = 0;

    // Player movement
    const moveSpeed = PLAYER_SPEED * 60 * dt * scale;
    if (controls.left) player.x -= moveSpeed;
    if (controls.right) player.x += moveSpeed;
    if (controls.up) player.y -= moveSpeed;
    if (controls.down) player.y += moveSpeed;

    // Clamp to trench
    const padX = playerVisualW * 0.45;
    const padY = playerVisualH * 0.45;
    player.x = Math.max(bounds.left + padX, Math.min(bounds.right - padX, player.x));
    player.y = Math.max(padY + 10, Math.min(ch - padY - 20, player.y));

    // Fire — dual green lasers from upper wing tips
    if (controls.fire && fireCooldown <= 0) {
      const offsets = [
        { x: -22 * scale, y: -20 * scale },
        { x: 22 * scale, y: -20 * scale },
      ];
      for (const off of offsets) {
        lasers.push({
          x: player.x + off.x, y: player.y + off.y,
          w: 3, h: 16,
          isEnemy: false, vy: -PLAYER_LASER_SPEED, vx: 0
        });
      }
      fireCooldown = FIRE_COOLDOWN;
      playLaserShoot();
    }

    // Spawn enemies (difficulty ramp)
    const progress = state.elapsed / DURATION;
    const tieInterval = TIE_SPAWN_INTERVAL_START + (TIE_SPAWN_INTERVAL_END - TIE_SPAWN_INTERVAL_START) * progress;
    tieSpawnTimer += dt;
    if (tieSpawnTimer > tieInterval) {
      tieSpawnTimer = 0;
      spawnTIE();
      if (progress > 0.4 && Math.random() > 0.5) spawnTIE();
      if (progress > 0.7 && Math.random() > 0.6) spawnTIE();
    }

    turretSpawnTimer += dt;
    if (turretSpawnTimer > TURRET_SPAWN_INTERVAL * (1 - progress * 0.3)) {
      turretSpawnTimer = 0;
      spawnTurret();
    }

    // Update TIEs
    for (const tie of ties) {
      tie.y += tie.speed * dt;
      tie.sineOffset += tie.sineSpeed * dt;
      tie.baseX = Math.max(bounds.left + 20 * scale, Math.min(bounds.right - 20 * scale, tie.baseX));
      tie.x = tie.baseX + Math.sin(tie.sineOffset) * tie.sineAmplitude * scale;
      tie.x = Math.max(bounds.left + 18 * scale, Math.min(bounds.right - 18 * scale, tie.x));

      // Fire at player
      tie.fireTimer -= dt;
      if (tie.fireTimer <= 0 && tie.y > 0 && tie.y < ch * 0.65) {
        tie.fireTimer = TIE_FIRE_INTERVAL * (1 - progress * 0.3) + Math.random() * 0.5;
        const dx = player.x - tie.x;
        const dy = player.y - tie.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const vx = (dx / dist) * ENEMY_LASER_SPEED * 0.35;
        const vy = (dy / dist) * ENEMY_LASER_SPEED;
        lasers.push({
          x: tie.x, y: tie.y + 17 * scale,
          w: 4, h: 12,
          isEnemy: true, vy: Math.max(vy, ENEMY_LASER_SPEED * 0.5), vx
        });
        playEnemyLaser();
      }
    }

    // Update turrets
    for (const turret of turrets) {
      turret.y += SCROLL_SPEED * dt;
      // Stick to wall
      const tb = getTrenchBounds(state.elapsed);
      if (turret.facingRight) {
        turret.x = tb.left - turret.w * 0.3;
      } else {
        turret.x = tb.right - turret.w * 0.7;
      }

      // Calculate aim angle toward player
      const tcx = turret.x + turret.w / 2;
      const tcy = turret.y + turret.h / 2;
      const dx = player.x - tcx;
      const dy = player.y - tcy;
      turret.aimAngle = Math.atan2(dy, turret.facingRight ? dx : -dx);

      // Fire
      turret.fireTimer -= dt;
      if (turret.fireTimer <= 0 && turret.y > 0 && turret.y < ch) {
        turret.fireTimer = TURRET_FIRE_INTERVAL * (1 - progress * 0.2);
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        lasers.push({
          x: tcx + (turret.facingRight ? turret.w * 0.6 : -turret.w * 0.6),
          y: tcy,
          w: 4, h: 12,
          isEnemy: true,
          vx: (dx / dist) * ENEMY_LASER_SPEED * 0.7,
          vy: (dy / dist) * ENEMY_LASER_SPEED * 0.7
        });
        playEnemyLaser();
      }
    }

    // Update lasers
    for (const l of lasers) {
      l.y += l.vy * dt;
      l.x += l.vx * dt;
    }

    // Update stars (twinkling + scrolling)
    for (const star of stars) {
      star.y += star.speed * dt;
      star.twinklePhase += star.twinkleSpeed * dt;
      if (star.y > ch) {
        star.y = -2;
        const b = getTrenchBounds(state.elapsed);
        star.x = b.left + Math.random() * (b.right - b.left);
      }
    }

    // ── Collisions ──

    // Player lasers vs TIEs
    for (let i = lasers.length - 1; i >= 0; i--) {
      if (lasers[i].isEnemy) continue;
      const l = lasers[i];
      for (let j = ties.length - 1; j >= 0; j--) {
        if (collides(l, ties[j])) {
          ties[j].hp--;
          lasers.splice(i, 1);
          if (ties[j].hp <= 0) {
            explosions.push({ x: ties[j].x, y: ties[j].y, frame: 0, maxFrames: EXPLOSION_FRAMES, big: false });
            ties.splice(j, 1);
            registerKill(100);
            playExplosion();
          }
          break;
        }
      }
    }

    // Player lasers vs turrets
    for (let i = lasers.length - 1; i >= 0; i--) {
      if (!lasers[i] || lasers[i].isEnemy) continue;
      const l = lasers[i];
      for (let j = turrets.length - 1; j >= 0; j--) {
        const t = turrets[j];
        const tcx = t.x + t.w / 2;
        const tcy = t.y + t.h / 2;
        if (collides(l, { x: tcx, y: tcy, w: t.w, h: t.h })) {
          t.hp--;
          lasers.splice(i, 1);
          if (t.hp <= 0) {
            explosions.push({ x: tcx, y: tcy, frame: 0, maxFrames: EXPLOSION_FRAMES, big: false });
            turrets.splice(j, 1);
            registerKill(50);
            playExplosion();
          }
          break;
        }
      }
    }

    // Enemy lasers vs player
    const ph = playerHitbox();
    for (let i = lasers.length - 1; i >= 0; i--) {
      if (!lasers[i] || !lasers[i].isEnemy) continue;
      if (collides(lasers[i], ph)) {
        hitPlayer();
        lasers.splice(i, 1);
      }
    }

    // TIE body vs player
    for (let i = ties.length - 1; i >= 0; i--) {
      if (collides(ties[i], ph)) {
        hitPlayer();
        explosions.push({ x: ties[i].x, y: ties[i].y, frame: 0, maxFrames: BIG_EXPLOSION_FRAMES, big: true });
        screenShakeIntensity = BIG_SHAKE_INTENSITY;
        screenShakeTimer = SCREEN_SHAKE_DURATION * 1.5;
        ties.splice(i, 1);
        registerKill(50);
        playExplosion();
      }
    }

    // Cleanup off-screen
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      if (l.y < -30 || l.y > ch + 30 || l.x < -30 || l.x > cw + 30) lasers.splice(i, 1);
    }
    for (let i = ties.length - 1; i >= 0; i--) {
      if (ties[i].y > ch + 60) ties.splice(i, 1);
    }
    for (let i = turrets.length - 1; i >= 0; i--) {
      if (turrets[i].y > ch + 60) turrets.splice(i, 1);
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
      const intensity = screenShakeIntensity * (screenShakeTimer / SCREEN_SHAKE_DURATION);
      ctx.translate(
        (Math.random() - 0.5) * intensity * 2,
        (Math.random() - 0.5) * intensity * 2
      );
    }

    // Background — deep space
    ctx.fillStyle = '#030308';
    ctx.fillRect(-5, -5, cw + 10, ch + 10);

    const bounds = getTrenchBounds(state.elapsed);

    // Trench floor with grid
    drawTrenchFloor(ctx, bounds.left, bounds.right, ch, scrollOffset);

    // Stars (twinkling) — only in trench area
    for (const star of stars) {
      if (star.x < bounds.left || star.x > bounds.right) continue;
      const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(star.twinklePhase));
      ctx.globalAlpha = star.brightness * twinkle * 0.7;
      ctx.fillStyle = '#ffffff';
      const sz = star.brightness > 0.7 ? 2 : 1.2;
      ctx.fillRect(star.x - sz / 2, star.y - sz / 2, sz, sz);
      // Bright stars get a subtle cross
      if (star.brightness > 0.85 && twinkle > 0.8) {
        ctx.globalAlpha = star.brightness * twinkle * 0.2;
        ctx.fillRect(star.x - 3, star.y - 0.3, 6, 0.6);
        ctx.fillRect(star.x - 0.3, star.y - 3, 0.6, 6);
      }
    }
    ctx.globalAlpha = 1;

    // Trench walls
    drawTrenchWall(ctx, 0, 0, bounds.left, ch, scrollOffset);
    drawTrenchWall(ctx, bounds.right, 0, cw - bounds.right, ch, scrollOffset);

    // Turrets
    for (const t of turrets) {
      drawTurret(ctx, t.x + t.w / 2, t.y + t.h / 2, scale, t.facingRight, t.aimAngle);
    }

    // TIE Fighters
    for (const tie of ties) {
      drawTIE(ctx, tie.x, tie.y, scale);
    }

    // Lasers
    for (const l of lasers) {
      drawLaser(ctx, l.x, l.y, l.isEnemy);
    }

    // Player (with invincibility flash)
    const showPlayer = player.invincibleTimer <= 0 || Math.sin(player.flashPhase) > 0;
    if (showPlayer && !state.gameOver) {
      drawXWing(ctx, player.x, player.y, scale);
    }

    // Explosions
    for (const e of explosions) {
      drawExplosion(ctx, e.x, e.y, e.frame, e.maxFrames, e.big);
    }

    // ── HUD ────────────────────────────────────────────────────────

    const fontSize = Math.round(14 * (cw / 400));
    const smallFont = Math.round(10 * (cw / 400));

    // Score — top-left
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'left';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 4;
    ctx.fillText(`SCORE: ${state.score}`, 10, 22);
    ctx.shadowBlur = 0;

    // Kill counter below score
    ctx.fillStyle = '#aaa';
    ctx.font = `${smallFont}px monospace`;
    ctx.fillText(`KILLS: ${state.kills}`, 10, 38);

    // Combo indicator
    if (state.combo > 1 && comboTimer > 0) {
      const comboAlpha = Math.min(comboTimer, 1);
      ctx.globalAlpha = comboAlpha;
      ctx.fillStyle = state.combo >= 5 ? '#ff4444' : state.combo >= 3 ? '#ff8800' : '#ffcc00';
      ctx.font = `bold ${Math.round(18 * (cw / 400))}px monospace`;
      ctx.fillText(`x${state.combo} COMBO!`, 10, 56);
      ctx.globalAlpha = 1;
    }

    // Shield bar — top-right
    const hpBarW = 80 * (cw / 400);
    const hpBarH = 10;
    const hpBarX = cw - hpBarW - 10;
    const hpBarY = 14;

    // Label
    ctx.fillStyle = '#aaa';
    ctx.font = `${smallFont}px monospace`;
    ctx.textAlign = 'right';
    ctx.fillText('BOUCLIER', hpBarX - 5, hpBarY + hpBarH - 1);

    // Bar background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);

    // Bar fill with color coding
    const hpRatio = state.hp / state.maxHp;
    const hpColor = hpRatio > 0.5 ? '#00e676' : hpRatio > 0.25 ? '#ff8f00' : '#ff1744';
    ctx.fillStyle = hpColor;
    ctx.fillRect(hpBarX + 1, hpBarY + 1, (hpBarW - 2) * hpRatio, hpBarH - 2);

    // Shield segments
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    const segW = (hpBarW - 2) / state.maxHp;
    for (let i = 1; i < state.maxHp; i++) {
      const sx = hpBarX + 1 + segW * i;
      ctx.beginPath();
      ctx.moveTo(sx, hpBarY + 1);
      ctx.lineTo(sx, hpBarY + hpBarH - 1);
      ctx.stroke();
    }

    // Shield glow when low
    if (hpRatio <= 0.25 && state.hp > 0) {
      ctx.strokeStyle = '#ff1744';
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hpBarX - 1, hpBarY - 1, hpBarW + 2, hpBarH + 2);
      ctx.shadowBlur = 0;
    }

    // Progress bar — bottom (blue energy bar)
    const progress = Math.min(state.elapsed / DURATION, 1);
    const barHeight = 8;
    const barY = ch - barHeight - 6;
    const barX = bounds.left;
    const barWidth = bounds.right - bounds.left;

    // Background
    ctx.fillStyle = '#111';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Filled portion — blue energy
    const filledWidth = barWidth * progress;
    const barGrad = ctx.createLinearGradient(barX, barY, barX + filledWidth, barY);
    barGrad.addColorStop(0, '#1565c0');
    barGrad.addColorStop(0.5, '#42a5f5');
    barGrad.addColorStop(1, '#4fc3f7');
    ctx.fillStyle = barGrad;
    ctx.fillRect(barX + 1, barY + 1, Math.max(filledWidth - 2, 0), barHeight - 2);

    // Segment marks
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    const segCount = 10;
    for (let i = 1; i < segCount; i++) {
      const sx = barX + (barWidth * i) / segCount;
      ctx.beginPath();
      ctx.moveTo(sx, barY);
      ctx.lineTo(sx, barY + barHeight);
      ctx.stroke();
    }

    // Glow on leading edge
    if (filledWidth > 3) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.5;
      ctx.fillRect(barX + filledWidth - 2, barY + 1, 2, barHeight - 2);
      ctx.globalAlpha = 1;
    }

    // Progress label
    ctx.fillStyle = '#4fc3f7';
    ctx.font = `${smallFont}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(progress * 100)}%`, (barX + barX + barWidth) / 2, barY - 3);

    ctx.textAlign = 'left';

    // ── Game Over Screen ──
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(-5, -5, cw + 10, ch + 10);

      ctx.textAlign = 'center';

      // Title
      ctx.fillStyle = '#ff1744';
      ctx.font = `bold ${Math.round(28 * (cw / 400))}px monospace`;
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 20;
      ctx.fillText('MISSION ÉCHOUÉE', cw / 2, ch / 2 - 65);
      ctx.shadowBlur = 0;

      // Subtitles
      ctx.fillStyle = '#ff8f00';
      ctx.font = `${Math.round(13 * (cw / 400))}px monospace`;
      ctx.fillText("L'Empire a pris le dessus...", cw / 2, ch / 2 - 25);
      ctx.fillText('Palpatine ricane dans l\'ombre.', cw / 2, ch / 2 + 0);

      // Score summary
      ctx.fillStyle = '#ffd700';
      ctx.font = `${Math.round(12 * (cw / 400))}px monospace`;
      ctx.fillText(`Score: ${state.score}  |  Kills: ${state.kills}`, cw / 2, ch / 2 + 35);

      // Restart prompt (pulsing)
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 400);
      ctx.globalAlpha = 0.6 + pulse * 0.4;
      ctx.fillStyle = '#4fc3f7';
      ctx.font = `${Math.round(14 * (cw / 400))}px monospace`;
      ctx.fillText('[ APPUIE POUR RÉESSAYER ]', cw / 2, ch / 2 + 70);
      ctx.globalAlpha = 1;

      ctx.textAlign = 'left';
    }

    // ── Victory End Sequence ──
    if (endFadeAlpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${endFadeAlpha})`;
      ctx.fillRect(-5, -5, cw + 10, ch + 10);

      if (endShowMessage) {
        ctx.textAlign = 'center';

        // Title
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold ${Math.round(24 * (cw / 400))}px monospace`;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 12;
        ctx.fillText('BIEN JOUÉ, COMMANDANT !', cw / 2, ch / 2 - 25);
        ctx.shadowBlur = 0;

        // Score
        ctx.fillStyle = '#4fc3f7';
        ctx.font = `${Math.round(14 * (cw / 400))}px monospace`;
        ctx.fillText(`Score final: ${state.score}`, cw / 2, ch / 2 + 10);
        ctx.fillText(`Kills: ${state.kills}  |  Meilleur combo: x${state.bestCombo}`, cw / 2, ch / 2 + 30);

        ctx.textAlign = 'left';
      }
    }

    ctx.restore();
  }

  // ── Restart ──────────────────────────────────────────────────────
  function restart() {
    state.running = true;
    state.score = 0;
    state.completed = false;
    state.elapsed = 0;
    state.hp = MAX_HP;
    state.gameOver = false;
    state.kills = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.noHitStreak = 0;
    endFadeAlpha = 0;
    endShowMessage = false;
    endTriggered = false;
    bossWaveSpawned = false;
    ties.length = 0;
    turrets.length = 0;
    lasers.length = 0;
    explosions.length = 0;
    tieSpawnTimer = 0;
    turretSpawnTimer = 0;
    fireCooldown = 0;
    scrollOffset = 0;
    screenShakeTimer = 0;
    lastTime = 0;
    comboTimer = 0;
    lastKillTime = 0;
    const initB = getTrenchBounds(0);
    player.x = (initB.left + initB.right) / 2;
    player.y = ch * 0.78;
    player.invincibleTimer = 1;
  }

  // Listen for restart
  function onRestartClick(e: Event) {
    e.preventDefault();
    if (state.gameOver) {
      restart();
    }
  }
  canvas.addEventListener('click', onRestartClick);
  canvas.addEventListener('touchstart', onRestartClick);

  // ── Game Loop ─────────────────────────────────────────────────────
  function gameLoop(timestamp: number) {
    if (state.completed) return;
    const dt = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
    lastTime = timestamp;
    if (state.running) {
      update(Math.min(dt, 0.05));
    }
    render();
    animId = requestAnimationFrame(gameLoop);
  }

  animId = requestAnimationFrame(gameLoop);

  return {
    state,
    destroy: () => {
      state.running = false;
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', onRestartClick);
      canvas.removeEventListener('touchstart', onRestartClick);
    }
  };
}
