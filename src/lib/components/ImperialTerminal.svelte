<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { password } from '$lib/data/config';
  import { playTerminalBeep, playTerminalGranted, playTerminalDenied, playBootSound } from '$lib/audio/audioManager';
  import BlastDoor from './BlastDoor.svelte';

  let { onComplete }: { onComplete: () => void } = $props();

  let inputValue = $state('');
  let status = $state<'powering' | 'booting' | 'idle' | 'denied' | 'granted'>('powering');
  let showCursor = $state(true);
  let showDoor = $state(false);
  let showPixelate = $state(false);
  let bootLines = $state<string[]>([]);
  let bootDone = $state(false);

  const cursorInterval = setInterval(() => showCursor = !showCursor, 530);
  onDestroy(() => clearInterval(cursorInterval));

  const BOOT_SEQUENCE = [
    'IMPERIAL MILITARY NETWORK v4.7.2',
    'Copyright (c) Galactic Empire - All Rights Reserved',
    '',
    'Initializing secure connection.......... OK',
    'Loading encryption protocols............ OK',
    'Verifying station credentials........... OK',
    'Connecting to Death Star mainframe...... OK',
    'Synchronizing fleet database............ OK',
    '',
    'WARNING: CLASSIFIED TERMINAL - LEVEL 5 CLEARANCE REQUIRED',
    '',
  ];

  onMount(() => {
    // CRT power-on effect
    playBootSound();
    setTimeout(() => {
      status = 'booting';
    }, 1200);

    let i = 0;
    const bootInterval = setInterval(() => {
      if (status === 'powering') return;
      if (i < BOOT_SEQUENCE.length) {
        bootLines = [...bootLines, BOOT_SEQUENCE[i]];
        if (BOOT_SEQUENCE[i].length > 0) playTerminalBeep();
        i++;
      } else {
        clearInterval(bootInterval);
        bootDone = true;
        status = 'idle';
      }
    }, 180);

    return () => clearInterval(bootInterval);
  });

  function handleSubmit() {
    if (inputValue.toLowerCase().trim() === password.toLowerCase().trim()) {
      status = 'granted';
      playTerminalGranted();
      setTimeout(() => showPixelate = true, 1200);
      setTimeout(() => showDoor = true, 1800);
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

<div class="terminal-wrapper">
  {#if status === 'powering'}
    <div class="crt-powerup">
      <div class="powerup-line"></div>
    </div>
  {/if}

  <div class="crt-screen" class:powered={status !== 'powering'}>
    <div class="scanlines"></div>
    <div class="crt-glow"></div>

    <div class="dos-terminal">
      <!-- Header panel -->
      <div class="panel header-panel">
        <div class="header-text">█▀▀ IMPERIAL MILITARY TERMINAL ▀▀█</div>
        <div class="header-sub">Station: DS-1 / Sector 7-G / Auth Required</div>
      </div>

      <!-- Boot log panel -->
      <div class="panel log-panel">
        {#each bootLines as line}
          <div class="log-line" class:ok={line.includes('OK')} class:warning={line.includes('WARNING')} class:empty={line === ''}>{line || '\u00A0'}</div>
        {/each}
      </div>

      <!-- Input panel -->
      {#if bootDone}
        <div class="panel input-panel">
          <div class="prompt-label">IDENTIFICATION REQUISE</div>
          <div class="prompt-label dim">Entrez votre code d'accès, Commandant.</div>
          <div class="input-line">
            <span class="prompt-symbol">C:\EMPIRE&gt; </span>
            <input
              type="text"
              bind:value={inputValue}
              onkeydown={handleKeydown}
              oninput={handleInput}
              class="terminal-input"
              autofocus
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
            />
            <span class="cursor" class:visible={showCursor}>█</span>
          </div>

          {#if status === 'denied'}
            <div class="status-msg denied">██ ACCÈS REFUSÉ ██ Code invalide.</div>
          {:else if status === 'granted'}
            <div class="status-msg granted">██ ACCÈS AUTORISÉ ██</div>
            <div class="status-msg granted dim">Bienvenue, Commandant. Ouverture du sas...</div>
          {/if}
        </div>
      {/if}

      <!-- Status bar -->
      <div class="status-bar">
        <span>F1=Aide  F2=Diagnostics  F10=Déconnexion</span>
        <span class="status-right">
          {#if status === 'granted'}
            <span class="blink-green">● CONNECTÉ</span>
          {:else}
            <span class="blink-amber">● EN ATTENTE</span>
          {/if}
        </span>
      </div>
    </div>
  </div>

  {#if showPixelate}
    <div class="pixelate-overlay"></div>
  {/if}

  {#if showDoor}
    <div class="door-overlay">
      <BlastDoor onComplete={onComplete} />
    </div>
  {/if}
</div>

<style>
  .terminal-wrapper {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: #0a0a0a;
  }

  .crt-screen {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: #000800;
  }

  .scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.25) 0px,
      rgba(0, 0, 0, 0.25) 1px,
      transparent 1px,
      transparent 2px
    );
    pointer-events: none;
    z-index: 5;
  }

  .crt-glow {
    position: absolute;
    inset: 0;
    box-shadow: inset 0 0 120px rgba(255, 143, 0, 0.05);
    pointer-events: none;
    z-index: 4;
  }

  .dos-terminal {
    position: relative;
    z-index: 2;
    padding: clamp(0.8rem, 3vw, 2rem);
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 0;
    font-family: 'Courier New', 'Lucida Console', monospace;
    font-size: clamp(0.6rem, 1.4vw, 0.85rem);
    color: var(--imperial-amber);
    line-height: 1.5;
    overflow: hidden;
  }

  .panel {
    border: 1px solid #665500;
    padding: 0.5rem 0.8rem;
    margin-bottom: -1px; /* collapse borders */
  }

  .header-panel {
    text-align: center;
    background: rgba(255, 143, 0, 0.03);
  }

  .header-text {
    color: var(--imperial-amber);
    text-shadow: 0 0 8px rgba(255, 143, 0, 0.4);
  }

  .header-sub {
    color: #886600;
    font-size: 0.9em;
  }

  .log-panel {
    padding: 0.6rem 0.8rem;
  }

  .log-line {
    color: var(--imperial-amber);
    opacity: 0.7;
    animation: typeIn 0.05s ease;
  }

  .log-line.empty {
    height: 0.5em;
  }

  .log-line.ok {
    opacity: 1;
  }

  .log-line.warning {
    color: var(--sw-red);
    opacity: 1;
    text-shadow: 0 0 5px rgba(255, 23, 68, 0.5);
  }

  .input-panel {
    padding: 0.6rem 0.8rem;
    background: rgba(255, 143, 0, 0.02);
  }

  .prompt-label {
    color: var(--imperial-amber);
    text-shadow: 0 0 6px rgba(255, 143, 0, 0.3);
  }

  .prompt-label.dim, .status-msg.dim {
    opacity: 0.6;
  }

  .input-line {
    display: flex;
    align-items: center;
  }

  .prompt-symbol {
    color: var(--imperial-amber);
    opacity: 0.8;
  }

  .terminal-input {
    background: transparent;
    border: none;
    color: var(--imperial-amber);
    font-family: 'Courier New', 'Lucida Console', monospace;
    font-size: inherit;
    outline: none;
    width: 150px;
    caret-color: transparent;
    text-shadow: 0 0 4px rgba(255, 143, 0, 0.4);
  }

  .cursor {
    color: var(--imperial-amber);
    opacity: 0;
  }
  .cursor.visible { opacity: 1; }

  .status-msg {
    font-weight: bold;
  }

  .status-msg.denied {
    color: var(--sw-red);
    text-shadow: 0 0 10px rgba(255, 23, 68, 0.6);
    animation: glitchText 0.1s ease 3;
  }

  .status-msg.granted {
    color: var(--sw-green);
    text-shadow: 0 0 10px rgba(0, 230, 118, 0.6);
  }

  .border-bottom {
    margin-top: auto;
  }

  .status-bar {
    display: flex;
    justify-content: space-between;
    color: #554400;
    font-size: 0.85em;
    margin-top: 0.3rem;
    padding: 0 0.3rem;
  }

  .blink-amber {
    color: var(--imperial-amber);
    animation: blink 1s ease-in-out infinite;
  }

  .blink-green {
    color: var(--sw-green);
    animation: blink 1s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  @keyframes typeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes glitchText {
    0% { transform: translate(0); }
    25% { transform: translate(-2px, 1px); }
    50% { transform: translate(2px, -1px); }
    75% { transform: translate(-1px, -2px); }
    100% { transform: translate(0); }
  }

  .door-overlay {
    position: absolute;
    inset: 0;
    z-index: 20;
  }

  /* CRT power-up effect */
  .crt-powerup {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .powerup-line {
    width: 100%;
    height: 2px;
    background: var(--imperial-amber);
    box-shadow: 0 0 20px var(--imperial-amber), 0 0 60px var(--imperial-amber);
    animation: powerUp 1s ease-out forwards;
  }

  @keyframes powerUp {
    0% { width: 0; height: 2px; opacity: 1; }
    40% { width: 60%; height: 2px; opacity: 1; }
    70% { width: 100%; height: 2px; opacity: 1; }
    100% { width: 100%; height: 100vh; opacity: 1; }
  }

  .crt-screen {
    opacity: 0;
  }

  .crt-screen.powered {
    opacity: 1;
    animation: crtOn 0.3s ease-out;
  }

  @keyframes crtOn {
    0% { opacity: 0; filter: brightness(3); }
    50% { opacity: 1; filter: brightness(1.5); }
    100% { opacity: 1; filter: brightness(1); }
  }

  /* Pixelate transition */
  .pixelate-overlay {
    position: absolute;
    inset: 0;
    z-index: 15;
    background: #000800;
    animation: pixelateIn 0.6s steps(6) forwards;
  }

  @keyframes pixelateIn {
    0% { opacity: 0; }
    20% { opacity: 0.3; }
    40% { opacity: 0.5; }
    60% { opacity: 0.7; }
    80% { opacity: 0.9; }
    100% { opacity: 1; }
  }
</style>
