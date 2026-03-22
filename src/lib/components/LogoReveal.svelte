<script lang="ts">
  import { onMount } from 'svelte';

  let { onComplete }: { onComplete: () => void } = $props();

  let animate = $state(false);

  onMount(() => {
    setTimeout(() => animate = true, 100);
    setTimeout(onComplete, 5500);
  });
</script>

<div class="logo-reveal">
  <div class="logo-container" class:animate>
    <h1 class="title">JOYEUX<br/>ANNIVERSAIRE</h1>
    <h2 class="subtitle">ALEXIS</h2>
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
    transform: scale(3);
    opacity: 1;
    transition: transform 5s ease-out, opacity 0.5s ease;
  }

  .logo-container.animate {
    transform: scale(0.3) translateZ(-200px);
    opacity: 0;
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
