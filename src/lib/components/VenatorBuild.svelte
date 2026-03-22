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
    scene.background = new THREE.Color(0x000005);

    // Camera — will be repositioned after model loads
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100000);
    camera.position.set(2000, 1000, 2000);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting — brighter for space scene
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 1.5);
    directional.position.set(100, 200, 100);
    scene.add(directional);
    const rimLight = new THREE.DirectionalLight(0x4fc3f7, 0.5);
    rimLight.position.set(-100, -50, -100);
    scene.add(rimLight);

    const confetti = createConfetti(scene);

    let groups: BrickGroup[] = [];
    let orbitRadius = 2000;

    try {
      const result = await loadVenator();
      groups = result.groups;
      scene.add(result.root);
      showLoading = false;

      // Calculate camera distance based on model size
      const box = new THREE.Box3().setFromObject(result.root);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      orbitRadius = maxDim * 0.9;
      camera.position.set(orbitRadius * 0.8, orbitRadius * 0.4, orbitRadius * 0.8);
      camera.lookAt(0, 0, 0);

      console.log('VenatorBuild: model added to scene, orbit radius:', orbitRadius);
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

      // Camera orbit
      angle += 0.003;
      camera.position.x = Math.sin(angle) * orbitRadius;
      camera.position.z = Math.cos(angle) * orbitRadius;
      camera.position.y = orbitRadius * 0.35;
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
