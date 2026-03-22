<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { loadVenator, type BrickGroup } from '$lib/three/venatorLoader';
  import { createConfetti } from '$lib/three/particles';
  import { modelProgress } from '$lib/stores/gameState';

  let { onComplete }: { onComplete: () => void } = $props();

  let container: HTMLDivElement;
  let currentContributor = $state('');
  let showBudgetAlert = $state(false);
  let budgetMessage = $state('');
  let showLoading = $state(true);

  onMount(async () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 3);
    directional.position.set(5, 10, 5);
    scene.add(directional);
    const rimLight = new THREE.DirectionalLight(0x4fc3f7, 1);
    rimLight.position.set(-5, 0, -5);
    scene.add(rimLight);

    const confetti = createConfetti(scene);

    let groups: BrickGroup[] = [];
    try {
      groups = await loadVenator();
      showLoading = false;
      for (const g of groups) scene.add(g.mesh);
    } catch (err) {
      console.error('Failed to load Venator model:', err);
      showLoading = false;
      setTimeout(onComplete, 1000);
      return;
    }

    let currentGroup = 0;
    let revealTimer = 0;
    const REVEAL_INTERVAL = 3;
    const HALF_POINT = Math.ceil(groups.length / 2);
    let angle = 0;
    let animId: number;
    let paused = false;
    let lastTime = 0;

    function animate(timestamp: number) {
      animId = requestAnimationFrame(animate);

      const dt = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
      lastTime = timestamp;
      const cappedDt = Math.min(dt, 0.05);

      angle += 0.003;
      camera.position.x = Math.sin(angle) * 20;
      camera.position.z = Math.cos(angle) * 20;
      camera.lookAt(0, 0, 0);

      if (!paused) {
        revealTimer += cappedDt;
        if (revealTimer >= REVEAL_INTERVAL && currentGroup < groups.length) {
          if (currentGroup === HALF_POINT) {
            paused = true;
            showBudgetAlert = true;
            budgetMessage = "ALERTE — BUDGET IMPÉRIAL ÉPUISÉ";
            setTimeout(() => {
              budgetMessage = "Comme pour l'Étoile de la Mort, le projet n'est pas tout à fait terminé...\n\nÀ toi de finir la construction, Commandant !";
            }, 2500);
            setTimeout(() => confetti.start(), 5000);
            setTimeout(() => onComplete(), 9000);
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
  .venator-scene { position: absolute; inset: 0; z-index: 10; }
  .loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 20; text-align: center; color: var(--imperial-amber); font-family: monospace; }
  .progress-bar { width: 300px; height: 6px; background: #333; margin-top: 1rem; border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--imperial-amber); transition: width 0.3s ease; }
  .contributor-name { position: absolute; bottom: 15%; left: 50%; transform: translateX(-50%); z-index: 20; color: var(--sw-yellow); font-family: 'Star Jedi', sans-serif; font-size: clamp(1.5rem, 5vw, 3rem); text-shadow: 0 0 20px rgba(255, 215, 0, 0.5); animation: fadeInUp 0.5s ease; }
  .budget-alert { position: absolute; inset: 0; z-index: 20; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.7); animation: flicker 0.1s ease-in-out 5; }
  .alert-box { background: rgba(10, 10, 10, 0.9); border: 2px solid var(--sw-red); padding: 2rem 3rem; max-width: 500px; text-align: center; }
  .alert-box p { color: var(--imperial-amber); font-family: monospace; font-size: clamp(0.9rem, 2.5vw, 1.3rem); margin: 0.5rem 0; line-height: 1.6; }
  @keyframes fadeInUp { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  @keyframes flicker { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>
