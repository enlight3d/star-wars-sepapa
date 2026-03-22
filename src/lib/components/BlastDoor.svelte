<script lang="ts">
  import { onMount } from 'svelte';
  import { playBlastDoorSound } from '$lib/audio/audioManager';

  let { onComplete }: { onComplete: () => void } = $props();

  let phase = $state<'closed' | 'unlocking' | 'opening' | 'open'>('closed');

  onMount(() => {
    setTimeout(() => {
      phase = 'unlocking';
    }, 300);

    setTimeout(() => {
      phase = 'opening';
      playBlastDoorSound();
    }, 900);

    setTimeout(() => {
      phase = 'open';
    }, 2500);

    setTimeout(onComplete, 2800);
  });
</script>

<div class="blast-door">
  <!-- Left panel -->
  <div class="panel left" class:opening={phase === 'opening' || phase === 'open'}>
    <div class="panel-surface">
      <div class="panel-groove"></div>
      <div class="panel-groove"></div>
      <div class="panel-groove"></div>
      <div class="panel-groove"></div>
      <div class="panel-groove"></div>
    </div>
    <div class="panel-edge"></div>
    <!-- Hydraulic pistons -->
    <div class="piston top"></div>
    <div class="piston bottom"></div>
  </div>

  <!-- Right panel -->
  <div class="panel right" class:opening={phase === 'opening' || phase === 'open'}>
    <div class="panel-surface">
      <div class="panel-groove"></div>
      <div class="panel-groove"></div>
      <div class="panel-groove"></div>
      <div class="panel-groove"></div>
      <div class="panel-groove"></div>
    </div>
    <div class="panel-edge"></div>
    <div class="piston top"></div>
    <div class="piston bottom"></div>
  </div>

  <!-- Center seam glow -->
  <div class="seam" class:unlocking={phase === 'unlocking'} class:opening={phase === 'opening' || phase === 'open'}></div>

  <!-- Warning chevrons top and bottom -->
  <div class="chevron-strip top" class:active={phase !== 'closed'}></div>
  <div class="chevron-strip bottom" class:active={phase !== 'closed'}></div>

  <!-- Frame edges -->
  <div class="frame-edge top-edge"></div>
  <div class="frame-edge bottom-edge"></div>
</div>

<style>
  .blast-door {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: #0a0a0a;
  }

  .panel {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 50%;
    background: linear-gradient(90deg, #1a1a1e 0%, #252528 30%, #1e1e22 60%, #222226 100%);
    transition: transform 1.6s cubic-bezier(0.15, 0.6, 0.35, 1);
    box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.5);
  }

  .panel.left { left: 0; }
  .panel.right { right: 0; }
  .panel.left.opening { transform: translateX(-100%); }
  .panel.right.opening { transform: translateX(100%); }

  .panel-surface {
    position: absolute;
    top: 8%;
    bottom: 8%;
    left: 10%;
    right: 10%;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
  }

  .panel-groove {
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, #333 10%, #3a3a3a 50%, #333 90%, transparent 100%);
    border-radius: 1px;
    box-shadow: 0 1px 0 rgba(0,0,0,0.5), 0 -1px 0 rgba(255,255,255,0.03);
  }

  .panel-edge {
    position: absolute;
    top: 5%;
    bottom: 5%;
    width: 6px;
    background: linear-gradient(180deg, #444 0%, #555 20%, #444 50%, #555 80%, #444 100%);
    border-radius: 1px;
    box-shadow: 0 0 8px rgba(0,0,0,0.5);
  }

  .panel.left .panel-edge { right: 3px; }
  .panel.right .panel-edge { left: 3px; }

  .piston {
    position: absolute;
    width: 8px;
    height: 40px;
    background: linear-gradient(90deg, #555, #666, #555);
    border-radius: 2px;
    box-shadow: 0 0 4px rgba(0,0,0,0.8);
  }

  .panel.left .piston { right: 12px; }
  .panel.right .piston { left: 12px; }
  .piston.top { top: 20%; }
  .piston.bottom { bottom: 20%; }

  .seam {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 3px;
    transform: translateX(-50%);
    background: #222;
    z-index: 5;
    transition: all 0.5s ease;
  }

  .seam.unlocking {
    background: var(--imperial-amber);
    width: 4px;
    box-shadow: 0 0 20px rgba(255, 143, 0, 0.8), 0 0 60px rgba(255, 143, 0, 0.3);
  }

  .seam.opening {
    background: rgba(79, 195, 247, 0.6);
    width: 100%;
    box-shadow: 0 0 100px rgba(79, 195, 247, 0.3);
    opacity: 0;
    transition: width 1.2s ease-out, opacity 1.5s ease-out;
  }

  .chevron-strip {
    position: absolute;
    left: 0;
    right: 0;
    height: 6px;
    z-index: 6;
    background: repeating-linear-gradient(
      90deg,
      #332200 0px,
      #332200 10px,
      #221100 10px,
      #221100 20px
    );
    opacity: 0.5;
  }

  .chevron-strip.top { top: 0; }
  .chevron-strip.bottom { bottom: 0; }

  .chevron-strip.active {
    background: repeating-linear-gradient(
      90deg,
      var(--imperial-amber) 0px,
      var(--imperial-amber) 10px,
      #332200 10px,
      #332200 20px
    );
    opacity: 1;
    animation: chevronScroll 0.5s linear infinite;
  }

  @keyframes chevronScroll {
    from { background-position: 0 0; }
    to { background-position: 20px 0; }
  }

  .frame-edge {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: #444;
    z-index: 7;
  }

  .frame-edge.top-edge { top: 6px; }
  .frame-edge.bottom-edge { bottom: 6px; }
</style>
