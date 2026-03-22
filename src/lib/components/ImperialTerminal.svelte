<script lang="ts">
  import { onDestroy } from 'svelte';
  import { password } from '$lib/data/config';
  import { playTerminalBeep, playTerminalGranted, playTerminalDenied } from '$lib/audio/audioManager';

  let { onComplete }: { onComplete: () => void } = $props();

  let inputValue = $state('');
  let status = $state<'idle' | 'denied' | 'granted'>('idle');
  let showCursor = $state(true);

  const cursorInterval = setInterval(() => showCursor = !showCursor, 530);
  onDestroy(() => clearInterval(cursorInterval));

  function handleSubmit() {
    if (inputValue.toLowerCase().trim() === password.toLowerCase().trim()) {
      status = 'granted';
      playTerminalGranted();
      setTimeout(onComplete, 2000);
    } else {
      status = 'denied';
      playTerminalDenied();
      setTimeout(() => {
        status = 'idle';
        inputValue = '';
      }, 1500);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit();
  }

  function handleInput() {
    playTerminalBeep();
  }
</script>

<div class="terminal" class:glitch={status === 'denied'}>
  <div class="scanlines"></div>

  <div class="terminal-content">
    <div class="header">
      <p class="imperial-logo">[ EMPIRE GALACTIQUE ]</p>
      <h2>TERMINAL IMPÉRIAL — ACCÈS RESTREINT</h2>
    </div>

    <div class="prompt-area">
      <p class="prompt-text">Identification requise.</p>
      <p class="prompt-text">Entrez votre code d'accès, Commandant.</p>

      <div class="input-line">
        <span class="prompt-symbol">&gt; </span>
        <input
          type="text"
          bind:value={inputValue}
          onkeydown={handleKeydown}
          oninput={handleInput}
          class="terminal-input"
          autofocus
          autocomplete="off"
          autocapitalize="off"
        />
        <span class="cursor" class:visible={showCursor}>█</span>
      </div>

      {#if status === 'denied'}
        <p class="status denied">ACCÈS REFUSÉ</p>
      {:else if status === 'granted'}
        <p class="status granted">ACCÈS AUTORISÉ</p>
        <p class="status granted sub">Bienvenue, Commandant.</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .terminal {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: var(--imperial-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Courier New', monospace;
  }

  .scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.15) 0px,
      rgba(0, 0, 0, 0.15) 1px,
      transparent 1px,
      transparent 3px
    );
    pointer-events: none;
    z-index: 1;
  }

  .terminal-content {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 2rem;
    max-width: 600px;
    width: 100%;
  }

  .imperial-logo {
    color: var(--imperial-amber);
    font-size: clamp(0.6rem, 2vw, 0.9rem);
    letter-spacing: 0.3em;
    margin-bottom: 0.5rem;
  }

  h2 {
    color: var(--imperial-amber);
    font-size: clamp(0.8rem, 3vw, 1.2rem);
    letter-spacing: 0.15em;
    margin-bottom: 3rem;
    text-shadow: 0 0 10px rgba(255, 143, 0, 0.5);
  }

  .prompt-text {
    color: var(--imperial-amber);
    font-size: clamp(0.8rem, 2.5vw, 1rem);
    margin-bottom: 0.5rem;
    opacity: 0.8;
  }

  .input-line {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2rem;
    font-size: clamp(1rem, 3vw, 1.5rem);
  }

  .prompt-symbol {
    color: var(--imperial-amber);
  }

  .terminal-input {
    background: transparent;
    border: none;
    color: var(--imperial-amber);
    font-family: 'Courier New', monospace;
    font-size: inherit;
    outline: none;
    width: auto;
    max-width: 200px;
    caret-color: transparent;
  }

  .cursor {
    color: var(--imperial-amber);
    opacity: 0;
  }

  .cursor.visible {
    opacity: 1;
  }

  .status {
    margin-top: 2rem;
    font-size: clamp(1rem, 3vw, 1.5rem);
    font-weight: bold;
    letter-spacing: 0.2em;
  }

  .denied {
    color: var(--sw-red);
    text-shadow: 0 0 20px rgba(255, 23, 68, 0.8);
  }

  .granted {
    color: var(--sw-green);
    text-shadow: 0 0 20px rgba(0, 230, 118, 0.8);
  }

  .granted.sub {
    font-size: clamp(0.7rem, 2vw, 1rem);
    font-weight: normal;
    margin-top: 0.5rem;
  }

  .glitch {
    animation: glitch 0.3s ease-in-out 3;
  }

  @keyframes glitch {
    0% { transform: translate(0); }
    25% { transform: translate(-5px, 3px); }
    50% { transform: translate(5px, -3px); }
    75% { transform: translate(-3px, -5px); }
    100% { transform: translate(0); }
  }
</style>
