export interface Controls {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  fire: boolean;
}

export function createKeyboardControls(): { controls: Controls; destroy: () => void } {
  const controls: Controls = { up: false, down: false, left: false, right: false, fire: false };

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { controls.up = true; e.preventDefault(); }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { controls.down = true; e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { controls.left = true; e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { controls.right = true; e.preventDefault(); }
    if (e.key === ' ') { controls.fire = true; e.preventDefault(); }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') controls.up = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') controls.down = false;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') controls.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') controls.right = false;
    if (e.key === ' ') controls.fire = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return {
    controls,
    destroy: () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    }
  };
}

export function createTouchControls(
  upBtn: HTMLElement,
  downBtn: HTMLElement,
  leftBtn: HTMLElement,
  rightBtn: HTMLElement,
  fireBtn: HTMLElement
): { controls: Controls; destroy: () => void } {
  const controls: Controls = { up: false, down: false, left: false, right: false, fire: false };

  const bind = (el: HTMLElement, key: keyof Controls) => {
    const start = (e: Event) => { e.preventDefault(); controls[key] = true; };
    const end = (e: Event) => { e.preventDefault(); controls[key] = false; };
    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchend', end, { passive: false });
    el.addEventListener('touchcancel', end, { passive: false });
    // Also support mouse for testing on desktop
    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', end);
    el.addEventListener('mouseleave', end);
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
      el.removeEventListener('mousedown', start);
      el.removeEventListener('mouseup', end);
      el.removeEventListener('mouseleave', end);
    };
  };

  const destroyers = [
    bind(upBtn, 'up'),
    bind(downBtn, 'down'),
    bind(leftBtn, 'left'),
    bind(rightBtn, 'right'),
    bind(fireBtn, 'fire')
  ];

  return { controls, destroy: () => destroyers.forEach(d => d()) };
}
