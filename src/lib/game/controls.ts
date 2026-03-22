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

export function createJoystickControls(
  joystickContainer: HTMLElement,
  fireBtn: HTMLElement
): { controls: Controls; destroy: () => void } {
  const controls: Controls = { up: false, down: false, left: false, right: false, fire: false };

  // --- Joystick setup ---
  const containerRect = () => joystickContainer.getBoundingClientRect();
  const radius = 60; // outer ring radius
  const deadzone = radius * 0.2;

  // Create visual elements
  const base = document.createElement('div');
  base.className = 'joystick-base';
  base.style.cssText = `
    position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
    width: ${radius * 2}px; height: ${radius * 2}px; border-radius: 50%;
    border: 2px solid rgba(255, 215, 0, 0.5); background: rgba(255, 215, 0, 0.08);
    pointer-events: none;
  `;

  const thumb = document.createElement('div');
  thumb.className = 'joystick-thumb';
  thumb.style.cssText = `
    position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
    width: 44px; height: 44px; border-radius: 50%;
    background: rgba(255, 215, 0, 0.3); border: 2px solid rgba(255, 215, 0, 0.8);
    pointer-events: none; transition: none;
  `;

  joystickContainer.style.position = 'relative';
  joystickContainer.style.touchAction = 'none';
  joystickContainer.appendChild(base);
  joystickContainer.appendChild(thumb);

  let activeJoystickTouchId: number | null = null;

  function resetThumb() {
    thumb.style.left = '50%';
    thumb.style.top = '50%';
    controls.up = false;
    controls.down = false;
    controls.left = false;
    controls.right = false;
  }

  function updateJoystick(clientX: number, clientY: number) {
    const rect = containerRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    // Clamp to radius
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > radius) {
      dx = (dx / dist) * radius;
      dy = (dy / dist) * radius;
    }

    // Position thumb
    thumb.style.left = `calc(50% + ${dx}px)`;
    thumb.style.top = `calc(50% + ${dy}px)`;

    // Map to controls with deadzone
    controls.left = dx < -deadzone;
    controls.right = dx > deadzone;
    controls.up = dy < -deadzone;
    controls.down = dy > deadzone;
  }

  // --- Joystick touch handlers ---
  function onJoystickTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (activeJoystickTouchId !== null) return; // already tracking
    const touch = e.changedTouches[0];
    activeJoystickTouchId = touch.identifier;
    updateJoystick(touch.clientX, touch.clientY);
  }

  function onJoystickTouchMove(e: TouchEvent) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeJoystickTouchId) {
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  }

  function onJoystickTouchEnd(e: TouchEvent) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeJoystickTouchId) {
        activeJoystickTouchId = null;
        resetThumb();
        break;
      }
    }
  }

  // Mouse fallback for desktop testing
  let mouseDown = false;

  function onMouseDown(e: MouseEvent) {
    e.preventDefault();
    mouseDown = true;
    updateJoystick(e.clientX, e.clientY);
  }

  function onMouseMove(e: MouseEvent) {
    if (!mouseDown) return;
    updateJoystick(e.clientX, e.clientY);
  }

  function onMouseUp() {
    if (!mouseDown) return;
    mouseDown = false;
    resetThumb();
  }

  joystickContainer.addEventListener('touchstart', onJoystickTouchStart, { passive: false });
  joystickContainer.addEventListener('touchmove', onJoystickTouchMove, { passive: false });
  joystickContainer.addEventListener('touchend', onJoystickTouchEnd, { passive: false });
  joystickContainer.addEventListener('touchcancel', onJoystickTouchEnd, { passive: false });
  joystickContainer.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // --- Fire button ---
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
      joystickContainer.removeEventListener('touchstart', onJoystickTouchStart);
      joystickContainer.removeEventListener('touchmove', onJoystickTouchMove);
      joystickContainer.removeEventListener('touchend', onJoystickTouchEnd);
      joystickContainer.removeEventListener('touchcancel', onJoystickTouchEnd);
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
