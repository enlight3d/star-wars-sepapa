import * as THREE from 'three';

export function createConfetti(scene: THREE.Scene): { update: () => void; start: () => void } {
  const count = 200;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const velocities: THREE.Vector3[] = [];

  const palette = [
    new THREE.Color('#ffd700'),
    new THREE.Color('#ff8f00'),
    new THREE.Color('#4fc3f7'),
    new THREE.Color('#ffffff'),
  ];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = Math.random() * 15 + 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    const color = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    velocities.push(new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      -0.02 - Math.random() * 0.05,
      (Math.random() - 0.5) * 0.1
    ));
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  });

  const points = new THREE.Points(geometry, material);
  points.visible = false;
  scene.add(points);

  let active = false;

  return {
    start() { active = true; points.visible = true; },
    update() {
      if (!active) return;
      const pos = geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        pos.array[i * 3] += velocities[i].x;
        pos.array[i * 3 + 1] += velocities[i].y;
        pos.array[i * 3 + 2] += velocities[i].z;
        if (pos.array[i * 3 + 1] < -5) {
          pos.array[i * 3 + 1] = 10 + Math.random() * 5;
        }
      }
      pos.needsUpdate = true;
    }
  };
}
