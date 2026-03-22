<script lang="ts">
  import { onMount } from 'svelte';

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    const stars: { x: number; y: number; z: number; }[] = [];
    const STAR_COUNT = 400;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function init() {
      resize();
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * canvas.width - canvas.width / 2,
          y: Math.random() * canvas.height - canvas.height / 2,
          z: Math.random() * canvas.width,
        });
      }
    }

    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      for (const star of stars) {
        star.z -= 0.5;
        if (star.z <= 0) {
          star.x = Math.random() * canvas.width - cx;
          star.y = Math.random() * canvas.height - cy;
          star.z = canvas.width;
        }

        const sx = (star.x / star.z) * canvas.width + cx;
        const sy = (star.y / star.z) * canvas.height + cy;
        const r = Math.max(0, 1 - star.z / canvas.width) * 2;
        const brightness = Math.max(0, 1 - star.z / canvas.width);

        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  });
</script>

<canvas bind:this={canvas} class="starfield"></canvas>

<style>
  .starfield {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }
</style>
