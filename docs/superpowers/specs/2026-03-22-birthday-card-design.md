# Birthday Card Webapp — "The Full Saga"

Carte d'anniversaire interactive pour Alexis (CEO d'Eridanis), fan de Star Wars et Lego.

## Context

9 collègues/amis ont réuni la moitié du prix du set Lego UCS Venator. La carte est un lien surprise qu'Alexis ouvrira sur son iPhone 14 Pro Max ou MacBook Pro M4 Max. Le ton est épique et cinématique, le texte en français, sans mention de l'entreprise.

**Contributeurs :** Thibaud, Marie, Rénald, Aurélien, Fabienne, Antoine, Leo, Jordy, Juliette

**Deadline :** 2026-03-23

## Experience Flow

The webapp is a linear cinematic sequence of 8 steps. Each step transitions to the next via animations. No navigation, no back button — it's a one-way ride.

### Step 1 — Click to Start

- Black screen with starfield background
- Subtle pulsing text: "Appuie pour commencer" or a glowing button
- Purpose: enables audio context (required on mobile) and creates suspense
- On click → fade to black → Step 2

### Step 2 — Le Code Impérial (Enigma)

- Imperial terminal aesthetic: dark background, green/amber monospace text, scan lines
- Header: "TERMINAL IMPÉRIAL — ACCÈS RESTREINT"
- Prompt: "Identification requise. Entrez votre code d'accès, Commandant."
- Input field styled as terminal prompt (`> _` with blinking cursor)
- Password: TBD (placeholder for now, will be provided later)
- Wrong answer: screen glitches, "ACCÈS REFUSÉ" in red, retry
- Correct answer: "ACCÈS AUTORISÉ" in green, terminal powers down → transition to Step 3
- Subtle keyboard/typing sound effects

### Step 3 — X-Wing Trench Run (Mini-game)

- 2D side-scrolling game rendered on HTML Canvas
- Player controls an X-Wing (pixel art style) flying through a trench (Death Star inspired)
- Obstacles: walls, turrets, TIE fighters coming from the right
- Controls:
  - Desktop: Arrow keys (up/down) or W/S to move, Space to shoot
  - Mobile: On-screen touch controls — virtual joystick or up/down buttons + fire button, clearly visible
- Duration: ~30-45 seconds, difficulty is fun but not frustrating
- The game is beatable on first try by anyone — the goal is fun, not challenge
- Visual style: pixel art / retro arcade, Star Wars color palette
- On completion: "Bien joué, Commandant !" → screen wipe → Step 4
- Optional: score display (but no fail state — always progresses)

### Step 4 — "Il y a longtemps..." (Far Away Intro)

- Classic blue text on starfield: "Il y a longtemps, dans un bureau pas si lointain..."
- Font: similar to Star Wars style (but the "a long time ago" part uses a serif/italic style like the films)
- Fade in, hold 3-4 seconds, fade out
- Starfield slowly drifts

### Step 5 — Logo Reveal

- "JOYEUX ANNIVERSAIRE" in Star Wars title font (Star Jedi or similar)
- "ALEXIS" below in smaller text
- Animation: text starts large and center, then shrinks and recedes into the distance (classic Star Wars logo zoom-out)
- Starfield background with parallax
- Duration: ~5 seconds
- Transitions directly into the crawl

### Step 6 — Crawl Text

- Classic Star Wars opening crawl: yellow text, perspective-tilted, scrolling into the vanishing point
- Content in French — the birthday message, deliberately mysterious about the gift:
  - Intro celebrating Alexis
  - "Tes amis ont uni leurs forces à travers la galaxie..."
  - Teases that a surprise awaits
  - Does NOT name the Venator — the 3D construction scene IS the reveal
- Duration: ~30-40 seconds of scrolling
- Background: starfield
- On crawl end → camera pans down (like in the films) → Step 7

### Step 7 — Venator Construction (3D Scene)

- **Three.js + LDrawLoader** loading an actual LDraw model of the UCS Venator (MOC-0694, ~5,458 bricks)
- The model loads during earlier steps (preloaded in background from Step 1)
- Animation sequence:
  1. Empty space with stars
  2. Bricks start appearing group by group, floating into position
  3. 9 groups of bricks, one per contributor
  4. As each group appears, the contributor's name fades in nearby (e.g., "Thibaud" floats near the bridge section)
  5. Camera slowly orbits the model as it builds
  6. Construction reaches ~50% and **stops**
  7. Screen flickers — Imperial alert style
  8. Message appears: "ALERTE — BUDGET IMPÉRIAL ÉPUISÉ"
  9. Humorous text: "Comme pour l'Étoile de la Mort, le projet n'est pas tout à fait terminé... À toi de finir la construction, Commandant !" (or similar Death Star budget joke)
  10. The half-built Venator rotates slowly, showing the incomplete state
- The model uses the LDraw file directly — real Lego bricks rendered in the browser
- Lighting: dramatic, space-like, with subtle rim lighting on the bricks

### Step 8 — Final Message (Hologram Screen)

- Transition to holographic display aesthetic
- Blue-tinted, scan lines, subtle glitch effects
- Center message: "Bon Anniversaire Alexis !"
- All 9 contributor names listed below, styled as "signatures" or "Commandants de la Flotte"
- Confetti / golden particle effect
- The message remains on screen (final state, no timeout)
- Optional: subtle ambient Star Wars-esque music loop

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | SvelteKit (static adapter) | Component structure, transitions, routing |
| 3D | Three.js + LDrawLoader | Venator brick model rendering |
| 3D | Raw Three.js in Svelte components | Imperative control needed for construction animation |
| Audio | Howler.js | Cross-browser audio, mobile-friendly |
| Animations | Svelte transitions + CSS keyframes | Step transitions, text effects |
| Game engine | HTML Canvas 2D API | Trench run mini-game |
| Font | Star Jedi (free fan font) | Star Wars title typography |
| Deploy | Vercel (static) | Hosting the surprise link |

## Project Structure

```
src/
├── routes/
│   └── +page.svelte              # Main orchestrator
│
├── lib/
│   ├── stores/
│   │   └── gameState.ts           # Current step, score, audio state, model loading
│   │
│   ├── components/
│   │   ├── Starfield.svelte       # Animated starfield (reused across steps)
│   │   ├── ClickToStart.svelte    # Step 1
│   │   ├── ImperialTerminal.svelte # Step 2 — enigma
│   │   ├── TrenchRun.svelte       # Step 3 — mini-game
│   │   ├── FarAway.svelte         # Step 4 — "Il y a longtemps..."
│   │   ├── LogoReveal.svelte      # Step 5 — title zoom
│   │   ├── CrawlText.svelte       # Step 6 — scrolling text
│   │   ├── VenatorBuild.svelte    # Step 7 — 3D construction
│   │   └── FinalMessage.svelte    # Step 8 — hologram + names
│   │
│   ├── game/
│   │   ├── trenchRun.ts           # Game loop, physics, collision detection
│   │   ├── sprites.ts             # X-Wing, obstacles, explosions (pixel art)
│   │   └── controls.ts            # Keyboard + touch input handling
│   │
│   ├── three/
│   │   ├── venatorLoader.ts       # LDraw model loading + brick grouping
│   │   └── particles.ts          # Confetti, golden particles
│   │
│   └── audio/
│       └── audioManager.ts        # Music + SFX lifecycle
│
├── static/
│   ├── fonts/
│   │   └── StarJedi.woff2        # Star Wars font
│   ├── audio/                     # Music + sound effects
│   └── models/
│       └── venator.mpd            # Packed LDraw model (~3-6 MB)
│
└── app.html                       # Shell
```

## Component Orchestration

The main `+page.svelte` manages a `currentStep` store. Each step component:
- Receives an `onComplete` callback
- Handles its own animations and logic
- Calls `onComplete()` when done, triggering a transition to the next step
- Transitions between steps: fade to black (500ms) → next step fades in

## Preloading Strategy

- The LDraw Venator model (~3-6 MB) begins loading as soon as Step 1 (Click to Start) is activated
- A loading progress is tracked in the store
- If the user reaches Step 7 before the model is loaded, show a loading screen styled as "Chargement du vaisseau..." with a progress bar in Imperial style
- Audio files are preloaded during Step 2 (enigma — user is busy typing)

## Responsive Design

- Mobile-first CSS
- All text scales with viewport (clamp-based font sizing)
- Trench run game canvas fills available space with proper aspect ratio
- Touch controls are large, thumb-friendly, positioned at bottom of screen
- 3D scene adapts camera FOV and distance based on viewport
- Crawl text perspective adjusts for portrait vs landscape

## Audio Plan

- **Step 1:** Silence (suspense)
- **Step 2:** Subtle Imperial terminal hum/beeps on keystrokes
- **Step 3:** Arcade-style music, laser sounds, explosion SFX
- **Step 4-6:** Star Wars-style orchestral ambient (royalty-free or fan-made)
- **Step 7:** Building sounds (click/snap), dramatic reveal music
- **Step 8:** Triumphant fanfare, then ambient loop

All audio is optional — the experience works without sound. Audio is enabled by the click in Step 1.

## Data

```typescript
const contributors = [
  'Thibaud', 'Marie', 'Rénald', 'Aurélien',
  'Fabienne', 'Antoine', 'Leo', 'Jordy', 'Juliette'
];

const password = 'TBD'; // To be provided

const crawlText = `...`; // French birthday message, TBD final wording
```

## 3D Performance Strategy

The UCS Venator model (~5,458 bricks) is heavy. Optimization steps:

1. **Geometry merging** — after loading, merge brick geometries by color into a small number of combined meshes to reduce draw calls from thousands to ~20-30
2. **Grouped reveal** — the 9 contributor groups are pre-merged meshes that toggle visibility, not individual bricks animating independently
3. **Preloading** — model parsing happens during Steps 2-3 while user is busy with enigma/game
4. **Loading fallback** — if model isn't ready by Step 7, show an Imperial-styled loading screen: "Assemblage du vaisseau en cours..." with a progress indicator
5. **LDraw model source** — download a Venator MOC LDraw file from Rebrickable (MOC-0694 or similar available MOC), pack it using Three.js `packLDrawModel` utility into a single `.mpd` file stored in `static/models/`

If the LDraw model proves too heavy during development, fallback plan: use a simpler desk-scale Venator MOC (~587 bricks) which will load and render instantly on any device.

## Error Handling

Global error boundary that catches any failure (WebGL not available, model load failure, audio failure) and gracefully skips to Step 8 (Final Message). Alexis must always see the birthday wishes and contributor names, no matter what breaks.

## Mobile Viewport

- `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">` to prevent zoom on inputs
- CSS `height: 100dvh` for full-screen immersion (handles Safari's dynamic toolbar)
- `overflow: hidden` on body to prevent scroll bounce
- `touch-action: none` on game canvas to prevent browser gestures during gameplay

## Audio Asset Strategy

Keep audio minimal and source from free/royalty-free libraries:
- **Terminal beeps** — generated programmatically via Web Audio API (no file needed)
- **Arcade music + SFX** — 1-2 short royalty-free chiptune loops + laser/explosion sounds
- **Ambient space music** — 1 royalty-free orchestral loop for Steps 4-8
- Total audio budget: ~2-3 files, under 1 MB combined
- All audio is optional — experience works silently if audio fails

## Key Design Decisions

1. **Svelte over Angular** — lighter, better animation primitives, faster for a cinematic one-shot experience
2. **LDrawLoader over custom 3D** — real Lego bricks, authentic look, no manual modeling needed
3. **UCS model (5,458 bricks) with geometry merging** — target devices (iPhone 14 Pro Max, MacBook M4 Max) can handle it; fallback to desk-scale MOC if needed
4. **Raw Three.js over Threlte** — imperative control needed for construction animation, one less dependency to learn
5. **No fail state in mini-game** — the goal is fun, not frustration. Alexis should always reach the birthday reveal
6. **50% construction stop** — ties directly to the real-world "half the money" situation with a Death Star budget joke
7. **Preloading during enigma/game** — heavy 3D model loads while user is busy playing, no perceived wait
8. **Static deployment** — no backend needed, just a URL to share
