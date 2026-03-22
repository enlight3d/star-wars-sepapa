<script lang="ts">
  import { onDestroy } from 'svelte';
  import { password } from '$lib/data/config';
  import { playTerminalBeep, playTerminalGranted, playTerminalDenied } from '$lib/audio/audioManager';
  import { Howl } from 'howler';
  import BlastDoor from './BlastDoor.svelte';

  let { onComplete }: { onComplete: () => void } = $props();

  let inputValue = $state('');
  let status = $state<'idle' | 'denied' | 'granted'>('idle');
  let showCursor = $state(true);
  let showDoor = $state(false);

  const cursorInterval = setInterval(() => showCursor = !showCursor, 530);
  onDestroy(() => clearInterval(cursorInterval));

  function handleSubmit() {
    if (inputValue.toLowerCase().trim() === password.toLowerCase().trim()) {
      status = 'granted';
      playTerminalGranted();
      // Show blast door after "ACCÈS AUTORISÉ" is shown
      setTimeout(() => {
        showDoor = true;
      }, 1500);
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

<div class="crt-frame">
  <div class="crt-bezel">
    <!-- Status LEDs -->
    <div class="led-row">
      <div class="led red"></div>
      <div class="led amber active"></div>
      <div class="led green" class:active={status === 'granted'}></div>
    </div>
    <span class="bezel-label">IMP-TERM-7742</span>
  </div>

  <div class="crt-screen">
    <div class="terminal" class:glitch={status === 'denied'}>
      <div class="scanlines"></div>
      <div class="crt-flicker"></div>

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

    {#if showDoor}
      <div class="pixelate-overlay"></div>
      <BlastDoor onComplete={onComplete} />
    {/if}
  </div>
</div>

<style>
  .crt-frame {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: #111;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: clamp(1rem, 4vw, 3rem);
  }

  .crt-bezel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 650px;
    padding: 0.5rem 1rem;
    background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%);
    border: 1px solid #333;
    border-bottom: none;
    border-radius: 8px 8px 0 0;
  }

  .led-row {
    display: flex;
    gap: 8px;
  }

  .led {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #222;
    border: 1px solid #444;
  }

  .led.red { background: #331111; }
  .led.amber { background: #332200; }
  .led.green { background: #113311; }
  .led.active.amber {
    background: var(--imperial-amber);
    box-shadow: 0 0 6px rgba(255, 143, 0, 0.6);
  }
  .led.active.green {
    background: var(--sw-green);
    box-shadow: 0 0 6px rgba(0, 230, 118, 0.6);
  }

  .bezel-label {
    color: #444;
    font-family: monospace;
    font-size: 0.6rem;
    letter-spacing: 0.15em;
  }

  .crt-screen {
    position: relative;
    width: 100%;
    max-width: 650px;
    height: 70vh;
    max-height: 500px;
    border: 3px solid #333;
    border-radius: 0 0 8px 8px;
    overflow: hidden;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.8), inset 0 0 60px rgba(0, 0, 0, 0.4);
  }

  .terminal {
    position: absolute;
    inset: 0;
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

  .crt-flicker {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    animation: crtFlicker 0.15s infinite;
    opacity: 0.03;
    background: rgba(255, 255, 255, 1);
  }

  @keyframes crtFlicker {
    0% { opacity: 0.03; }
    50% { opacity: 0; }
    100% { opacity: 0.03; }
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

  .pixelate-overlay {
    position: absolute;
    inset: 0;
    z-index: 14;
    background: var(--imperial-bg);
    animation: pixelateIn 0.6s steps(8) forwards;
  }

  @keyframes pixelateIn {
    0% { opacity: 0; backdrop-filter: blur(0px); }
    30% { opacity: 0.5; backdrop-filter: blur(4px); }
    60% { opacity: 0.8; backdrop-filter: blur(8px); }
    100% { opacity: 1; backdrop-filter: blur(0px); }
  }
</style>
