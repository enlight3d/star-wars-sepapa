<script lang="ts">
  import { onMount, tick } from 'svelte';
  import * as THREE from 'three';
  import { loadVenator, type VenatorModel } from '$lib/three/venatorLoader';
  import { createConfetti } from '$lib/three/particles';
  import { modelProgress } from '$lib/stores/gameState';
  import { playBrickPlace, playBudgetAlert, fadeOutStarWarsTheme } from '$lib/audio/audioManager';

  let { onComplete }: { onComplete: () => void } = $props();

  let container: HTMLDivElement;
  let currentContributor = $state('');
  let showBudgetAlert = $state(false);
  let budgetMessage = $state('');
  let showLoading = $state(true);
  let brickCount = $state(0);
  let totalBricks = $state(0);

  onMount(async () => {
    // Let Svelte render the loading screen first
    await tick();
    await new Promise(r => setTimeout(r, 100));

    // Step 1: Load the model (loading screen is visible)
    let venator: VenatorModel;
    const loadStart = Date.now();
    try {
      venator = await loadVenator();
      totalBricks = venator.bricks.length;

      // Ensure loading screen shows for at least 3s
      const elapsed = Date.now() - loadStart;
      const remaining = Math.max(0, 3000 - elapsed);
      await new Promise(r => setTimeout(r, remaining));
    } catch (err) {
      console.error('Failed to load Venator model:', err);
      showLoading = false;
      setTimeout(onComplete, 1000);
      return;
    }

    // Step 2: Keep the theme playing through the build scene
    showLoading = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000005);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100000);
    camera.position.set(2000, 1000, 2000);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !venator.isMobile });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(venator.isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 1.5);
    directional.position.set(100, 200, 100);
    scene.add(directional);
    const rimLight = new THREE.DirectionalLight(0x4fc3f7, 0.5);
    rimLight.position.set(-100, -50, -100);
    scene.add(rimLight);

    const confetti = createConfetti(scene);

    let orbitRadius = 2000;
    let angle = 0;

    // Add model to scene and calculate camera distance
    scene.add(venator.root);
    const box = new THREE.Box3().setFromObject(venator.root);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    orbitRadius = maxDim * 0.9;
    let animId: number;
    let lastTime = 0;

    // Animation state
    let nextBrickIdx = 0;
    let brickTimer = 0;
    // Adapt speed: ~20s total build time regardless of brick count
    const totalBuildBricks = Math.ceil(venator.bricks.length * 0.92);
    const BRICKS_PER_SECOND = Math.max(1, totalBuildBricks / 20);
    const halfPoint = Math.ceil(venator.bricks.length * 0.92);
    let paused = false;
    let currentContributorIdx = -1;

    // Drop animation — only on desktop (mobile groups are too big to drop)
    const DROP_HEIGHT = 300;
    const DROP_DURATION = 0.4;
    const droppingBricks: { obj: THREE.Object3D; targetY: number; elapsed: number }[] = [];

    function animate(timestamp: number) {
      animId = requestAnimationFrame(animate);

      const dt = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
      lastTime = timestamp;
      const cappedDt = Math.min(dt, 0.05);

      // Camera orbit
      angle += 0.002;
      camera.position.x = Math.sin(angle) * orbitRadius;
      camera.position.z = Math.cos(angle) * orbitRadius;
      camera.position.y = orbitRadius * 0.35;
      camera.lookAt(0, 0, 0);

      if (!paused && nextBrickIdx < venator.bricks.length) {
        brickTimer += cappedDt;
        const bricksToAdd = Math.floor(brickTimer * BRICKS_PER_SECOND);

        if (bricksToAdd > 0) {
          brickTimer -= bricksToAdd / BRICKS_PER_SECOND;

          for (let i = 0; i < bricksToAdd && nextBrickIdx < venator.bricks.length; i++) {
            // Check if we hit the halfway point
            if (nextBrickIdx === halfPoint) {
              paused = true;
              showBudgetAlert = true;
              budgetMessage = "ALERTE — BUDGET IMPÉRIAL ÉPUISÉ";
              playBudgetAlert();
              setTimeout(() => {
                budgetMessage = "Comme pour l'Étoile de la Mort, le projet n'est pas tout à fait terminé...\n\nÀ toi de finir la construction, Commandant !";
              }, 2500);
              setTimeout(() => confetti.start(), 5000);
              setTimeout(() => onComplete(), 9000);
              break;
            }

            // Reveal next brick with drop animation
            const brick = venator.bricks[nextBrickIdx];
            const targetY = brick.position.y;
            brick.position.y = targetY + DROP_HEIGHT;
            brick.visible = true;
            droppingBricks.push({ obj: brick, targetY, elapsed: 0 });
            nextBrickIdx++;
            if (nextBrickIdx % 15 === 0) playBrickPlace();
            brickCount = nextBrickIdx;

            // Update contributor name when entering a new group
            const group = venator.contributorGroups.find(
              g => nextBrickIdx >= g.startIdx && nextBrickIdx < g.endIdx
            );
            if (group) {
              const groupIdx = venator.contributorGroups.indexOf(group);
              if (groupIdx !== currentContributorIdx) {
                currentContributorIdx = groupIdx;
                currentContributor = group.name;
              }
            }
          }
        }
      }

      // Animate dropping bricks
      for (let i = droppingBricks.length - 1; i >= 0; i--) {
        const d = droppingBricks[i];
        d.elapsed += cappedDt;
        const t = Math.min(d.elapsed / DROP_DURATION, 1);
        // Ease-out bounce feel
        const eased = 1 - Math.pow(1 - t, 3);
        d.obj.position.y = d.targetY + DROP_HEIGHT * (1 - eased);
        if (t >= 1) {
          d.obj.position.y = d.targetY;
          droppingBricks.splice(i, 1);
        }
      }

      confetti.update();
      renderer.render(scene, camera);
    }

    animId = requestAnimationFrame(animate);

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
      <div class="loading-icon">
        <div class="brick brick-1"></div>
        <div class="brick brick-2"></div>
        <div class="brick brick-3"></div>
      </div>
      <p class="loading-text">RÉCEPTION ET DÉBALLAGE DES MATÉRIAUX...</p>
      <div class="progress-bar">
        <div class="progress-fill-anim"></div>
      </div>
      <p class="loading-sub">Préparation de 5 345 briques</p>
    </div>
  {/if}

  {#if !showLoading && totalBricks > 0}
    <div class="brick-counter">
      {brickCount} / {totalBricks} briques
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
  .venator-scene { position: absolute; inset: 0; z-index: 10; }
  .loading {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    z-index: 20; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; color: var(--imperial-amber); font-family: monospace;
    background: #000005;
  }
  .loading-icon {
    display: flex; gap: 8px; justify-content: center; margin-bottom: 2rem;
  }
  .brick {
    width: 24px; height: 16px; border-radius: 3px;
    animation: brickBounce 1.2s ease-in-out infinite;
  }
  .brick-1 { background: #c91a09; animation-delay: 0s; }
  .brick-2 { background: #a5a5a5; animation-delay: 0.2s; }
  .brick-3 { background: #05131d; border: 1px solid #333; animation-delay: 0.4s; }
  @keyframes brickBounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40% { transform: translateY(-20px); opacity: 1; }
  }
  .loading-text { font-size: clamp(0.8rem, 2.5vw, 1.1rem); letter-spacing: 0.1em; }
  .loading-sub { font-size: clamp(0.6rem, 1.5vw, 0.8rem); opacity: 0.5; margin-top: 1rem; }
  .progress-bar { width: 300px; height: 4px; background: #333; margin: 1rem auto 0; border-radius: 3px; overflow: hidden; }
  .progress-fill-anim {
    height: 100%; width: 40%; background: var(--imperial-amber); border-radius: 3px;
    animation: indeterminate 1.5s ease-in-out infinite;
  }
  @keyframes indeterminate {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(750px); }
  }
  .brick-counter { position: absolute; top: 20px; right: 20px; z-index: 20; color: var(--sw-yellow); font-family: monospace; font-size: clamp(0.8rem, 2vw, 1rem); opacity: 0.7; }
  .contributor-name { position: absolute; bottom: 15%; left: 50%; transform: translateX(-50%); z-index: 20; color: var(--sw-yellow); font-family: 'Star Jedi', sans-serif; font-size: clamp(1.5rem, 5vw, 3rem); text-shadow: 0 0 20px rgba(255, 215, 0, 0.5); animation: fadeInUp 0.5s ease; }
  .budget-alert { position: absolute; inset: 0; z-index: 20; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.7); animation: flicker 0.1s ease-in-out 5; }
  .alert-box { background: rgba(10, 10, 10, 0.9); border: 2px solid var(--sw-red); padding: 2rem 3rem; max-width: 500px; text-align: center; }
  .alert-box p { color: var(--imperial-amber); font-family: monospace; font-size: clamp(0.9rem, 2.5vw, 1.3rem); margin: 0.5rem 0; line-height: 1.6; }
  @keyframes fadeInUp { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  @keyframes flicker { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>
