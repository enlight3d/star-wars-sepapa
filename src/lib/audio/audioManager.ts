let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return sharedAudioCtx;
}

// ── Boot sound ───────────────────────────────────────────────────
export function playBootSound() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;

  // POST beep (like old BIOS)
  const beep = ctx.createOscillator();
  const beepGain = ctx.createGain();
  beep.connect(beepGain);
  beepGain.connect(ctx.destination);
  beep.type = 'square';
  beep.frequency.value = 1000;
  beepGain.gain.setValueAtTime(0.08, t);
  beepGain.gain.setValueAtTime(0.08, t + 0.15);
  beepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  beep.start(t);
  beep.stop(t + 0.2);

  // HDD seek noise
  for (let i = 0; i < 6; i++) {
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.connect(clickGain);
    clickGain.connect(ctx.destination);
    click.type = 'sawtooth';
    click.frequency.value = 40 + Math.random() * 30;
    const startT = t + 0.3 + i * 0.12;
    clickGain.gain.setValueAtTime(0, startT);
    clickGain.gain.linearRampToValueAtTime(0.04, startT + 0.01);
    clickGain.gain.exponentialRampToValueAtTime(0.001, startT + 0.06);
    click.start(startT);
    click.stop(startT + 0.06);
  }

  // CRT power-on hum
  const hum = ctx.createOscillator();
  const humGain = ctx.createGain();
  hum.connect(humGain);
  humGain.connect(ctx.destination);
  hum.type = 'sine';
  hum.frequency.setValueAtTime(50, t);
  hum.frequency.linearRampToValueAtTime(60, t + 1.5);
  humGain.gain.setValueAtTime(0, t);
  humGain.gain.linearRampToValueAtTime(0.04, t + 0.5);
  humGain.gain.setValueAtTime(0.04, t + 1.0);
  humGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
  hum.start(t);
  hum.stop(t + 1.5);
}

// ── Terminal ──────────────────────────────────────────────────────
export function playTerminalBeep() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 800 + Math.random() * 400;
  osc.type = 'square';
  gain.gain.value = 0.05;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

export function playTerminalGranted() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  [400, 600, 800].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.08, t + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.15);
    osc.start(t + i * 0.12);
    osc.stop(t + i * 0.12 + 0.15);
  });
}

export function playTerminalDenied() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 200;
  osc.type = 'sawtooth';
  gain.gain.value = 0.08;
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc.start();
  osc.stop(t + 0.4);
}

// ── Game sounds (real MP3s via Howler.js) ────────────────────────
// Lazy-loaded Howl instances (only create on first play)
const sounds: Record<string, Howl> = {};

function getSound(name: string, src: string, volume = 0.5, loop = false): Howl {
  if (!sounds[name]) {
    sounds[name] = new Howl({ src: [`${base}/audio/${src}`], volume, loop, preload: true });
  }
  return sounds[name];
}

export function stopAllGameSounds() {
  for (const sound of Object.values(sounds)) {
    sound.stop();
  }
}

export function playLaserShoot() { getSound('xwing-fire', 'xwing-fire.mp3', 0.3).play(); }
export function playEnemyLaser() { getSound('tie-blaster', 'tie-blaster.mp3', 0.25).play(); }
export function playExplosion() { getSound('explosion', 'explosion.mp3', 0.5).play(); }
export function playPlayerHit() { getSound('alarm', 'alarm.mp3', 0.3).play(); }

export function playGameOver() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  // Descending ominous tone (keep synth)
  [400, 350, 250, 150].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, t + i * 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.25 + 0.3);
    osc.start(t + i * 0.25);
    osc.stop(t + i * 0.25 + 0.3);
  });
}

export function playVictory() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  // Ascending triumphant fanfare (keep synth)
  [400, 500, 600, 800].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, t + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.25);
    osc.start(t + i * 0.15);
    osc.stop(t + i * 0.15 + 0.25);
  });
}

// NEW cinematic sound effects
export function playTieScream(vol = 0.35) { getSound('tie-scream', 'tie-scream.mp3', vol).play(); }
export function playR2D2() { getSound('r2d2', 'r2d2.mp3', 0.3).play(); }
export function playChewbacca() { getSound('chewbacca', 'chewbacca.mp3', 0.5).play(); }
export function playSonicCharge() { getSound('sonic', 'sonic-charge.mp3', 0.4).play(); }
export function playBattleAlarm() { getSound('battle-alarm', 'alarm.mp3', 0.3).play(); }

// ── Star Wars theme (MP3 file) ──────────────────────────────────
import { Howl } from 'howler';
import { base } from '$app/paths';

let starWarsTheme: Howl | null = null;

// Call during a user gesture (click-to-start) to preload & unlock audio on mobile
export function preloadStarWarsTheme() {
  if (!starWarsTheme) {
    starWarsTheme = new Howl({
      src: [`${base}/audio/star-wars-theme.mp3`],
      volume: 0.7,
      preload: true,
    });
  }
}

export function playStarWarsTheme() {
  if (!starWarsTheme) {
    preloadStarWarsTheme();
  }
  starWarsTheme!.play();
}

export function fadeOutStarWarsTheme(duration = 2000) {
  if (starWarsTheme && starWarsTheme.playing()) {
    starWarsTheme.fade(0.7, 0, duration);
    setTimeout(() => starWarsTheme?.stop(), duration);
  }
}

export function stopStarWarsTheme() {
  starWarsTheme?.stop();
}

// ── Blast door sound ─────────────────────────────────────────────
export function playBlastDoorSound() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  const duration = 2.0;

  // Heavy metallic clunk — door unlocking
  const clunk = ctx.createOscillator();
  const clunkGain = ctx.createGain();
  clunk.connect(clunkGain);
  clunkGain.connect(ctx.destination);
  clunk.type = 'sawtooth';
  clunk.frequency.setValueAtTime(120, t);
  clunk.frequency.exponentialRampToValueAtTime(30, t + 0.15);
  clunkGain.gain.setValueAtTime(0.15, t);
  clunkGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  clunk.start(t);
  clunk.stop(t + 0.2);

  // Hydraulic hiss — sustained white noise sweep
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(3000, t + 0.1);
  noiseFilter.frequency.exponentialRampToValueAtTime(800, t + 1.0);
  noiseFilter.frequency.exponentialRampToValueAtTime(400, t + duration);
  noiseFilter.Q.value = 1.5;
  const noiseGain = ctx.createGain();
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noiseGain.gain.setValueAtTime(0, t);
  noiseGain.gain.linearRampToValueAtTime(0.12, t + 0.15);
  noiseGain.gain.setValueAtTime(0.10, t + 0.5);
  noiseGain.gain.linearRampToValueAtTime(0.06, t + 1.2);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  noise.start(t + 0.05);
  noise.stop(t + duration);

  // Mechanical grinding — low rumble
  const grind = ctx.createOscillator();
  const grindGain = ctx.createGain();
  grind.connect(grindGain);
  grindGain.connect(ctx.destination);
  grind.type = 'sawtooth';
  grind.frequency.setValueAtTime(45, t + 0.1);
  grind.frequency.linearRampToValueAtTime(35, t + 1.5);
  grindGain.gain.setValueAtTime(0, t);
  grindGain.gain.linearRampToValueAtTime(0.08, t + 0.2);
  grindGain.gain.setValueAtTime(0.06, t + 1.0);
  grindGain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
  grind.start(t + 0.1);
  grind.stop(t + 1.6);

  // Second metallic impact — door hitting end stop
  const slam = ctx.createOscillator();
  const slamGain = ctx.createGain();
  slam.connect(slamGain);
  slamGain.connect(ctx.destination);
  slam.type = 'sawtooth';
  slam.frequency.setValueAtTime(80, t + 1.4);
  slam.frequency.exponentialRampToValueAtTime(25, t + 1.6);
  slamGain.gain.setValueAtTime(0, t + 1.4);
  slamGain.gain.linearRampToValueAtTime(0.12, t + 1.42);
  slamGain.gain.exponentialRampToValueAtTime(0.001, t + 1.7);
  slam.start(t + 1.4);
  slam.stop(t + 1.7);

  // Servo motor whine
  const servo = ctx.createOscillator();
  const servoGain = ctx.createGain();
  servo.connect(servoGain);
  servoGain.connect(ctx.destination);
  servo.type = 'sine';
  servo.frequency.setValueAtTime(200, t + 0.1);
  servo.frequency.linearRampToValueAtTime(350, t + 0.8);
  servo.frequency.linearRampToValueAtTime(150, t + 1.4);
  servoGain.gain.setValueAtTime(0, t + 0.1);
  servoGain.gain.linearRampToValueAtTime(0.03, t + 0.3);
  servoGain.gain.setValueAtTime(0.03, t + 1.0);
  servoGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
  servo.start(t + 0.1);
  servo.stop(t + 1.5);
}

// ── Venator scene ────────────────────────────────────────────────
export function playBrickPlace() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800 + Math.random() * 600, t);
  osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);
  gain.gain.setValueAtTime(0.03, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  osc.start(t);
  osc.stop(t + 0.04);
}

export function playBudgetAlert() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.value = 500;
    gain.gain.setValueAtTime(0.08, t + i * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.3 + 0.15);
    osc.start(t + i * 0.3);
    osc.stop(t + i * 0.3 + 0.15);
  }
}
