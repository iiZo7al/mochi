use serde::Serialize;
use std::process::{Command, Stdio};
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

const CREDENTIAL_SERVICE: &str = "dev.zo7al.mochi";
const ISLAND_WIDTH: f64 = 336.0;
const ISLAND_HEIGHT: f64 = 64.0;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProviderStatus {
    id: String,
    installed: bool,
    executable: Option<String>,
    version: Option<String>,
    auth_state: String,
    detail: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProviderConnectResult {
    launched: bool,
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

fn command_text(executable: &str, args: &[&str]) -> Option<(bool, String, String)> {
    let output = Command::new(executable)
        .args(args)
        .stdin(Stdio::null())
        .output()
        .ok()?;

    Some((
        output.status.success(),
        String::from_utf8_lossy(&output.stdout).trim().to_string(),
        String::from_utf8_lossy(&output.stderr).trim().to_string(),
    ))
}

fn provider_version(executable: &str) -> Option<String> {
    let (_, stdout, stderr) = command_text(executable, &["--version"])?;
    let text = if stdout.is_empty() { stderr } else { stdout };
    text.lines()
        .map(str::trim)
        .find(|line| !line.is_empty())
        .map(ToOwned::to_owned)
}

fn auth_status(provider: &str, executable: &str) -> (String, String) {
    match provider {
        "codex" => {
            if let Some((_, stdout, stderr)) = command_text(executable, &["login", "status"]) {
                let combined = format!("{stdout}\n{stderr}");
                if combined.contains("Logged in using") {
                    return ("connected".into(), stdout.lines().next().unwrap_or("Connected").into());
                }
                if combined.to_lowercase().contains("not logged in") {
                    return ("disconnected".into(), "ChatGPT is not connected.".into());
                }
            }
            ("unknown".into(), "Codex runtime detected. Sign-in status could not be verified.".into())
        }
        "claude-code" => {
            if let Some((_, stdout, _)) = command_text(executable, &["auth", "status", "--json"]) {
                if let Ok(value) = serde_json::from_str::<serde_json::Value>(&stdout) {
                    if value.get("loggedIn").and_then(|v| v.as_bool()) == Some(true) {
                        let email = value
                            .get("email")
                            .and_then(|v| v.as_str())
                            .unwrap_or("Claude account");
                        return ("connected".into(), format!("Connected as {email}."));
                    }
                    if value.get("loggedIn").and_then(|v| v.as_bool()) == Some(false) {
                        return ("disconnected".into(), "Claude is not connected.".into());
                    }
                }
            }
            ("unknown".into(), "Claude Code runtime detected. Sign-in status could not be verified.".into())
        }
        "opencode" => (
            "ready".into(),
            "OpenCode is ready; free models can work without an account. Extra providers can be connected from its auth menu.".into(),
        ),
        "gemini" => (
            "unknown".into(),
            "Gemini CLI is installed. Connect opens its interactive Google sign-in flow.".into(),
        ),
        "grok" => (
            "unknown".into(),
            "Grok CLI is installed. Connect opens its account sign-in flow.".into(),
        ),
        "ollama" => (
            "ready".into(),
            "Ollama is local and does not require an account.".into(),
        ),
        _ => ("unknown".into(), "Provider detected.".into()),
    }
}

#[tauri::command]
fn provider_status(provider_id: String) -> ProviderStatus {
    if provider_id == "custom" {
        return ProviderStatus {
            id: provider_id,
            installed: true,
            executable: None,
            version: None,
            auth_state: "configurable".into(),
            detail: "Add an OpenAI-compatible or custom endpoint.".into(),
        };
    }

    let path = executable_for(&provider_id).and_then(locate);
    match path {
        Some(executable) => {
            let version = provider_version(&executable);
            let (auth_state, detail) = auth_status(&provider_id, &executable);
            ProviderStatus {
                id: provider_id,
                installed: true,
                executable: Some(executable),
                version,
                auth_state,
                detail,
            }
        }
        None => ProviderStatus {
            id: provider_id,
            installed: false,
            executable: None,
            version: None,
            auth_state: "missing".into(),
            detail: "Runtime not detected on PATH.".into(),
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

#[cfg(target_os = "windows")]
fn quote_powershell(value: &str) -> String {
    format!("'{}'", value.replace(''', "''"))
}

#[cfg(target_os = "windows")]
fn launch_interactive(executable: &str, args: &[&str]) -> Result<(), String> {
    let mut command = quote_powershell(executable);
    for arg in args {
        command.push(' ');
        command.push_str(&quote_powershell(arg));
    }

    let script = format!("& {command}");
    Command::new("powershell.exe")
        .args(["-NoLogo", "-NoExit", "-Command", &script])
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("Could not open provider sign-in: {error}"))
}

#[cfg(not(target_os = "windows"))]
fn launch_interactive(executable: &str, args: &[&str]) -> Result<(), String> {
    Command::new(executable)
        .args(args)
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("Could not open provider sign-in: {error}"))
}

#[tauri::command]
fn provider_connect(provider_id: String) -> Result<ProviderConnectResult, String> {
    if provider_id == "custom" {
        return Ok(ProviderConnectResult {
            launched: false,
            detail: "Configure the endpoint inside Mochi.".into(),
        });
    }

    if provider_id == "ollama" {
        return Ok(ProviderConnectResult {
            launched: false,
            detail: "Ollama does not require sign-in.".into(),
        });
    }

    let executable_name = executable_for(&provider_id)
        .ok_or_else(|| format!("Unknown provider: {provider_id}"))?;
    let executable = locate(executable_name)
        .ok_or_else(|| format!("{executable_name} is not installed or is not on PATH."))?;

    let args: Vec<&str> = match provider_id.as_str() {
        "codex" => vec!["login"],
        "claude-code" => vec!["auth", "login", "--claudeai"],
        "opencode" => vec!["auth", "login"],
        "gemini" => vec![],
        "grok" => vec!["--no-auto-update", "login"],
        _ => vec![],
    };

    launch_interactive(&executable, &args)?;

    Ok(ProviderConnectResult {
        launched: true,
        detail: "Sign-in opened in a terminal. Mochi will re-check the provider when you return.".into(),
    })
}

fn credential_entry(key: &str) -> Result<keyring::Entry, String> {
    keyring::Entry::new(CREDENTIAL_SERVICE, key)
        .map_err(|error| format!("Credential store is unavailable: {error}"))
}

#[tauri::command]
fn provider_secret_set(key: String, value: String) -> Result<(), String> {
    let entry = credential_entry(&key)?;
    if value.trim().is_empty() {
        let _ = entry.delete_credential();
        return Ok(());
    }
    entry
        .set_password(&value)
        .map_err(|error| format!("Could not save provider credential: {error}"))
}

#[tauri::command]
fn provider_secret_has(key: String) -> Result<bool, String> {
    let entry = credential_entry(&key)?;
    Ok(entry.get_password().is_ok())
}

#[tauri::command]
fn provider_secret_clear(key: String) -> Result<(), String> {
    let entry = credential_entry(&key)?;
    let _ = entry.delete_credential();
    Ok(())
}

#[tauri::command]
fn show_main_window(app: tauri::AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Main window is unavailable.".to_string())?;
    window.show().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())
}

fn create_island(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    if app.get_webview_window("island").is_some() {
        return Ok(());
    }

    let mut builder = WebviewWindowBuilder::new(
        app,
        "island",
        WebviewUrl::App("island.html".into()),
    )
    .title("Mochi Island")
    .inner_size(ISLAND_WIDTH, ISLAND_HEIGHT)
    .resizable(false)
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .skip_taskbar(true);

    if let Some(monitor) = app.primary_monitor()? {
        let scale = monitor.scale_factor();
        let logical_width = monitor.size().width as f64 / scale;
        let x = ((logical_width - ISLAND_WIDTH) / 2.0).max(0.0);
        builder = builder.position(x, 0.0);
    }

    builder.build()?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            create_island(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            provider_status,
            provider_status_all,
            provider_connect,
            provider_secret_set,
            provider_secret_has,
            provider_secret_clear,
            show_main_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running Mochi");
}
