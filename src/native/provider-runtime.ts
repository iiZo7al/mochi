import { invoke } from "@tauri-apps/api/core";
import type { ProviderId } from "../core/types";

export interface NativeProviderStatus {
  id: ProviderId;
  installed: boolean;
  executable?: string;
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
