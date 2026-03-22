<script lang="ts">
  import { audioEnabled } from '$lib/stores/gameState';
  import { getAudioContext, preloadStarWarsTheme } from '$lib/audio/audioManager';

  let { onComplete }: { onComplete: () => void } = $props();

  async function handleStart() {
    // This runs during a user gesture — unlock audio + preload theme for mobile
    const ctx = getAudioContext();
    ctx.resume();
    preloadStarWarsTheme();

    // Prevent screen lock on mobile — keep re-acquiring on visibility change
    async function acquireWakeLock() {
      try {
        const lock = await navigator.wakeLock?.request('screen');
        lock?.addEventListener('release', () => {
          // Re-acquire when page becomes visible again
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') acquireWakeLock();
          }, { once: true });
        });
      } catch {}
    }
    acquireWakeLock();

    // Fallback: play a silent audio loop to keep the screen awake
    try {
      const silentCtx = getAudioContext();
      const osc = silentCtx.createOscillator();
      const gain = silentCtx.createGain();
      gain.gain.value = 0.001; // inaudible
      osc.connect(gain);
      gain.connect(silentCtx.destination);
      osc.start();
      // This keeps the audio context active, preventing screen sleep on iOS
    } catch {}

    audioEnabled.set(true);
    onComplete();
  }
</script>

<div class="start-screen" onclick={handleStart} onkeydown={(e) => e.key === 'Enter' && handleStart()} role="button" tabindex="0">
  <p class="pulse-text">Appuie pour commencer</p>
</div>

<style>
  .start-screen {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .pulse-text {
    font-size: clamp(1rem, 4vw, 2rem);
    color: var(--sw-blue);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
</style>
