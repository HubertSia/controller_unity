const controls = new Set([
  "up",
  "down",
  "left",
  "right",
  "buttonA",
  "buttonB",
]);

//const input = document.querySelector("#server-url");
//const status = document.querySelector("#status");
//const connectButton = document.querySelector("#connect-button");

//const storedUrl = localStorage.getItem("controller-server");
//input.value = storedUrl || `ws://${location.hostname || "localhost"}:8080`;

const serverUrl = "ws://192.168.1.10:8080";

let socket = null;
const activePointers = new Map();

function setStatus(message) {
  status.textContent = message;
}

function send(message) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function releaseAll() {
  for (const control of new Set(activePointers.values())) {
    send({ type: "input", control, pressed: false });
  }

  activePointers.clear();
  document.querySelectorAll(".pressed").forEach((button) => {
    button.classList.remove("pressed");
  });
}

function connect() {
  const url = serverUrl;


  if (!/^wss?:\/\/.+/i.test(url)) {
    setStatus("Invalid URL");
    return;
  }

  releaseAll();

  if (socket) {
    socket.onclose = null;
    socket.close();
  }

  setStatus("Connecting");

  const connection = new WebSocket(url);
  socket = connection;

  connection.onopen = () => {
    if (socket !== connection) return;

    send({ type: "hello", role: "controller" });
    setStatus("Connected");
  };

  connection.onclose = () => {
    if (socket !== connection) return;

    releaseAll();
    socket = null;
    setStatus("Disconnected");
  };

  connection.onerror = () => {
    if (socket === connection) setStatus("Connection error");
  };
}

connectButton.addEventListener("click", connect);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    input.blur();
  }
});

document.querySelector('[data-action="help"]').addEventListener("click", () => {
  alert(
    "Enter the WebSocket server address and tap CONNECT. " +
      "Use the D-pad to move and A/B for actions.",
  );
});

document.querySelector('[data-action="quit"]').addEventListener("click", () => {
  if (!confirm("Disconnect controller?")) return;

  releaseAll();
  socket?.close();
  socket = null;
  setStatus("Disconnected");
});

document.querySelectorAll("[data-control]").forEach((button) => {
  const control = button.dataset.control;
  if (!controls.has(control)) return;

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    activePointers.set(event.pointerId, control);
    button.classList.add("pressed");

    if (
      [...activePointers.values()].filter((value) => value === control)
        .length === 1
    ) {
      send({ type: "input", control, pressed: true });
    }
  });

  function release(event) {
    const heldControl = activePointers.get(event.pointerId);
    if (!heldControl) return;

    activePointers.delete(event.pointerId);

    if (![...activePointers.values()].includes(heldControl)) {
      button.classList.remove("pressed");
      send({ type: "input", control: heldControl, pressed: false });
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