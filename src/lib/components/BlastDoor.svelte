<script lang="ts">
  import { onMount } from 'svelte';
  import { Howl } from 'howler';

  let { onComplete }: { onComplete: () => void } = $props();

  let phase = $state<'closed' | 'unlocking' | 'opening' | 'open'>('closed');

  onMount(() => {
    const doorSound = new Howl({
      src: ['/audio/blast-door.mp3'],
      volume: 0.8,
    });

    // Brief pause showing locked door, then unlock sequence
    setTimeout(() => {
      phase = 'unlocking';
    }, 500);

    setTimeout(() => {
      phase = 'opening';
      doorSound.play();
    }, 1200);

    setTimeout(() => {
      phase = 'open';
    }, 2800);

    setTimeout(onComplete, 3200);
  });
</script>

<div class="blast-door-overlay">
  <!-- Door panels -->
  <div class="door-panel left" class:unlocking={phase === 'unlocking'} class:opening={phase === 'opening'} class:open={phase === 'open'}>
    <!-- Surface detail -->
    <div class="panel-detail">
      <div class="ridge"></div>
      <div class="ridge"></div>
      <div class="ridge"></div>
    </div>
    <div class="panel-edge"></div>
  </div>

  <div class="door-panel right" class:unlocking={phase === 'unlocking'} class:opening={phase === 'opening'} class:open={phase === 'open'}>
    <div class="panel-detail">
      <div class="ridge"></div>
      <div class="ridge"></div>
      <div class="ridge"></div>
    </div>
    <div class="panel-edge"></div>
  </div>

  <!-- Center seam with light -->
  <div class="center-seam" class:unlocking={phase === 'unlocking'} class:opening={phase === 'opening'}></div>

  <!-- Warning indicators -->
  <div class="warning-strip top" class:active={phase === 'unlocking' || phase === 'opening'}></div>
  <div class="warning-strip bottom" class:active={phase === 'unlocking' || phase === 'opening'}></div>
</div>

<style>
  .blast-door-overlay {
    position: absolute;
    inset: 0;
    z-index: 15;
    overflow: hidden;
  }

  .door-panel {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 50%;
    background: linear-gradient(180deg, #1e1e1e 0%, #2a2a2a 20%, #252525 50%, #2a2a2a 80%, #1e1e1e 100%);
    transition: transform 1.4s cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  .door-panel.left {
    left: 0;
    border-right: 2px solid #444;
  }

  .door-panel.right {
    right: 0;
    border-left: 2px solid #444;
  }

  .door-panel.left.opening, .door-panel.left.open {
    transform: translateX(-100%);
  }

  .door-panel.right.opening, .door-panel.right.open {
    transform: translateX(100%);
  }

  .panel-detail {
    position: absolute;
    top: 15%;
    bottom: 15%;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    padding: 0 15%;
    width: 100%;
  }

  .ridge {
    height: 3px;
    background: linear-gradient(90deg, transparent 0%, #383838 20%, #444 50%, #383838 80%, transparent 100%);
    border-radius: 2px;
  }

  .panel-edge {
    position: absolute;
    top: 10%;
    bottom: 10%;
    width: 4px;
    background: #555;
    border-radius: 2px;
  }

  .door-panel.left .panel-edge { right: 8px; }
  .door-panel.right .panel-edge { left: 8px; }

  .center-seam {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 2px;
    transform: translateX(-50%);
    background: #333;
    z-index: 16;
    transition: opacity 0.3s ease;
  }

  .center-seam.unlocking {
    background: var(--imperial-amber);
    box-shadow: 0 0 15px rgba(255, 143, 0, 0.6);
  }

  .center-seam.opening {
    opacity: 0;
  }

  .warning-strip {
    position: absolute;
    left: 0;
    right: 0;
    height: 3px;
    background: #222;
    z-index: 17;
  }

  .warning-strip.top { top: 0; }
  .warning-strip.bottom { bottom: 0; }

  .warning-strip.active {
    background: var(--imperial-amber);
    box-shadow: 0 0 10px rgba(255, 143, 0, 0.5);
    animation: stripPulse 0.4s ease-in-out infinite alternate;
  }

  @keyframes stripPulse {
    from { opacity: 0.5; }
    to { opacity: 1; }
  }
</style>
