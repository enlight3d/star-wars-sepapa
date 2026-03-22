import * as THREE from 'three';
import { LDrawLoader } from 'three/examples/jsm/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/examples/jsm/materials/LDrawConditionalLineMaterial.js';
import { contributors } from '$lib/data/config';
import { modelProgress, modelLoaded } from '$lib/stores/gameState';
import { base } from '$app/paths';

export interface VenatorModel {
  root: THREE.Group;
  bricks: THREE.Object3D[];
  contributorGroups: { name: string; startIdx: number; endIdx: number }[];
}

let cachedResult: VenatorModel | null = null;
let loadingPromise: Promise<VenatorModel> | null = null;

function yieldToMain(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

export async function loadVenator(): Promise<VenatorModel> {
  if (cachedResult) return cachedResult;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const loader = new LDrawLoader();
    loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
    loader.setPartsLibraryPath(`${base}/models/ldraw/`);

    modelProgress.set(0.1);
    const model = await (loader as any).loadAsync(`${base}/models/venator.mpd`, (progress: any) => {
      if (progress.total > 0) {
        modelProgress.set((progress.loaded / progress.total) * 0.4);
      }
    });

    await yieldToMain();
    modelProgress.set(0.5);

    // LDraw Y-axis points down — flip the model
    model.rotation.x = Math.PI;
    model.updateMatrixWorld(true);

    // Center the model at origin
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -center.y, -center.z);

    // Create root container
    const root = new THREE.Group();
    root.add(model);

    await yieldToMain();
    modelProgress.set(0.6);

    // Collect all individual bricks (leaf groups that contain mesh geometry)
    // In LDraw hierarchy: model → submodels → parts → primitives
    // We want to find groups at the "part" level — each is a visible brick
    const bricks: THREE.Object3D[] = [];

    function collectBricks(obj: THREE.Object3D) {
      // If this object has Mesh children but no Group children, it's a leaf brick
      const hasGroupChildren = obj.children.some(c => c instanceof THREE.Group);
      const hasMeshChildren = obj.children.some(c => c instanceof THREE.Mesh || c instanceof THREE.LineSegments);

      if (hasMeshChildren && !hasGroupChildren && obj !== model) {
        bricks.push(obj);
        return;
      }

      // Otherwise recurse into group children
      for (const child of obj.children) {
        if (child instanceof THREE.Group) {
          collectBricks(child);
        }
      }
    }

    collectBricks(model);

    console.log(`Collected ${bricks.length} individual bricks`);

    await yieldToMain();
    modelProgress.set(0.8);

    // Hide all bricks initially
    for (const brick of bricks) {
      brick.visible = false;
    }

    // Assign bricks to contributor groups
    const bricksPerContributor = Math.ceil(bricks.length / contributors.length);
    const contributorGroups = contributors.map((name, i) => ({
      name,
      startIdx: i * bricksPerContributor,
      endIdx: Math.min((i + 1) * bricksPerContributor, bricks.length)
    }));

    console.log('Contributor groups:', contributorGroups.map(g =>
      `${g.name}: bricks ${g.startIdx}-${g.endIdx} (${g.endIdx - g.startIdx})`
    ));

    modelProgress.set(1);
    modelLoaded.set(true);

    cachedResult = { root, bricks, contributorGroups };
    return cachedResult;
  })();

  loadingPromise.catch(() => { loadingPromise = null; });
  return loadingPromise;
}
