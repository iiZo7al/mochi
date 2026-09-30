# Architecture

The desktop shell is separated from provider runtimes.

## Core flow

```text
UI
  -> Bot
    -> ProviderAdapter
      -> Runtime / Account / API
        -> model
```

Provider adapters emit typed events. The UI does not assume that a model returns plain text only.

## Initial provider targets

- Codex: detect the installed CLI/runtime and use its supported signed-in session.
- Claude Code: detect the installed runtime/session and use its supported authentication flow.
- OpenCode: detect the runtime and configured providers.
- Gemini: supported account/API authentication.
- Grok: supported runtime/API authentication.
- Custom: configurable base URL, auth and model catalog.
- Ollama/local: local runtime discovery.

No credentials belong in source control. Native desktop secrets will use the OS credential store.

## Multimodal content

The conversation engine supports text, reasoning, code, images, video, audio, files, artifacts, tool calls, tool results, citations and progress events.

The media library indexes both user uploads and AI-produced media.

## Permissions

Each bot has explicit filesystem, shell and network permissions. Sensitive actions can enter an approval state that can surface in the floating Island.
