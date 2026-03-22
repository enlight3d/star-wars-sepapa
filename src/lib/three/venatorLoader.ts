import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { contributors } from '$lib/data/config';
import { modelProgress, modelLoaded } from '$lib/stores/gameState';
import { base } from '$app/paths';

export interface VenatorModel {
  root: THREE.Group;
  bricks: THREE.Object3D[];
  contributorGroups: { name: string; startIdx: number; endIdx: number }[];
  isMobile: boolean;
}

let cachedResult: VenatorModel | null = null;
let loadingPromise: Promise<VenatorModel> | null = null;

function yieldToMain(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

function detectMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function buildContributorGroups(bricks: THREE.Object3D[]) {
  const bricksPerContributor = Math.ceil(bricks.length / contributors.length);
  return contributors.map((name, i) => ({
    name,
    startIdx: i * bricksPerContributor,
    endIdx: Math.min((i + 1) * bricksPerContributor, bricks.length)
  }));
}

export async function loadVenator(): Promise<VenatorModel> {
  if (cachedResult) return cachedResult;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const isMobile = detectMobile();

    // Use GLB for everyone — faster loading, same brick-by-brick result
    {
      console.log('Venator: loading GLB (mobile)');
      const loader = new GLTFLoader();

      modelProgress.set(0.2);
      const gltf = await loader.loadAsync(`${base}/models/venator.glb`, (progress) => {
        if (progress.total > 0) {
          modelProgress.set((progress.loaded / progress.total) * 0.7);
        }
      });

      await yieldToMain();
      modelProgress.set(0.8);

      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.set(-center.x, -center.y, -center.z);

      const root = new THREE.Group();
      root.add(model);

      // Collect individual bricks — same hierarchy logic as desktop
      const bricks: THREE.Object3D[] = [];
      function collectBricksGLB(obj: THREE.Object3D) {
        const hasGroupChildren = obj.children.some(c => c.children && c.children.length > 0);
        const hasMeshChildren = obj.children.some(c => c instanceof THREE.Mesh || c instanceof THREE.LineSegments);
        if (hasMeshChildren && !hasGroupChildren && obj !== model) {
          bricks.push(obj);
          return;
        }
        for (const child of obj.children) {
          if (child.children && child.children.length > 0) {
            collectBricksGLB(child);
          }
        }
      }
      collectBricksGLB(model);

      // Hide all for progressive reveal
      for (const brick of bricks) brick.visible = false;

      modelProgress.set(1);
      modelLoaded.set(true);
      console.log(`Venator GLB: ${bricks.length} meshes as bricks`);

      cachedResult = {
        root, bricks,
        contributorGroups: buildContributorGroups(bricks),
        isMobile
      };
      return cachedResult;
    }
  })();

  loadingPromise.catch(() => { loadingPromise = null; });
  return loadingPromise;
}
