import * as THREE from 'three';
import { LDrawLoader } from 'three/examples/jsm/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/examples/jsm/materials/LDrawConditionalLineMaterial.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { contributors } from '$lib/data/config';
import { modelProgress, modelLoaded } from '$lib/stores/gameState';

export interface BrickGroup {
  name: string;
  mesh: THREE.Group;
}

let cachedGroups: BrickGroup[] | null = null;
let loadingPromise: Promise<BrickGroup[]> | null = null;

export async function loadVenator(): Promise<BrickGroup[]> {
  if (cachedGroups) return cachedGroups;
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise<BrickGroup[]>((resolve, reject) => {
    const loader = new LDrawLoader();
    loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
    loader.setPartsLibraryPath('/models/ldraw/');

    loader.load(
      '/models/venator.mpd',
      (model) => {
        modelProgress.set(0.5);

        const allMeshes: THREE.Mesh[] = [];
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.updateMatrixWorld(true);
            allMeshes.push(child);
          }
        });

        const byColor = new Map<string, THREE.Mesh[]>();
        for (const mesh of allMeshes) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          const colorKey = mat.color.getHexString();
          if (!byColor.has(colorKey)) byColor.set(colorKey, []);
          byColor.get(colorKey)!.push(mesh);
        }

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
          const mat = (meshes[0].material as THREE.Material).clone();
          mergedMeshes.push(new THREE.Mesh(merged, mat));
        }

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
          groups.push({ name: contributors[i], mesh: group });
        }

        const box = new THREE.Box3();
        for (const g of groups) {
          g.mesh.visible = true;
          box.expandByObject(g.mesh);
          g.mesh.visible = false;
        }
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 10 / maxDim;
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
        loadingPromise = null;
        reject(error);
      }
    );
  });

  return loadingPromise;
}
