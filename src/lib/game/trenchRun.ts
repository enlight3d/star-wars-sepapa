import type { Controls } from './controls';
import {
  drawXWing, drawTIE, drawTurret, drawLaser,
  drawTrenchWall, drawTrenchFloor, drawExplosion,
  drawPixelText, drawShieldIcon, drawTargetingReticle, drawExhaustPort,
  drawCrossbar, drawWallProtrusion, drawVerticalPipe
} from './sprites';
import type { ProtrusionType } from './sprites';
import {
  playLaserShoot, playEnemyLaser, playExplosion,
  playPlayerHit, playGameOver, playVictory
} from '$lib/audio/audioManager';

// ── Types ───────────────────────────────────────────────────────────
interface Entity { x: number; y: number; w: number; h: number; }
interface Laser extends Entity { isEnemy: boolean; vy: number; vx: number; }
interface TIEFighter extends Entity {
  speed: number;
  sineOffset: number;
  sineSpeed: number;
  sineAmplitude: number;
  baseX: number;
  fireTimer: number;
  hp: number;
  fromBehind: boolean; // spawns from bottom, flies up
}
interface Turret extends Entity {
  facingRight: boolean;
  fireTimer: number;
  hp: number;
  aimAngle: number;
}
interface WallObstacle extends Entity {
  onLeft: boolean;
  protrusionType: ProtrusionType;
}
interface CrossbarObstacle extends Entity {
  // x/y = top-left corner, w = width, h = bar thickness
}
interface VerticalPipeObstacle extends Entity {
  // x/y = top-left corner, w = pipe width, h = pipe height
}
interface Explosion { x: number; y: number; frame: number; maxFrames: number; big: boolean; }

interface RadioMessage {
  speaker: string;
  text: string;
  startTime: number;
  duration: number;
  charIndex: number;
  charTimer: number;
}

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
  phase: number;
  paused: boolean;
}

// ── Constants ───────────────────────────────────────────────────────
const DURATION = 50;
const MAX_HP = 5;
const PLAYER_SPEED = 4.5;
const FIRE_COOLDOWN = 0.16;
const PLAYER_LASER_SPEED = 500;
const ENEMY_LASER_SPEED = 220;
const TURRET_FIRE_INTERVAL = 2.2;
const TIE_FIRE_INTERVAL = 1.8;
const INVINCIBILITY_DURATION = 0.6;
const EXPLOSION_FRAMES = 20;
const BIG_EXPLOSION_FRAMES = 28;
const SCREEN_SHAKE_DURATION = 0.3;
const SCREEN_SHAKE_INTENSITY = 6;
const BIG_SHAKE_INTENSITY = 12;
const COMBO_TIMEOUT = 2.0;

// Phase timing
const PHASE1_INTRO_DURATION = 2.5;
const PHASE1_GAMEPLAY_DURATION = 15;
const PHASE2_INTRO_DURATION = 2.5;
const PHASE2_GAMEPLAY_DURATION = 20;
const PHASE3_INTRO_DURATION = 2.5;
const PHASE3_GAMEPLAY_DURATION = 15;

const PHASE1_START = 0;
const PHASE1_GAMEPLAY_START = PHASE1_INTRO_DURATION;
const PHASE1_END = PHASE1_INTRO_DURATION + PHASE1_GAMEPLAY_DURATION;

const PHASE2_START = PHASE1_END;
const PHASE2_GAMEPLAY_START = PHASE2_START + PHASE2_INTRO_DURATION;
const PHASE2_END = PHASE2_START + PHASE2_INTRO_DURATION + PHASE2_GAMEPLAY_DURATION;

const PHASE3_START = PHASE2_END;
const PHASE3_GAMEPLAY_START = PHASE3_START + PHASE3_INTRO_DURATION;
const PHASE3_END = PHASE3_START + PHASE3_INTRO_DURATION + PHASE3_GAMEPLAY_DURATION;

// Radio messages (timed)
const RADIO_MESSAGES: { time: number; speaker: string; text: string; duration: number }[] = [
  { time: PHASE1_START, speaker: 'RED LEADER', text: 'Restez en formation, approche de la tranchee...', duration: PHASE1_INTRO_DURATION },
  { time: PHASE2_START, speaker: 'WEDGE', text: 'Des chasseurs TIE derriere nous !', duration: PHASE2_INTRO_DURATION },
  { time: PHASE2_GAMEPLAY_START + 15, speaker: 'BIGGS', text: 'Je ne peux pas les semer !', duration: 3 },
  { time: PHASE3_START, speaker: 'OBI-WAN', text: 'Utilise la Force, Alexis...', duration: PHASE3_INTRO_DURATION },
];

export function createTrenchRun(
  canvas: HTMLCanvasElement,
  controls: Controls,
  onComplete: () => void
) {
  const ctx = canvas.getContext('2d')!;
  let animId: number;
  let lastTime = 0;

  const cw = canvas.width;
  const ch = canvas.height;
  const scale = Math.min(cw, ch) / 400;

  // Trench geometry
  const trenchMarginBase = cw * 0.15;

  function getTrenchBounds(elapsed: number) {
    // Phase 3: trench narrows significantly
    let narrow = 0;
    if (elapsed >= PHASE3_GAMEPLAY_START) {
      const p3progress = Math.min((elapsed - PHASE3_GAMEPLAY_START) / PHASE3_GAMEPLAY_DURATION, 1);
      narrow = cw * 0.08 * p3progress;
    }
    return {
      left: trenchMarginBase + narrow * 0.5,
      right: cw - trenchMarginBase - narrow * 0.5
    };
  }

  function getScrollSpeed(elapsed: number): number {
    if (elapsed < PHASE2_GAMEPLAY_START) return 130;
    if (elapsed < PHASE3_GAMEPLAY_START) return 160;
    // Phase 3: accelerating
    const p3progress = Math.min((elapsed - PHASE3_GAMEPLAY_START) / PHASE3_GAMEPLAY_DURATION, 1);
    return 180 + p3progress * 80;
  }

  const state: GameState = {
    running: true, score: 0, completed: false, elapsed: 0,
    hp: MAX_HP, maxHp: MAX_HP, gameOver: false,
    kills: 0, combo: 0, bestCombo: 0, noHitStreak: 0,
    phase: 1, paused: false
  };

  // Checkpoint state for restart
  let checkpointPhase = 1;
  let checkpointScore = 0;
  let checkpointKills = 0;

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
  const obstacles: WallObstacle[] = [];
  const crossbars: CrossbarObstacle[] = [];
  const verticalPipes: VerticalPipeObstacle[] = [];
  const lasers: Laser[] = [];
  const explosions: Explosion[] = [];
  let fireCooldown = 0;
  let scrollOffset = 0;
  let screenShakeTimer = 0;
  let screenShakeIntensity = SCREEN_SHAKE_INTENSITY;
  let comboTimer = 0;
  let lastKillTime = 0;

  // Phase management
  let currentPhase = 0; // 0 = not started yet, 1-3 during gameplay
  let phaseIntroActive = false;
  let inGameplay = false;

  // Turret spawning
  let turretSpawnTimer = 0;
  const TURRET_SPAWN_INTERVAL = 3.5;

  // TIE spawning
  let tieSpawnTimer = 0;

  // Obstacle spawning
  let obstacleSpawnTimer = 0;
  let crossbarSpawnTimer = 0;
  let verticalPipeSpawnTimer = 0;
  let obstacleSequence = 0; // procedural counter for alternating patterns

  // Radio messages
  let activeRadio: RadioMessage | null = null;
  let shownRadioIndices: Set<number> = new Set();

  // Phase 3: targeting computer
  let targetingProgress = 0;
  let exhaustPortY = -50;
  let exhaustPortSize = 8;

  // Victory sequence
  let victoryTriggered = false;
  let victoryTimer = 0;
  let victoryFlashAlpha = 0;
  let victoryTextShown = false;

  // Bullet-time
  let bulletTimeActive = false;
  let bulletTimeFactor = 1;

  // ── Helpers ────────────────────────────────────────────────────────

  function isInIntro(elapsed: number): boolean {
    return (
      (elapsed >= PHASE1_START && elapsed < PHASE1_GAMEPLAY_START) ||
      (elapsed >= PHASE2_START && elapsed < PHASE2_GAMEPLAY_START) ||
      (elapsed >= PHASE3_START && elapsed < PHASE3_GAMEPLAY_START)
    );
  }

  function getCurrentPhase(elapsed: number): number {
    if (elapsed < PHASE2_START) return 1;
    if (elapsed < PHASE3_START) return 2;
    return 3;
  }

  function getPhaseStartTime(phase: number): number {
    if (phase === 1) return PHASE1_START;
    if (phase === 2) return PHASE2_START;
    return PHASE3_START;
  }

  function getPhaseGameplayStart(phase: number): number {
    if (phase === 1) return PHASE1_GAMEPLAY_START;
    if (phase === 2) return PHASE2_GAMEPLAY_START;
    return PHASE3_GAMEPLAY_START;
  }

  // ── Spawn helpers ─────────────────────────────────────────────────
  function spawnTIE(fromBehind: boolean = false) {
    const bounds = getTrenchBounds(state.elapsed);
    const margin = 30 * scale;
    const spawnX = bounds.left + margin + Math.random() * (bounds.right - bounds.left - margin * 2);
    const phase = getCurrentPhase(state.elapsed);
    const speedMult = phase === 3 ? 1.4 : phase === 2 ? 1.1 : 1;

    ties.push({
      x: spawnX,
      y: fromBehind ? ch + 40 * scale : -35 * scale,
      w: 35 * scale, h: 35 * scale,
      speed: (fromBehind ? -(80 + Math.random() * 40) : (70 + Math.random() * 50)) * speedMult,
      sineOffset: Math.random() * Math.PI * 2,
      sineSpeed: 1.5 + Math.random() * 2.5,
      sineAmplitude: 20 + Math.random() * 35,
      baseX: spawnX,
      fireTimer: 0.8 + Math.random() * TIE_FIRE_INTERVAL,
      hp: 1,
      fromBehind
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

  const PROTRUSION_TYPES: ProtrusionType[] = ['pipes', 'antenna', 'sensor', 'machinery', 'vent'];

  function spawnObstacle() {
    const bounds = getTrenchBounds(state.elapsed);
    // Alternate sides procedurally for a designed feel
    obstacleSequence++;
    const onLeft = obstacleSequence % 2 === 0;
    const obsW = 18 + Math.random() * 28;
    const obsH = 12 + Math.random() * 18;
    // Pick protrusion type based on sequence for variety
    const typeIndex = (obstacleSequence * 7 + Math.floor(state.elapsed * 3)) % PROTRUSION_TYPES.length;
    const protrusionType = PROTRUSION_TYPES[typeIndex];
    obstacles.push({
      x: onLeft ? bounds.left : bounds.right - obsW * scale,
      y: -obsH * scale,
      w: obsW * scale,
      h: obsH * scale,
      onLeft,
      protrusionType
    });
  }

  function spawnCrossbar() {
    const bounds = getTrenchBounds(state.elapsed);
    const trenchW = bounds.right - bounds.left;
    const phase = getCurrentPhase(state.elapsed);
    // Crossbar spans 40-70% of trench width, leaving a gap for the player
    const barWidthRatio = phase === 3 ? 0.55 + Math.random() * 0.15 : phase === 2 ? 0.45 + Math.random() * 0.15 : 0.35 + Math.random() * 0.15;
    const barW = trenchW * barWidthRatio;
    const barH = (6 + Math.random() * 4) * scale;
    // Alternate left/right alignment so player must dodge
    const fromLeft = obstacleSequence % 3 !== 0;
    const barX = fromLeft ? bounds.left : bounds.right - barW;
    crossbars.push({
      x: barX,
      y: -barH,
      w: barW,
      h: barH
    });
  }

  function spawnVerticalPipe() {
    const bounds = getTrenchBounds(state.elapsed);
    const trenchW = bounds.right - bounds.left;
    const phase = getCurrentPhase(state.elapsed);
    const pipeW = (6 + Math.random() * 6) * scale;
    const pipeH = (25 + Math.random() * 20) * scale;
    // Place pipe in the center area of the trench (not on walls)
    const margin = trenchW * 0.15;
    const pipeX = bounds.left + margin + Math.random() * (trenchW - margin * 2 - pipeW);
    verticalPipes.push({
      x: pipeX,
      y: -pipeH,
      w: pipeW,
      h: pipeH
    });
  }

  // ── Collision ─────────────────────────────────────────────────────
  function collides(a: Entity, b: Entity): boolean {
    return (
      a.x - a.w / 2 < b.x + b.w / 2 &&
      a.x + a.w / 2 > b.x - b.w / 2 &&
      a.y - a.h / 2 < b.y + b.h / 2 &&
      a.y + a.h / 2 > b.y - b.h / 2
    );
  }

  function playerHitbox(): Entity {
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
    const comboMultiplier = Math.min(state.combo, 5);
    state.score += points * comboMultiplier;
    comboTimer = 2.0;
    if (state.noHitStreak > 0) state.score += 50;
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
    // Apply bullet-time
    const effectiveDt = dt * bulletTimeFactor;

    state.elapsed += effectiveDt;
    state.phase = getCurrentPhase(state.elapsed);

    // Save checkpoint at phase transitions
    if (state.phase > checkpointPhase) {
      checkpointPhase = state.phase;
      checkpointScore = state.score;
      checkpointKills = state.kills;
    }

    // Check for intro vs gameplay
    phaseIntroActive = isInIntro(state.elapsed);
    inGameplay = !phaseIntroActive && state.elapsed < PHASE3_END;

    // Update radio messages
    for (let i = 0; i < RADIO_MESSAGES.length; i++) {
      const rm = RADIO_MESSAGES[i];
      if (state.elapsed >= rm.time && state.elapsed < rm.time + rm.duration && !shownRadioIndices.has(i)) {
        shownRadioIndices.add(i);
        activeRadio = {
          speaker: rm.speaker,
          text: rm.text,
          startTime: state.elapsed,
          duration: rm.duration,
          charIndex: 0,
          charTimer: 0
        };
      }
    }

    // Update active radio typewriter
    if (activeRadio) {
      activeRadio.charTimer += dt; // use real dt for typewriter
      const charsPerSecond = 30;
      activeRadio.charIndex = Math.min(
        Math.floor(activeRadio.charTimer * charsPerSecond),
        activeRadio.text.length
      );
      if (state.elapsed > activeRadio.startTime + activeRadio.duration) {
        activeRadio = null;
      }
    }

    // Victory sequence
    if (state.elapsed >= PHASE3_END && !victoryTriggered) {
      victoryTriggered = true;
      bulletTimeActive = false;
      bulletTimeFactor = 1;
      playVictory();
    }

    if (victoryTriggered) {
      victoryTimer += dt;
      if (victoryTimer < 0.5) {
        // Flash white
        victoryFlashAlpha = Math.min(victoryTimer / 0.3, 1);
      } else if (victoryTimer < 2) {
        victoryFlashAlpha = Math.max(1 - (victoryTimer - 0.5) / 0.5, 0);
        victoryTextShown = true;
      } else if (victoryTimer < 4) {
        victoryFlashAlpha = 0;
      } else if (!state.completed) {
        state.completed = true;
        state.running = false;
        setTimeout(onComplete, 500);
      }
      return;
    }

    // During intros, minimal updates
    if (phaseIntroActive) {
      scrollOffset += 60 * effectiveDt; // slow scroll during intros
      return;
    }

    if (!inGameplay) return;

    const scrollSpeed = getScrollSpeed(state.elapsed);
    const bounds = getTrenchBounds(state.elapsed);
    scrollOffset += scrollSpeed * effectiveDt;

    // Timers
    player.invincibleTimer = Math.max(0, player.invincibleTimer - effectiveDt);
    player.flashPhase += dt * 20;
    screenShakeTimer = Math.max(0, screenShakeTimer - effectiveDt);
    fireCooldown = Math.max(0, fireCooldown - effectiveDt);
    comboTimer = Math.max(0, comboTimer - effectiveDt);
    if (comboTimer <= 0) state.combo = 0;

    // Player movement — use analog intensity if available (joystick), else full speed (keyboard)
    const moveSpeed = PLAYER_SPEED * 60 * effectiveDt * scale;
    if (controls.ix !== undefined && controls.ix !== 0) {
      player.x += moveSpeed * controls.ix;
    } else {
      if (controls.left) player.x -= moveSpeed;
      if (controls.right) player.x += moveSpeed;
    }
    if (controls.iy !== undefined && controls.iy !== 0) {
      player.y += moveSpeed * controls.iy;
    } else {
      if (controls.up) player.y -= moveSpeed;
      if (controls.down) player.y += moveSpeed;
    }

    // Clamp to trench
    const padX = playerVisualW * 0.45;
    const padY = playerVisualH * 0.45;
    player.x = Math.max(bounds.left + padX, Math.min(bounds.right - padX, player.x));
    player.y = Math.max(padY + 10, Math.min(ch - padY - 20, player.y));

    // Fire
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

    // ── Phase-specific spawning ──

    const phase = state.phase;

    // Turret spawning (phases 1-3)
    turretSpawnTimer += effectiveDt;
    const turretInterval = phase === 3 ? 2.5 : phase === 2 ? 3.0 : TURRET_SPAWN_INTERVAL;
    if (turretSpawnTimer > turretInterval) {
      turretSpawnTimer = 0;
      spawnTurret();
    }

    // Obstacle spawning (phases 1-3, more frequent in phase 2-3)
    obstacleSpawnTimer += effectiveDt;
    const obsInterval = phase === 3 ? 1.0 : phase === 2 ? 1.8 : 2.8;
    if (obstacleSpawnTimer > obsInterval) {
      obstacleSpawnTimer = 0;
      spawnObstacle();
      // In phases 2-3, sometimes spawn a second wall obstacle from the opposite side
      if (phase >= 2 && Math.random() > 0.5) {
        spawnObstacle();
      }
    }

    // Crossbar spawning (phase 2-3, occasional in phase 1)
    crossbarSpawnTimer += effectiveDt;
    const crossbarInterval = phase === 3 ? 3.0 : phase === 2 ? 5.0 : 8.0;
    if (crossbarSpawnTimer > crossbarInterval) {
      crossbarSpawnTimer = 0;
      if (phase >= 2 || Math.random() > 0.5) {
        spawnCrossbar();
      }
    }

    // Vertical pipe spawning (phase 2-3 only)
    if (phase >= 2) {
      verticalPipeSpawnTimer += effectiveDt;
      const pipeInterval = phase === 3 ? 2.5 : 4.0;
      if (verticalPipeSpawnTimer > pipeInterval) {
        verticalPipeSpawnTimer = 0;
        spawnVerticalPipe();
      }
    }

    // TIE spawning (phase 2-3 only)
    if (phase >= 2) {
      tieSpawnTimer += effectiveDt;
      const phaseProgress = phase === 2
        ? (state.elapsed - PHASE2_GAMEPLAY_START) / PHASE2_GAMEPLAY_DURATION
        : (state.elapsed - PHASE3_GAMEPLAY_START) / PHASE3_GAMEPLAY_DURATION;
      const tieInterval = phase === 3 ? 3.0 : Math.max(0.8, 2.0 - phaseProgress * 1.2);
      if (tieSpawnTimer > tieInterval) {
        tieSpawnTimer = 0;
        // Phase 2: TIEs come from behind sometimes
        const fromBehind = phase === 2 && Math.random() > 0.4;
        spawnTIE(fromBehind);
        // Extra TIE at higher intensity
        if (phaseProgress > 0.5 && Math.random() > 0.5) {
          spawnTIE(!fromBehind);
        }
      }
    }

    // Phase 3: targeting computer + exhaust port
    if (phase === 3) {
      const p3progress = (state.elapsed - PHASE3_GAMEPLAY_START) / PHASE3_GAMEPLAY_DURATION;
      targetingProgress = Math.min(p3progress, 1);

      // Exhaust port moves down from top
      exhaustPortY = -20 + p3progress * (ch * 0.3 + 20);
      exhaustPortSize = 8 + p3progress * 20;

      // Bullet-time near the end
      if (p3progress > 0.85 && !bulletTimeActive) {
        bulletTimeActive = true;
      }
      if (bulletTimeActive) {
        bulletTimeFactor = Math.max(0.2, 1 - (p3progress - 0.85) / 0.15 * 0.8);
      }
    }

    // ── Update entities ──

    // Update TIEs
    for (const tie of ties) {
      tie.y += tie.speed * effectiveDt;
      tie.sineOffset += tie.sineSpeed * effectiveDt;
      tie.baseX = Math.max(bounds.left + 20 * scale, Math.min(bounds.right - 20 * scale, tie.baseX));
      tie.x = tie.baseX + Math.sin(tie.sineOffset) * tie.sineAmplitude * scale;
      tie.x = Math.max(bounds.left + 18 * scale, Math.min(bounds.right - 18 * scale, tie.x));

      // Fire at player
      tie.fireTimer -= effectiveDt;
      if (tie.fireTimer <= 0 && tie.y > 0 && tie.y < ch) {
        tie.fireTimer = TIE_FIRE_INTERVAL * 0.8 + Math.random() * 0.5;
        const dx = player.x - tie.x;
        const dy = player.y - tie.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const vx = (dx / dist) * ENEMY_LASER_SPEED * 0.35;
        const vy = (dy / dist) * ENEMY_LASER_SPEED;
        lasers.push({
          x: tie.x, y: tie.y + (tie.fromBehind ? -17 * scale : 17 * scale),
          w: 4, h: 12,
          isEnemy: true,
          vy: tie.fromBehind ? Math.min(vy, -ENEMY_LASER_SPEED * 0.5) : Math.max(vy, ENEMY_LASER_SPEED * 0.5),
          vx
        });
        playEnemyLaser();
      }
    }

    // Update turrets
    for (const turret of turrets) {
      turret.y += scrollSpeed * effectiveDt;
      const tb = getTrenchBounds(state.elapsed);
      if (turret.facingRight) {
        turret.x = tb.left - turret.w * 0.3;
      } else {
        turret.x = tb.right - turret.w * 0.7;
      }

      const tcx = turret.x + turret.w / 2;
      const tcy = turret.y + turret.h / 2;
      const dx = player.x - tcx;
      const dy = player.y - tcy;
      turret.aimAngle = Math.atan2(dy, turret.facingRight ? dx : -dx);

      turret.fireTimer -= effectiveDt;
      if (turret.fireTimer <= 0 && turret.y > 0 && turret.y < ch) {
        turret.fireTimer = TURRET_FIRE_INTERVAL * 0.9;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        // Turrets fire green bolts (turbolaser)
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

    // Update obstacles (scroll down)
    for (const obs of obstacles) {
      obs.y += scrollSpeed * effectiveDt;
    }
    for (const cb of crossbars) {
      cb.y += scrollSpeed * effectiveDt;
    }
    for (const vp of verticalPipes) {
      vp.y += scrollSpeed * effectiveDt;
    }

    // Update lasers
    for (const l of lasers) {
      l.y += l.vy * effectiveDt;
      l.x += l.vx * effectiveDt;
    }

    // ── Collisions ──

    const ph = playerHitbox();

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

    // Obstacle vs player
    for (const obs of obstacles) {
      const obsCx = obs.x + obs.w / 2;
      const obsCy = obs.y + obs.h / 2;
      if (collides(ph, { x: obsCx, y: obsCy, w: obs.w * 0.8, h: obs.h * 0.8 })) {
        hitPlayer();
      }
    }
    // Crossbar vs player
    for (const cb of crossbars) {
      const cbCx = cb.x + cb.w / 2;
      const cbCy = cb.y + cb.h / 2;
      if (collides(ph, { x: cbCx, y: cbCy, w: cb.w * 0.9, h: cb.h * 0.9 })) {
        hitPlayer();
      }
    }
    // Vertical pipe vs player
    for (const vp of verticalPipes) {
      const vpCx = vp.x + vp.w / 2;
      const vpCy = vp.y + vp.h / 2;
      if (collides(ph, { x: vpCx, y: vpCy, w: vp.w * 0.8, h: vp.h * 0.8 })) {
        hitPlayer();
      }
    }

    // Cleanup off-screen
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      if (l.y < -30 || l.y > ch + 30 || l.x < -30 || l.x > cw + 30) lasers.splice(i, 1);
    }
    for (let i = ties.length - 1; i >= 0; i--) {
      if (ties[i].fromBehind ? ties[i].y < -60 : ties[i].y > ch + 60) ties.splice(i, 1);
    }
    for (let i = turrets.length - 1; i >= 0; i--) {
      if (turrets[i].y > ch + 60) turrets.splice(i, 1);
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].y > ch + 60) obstacles.splice(i, 1);
    }
    for (let i = crossbars.length - 1; i >= 0; i--) {
      if (crossbars[i].y > ch + 60) crossbars.splice(i, 1);
    }
    for (let i = verticalPipes.length - 1; i >= 0; i--) {
      if (verticalPipes[i].y > ch + 60) verticalPipes.splice(i, 1);
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

    // Trench walls
    drawTrenchWall(ctx, 0, 0, bounds.left, ch, scrollOffset);
    drawTrenchWall(ctx, bounds.right, 0, cw - bounds.right, ch, scrollOffset);

    // Wall obstacles (detailed protrusions)
    for (const obs of obstacles) {
      drawWallProtrusion(ctx, obs.x, obs.y, obs.w, obs.h, obs.onLeft, obs.protrusionType, scrollOffset);
    }

    // Crossbar obstacles
    for (const cb of crossbars) {
      drawCrossbar(ctx, cb.x, cb.y, cb.w, cb.h, scrollOffset);
    }

    // Vertical pipe obstacles
    for (const vp of verticalPipes) {
      drawVerticalPipe(ctx, vp.x, vp.y, vp.w, vp.h, scrollOffset);
    }

    // Phase 3: Exhaust port
    if (state.phase === 3 && state.elapsed >= PHASE3_GAMEPLAY_START) {
      const trenchCx = (bounds.left + bounds.right) / 2;
      drawExhaustPort(ctx, trenchCx, exhaustPortY, exhaustPortSize, state.elapsed);
    }

    // Turrets
    for (const t of turrets) {
      drawTurret(ctx, t.x + t.w / 2, t.y + t.h / 2, scale, t.facingRight, t.aimAngle);
    }

    // TIE Fighters — bank based on sine movement
    for (const tie of ties) {
      const cosVal = Math.cos(tie.sineOffset);
      const tieBank = cosVal > 0.3 ? 'right' : cosVal < -0.3 ? 'left' : 'center';
      drawTIE(ctx, tie.x, tie.y, scale, tieBank);
    }

    // Lasers
    for (const l of lasers) {
      drawLaser(ctx, l.x, l.y, l.isEnemy);
    }

    // Player — bank based on movement direction
    const showPlayer = player.invincibleTimer <= 0 || Math.sin(player.flashPhase) > 0;
    if (showPlayer && !state.gameOver) {
      const playerBank = controls.left ? 'left' : controls.right ? 'right' : 'center';
      drawXWing(ctx, player.x, player.y, scale, playerBank);
    }

    // Explosions
    for (const e of explosions) {
      drawExplosion(ctx, e.x, e.y, e.frame, e.maxFrames, e.big);
    }

    // Phase 3: Targeting reticle overlay
    if (state.phase === 3 && state.elapsed >= PHASE3_GAMEPLAY_START && !victoryTriggered) {
      const trenchCx = (bounds.left + bounds.right) / 2;
      const reticleSize = Math.min(bounds.right - bounds.left, ch) * 0.35;
      drawTargetingReticle(ctx, trenchCx, ch * 0.3, reticleSize, targetingProgress, state.elapsed);
    }

    // ── HUD ────────────────────────────────────────────────────────

    const hudPixelSize = Math.max(1, Math.round(scale * 1.5));

    // Score — top-left (gold pixel text)
    drawPixelText(ctx, `SCORE:${state.score}`, 8, 8, '#ffd700', hudPixelSize);

    // Kill counter below score
    drawPixelText(ctx, `KILLS:${state.kills}`, 8, 8 + hudPixelSize * 9, '#aaaaaa', Math.max(1, hudPixelSize - 1));

    // Combo indicator
    if (state.combo > 1 && comboTimer > 0) {
      ctx.globalAlpha = Math.min(comboTimer, 1);
      const comboColor = state.combo >= 5 ? '#ff4444' : state.combo >= 3 ? '#ff8800' : '#ffcc00';
      drawPixelText(ctx, `x${state.combo} COMBO!`, 8, 8 + hudPixelSize * 18, comboColor, hudPixelSize);
      ctx.globalAlpha = 1;
    }

    // Phase indicator — top-center
    drawPixelText(ctx, `PHASE ${state.phase}/3`, cw / 2, 8, '#4fc3f7', hudPixelSize, 'center');

    // Shield icons — top-right
    const shieldIconSize = hudPixelSize * 6;
    const shieldStartX = cw - 8 - state.maxHp * (shieldIconSize + 3);
    for (let i = 0; i < state.maxHp; i++) {
      drawShieldIcon(
        ctx,
        shieldStartX + i * (shieldIconSize + 3),
        8,
        shieldIconSize,
        i < state.hp
      );
    }

    // Radio message bar — bottom
    if (activeRadio) {
      // Semi-transparent black bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      const barH = hudPixelSize * 20;
      ctx.fillRect(0, ch - barH, cw, barH);
      // Border top
      ctx.fillStyle = '#333344';
      ctx.fillRect(0, ch - barH, cw, 2);

      // Speaker name
      const speakerColor = '#4fc3f7';
      drawPixelText(ctx, `${activeRadio.speaker}:`, 10, ch - barH + 6, speakerColor, hudPixelSize);

      // Message text (typewriter)
      drawPixelText(
        ctx, activeRadio.text,
        10, ch - barH + 6 + hudPixelSize * 9,
        '#ffdd44', Math.max(1, hudPixelSize - 1),
        'left', activeRadio.charIndex
      );
    }

    // ── Phase intro overlay ──
    if (phaseIntroActive) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-5, -5, cw + 10, ch + 10);

      const phase = getCurrentPhase(state.elapsed);
      const introStart = getPhaseStartTime(phase);
      const introProgress = (state.elapsed - introStart) / (getPhaseGameplayStart(phase) - introStart);

      // Phase number (big)
      const phaseTextSize = Math.round(hudPixelSize * 3);
      const fadeIn = Math.min(introProgress * 3, 1);
      ctx.globalAlpha = fadeIn;

      let phaseTitle = '';
      if (phase === 1) phaseTitle = 'STAY ON TARGET';
      else if (phase === 2) phaseTitle = 'WATCH YOUR BACK!';
      else phaseTitle = 'USE THE FORCE';

      drawPixelText(ctx, `PHASE ${phase}`, cw / 2, ch / 2 - phaseTextSize * 5, '#ffd700', phaseTextSize, 'center');
      drawPixelText(ctx, phaseTitle, cw / 2, ch / 2, '#ff4444', Math.round(phaseTextSize * 0.7), 'center');

      ctx.globalAlpha = 1;
    }

    // ── Game Over Screen ──
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(-5, -5, cw + 10, ch + 10);

      const bigSize = Math.round(hudPixelSize * 2.5);
      const medSize = Math.round(hudPixelSize * 1.5);

      drawPixelText(ctx, 'MISSION ECHOUEE', cw / 2, ch / 2 - bigSize * 10, '#ff1744', bigSize, 'center');
      drawPixelText(ctx, "L'EMPIRE A PRIS LE DESSUS...", cw / 2, ch / 2 - bigSize * 2, '#ff8f00', medSize, 'center');
      drawPixelText(ctx, `SCORE: ${state.score}  KILLS: ${state.kills}`, cw / 2, ch / 2 + medSize * 5, '#ffd700', medSize, 'center');

      // Pulsing restart prompt
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 400);
      ctx.globalAlpha = 0.6 + pulse * 0.4;
      drawPixelText(ctx, '[ APPUIE POUR REESSAYER ]', cw / 2, ch / 2 + medSize * 14, '#4fc3f7', medSize, 'center');
      ctx.globalAlpha = 1;
    }

    // ── Victory End Sequence ──
    if (victoryTriggered) {
      // White flash
      if (victoryFlashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${victoryFlashAlpha})`;
        ctx.fillRect(-5, -5, cw + 10, ch + 10);
      }

      if (victoryTextShown) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(-5, -5, cw + 10, ch + 10);

        const bigSize = Math.round(hudPixelSize * 3);
        const medSize = Math.round(hudPixelSize * 1.5);

        drawPixelText(ctx, 'TIR PARFAIT !', cw / 2, ch / 2 - bigSize * 6, '#ffd700', bigSize, 'center');
        drawPixelText(ctx, 'BIEN JOUE, COMMANDANT !', cw / 2, ch / 2 - bigSize, '#44ff44', medSize, 'center');
        drawPixelText(ctx, `SCORE: ${state.score}`, cw / 2, ch / 2 + medSize * 5, '#4fc3f7', medSize, 'center');
        drawPixelText(ctx, `KILLS: ${state.kills}  COMBO: x${state.bestCombo}`, cw / 2, ch / 2 + medSize * 10, '#4fc3f7', medSize, 'center');
      }
    }

    ctx.restore();
  }

  // ── Restart (from current phase checkpoint) ───────────────────────
  function restart() {
    const restartPhase = checkpointPhase;
    const restartTime = getPhaseStartTime(restartPhase);

    state.running = true;
    state.score = checkpointScore;
    state.completed = false;
    state.elapsed = restartTime;
    state.hp = MAX_HP;
    state.gameOver = false;
    state.kills = checkpointKills;
    state.combo = 0;
    state.noHitStreak = 0;
    state.phase = restartPhase;

    victoryTriggered = false;
    victoryTimer = 0;
    victoryFlashAlpha = 0;
    victoryTextShown = false;
    bulletTimeActive = false;
    bulletTimeFactor = 1;
    targetingProgress = 0;
    exhaustPortY = -50;
    exhaustPortSize = 8;

    ties.length = 0;
    turrets.length = 0;
    obstacles.length = 0;
    crossbars.length = 0;
    verticalPipes.length = 0;
    lasers.length = 0;
    explosions.length = 0;
    tieSpawnTimer = 0;
    turretSpawnTimer = 0;
    obstacleSpawnTimer = 0;
    crossbarSpawnTimer = 0;
    verticalPipeSpawnTimer = 0;
    obstacleSequence = 0;
    fireCooldown = 0;
    screenShakeTimer = 0;
    lastTime = 0;
    comboTimer = 0;
    lastKillTime = 0;
    activeRadio = null;

    // Reset shown radio indices for current + future phases
    for (let i = 0; i < RADIO_MESSAGES.length; i++) {
      if (RADIO_MESSAGES[i].time >= restartTime) {
        shownRadioIndices.delete(i);
      }
    }

    const initB = getTrenchBounds(restartTime);
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

  // ── Pause (Escape or P key) ─────────────────────────────────────
  function onPauseKey(e: KeyboardEvent) {
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      if (!state.gameOver && !state.completed) {
        state.paused = !state.paused;
        if (!state.paused) lastTime = 0; // reset delta so no jump
      }
    }
  }
  window.addEventListener('keydown', onPauseKey);

  function renderPause() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${Math.round(28 * (cw / 400))}px monospace`;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10;
    ctx.fillText('PAUSE', cw / 2, ch / 2 - 15);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#4fc3f7';
    ctx.font = `${Math.round(12 * (cw / 400))}px monospace`;
    ctx.fillText('Appuie sur ESC ou P pour reprendre', cw / 2, ch / 2 + 20);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  // ── Game Loop ─────────────────────────────────────────────────────
  function gameLoop(timestamp: number) {
    if (state.completed) return;
    const dt = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
    lastTime = timestamp;
    if (state.running && !state.paused) {
      update(Math.min(dt, 0.05));
    }
    render();
    if (state.paused) renderPause();
    animId = requestAnimationFrame(gameLoop);
  }

  animId = requestAnimationFrame(gameLoop);

  return {
    state,
    togglePause: () => {
      if (!state.gameOver && !state.completed) {
        state.paused = !state.paused;
        if (!state.paused) lastTime = 0;
      }
    },
    destroy: () => {
      state.running = false;
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', onRestartClick);
      canvas.removeEventListener('touchstart', onRestartClick);
      window.removeEventListener('keydown', onPauseKey);
    }
  };
}
