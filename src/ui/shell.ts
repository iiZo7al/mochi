import { providers } from "../core/providers";

type Section =
  | "chats"
  | "bots"
  | "library"
  | "code"
  | "skills"
  | "providers"
  | "settings";

const nav: Array<{ id: Section; label: string; icon: string }> = [
  { id: "chats", label: "Chats", icon: "◌" },
  { id: "bots", label: "Bots", icon: "✦" },
  { id: "library", label: "Library", icon: "▦" },
  { id: "code", label: "Code", icon: "⌘" },
  { id: "skills", label: "Skills / MCP", icon: "⌁" },
  { id: "providers", label: "Providers", icon: "◇" },
  { id: "settings", label: "Settings", icon: "⚙" }
];

function providerCards(): string {
  return providers()
    .map(
      (p) => `
      <button class="provider-card" data-provider="${p.id}">
        <div class="provider-mark">${p.name.slice(0, 1)}</div>
        <div class="provider-copy">
          <strong>${p.name}</strong>
          <span>${p.description}</span>
        </div>
        <span class="provider-state">Connect</span>
      </button>
    `
    )
    .join("");
}

function chatsView(): string {
  return `
    <div class="chat-layout">
      <aside class="thread-list">
        <button class="new-chat">＋ New chat</button>
        <div class="thread-section">Recent</div>
        <button class="thread on">
          <span>◌</span>
          <div><strong>Welcome</strong><small>Just now</small></div>
        </button>
      </aside>
      <section class="conversation">
        <header class="conversation-head">
          <div><strong>Welcome</strong><span>Coder · Codex</span></div>
          <button>•••</button>
        </header>
        <div class="messages">
          <div class="assistant-message">
            <div class="message-avatar">✦</div>
            <div>
              <p>Connect a provider, pick a bot, then start a chat. Images, video, audio, files, tool activity and progress can render directly in the conversation.</p>
            </div>
          </div>
        </div>
        <div class="composer large">
          <button>＋</button>
          <textarea placeholder="Message…"></textarea>
          <div class="composer-bottom">
            <button class="model-chip">Coder · Codex⌄</button>
            <button class="send">↑</button>
          </div>
        </div>
      </section>
    </div>
  `;
}

function botsView(): string {
  return `
    <div class="page-head">
      <div>
        <h1>Bots</h1>
        <p>Create agents with their own provider, model, tools, skills and permissions.</p>
      </div>
      <button class="primary">New bot</button>
    </div>
    <div class="bot-grid">
      <article class="bot-card">
        <div class="bot-avatar">⌘</div>
        <div><h3>Coder</h3><p>Codex · Workspace agent</p></div>
        <span class="pill">Approvals on</span>
      </article>
      <article class="bot-card">
        <div class="bot-avatar">✦</div>
        <div><h3>Creative</h3><p>Gemini · Multimodal</p></div>
        <span class="pill">Media</span>
      </article>
      <button class="bot-card add-card"><span>＋</span><strong>Create bot</strong></button>
    </div>
  `;
}

function providerView(): string {
  return `
    <div class="page-head">
      <div>
        <h1>Connect a provider</h1>
        <p>CLI sessions, account sign-in, custom endpoints and local models.</p>
      </div>
    </div>
    <div class="provider-grid">${providerCards()}</div>
  `;
}

function libraryView(): string {
  return `
    <div class="page-head">
      <div>
        <h1>Library</h1>
        <p>Images, video, music, audio and files from you and your AI chats.</p>
      </div>
      <button class="primary">Import</button>
    </div>
    <div class="library-tabs">
      <button class="on">All</button><button>Images</button><button>Video</button><button>Audio</button><button>Files</button>
    </div>
    <div class="empty-library">
      <div class="empty-orb">✦</div>
      <h2>Your media lives here</h2>
      <p>Generated media and uploads will be indexed automatically.</p>
    </div>
  `;
}

function codeView(): string {
  return `
    <div class="code-shell">
      <aside class="file-panel">
        <div class="panel-title">Workspace <button>＋</button></div>
        <div class="workspace-empty">Open a folder to start a coding session.</div>
      </aside>
      <section class="code-chat">
        <div class="code-status"><span class="status-dot"></span> Coder · Ready</div>
        <div class="code-empty">
          <div class="code-glyph">⌘</div>
          <h1>What should I build?</h1>
          <p>Open a workspace, then ask the coding agent to inspect, edit, run and test your project.</p>
        </div>
        <div class="composer">
          <button>＋</button>
          <input placeholder="Ask Coder…" />
          <button class="send">↑</button>
        </div>
      </section>
    </div>
  `;
}

function genericView(title: string): string {
  return `
    <div class="page-head">
      <div><h1>${title}</h1><p>This section is connected to the new shell and ready for its runtime layer.</p></div>
    </div>
  `;
}

export function mountShell(root: HTMLElement): void {
  let active: Section = "chats";

  const draw = () => {
    root.innerHTML = `
      <div class="app-shell">
        <div class="island">
          <div class="island-pulse"></div>
          <strong>Coder</strong>
          <span>Ready</span>
          <button>Open</button>
        </div>

        <aside class="sidebar">
          <div class="brand"><div class="brand-orb">✦</div><span>Mochi</span></div>
          <nav>
            ${nav
              .map(
                (item) =>
                  `<button class="${item.id === active ? "on" : ""}" data-nav="${item.id}"><span>${item.icon}</span>${item.label}</button>`
              )
              .join("")}
          </nav>
          <div class="sidebar-bottom">
            <div class="connection">
              <i></i>
              <div><strong>Local runtime</strong><span>Provider not connected</span></div>
            </div>
          </div>
        </aside>

        <main class="main">
          ${
            active === "chats"
              ? chatsView()
              : active === "bots"
                ? botsView()
                : active === "providers"
                  ? providerView()
                  : active === "library"
                    ? libraryView()
                    : active === "code"
                      ? codeView()
                      : genericView(active === "skills" ? "Skills / MCP" : "Settings")
          }
        </main>
      </div>
    `;

    root.querySelectorAll<HTMLButtonElement>("[data-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        active = button.dataset.nav as Section;
        draw();
      });
    });

    root.querySelectorAll<HTMLButtonElement>(".provider-card").forEach((button) => {
      button.addEventListener("click", () => {
        const state = button.querySelector(".provider-state");
        if (!state) return;
        state.textContent = "Detecting…";
        window.setTimeout(() => {
          state.textContent = "Native bridge next";
        }, 650);
      });
    });
  };

  draw();
}
