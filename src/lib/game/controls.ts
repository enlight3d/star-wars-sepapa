export interface Controls {
  up: boolean;
  down: boolean;
  fire: boolean;
}

export function createKeyboardControls(): { controls: Controls; destroy: () => void } {
  const controls: Controls = { up: false, down: false, fire: false };

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') controls.up = true;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') controls.down = true;
    if (e.key === ' ') { controls.fire = true; e.preventDefault(); }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') controls.up = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') controls.down = false;
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
  fireBtn: HTMLElement
): { controls: Controls; destroy: () => void } {
  const controls: Controls = { up: false, down: false, fire: false };

  const bind = (el: HTMLElement, key: keyof Controls) => {
    const start = (e: Event) => { e.preventDefault(); controls[key] = true; };
    const end = (e: Event) => { e.preventDefault(); controls[key] = false; };
    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchend', end, { passive: false });
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchend', end);
    };
  };

  const destroyers = [bind(upBtn, 'up'), bind(downBtn, 'down'), bind(fireBtn, 'fire')];

  return { controls, destroy: () => destroyers.forEach(d => d()) };
}
