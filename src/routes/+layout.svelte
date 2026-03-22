<script>
  import '../app.css';
  import { onMount } from 'svelte';

  let { children } = $props();
  let hasError = $state(false);

  onMount(() => {
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.error);
      hasError = true;
    });
    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled rejection:', e.reason);
      hasError = true;
    });
  });
</script>

{#if hasError}
  <div style="
    position: fixed; inset: 0; background: #000;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; color: #ffd700; font-family: sans-serif;
    text-align: center; padding: 2rem;
  ">
    <h1 style="font-size: 2rem; margin-bottom: 1rem;">Bon Anniversaire Alexis !</h1>
    <p style="color: #4fc3f7; margin-bottom: 2rem;">De la part de Thibaud, Marie, Rénald, Aurélien, Fabienne, Antoine, Leo, Jordy, Juliette, Tarik et Anthony</p>
  </div>
{:else}
  {@render children()}
{/if}
