import type { ProviderDescriptor, ProviderId } from "./types";

const ALL: ProviderDescriptor[] = [
  {
    id: "codex",
    name: "Codex",
    authModes: ["cli-session"],
    capabilities: ["text", "reasoning", "code", "tools", "files", "images-input", "workspace", "mcp"],
    detectsLocalRuntime: true,
    description: "Use the locally installed Codex runtime and its signed-in session."
  },
  {
    id: "claude-code",
    name: "Claude Code",
    authModes: ["cli-session"],
    capabilities: ["text", "reasoning", "code", "tools", "files", "images-input", "workspace", "mcp"],
    detectsLocalRuntime: true,
    description: "Use Claude Code through its supported local runtime/session."
  },
  {
    id: "opencode",
    name: "OpenCode",
    authModes: ["cli-session", "oauth", "api-key"],
    capabilities: ["text", "reasoning", "code", "tools", "files", "images-input", "workspace", "mcp"],
    detectsLocalRuntime: true,
    description: "Use OpenCode and providers configured inside it."
  },
  {
    id: "gemini",
    name: "Gemini",
    authModes: ["oauth", "api-key"],
    capabilities: ["text", "reasoning", "code", "tools", "files", "images-input", "images-output", "audio-input", "video-input"],
    detectsLocalRuntime: true,
    description: "Google Gemini with supported account or API authentication."
  },
  {
    id: "grok",
    name: "Grok",
    authModes: ["oauth", "api-key"],
    capabilities: ["text", "reasoning", "code", "tools", "files", "images-input"],
    detectsLocalRuntime: true,
    description: "Grok using a supported runtime or API credentials."
  },
  {
    id: "custom",
    name: "Custom Provider",
    authModes: ["custom", "api-key"],
    capabilities: ["text", "reasoning", "code", "tools", "files", "images-input", "images-output", "video-output", "audio-output", "music-output"],
    detectsLocalRuntime: false,
    description: "Custom base URL, token and model catalog."
  },
  {
    id: "ollama",
    name: "Ollama / Local",
    authModes: ["local"],
    capabilities: ["text", "reasoning", "code", "tools", "files", "images-input", "workspace"],
    detectsLocalRuntime: true,
    description: "Local models with no cloud account required."
  }
];

export function providers(): ProviderDescriptor[] {
  return ALL;
}

export function provider(id: ProviderId): ProviderDescriptor {
  const match = ALL.find((item) => item.id === id);
  if (!match) throw new Error("Unknown provider: " + id);
  return match;
}
