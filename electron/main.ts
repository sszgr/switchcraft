import path from "node:path";
import fs from "node:fs";
import { execFile } from "node:child_process";
import { performance } from "node:perf_hooks";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, ipcMain, session as electronSession, shell } from "electron";
import { loadSettings, ensureLogDir } from "../src/config.js";
import { builtinDrivers, getDriverById } from "../src/drivers.js";
import { ExecutionEngine } from "../src/executor.js";
import { RunLogger } from "../src/logger.js";
import { ConsoleSession } from "../src/session.js";
import { MockTransport } from "../src/serial/MockTransport.js";
import { NodeSerialTransport } from "../src/serial/NodeSerialTransport.js";
import { loadTemplate, renderScript, validateParams } from "../src/template.js";
import type { AppSettings, SerialSettings } from "../src/types.js";

let mainWindow: BrowserWindow | null = null;
let activeConsole:
  | {
      mode: "mock" | "serial";
      portPath: string;
      driverId: string;
      session: ConsoleSession;
      logger: RunLogger;
    }
  | undefined;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAIN_T0 = performance.now();
const execFileAsync = promisify(execFile);

app.setName("SwitchCraft");
app.setPath("userData", path.join(app.getPath("appData"), "SwitchCraft"));

const safeMode = process.argv.includes("--safe-mode");
if (safeMode && process.platform === "linux") {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch("no-sandbox");
  app.commandLine.appendSwitch("disable-setuid-sandbox");
  app.commandLine.appendSwitch("disable-gpu");
  app.commandLine.appendSwitch("disable-gpu-compositing");
  app.commandLine.appendSwitch("use-gl", "swiftshader");
  app.commandLine.appendSwitch("use-angle", "swiftshader");
}

function startupLogPath(): string {
  const dir = path.join(userDataRoot(), "logs");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "startup-timing.log");
}

function markMainStartup(label: string, extra?: string): void {
  const elapsedMs = Math.round(performance.now() - MAIN_T0);
  const suffix = extra ? ` | ${extra}` : "";
  const line = `${new Date().toISOString()} [startup][main] ${label} +${elapsedMs}ms${suffix}`;
  process.stdout.write(`${line}\n`);
  try {
    fs.appendFileSync(startupLogPath(), `${line}\n`, "utf-8");
  } catch {
    // Best effort only.
  }
}

function resourceRoot(): string {
  if (app.isPackaged) return app.getAppPath();

  const fromCwd = process.cwd();
  const fromDist = path.resolve(__dirname, "..", "..");
  const candidates = [fromCwd, fromDist];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "renderer", "index.html"))) {
      return candidate;
    }
  }

  return fromCwd;
}

function userDataRoot(): string {
  return app.getPath("userData");
}

function settingsPath(): string {
  return path.join(userDataRoot(), "settings.json");
}

function readProjectVersion(): string {
  try {
    const pkgPath = path.join(resourceRoot(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as { version?: unknown };
    if (typeof pkg.version === "string" && pkg.version.trim().length > 0) {
      return pkg.version.trim();
    }
  } catch {
    // fall back
  }
  return app.getVersion();
}

function readAppSettings(): AppSettings {
  return loadSettings(settingsPath());
}

function writeAppSettings(settings: AppSettings): void {
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  fs.writeFileSync(settingsPath(), `${JSON.stringify(settings, null, 2)}\n`, "utf-8");
}

function templatesDir(): string {
  return path.join(userDataRoot(), "templates");
}

function bundledTemplatesDir(): string {
  return path.join(resourceRoot(), "templates");
}

function seedTemplatesIfNeeded(dir: string): void {
  const hasUserTemplates = fs
    .readdirSync(dir)
    .some((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
  if (hasUserTemplates) return;

  const bundledDir = bundledTemplatesDir();
  if (!fs.existsSync(bundledDir)) return;

  for (const file of fs.readdirSync(bundledDir)) {
    if (!file.endsWith(".yml") && !file.endsWith(".yaml")) continue;
    const src = path.join(bundledDir, file);
    const dst = path.join(dir, file);
    if (fs.existsSync(dst)) continue;
    fs.copyFileSync(src, dst);
  }
}

function ensureTemplatesDir(): string {
  const dir = templatesDir();
  fs.mkdirSync(dir, { recursive: true });
  seedTemplatesIfNeeded(dir);
  return dir;
}

function toTemplatePath(fileName: string): string {
  const name = fileName.trim().replace(/[\\/:*?"<>|]/g, "-");
  const withExt = name.endsWith(".yml") || name.endsWith(".yaml") ? name : `${name}.yml`;
  return path.join(ensureTemplatesDir(), withExt);
}

function normalizeTemplatePath(inputPath: string): string {
  const dir = ensureTemplatesDir();
  const resolved = path.resolve(inputPath);
  const base = `${path.resolve(dir)}${path.sep}`;
  if (!resolved.startsWith(base)) {
    throw new Error("Template path must be inside templates directory.");
  }
  return resolved;
}

function createWindow(): void {
  markMainStartup("create-window:start");
  const iconPath = path.join(resourceRoot(), "renderer", "assets", "switchcraft-logo.png");
  mainWindow = new BrowserWindow({
    width: 1540,
    height: 980,
    minWidth: 1280,
    minHeight: 860,
    autoHideMenuBar: true,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      sandbox: false
    }
  });

  const htmlPath = path.join(resourceRoot(), "renderer", "index.html");
  let didFinishLoad = false;
  const enableDevtools = process.argv.includes("--devtools");

  void mainWindow.loadFile(htmlPath);
  markMainStartup("create-window:load-file-dispatched", htmlPath);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.webContents.on("did-finish-load", () => {
    didFinishLoad = true;
    markMainStartup("renderer:did-finish-load");
  });
  mainWindow.webContents.on("did-fail-load", (_event, code, description, url) => {
    markMainStartup("renderer:did-fail-load", `code=${code} desc=${description} url=${url}`);
    process.stderr.write(`Renderer load failed: code=${code} description=${description} url=${url}\n`);
  });
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    markMainStartup("renderer:render-process-gone", `reason=${details.reason} exitCode=${details.exitCode}`);
    process.stderr.write(`Renderer process gone: reason=${details.reason} exitCode=${details.exitCode}\n`);
  });
  mainWindow.webContents.on("before-input-event", (_event, input) => {
    if (input.type === "keyDown" && (input.key === "F12" || (input.control && input.shift && input.key === "I"))) {
      if (mainWindow?.webContents.isDevToolsOpened()) mainWindow.webContents.closeDevTools();
      else mainWindow?.webContents.openDevTools({ mode: "detach" });
    }
  });
  if (enableDevtools) mainWindow.webContents.openDevTools({ mode: "detach" });

  setTimeout(() => {
    if (!mainWindow || didFinishLoad) return;
    void mainWindow.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent("<h2>SwitchCraft Renderer Timeout</h2><p>Renderer did not finish loading.</p>")
    );
  }, 5000);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function applyOfflineGuard(): void {
  const settings = readAppSettings();
  if (!settings.offlineMode) return;

  const blockProtocols = ["http:", "https:", "ws:", "wss:"];
  electronSession.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    try {
      const url = new URL(details.url);
      callback({ cancel: blockProtocols.includes(url.protocol) });
      return;
    } catch {
      callback({ cancel: false });
      return;
    }
  });
}

ipcMain.handle("app:get-meta", () => {
  const settings = readAppSettings();
  return {
    name: "SwitchCraft",
    version: readProjectVersion(),
    electronVersion: process.versions.electron,
    root: resourceRoot(),
    locale: settings.locale
  };
});

ipcMain.handle("settings:get", () => {
  return readAppSettings();
});

ipcMain.handle("settings:set-locale", (_event, locale: "zh-CN" | "en-US") => {
  const settings = readAppSettings();
  settings.locale = locale;
  writeAppSettings(settings);
  return settings;
});

ipcMain.handle("app:open-external", async (_event, url: string) => {
  if (!/^https?:\/\//i.test(url)) return { ok: false };
  await shell.openExternal(url);
  return { ok: true };
});

ipcMain.handle("serial:list-ports", async () => {
  const t0 = performance.now();
  const node = new NodeSerialTransport();
  const realPorts = await withTimeout(node.listPorts().catch(() => []), 3000, []);
  const modePorts = await withTimeout(listComPortsFromMode(), 1500, []);
  const map = new Map<string, { path: string; manufacturer?: string }>();
  for (const p of realPorts) {
    if (!p?.path) continue;
    if (!map.has(p.path)) map.set(p.path, p);
  }
  for (const p of modePorts) {
    if (!p?.path) continue;
    if (!map.has(p.path)) map.set(p.path, p);
  }
  const sorted = Array.from(map.values()).sort((a, b) => a.path.localeCompare(b.path));
  markMainStartup("ipc:serial-list-ports", `count=${sorted.length} cost=${Math.round(performance.now() - t0)}ms`);
  return sorted;
});

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs);
    })
  ]);
}

async function listComPortsFromMode(): Promise<Array<{ path: string; manufacturer?: string }>> {
  if (process.platform !== "win32") return [];
  try {
    const { stdout, stderr } = await execFileAsync("cmd.exe", ["/d", "/s", "/c", "mode"], { timeout: 1200 });
    const text = `${stdout ?? ""}\n${stderr ?? ""}`;
    const matches = text.match(/\bCOM\d+\b/gi) ?? [];
    const uniq = Array.from(new Set(matches.map((x) => x.toUpperCase())));
    return uniq
      .sort((a, b) => a.localeCompare(b))
      .map((path) => ({ path, manufacturer: "mode" }));
  } catch {
    return [];
  }
}

ipcMain.handle("drivers:list", () => {
  return builtinDrivers.map((d) => ({ id: d.id, vendor: d.vendor }));
});

ipcMain.handle("template:list", () => {
  const dir = ensureTemplatesDir();
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      path: path.join(dir, name)
    }));
});

ipcMain.handle("template:load", (_event, templatePath: string) => {
  const resolved = normalizeTemplatePath(templatePath);
  const yamlText = fs.readFileSync(resolved, "utf-8");
  const tpl = loadTemplate(resolved);
  return {
    path: resolved,
    fileName: path.basename(resolved),
    yamlText,
    template: tpl
  };
});

ipcMain.handle(
  "template:save",
  (
    _event,
    payload: {
      path?: string;
      fileName?: string;
      yamlText: string;
    }
  ) => {
    const fileName = payload.fileName?.trim();
    const targetPath = payload.path ? normalizeTemplatePath(payload.path) : toTemplatePath(fileName ?? "template.yml");
    fs.writeFileSync(targetPath, payload.yamlText, "utf-8");
    const template = loadTemplate(targetPath);
    return {
      path: targetPath,
      fileName: path.basename(targetPath),
      template
    };
  }
);

ipcMain.handle("template:delete", (_event, templatePath: string) => {
  const resolved = normalizeTemplatePath(templatePath);
  if (!fs.existsSync(resolved)) return { ok: true };
  fs.unlinkSync(resolved);
  return { ok: true };
});

ipcMain.handle("template:preview", (_event, templatePath: string, params: Record<string, unknown>) => {
  const tpl = loadTemplate(normalizeTemplatePath(templatePath));
  validateParams(tpl.fields, params);
  const commands = renderScript(tpl.script, params);
  return { commands };
});

interface ExecutePayload {
  templatePath: string;
  params: Record<string, unknown>;
  mode: "mock" | "serial";
  portPath?: string;
  serial?: Partial<SerialSettings>;
  driverId?: string;
}

function createRunLogger(prefix: string): RunLogger {
  const settings = readAppSettings();
  ensureLogDir(settings.logDir);
  const runId = `${prefix}-${new Date().toISOString().replaceAll(":", "-")}`;
  return new RunLogger(settings.logDir, runId);
}

function resolveDriver(driverId: string | undefined, settings: AppSettings) {
  return (
    (driverId ? getDriverById(driverId) : undefined) ??
    (settings.defaultDriver ? getDriverById(settings.defaultDriver) : undefined) ??
    builtinDrivers[0]
  );
}

function bindSessionEvents(session: ConsoleSession, logger: RunLogger): void {
  let rxLineBuffer = "";

  const flushRxLine = () => {
    const line = rxLineBuffer;
    rxLineBuffer = "";
    const normalized = line.replace(/\r/g, "\\r").replace(/\n/g, "\\n").trim();
    if (!normalized) return;
    logger.log("RX", normalized);
    mainWindow?.webContents.send("run:log", { level: "RX", message: line });
  };

  session.on("rx", (chunk) => {
    mainWindow?.webContents.send("console:log", { level: "RX", message: chunk });
    for (const ch of chunk) {
      if (ch === "\r" || ch === "\n") {
        flushRxLine();
      } else {
        rxLineBuffer += ch;
      }
    }
  });

  session.on("tx", (chunk) => {
    const normalized = chunk.replace(/\r/g, "\\r").replace(/\n/g, "\\n").trim();
    if (!normalized) return;
    logger.log("TX", normalized);
    mainWindow?.webContents.send("run:log", { level: "TX", message: chunk });
  });

  session.on("close", () => {
    mainWindow?.webContents.send("console:state", { connected: false });
  });
}

async function buildSession(opts: {
  mode: "mock" | "serial";
  portPath?: string;
  serial?: Partial<SerialSettings>;
  driverId?: string;
}) {
  const settings = readAppSettings();
  const driver = resolveDriver(opts.driverId, settings);
  const transport = opts.mode === "serial" ? new NodeSerialTransport() : new MockTransport();
  const serial: SerialSettings = {
    ...settings.serial,
    ...(opts.serial ?? {})
  };

  let portPath = opts.portPath;
  if (!portPath) {
    const ports = await transport.listPorts();
    portPath = ports[0]?.path;
  }
  if (!portPath) throw new Error("No serial port available.");

  const session = new ConsoleSession(transport, driver, {
    autoConfirmYN: settings.autoConfirmYN,
    commandTimeoutMs: settings.commandTimeoutMs,
    sendIntervalMs: settings.sendIntervalMs
  });
  return { settings, driver, serial, portPath, session };
}

async function closeActiveConsole(): Promise<void> {
  if (!activeConsole) return;
  const closing = activeConsole;
  activeConsole = undefined;
  try {
    await closing.session.disconnect();
  } finally {
    closing.logger.saveTxt();
    closing.logger.saveHtml();
    mainWindow?.webContents.send("console:state", { connected: false });
  }
}

ipcMain.handle(
  "console:connect",
  async (
    _event,
    payload: { mode: "mock" | "serial"; portPath?: string; serial?: Partial<SerialSettings>; driverId?: string }
  ) => {
    await closeActiveConsole();
    const built = await buildSession(payload);
    const logger = createRunLogger("console");
    bindSessionEvents(built.session, logger);
    await built.session.connect(built.portPath, built.serial);
    await built.session.sendRaw("\r");

    activeConsole = {
      mode: payload.mode,
      portPath: built.portPath,
      driverId: built.driver.id,
      session: built.session,
      logger
    };

    const state = {
      connected: true,
      mode: payload.mode,
      portPath: built.portPath,
      driverId: built.driver.id
    };
    mainWindow?.webContents.send("console:state", state);
    return state;
  }
);

ipcMain.handle("console:disconnect", async () => {
  await closeActiveConsole();
  return { connected: false };
});

ipcMain.handle("console:send-command", async (_event, command: string) => {
  if (!activeConsole) throw new Error("Console is not connected.");
  await activeConsole.session.sendInteractive(command);
  return { ok: true };
});

ipcMain.handle("console:get-state", () => {
  if (!activeConsole) return { connected: false };
  return {
    connected: true,
    mode: activeConsole.mode,
    portPath: activeConsole.portPath,
    driverId: activeConsole.driverId
  };
});

async function executeRun(payload: ExecutePayload) {
  const settings = readAppSettings();
  const driver = resolveDriver(payload.driverId, settings);
  const logger = createRunLogger("gui-run");

  let session: ConsoleSession;
  let transient = false;

  if (activeConsole) {
    if (activeConsole.driverId !== driver.id) {
      throw new Error("Console driver mismatch. Reconnect console with selected driver.");
    }
    if (payload.mode === "serial" && payload.portPath && activeConsole.portPath !== payload.portPath) {
      throw new Error("Console port mismatch. Reconnect console with selected COM port.");
    }
    session = activeConsole.session;
  } else {
    const built = await buildSession(payload);
    bindSessionEvents(built.session, logger);
    await built.session.connect(built.portPath, built.serial);
    await built.session.sendRaw("\r");
    session = built.session;
    transient = true;
  }

  try {
    const template = loadTemplate(normalizeTemplatePath(payload.templatePath));
    const engine = new ExecutionEngine(session, settings, logger);
    const result = await engine.runTemplate(template, payload.params, driver);
    mainWindow?.webContents.send("run:done", result);
    return result;
  } finally {
    logger.saveTxt();
    logger.saveHtml();
    if (transient) await session.disconnect();
  }
}

ipcMain.handle("run:execute", async (_event, payload: ExecutePayload) => {
  return executeRun(payload);
});

ipcMain.handle("run:execute-mock", async (_event, templatePath: string, params: Record<string, unknown>) => {
  return executeRun({ templatePath, params, mode: "mock" });
});

ipcMain.handle("diagnostics:startup-mark", (_event, payload: { label?: string; elapsedMs?: number }) => {
  const label = String(payload?.label ?? "unknown");
  const elapsed = Number(payload?.elapsedMs);
  const extra = Number.isFinite(elapsed) ? `rendererElapsed=${Math.round(elapsed)}ms` : undefined;
  markMainStartup(`renderer:${label}`, extra);
  return { ok: true };
});

app.whenReady().then(() => {
  markMainStartup("app:ready");
  markMainStartup("offline-guard:start");
  applyOfflineGuard();
  markMainStartup("offline-guard:done");
  createWindow();

  app.on("activate", () => {
    markMainStartup("app:activate");
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  markMainStartup("app:window-all-closed");
  void closeActiveConsole();
  if (process.platform !== "darwin") app.quit();
});

markMainStartup("process:start");
