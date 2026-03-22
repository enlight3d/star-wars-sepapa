<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKeyboardControls, createTouchControls } from '$lib/game/controls';
  import { createTrenchRun } from '$lib/game/trenchRun';

  let { onComplete }: { onComplete: () => void } = $props();

  let canvas: HTMLCanvasElement;
  let upBtn: HTMLButtonElement;
  let downBtn: HTMLButtonElement;
  let fireBtn: HTMLButtonElement;

  let destroyGame: (() => void) | null = null;
  let destroyKeyboard: (() => void) | null = null;
  let destroyTouch: (() => void) | null = null;
  let isMobile = $state(false);

  onMount(() => {
    isMobile = 'ontouchstart' in window;
    canvas.width = Math.min(window.innerWidth, 800);
    canvas.height = Math.min(window.innerHeight * 0.7, 500);

    const { controls: kbControls, destroy: kbDestroy } = createKeyboardControls();
    destroyKeyboard = kbDestroy;

    if (isMobile && upBtn && downBtn && fireBtn) {
      const { controls: touchControls, destroy: tDestroy } = createTouchControls(upBtn, downBtn, fireBtn);
      destroyTouch = tDestroy;
      const merged = new Proxy(kbControls, {
        get(target, prop: keyof typeof kbControls) {
          return target[prop] || touchControls[prop];
        }
      });
      const game = createTrenchRun(canvas, merged as any, onComplete);
      destroyGame = game.destroy;
    } else {
      const game = createTrenchRun(canvas, kbControls, onComplete);
      destroyGame = game.destroy;
    }
  });

  onDestroy(() => {
    destroyGame?.();
    destroyKeyboard?.();
    destroyTouch?.();
  });
</script>

<div class="game-container">
  <div class="game-header">
    <p>TRENCH RUN — Esquive les obstacles et élimine les TIE Fighters !</p>
    {#if !isMobile}
      <p class="controls-hint">&#8593;&#8595; Déplacer &middot; ESPACE Tirer</p>
    {/if}
  </div>

  <canvas bind:this={canvas} class="game-canvas"></canvas>

  <!-- Always render touch buttons so bind:this works for createTouchControls. Visibility controlled via CSS. -->
  <div class="touch-controls" class:hidden={!isMobile}>
    <div class="dpad">
      <button bind:this={upBtn} class="touch-btn up">&#9650;</button>
      <button bind:this={downBtn} class="touch-btn down">&#9660;</button>
    </div>
    <button bind:this={fireBtn} class="touch-btn fire">FIRE</button>
  </div>
</div>

<style>
  .game-container {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #000;
  }

  .game-header {
    color: var(--sw-yellow);
    text-align: center;
    margin-bottom: 1rem;
    font-family: monospace;
    font-size: clamp(0.7rem, 2vw, 0.9rem);
  }

  .controls-hint {
    color: var(--sw-blue);
    font-size: clamp(0.6rem, 1.5vw, 0.8rem);
    margin-top: 0.3rem;
  }

  .game-canvas {
    border: 1px solid #333;
    touch-action: none;
    max-width: 100%;
  }

  .touch-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 400px;
    padding: 1rem 2rem;
    margin-top: 1rem;
  }

  .touch-controls.hidden {
    display: none;
  }

  .dpad {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .touch-btn {
    background: rgba(255, 215, 0, 0.15);
    border: 2px solid var(--sw-yellow);
    color: var(--sw-yellow);
    font-family: monospace;
    font-weight: bold;
    border-radius: 12px;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
  }

  .touch-btn.up, .touch-btn.down {
    width: 70px;
    height: 55px;
    font-size: 1.5rem;
  }

  .touch-btn.fire {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    font-size: 1rem;
    letter-spacing: 0.1em;
  }
</style>
