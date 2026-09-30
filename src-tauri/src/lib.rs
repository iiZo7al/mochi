use serde::Serialize;
use std::process::Command;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProviderStatus {
    id: String,
    installed: bool,
    executable: Option<String>,
    detail: String,
}

fn executable_for(provider: &str) -> Option<&'static str> {
    match provider {
        "codex" => Some("codex"),
        "claude-code" => Some("claude"),
        "opencode" => Some("opencode"),
        "gemini" => Some("gemini"),
        "grok" => Some("grok"),
        "ollama" => Some("ollama"),
        "custom" => None,
        _ => None,
    }
}

fn locate(executable: &str) -> Option<String> {
    let (finder, args): (&str, Vec<&str>) = if cfg!(target_os = "windows") {
        ("where.exe", vec![executable])
    } else {
        ("which", vec![executable])
    };

    let output = Command::new(finder).args(args).output().ok()?;
    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    stdout
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty())
        .map(ToOwned::to_owned)
}

#[tauri::command]
fn provider_status(provider_id: String) -> ProviderStatus {
    if provider_id == "custom" {
        return ProviderStatus {
            id: provider_id,
            installed: true,
            executable: None,
            detail: "Custom provider configuration is available.".into(),
        };
    }

    let executable_name = executable_for(&provider_id);
    let path = executable_name.and_then(locate);
    let installed = path.is_some();

    ProviderStatus {
        id: provider_id,
        installed,
        executable: path,
        detail: if installed {
            "Local runtime detected.".into()
        } else {
            "Runtime not detected on PATH.".into()
        },
    }
}

#[tauri::command]
fn provider_status_all() -> Vec<ProviderStatus> {
    [
        "codex",
        "claude-code",
        "opencode",
        "gemini",
        "grok",
        "custom",
        "ollama",
    ]
    .into_iter()
    .map(|id| provider_status(id.to_string()))
    .collect()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            provider_status,
            provider_status_all
        ])
        .run(tauri::generate_context!())
        .expect("error while running Mochi");
}
