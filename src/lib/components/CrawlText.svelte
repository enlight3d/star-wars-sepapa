<script lang="ts">
  import { onMount } from 'svelte';
  import { crawlText } from '$lib/data/config';

  let { onComplete }: { onComplete: () => void } = $props();

  let crawlEl: HTMLDivElement;

  onMount(() => {
    if (crawlEl) {
      const timer = setTimeout(onComplete, 27000);
      return () => clearTimeout(timer);
    }
  });
</script>

<div class="crawl-container">
  <div class="fade-top"></div>
  <div class="crawl-viewport">
    <div class="crawl-content" bind:this={crawlEl}>
      {#each crawlText.split('\n') as line}
        {#if line.trim() === ''}
          <div class="spacer"></div>
        {:else}
          <p>{line}</p>
        {/if}
      {/each}
    </div>
  </div>
  <div class="fade-bottom"></div>
</div>

<style>
  .crawl-container {
    position: absolute;
    inset: 0;
    z-index: 10;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    perspective: 350px;
    perspective-origin: 50% 40%;
  }

  .crawl-viewport {
    position: absolute;
    bottom: 0;
    width: 80%;
    max-width: 550px;
    height: 100%;
    overflow: hidden;
    transform: rotateX(25deg);
    transform-origin: 50% 100%;
  }

  .crawl-content {
    position: absolute;
    width: 100%;
    text-align: justify;
    text-align-last: center;
    animation: crawl 45s linear forwards;
  }

  .crawl-content p {
    color: var(--sw-yellow);
    font-size: clamp(1.1rem, 3.5vw, 2rem);
    font-weight: bold;
    line-height: 1.7;
    margin: 0;
    padding: 0 1rem;
  }

  .spacer {
    height: 1.5em;
  }

  /* Fade edges for that cinematic disappearance */
  .fade-top {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 25%;
    background: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%);
    z-index: 2;
    pointer-events: none;
  }

  .fade-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 10%;
    background: linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%);
    z-index: 2;
    pointer-events: none;
  }

  @keyframes crawl {
    0% { transform: translateY(100vh); }
    100% { transform: translateY(-200%); }
  }
</style>
