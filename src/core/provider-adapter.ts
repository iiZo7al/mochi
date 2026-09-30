import type {
  ChatMessage,
  ContentBlock,
  ProviderDescriptor,
  ProviderId
} from "./types";

export type ConnectionState = "missing" | "disconnected" | "connected" | "error";

export interface ProviderStatus {
  providerId: ProviderId;
  state: ConnectionState;
  runtimePath?: string;
  accountLabel?: string;
  detail?: string;
}

export interface ModelInfo {
  id: string;
  label: string;
  contextWindow?: number;
}

export interface AgentRequest {
  botId: string;
  model: string;
  messages: ChatMessage[];
  workspacePath?: string;
}

export type ProviderEvent =
  | { type: "status"; label: string }
  | { type: "content"; block: ContentBlock }
  | { type: "approval"; id: string; title: string; detail?: string }
  | { type: "done" }
  | { type: "error"; message: string };

export interface ProviderAdapter {
  readonly descriptor: ProviderDescriptor;
  detect(): Promise<ProviderStatus>;
  connect(): Promise<ProviderStatus>;
  listModels(): Promise<ModelInfo[]>;
  run(request: AgentRequest, emit: (event: ProviderEvent) => void): Promise<void>;
}
