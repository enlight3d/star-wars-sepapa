<script lang="ts">
  import { onMount } from 'svelte';

  let { onComplete }: { onComplete: () => void } = $props();

  let visible = $state(false);

  onMount(() => {
    setTimeout(() => visible = true, 300);
    setTimeout(() => visible = false, 3500);
    setTimeout(onComplete, 4500);
  });
</script>

<div class="far-away">
  <p class="text" class:visible>
    Il y a longtemps, dans un bureau<br/>pas si lointain....
  </p>
</div>

<style>
  .far-away {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .text {
    color: var(--sw-blue);
    font-family: 'Franklin Gothic Medium', 'Trebuchet MS', sans-serif;
    font-size: clamp(1.2rem, 4vw, 2.5rem);
    text-align: center;
    line-height: 1.6;
    opacity: 0;
    transition: opacity 1s ease;
  }

  .text.visible {
    opacity: 1;
  }
</style>
