export interface Controls {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  fire: boolean;
  // Analog intensity 0-1 (keyboard always 1, joystick proportional)
  ix: number;
  iy: number;
}

export function createKeyboardControls(): { controls: Controls; destroy: () => void } {
  const controls: Controls = { up: false, down: false, left: false, right: false, fire: false, ix: 0, iy: 0 };

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'z' || e.key === 'Z') { controls.up = true; controls.iy = -1; e.preventDefault(); }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { controls.down = true; controls.iy = 1; e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'q' || e.key === 'Q') { controls.left = true; controls.ix = -1; e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { controls.right = true; controls.ix = 1; e.preventDefault(); }
    if (e.key === ' ') { controls.fire = true; e.preventDefault(); }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'z' || e.key === 'Z') { controls.up = false; if (!controls.down) controls.iy = 0; }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { controls.down = false; if (!controls.up) controls.iy = 0; }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'q' || e.key === 'Q') { controls.left = false; if (!controls.right) controls.ix = 0; }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { controls.right = false; if (!controls.left) controls.ix = 0; }
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

export function createJoystickControls(
  joystickContainer: HTMLElement,
  fireBtn: HTMLElement
): { controls: Controls; destroy: () => void } {
  const controls: Controls = { up: false, down: false, left: false, right: false, fire: false, ix: 0, iy: 0 };

  const containerRect = () => joystickContainer.getBoundingClientRect();
  const radius = 60;
  const deadzone = radius * 0.15;

  // Visual elements
  const base = document.createElement('div');
  base.style.cssText = `
    position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
    width: ${radius * 2}px; height: ${radius * 2}px; border-radius: 50%;
    border: 2px solid rgba(255, 215, 0, 0.5); background: rgba(255, 215, 0, 0.08);
    pointer-events: none;
  `;

  const thumb = document.createElement('div');
  thumb.style.cssText = `
    position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
    width: 44px; height: 44px; border-radius: 50%;
    background: rgba(255, 215, 0, 0.3); border: 2px solid rgba(255, 215, 0, 0.8);
    pointer-events: none;
  `;

  joystickContainer.style.position = 'relative';
  joystickContainer.style.touchAction = 'none';
  joystickContainer.appendChild(base);
  joystickContainer.appendChild(thumb);

  let activeJoystickTouchId: number | null = null;

  function resetThumb() {
    thumb.style.left = '50%';
    thumb.style.top = '50%';
    controls.up = controls.down = controls.left = controls.right = false;
    controls.ix = controls.iy = 0;
  }

  function updateJoystick(clientX: number, clientY: number) {
    const rect = containerRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > radius) {
      dx = (dx / dist) * radius;
      dy = (dy / dist) * radius;
    }

    // Position thumb
    thumb.style.left = `calc(50% + ${dx}px)`;
    thumb.style.top = `calc(50% + ${dy}px)`;

    // Boolean direction (with deadzone)
    controls.left = dx < -deadzone;
    controls.right = dx > deadzone;
    controls.up = dy < -deadzone;
    controls.down = dy > deadzone;

    // Analog intensity: 0 at deadzone edge, 1 at full radius
    const effectiveDist = Math.max(0, dist - deadzone);
    const effectiveMax = radius - deadzone;
    const intensity = Math.min(1, effectiveDist / effectiveMax);

    // Directional intensity
    if (dist > deadzone) {
      controls.ix = (dx / dist) * intensity;
      controls.iy = (dy / dist) * intensity;
    } else {
      controls.ix = 0;
      controls.iy = 0;
    }
  }

  function onTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (activeJoystickTouchId !== null) return;
    const touch = e.changedTouches[0];
    activeJoystickTouchId = touch.identifier;
    updateJoystick(touch.clientX, touch.clientY);
  }

  function onTouchMove(e: TouchEvent) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeJoystickTouchId) {
        updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  }

  function onTouchEnd(e: TouchEvent) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeJoystickTouchId) {
        activeJoystickTouchId = null;
        resetThumb();
        break;
      }
    }
  }

  let mouseDown = false;
  function onMouseDown(e: MouseEvent) { e.preventDefault(); mouseDown = true; updateJoystick(e.clientX, e.clientY); }
  function onMouseMove(e: MouseEvent) { if (mouseDown) updateJoystick(e.clientX, e.clientY); }
  function onMouseUp() { if (mouseDown) { mouseDown = false; resetThumb(); } }

  joystickContainer.addEventListener('touchstart', onTouchStart, { passive: false });
  joystickContainer.addEventListener('touchmove', onTouchMove, { passive: false });
  joystickContainer.addEventListener('touchend', onTouchEnd, { passive: false });
  joystickContainer.addEventListener('touchcancel', onTouchEnd, { passive: false });
  joystickContainer.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  const fireStart = (e: Event) => { e.preventDefault(); controls.fire = true; };
  const fireEnd = (e: Event) => { e.preventDefault(); controls.fire = false; };
  fireBtn.addEventListener('touchstart', fireStart, { passive: false });
  fireBtn.addEventListener('touchend', fireEnd, { passive: false });
  fireBtn.addEventListener('touchcancel', fireEnd, { passive: false });
  fireBtn.addEventListener('mousedown', fireStart);
  fireBtn.addEventListener('mouseup', fireEnd);
  fireBtn.addEventListener('mouseleave', fireEnd);

  return {
    controls,
    destroy: () => {
      joystickContainer.removeEventListener('touchstart', onTouchStart);
      joystickContainer.removeEventListener('touchmove', onTouchMove);
      joystickContainer.removeEventListener('touchend', onTouchEnd);
      joystickContainer.removeEventListener('touchcancel', onTouchEnd);
      joystickContainer.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      fireBtn.removeEventListener('touchstart', fireStart);
      fireBtn.removeEventListener('touchend', fireEnd);
      fireBtn.removeEventListener('touchcancel', fireEnd);
      fireBtn.removeEventListener('mousedown', fireStart);
      fireBtn.removeEventListener('mouseup', fireEnd);
      fireBtn.removeEventListener('mouseleave', fireEnd);
      base.remove();
      thumb.remove();
    }
  };
}
