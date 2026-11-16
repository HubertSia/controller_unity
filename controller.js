const activePointers = new Map();
const controlButtons = document.querySelectorAll("[data-control]");

function releaseAll() {
  activePointers.clear();

  controlButtons.forEach((button) => {
    button.classList.remove("pressed");
  });
}

controlButtons.forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    activePointers.set(event.pointerId, button);
    button.classList.add("pressed");
  });

  function release(event) {
    if (activePointers.get(event.pointerId) !== button) return;

    activePointers.delete(event.pointerId);

    if (![...activePointers.values()].includes(button)) {
      button.classList.remove("pressed");
    }
  }

  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
});

window.addEventListener("blur", releaseAll);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) releaseAll();
});

// Select one avatar per page load. It stays unchanged during this visit.
const avatars = [
  { name: "Sunny", color: "#f9dc88", face: "happy" },
  { name: "Mint", color: "#9edbbb", face: "surprised" },
  { name: "Berry", color: "#e9a7c4", face: "happy" },
  { name: "Sky", color: "#a8c9f2", face: "surprised" },
];

const avatar = avatars[Math.floor(Math.random() * avatars.length)];
const avatarElement = document.querySelector("[data-avatar]");

avatarElement.style.setProperty("--avatar-color", avatar.color);
avatarElement.dataset.face = avatar.face;
avatarElement.setAttribute("aria-label", `Your avatar: ${avatar.name}`);

const tutorialSteps = [
  {
    title: "Meet your avatar",
    visual: "YOUR AVATAR",
    text:
      `This is ${avatar.name}, your avatar for this visit. A new visit may ` +
      "give you a different avatar, but it will not change while you play.",
  },
  {
    title: "Move and act",
    visual: "▲ ◀ ▼ ▶     A  B",
    text:
      "Use the directional pad to move. Use A and B for actions. " +
      "Add the exact A and B actions here when the game is connected.",
  },
  {
    title: "Where do you start?",
    visual: "START → ?",
    text:
      "Starting location: add the real spawn point here once the game " +
      "location is defined.",
  },
  {
    title: "The rules",
    visual: "HOW IT WORKS",
    text:
      "Add the game's objective, limits, and other important rules here.",
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

const tutorialDialog = document.querySelector("#tutorial-dialog");
const quitDialog = document.querySelector("#quit-dialog");
const tutorialProgress = document.querySelector("#tutorial-progress");
const tutorialTitle = document.querySelector("#tutorial-title");
const tutorialVisual = document.querySelector("#tutorial-visual");
const tutorialText = document.querySelector("#tutorial-text");
const previousButton = document.querySelector(
  '[data-action="previous-step"]',
);
const nextButton = document.querySelector('[data-action="next-step"]');

let tutorialIndex = 0;

function renderTutorialStep() {
  const step = tutorialSteps[tutorialIndex];

  tutorialProgress.textContent =
    `STEP ${tutorialIndex + 1} / ${tutorialSteps.length}`;
  tutorialTitle.textContent = step.title;
  tutorialVisual.textContent = step.visual;
  tutorialText.textContent = step.text;

  previousButton.textContent = tutorialIndex === 0 ? "Close" : "Back";
  nextButton.textContent =
    tutorialIndex === tutorialSteps.length - 1
      ? "Start playing"
      : "Next";
}

function openTutorial() {
  releaseAll();
  tutorialIndex = 0;
  renderTutorialStep();
  tutorialDialog.showModal();
}

document
  .querySelector('[data-action="help"]')
  .addEventListener("click", openTutorial);

document
  .querySelector('[data-action="close-tutorial"]')
  .addEventListener("click", () => tutorialDialog.close());

previousButton.addEventListener("click", () => {
  if (tutorialIndex === 0) {
    tutorialDialog.close();
    return;
  }

  tutorialIndex -= 1;
  renderTutorialStep();
});

nextButton.addEventListener("click", () => {
  if (tutorialIndex === tutorialSteps.length - 1) {
    tutorialDialog.close();
    return;
  }

  tutorialIndex += 1;
  renderTutorialStep();
});

document
  .querySelector('[data-action="quit"]')
  .addEventListener("click", () => {
    releaseAll();
    quitDialog.showModal();
  });

function closeQuitDialog() {
  quitDialog.close();
}

document
  .querySelector('[data-action="close-quit"]')
  .addEventListener("click", closeQuitDialog);

document
  .querySelector('[data-action="cancel-quit"]')
  .addEventListener("click", closeQuitDialog);

document
  .querySelector('[data-action="confirm-quit"]')
  .addEventListener("click", () => {
    closeQuitDialog();
    releaseAll();

    // Replace this with the actual game-disconnect call when available.
    document.querySelector("#player-status").textContent =
      "PLAYER 1 // DISCONNECTED";
  });