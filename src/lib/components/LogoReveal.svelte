<script lang="ts">
  import { onMount } from 'svelte';

  let { onComplete }: { onComplete: () => void } = $props();

  let phase = $state<'hidden' | 'big' | 'readable' | 'shrinking'>('hidden');

  onMount(() => {
    // Phase 1: appear big
    setTimeout(() => phase = 'big', 100);
    // Phase 2: settle at readable size (hold for 3 seconds)
    setTimeout(() => phase = 'readable', 800);
    // Phase 3: shrink away into the distance
    setTimeout(() => phase = 'shrinking', 4000);
    // Done
    setTimeout(onComplete, 8000);
  });
</script>

<div class="logo-reveal">
  <div class="logo-container" class:big={phase === 'big'} class:readable={phase === 'readable'} class:shrinking={phase === 'shrinking'}>
    <h1 class="title">joyeux<br/>anniversaire</h1>
    <h2 class="subtitle">alexis</h2>
  </div>
</div>

<style>
  .logo-reveal {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    perspective: 400px;
  }

  .logo-container {
    text-align: center;
    transform: scale(4);
    opacity: 0;
    transition: transform 0.7s ease-out, opacity 0.7s ease;
  }

  .logo-container.big {
    transform: scale(2.5);
    opacity: 1;
  }

  .logo-container.readable {
    transform: scale(1);
    opacity: 1;
    transition: transform 1s ease-out, opacity 0.5s ease;
  }

  .logo-container.shrinking {
    transform: scale(0.2) translateZ(-300px);
    opacity: 0;
    transition: transform 4s ease-in, opacity 3s ease-in;
  }

  .title {
    font-family: 'Star Jedi', sans-serif;
    color: var(--sw-yellow);
    font-size: clamp(1.5rem, 6vw, 4rem);
    letter-spacing: 0.05em;
    line-height: 1.3;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
  }

  .subtitle {
    font-family: 'Star Jedi', sans-serif;
    color: var(--sw-yellow);
    font-size: clamp(1rem, 4vw, 2.5rem);
    margin-top: 1rem;
    letter-spacing: 0.2em;
    opacity: 0.9;
  }
</style>
