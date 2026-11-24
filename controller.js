/* ============================================================
   Pixel Controller
   - Random avatar; controller + background adopt the avatar color
   - Press and hold avatar  -> highlight yourself
   - Press and hold bg      -> "peek" state (for other players)
   - MAP button opens a centered map
   All local placeholders. No networking.
   ============================================================ */

const root = document.documentElement;
const controllerEl = document.querySelector(".controller");

// ---- Controller buttons (dpad / A / B) ----
const activePointers = new Map();
const controlButtons = document.querySelectorAll("[data-control]");

function releaseAll() {
  activePointers.clear();
  controlButtons.forEach((button) => {
    button.classList.remove("pressed");
    button.setAttribute("aria-pressed", "false");
  });
}

controlButtons.forEach((button) => {
  button.setAttribute("aria-pressed", "false");

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    activePointers.set(event.pointerId, button);
    button.classList.add("pressed");
    button.setAttribute("aria-pressed", "true");
    // TODO: send input press to game later.
  });

  function release(event) {
    if (activePointers.get(event.pointerId) !== button) return;
    activePointers.delete(event.pointerId);

    if (![...activePointers.values()].includes(button)) {
      button.classList.remove("pressed");
      button.setAttribute("aria-pressed", "false");
      // TODO: send input release to game later.
    }
  }

  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
});

window.addEventListener("blur", () => {
  releaseAll();
  stopPeek();
  stopSelfHighlight();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    releaseAll();
    stopPeek();
    stopSelfHighlight();
  }
});

// ---- Avatar selection + theme ----
const avatars = [
  { name: "Sunny", color: "#f9dc88", face: "happy" },
  { name: "Mint",  color: "#9edbbb", face: "surprised" },
  { name: "Berry", color: "#e9a7c4", face: "happy" },
  { name: "Sky",   color: "#a8c9f2", face: "surprised" },
];

const avatar = avatars[Math.floor(Math.random() * avatars.length)];
const avatarElement = document.querySelector("[data-avatar]");

// Drive the whole palette — including the page background — from the avatar.
function applyTheme(color) {
  root.style.setProperty("--theme", color);
  root.style.setProperty("--avatar-color", color);
  root.style.setProperty("--background", `color-mix(in srgb, ${color} 45%, white)`);
  root.style.setProperty("--panel", `color-mix(in srgb, ${color} 18%, white)`);
}

applyTheme(avatar.color);

if (avatarElement) {
  avatarElement.dataset.face = avatar.face;
  avatarElement.setAttribute(
    "aria-label",
    `Your avatar: ${avatar.name}. Hold to highlight yourself.`,
  );
}

/* ============================================================
   Highlight YOUR avatar (press and hold on the avatar)
   ============================================================ */

function startSelfHighlight() {
  if (avatarElement) avatarElement.classList.add("is-you");
}
function stopSelfHighlight() {
  if (avatarElement) avatarElement.classList.remove("is-you");
}

if (avatarElement) {
  avatarElement.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    avatarElement.setPointerCapture(event.pointerId);
    startSelfHighlight();
  });

  function endSelf(e) {
    if (avatarElement.hasPointerCapture?.(e.pointerId)) {
      avatarElement.releasePointerCapture(e.pointerId);
    }
    stopSelfHighlight();
  }

  avatarElement.addEventListener("pointerup", endSelf);
  avatarElement.addEventListener("pointercancel", endSelf);
  avatarElement.addEventListener("lostpointercapture", stopSelfHighlight);

  avatarElement.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      startSelfHighlight();
    }
  });
  avatarElement.addEventListener("keyup", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      stopSelfHighlight();
    }
  });
}

/* ============================================================
   Peek (press and hold on the background)
   ============================================================ */

const peekCatcher = document.querySelector("[data-peek-catcher]");
const peekPointers = new Set();

function startPeek() {
  controllerEl.classList.add("is-peeking");
  // TODO: notify game to highlight other players on the Unity screen.
}
function stopPeek() {
  controllerEl.classList.remove("is-peeking");
  peekPointers.clear();
  // TODO: notify game to stop highlighting other players.
}

peekCatcher.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  peekCatcher.setPointerCapture(event.pointerId);
  peekPointers.add(event.pointerId);
  startPeek();
});

function endPeekPointer(event) {
  peekPointers.delete(event.pointerId);
  if (peekPointers.size === 0) stopPeek();
}

peekCatcher.addEventListener("pointerup", endPeekPointer);
peekCatcher.addEventListener("pointercancel", endPeekPointer);
peekCatcher.addEventListener("lostpointercapture", endPeekPointer);

/* ============================================================
   Other players (placeholder — map dots only)
   ============================================================ */

const otherPlayers = [
  { id: "p2", name: "Rex",  color: "#e9a7c4", x: 30, y: 40 },
  { id: "p3", name: "Nova", color: "#a8c9f2", x: 68, y: 62 },
  { id: "p4", name: "Pip",  color: "#9edbbb", x: 55, y: 25 },
];

const mapPlayers = document.querySelector("[data-map-players]");
const mapYou     = document.querySelector("[data-map-you]");

const youPos = { x: 50, y: 50 };

function renderMapMarkers() {
  mapPlayers.innerHTML = "";

  mapYou.style.left = `${youPos.x}%`;
  mapYou.style.top  = `${youPos.y}%`;

  otherPlayers.forEach((p) => {
    const dot = document.createElement("div");
    dot.className = "map-player";
    dot.style.setProperty("--player-color", p.color);
    dot.style.left = `${p.x}%`;
    dot.style.top  = `${p.y}%`;
    dot.textContent = p.name[0];
    dot.setAttribute("aria-label", `Other player on map: ${p.name}`);
    mapPlayers.appendChild(dot);
  });
}

renderMapMarkers();

/* ============================================================
   Tutorial
   ============================================================ */

const tutorialSteps = [
  {
    title: "Meet your avatar",
    visual: "YOUR AVATAR",
    text:
      `This is ${avatar.name}, your avatar for this visit. The controller ` +
      "and background take on this color too. Press and hold your avatar to " +
      "highlight yourself on the game screen.",
  },
  {
    title: "Move and act",
    visual: "▲ ◀ ▼ ▶     A  B",
    text: "Use the directional pad to move. Use A and B for actions.",
  },
  {
    title: "Find other players",
    visual: "HOLD ANYWHERE",
    text:
      "Press and hold anywhere on the background to highlight other players " +
      "on the game screen. Release to stop highlighting.",
  },
  {
    title: "Open the map",
    visual: "MAP",
    text:
      "Press the MAP button to open a map in the middle of the screen. " +
      "Zoom in and out with + and –, pinch to zoom, drag to pan when zoomed, " +
      "and press × to close.",
  },
  {
    title: "The rules",
    visual: "HOW IT WORKS",
    text: "Add the game's objective, limits, and other important rules here.",
  },
  {
    title: "What counts as success?",
    visual: "GOAL ★",
    text:
      "Success condition: add the real win condition here, including " +
      "what players will see when they succeed.",
  },
  {
    title: "Ready to play?",
    visual: "✓",
    text:
      "Select Start playing to close the tutorial. You can review it " +
      "again at any time using the ? button.",
  },
];

const tutorialDialog   = document.querySelector("#tutorial-dialog");
const quitDialog       = document.querySelector("#quit-dialog");
const tutorialProgress = document.querySelector("#tutorial-progress");
const tutorialTitle    = document.querySelector("#tutorial-title");
const tutorialVisual   = document.querySelector("#tutorial-visual");
const tutorialText     = document.querySelector("#tutorial-text");
const previousButton   = document.querySelector('[data-action="previous-step"]');
const nextButton       = document.querySelector('[data-action="next-step"]');

let tutorialIndex = 0;

function renderTutorialStep() {
  const step = tutorialSteps[tutorialIndex];
  tutorialProgress.textContent = `STEP ${tutorialIndex + 1} / ${tutorialSteps.length}`;
  tutorialTitle.textContent = step.title;
  tutorialVisual.textContent = step.visual;
  tutorialText.textContent = step.text;

  previousButton.textContent = tutorialIndex === 0 ? "Close" : "Back";
  nextButton.textContent =
    tutorialIndex === tutorialSteps.length - 1 ? "Start playing" : "Next";
}

function openTutorial() {
  releaseAll();
  stopPeek();
  stopSelfHighlight();
  tutorialIndex = 0;
  renderTutorialStep();
  tutorialDialog.showModal();
}

document.querySelector('[data-action="help"]').addEventListener("click", openTutorial);
document.querySelector('[data-action="close-tutorial"]').addEventListener("click", () => tutorialDialog.close());

previousButton.addEventListener("click", () => {
  if (tutorialIndex === 0) { tutorialDialog.close(); return; }
  tutorialIndex -= 1;
  renderTutorialStep();
});

nextButton.addEventListener("click", () => {
  if (tutorialIndex === tutorialSteps.length - 1) { tutorialDialog.close(); return; }
  tutorialIndex += 1;
  renderTutorialStep();
});

/* ============================================================
   Quit dialog
   ============================================================ */

document.querySelector('[data-action="quit"]').addEventListener("click", () => {
  releaseAll();
  stopPeek();
  stopSelfHighlight();
  quitDialog.showModal();
});

function closeQuitDialog() { quitDialog.close(); }
document.querySelector('[data-action="close-quit"]').addEventListener("click", closeQuitDialog);
document.querySelector('[data-action="cancel-quit"]').addEventListener("click", closeQuitDialog);

document.querySelector('[data-action="confirm-quit"]').addEventListener("click", () => {
  closeQuitDialog();
  releaseAll();
  stopPeek();
  stopSelfHighlight();
  resetZoom();
  closeMap();

  document.querySelector("#player-status").textContent = "PLAYER 1 // DISCONNECTED";
});

/* ============================================================
   Map overlay
   ============================================================ */

const mapOverlay  = document.querySelector("[data-map-overlay]");
const mapLayer    = document.querySelector("[data-map-layer]");
const mapViewport = document.querySelector(".map-viewport");
const zoomLevelEl = document.querySelector("[data-zoom-level]");

const ZOOM_MIN  = 0.75;
const ZOOM_MAX  = 3;
const ZOOM_STEP = 0.25;
let mapZoom = 1;
let panX = 0;
let panY = 0;

function applyMapTransform() {
  mapLayer.style.setProperty("--map-zoom", mapZoom);
  mapLayer.style.transform =
    `scale(${mapZoom}) translate(${panX / mapZoom}px, ${panY / mapZoom}px)`;
  zoomLevelEl.textContent = `${Math.round(mapZoom * 100)}%`;
}

function setZoom(next, focus) {
  const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
  if (clamped === mapZoom) return;

  const fx = focus ? focus.x : 0.5;
  const fy = focus ? focus.y : 0.5;
  const rect = mapViewport.getBoundingClientRect();
  const cx = rect.width * (0.5 - fx);
  const cy = rect.height * (0.5 - fy);

  const ratio = clamped / mapZoom;
  panX = (panX - cx) * ratio + cx;
  panY = (panY - cy) * ratio + cy;

  mapZoom = clamped;
  clampPan();
  applyMapTransform();
}

function clampPan() {
  const rect = mapViewport.getBoundingClientRect();
  const maxX = (mapZoom - 1) * rect.width * 0.5;
  const maxY = (mapZoom - 1) * rect.height * 0.5;
  panX = Math.min(maxX, Math.max(-maxX, panX));
  panY = Math.min(maxY, Math.max(-maxY, panY));
}

function resetZoom() {
  mapZoom = 1;
  panX = 0;
  panY = 0;
  applyMapTransform();
}

function openMap() {
  releaseAll();
  stopPeek();
  stopSelfHighlight();
  mapOverlay.hidden = false;
  applyMapTransform();
  document.querySelector('[data-action="close-map"]').focus();
}

function closeMap() {
  mapOverlay.hidden = true;
}

document.querySelector('[data-action="open-map"]').addEventListener("click", openMap);
document.querySelector('[data-action="close-map"]').addEventListener("click", closeMap);

mapOverlay.addEventListener("click", (e) => {
  if (e.target === mapOverlay) closeMap();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !mapOverlay.hidden) closeMap();
});

document.querySelector('[data-action="zoom-in"]').addEventListener("click", () => setZoom(mapZoom + ZOOM_STEP));
document.querySelector('[data-action="zoom-out"]').addEventListener("click", () => setZoom(mapZoom - ZOOM_STEP));
document.querySelector('[data-action="zoom-reset"]').addEventListener("click", resetZoom);

// Pinch-to-zoom + drag-to-pan
const mapPointers = new Map();
let lastPinchDist = 0;
let lastPan = null;

mapViewport.addEventListener("pointerdown", (e) => {
  mapViewport.setPointerCapture(e.pointerId);
  mapPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (mapPointers.size === 2) {
    const [a, b] = [...mapPointers.values()];
    lastPinchDist = Math.hypot(a.x - b.x, a.y - b.y);
  }
  lastPan = { x: e.clientX, y: e.clientY };
});

mapViewport.addEventListener("pointermove", (e) => {
  if (!mapPointers.has(e.pointerId)) return;
  mapPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (mapPointers.size === 2) {
    const [a, b] = [...mapPointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    if (lastPinchDist > 0) {
      const rect = mapViewport.getBoundingClientRect();
      const focus = {
        x: ((a.x + b.x) / 2 - rect.left) / rect.width,
        y: ((a.y + b.y) / 2 - rect.top) / rect.height,
      };
      setZoom(mapZoom * (dist / lastPinchDist), focus);
    }
    lastPinchDist = dist;
    return;
  }

  if (mapZoom > 1 && lastPan) {
    panX += e.clientX - lastPan.x;
    panY += e.clientY - lastPan.y;
    clampPan();
    applyMapTransform();
  }
  lastPan = { x: e.clientX, y: e.clientY };
});

function endMapPointer(e) {
  mapPointers.delete(e.pointerId);
  if (mapPointers.size < 2) lastPinchDist = 0;
  if (mapPointers.size === 0) lastPan = null;
}
mapViewport.addEventListener("pointerup", endMapPointer);
mapViewport.addEventListener("pointercancel", endMapPointer);
mapViewport.addEventListener("lostpointercapture", endMapPointer);

mapViewport.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const rect = mapViewport.getBoundingClientRect();
    const focus = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
    setZoom(mapZoom + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP), focus);
  },
  { passive: false },
);

applyMapTransform();