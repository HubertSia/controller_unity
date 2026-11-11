const activePointers = new Map();

function releaseAll() {
  activePointers.clear();

  document.querySelectorAll("[data-control].pressed").forEach((button) => {
    button.classList.remove("pressed");
  });
}

document.querySelectorAll("[data-control]").forEach((button) => {
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

document.querySelector('[data-action="help"]').addEventListener(
  "click",
  () => {
    alert("Use the D-pad to move and A/B for actions.");
  },
);