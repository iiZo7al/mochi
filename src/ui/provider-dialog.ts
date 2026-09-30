import { provider } from "../core/providers";
import type { ProviderId } from "../core/types";
import {
  clearProviderSecret,
  connectProvider,
  detectProvider,
  hasProviderSecret,
  setProviderSecret,
  type NativeProviderStatus
} from "../native/provider-runtime";

const CUSTOM_STORAGE_KEY = "mochi.custom-providers.v1";

interface CustomProviderProfile {
  id: string;
  name: string;
  baseUrl: string;
  models: string[];
}

function node<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function savedCustomProviders(): CustomProviderProfile[] {
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as CustomProviderProfile[]) : [];
  } catch {
    return [];
  }
}

function saveCustomProvider(profile: CustomProviderProfile): void {
  const current = savedCustomProviders();
  const index = current.findIndex((item) => item.id === profile.id);
  if (index >= 0) current[index] = profile;
  else current.push(profile);
  localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(current));
}

function safeId(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "custom"
  );
}

function statusLabel(status: NativeProviderStatus): string {
  if (status.authState === "connected") return "Connected";
  if (status.authState === "ready") return "Ready";
  if (status.authState === "disconnected") return "Not connected";
  if (status.authState === "missing") return "Not installed";
  if (status.authState === "configurable") return "Configure";
  return status.installed ? "Detected" : "Not installed";
}

function setHealth(
  dot: HTMLElement,
  label: HTMLElement,
  detail: HTMLElement,
  path: HTMLElement,
  status: NativeProviderStatus
): void {
  dot.classList.remove("good", "bad", "idle");
  dot.classList.add(
    status.authState === "connected" || status.authState === "ready"
      ? "good"
      : status.authState === "missing"
        ? "bad"
        : "idle"
  );
  label.textContent = statusLabel(status);
  detail.textContent = status.version
    ? status.detail + " · " + status.version
    : status.detail;
  path.textContent = status.executable ?? "";
  path.style.display = status.executable ? "block" : "none";
}

function actionButton(label: string, className: string): HTMLButtonElement {
  const button = node("button", className, label);
  button.type = "button";
  return button;
}

export async function openProviderDialog(
  host: HTMLElement,
  id: ProviderId,
  onChanged?: () => void
): Promise<void> {
  const descriptor = provider(id);
  const overlay = node("div", "modal-backdrop");
  const dialog = node("section", "provider-dialog");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");

  const head = node("header", "dialog-head");
  head.append(node("div", "dialog-provider-mark", descriptor.name.slice(0, 1)));
  const title = node("div", "dialog-title");
  title.append(node("strong", "", descriptor.name));
  title.append(node("span", "", descriptor.description));
  head.append(title);
  const closeButton = actionButton("×", "dialog-close");
  closeButton.setAttribute("aria-label", "Close");
  head.append(closeButton);
  dialog.append(head);

  const body = node("div", "dialog-body");
  const health = node("div", "provider-health");
  const healthTop = node("div", "health-top");
  const healthDot = node("span", "health-dot idle");
  const healthLabel = node("strong", "health-label", "Checking…");
  healthTop.append(healthDot, healthLabel);
  const healthDetail = node("p", "health-detail", "Looking for the local runtime.");
  const healthPath = node("code", "health-path");
  health.append(healthTop, healthDetail, healthPath);
  body.append(health);

  const connectionActions = node("div", "dialog-section connection-actions");
  const secretSection = node("div", "dialog-section secret-section");
  const customSection = node("div", "dialog-section custom-section");
  body.append(connectionActions, secretSection, customSection);
  dialog.append(body);
  overlay.append(dialog);
  host.append(overlay);

  let disposed = false;
  let polling: number | null = null;

  const close = () => {
    disposed = true;
    if (polling !== null) window.clearInterval(polling);
    window.removeEventListener("keydown", onKey);
    overlay.remove();
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") close();
  };

  closeButton.addEventListener("click", close);
  overlay.addEventListener("mousedown", (event) => {
    if (event.target === overlay) close();
  });
  window.addEventListener("keydown", onKey);

  const refresh = async () => {
    try {
      const status = await detectProvider(id);
      if (disposed) return;
      setHealth(healthDot, healthLabel, healthDetail, healthPath, status);

      connectionActions.replaceChildren();

      if (id === "custom") {
        // The custom form below is the connection flow.
      } else if (id === "ollama") {
        connectionActions.append(
          node(
            "div",
            "dialog-note",
            "Ollama is local, so there is no account sign-in."
          )
        );
        const recheck = actionButton("Re-check", "secondary-action");
        recheck.addEventListener("click", () => void refresh());
        connectionActions.append(recheck);
      } else if (!status.installed) {
        connectionActions.append(
          node(
            "div",
            "dialog-note",
            "Mochi could not find " + descriptor.name + " on PATH yet."
          )
        );
        const recheck = actionButton("Re-check", "secondary-action");
        recheck.addEventListener("click", () => void refresh());
        connectionActions.append(recheck);
      } else {
        const connect = actionButton(
          status.authState === "connected" ? "Reconnect" : "Connect",
          "primary-action connect-provider"
        );
        const recheck = actionButton("Re-check", "secondary-action");
        const help = node(
          "p",
          "action-help",
          "Sign-in uses the provider's own CLI flow. Provider credentials remain with that provider."
        );

        connect.addEventListener("click", async () => {
          const original = connect.textContent ?? "Connect";
          connect.disabled = true;
          connect.textContent = "Opening…";
          try {
            const result = await connectProvider(id);
            healthDetail.textContent = result.detail;
            if (result.launched && polling === null) {
              polling = window.setInterval(() => void refresh(), 2500);
            }
          } catch (error) {
            healthDetail.textContent = String(error);
          } finally {
            connect.disabled = false;
            connect.textContent = original;
          }
        });
        recheck.addEventListener("click", () => void refresh());
        connectionActions.append(connect, recheck, help);
      }

      onChanged?.();
    } catch (error) {
      if (disposed) return;
      healthDot.classList.remove("good", "idle");
      healthDot.classList.add("bad");
      healthLabel.textContent = "Unavailable";
      healthDetail.textContent = String(error);
    }
  };

  if (descriptor.authModes.includes("api-key") && id !== "custom") {
    const exists = await hasProviderSecret(id).catch(() => false);
    const heading = node("div", "section-heading");
    const headingCopy = node("div");
    headingCopy.append(node("strong", "", "Optional API key"));
    headingCopy.append(
      node("span", "", "Stored in your operating system credential vault.")
    );
    const secretState = node(
      "span",
      "secret-state",
      exists ? "Saved" : "Not set"
    );
    heading.append(headingCopy, secretState);

    const row = node("div", "secret-row");
    const input = node("input", "secret-input");
    input.type = "password";
    input.autocomplete = "off";
    input.placeholder = exists
      ? "Enter a new key to replace it"
      : "Paste API key";
    const save = actionButton("Save", "secondary-action");
    save.addEventListener("click", async () => {
      const value = input.value.trim();
      if (!value) return;
      await setProviderSecret(id, value);
      input.value = "";
      secretState.textContent = "Saved";
      onChanged?.();
    });
    row.append(input, save);

    if (exists) {
      const clear = actionButton("Clear", "ghost-action");
      clear.addEventListener("click", async () => {
        await clearProviderSecret(id);
        secretState.textContent = "Not set";
        onChanged?.();
      });
      row.append(clear);
    }

    secretSection.append(heading, row);
  } else {
    secretSection.remove();
  }

  if (id === "custom") {
    const current = savedCustomProviders()[0];
    const heading = node("div", "section-heading");
    const headingCopy = node("div");
    headingCopy.append(node("strong", "", "Custom endpoint"));
    headingCopy.append(
      node("span", "", "OpenAI-compatible or another endpoint Mochi can adapt.")
    );
    heading.append(headingCopy);
    customSection.append(heading);

    const form = node("div", "custom-form");
    const nameInput = node("input");
    nameInput.placeholder = "My Provider";
    nameInput.value = current?.name ?? "";
    const urlInput = node("input");
    urlInput.placeholder = "https://api.example.com/v1";
    urlInput.value = current?.baseUrl ?? "";
    const modelsInput = node("input");
    modelsInput.placeholder = "model-a, model-b";
    modelsInput.value = current?.models.join(", ") ?? "";
    const keyInput = node("input");
    keyInput.type = "password";
    keyInput.autocomplete = "off";
    keyInput.placeholder = "API key (stored securely)";

    const field = (label: string, input: HTMLInputElement) => {
      const wrapper = node("label");
      wrapper.append(node("span", "", label), input);
      return wrapper;
    };

    form.append(
      field("Name", nameInput),
      field("Base URL", urlInput),
      field("Models", modelsInput),
      field("API key", keyInput)
    );

    const save = actionButton("Save provider", "primary-action");
    const result = node("p", "action-help custom-result");
    save.addEventListener("click", async () => {
      const name = nameInput.value.trim();
      const baseUrl = urlInput.value.trim();
      if (!name || !baseUrl) {
        result.textContent = "Name and Base URL are required.";
        return;
      }

      try {
        const parsed = new URL(baseUrl);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          throw new Error("Unsupported protocol");
        }
      } catch {
        result.textContent = "Enter a valid http:// or https:// Base URL.";
        return;
      }

      const profile: CustomProviderProfile = {
        id: current?.id ?? safeId(name),
        name,
        baseUrl,
        models: modelsInput.value
          .split(",")
          .map((model) => model.trim())
          .filter(Boolean)
      };

      saveCustomProvider(profile);
      const key = keyInput.value.trim();
      if (key) {
        await setProviderSecret("custom:" + profile.id, key);
        keyInput.value = "";
      }
      result.textContent = "Saved.";
      onChanged?.();
    });
    form.append(save, result);
    customSection.append(form);
  } else {
    customSection.remove();
  }

  await refresh();
}
