# Birthday Card "The Full Saga" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive, cinematic Star Wars + Lego themed birthday card webapp for Alexis with 8 sequential steps including an enigma, a mini-game, a Star Wars crawl, and a 3D Lego Venator construction scene.

**Architecture:** SvelteKit single-page app with static adapter. A central `gameState` store drives step transitions. Each step is a standalone Svelte component receiving an `onComplete` callback. The 3D Venator scene uses raw Three.js with LDrawLoader. The trench run mini-game uses Canvas 2D.

**Tech Stack:** SvelteKit, Three.js (LDrawLoader), Howler.js, HTML Canvas 2D, CSS animations, Vercel (static deploy)

**Spec:** `docs/superpowers/specs/2026-03-22-birthday-card-design.md`

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/routes/+page.svelte` | Main orchestrator — renders current step, handles transitions |
| `src/routes/+layout.svelte` | Global styles, viewport setup, error boundary |
| `src/lib/stores/gameState.ts` | Writable stores: currentStep, modelLoaded, audioEnabled |
| `src/lib/data/config.ts` | Contributors list, password, crawl text — all static data |
| `src/lib/components/Starfield.svelte` | Animated CSS starfield background (reused) |
| `src/lib/components/ClickToStart.svelte` | Step 1 — black screen, click to begin |
| `src/lib/components/ImperialTerminal.svelte` | Step 2 — terminal enigma UI |
| `src/lib/components/TrenchRun.svelte` | Step 3 — canvas game wrapper + touch controls |
| `src/lib/game/trenchRun.ts` | Game loop, spawning, collision, scoring |
| `src/lib/game/sprites.ts` | Pixel art drawing functions (X-Wing, TIE, walls, lasers) |
| `src/lib/game/controls.ts` | Keyboard + touch input abstraction |
| `src/lib/components/FarAway.svelte` | Step 4 — "Il y a longtemps..." |
| `src/lib/components/LogoReveal.svelte` | Step 5 — title zoom-out |
| `src/lib/components/CrawlText.svelte` | Step 6 — perspective crawl |
| `src/lib/components/VenatorBuild.svelte` | Step 7 — 3D construction scene |
| `src/lib/three/venatorLoader.ts` | LDraw model loading, geometry merging, group splitting |
| `src/lib/three/particles.ts` | Confetti / golden particle system |
| `src/lib/components/FinalMessage.svelte` | Step 8 — hologram + names + confetti |
| `src/lib/audio/audioManager.ts` | Howler.js wrapper, preloading, play/stop |
| `src/app.html` | HTML shell with viewport meta, fonts |
| `src/app.css` | Global styles: reset, 100dvh, Star Wars fonts, shared animations |
| `static/fonts/StarJedi.woff2` | Star Wars title font |
| `static/models/venator.mpd` | Packed LDraw Venator model |

---

## Task 1: Project Scaffolding & Global Setup

**Files:**
- Create: `package.json`, `svelte.config.js`, `tsconfig.json`, `vite.config.ts`
- Create: `src/app.html`, `src/app.css`
- Create: `src/routes/+layout.svelte`, `src/routes/+page.svelte`
- Create: `src/lib/stores/gameState.ts`
- Create: `src/lib/data/config.ts`
- Create: `static/fonts/` (download Star Jedi font)
- Create: `.gitignore`

- [ ] **Step 1: Scaffold SvelteKit project**

```bash
cd /Users/thibaud.mathieu/GitRepos/sepapa
npm create svelte@latest . -- --template skeleton --types typescript
```

Select: Skeleton project, TypeScript, no additional options.

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install three @types/three howler @types/howler
npm install -D @sveltejs/adapter-static
```

- [ ] **Step 3: Configure static adapter**

Update `svelte.config.js`:

```javascript
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html'
    })
  },
  preprocess: vitePreprocess()
};
```

- [ ] **Step 4: Download Star Jedi font**

Download the Star Jedi font (free fan font) and place the `.woff2` file in `static/fonts/`. If woff2 is not available, use `.ttf` and reference it directly.

```bash
mkdir -p static/fonts static/audio static/models
```

Search for "Star Jedi font" — it's freely available from dafont.com or similar sites. Download and place in `static/fonts/`.

- [ ] **Step 5: Create app.html with viewport meta**

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <!-- No favicon link — either add a step to create one, or let the browser use its default -->
    <title>Message Impérial</title>
    %sveltekit.head%
  </head>
  <body>
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 5b: Create +layout.ts for static prerendering**

Create `src/routes/+layout.ts`:

```typescript
export const prerender = true;
export const ssr = false;
```

This tells SvelteKit to prerender all pages and disable SSR (required for static adapter with client-only code like Three.js and Canvas).

- [ ] **Step 6: Create app.css with global styles**

```css
@font-face {
  font-family: 'Star Jedi';
  src: url('/fonts/StarJedi.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

:root {
  --sw-yellow: #ffd700;
  --sw-blue: #4fc3f7;
  --sw-red: #ff1744;
  --sw-green: #00e676;
  --imperial-bg: #0a0a0a;
  --imperial-amber: #ff8f00;
  --hologram-blue: #00bcd4;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100dvh;
  width: 100vw;
  overflow: hidden;
  background: #000;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.star-wars-font {
  font-family: 'Star Jedi', sans-serif;
}
```

- [ ] **Step 7: Create gameState store**

Create `src/lib/stores/gameState.ts`:

```typescript
import { writable } from 'svelte/store';

export const currentStep = writable(0);
export const modelLoaded = writable(false);
export const modelProgress = writable(0);
export const audioEnabled = writable(false);
```

- [ ] **Step 8: Create config data**

Create `src/lib/data/config.ts`:

```typescript
export const contributors = [
  'Thibaud', 'Marie', 'Rénald', 'Aurélien',
  'Fabienne', 'Antoine', 'Leo', 'Jordy', 'Juliette'
];

export const password = 'TBD'; // Will be provided

export const crawlText = `Épisode XXXIII

L'ANNIVERSAIRE D'ALEXIS

La galaxie est en fête. Après des années
de loyaux services à la tête de la flotte,
le Commandant ALEXIS célèbre aujourd'hui
une nouvelle année d'existence.

Ses plus fidèles alliés ont uni leurs
forces à travers la galaxie pour lui
préparer une surprise de taille.

Un projet secret, d'une envergure
colossale, est sur le point de lui
être révélé...`;
```

- [ ] **Step 9: Create +layout.svelte**

Create `src/routes/+layout.svelte`:

```svelte
<script>
  import '../app.css';
  let { children } = $props();
</script>

<svelte:window onerror={(e) => {
  console.error('Global error caught:', e);
}} />

{@render children()}
```

- [ ] **Step 10: Create +page.svelte orchestrator (skeleton)**

Create `src/routes/+page.svelte`:

```svelte
<script lang="ts">
  import { currentStep } from '$lib/stores/gameState';

  function nextStep() {
    currentStep.update(s => s + 1);
  }
</script>

<main>
  {#if $currentStep === 0}
    <p style="color: white; text-align: center; margin-top: 40vh;">
      Step 0 — Scaffolding works! Click to advance.
    </p>
    <button onclick={nextStep}>Next</button>
  {:else}
    <p style="color: white; text-align: center; margin-top: 40vh;">
      Step {$currentStep}
    </p>
  {/if}
</main>

<style>
  main {
    width: 100vw;
    height: 100dvh;
    background: #000;
    position: relative;
    overflow: hidden;
  }
</style>
```

- [ ] **Step 11: Run dev server and verify**

```bash
npm run dev
```

Expected: app loads at `http://localhost:5173`, shows "Step 0 — Scaffolding works!", clicking Next advances to Step 1.

- [ ] **Step 12: Commit**

```bash
git init
echo "node_modules\n.svelte-kit\nbuild\n.superpowers" > .gitignore
git add -A
git commit -m "feat: scaffold SvelteKit project with static adapter, game state store, and global styles"
```

---

## Task 2: Starfield Background Component

**Files:**
- Create: `src/lib/components/Starfield.svelte`

This is a shared component used behind most steps. CSS-only animated starfield — performant and lightweight.

- [ ] **Step 1: Create Starfield.svelte**

Create `src/lib/components/Starfield.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    const stars: { x: number; y: number; z: number; }[] = [];
    const STAR_COUNT = 400;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function init() {
      resize();
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * canvas.width - canvas.width / 2,
          y: Math.random() * canvas.height - canvas.height / 2,
          z: Math.random() * canvas.width,
        });
      }
    }

    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      for (const star of stars) {
        star.z -= 0.5;
        if (star.z <= 0) {
          star.x = Math.random() * canvas.width - cx;
          star.y = Math.random() * canvas.height - cy;
          star.z = canvas.width;
        }

        const sx = (star.x / star.z) * canvas.width + cx;
        const sy = (star.y / star.z) * canvas.height + cy;
        const r = Math.max(0, 1 - star.z / canvas.width) * 2;
        const brightness = Math.max(0, 1 - star.z / canvas.width);

        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  });
</script>

<canvas bind:this={canvas} class="starfield"></canvas>

<style>
  .starfield {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }
</style>
```

- [ ] **Step 2: Test in +page.svelte**

Update `+page.svelte` to import and show the starfield behind the placeholder text:

```svelte
<script lang="ts">
  import { currentStep } from '$lib/stores/gameState';
  import Starfield from '$lib/components/Starfield.svelte';

  function nextStep() {
    currentStep.update(s => s + 1);
  }
</script>

<Starfield />
<main>
  <!-- existing content -->
</main>
```

- [ ] **Step 3: Verify starfield renders with moving stars, commit**

```bash
git add src/lib/components/Starfield.svelte src/routes/+page.svelte
git commit -m "feat: add animated canvas starfield background component"
```

---

## Task 3: Step 1 — Click to Start

**Files:**
- Create: `src/lib/components/ClickToStart.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Create ClickToStart.svelte**

Create `src/lib/components/ClickToStart.svelte`:

```svelte
<script lang="ts">
  import { audioEnabled } from '$lib/stores/gameState';
  import { getAudioContext } from '$lib/audio/audioManager';

  let { onComplete }: { onComplete: () => void } = $props();

  function handleStart() {
    // Enable audio context on user gesture — use the shared singleton context
    const ctx = getAudioContext();
    ctx.resume();
    audioEnabled.set(true);
    onComplete();
  }
</script>

<div class="start-screen" onclick={handleStart} onkeydown={(e) => e.key === 'Enter' && handleStart()} role="button" tabindex="0">
  <p class="pulse-text">Appuie pour commencer</p>
</div>

<style>
  .start-screen {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .pulse-text {
    font-size: clamp(1rem, 4vw, 2rem);
    color: var(--sw-blue);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
</style>
```

- [ ] **Step 2: Wire into +page.svelte with fade transition**

Update `src/routes/+page.svelte` to use the component with a fade transition between steps:

```svelte
<script lang="ts">
  import { currentStep } from '$lib/stores/gameState';
  import { fade } from 'svelte/transition';
  import Starfield from '$lib/components/Starfield.svelte';
  import ClickToStart from '$lib/components/ClickToStart.svelte';

  let transitioning = false;

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
```

- [ ] **Step 3: Test click-to-start works, transitions to step 1, commit**

```bash
git add src/lib/components/ClickToStart.svelte src/routes/+page.svelte
git commit -m "feat: add Click to Start screen with audio context initialization"
```

---

## Task 4: Step 2 — Imperial Terminal Enigma

**Files:**
- Create: `src/lib/components/ImperialTerminal.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Create ImperialTerminal.svelte**

Create `src/lib/components/ImperialTerminal.svelte`:

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { password } from '$lib/data/config';

  let { onComplete }: { onComplete: () => void } = $props();

  let inputValue = '';
  let status: 'idle' | 'denied' | 'granted' = 'idle';
  let showCursor = true;

  // Blinking cursor — store interval ID and clear on destroy to prevent leaks
  const cursorInterval = setInterval(() => showCursor = !showCursor, 530);
  onDestroy(() => clearInterval(cursorInterval));

  function handleSubmit() {
    if (inputValue.toLowerCase().trim() === password.toLowerCase().trim()) {
      status = 'granted';
      setTimeout(onComplete, 2000);
    } else {
      status = 'denied';
      setTimeout(() => {
        status = 'idle';
        inputValue = '';
      }, 1500);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit();
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
```

- [ ] **Step 2: Wire into +page.svelte**

Add the import and step case in `+page.svelte`:

```svelte
import ImperialTerminal from '$lib/components/ImperialTerminal.svelte';
```

Add in the `{#if}` chain:
```svelte
{:else if $currentStep === 1}
  <div in:fade={{ duration: 500 }}>
    <ImperialTerminal onComplete={nextStep} />
  </div>
```

- [ ] **Step 3: Test terminal renders, wrong password glitches, correct password transitions, commit**

```bash
git add src/lib/components/ImperialTerminal.svelte src/routes/+page.svelte
git commit -m "feat: add Imperial Terminal enigma (Step 2) with glitch effects"
```

---

## Task 5: Step 3 — X-Wing Trench Run Mini-game

**Files:**
- Create: `src/lib/game/controls.ts`
- Create: `src/lib/game/sprites.ts`
- Create: `src/lib/game/trenchRun.ts`
- Create: `src/lib/components/TrenchRun.svelte`
- Modify: `src/routes/+page.svelte`

This is the most complex task. The game is a 2D side-scrolling trench run with an X-Wing dodging obstacles.

- [ ] **Step 1: Create controls.ts — input abstraction**

Create `src/lib/game/controls.ts`:

```typescript
export interface Controls {
  up: boolean;
  down: boolean;
  fire: boolean;
}

export function createKeyboardControls(): { controls: Controls; destroy: () => void } {
  const controls: Controls = { up: false, down: false, fire: false };

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') controls.up = true;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') controls.down = true;
    if (e.key === ' ') { controls.fire = true; e.preventDefault(); }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') controls.up = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') controls.down = false;
    if (e.key === ' ') controls.fire = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return {
    controls,
    destroy: () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    }
  };
}

export function createTouchControls(
  upBtn: HTMLElement,
  downBtn: HTMLElement,
  fireBtn: HTMLElement
): { controls: Controls; destroy: () => void } {
  const controls: Controls = { up: false, down: false, fire: false };

  const bind = (el: HTMLElement, key: keyof Controls) => {
    const start = (e: Event) => { e.preventDefault(); controls[key] = true; };
    const end = (e: Event) => { e.preventDefault(); controls[key] = false; };
    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchend', end, { passive: false });
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchend', end);
    };
  };

  const destroyers = [bind(upBtn, 'up'), bind(downBtn, 'down'), bind(fireBtn, 'fire')];

  return { controls, destroy: () => destroyers.forEach(d => d()) };
}
```

- [ ] **Step 2: Create sprites.ts — pixel art drawing**

Create `src/lib/game/sprites.ts`:

```typescript
export function drawXWing(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  const s = scale;
  ctx.save();
  ctx.translate(x, y);

  // Body
  ctx.fillStyle = '#ccc';
  ctx.fillRect(-2 * s, -1 * s, 5 * s, 2 * s);

  // Nose
  ctx.fillStyle = '#eee';
  ctx.fillRect(3 * s, -0.5 * s, 2 * s, 1 * s);

  // Wings
  ctx.fillStyle = '#aaa';
  ctx.fillRect(-1 * s, -4 * s, 3 * s, 1 * s);
  ctx.fillRect(-1 * s, 3 * s, 3 * s, 1 * s);

  // Wing tips (red)
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(2 * s, -4 * s, 1 * s, 1 * s);
  ctx.fillRect(2 * s, 3 * s, 1 * s, 1 * s);

  // Engine glow
  ctx.fillStyle = '#4fc3f7';
  ctx.fillRect(-3 * s, -0.5 * s, 1 * s, 1 * s);

  ctx.restore();
}

export function drawTIE(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  const s = scale;
  ctx.save();
  ctx.translate(x, y);

  // Wings (hexagonal panels)
  ctx.fillStyle = '#555';
  ctx.fillRect(-1 * s, -4 * s, 1 * s, 8 * s);
  ctx.fillRect(1 * s, -4 * s, 1 * s, 8 * s);

  // Cockpit
  ctx.fillStyle = '#888';
  ctx.beginPath();
  ctx.arc(0, 0, 1.5 * s, 0, Math.PI * 2);
  ctx.fill();

  // Window
  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath();
  ctx.arc(0, 0, 0.8 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawLaser(ctx: CanvasRenderingContext2D, x: number, y: number, isEnemy: boolean) {
  ctx.fillStyle = isEnemy ? '#ff4444' : '#00ff00';
  ctx.fillRect(x, y - 1, 10, 2);
  ctx.shadowColor = isEnemy ? '#ff4444' : '#00ff00';
  ctx.shadowBlur = 5;
  ctx.fillRect(x, y - 1, 10, 2);
  ctx.shadowBlur = 0;
}

export function drawTrenchWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, w, h);
  // Panel lines
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  for (let i = x; i < x + w; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, y);
    ctx.lineTo(i, y + h);
    ctx.stroke();
  }
}

export function drawExplosion(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  const colors = ['#ff4444', '#ff8800', '#ffff00', '#ffffff'];
  const r = frame * 3;
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(px - 2, py - 2, 4, 4);
  }
}
```

- [ ] **Step 3: Create trenchRun.ts — game loop**

Create `src/lib/game/trenchRun.ts`:

```typescript
import type { Controls } from './controls';
import { drawXWing, drawTIE, drawLaser, drawTrenchWall, drawExplosion } from './sprites';

interface Entity {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Laser extends Entity {
  isEnemy: boolean;
}

interface Explosion {
  x: number;
  y: number;
  frame: number;
}

export interface GameState {
  running: boolean;
  score: number;
  completed: boolean;
  elapsed: number;
}

const DURATION = 35; // seconds to complete
const PLAYER_SPEED = 5;
const SCROLL_SPEED = 3;

export function createTrenchRun(
  canvas: HTMLCanvasElement,
  controls: Controls,
  onComplete: () => void
) {
  const ctx = canvas.getContext('2d')!;
  let animId: number;
  let lastTime = 0;
  let spawnTimer = 0;

  const state: GameState = { running: true, score: 0, completed: false, elapsed: 0 };

  const player = { x: 80, y: canvas.height / 2, w: 30, h: 20 };
  const obstacles: Entity[] = [];
  const enemies: (Entity & { speed: number })[] = [];
  const lasers: Laser[] = [];
  const explosions: Explosion[] = [];

  let fireCooldown = 0;

  // Trench walls
  const trenchTop = 40;
  const trenchBottom = canvas.height - 40;

  function spawnObstacle() {
    const gapSize = 120 + Math.random() * 80;
    const gapY = trenchTop + 60 + Math.random() * (trenchBottom - trenchTop - gapSize - 120);

    // Top wall segment
    obstacles.push({ x: canvas.width, y: trenchTop, w: 30, h: gapY - trenchTop });
    // Bottom wall segment
    obstacles.push({ x: canvas.width, y: gapY + gapSize, w: 30, h: trenchBottom - gapY - gapSize });
  }

  function spawnEnemy() {
    const y = trenchTop + 60 + Math.random() * (trenchBottom - trenchTop - 120);
    enemies.push({ x: canvas.width, y, w: 20, h: 20, speed: 2 + Math.random() * 2 });
  }

  function collides(a: Entity, b: Entity): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt: number) {
    state.elapsed += dt;

    // Check completion
    if (state.elapsed >= DURATION) {
      state.completed = true;
      state.running = false;
      cancelAnimationFrame(animId);
      setTimeout(onComplete, 1500);
      return;
    }

    // Player movement
    if (controls.up) player.y -= PLAYER_SPEED;
    if (controls.down) player.y += PLAYER_SPEED;
    player.y = Math.max(trenchTop + 10, Math.min(trenchBottom - 10, player.y));

    // Fire
    fireCooldown -= dt;
    if (controls.fire && fireCooldown <= 0) {
      lasers.push({ x: player.x + 20, y: player.y, w: 10, h: 2, isEnemy: false });
      fireCooldown = 0.2;
    }

    // Spawn
    spawnTimer += dt;
    if (spawnTimer > 1.5) {
      spawnTimer = 0;
      if (Math.random() > 0.4) spawnObstacle();
      if (Math.random() > 0.5) spawnEnemy();
    }

    // Move obstacles
    for (const o of obstacles) o.x -= SCROLL_SPEED;

    // Move enemies
    for (const e of enemies) e.x -= e.speed;

    // Move lasers
    for (const l of lasers) l.x += l.isEnemy ? -6 : 8;

    // Laser-enemy collisions
    for (let i = lasers.length - 1; i >= 0; i--) {
      if (lasers[i].isEnemy) continue;
      for (let j = enemies.length - 1; j >= 0; j--) {
        if (collides(lasers[i], enemies[j])) {
          explosions.push({ x: enemies[j].x, y: enemies[j].y, frame: 0 });
          enemies.splice(j, 1);
          lasers.splice(i, 1);
          state.score += 100;
          break;
        }
      }
    }

    // Update explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
      explosions[i].frame++;
      if (explosions[i].frame > 10) explosions.splice(i, 1);
    }

    // Clean up off-screen entities
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].x + obstacles[i].w < 0) obstacles.splice(i, 1);
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (enemies[i].x + enemies[i].w < 0) enemies.splice(i, 1);
    }
    for (let i = lasers.length - 1; i >= 0; i--) {
      if (lasers[i].x > canvas.width || lasers[i].x < 0) lasers.splice(i, 1);
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background — deep space
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Trench walls (top and bottom borders)
    drawTrenchWall(ctx, 0, 0, canvas.width, trenchTop);
    drawTrenchWall(ctx, 0, trenchBottom, canvas.width, canvas.height - trenchBottom);

    // Trench floor grid lines (scrolling)
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    const offset = (state.elapsed * SCROLL_SPEED * 20) % 40;
    for (let x = -offset; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, trenchTop);
      ctx.lineTo(x, trenchBottom);
      ctx.stroke();
    }

    // Obstacles
    for (const o of obstacles) {
      drawTrenchWall(ctx, o.x, o.y, o.w, o.h);
    }

    // Enemies
    const scale = Math.min(canvas.width, canvas.height) / 200;
    for (const e of enemies) {
      drawTIE(ctx, e.x, e.y, scale);
    }

    // Lasers
    for (const l of lasers) {
      drawLaser(ctx, l.x, l.y, l.isEnemy);
    }

    // Player
    drawXWing(ctx, player.x, player.y, scale);

    // Explosions
    for (const e of explosions) {
      drawExplosion(ctx, e.x, e.y, e.frame);
    }

    // HUD
    ctx.fillStyle = '#ffd700';
    ctx.font = `${14 * (canvas.width / 400)}px monospace`;
    ctx.fillText(`SCORE: ${state.score}`, 10, 25);

    // Progress bar
    const progress = Math.min(state.elapsed / DURATION, 1);
    const barWidth = canvas.width - 20;
    ctx.fillStyle = '#333';
    ctx.fillRect(10, trenchBottom + 10, barWidth, 6);
    ctx.fillStyle = '#4fc3f7';
    ctx.fillRect(10, trenchBottom + 10, barWidth * progress, 6);

    // Completion message
    if (state.completed) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffd700';
      ctx.font = `bold ${24 * (canvas.width / 400)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('BIEN JOUÉ, COMMANDANT !', canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = `${14 * (canvas.width / 400)}px monospace`;
      ctx.fillText(`Score: ${state.score}`, canvas.width / 2, canvas.height / 2 + 20);
      ctx.textAlign = 'left';
    }
  }

  function gameLoop(timestamp: number) {
    if (!state.running) return;
    const dt = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
    lastTime = timestamp;

    update(Math.min(dt, 0.05)); // Cap delta to prevent jumps
    render();

    animId = requestAnimationFrame(gameLoop);
  }

  animId = requestAnimationFrame(gameLoop);

  return {
    state,
    destroy: () => {
      state.running = false;
      cancelAnimationFrame(animId);
    }
  };
}
```

- [ ] **Step 4: Create TrenchRun.svelte — game component with touch controls**

Create `src/lib/components/TrenchRun.svelte`:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createKeyboardControls, createTouchControls } from '$lib/game/controls';
  import { createTrenchRun } from '$lib/game/trenchRun';

  let { onComplete }: { onComplete: () => void } = $props();

  let canvas: HTMLCanvasElement;
  let upBtn: HTMLButtonElement;
  let downBtn: HTMLButtonElement;
  let fireBtn: HTMLButtonElement;

  let destroyGame: (() => void) | null = null;
  let destroyKeyboard: (() => void) | null = null;
  let destroyTouch: (() => void) | null = null;
  let isMobile = false;

  onMount(() => {
    isMobile = 'ontouchstart' in window;

    // Size canvas
    canvas.width = Math.min(window.innerWidth, 800);
    canvas.height = Math.min(window.innerHeight * 0.7, 500);

    const { controls: kbControls, destroy: kbDestroy } = createKeyboardControls();
    destroyKeyboard = kbDestroy;

    if (isMobile && upBtn && downBtn && fireBtn) {
      const { controls: touchControls, destroy: tDestroy } = createTouchControls(upBtn, downBtn, fireBtn);
      destroyTouch = tDestroy;

      // Merge touch into keyboard controls
      const merged = new Proxy(kbControls, {
        get(target, prop: keyof typeof kbControls) {
          return target[prop] || touchControls[prop];
        }
      });

      const game = createTrenchRun(canvas, merged as any, onComplete);
      destroyGame = game.destroy;
    } else {
      const game = createTrenchRun(canvas, kbControls, onComplete);
      destroyGame = game.destroy;
    }
  });

  onDestroy(() => {
    destroyGame?.();
    destroyKeyboard?.();
    destroyTouch?.();
  });
</script>

<div class="game-container">
  <div class="game-header">
    <p>TRENCH RUN — Esquive les obstacles et élimine les TIE Fighters !</p>
    {#if !isMobile}
      <p class="controls-hint">↑↓ Déplacer · ESPACE Tirer</p>
    {/if}
  </div>

  <canvas bind:this={canvas} class="game-canvas"></canvas>

  <!-- Always render touch buttons so bind:this works (needed for createTouchControls).
       The `{#if true}` pattern ensures elements exist in the DOM; visibility is controlled via CSS. -->
  {#if isMobile || true}
    <div class="touch-controls" class:hidden={!isMobile}>
      <div class="dpad">
        <button bind:this={upBtn} class="touch-btn up">▲</button>
        <button bind:this={downBtn} class="touch-btn down">▼</button>
      </div>
      <button bind:this={fireBtn} class="touch-btn fire">FIRE</button>
    </div>
  {/if}
</div>

<style>
  .game-container {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #000;
  }

  .game-header {
    color: var(--sw-yellow);
    text-align: center;
    margin-bottom: 1rem;
    font-family: monospace;
    font-size: clamp(0.7rem, 2vw, 0.9rem);
  }

  .controls-hint {
    color: var(--sw-blue);
    font-size: clamp(0.6rem, 1.5vw, 0.8rem);
    margin-top: 0.3rem;
  }

  .game-canvas {
    border: 1px solid #333;
    touch-action: none;
    max-width: 100%;
  }

  .touch-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 400px;
    padding: 1rem 2rem;
    margin-top: 1rem;
  }

  .touch-controls.hidden {
    display: none;
  }

  .dpad {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .touch-btn {
    background: rgba(255, 215, 0, 0.15);
    border: 2px solid var(--sw-yellow);
    color: var(--sw-yellow);
    font-family: monospace;
    font-weight: bold;
    border-radius: 12px;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
  }

  .touch-btn.up, .touch-btn.down {
    width: 70px;
    height: 55px;
    font-size: 1.5rem;
  }

  .touch-btn.fire {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    font-size: 1rem;
    letter-spacing: 0.1em;
  }
</style>
```

- [ ] **Step 5: Wire into +page.svelte**

Add import and step case:

```svelte
import TrenchRun from '$lib/components/TrenchRun.svelte';
```

```svelte
{:else if $currentStep === 2}
  <div in:fade={{ duration: 500 }}>
    <TrenchRun onComplete={nextStep} />
  </div>
```

- [ ] **Step 6: Test the game — plays, controls work, completes after ~35s, transitions, commit**

```bash
git add src/lib/game/ src/lib/components/TrenchRun.svelte src/routes/+page.svelte
git commit -m "feat: add X-Wing Trench Run mini-game (Step 3) with pixel art and touch controls"
```

---

## Task 6: Steps 4-6 — Star Wars Cinematic Sequence

**Files:**
- Create: `src/lib/components/FarAway.svelte`
- Create: `src/lib/components/LogoReveal.svelte`
- Create: `src/lib/components/CrawlText.svelte`
- Modify: `src/routes/+page.svelte`

These three steps form the classic Star Wars opening sequence. They flow seamlessly into each other.

- [ ] **Step 1: Create FarAway.svelte**

Create `src/lib/components/FarAway.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  let { onComplete }: { onComplete: () => void } = $props();

  let visible = false;

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
```

- [ ] **Step 2: Create LogoReveal.svelte**

Create `src/lib/components/LogoReveal.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';

  let { onComplete }: { onComplete: () => void } = $props();

  let animate = false;

  onMount(() => {
    setTimeout(() => animate = true, 100);
    setTimeout(onComplete, 5500);
  });
</script>

<div class="logo-reveal">
  <div class="logo-container" class:animate>
    <h1 class="title star-wars-font">JOYEUX<br/>ANNIVERSAIRE</h1>
    <h2 class="subtitle star-wars-font">ALEXIS</h2>
  </div>
</div>

<style>
  .logo-reveal {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    perspective: 400px;
  }

  .logo-container {
    text-align: center;
    transform: scale(3);
    opacity: 1;
    transition: transform 5s ease-out, opacity 0.5s ease;
  }

  .logo-container.animate {
    transform: scale(0.3) translateZ(-200px);
    opacity: 0;
  }

  .title {
    font-family: 'Star Jedi', sans-serif;
    color: var(--sw-yellow);
    font-size: clamp(1.5rem, 6vw, 4rem);
    letter-spacing: 0.05em;
    line-height: 1.3;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
  }

  .subtitle {
    font-family: 'Star Jedi', sans-serif;
    color: var(--sw-yellow);
    font-size: clamp(1rem, 4vw, 2.5rem);
    margin-top: 1rem;
    letter-spacing: 0.2em;
    opacity: 0.9;
  }
</style>
```

- [ ] **Step 3: Create CrawlText.svelte**

Create `src/lib/components/CrawlText.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { crawlText } from '$lib/data/config';

  let { onComplete }: { onComplete: () => void } = $props();

  let crawlEl: HTMLDivElement;

  onMount(() => {
    // Use the animationend event to detect when the crawl finishes,
    // instead of a hardcoded setTimeout. This adapts to any content height.
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
    /* Use translate instead of top for better performance; the end value
       scrolls the content fully out of view. Adjust duration as needed. */
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
    from {
      top: 100%;
    }
    to {
      /* -300% is a safe overshoot for most content lengths.
         The animationend JS event handles completion timing. */
      top: -300%;
    }
  }
</style>
```

- [ ] **Step 4: Wire all three into +page.svelte**

Add imports:
```svelte
import FarAway from '$lib/components/FarAway.svelte';
import LogoReveal from '$lib/components/LogoReveal.svelte';
import CrawlText from '$lib/components/CrawlText.svelte';
```

Add step cases:
```svelte
{:else if $currentStep === 3}
  <div in:fade={{ duration: 500 }}>
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
```

- [ ] **Step 5: Test full sequence: FarAway → Logo → Crawl flows naturally, commit**

```bash
git add src/lib/components/FarAway.svelte src/lib/components/LogoReveal.svelte src/lib/components/CrawlText.svelte src/routes/+page.svelte
git commit -m "feat: add Star Wars cinematic sequence — FarAway, LogoReveal, CrawlText (Steps 4-6)"
```

---

## Task 7: Obtain & Prepare the LDraw Venator Model

**Files:**
- Create: `static/models/venator.mpd`

This task is about sourcing the 3D model file before implementing the construction scene.

- [ ] **Step 1: Search for an available Venator LDraw file**

Check Rebrickable for Venator MOCs with downloadable LDraw (.ldr/.mpd) or Studio (.io) files:
- MOC-0694 (UCS Venator by Aniomylone)
- MOC-163101 (desk-scale Venator)
- Or any other Venator MOC with a downloadable building file

If no LDraw file is directly available, check if a BrickLink Studio (.io) file can be exported to LDraw format.

- [ ] **Step 2: Convert/pack the model if needed**

If the file is a `.ldr` with external part references, use the Three.js pack utility or manually bundle:

```bash
# If using Three.js packLDrawModel utility (from three.js repo):
node node_modules/three/examples/jsm/utils/packLDrawModel.js input.ldr output.mpd
```

If the file is a BrickLink Studio `.io` file, open it in BrickLink Studio and export as LDraw (.ldr), then pack.

- [ ] **Step 3: Place the packed model in static/models/**

```bash
cp /path/to/packed/venator.mpd static/models/venator.mpd
```

- [ ] **Step 4: Test the model loads in a quick Three.js test**

Create a temporary test in the browser console or a scratch file to verify:

```javascript
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
const loader = new LDrawLoader();
loader.setPartsLibraryPath('/models/');
loader.load('/models/venator.mpd', (model) => {
  console.log('Model loaded, children:', model.children.length);
});
```

- [ ] **Step 5: If UCS model is too heavy, fall back to desk-scale MOC**

Test rendering performance. If frame rate drops below 30 FPS on desktop, switch to the simpler model.

- [ ] **Step 6: Commit the model**

```bash
git add static/models/
git commit -m "feat: add packed LDraw Venator model for 3D construction scene"
```

---

## Task 8: Step 7 — Venator 3D Construction Scene

**Files:**
- Create: `src/lib/three/venatorLoader.ts`
- Create: `src/lib/three/particles.ts`
- Create: `src/lib/components/VenatorBuild.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Create venatorLoader.ts — model loading and group splitting**

Create `src/lib/three/venatorLoader.ts`:

```typescript
import * as THREE from 'three';
import { LDrawLoader } from 'three/examples/jsm/loaders/LDrawLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { contributors } from '$lib/data/config';
import { modelProgress, modelLoaded } from '$lib/stores/gameState';

export interface BrickGroup {
  name: string;
  mesh: THREE.Group;
}

// Module-level cache so the model is only loaded once.
// Multiple callers (preload + VenatorBuild) share the same result.
let cachedGroups: BrickGroup[] | null = null;
let loadingPromise: Promise<BrickGroup[]> | null = null;

export async function loadVenator(): Promise<BrickGroup[]> {
  // Return cached result immediately if already loaded
  if (cachedGroups) return cachedGroups;

  // If a load is already in progress, return the same promise (singleton)
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise<BrickGroup[]>((resolve, reject) => {
    const loader = new LDrawLoader();

    // Set parts library path — if using a fully packed .mpd that includes
    // all parts inline, this path may not be needed, but we set it as a
    // fallback in case the model references external part files.
    loader.setPartsLibraryPath('/models/ldraw/');

    loader.load(
      '/models/venator.mpd',
      (model) => {
        modelProgress.set(0.5);

        // Collect all mesh children
        const allMeshes: THREE.Mesh[] = [];
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.updateMatrixWorld(true);
            allMeshes.push(child);
          }
        });

        // --- Merge geometries by material color to reduce draw calls ---
        // Group meshes by their material color hex string
        const byColor = new Map<string, THREE.Mesh[]>();
        for (const mesh of allMeshes) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          const colorKey = mat.color.getHexString();
          if (!byColor.has(colorKey)) byColor.set(colorKey, []);
          byColor.get(colorKey)!.push(mesh);
        }

        // Merge each color group into a single mesh
        const mergedMeshes: THREE.Mesh[] = [];
        for (const [, meshes] of byColor) {
          const geometries = meshes.map(m => {
            const geom = m.geometry.clone();
            geom.applyMatrix4(m.matrixWorld);
            geom.computeVertexNormals();
            return geom;
          });

          const merged = mergeGeometries(geometries, false);
          if (!merged) continue;

          // Use the material from the first mesh in this color group
          const mat = (meshes[0].material as THREE.Material).clone();
          mergedMeshes.push(new THREE.Mesh(merged, mat));
        }

        // Split merged meshes into contributor groups
        const groupCount = contributors.length;
        const meshesPerGroup = Math.ceil(mergedMeshes.length / groupCount);
        const groups: BrickGroup[] = [];

        for (let i = 0; i < groupCount; i++) {
          const group = new THREE.Group();
          const start = i * meshesPerGroup;
          const end = Math.min(start + meshesPerGroup, mergedMeshes.length);

          for (let j = start; j < end; j++) {
            group.add(mergedMeshes[j]);
          }

          group.visible = false;
          groups.push({
            name: contributors[i],
            mesh: group
          });
        }

        // Fix model orientation and scale
        const box = new THREE.Box3();
        for (const g of groups) {
          g.mesh.visible = true;
          box.expandByObject(g.mesh);
          g.mesh.visible = false;
        }
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 10 / maxDim; // Normalize to ~10 units

        const center = box.getCenter(new THREE.Vector3());

        for (const g of groups) {
          g.mesh.position.sub(center);
          g.mesh.scale.setScalar(scale);
        }

        modelProgress.set(1);
        modelLoaded.set(true);
        cachedGroups = groups;
        resolve(groups);
      },
      (progress) => {
        if (progress.total > 0) {
          modelProgress.set((progress.loaded / progress.total) * 0.5);
        }
      },
      (error) => {
        loadingPromise = null; // Allow retry on failure
        reject(error);
      }
    );
  });

  return loadingPromise;
}
```

- [ ] **Step 2: Create particles.ts — confetti/golden particles**

Create `src/lib/three/particles.ts`:

```typescript
import * as THREE from 'three';

export function createConfetti(scene: THREE.Scene): { update: () => void; start: () => void } {
  const count = 200;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const velocities: THREE.Vector3[] = [];

  const palette = [
    new THREE.Color('#ffd700'),
    new THREE.Color('#ff8f00'),
    new THREE.Color('#4fc3f7'),
    new THREE.Color('#ffffff'),
  ];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = Math.random() * 15 + 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

    const color = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    velocities.push(new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      -0.02 - Math.random() * 0.05,
      (Math.random() - 0.5) * 0.1
    ));
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  });

  const points = new THREE.Points(geometry, material);
  points.visible = false;
  scene.add(points);

  let active = false;

  return {
    start() {
      active = true;
      points.visible = true;
    },
    update() {
      if (!active) return;
      const pos = geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        pos.array[i * 3] += velocities[i].x;
        pos.array[i * 3 + 1] += velocities[i].y;
        pos.array[i * 3 + 2] += velocities[i].z;

        // Reset if below ground
        if (pos.array[i * 3 + 1] < -5) {
          pos.array[i * 3 + 1] = 10 + Math.random() * 5;
        }
      }
      pos.needsUpdate = true;
    }
  };
}
```

- [ ] **Step 3: Create VenatorBuild.svelte**

Create `src/lib/components/VenatorBuild.svelte`:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { loadVenator, type BrickGroup } from '$lib/three/venatorLoader';
  import { createConfetti } from '$lib/three/particles';
  import { modelLoaded, modelProgress } from '$lib/stores/gameState';
  import { contributors } from '$lib/data/config';

  let { onComplete }: { onComplete: () => void } = $props();

  let container: HTMLDivElement;
  let currentContributor = '';
  let showBudgetAlert = false;
  let budgetMessage = '';
  let showLoading = true;

  onMount(async () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 3);
    directional.position.set(5, 10, 5);
    scene.add(directional);
    const rimLight = new THREE.DirectionalLight(0x4fc3f7, 1);
    rimLight.position.set(-5, 0, -5);
    scene.add(rimLight);

    // Confetti
    const confetti = createConfetti(scene);

    // Load model
    let groups: BrickGroup[] = [];
    try {
      groups = await loadVenator();
      showLoading = false;
      for (const g of groups) scene.add(g.mesh);
    } catch (err) {
      console.error('Failed to load Venator model:', err);
      showLoading = false;
      // Skip to final message on error
      setTimeout(onComplete, 1000);
      return;
    }

    // Animation: reveal groups one by one
    let currentGroup = 0;
    let revealTimer = 0;
    const REVEAL_INTERVAL = 3; // seconds per group
    const HALF_POINT = Math.ceil(groups.length / 2); // ~50% construction
    let angle = 0;
    let animId: number;
    let paused = false;
    let budgetPhaseTimer = 0;
    let lastTime = 0;

    function animate(timestamp: number) {
      animId = requestAnimationFrame(animate);

      // Proper delta time calculation (same pattern as the trenchRun game loop)
      const dt = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
      lastTime = timestamp;
      const cappedDt = Math.min(dt, 0.05); // Cap to prevent jumps

      // Camera orbit
      angle += 0.003;
      camera.position.x = Math.sin(angle) * 20;
      camera.position.z = Math.cos(angle) * 20;
      camera.lookAt(0, 0, 0);

      if (!paused) {
        revealTimer += cappedDt;

        if (revealTimer >= REVEAL_INTERVAL && currentGroup < groups.length) {
          if (currentGroup === HALF_POINT) {
            // Budget alert!
            paused = true;
            showBudgetAlert = true;
            budgetMessage = "ALERTE — BUDGET IMPÉRIAL ÉPUISÉ";

            setTimeout(() => {
              budgetMessage = "Comme pour l'Étoile de la Mort, le projet n'est pas tout à fait terminé...\n\nÀ toi de finir la construction, Commandant !";
            }, 2500);

            setTimeout(() => {
              confetti.start();
            }, 5000);

            setTimeout(() => {
              onComplete();
            }, 9000);
          } else {
            groups[currentGroup].mesh.visible = true;
            currentContributor = groups[currentGroup].name;
            currentGroup++;
            revealTimer = 0;
          }
        }
      }

      confetti.update();
      renderer.render(scene, camera);
    }

    animId = requestAnimationFrame(animate);

    // Resize handler
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  });
</script>

<div class="venator-scene" bind:this={container}>
  {#if showLoading}
    <div class="loading">
      <p>ASSEMBLAGE DU VAISSEAU EN COURS...</p>
      <div class="progress-bar">
        <div class="progress-fill" style="width: {$modelProgress * 100}%"></div>
      </div>
    </div>
  {/if}

  {#if currentContributor}
    <div class="contributor-name">
      {currentContributor}
    </div>
  {/if}

  {#if showBudgetAlert}
    <div class="budget-alert">
      <div class="alert-box">
        {#each budgetMessage.split('\n') as line}
          <p>{line}</p>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .venator-scene {
    position: absolute;
    inset: 0;
    z-index: 10;
  }

  .loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 20;
    text-align: center;
    color: var(--imperial-amber);
    font-family: monospace;
  }

  .progress-bar {
    width: 300px;
    height: 6px;
    background: #333;
    margin-top: 1rem;
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--imperial-amber);
    transition: width 0.3s ease;
  }

  .contributor-name {
    position: absolute;
    bottom: 15%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    color: var(--sw-yellow);
    font-family: 'Star Jedi', sans-serif;
    font-size: clamp(1.5rem, 5vw, 3rem);
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
    animation: fadeInUp 0.5s ease;
  }

  .budget-alert {
    position: absolute;
    inset: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    animation: flicker 0.1s ease-in-out 5;
  }

  .alert-box {
    background: rgba(10, 10, 10, 0.9);
    border: 2px solid var(--sw-red);
    padding: 2rem 3rem;
    max-width: 500px;
    text-align: center;
  }

  .alert-box p {
    color: var(--imperial-amber);
    font-family: monospace;
    font-size: clamp(0.9rem, 2.5vw, 1.3rem);
    margin: 0.5rem 0;
    line-height: 1.6;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  @keyframes flicker {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
```

- [ ] **Step 4: Wire into +page.svelte**

Add import and step case:

```svelte
import VenatorBuild from '$lib/components/VenatorBuild.svelte';
```

```svelte
{:else if $currentStep === 6}
  <div in:fade={{ duration: 500 }}>
    <VenatorBuild onComplete={nextStep} />
  </div>
```

- [ ] **Step 5: Start preloading the model from Step 1**

In `+page.svelte`, add preloading that starts after the user clicks "start" (step 1), not on page load:

```svelte
<script lang="ts">
  import { loadVenator } from '$lib/three/venatorLoader';

  // Preload when user clicks start (step >= 1), not on initial page load.
  // This avoids loading the heavy 3D model before the user has interacted.
  let preloadPromise: Promise<any> | null = null;
  $: if ($currentStep >= 1 && !preloadPromise) {
    preloadPromise = loadVenator().catch(err => console.warn('Preload failed:', err));
  }
</script>
```

Note: `venatorLoader.ts` already includes a module-level cache (`cachedGroups`) and a singleton promise (`loadingPromise`), so the VenatorBuild component will reuse the already-loaded model without triggering a second network request.

- [ ] **Step 6: Test — model loads, bricks appear by group, names show, budget alert triggers at 50%, commit**

```bash
git add src/lib/three/ src/lib/components/VenatorBuild.svelte src/routes/+page.svelte
git commit -m "feat: add Venator 3D construction scene (Step 7) with LDrawLoader and budget alert"
```

---

## Task 9: Step 8 — Final Hologram Message

**Files:**
- Create: `src/lib/components/FinalMessage.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Create FinalMessage.svelte**

Create `src/lib/components/FinalMessage.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { contributors } from '$lib/data/config';

  let visible = false;
  let showNames = false;

  onMount(() => {
    setTimeout(() => visible = true, 500);
    setTimeout(() => showNames = true, 2000);
  });
</script>

<div class="hologram-screen">
  <div class="scanlines"></div>

  <div class="content" class:visible>
    <h1 class="title star-wars-font">Bon Anniversaire</h1>
    <h2 class="name star-wars-font">Alexis</h2>

    {#if showNames}
      <div class="contributors">
        <p class="label">— Les Commandants de la Flotte —</p>
        <div class="names">
          {#each contributors as name, i}
            <span class="contributor" style="animation-delay: {i * 0.15}s">
              {name}
            </span>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <div class="confetti-container">
    {#each Array(50) as _, i}
      <div
        class="confetti-piece"
        style="
          left: {Math.random() * 100}%;
          animation-delay: {Math.random() * 3}s;
          animation-duration: {2 + Math.random() * 3}s;
          background: {['#ffd700', '#4fc3f7', '#ff8f00', '#fff'][i % 4]};
        "
      ></div>
    {/each}
  </div>
</div>

<style>
  .hologram-screen {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: radial-gradient(ellipse at center, #001a2e 0%, #000 70%);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      rgba(0, 188, 212, 0.03) 0px,
      rgba(0, 188, 212, 0.03) 1px,
      transparent 1px,
      transparent 4px
    );
    pointer-events: none;
    z-index: 1;
    animation: scanMove 8s linear infinite;
  }

  .content {
    position: relative;
    z-index: 2;
    text-align: center;
    opacity: 0;
    transform: scale(0.9);
    transition: opacity 1s ease, transform 1s ease;
  }

  .content.visible {
    opacity: 1;
    transform: scale(1);
  }

  .title {
    font-family: 'Star Jedi', sans-serif;
    color: var(--hologram-blue);
    font-size: clamp(1.5rem, 6vw, 4rem);
    text-shadow: 0 0 30px rgba(0, 188, 212, 0.5), 0 0 60px rgba(0, 188, 212, 0.2);
    animation: hologramFlicker 4s ease-in-out infinite;
  }

  .name {
    font-family: 'Star Jedi', sans-serif;
    color: var(--sw-yellow);
    font-size: clamp(2rem, 8vw, 5rem);
    margin-top: 0.5rem;
    text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  }

  .contributors {
    margin-top: 3rem;
  }

  .label {
    color: var(--hologram-blue);
    font-family: monospace;
    font-size: clamp(0.7rem, 2vw, 1rem);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 1.5rem;
    opacity: 0.8;
  }

  .names {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.8rem 1.5rem;
    max-width: 500px;
    margin: 0 auto;
  }

  .contributor {
    color: var(--sw-blue);
    font-family: monospace;
    font-size: clamp(0.9rem, 2.5vw, 1.3rem);
    opacity: 0;
    animation: fadeIn 0.5s ease forwards;
  }

  .confetti-container {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 3;
  }

  .confetti-piece {
    position: absolute;
    top: -10px;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    animation: confettiFall linear infinite;
    opacity: 0.8;
  }

  @keyframes fadeIn {
    to { opacity: 1; }
  }

  @keyframes hologramFlicker {
    0%, 100% { opacity: 1; }
    92% { opacity: 1; }
    93% { opacity: 0.6; }
    94% { opacity: 1; }
    96% { opacity: 0.8; }
    97% { opacity: 1; }
  }

  @keyframes scanMove {
    from { transform: translateY(0); }
    to { transform: translateY(4px); }
  }

  @keyframes confettiFall {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }
</style>
```

- [ ] **Step 2: Wire into +page.svelte**

Add import and step case:

```svelte
import FinalMessage from '$lib/components/FinalMessage.svelte';
```

```svelte
{:else if $currentStep === 7}
  <div in:fade={{ duration: 1000 }}>
    <FinalMessage />
  </div>
```

Note: FinalMessage has no `onComplete` — it's the final screen.

- [ ] **Step 3: Test hologram renders, names appear with stagger, confetti falls, commit**

```bash
git add src/lib/components/FinalMessage.svelte src/routes/+page.svelte
git commit -m "feat: add final hologram message screen (Step 8) with contributor names and confetti"
```

---

## Task 10: Audio Integration

**Files:**
- Create: `src/lib/audio/audioManager.ts`
- Modify: multiple step components to add sound triggers

- [ ] **Step 1: Create audioManager.ts**

Create `src/lib/audio/audioManager.ts`:

```typescript
import { Howl } from 'howler';

interface SoundMap {
  [key: string]: Howl;
}

const sounds: SoundMap = {};
let initialized = false;

export function initAudio() {
  if (initialized) return;
  initialized = true;

  // Terminal beep — will use Web Audio API instead of a file
  // Game music and SFX — loaded from static/audio/ if available

  // Only load sounds that exist. Audio is optional.
  const audioFiles: Record<string, string> = {
    // 'arcade': '/audio/arcade-loop.mp3',
    // 'ambient': '/audio/space-ambient.mp3',
    // 'laser': '/audio/laser.mp3',
  };

  for (const [key, src] of Object.entries(audioFiles)) {
    sounds[key] = new Howl({
      src: [src],
      volume: 0.5,
      preload: true,
    });
  }
}

export function playSound(name: string, loop = false) {
  const sound = sounds[name];
  if (sound) {
    sound.loop(loop);
    sound.play();
  }
}

export function stopSound(name: string) {
  sounds[name]?.stop();
}

export function stopAll() {
  Object.values(sounds).forEach(s => s.stop());
}

// Shared AudioContext singleton — used by both ClickToStart (to resume on
// user gesture) and playTerminalBeep(). Avoids creating multiple contexts.
let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return sharedAudioCtx;
}

// Terminal beep using Web Audio API (no file needed)
export function playTerminalBeep() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 800 + Math.random() * 400;
  osc.type = 'square';
  gain.gain.value = 0.05;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}
```

- [ ] **Step 2: Add terminal beep to ImperialTerminal on keystrokes**

In `ImperialTerminal.svelte`, add:

```svelte
<script>
  import { playTerminalBeep } from '$lib/audio/audioManager';

  // Add to input handler:
  function handleInput() {
    playTerminalBeep();
  }
</script>

<!-- Add oninput={handleInput} to the input element -->
```

- [ ] **Step 3: Commit audio integration**

```bash
git add src/lib/audio/ src/lib/components/ImperialTerminal.svelte
git commit -m "feat: add audio manager with Web Audio terminal beeps"
```

---

## Task 11: Error Boundary & Final Polish

**Files:**
- Modify: `src/routes/+layout.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Add global error handler in +layout.svelte**

Update `src/routes/+layout.svelte`:

```svelte
<script>
  import '../app.css';
  import { onMount } from 'svelte';

  let { children } = $props();
  let hasError = false;
  let errorMessage = '';

  onMount(() => {
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.error);
      hasError = true;
      errorMessage = e.message;
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled rejection:', e.reason);
      hasError = true;
    });
  });
</script>

{#if hasError}
  <!-- Emergency fallback — always show the birthday message -->
  <div style="
    position: fixed; inset: 0; background: #000;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; color: #ffd700; font-family: sans-serif;
    text-align: center; padding: 2rem;
  ">
    <h1 style="font-size: 2rem; margin-bottom: 1rem;">Bon Anniversaire Alexis !</h1>
    <p style="color: #4fc3f7; margin-bottom: 2rem;">De la part de Thibaud, Marie, Rénald, Aurélien, Fabienne, Antoine, Leo, Jordy et Juliette</p>
    <p style="color: #666; font-size: 0.8rem;">Un problème technique est survenu, mais le message reste le même ❤️</p>
  </div>
{:else}
  {@render children()}
{/if}
```

- [ ] **Step 2: Review and verify the full flow end-to-end**

Run through all 8 steps manually:
1. Click to start
2. Enter password (TBD / test with placeholder)
3. Play trench run (survive ~35s)
4. Watch "Il y a longtemps..."
5. Watch logo zoom out
6. Read crawl text
7. Watch Venator construction + budget alert
8. See final hologram message

- [ ] **Step 3: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "feat: add global error boundary — always shows birthday message on failure"
```

---

## Task 12: Build & Deploy

**Files:**
- Modify: `svelte.config.js` (if needed)
- Create: `vercel.json` (if needed)

- [ ] **Step 1: Test production build**

```bash
npm run build
npm run preview
```

Verify the built app works correctly at the preview URL.

- [ ] **Step 2: Initialize git repo and push (if not already done)**

```bash
git remote add origin <repo-url>
git push -u origin main
```

- [ ] **Step 3: Deploy to Vercel**

```bash
npx vercel --prod
```

Or connect the repo to Vercel for automatic deploys.

- [ ] **Step 4: Test the deployed URL on mobile (iPhone) and desktop**

Open the deployed URL on both devices. Verify:
- Click to start works
- Terminal enigma works on mobile keyboard
- Trench run touch controls work
- 3D Venator loads and renders
- Final message displays correctly

- [ ] **Step 5: Share the URL!**

The surprise link is ready for Alexis. 🎉

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: production build and deployment configuration"
```
