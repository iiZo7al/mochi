export type ProviderId =
  | "codex"
  | "claude-code"
  | "opencode"
  | "gemini"
  | "grok"
  | "custom"
  | "ollama";

export type ProviderAuthMode =
  | "cli-session"
  | "oauth"
  | "api-key"
  | "custom"
  | "local";

export type ProviderCapability =
  | "text"
  | "reasoning"
  | "code"
  | "tools"
  | "files"
  | "images-input"
  | "images-output"
  | "video-input"
  | "video-output"
  | "audio-input"
  | "audio-output"
  | "music-output"
  | "mcp"
  | "workspace";

export interface ProviderDescriptor {
  id: ProviderId;
  name: string;
  authModes: ProviderAuthMode[];
  capabilities: ProviderCapability[];
  detectsLocalRuntime: boolean;
  description: string;
}

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "reasoning"; text: string }
  | { type: "code"; language?: string; code: string }
  | { type: "image"; assetId: string; src: string; alt?: string }
  | { type: "video"; assetId: string; src: string; poster?: string }
  | { type: "audio"; assetId: string; src: string; title?: string }
  | { type: "file"; assetId: string; name: string; mime: string; src: string }
  | { type: "artifact"; artifactId: string; title: string; mime: string }
  | { type: "tool-call"; id: string; tool: string; input: unknown }
  | { type: "tool-result"; id: string; tool: string; output: unknown }
  | { type: "citation"; title: string; href: string }
  | { type: "progress"; label: string; value?: number };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  createdAt: number;
  blocks: ContentBlock[];
}

export interface BotConfig {
  id: string;
  name: string;
  emoji: string;
  providerId: ProviderId;
  model: string;
  systemPrompt: string;
  skillIds: string[];
  mcpServerIds: string[];
  permissions: {
    files: "none" | "read" | "read-write";
    shell: "never" | "ask" | "allow";
    network: "never" | "ask" | "allow";
  };
}

export interface MediaAsset {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  name: string;
  mime: string;
  src: string;
  origin: "user" | "assistant" | "tool";
  createdAt: number;
  chatId?: string;
}
