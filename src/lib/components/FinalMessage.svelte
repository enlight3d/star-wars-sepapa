<script lang="ts">
  import { onMount } from 'svelte';
  import { contributors } from '$lib/data/config';
  import { fadeOutStarWarsTheme } from '$lib/audio/audioManager';

  let visible = $state(false);
  let showNames = $state(false);

  onMount(() => {
    fadeOutStarWarsTheme(5000);
    setTimeout(() => visible = true, 500);
    setTimeout(() => showNames = true, 2000);
  });
</script>

<div class="hologram-screen">
  <div class="scanlines"></div>

  <div class="content" class:visible>
    <h1 class="title">bon anniversaire</h1>
    <h2 class="name">alexis</h2>

    {#if showNames}
      <div class="contributors">
        <p class="label">— Les Commandants de la Flotte —</p>
        <div class="names">
          {#each contributors as name, i}
            <span class="contributor" style="animation-delay: {i * 0.15}s">
              {name}
            </span>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <div class="confetti-container">
    {#each Array(50) as _, i}
      <div
        class="confetti-piece"
        style="
          left: {Math.random() * 100}%;
          animation-delay: {Math.random() * 3}s;
          animation-duration: {2 + Math.random() * 3}s;
          background: {['#ffd700', '#4fc3f7', '#ff8f00', '#fff'][i % 4]};
        "
      ></div>
    {/each}
  </div>
</div>

<style>
  .hologram-screen { position: absolute; inset: 0; z-index: 10; background: radial-gradient(ellipse at center, #001a2e 0%, #000 70%); display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .scanlines { position: absolute; inset: 0; background: repeating-linear-gradient(0deg, rgba(0, 188, 212, 0.03) 0px, rgba(0, 188, 212, 0.03) 1px, transparent 1px, transparent 4px); pointer-events: none; z-index: 1; animation: scanMove 8s linear infinite; }
  .content { position: relative; z-index: 2; text-align: center; opacity: 0; transform: scale(0.9); transition: opacity 1s ease, transform 1s ease; }
  .content.visible { opacity: 1; transform: scale(1); }
  .title { font-family: 'Star Jedi', sans-serif; color: var(--hologram-blue); font-size: clamp(1.5rem, 6vw, 4rem); text-shadow: 0 0 30px rgba(0, 188, 212, 0.5), 0 0 60px rgba(0, 188, 212, 0.2); animation: hologramFlicker 4s ease-in-out infinite; }
  .name { font-family: 'Star Jedi', sans-serif; color: var(--sw-yellow); font-size: clamp(2rem, 8vw, 5rem); margin-top: 0.5rem; text-shadow: 0 0 30px rgba(255, 215, 0, 0.5); }
  .contributors { margin-top: 3rem; }
  .label { color: var(--hologram-blue); font-family: monospace; font-size: clamp(0.7rem, 2vw, 1rem); letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 1.5rem; opacity: 0.8; }
  .names { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.8rem 1.5rem; max-width: 500px; margin: 0 auto; }
  .contributor { color: var(--sw-blue); font-family: monospace; font-size: clamp(0.9rem, 2.5vw, 1.3rem); opacity: 0; animation: fadeIn 0.5s ease forwards; }
  .confetti-container { position: absolute; inset: 0; pointer-events: none; z-index: 3; }
  .confetti-piece { position: absolute; top: -10px; width: 8px; height: 8px; border-radius: 2px; animation: confettiFall linear infinite; opacity: 0.8; }
  @keyframes fadeIn { to { opacity: 1; } }
  @keyframes hologramFlicker { 0%, 100% { opacity: 1; } 92% { opacity: 1; } 93% { opacity: 0.6; } 94% { opacity: 1; } 96% { opacity: 0.8; } 97% { opacity: 1; } }
  @keyframes scanMove { from { transform: translateY(0); } to { transform: translateY(4px); } }
  @keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
</style>
