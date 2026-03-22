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

export async function loadVenator(): Promise<{ groups: BrickGroup[], root: THREE.Group }> {
  if (cachedResult) return cachedResult;
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const loader = new LDrawLoader();
    loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
    loader.setPartsLibraryPath('/models/ldraw/');

    loader.load(
      '/models/venator.mpd',
      (model) => {
        modelProgress.set(0.5);

        // Merge geometries by material for performance
        const merged = LDrawUtils.mergeObject(model);

        // Center the model at origin
        const box = new THREE.Box3().setFromObject(merged);
        const center = box.getCenter(new THREE.Vector3());
        merged.position.set(-center.x, -center.y, -center.z);

        // Create root container
        const root = new THREE.Group();
        root.add(merged);

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
        resolve(cachedResult);
      },
      (progress) => {
        if (progress.total > 0) {
          modelProgress.set((progress.loaded / progress.total) * 0.5);
        }
      },
      (error) => {
        loadingPromise = null;
        reject(error);
      }
    );
  });

  return loadingPromise;
}
