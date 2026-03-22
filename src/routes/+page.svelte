<script lang="ts">
  import { currentStep } from '$lib/stores/gameState';
  import { fade } from 'svelte/transition';
  import Starfield from '$lib/components/Starfield.svelte';
  import ClickToStart from '$lib/components/ClickToStart.svelte';
  import ImperialTerminal from '$lib/components/ImperialTerminal.svelte';
  import TrenchRun from '$lib/components/TrenchRun.svelte';

  let transitioning = $state(false);

  function nextStep() {
    transitioning = true;
    setTimeout(() => {
      currentStep.update(s => s + 1);
      setTimeout(() => {
        transitioning = false;
      }, 100);
    }, 500);
  }
</script>

<Starfield />

<div class="overlay" class:fade-out={transitioning}></div>

<main>
  {#if $currentStep === 0}
    <div in:fade={{ duration: 500 }}>
      <ClickToStart onComplete={nextStep} />
    </div>
  {:else if $currentStep === 1}
    <div in:fade={{ duration: 500 }}>
      <ImperialTerminal onComplete={nextStep} />
    </div>
  {:else if $currentStep === 2}
    <div in:fade={{ duration: 500 }}>
      <TrenchRun onComplete={nextStep} />
    </div>
  {:else}
    <div in:fade={{ duration: 500 }}>
      <p style="color: white; text-align: center; margin-top: 40vh;">
        Step {$currentStep} — Coming soon
      </p>
    </div>
  {/if}
</main>

<style>
  main {
    width: 100vw;
    height: 100dvh;
    position: relative;
    overflow: hidden;
    z-index: 1;
  }

  .overlay {
    position: fixed;
    inset: 0;
    background: black;
    z-index: 100;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.5s ease;
  }

  .overlay.fade-out {
    opacity: 1;
  }
</style>
