<script lang="ts">
  import { currentStep } from '$lib/stores/gameState';
  import { fade } from 'svelte/transition';
  import Starfield from '$lib/components/Starfield.svelte';
  import ClickToStart from '$lib/components/ClickToStart.svelte';
  import ImperialTerminal from '$lib/components/ImperialTerminal.svelte';
  import TrenchRun from '$lib/components/TrenchRun.svelte';
  import FarAway from '$lib/components/FarAway.svelte';
  import LogoReveal from '$lib/components/LogoReveal.svelte';
  import CrawlText from '$lib/components/CrawlText.svelte';
  import VenatorBuild from '$lib/components/VenatorBuild.svelte';
  import FinalMessage from '$lib/components/FinalMessage.svelte';

  let transitioning = $state(false);

  function nextStep() {
    transitioning = true;
    setTimeout(() => {
      currentStep.update(s => s + 1);
      setTimeout(() => {
        transitioning = false;
      }, 50);
    }, 250);
  }
</script>

<Starfield />

<div class="overlay" class:fade-out={transitioning}></div>

<main>
  {#if $currentStep === 0}
    <div in:fade={{ duration: 300 }}>
      <ClickToStart onComplete={nextStep} />
    </div>
  {:else if $currentStep === 1}
    <div in:fade={{ duration: 200 }}>
      <ImperialTerminal onComplete={() => currentStep.set(6)} />
    </div>
  {:else if $currentStep === 2}
    <div in:fade={{ duration: 200 }}>
      <TrenchRun onComplete={nextStep} />
    </div>
  {:else if $currentStep === 3}
    <div in:fade={{ duration: 300 }}>
      <FarAway onComplete={nextStep} />
    </div>
  {:else if $currentStep === 4}
    <div in:fade={{ duration: 300 }}>
      <LogoReveal onComplete={nextStep} />
    </div>
  {:else if $currentStep === 5}
    <div in:fade={{ duration: 300 }}>
      <CrawlText onComplete={nextStep} />
    </div>
  {:else if $currentStep === 6}
    <div in:fade={{ duration: 500 }}>
      <VenatorBuild onComplete={nextStep} />
    </div>
  {:else if $currentStep === 7}
    <div in:fade={{ duration: 1000 }}>
      <FinalMessage />
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
    transition: opacity 0.25s ease;
  }

  .overlay.fade-out {
    opacity: 1;
  }
</style>
