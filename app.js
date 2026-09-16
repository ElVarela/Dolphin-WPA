const controllerStatus = document.getElementById("controllerStatus");
const inputSource = document.getElementById("inputSource");
const virtualControls = document.getElementById("virtualControls");
const inputPayloadView = document.getElementById("inputPayloadView");

const buttonMap = {
  buttonA: 0,
  buttonB: 1,
  buttonX: 2,
  buttonY: 3,
  l1: 4,
  r1: 5,
  l2: 6,
  r2: 7,
  select: 8,
  start: 9
};

const virtualButtonState = Object.keys(buttonMap).reduce((state, key) => {
  state[key] = false;
  return state;
}, {});

const virtualAxisState = { x: 0, y: 0 };

const inputPayload = {
  source: "virtual",
  connected: false,
  buttons: { ...virtualButtonState },
  axes: { ...virtualAxisState },
  timestamp: 0
};

window.inputPayload = inputPayload;

function updateView() {
  inputPayloadView.textContent = JSON.stringify(inputPayload, null, 2);
  inputSource.textContent = `Fuente: ${inputPayload.source}`;
}

function setVirtualControlsVisible(visible) {
  virtualControls.classList.toggle("visible", visible);
}

function readVirtualInput() {
  inputPayload.source = "virtual";
  inputPayload.connected = false;
  inputPayload.buttons = { ...virtualButtonState };
  inputPayload.axes = { ...virtualAxisState };
  inputPayload.timestamp = Date.now();
  controllerStatus.textContent = "Sin gamepad físico: usando mando virtual";
  setVirtualControlsVisible(true);
}

function readGamepadInput(gamepad) {
  inputPayload.source = "gamepad";
  inputPayload.connected = true;
  inputPayload.buttons = {
    buttonA: Boolean(gamepad.buttons[buttonMap.buttonA]?.pressed),
    buttonB: Boolean(gamepad.buttons[buttonMap.buttonB]?.pressed),
    buttonX: Boolean(gamepad.buttons[buttonMap.buttonX]?.pressed),
    buttonY: Boolean(gamepad.buttons[buttonMap.buttonY]?.pressed),
    l1: Boolean(gamepad.buttons[buttonMap.l1]?.pressed),
    r1: Boolean(gamepad.buttons[buttonMap.r1]?.pressed),
    l2: Boolean(gamepad.buttons[buttonMap.l2]?.pressed),
    r2: Boolean(gamepad.buttons[buttonMap.r2]?.pressed),
    select: Boolean(gamepad.buttons[buttonMap.select]?.pressed),
    start: Boolean(gamepad.buttons[buttonMap.start]?.pressed)
  };
  inputPayload.axes = {
    x: Number((gamepad.axes[0] || 0).toFixed(2)),
    y: Number((gamepad.axes[1] || 0).toFixed(2))
  };
  inputPayload.timestamp = Math.round(gamepad.timestamp || performance.now());
  controllerStatus.textContent = `Gamepad detectado: ${gamepad.id}`;
  setVirtualControlsVisible(false);
}

function pollInput() {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  const activeGamepad = Array.from(gamepads).find(Boolean);

  if (activeGamepad) {
    readGamepadInput(activeGamepad);
  } else {
    readVirtualInput();
  }

  updateView();
  requestAnimationFrame(pollInput);
}

function setVirtualButton(button, pressed, element) {
  virtualButtonState[button] = pressed;
  if (element) {
    element.classList.toggle("is-active", pressed);
  }
}

function setVirtualAxis(direction, pressed, element) {
  if (direction === "left") {
    virtualAxisState.x = pressed ? -1 : virtualAxisState.x === -1 ? 0 : virtualAxisState.x;
  }
  if (direction === "right") {
    virtualAxisState.x = pressed ? 1 : virtualAxisState.x === 1 ? 0 : virtualAxisState.x;
  }
  if (direction === "up") {
    virtualAxisState.y = pressed ? -1 : virtualAxisState.y === -1 ? 0 : virtualAxisState.y;
  }
  if (direction === "down") {
    virtualAxisState.y = pressed ? 1 : virtualAxisState.y === 1 ? 0 : virtualAxisState.y;
  }
  if (element) {
    element.classList.toggle("is-active", pressed);
  }
}

function bindPressEvents(element, onPress, onRelease) {
  const release = () => onRelease(element);

  element.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    onPress(element);
  });

  element.addEventListener("pointerup", release);
  element.addEventListener("pointercancel", release);
  element.addEventListener("pointerleave", release);
}

document.querySelectorAll("[data-button]").forEach((element) => {
  const button = element.dataset.button;
  bindPressEvents(
    element,
    () => setVirtualButton(button, true, element),
    () => setVirtualButton(button, false, element)
  );
});

document.querySelectorAll("[data-axis]").forEach((element) => {
  const direction = element.dataset.axis;
  bindPressEvents(
    element,
    () => setVirtualAxis(direction, true, element),
    () => setVirtualAxis(direction, false, element)
  );
});

window.addEventListener("gamepadconnected", (event) => {
  controllerStatus.textContent = `Gamepad conectado: ${event.gamepad.id}`;
});

window.addEventListener("gamepaddisconnected", () => {
  controllerStatus.textContent = "Gamepad desconectado";
});

updateView();
pollInput();
