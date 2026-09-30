# Mochi

Mochi is an AI desktop workspace inspired by the interaction style of Coucou and the extensible agent/provider architecture of OpenBot.

## Vision

Mochi combines:
- Chats
- Bots / agents
- Providers and models
- Skills + MCP
- Files and workspaces
- Mochi Island
- Coding agent workflows inspired by Codex
- Mochi CLI
- A unified media library for images, video, audio, music, and generated/downloadable files
- Multimodal chat content blocks so supported providers can return rich media directly inside the app

## Design direction

The product should keep the visual language and feel of Coucou:
- floating Island
- dark, minimal UI
- soft corners and spacing
- fluid micro-animations
- compact status surfaces
- Mochi as the primary product identity

OpenBot is used as an architectural reference for providers, agents, tools and extensibility. Mochi is a separate product and repository.

## Initial architecture

```
Mochi UI
├─ Chats
├─ Bots
├─ Library
├─ Coding Workspace
├─ Skills / MCP
├─ Providers
└─ Mochi Island

Core
├─ Conversation Engine
├─ Bot Runtime
├─ Provider Adapters
├─ Tool / MCP Runtime
├─ Workspace + Files
├─ Media / Artifact Pipeline
└─ Permission + Approval Layer

CLI
└─ mochi
```

## Multimodal content model

Messages are not limited to plain text. The core should support blocks such as:

```
text
reasoning
code
image
video
audio
music
file
artifact
tool_call
tool_result
citation
progress
```

This allows the UI to render any media or artifact a provider actually supports instead of falling back to “unsupported content”.

## Source references

- Coucou base: https://github.com/iiZo7al/coucou-chatgpt
- OpenBot reference: https://github.com/iiZo7al/openbot

## Status

Early architecture / bootstrap phase.
