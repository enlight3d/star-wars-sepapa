<script lang="ts">
  import * as THREE from 'three';
  import { LDrawLoader } from 'three/examples/jsm/loaders/LDrawLoader.js';
  import { LDrawConditionalLineMaterial } from 'three/examples/jsm/materials/LDrawConditionalLineMaterial.js';
  import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
  import { base } from '$app/paths';

  let status = $state('Click to start export...');
  let details = $state('');

  async function doExport() {
    status = 'Loading LDraw model...';

    const loader = new LDrawLoader();
    loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
    loader.setPartsLibraryPath(`${base}/models/ldraw/`);

    try {
      const model = await (loader as any).loadAsync(`${base}/models/venator.mpd`);
      status = 'Processing...';
      await new Promise(r => setTimeout(r, 100));

      model.rotation.x = Math.PI;
      model.updateMatrixWorld(true);

      // Center
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.set(-center.x, -center.y, -center.z);

      // Collect individual bricks (same logic as desktop loader)
      const bricks: THREE.Object3D[] = [];
      function collectBricks(obj: THREE.Object3D) {
        const hasGroupChildren = obj.children.some((c: any) => c instanceof THREE.Group);
        const hasMeshChildren = obj.children.some((c: any) => c instanceof THREE.Mesh || c instanceof THREE.LineSegments);
        if (hasMeshChildren && !hasGroupChildren && obj !== model) {
          bricks.push(obj);
          return;
        }
        for (const child of obj.children) {
          if (child instanceof THREE.Group) collectBricks(child);
        }
      }
      collectBricks(model);

      // Count vertices
      let totalVerts = 0;
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          totalVerts += child.geometry.attributes.position.count;
        }
      });

      details = `Found ${bricks.length} individual bricks, ${totalVerts.toLocaleString()} total vertices`;
      status = `Exporting ${bricks.length} bricks as GLB (this may take a moment)...`;
      await new Promise(r => setTimeout(r, 100));

      // Export the full model with individual bricks preserved
      const scene = new THREE.Scene();
      scene.add(model);

      const exporter = new GLTFExporter();
      const glb = await exporter.parseAsync(scene, { binary: true });

      const blob = new Blob([glb as ArrayBuffer], { type: 'application/octet-stream' });
      const sizeMB = (blob.size / 1024 / 1024).toFixed(1);
      details += `\nGLB size: ${sizeMB} MB`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'venator.glb';
      a.click();
      URL.revokeObjectURL(url);
      status = `Done! ${sizeMB} MB GLB with ${bricks.length} individual bricks.`;
    } catch (err) {
      status = `Error: ${err}`;
      console.error(err);
    }
  }
</script>

<div style="padding: 2rem; color: white; background: #111; min-height: 100vh; font-family: monospace;">
  <h1>Venator GLB Export (Individual Bricks)</h1>
  <p style="color: #ffd700;">{status}</p>
  <pre style="color: #4fc3f7; margin-top: 1rem;">{details}</pre>
  <button onclick={doExport} style="padding: 1rem 2rem; font-size: 1.2rem; margin-top: 1rem; cursor: pointer;">
    Export GLB with Individual Bricks
  </button>
</div>
