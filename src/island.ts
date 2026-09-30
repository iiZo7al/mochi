import "./island.css";
import { invoke } from "@tauri-apps/api/core";

const island = document.getElementById("island");
const title = document.getElementById("island-title");
const status = document.getElementById("island-status");

const setState = (next: { title?: string; status?: string }) => {
  if (next.title && title) title.textContent = next.title;
  if (next.status && status) status.textContent = next.status;
};

const loadState = () => {
  try {
    const raw = localStorage.getItem("mochi.island.status");
    if (!raw) return;
    setState(JSON.parse(raw) as { title?: string; status?: string });
  } catch {
    // Ignore malformed local state.
  }
};

loadState();
window.addEventListener("storage", loadState);

island?.addEventListener("click", async () => {
  island.classList.add("pressed");
  window.setTimeout(() => island.classList.remove("pressed"), 160);
  try {
    await invoke("show_main_window");
  } catch {
    // Browser preview has no native bridge.
  }
});
