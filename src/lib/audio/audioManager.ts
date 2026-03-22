let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return sharedAudioCtx;
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

// ── Game sounds ──────────────────────────────────────────────────
export function playLaserShoot() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(900, t);
  osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
  gain.gain.setValueAtTime(0.07, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.start(t);
  osc.stop(t + 0.1);
}

export function playEnemyLaser() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'square';
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.12);
  gain.gain.setValueAtTime(0.04, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.start(t);
  osc.stop(t + 0.12);
}

export function playExplosion() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;

  // Noise burst via oscillator detune trick
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(150, t);
  osc1.frequency.exponentialRampToValueAtTime(40, t + 0.3);

  osc2.type = 'square';
  osc2.frequency.setValueAtTime(80, t);
  osc2.frequency.exponentialRampToValueAtTime(20, t + 0.3);

  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

  osc1.start(t);
  osc1.stop(t + 0.3);
  osc2.start(t);
  osc2.stop(t + 0.3);
}

export function playPlayerHit() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'square';
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.linearRampToValueAtTime(100, t + 0.2);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc.start(t);
  osc.stop(t + 0.25);
}

export function playGameOver() {
  const ctx = getAudioContext();
  const t = ctx.currentTime;
  // Descending ominous tone
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
  // Ascending triumphant fanfare
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

// ── Star Wars theme (MP3 file) ──────────────────────────────────
import { Howl } from 'howler';

let starWarsTheme: Howl | null = null;

export function playStarWarsTheme() {
  if (!starWarsTheme) {
    starWarsTheme = new Howl({
      src: ['/audio/star-wars-theme.mp3'],
      volume: 0.7,
    });
  }
  starWarsTheme.play();
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
