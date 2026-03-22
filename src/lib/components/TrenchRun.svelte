<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKeyboardControls, createTouchControls } from '$lib/game/controls';
  import { createTrenchRun } from '$lib/game/trenchRun';

  let { onComplete }: { onComplete: () => void } = $props();

  let canvas: HTMLCanvasElement;
  let upBtn: HTMLButtonElement;
  let downBtn: HTMLButtonElement;
  let leftBtn: HTMLButtonElement;
  let rightBtn: HTMLButtonElement;
  let fireBtn: HTMLButtonElement;

  let destroyGame: (() => void) | null = null;
  let destroyKeyboard: (() => void) | null = null;
  let destroyTouch: (() => void) | null = null;
  let isMobile = $state(false);

  onMount(() => {
    isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Size canvas to fill available space
    const maxW = Math.min(window.innerWidth, 800);
    const maxH = isMobile
      ? window.innerHeight * 0.55 // leave room for touch controls
      : Math.min(window.innerHeight * 0.75, 600);
    canvas.width = maxW;
    canvas.height = maxH;

    const { controls: kbControls, destroy: kbDestroy } = createKeyboardControls();
    destroyKeyboard = kbDestroy;

    if (isMobile && upBtn && downBtn && leftBtn && rightBtn && fireBtn) {
      const { controls: touchControls, destroy: tDestroy } = createTouchControls(
        upBtn, downBtn, leftBtn, rightBtn, fireBtn
      );
      destroyTouch = tDestroy;
      // Merge touch + keyboard controls
      const merged = new Proxy(kbControls, {
        get(_target, prop: string) {
          if (prop in kbControls) {
            return kbControls[prop as keyof typeof kbControls] || touchControls[prop as keyof typeof touchControls];
          }
          return undefined;
        }
      });
      const game = createTrenchRun(canvas, merged as typeof kbControls, onComplete);
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
    <p class="title">TRENCH RUN</p>
    <p class="subtitle">Élimine les TIE Fighters et les tourelles !</p>
    {#if !isMobile}
      <p class="controls-hint">WASD / Flèches : Déplacer &middot; ESPACE : Tirer</p>
    {/if}
  </div>

  <canvas bind:this={canvas} class="game-canvas"></canvas>

  <!-- Touch controls: d-pad left, fire right. Always rendered for bind:this -->
  <div class="touch-controls" class:hidden={!isMobile}>
    <div class="dpad">
      <div class="dpad-row">
        <button bind:this={upBtn} class="touch-btn dpad-btn up" aria-label="Haut">&#9650;</button>
      </div>
      <div class="dpad-row middle">
        <button bind:this={leftBtn} class="touch-btn dpad-btn left" aria-label="Gauche">&#9664;</button>
        <div class="dpad-center"></div>
        <button bind:this={rightBtn} class="touch-btn dpad-btn right" aria-label="Droite">&#9654;</button>
      </div>
      <div class="dpad-row">
        <button bind:this={downBtn} class="touch-btn dpad-btn down" aria-label="Bas">&#9660;</button>
      </div>
    </div>

    <button bind:this={fireBtn} class="touch-btn fire" aria-label="Tirer">
      FEU
    </button>
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
    overflow: hidden;
  }

  .game-header {
    color: #ffd700;
    text-align: center;
    margin-bottom: 0.5rem;
    font-family: monospace;
  }

  .game-header .title {
    font-size: clamp(0.9rem, 2.5vw, 1.2rem);
    font-weight: bold;
    letter-spacing: 0.15em;
    margin: 0;
  }

  .game-header .subtitle {
    font-size: clamp(0.6rem, 1.8vw, 0.85rem);
    color: #aaa;
    margin: 0.2rem 0 0;
  }

  .controls-hint {
    color: #4fc3f7;
    font-size: clamp(0.55rem, 1.4vw, 0.75rem);
    margin-top: 0.2rem;
  }

  .game-canvas {
    border: 1px solid #222;
    touch-action: none;
    max-width: 100%;
    display: block;
  }

  .touch-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 500px;
    padding: 0.8rem 1.5rem;
    margin-top: 0.5rem;
    user-select: none;
    -webkit-user-select: none;
  }

  .touch-controls.hidden {
    display: none;
  }

  /* ── D-Pad ─────────────────────────────────────────────── */
  .dpad {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .dpad-row {
    display: flex;
    justify-content: center;
  }

  .dpad-row.middle {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .dpad-center {
    width: 50px;
    height: 50px;
    background: rgba(255, 215, 0, 0.05);
    border-radius: 4px;
  }

  .touch-btn {
    background: rgba(255, 215, 0, 0.12);
    border: 2px solid rgba(255, 215, 0, 0.6);
    color: #ffd700;
    font-family: monospace;
    font-weight: bold;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .touch-btn:active {
    background: rgba(255, 215, 0, 0.3);
  }

  .dpad-btn {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .touch-btn.fire {
    width: 85px;
    height: 85px;
    border-radius: 50%;
    font-size: 1rem;
    letter-spacing: 0.15em;
    border-color: rgba(255, 68, 68, 0.7);
    color: #ff4444;
    background: rgba(255, 68, 68, 0.12);
  }

  .touch-btn.fire:active {
    background: rgba(255, 68, 68, 0.35);
  }
</style>
