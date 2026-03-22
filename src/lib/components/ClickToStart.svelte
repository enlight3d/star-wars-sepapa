<script lang="ts">
  import { audioEnabled } from '$lib/stores/gameState';
  import { getAudioContext } from '$lib/audio/audioManager';

  let { onComplete }: { onComplete: () => void } = $props();

  function handleStart() {
    const ctx = getAudioContext();
    ctx.resume();
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
