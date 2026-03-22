import * as THREE from 'three';
import { LDrawLoader } from 'three/examples/jsm/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/examples/jsm/materials/LDrawConditionalLineMaterial.js';
import { LDrawUtils } from 'three/examples/jsm/utils/LDrawUtils.js';
import { contributors } from '$lib/data/config';
import { modelProgress, modelLoaded } from '$lib/stores/gameState';

export interface BrickGroup {
  name: string;
  mesh: THREE.Group;
}

let cachedResult: { groups: BrickGroup[], root: THREE.Group } | null = null;
let loadingPromise: Promise<{ groups: BrickGroup[], root: THREE.Group }> | null = null;

// Yield to the main thread so UI stays responsive
function yieldToMain(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

export async function loadVenator(): Promise<{ groups: BrickGroup[], root: THREE.Group }> {
  if (cachedResult) return cachedResult;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const loader = new LDrawLoader();
    loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
    loader.setPartsLibraryPath('/models/ldraw/');

    // Load the model — this fetches + parses the .mpd file
    modelProgress.set(0.1);
    const model = await (loader as any).loadAsync('/models/venator.mpd', (progress: any) => {
      if (progress.total > 0) {
        modelProgress.set((progress.loaded / progress.total) * 0.4);
      }
    });

    // Yield so UI can update
    await yieldToMain();
    modelProgress.set(0.5);

    // Merge geometries by material for performance
    const merged = LDrawUtils.mergeObject(model);
    await yieldToMain();
    modelProgress.set(0.7);

    // LDraw Y-axis points down — flip the model
    merged.rotation.x = Math.PI;

    // Center the model at origin
    const box = new THREE.Box3().setFromObject(merged);
    const center = box.getCenter(new THREE.Vector3());
    merged.position.set(-center.x, -center.y, -center.z);

    // Create root container
    const root = new THREE.Group();
    root.add(merged);

    await yieldToMain();
    modelProgress.set(0.8);

    // Collect all children for grouping
    const allChildren = [...merged.children];

    // Remove from merged, redistribute into contributor groups
    merged.remove(...allChildren);

    const groupCount = contributors.length;
    const groups: BrickGroup[] = [];

    for (let i = 0; i < groupCount; i++) {
      const subGroup = new THREE.Group();
      subGroup.visible = false;
      merged.add(subGroup);
      groups.push({ name: contributors[i], mesh: subGroup });
    }

    // Distribute round-robin
    allChildren.forEach((child, idx) => {
      groups[idx % groupCount].mesh.add(child);
    });

    console.log('Venator ready:', groups.map(g => `${g.name}: ${g.mesh.children.length}`));

    modelProgress.set(1);
    modelLoaded.set(true);
    cachedResult = { groups, root };
    return cachedResult;
  })();

  loadingPromise.catch(() => {
    loadingPromise = null;
  });

  return loadingPromise;
}
