import { invoke } from "@tauri-apps/api/core";
import type { ProviderId } from "../core/types";

export interface NativeProviderStatus {
  id: ProviderId;
  installed: boolean;
  executable?: string;
  version?: string;
  authState: "connected" | "disconnected" | "ready" | "unknown" | "missing" | "configurable";
  detail: string;
}

export interface ProviderConnectResult {
  launched: boolean;
  detail: string;
}

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

export async function detectProvider(id: ProviderId): Promise<NativeProviderStatus> {
  if (!isTauri()) {
    return {
      id,
      installed: false,
      authState: "unknown",
      detail: "Desktop runtime is only available inside the app."
    };
  }

  return invoke<NativeProviderStatus>("provider_status", {
    providerId: id
  });
}

export async function detectAllProviders(): Promise<NativeProviderStatus[]> {
  if (!isTauri()) return [];
  return invoke<NativeProviderStatus[]>("provider_status_all");
}

export async function connectProvider(id: ProviderId): Promise<ProviderConnectResult> {
  if (!isTauri()) {
    return {
      launched: false,
      detail: "Provider sign-in is only available inside the desktop app."
    };
  }

  return invoke<ProviderConnectResult>("provider_connect", {
    providerId: id
  });
}

export async function setProviderSecret(key: string, value: string): Promise<void> {
  if (!isTauri()) throw new Error("Secure credential storage requires the desktop app.");
  await invoke("provider_secret_set", { key, value });
}

export async function hasProviderSecret(key: string): Promise<boolean> {
  if (!isTauri()) return false;
  return invoke<boolean>("provider_secret_has", { key });
}

export async function clearProviderSecret(key: string): Promise<void> {
  if (!isTauri()) return;
  await invoke("provider_secret_clear", { key });
}
