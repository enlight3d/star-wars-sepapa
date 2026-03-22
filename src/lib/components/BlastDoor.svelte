<script lang="ts">
  import { onMount } from 'svelte';
  import { getAudioContext } from '$lib/audio/audioManager';

  let { onComplete }: { onComplete: () => void } = $props();

  let phase = $state<'closed' | 'opening' | 'open'>('closed');

  function playDoorSound() {
    const ctx = getAudioContext();
    const t = ctx.currentTime;

    // Hydraulic hiss
    const noiseLen = 1.5;
    const bufferSize = ctx.sampleRate * noiseLen;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2000, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(500, t + 1.2);
    noiseFilter.Q.value = 2;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.setValueAtTime(0.15, t);
    noiseGain.gain.linearRampToValueAtTime(0.08, t + 0.3);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    noise.start(t);
    noise.stop(t + 1.5);

    // Heavy metallic clunk at start
    const clunk = ctx.createOscillator();
    const clunkGain = ctx.createGain();
    clunk.connect(clunkGain);
    clunkGain.connect(ctx.destination);
    clunk.type = 'sawtooth';
    clunk.frequency.setValueAtTime(80, t);
    clunk.frequency.exponentialRampToValueAtTime(30, t + 0.2);
    clunkGain.gain.setValueAtTime(0.2, t);
    clunkGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    clunk.start(t);
    clunk.stop(t + 0.25);

    // Mechanical grinding
    const grind = ctx.createOscillator();
    const grindGain = ctx.createGain();
    grind.connect(grindGain);
    grindGain.connect(ctx.destination);
    grind.type = 'square';
    grind.frequency.setValueAtTime(60, t + 0.1);
    grind.frequency.linearRampToValueAtTime(40, t + 1.2);
    grindGain.gain.setValueAtTime(0, t);
    grindGain.gain.linearRampToValueAtTime(0.06, t + 0.15);
    grindGain.gain.setValueAtTime(0.06, t + 0.8);
    grindGain.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
    grind.start(t + 0.1);
    grind.stop(t + 1.3);

    // Final slam/lock
    const slam = ctx.createOscillator();
    const slamGain = ctx.createGain();
    slam.connect(slamGain);
    slamGain.connect(ctx.destination);
    slam.type = 'sawtooth';
    slam.frequency.value = 50;
    slamGain.gain.setValueAtTime(0, t + 1.2);
    slamGain.gain.linearRampToValueAtTime(0.15, t + 1.22);
    slamGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    slam.start(t + 1.2);
    slam.stop(t + 1.5);
  }

  onMount(() => {
    // Brief pause, then open
    setTimeout(() => {
      phase = 'opening';
      playDoorSound();
    }, 800);

    setTimeout(() => {
      phase = 'open';
    }, 2200);

    setTimeout(onComplete, 2800);
  });
</script>

<div class="blast-door-scene">
  <!-- Imperial corridor walls -->
  <div class="corridor">
    <div class="wall-left"></div>
    <div class="wall-right"></div>
    <div class="ceiling"></div>
    <div class="floor"></div>
  </div>

  <!-- The blast door -->
  <div class="door-frame">
    <!-- Warning lights -->
    <div class="warning-light left" class:active={phase === 'opening'}></div>
    <div class="warning-light right" class:active={phase === 'opening'}></div>

    <!-- Door panels -->
    <div class="door-panel top" class:opening={phase === 'opening'} class:open={phase === 'open'}></div>
    <div class="door-panel bottom" class:opening={phase === 'opening'} class:open={phase === 'open'}></div>

    <!-- Center seam -->
    {#if phase === 'closed'}
      <div class="door-seam"></div>
    {/if}

    <!-- Light shining through when opening -->
    {#if phase === 'opening' || phase === 'open'}
      <div class="door-light" class:open={phase === 'open'}></div>
    {/if}
  </div>

  <!-- Status text -->
  <div class="status-text">
    {#if phase === 'closed'}
      <p>SÉCURISATION DU PÉRIMÈTRE...</p>
    {:else if phase === 'opening'}
      <p>OUVERTURE DU SAS</p>
    {/if}
  </div>
</div>

<style>
  .blast-door-scene {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: #0a0a0a;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .corridor {
    position: absolute;
    inset: 0;
  }

  .wall-left, .wall-right {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 15%;
    background: linear-gradient(180deg, #1a1a1a 0%, #111 50%, #1a1a1a 100%);
  }
  .wall-left { left: 0; border-right: 2px solid #333; }
  .wall-right { right: 0; border-left: 2px solid #333; }

  .ceiling {
    position: absolute;
    top: 0;
    left: 15%;
    right: 15%;
    height: 8%;
    background: linear-gradient(180deg, #222 0%, #111 100%);
    border-bottom: 2px solid #333;
  }

  .floor {
    position: absolute;
    bottom: 0;
    left: 15%;
    right: 15%;
    height: 8%;
    background: linear-gradient(0deg, #222 0%, #111 100%);
    border-top: 2px solid #333;
  }

  .door-frame {
    position: relative;
    width: 50%;
    max-width: 400px;
    height: 70%;
    max-height: 500px;
    border: 3px solid #444;
    border-radius: 8px;
    overflow: hidden;
    background: #0a0a0a;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(0, 0, 0, 0.5);
  }

  .door-panel {
    position: absolute;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(90deg, #2a2a2a 0%, #333 20%, #2a2a2a 40%, #333 60%, #2a2a2a 80%, #333 100%);
    transition: transform 1.2s cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  .door-panel.top {
    top: 0;
    border-bottom: 1px solid #555;
    background: linear-gradient(180deg, #333 0%, #2a2a2a 30%, #252525 70%, #222 100%);
  }
  .door-panel.top::after {
    content: '';
    position: absolute;
    bottom: 10px;
    left: 20%;
    right: 20%;
    height: 3px;
    background: #444;
    border-radius: 2px;
  }

  .door-panel.bottom {
    bottom: 0;
    border-top: 1px solid #555;
    background: linear-gradient(0deg, #333 0%, #2a2a2a 30%, #252525 70%, #222 100%);
  }
  .door-panel.bottom::after {
    content: '';
    position: absolute;
    top: 10px;
    left: 20%;
    right: 20%;
    height: 3px;
    background: #444;
    border-radius: 2px;
  }

  .door-panel.top.opening { transform: translateY(-95%); }
  .door-panel.bottom.opening { transform: translateY(95%); }
  .door-panel.top.open { transform: translateY(-100%); }
  .door-panel.bottom.open { transform: translateY(100%); }

  .door-seam {
    position: absolute;
    top: 50%;
    left: 10%;
    right: 10%;
    height: 2px;
    background: #555;
    transform: translateY(-50%);
    box-shadow: 0 0 5px rgba(255, 143, 0, 0.3);
  }

  .door-light {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, rgba(79, 195, 247, 0.15) 0%, transparent 70%);
    opacity: 0;
    animation: lightReveal 1.2s ease-out forwards;
  }
  .door-light.open {
    background: radial-gradient(ellipse at center, rgba(79, 195, 247, 0.3) 0%, transparent 70%);
  }

  @keyframes lightReveal {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .warning-light {
    position: absolute;
    top: -3px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #333;
    z-index: 5;
    border: 2px solid #555;
  }
  .warning-light.left { left: 10px; }
  .warning-light.right { right: 10px; }
  .warning-light.active {
    background: #ff8f00;
    box-shadow: 0 0 15px rgba(255, 143, 0, 0.8);
    animation: blink 0.5s ease-in-out infinite alternate;
  }

  @keyframes blink {
    from { opacity: 0.4; }
    to { opacity: 1; }
  }

  .status-text {
    position: absolute;
    bottom: 12%;
    left: 0;
    right: 0;
    text-align: center;
  }

  .status-text p {
    color: var(--imperial-amber);
    font-family: monospace;
    font-size: clamp(0.7rem, 2vw, 1rem);
    letter-spacing: 0.2em;
    opacity: 0.8;
  }
</style>
