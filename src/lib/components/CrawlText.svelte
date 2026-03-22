<script lang="ts">
  import { onMount } from 'svelte';
  import { crawlText } from '$lib/data/config';

  let { onComplete }: { onComplete: () => void } = $props();

  let crawlEl: HTMLDivElement;

  onMount(() => {
    if (crawlEl) {
      crawlEl.addEventListener('animationend', () => {
        onComplete();
      }, { once: true });
    }
  });
</script>

<div class="crawl-container">
  <div class="crawl-perspective">
    <div class="crawl-content" bind:this={crawlEl}>
      {#each crawlText.split('\n') as line}
        {#if line.trim() === ''}
          <br/>
        {:else}
          <p>{line}</p>
        {/if}
      {/each}
    </div>
  </div>
</div>

<style>
  .crawl-container {
    position: absolute;
    inset: 0;
    z-index: 10;
    overflow: hidden;
    display: flex;
    justify-content: center;
  }

  .crawl-perspective {
    position: relative;
    width: 80%;
    max-width: 600px;
    height: 100%;
    perspective: 300px;
    overflow: hidden;
  }

  .crawl-content {
    position: absolute;
    top: 100%;
    width: 100%;
    text-align: center;
    transform-origin: 50% 100%;
    transform: rotateX(25deg);
    animation: crawl 35s linear forwards;
  }

  .crawl-content p {
    color: var(--sw-yellow);
    font-size: clamp(1rem, 3.5vw, 1.8rem);
    font-weight: bold;
    line-height: 1.8;
    margin: 0;
  }

  @keyframes crawl {
    from { top: 100%; }
    to { top: -300%; }
  }
</style>
