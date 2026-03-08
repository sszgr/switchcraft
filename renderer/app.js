const runtimeApi = resolveApi();
const AUTHOR_URL = "https://github.com/sszgr";
const PROJECT_URL = "https://github.com/sszgr/switchcraft";
const AUTHOR_NAME = "sszgr";
const BOOT_T0 = performance.now();
let terminal = null;
let fitAddon = null;

const I18N = {
  "zh-CN": {
    headerSubtitle: "网络设备控制台自动化客户端",
    langLabel: "语言",
    tabTemplate: "模板管理",
    tabExecute: "执行中心",
    aboutBtn: "关于",
    aboutTitle: "关于 SwitchCraft",
    aboutDesc: "SwitchCraft 是一个基于 Electron 的桌面工具，提供面向网络设备控制台配置的参数化自动化执行能力。",
    aboutVersion: "版本: v{{version}}",
    aboutElectron: "Electron: v{{version}}",
    aboutAuthorPrefix: "作者: {{author}} -",
    aboutProjectPrefix: "项目地址:",
    aboutWechatPrefix: "微信公众号:",
    aboutWechatTip: "扫码关注，获取更新与技术分享",
    deleteTitle: "删除模板",
    deleteMessage: "确定删除模板 {{name}} ?",
    deleteCancel: "取消",
    deleteConfirm: "删除",
    tplListTitle: "模板列表",
    reloadBtn: "刷新",
    newBtn: "新建模板",
    deleteBtn: "删除模板",
    tplEditorTitle: "模板编辑",
    saveBtn: "保存",
    fileNameLabel: "文件名",
    yamlLabel: "YAML 内容",
    editorSaved: "已保存",
    editorDirty: "已修改（未保存）",
    noTemplate: "暂无模板",
    confirmDelete: "确认删除模板 {{name}} ?",
    unsavedSwitch: "当前编辑未保存，确认切换模板？",
    notSavedDelete: "当前模板尚未保存，无法删除",
    saveBeforeRun: "模板已修改，请先保存",
    saveBeforePreview: "请先保存模板后再预览命令",
    saveBeforeExecute: "请先保存模板后再执行",
    parseFailed: "模板解析失败: {{msg}}",
    yamlValid: "YAML 格式正确",
    missingYaml: "YAML 顶层必须是对象",
    missingNameDevice: "缺少 name/device",
    fieldsArray: "fields 必须是数组",
    scriptArray: "script 必须是数组",
    execConfigTitle: "执行配置",
    execTemplateLabel: "执行模板",
    comPortLabel: "COM 口",
    refreshPortsBtn: "刷新端口",
    refreshingPortsBtn: "刷新中...",
    copyPreviewBtn: "复制",
    copiedPreviewBtn: "已复制",
    clearConsoleBtn: "清屏",
    clearLogBtn: "清空",
    latestLogPrefix: "最新日志: ",
    modeLabel: "连接模式",
    driverLabel: "设备驱动",
    baudLabel: "波特率",
    dataBitsLabel: "数据位",
    stopBitsLabel: "停止位",
    parityLabel: "校验位",
    flowLabel: "流控",
    paramsTitle: "参数输入",
    previewBtn: "命令预览",
    runBtn: "开始执行",
    previewTitle: "命令预览",
    consoleTitle: "控制台",
    opLogTitle: "日志详情",
    connectBtn: "连接",
    disconnectBtn: "释放",
    statusIdle: "空闲",
    statusReady: "就绪",
    statusPreviewed: "已预览",
    statusRunning: "执行中",
    statusDone: "完成",
    statusFailed: "失败",
    runningStart: "开始执行",
    runningDone: "执行结束: {{result}}",
    resultSuccess: "成功",
    resultFailed: "失败",
    templateSaved: "已保存模板: {{name}}",
    templateRefreshed: "模板列表已刷新",
    templateDeleted: "已删除模板: {{path}}",
    selectedTemplateSummary: "{{name}} | {{device}} | 字段 {{count}} | {{desc}}",
    noTemplateLoaded: "未加载模板",
    commandLines: "{{count}} 行",
    mockLabel: "Mock",
    serialLabel: "Serial",
    noPorts: "无可用端口",
    portOnlineShort: "在线",
    portOfflineShort: "离线",
    consoleConnected: "已连接",
    consoleDisconnected: "未连接",
    consoleConnectFirst: "请先连接控制台"
  },
  "en-US": {
    headerSubtitle: "Network device console automation client",
    langLabel: "Language",
    tabTemplate: "Template Manager",
    tabExecute: "Execution Center",
    aboutBtn: "About",
    aboutTitle: "About SwitchCraft",
    aboutDesc:
      "SwitchCraft is now a desktop GUI tool based on Electron, with a parameterized automation core for network console configuration.",
    aboutVersion: "Version: v{{version}}",
    aboutElectron: "Electron: v{{version}}",
    aboutAuthorPrefix: "Author: {{author}} -",
    aboutProjectPrefix: "Project URL:",
    aboutWechatPrefix: "WeChat Official Account:",
    aboutWechatTip: "Scan to follow for updates and technical sharing",
    deleteTitle: "Delete Template",
    deleteMessage: "Delete template {{name}} ?",
    deleteCancel: "Cancel",
    deleteConfirm: "Delete",
    tplListTitle: "Templates",
    reloadBtn: "Refresh",
    newBtn: "New Template",
    deleteBtn: "Delete Template",
    tplEditorTitle: "Template Editor",
    saveBtn: "Save",
    fileNameLabel: "File Name",
    yamlLabel: "YAML Content",
    editorSaved: "Saved",
    editorDirty: "Modified (unsaved)",
    noTemplate: "No templates",
    confirmDelete: "Delete template {{name}} ?",
    unsavedSwitch: "Unsaved changes. Switch template anyway?",
    notSavedDelete: "Current template is not saved.",
    saveBeforeRun: "Template changed. Save first.",
    saveBeforePreview: "Save template before preview.",
    saveBeforeExecute: "Save template before execute.",
    parseFailed: "Template parse failed: {{msg}}",
    yamlValid: "YAML is valid",
    missingYaml: "YAML root must be an object",
    missingNameDevice: "Missing name/device",
    fieldsArray: "fields must be an array",
    scriptArray: "script must be an array",
    execConfigTitle: "Execution Config",
    execTemplateLabel: "Template",
    comPortLabel: "COM Port",
    refreshPortsBtn: "Refresh Ports",
    refreshingPortsBtn: "Refreshing...",
    copyPreviewBtn: "Copy",
    copiedPreviewBtn: "Copied",
    clearConsoleBtn: "Clear Screen",
    clearLogBtn: "Clear",
    latestLogPrefix: "Latest Log: ",
    modeLabel: "Mode",
    driverLabel: "Device Driver",
    baudLabel: "Baud Rate",
    dataBitsLabel: "Data Bits",
    stopBitsLabel: "Stop Bits",
    parityLabel: "Parity",
    flowLabel: "Flow Control",
    paramsTitle: "Parameters",
    previewBtn: "Command Preview",
    runBtn: "Run",
    previewTitle: "Command Preview",
    consoleTitle: "Console",
    opLogTitle: "Log Details",
    connectBtn: "Connect",
    disconnectBtn: "Release",
    statusIdle: "Idle",
    statusReady: "Ready",
    statusPreviewed: "Previewed",
    statusRunning: "Running",
    statusDone: "Done",
    statusFailed: "Failed",
    runningStart: "Execution started",
    runningDone: "Execution finished: {{result}}",
    resultSuccess: "success",
    resultFailed: "failed",
    templateSaved: "Template saved: {{name}}",
    templateRefreshed: "Template list refreshed",
    templateDeleted: "Template deleted: {{path}}",
    selectedTemplateSummary: "{{name}} | {{device}} | fields {{count}} | {{desc}}",
    noTemplateLoaded: "No template loaded",
    commandLines: "{{count}} lines",
    mockLabel: "Mock",
    serialLabel: "Serial",
    noPorts: "No available ports",
    portOnlineShort: "online",
    portOfflineShort: "offline",
    consoleConnected: "Connected",
    consoleDisconnected: "Disconnected",
    consoleConnectFirst: "Please connect console first"
  }
};

const state = {
  locale: "en-US",
  templateItems: [],
  drivers: [],
  ports: [],
  currentPath: "",
  currentTemplate: null,
  executionTemplate: null,
  editorDirty: false,
  running: false,
  consoleConnected: false,
  rightPane: "preview",
  appVersion: "-",
  electronVersion: "-",
  portRefreshing: false,
  latestLogLine: ""
};

const el = {
  appVersion: document.getElementById("appVersion"),
  aboutBtn: document.getElementById("aboutBtn"),
  langSelect: document.getElementById("langSelect"),
  tabTemplate: document.getElementById("tabTemplate"),
  tabExecute: document.getElementById("tabExecute"),
  pageTemplate: document.getElementById("pageTemplate"),
  pageExecute: document.getElementById("pageExecute"),

  templateList: document.getElementById("templateList"),
  reloadBtn: document.getElementById("reloadBtn"),
  newBtn: document.getElementById("newBtn"),
  deleteBtn: document.getElementById("deleteBtn"),
  saveBtn: document.getElementById("saveBtn"),
  fileNameInput: document.getElementById("fileNameInput"),
  yamlEditor: document.getElementById("yamlEditor"),
  editorStatus: document.getElementById("editorStatus"),

  execTemplateSelect: document.getElementById("execTemplateSelect"),
  execConfigTitle: document.getElementById("execConfigTitle"),
  execConfigBody: document.getElementById("execConfigBody"),
  modeSelect: document.getElementById("modeSelect"),
  portSelect: document.getElementById("portSelect"),
  refreshPortsBtn: document.getElementById("refreshPortsBtn"),
  driverSelect: document.getElementById("driverSelect"),
  baudRateInput: document.getElementById("baudRateInput"),
  dataBitsSelect: document.getElementById("dataBitsSelect"),
  stopBitsSelect: document.getElementById("stopBitsSelect"),
  paritySelect: document.getElementById("paritySelect"),
  flowSelect: document.getElementById("flowSelect"),

  templateSummary: document.getElementById("templateSummary"),
  paramsTitle: document.getElementById("paramsTitle"),
  paramsBody: document.getElementById("paramsBody"),
  paramsForm: document.getElementById("paramsForm"),
  previewBtn: document.getElementById("previewBtn"),
  runBtn: document.getElementById("runBtn"),
  runStatus: document.getElementById("runStatus"),
  previewBox: document.getElementById("previewBox"),
  commandCount: document.getElementById("commandCount"),
  tabPreviewPane: document.getElementById("tabPreviewPane"),
  tabConsolePane: document.getElementById("tabConsolePane"),
  tabLogPane: document.getElementById("tabLogPane"),
  panePreview: document.getElementById("panePreview"),
  paneConsole: document.getElementById("paneConsole"),
  paneLog: document.getElementById("paneLog"),
  previewCopyBtn: document.getElementById("previewCopyBtn"),
  clearConsoleBtn: document.getElementById("clearConsoleBtn"),
  clearLogBtn: document.getElementById("clearLogBtn"),
  latestExecLog: document.getElementById("latestExecLog"),
  consoleBox: document.getElementById("consoleBox"),
  consoleState: document.getElementById("consoleState"),
  opLogBox: document.getElementById("opLogBox"),
  connectBtn: document.getElementById("connectBtn"),
  disconnectBtn: document.getElementById("disconnectBtn"),

  aboutModal: document.getElementById("aboutModal"),
  aboutCloseBtn: document.getElementById("aboutCloseBtn"),
  aboutTitle: document.getElementById("aboutTitle"),
  aboutDesc: document.getElementById("aboutDesc"),
  aboutVersionLine: document.getElementById("aboutVersionLine"),
  aboutElectronLine: document.getElementById("aboutElectronLine"),
  aboutAuthorPrefix: document.getElementById("aboutAuthorPrefix"),
  aboutAuthorLink: document.getElementById("aboutAuthorLink"),
  aboutProjectPrefix: document.getElementById("aboutProjectPrefix"),
  aboutProjectLink: document.getElementById("aboutProjectLink"),
  aboutWechatPrefix: document.getElementById("aboutWechatPrefix"),
  aboutWechatName: document.getElementById("aboutWechatName"),
  aboutWechatQr: document.getElementById("aboutWechatQr"),

  deleteModal: document.getElementById("deleteModal"),
  deleteTitle: document.getElementById("deleteTitle"),
  deleteMessage: document.getElementById("deleteMessage"),
  deleteCloseBtn: document.getElementById("deleteCloseBtn"),
  deleteCancelBtn: document.getElementById("deleteCancelBtn"),
  deleteConfirmBtn: document.getElementById("deleteConfirmBtn")
};

function t(key, vars = {}) {
  const dict = I18N[state.locale] || I18N["en-US"];
  const template = dict[key] || key;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, p1) => String(vars[p1] ?? ""));
}

function applyI18n() {
  setText("headerSubtitle", t("headerSubtitle"));
  setText("aboutBtn", t("aboutBtn"));
  setText("langLabel", t("langLabel"));
  setText("tabTemplate", t("tabTemplate"));
  setText("tabExecute", t("tabExecute"));
  setText("tplListTitle", t("tplListTitle"));
  setText("reloadBtn", t("reloadBtn"));
  setText("newBtn", t("newBtn"));
  setText("deleteBtn", t("deleteBtn"));
  setText("tplEditorTitle", t("tplEditorTitle"));
  setText("saveBtn", t("saveBtn"));
  setText("fileNameLabel", t("fileNameLabel"));
  setText("yamlLabel", t("yamlLabel"));
  setText("execConfigTitle", t("execConfigTitle"));
  setText("execTemplateLabel", t("execTemplateLabel"));
  setText("comPortLabel", t("comPortLabel"));
  updateRefreshPortButton();
  setText("modeLabel", t("modeLabel"));
  setText("driverLabel", t("driverLabel"));
  setText("baudLabel", t("baudLabel"));
  setText("dataBitsLabel", t("dataBitsLabel"));
  setText("stopBitsLabel", t("stopBitsLabel"));
  setText("parityLabel", t("parityLabel"));
  setText("flowLabel", t("flowLabel"));
  setText("paramsTitle", t("paramsTitle"));
  setText("previewBtn", t("previewBtn"));
  setText("runBtn", t("runBtn"));
  setText("tabPreviewPane", t("previewTitle"));
  setText("tabConsolePane", t("consoleTitle"));
  setText("tabLogPane", t("opLogTitle"));
  setText("previewCopyBtn", t("copyPreviewBtn"));
  setText("clearConsoleBtn", t("clearConsoleBtn"));
  setText("clearLogBtn", t("clearLogBtn"));
  setText("connectBtn", t("connectBtn"));
  setText("disconnectBtn", t("disconnectBtn"));
  setText("aboutTitle", t("aboutTitle"));
  setText("aboutDesc", t("aboutDesc"));
  setText("aboutVersionLine", t("aboutVersion", { version: state.appVersion }));
  setText("aboutElectronLine", t("aboutElectron", { version: state.electronVersion }));
  setText("aboutAuthorPrefix", t("aboutAuthorPrefix", { author: AUTHOR_NAME }));
  setText("aboutProjectPrefix", t("aboutProjectPrefix"));
  setText("aboutWechatPrefix", t("aboutWechatPrefix"));
  setText("aboutWechatName", "碎碎冰安全");
  setText("aboutWechatTip", t("aboutWechatTip"));
  if (el.aboutWechatQr) {
    el.aboutWechatQr.alt = t("aboutWechatPrefix");
  }
  if (el.aboutAuthorLink) {
    el.aboutAuthorLink.textContent = AUTHOR_URL;
    el.aboutAuthorLink.href = AUTHOR_URL;
  }
  if (el.aboutProjectLink) {
    el.aboutProjectLink.textContent = PROJECT_URL;
    el.aboutProjectLink.href = PROJECT_URL;
  }
  setText("deleteTitle", t("deleteTitle"));
  setText("deleteCancelBtn", t("deleteCancel"));
  setText("deleteConfirmBtn", t("deleteConfirm"));

  setRunStatus(state.running ? t("statusRunning") : t("statusReady"));
  setConsoleStatus(state.consoleConnected ? t("consoleConnected") : t("consoleDisconnected"));
  el.modeSelect.options[0].text = t("mockLabel");
  el.modeSelect.options[1].text = t("serialLabel");

  markDirty(state.editorDirty);
  renderTemplateList();
  renderSummary();
  renderPorts();
  renderLatestLog();
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function setCommandCount(count) {
  const num = Number(count) || 0;
  el.commandCount.textContent = num > 0 ? t("commandLines", { count: num }) : "";
}

function setPage(page) {
  const isTemplate = page === "template";
  const isExecute = page === "execute";
  el.pageTemplate.classList.toggle("active", isTemplate);
  el.pageExecute.classList.toggle("active", isExecute);
  el.tabTemplate.classList.toggle("active", isTemplate);
  el.tabExecute.classList.toggle("active", isExecute);
  if (isExecute && fitAddon) {
    setTimeout(() => {
      fitAddon.fit();
      terminal?.focus();
    }, 0);
  }
}

function setRightPane(nextPane) {
  state.rightPane = nextPane;
  const isPreview = nextPane === "preview";
  const isConsole = nextPane === "console";
  const isLog = nextPane === "log";
  el.panePreview.classList.toggle("active", isPreview);
  el.paneConsole.classList.toggle("active", isConsole);
  el.paneLog.classList.toggle("active", isLog);
  el.tabPreviewPane.classList.toggle("active", isPreview);
  el.tabConsolePane.classList.toggle("active", isConsole);
  el.tabLogPane.classList.toggle("active", isLog);
  if (isConsole && fitAddon) {
    setTimeout(() => {
      fitAddon.fit();
      terminal?.focus();
    }, 0);
    setTimeout(() => {
      terminal?.focus();
    }, 60);
  }
}

function log(message) {
  const now = formatLogTime(new Date());
  const line = `[${now}] ${message}\n`;
  if (el.opLogBox) {
    el.opLogBox.textContent += line;
    el.opLogBox.scrollTop = el.opLogBox.scrollHeight;
  }
  if (el.latestExecLog) {
    const latestLine = line.trimEnd();
    state.latestLogLine = latestLine;
    renderLatestLog();
  }
}

function renderLatestLog() {
  if (!el.latestExecLog) return;
  const prefix = t("latestLogPrefix");
  const textNode = ensureLatestLogTextNode();
  if (!textNode) return;
  textNode.textContent = state.latestLogLine ? `${prefix}${state.latestLogLine}` : prefix;
  el.latestExecLog.title = state.latestLogLine || "";
  updateLatestLogTicker();
}

function ensureLatestLogTextNode() {
  if (!el.latestExecLog) return null;
  let textNode = el.latestExecLog.querySelector(".latest-exec-log-text");
  if (!textNode) {
    textNode = document.createElement("span");
    textNode.className = "latest-exec-log-text";
    el.latestExecLog.innerHTML = "";
    el.latestExecLog.appendChild(textNode);
  }
  return textNode;
}

function updateLatestLogTicker() {
  if (!el.latestExecLog) return;
  const textNode = ensureLatestLogTextNode();
  if (!textNode) return;

  el.latestExecLog.classList.remove("is-scrolling");
  el.latestExecLog.style.removeProperty("--latest-log-shift");
  el.latestExecLog.style.removeProperty("--latest-log-duration");

  const overflow = textNode.scrollWidth - el.latestExecLog.clientWidth;
  if (overflow <= 0) return;

  const shiftPx = Math.ceil(overflow + 24);
  const pxPerSecond = 60;
  const durationSec = Math.max(6, shiftPx / pxPerSecond);
  el.latestExecLog.style.setProperty("--latest-log-shift", `${shiftPx}px`);
  el.latestExecLog.style.setProperty("--latest-log-duration", `${durationSec.toFixed(2)}s`);
  el.latestExecLog.classList.add("is-scrolling");
}

function formatLogTime(date) {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(3, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}.${ms}`;
}

function logConsole(level, message) {
  void level;
  if (!terminal) return;
  terminal.write(String(message ?? ""));
}

function markStartup(label) {
  const elapsedMs = Math.round(performance.now() - BOOT_T0);
  const line = `[startup][renderer] ${label} +${elapsedMs}ms`;
  console.log(line);
  if (typeof runtimeApi.startupMark === "function") {
    void runtimeApi.startupMark(label, elapsedMs).catch(() => {});
  }
}

function initTerminal() {
  if (terminal) return;
  try {
    // eslint-disable-next-line no-undef
    const { Terminal } = require("@xterm/xterm");
    // eslint-disable-next-line no-undef
    const { FitAddon } = require("@xterm/addon-fit");
    fitAddon = new FitAddon();
    terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: "bar",
      cursorInactiveStyle: "outline",
      convertEol: false,
      fontFamily: "JetBrains Mono, Cascadia Mono, monospace",
      fontSize: 12,
      theme: {
        background: "#0c1722",
        foreground: "#b7e7cf"
      }
    });
    terminal.loadAddon(fitAddon);
    terminal.open(el.consoleBox);
    fitAddon.fit();
    terminal.focus();
    terminal.attachCustomKeyEventHandler((event) => {
      const key = event.key.toLowerCase();
      const hasSelection = Boolean(terminal?.getSelection());
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && key === "c" && hasSelection) {
        const selected = terminal?.getSelection() ?? "";
        if (selected && navigator.clipboard?.writeText) {
          void navigator.clipboard.writeText(selected).catch(() => {});
        }
        return false;
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === "c") {
        const selected = terminal?.getSelection() ?? "";
        if (selected && navigator.clipboard?.writeText) {
          void navigator.clipboard.writeText(selected).catch(() => {});
        }
        return false;
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === "v") {
        if (navigator.clipboard?.readText) {
          void navigator.clipboard
            .readText()
            .then((text) => {
              if (!text || !state.consoleConnected) return;
              void sendConsoleCommand(text).catch(showError);
            })
            .catch(() => {});
        }
        return false;
      }
      return true;
    });
    el.consoleBox.addEventListener("contextmenu", (event) => {
      const selected = terminal?.getSelection() ?? "";
      if (!selected) return;
      event.preventDefault();
      if (navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(selected).catch(() => {});
      }
    });
    terminal.onData((chunk) => {
      if (!state.consoleConnected) return;
      void sendConsoleCommand(chunk).catch(showError);
    });
    window.addEventListener("resize", () => {
      if (fitAddon) fitAddon.fit();
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`xterm init failed: ${msg}`);
  }
}

function setRunStatus(text) {
  el.runStatus.textContent = text;
}

function setConsoleStatus(text) {
  el.consoleState.textContent = text;
  el.consoleState.classList.toggle("is-connected", state.consoleConnected);
  el.consoleState.classList.toggle("is-disconnected", !state.consoleConnected);
}

function openAboutModal() {
  el.aboutModal.classList.remove("hidden");
}

function closeAboutModal() {
  el.aboutModal.classList.add("hidden");
}

function initWechatQr() {
  if (!el.aboutWechatQr) return;
  const hideQr = () => {
    el.aboutWechatQr.classList.add("hidden");
  };
  const showQr = () => {
    el.aboutWechatQr.classList.remove("hidden");
  };
  el.aboutWechatQr.addEventListener("error", hideQr);
  el.aboutWechatQr.addEventListener("load", showQr);
  if (el.aboutWechatQr.complete && el.aboutWechatQr.naturalWidth === 0) {
    hideQr();
  }
}

function openDeleteModal(name) {
  return new Promise((resolve) => {
    setText("deleteMessage", t("deleteMessage", { name }));
    el.deleteModal.classList.remove("hidden");

    const cleanup = () => {
      el.deleteModal.classList.add("hidden");
      el.deleteConfirmBtn.removeEventListener("click", onConfirm);
      el.deleteCancelBtn.removeEventListener("click", onCancel);
      el.deleteCloseBtn.removeEventListener("click", onCancel);
      el.deleteModal.removeEventListener("click", onBackdrop);
    };

    const onConfirm = () => {
      cleanup();
      resolve(true);
    };
    const onCancel = () => {
      cleanup();
      resolve(false);
    };
    const onBackdrop = (event) => {
      if (event.target === el.deleteModal) onCancel();
    };

    el.deleteConfirmBtn.addEventListener("click", onConfirm);
    el.deleteCancelBtn.addEventListener("click", onCancel);
    el.deleteCloseBtn.addEventListener("click", onCancel);
    el.deleteModal.addEventListener("click", onBackdrop);
  });
}

function markDirty(dirty) {
  state.editorDirty = dirty;
  if (!el.editorStatus.dataset.invalid || el.editorStatus.dataset.invalid !== "true") {
    el.editorStatus.textContent = dirty ? t("editorDirty") : t("editorSaved");
    el.editorStatus.classList.remove("error");
  }
}

function setEditorValidation(valid, message) {
  el.editorStatus.dataset.invalid = valid ? "false" : "true";
  el.editorStatus.classList.toggle("error", !valid);
  el.editorStatus.textContent = message;
}

function showError(error) {
  const msg = error instanceof Error ? error.message : String(error);
  setRunStatus(t("statusFailed"));
  log(`[ERROR] ${msg}`);
}

function getYamlLib() {
  try {
    // eslint-disable-next-line no-undef
    return require("js-yaml");
  } catch {
    throw new Error("js-yaml not found");
  }
}

function parseTemplate(yamlText) {
  const yaml = getYamlLib();
  const parsed = yaml.load(yamlText);

  if (!parsed || typeof parsed !== "object") throw new Error(t("missingYaml"));
  if (!parsed.name || !parsed.device) throw new Error(t("missingNameDevice"));
  if (!Array.isArray(parsed.fields)) throw new Error(t("fieldsArray"));
  if (!Array.isArray(parsed.script)) throw new Error(t("scriptArray"));
  if (typeof parsed.name !== "string" || typeof parsed.device !== "string") throw new Error(t("missingNameDevice"));

  const supported = new Set(["string", "number", "boolean", "enum", "list", "textarea"]);
  const seenFieldKeys = new Set();
  for (const field of parsed.fields) {
    if (!field || typeof field !== "object") throw new Error("Invalid field item");
    if (!field.key || !field.type || !field.label) throw new Error("Each field requires key/type/label");
    if (seenFieldKeys.has(field.key)) throw new Error(`Duplicate field key: ${field.key}`);
    seenFieldKeys.add(field.key);
    if (!supported.has(field.type)) throw new Error(`Unsupported field type: ${field.type}`);
    if (field.type === "enum" && !Array.isArray(field.options)) {
      throw new Error(`Enum field '${field.key}' requires options array`);
    }
  }

  for (const line of parsed.script) {
    if (typeof line === "string") continue;
    if (line && typeof line === "object") {
      const entries = Object.entries(line);
      if (entries.length === 1 && entries[0][1] === null) continue;
    }
    throw new Error("Invalid script line format");
  }

  if (parsed.serial !== undefined) {
    if (!parsed.serial || typeof parsed.serial !== "object") {
      throw new Error("serial must be an object");
    }
    const serial = parsed.serial;
    const paritySet = new Set(["none", "even", "odd"]);
    const flowSet = new Set(["none", "rtscts", "xonxoff"]);
    if (serial.baudRate !== undefined && !Number.isFinite(Number(serial.baudRate))) {
      throw new Error("serial.baudRate must be number");
    }
    if (serial.dataBits !== undefined && ![7, 8].includes(Number(serial.dataBits))) {
      throw new Error("serial.dataBits must be 7 or 8");
    }
    if (serial.stopBits !== undefined && ![1, 2].includes(Number(serial.stopBits))) {
      throw new Error("serial.stopBits must be 1 or 2");
    }
    if (serial.parity !== undefined && !paritySet.has(String(serial.parity))) {
      throw new Error("serial.parity must be none/even/odd");
    }
    if (serial.flowControl !== undefined && !flowSet.has(String(serial.flowControl))) {
      throw new Error("serial.flowControl must be none/rtscts/xonxoff");
    }
  }

  return parsed;
}

function renderSummary() {
  const tpl = state.executionTemplate ?? state.currentTemplate;
  if (!tpl) {
    el.templateSummary.textContent = t("noTemplateLoaded");
    return;
  }

  el.templateSummary.textContent = t("selectedTemplateSummary", {
    name: tpl.name,
    device: tpl.device,
    count: tpl.fields.length,
    desc: tpl.description || "-"
  });
}

function renderTemplateList() {
  el.templateList.innerHTML = "";
  if (state.templateItems.length === 0) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.textContent = t("noTemplate");
    btn.disabled = true;
    li.appendChild(btn);
    el.templateList.appendChild(li);
    return;
  }

  for (const item of state.templateItems) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.textContent = item.name;
    if (item.path === state.currentPath) btn.classList.add("active");
    btn.addEventListener("click", async () => {
      await openTemplate(item.path);
      renderTemplateList();
    });
    li.appendChild(btn);
    el.templateList.appendChild(li);
  }
}

function renderExecTemplateOptions() {
  const current = el.execTemplateSelect.value;
  el.execTemplateSelect.innerHTML = "";
  for (const item of state.templateItems) {
    const opt = document.createElement("option");
    opt.value = item.path;
    opt.textContent = item.name;
    el.execTemplateSelect.appendChild(opt);
  }
  if (current && state.templateItems.some((x) => x.path === current)) {
    el.execTemplateSelect.value = current;
  } else if (state.currentPath) {
    el.execTemplateSelect.value = state.currentPath;
  } else if (state.templateItems[0]) {
    el.execTemplateSelect.value = state.templateItems[0].path;
  }
}

function updateRefreshPortButton() {
  if (!el.refreshPortsBtn) return;
  el.refreshPortsBtn.disabled = state.portRefreshing;
  el.refreshPortsBtn.textContent = state.portRefreshing ? t("refreshingPortsBtn") : t("refreshPortsBtn");
}

function normalizePortPath(path) {
  return String(path ?? "")
    .trim()
    .toUpperCase();
}

function createDefaultComPorts() {
  return Array.from({ length: 9 }, (_x, i) => ({
    path: `COM${i + 1}`,
    manufacturer: ""
  }));
}

function buildPortView() {
  const defaults = createDefaultComPorts();
  const onlineMap = new Map();
  for (const p of state.ports) {
    const key = normalizePortPath(p.path);
    if (!key) continue;
    if (!onlineMap.has(key)) onlineMap.set(key, p);
  }

  const inDefault = new Set(defaults.map((x) => normalizePortPath(x.path)));
  const mergedDefaults = defaults.map((item) => {
    const online = onlineMap.get(normalizePortPath(item.path));
    return {
      path: item.path,
      online: Boolean(online),
      manufacturer: online?.manufacturer ?? ""
    };
  });

  const extras = Array.from(onlineMap.values())
    .filter((p) => !inDefault.has(normalizePortPath(p.path)))
    .map((p) => ({
      path: p.path,
      online: true,
      manufacturer: p.manufacturer ?? ""
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  return [...mergedDefaults, ...extras];
}

function applySerialDefaultsFromTemplate(templateObj) {
  const serial = templateObj?.serial;
  if (!serial || typeof serial !== "object") return;

  if (serial.baudRate !== undefined) el.baudRateInput.value = String(serial.baudRate);
  if (serial.dataBits !== undefined) el.dataBitsSelect.value = String(serial.dataBits);
  if (serial.stopBits !== undefined) el.stopBitsSelect.value = String(serial.stopBits);
  if (serial.parity !== undefined) el.paritySelect.value = String(serial.parity);
  if (serial.flowControl !== undefined) el.flowSelect.value = String(serial.flowControl);
}

function autoSelectDriverFromTemplate(templateObj) {
  const device = String(templateObj?.device ?? "").trim().toLowerCase();
  if (!device || state.drivers.length === 0) return;

  const byId = state.drivers.find((d) => String(d.id).toLowerCase() === device);
  if (byId) {
    el.driverSelect.value = byId.id;
    return;
  }

  const byVendor = state.drivers.find((d) => device.includes(String(d.vendor).toLowerCase()));
  if (byVendor) {
    el.driverSelect.value = byVendor.id;
  }
}

async function selectExecutionTemplate(templatePath) {
  if (!templatePath) return;
  const loaded = await runtimeApi.loadTemplate(templatePath);
  state.executionTemplate = loaded.template;
  renderParamsFromTemplate(loaded.template);
  applySerialDefaultsFromTemplate(loaded.template);
  autoSelectDriverFromTemplate(loaded.template);
  renderSummary();
}

async function refreshTemplateList() {
  state.templateItems = await runtimeApi.listTemplates();
  renderTemplateList();
  renderExecTemplateOptions();
}

function renderPorts() {
  const current = el.portSelect.value;
  const portView = buildPortView();
  el.portSelect.innerHTML = "";

  if (portView.length === 0) {
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = t("noPorts");
    el.portSelect.appendChild(placeholder);
    return;
  }

  for (const p of portView) {
    const opt = document.createElement("option");
    opt.value = p.path;
    const vendor = p.manufacturer ? ` (${p.manufacturer})` : "";
    const status = p.online ? t("portOnlineShort") : t("portOfflineShort");
    opt.textContent = `${p.path}${vendor} [${status}]`;
    el.portSelect.appendChild(opt);
  }

  if (current && portView.some((p) => p.path === current)) {
    el.portSelect.value = current;
  } else {
    el.portSelect.value = portView[0]?.path ?? "";
  }
}

function isPortOnline(portPath) {
  const target = normalizePortPath(portPath);
  return state.ports.some((p) => normalizePortPath(p.path) === target);
}

async function refreshPorts() {
  state.portRefreshing = true;
  updateRefreshPortButton();
  try {
    state.ports = await runtimeApi.listSerialPorts();
    renderPorts();
  } finally {
    state.portRefreshing = false;
    updateRefreshPortButton();
  }
}

async function copyPreviewCommands() {
  const text = (el.previewBox.textContent || "").trim();
  if (!text) return;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const shadow = document.createElement("textarea");
    shadow.value = text;
    shadow.setAttribute("readonly", "readonly");
    shadow.style.position = "fixed";
    shadow.style.opacity = "0";
    document.body.appendChild(shadow);
    shadow.select();
    document.execCommand("copy");
    document.body.removeChild(shadow);
  }

  const oldText = t("copyPreviewBtn");
  el.previewCopyBtn.textContent = t("copiedPreviewBtn");
  setTimeout(() => {
    el.previewCopyBtn.textContent = oldText;
  }, 1200);
}

async function refreshPortsForModeChange() {
  await refreshPorts();
}

function renderDrivers() {
  const current = el.driverSelect.value;
  el.driverSelect.innerHTML = "";
  for (const d of state.drivers) {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = `${d.vendor} (${d.id})`;
    el.driverSelect.appendChild(opt);
  }
  if (current && state.drivers.some((x) => x.id === current)) el.driverSelect.value = current;
}

function renderParamsFromTemplate(templateObj) {
  el.paramsForm.innerHTML = "";
  if (!templateObj?.fields) return;

  for (const field of templateObj.fields) {
    const wrap = document.createElement("div");
    wrap.className = "field";

    const label = document.createElement("label");
    label.textContent = `${field.label} (${field.key})${field.required ? " *" : ""}`;
    wrap.appendChild(label);

    let input;
    if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.value = field.default ?? "";
    } else if (field.type === "boolean") {
      input = document.createElement("select");
      input.innerHTML = `<option value="true">true</option><option value="false">false</option>`;
      input.value = String(field.default ?? false);
    } else if (field.type === "enum") {
      input = document.createElement("select");
      const options = Array.isArray(field.options) ? field.options : [];
      input.innerHTML = options.map((v) => `<option value="${v}">${v}</option>`).join("");
      if (field.default !== undefined) input.value = String(field.default);
    } else {
      input = document.createElement("input");
      if (field.type === "number") input.type = "number";
      input.value = field.default ?? "";
      if (field.type === "list") input.placeholder = "a,b,c";
    }

    input.dataset.fieldKey = field.key;
    input.dataset.fieldType = field.type;
    wrap.appendChild(input);
    el.paramsForm.appendChild(wrap);
  }
}

function collectParams() {
  const params = {};
  for (const node of el.paramsForm.querySelectorAll("[data-field-key]")) {
    const key = node.dataset.fieldKey;
    const type = node.dataset.fieldType;
    const raw = node.value;

    if (type === "number") params[key] = raw === "" ? undefined : Number(raw);
    else if (type === "boolean") params[key] = raw === "true";
    else if (type === "list") params[key] = raw.split(",").map((v) => v.trim()).filter(Boolean);
    else params[key] = raw;
  }
  return params;
}

async function openTemplate(templatePath) {
  const res = await runtimeApi.loadTemplate(templatePath);
  state.currentPath = res.path;
  state.currentTemplate = res.template;
  el.fileNameInput.value = res.fileName;
  el.yamlEditor.value = res.yamlText;
  markDirty(false);
  setEditorValidation(true, t("editorSaved"));
  el.previewBox.textContent = "";
  setCommandCount(0);
  renderSummary();
  renderTemplateList();
  renderExecTemplateOptions();
  autoSelectDriverFromTemplate(state.currentTemplate);
  await selectExecutionTemplate(el.execTemplateSelect.value || state.currentPath);
}

function createNewTemplate() {
  state.currentPath = "";
  state.currentTemplate = null;
  el.fileNameInput.value = "new-template.yml";
  el.yamlEditor.value = defaultTemplateYaml();
  markDirty(true);
  try {
    state.currentTemplate = parseTemplate(el.yamlEditor.value);
    renderSummary();
    renderParamsFromTemplate(state.currentTemplate);
    setEditorValidation(true, t("editorDirty"));
  } catch {
    renderSummary();
  }
  el.previewBox.textContent = "";
  setCommandCount(0);
  renderExecTemplateOptions();
  state.executionTemplate = state.currentTemplate;
  autoSelectDriverFromTemplate(state.currentTemplate);
  renderSummary();
}

async function saveTemplate() {
  const yamlText = el.yamlEditor.value;
  parseTemplate(yamlText);
  const fileName = (el.fileNameInput.value || "new-template.yml").trim();
  const payload = {
    path: state.currentPath || undefined,
    fileName,
    yamlText
  };

  const res = await runtimeApi.saveTemplate(payload);
  state.currentPath = res.path;
  state.currentTemplate = parseTemplate(yamlText);
  autoSelectDriverFromTemplate(state.currentTemplate);
  el.fileNameInput.value = res.fileName;
  markDirty(false);
  setEditorValidation(true, t("editorSaved"));
  await refreshTemplateList();
  renderSummary();
  log(t("templateSaved", { name: res.fileName }));
}

function syncTemplateFromEditor() {
  markDirty(true);
  try {
    state.currentTemplate = parseTemplate(el.yamlEditor.value);
    renderSummary();
    renderParamsFromTemplate(state.currentTemplate);
    setEditorValidation(true, t("yamlValid"));
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    setEditorValidation(false, t("parseFailed", { msg }));
    el.templateSummary.textContent = t("parseFailed", { msg });
  }
}

async function runPreview() {
  const templatePath = el.execTemplateSelect.value;
  if (!templatePath) throw new Error(t("saveBeforePreview"));

  const params = collectParams();
  const res = await runtimeApi.previewTemplate(templatePath, params);
  el.previewBox.textContent = res.commands.join("\n");
  setCommandCount(res.commands.length);
  setRightPane("preview");
  setRunStatus(t("statusPreviewed"));
}

function getSerialSettings() {
  return {
    baudRate: Number(el.baudRateInput.value || 9600),
    dataBits: Number(el.dataBitsSelect.value) || 8,
    stopBits: Number(el.stopBitsSelect.value) || 1,
    parity: el.paritySelect.value,
    flowControl: el.flowSelect.value
  };
}

function getConsoleConnectPayload() {
  const mode = el.modeSelect.value;
  return {
    mode,
    portPath: mode === "serial" ? el.portSelect.value || undefined : undefined,
    driverId: el.driverSelect.value || undefined,
    serial: getSerialSettings()
  };
}

async function refreshConsoleState() {
  const stateRes = await runtimeApi.getConsoleState();
  state.consoleConnected = !!stateRes?.connected;
  setConsoleStatus(state.consoleConnected ? t("consoleConnected") : t("consoleDisconnected"));
}

async function connectConsole() {
  if (el.modeSelect.value === "serial" && (!el.portSelect.value || !isPortOnline(el.portSelect.value))) {
    throw new Error(t("noPorts"));
  }
  await runtimeApi.connectConsole(getConsoleConnectPayload());
  state.consoleConnected = true;
  setConsoleStatus(t("consoleConnected"));
  terminal?.focus();
}

async function disconnectConsole() {
  await runtimeApi.disconnectConsole();
  state.consoleConnected = false;
  setConsoleStatus(t("consoleDisconnected"));
}

async function sendConsoleCommand(data) {
  if (!state.consoleConnected) throw new Error(t("consoleConnectFirst"));
  await runtimeApi.sendConsoleCommand(String(data ?? ""));
}

async function runExecute() {
  const templatePath = el.execTemplateSelect.value;
  if (!templatePath) throw new Error(t("saveBeforeExecute"));
  if (!state.consoleConnected) throw new Error(t("consoleConnectFirst"));

  const params = collectParams();
  state.running = true;
  setRunStatus(t("statusRunning"));
  log(t("runningStart"));

  try {
    const result = await runtimeApi.executeRun({
      templatePath,
      params,
      mode: el.modeSelect.value,
      portPath: el.modeSelect.value === "serial" ? el.portSelect.value || undefined : undefined,
      driverId: el.driverSelect.value || undefined,
      serial: getSerialSettings()
    });

    const ok = !!result?.success;
    setRunStatus(ok ? t("statusDone") : t("statusFailed"));
    log(
      t("runningDone", {
        result: ok ? t("resultSuccess") : t("resultFailed")
      })
    );
  } finally {
    state.running = false;
  }
}

async function boot() {
  markStartup("boot-start");
  const [meta, settings] = await Promise.all([runtimeApi.getMeta(), runtimeApi.getSettings()]);
  markStartup("meta-settings-loaded");

  state.locale = settings.locale || meta.locale || "en-US";
  state.appVersion = meta.version || "-";
  state.electronVersion = meta.electronVersion || "-";
  el.langSelect.value = state.locale;
  el.appVersion.textContent = `v${state.appVersion}`;

  state.drivers = await runtimeApi.listDrivers();
  renderDrivers();
  markStartup("drivers-loaded");

  el.baudRateInput.value = String(settings.serial?.baudRate ?? 9600);
  el.dataBitsSelect.value = String(settings.serial?.dataBits ?? 8);
  el.stopBitsSelect.value = String(settings.serial?.stopBits ?? 1);
  el.paritySelect.value = settings.serial?.parity ?? "none";
  el.flowSelect.value = settings.serial?.flowControl ?? "none";
  if (settings.defaultDriver) el.driverSelect.value = settings.defaultDriver;
  el.modeSelect.value = "serial";

  await refreshTemplateList();
  markStartup("templates-listed");
  if (state.templateItems.length > 0) {
    await openTemplate(state.templateItems[0].path);
  } else {
    createNewTemplate();
  }
  markStartup("template-opened");

  applyI18n();
  markStartup("i18n-applied");
  await refreshConsoleState();
  setRunStatus(t("statusReady"));
  setPage("template");
  markStartup("boot-ready");
}

el.tabTemplate.addEventListener("click", () => setPage("template"));
el.tabExecute.addEventListener("click", async () => {
  setPage("execute");
  await refreshPorts().catch(showError);
});
el.tabPreviewPane.addEventListener("click", () => setRightPane("preview"));
el.tabConsolePane.addEventListener("click", () => setRightPane("console"));
el.tabLogPane.addEventListener("click", () => setRightPane("log"));
el.reloadBtn.addEventListener("click", async () => {
  try {
    await refreshTemplateList();
    setEditorValidation(true, t("templateRefreshed"));
  } catch (error) {
    showError(error);
  }
});
el.newBtn.addEventListener("click", () => createNewTemplate());

el.deleteBtn.addEventListener("click", async () => {
  try {
    if (!state.currentPath) throw new Error(t("notSavedDelete"));
    const name = el.fileNameInput.value || state.currentPath;
    const ok = await openDeleteModal(name);
    if (!ok) return;

    await runtimeApi.deleteTemplate(state.currentPath);
    log(t("templateDeleted", { path: state.currentPath }));

    await refreshTemplateList();
    if (state.templateItems.length > 0) {
      await openTemplate(state.templateItems[0].path);
    } else {
      createNewTemplate();
    }
  } catch (error) {
    showError(error);
  }
});

el.saveBtn.addEventListener("click", () => saveTemplate().catch(showError));
el.yamlEditor.addEventListener("input", syncTemplateFromEditor);

el.langSelect.addEventListener("change", async () => {
  state.locale = el.langSelect.value;
  await runtimeApi.setLocale(state.locale);
  applyI18n();
});

el.aboutBtn.addEventListener("click", openAboutModal);
el.aboutCloseBtn.addEventListener("click", closeAboutModal);
el.previewCopyBtn.addEventListener("click", () => copyPreviewCommands().catch(showError));
el.clearConsoleBtn.addEventListener("click", () => {
  terminal?.clear();
  terminal?.focus();
});
el.clearLogBtn.addEventListener("click", () => {
  if (el.opLogBox) el.opLogBox.textContent = "";
  state.latestLogLine = "";
  renderLatestLog();
});
el.aboutAuthorLink.addEventListener("click", async (event) => {
  event.preventDefault();
  await runtimeApi.openExternal(AUTHOR_URL).catch(showError);
});
el.aboutProjectLink.addEventListener("click", async (event) => {
  event.preventDefault();
  await runtimeApi.openExternal(PROJECT_URL).catch(showError);
});
el.aboutModal.addEventListener("click", (event) => {
  if (event.target === el.aboutModal) closeAboutModal();
});

el.execTemplateSelect.addEventListener("change", async () => {
  try {
    await selectExecutionTemplate(el.execTemplateSelect.value);
  } catch (error) {
    showError(error);
  }
});

el.refreshPortsBtn.addEventListener("click", () => refreshPorts().catch(showError));
el.modeSelect.addEventListener("change", async () => {
  await refreshPortsForModeChange().catch(showError);
});
el.previewBtn.addEventListener("click", () => runPreview().catch(showError));
el.runBtn.addEventListener("click", () => runExecute().catch(showError));
el.connectBtn.addEventListener("click", () => connectConsole().catch(showError));
el.disconnectBtn.addEventListener("click", () => disconnectConsole().catch(showError));

runtimeApi.onRunLog((item) => {
  log(`[${item.level}] ${String(item.message).trim()}`);
});

runtimeApi.onConsoleLog((item) => {
  logConsole("", item.message);
});

runtimeApi.onConsoleState((nextState) => {
  state.consoleConnected = !!nextState?.connected;
  setConsoleStatus(state.consoleConnected ? t("consoleConnected") : t("consoleDisconnected"));
  if (state.consoleConnected) terminal?.focus();
});

runtimeApi.onRunDone((result) => {
  const ok = !!result?.success;
  setRunStatus(ok ? t("statusDone") : t("statusFailed"));
});

window.addEventListener("resize", updateLatestLogTicker);
initWechatQr();

applyI18n();
initTerminal();
setRightPane("preview");
setRunStatus(t("statusIdle"));
renderLatestLog();
markStartup("script-ready");
boot().catch(showError);

function defaultTemplateYaml() {
  return `name: New-Template\ndevice: h3c-comware\ndescription: new template\nserial:\n  baudRate: 9600\n  dataBits: 8\n  stopBits: 1\n  parity: none\n  flowControl: none\nfields:\n  - key: interfaces\n    type: list\n    label: Interface List\n    required: true\n  - key: vlan\n    type: string\n    label: VLAN\n    default: all\nscript:\n  - system-view\n  - foreach iface in interfaces:\n  - '  interface {{iface}}'\n  - '  port link-type trunk'\n  - '  port trunk permit vlan {{vlan}}'\n  - '  quit'\n  - return\n`;
}

function resolveApi() {
  if (window.switchcraft) return window.switchcraft;

  try {
    // eslint-disable-next-line no-undef
    const { ipcRenderer } = require("electron");
    return {
      getMeta: () => ipcRenderer.invoke("app:get-meta"),
      openExternal: (url) => ipcRenderer.invoke("app:open-external", url),
      getSettings: () => ipcRenderer.invoke("settings:get"),
      setLocale: (locale) => ipcRenderer.invoke("settings:set-locale", locale),
      startupMark: (label, elapsedMs) => ipcRenderer.invoke("diagnostics:startup-mark", { label, elapsedMs }),
      listSerialPorts: () => ipcRenderer.invoke("serial:list-ports"),
      listDrivers: () => ipcRenderer.invoke("drivers:list"),
      connectConsole: (payload) => ipcRenderer.invoke("console:connect", payload),
      disconnectConsole: () => ipcRenderer.invoke("console:disconnect"),
      sendConsoleCommand: (command) => ipcRenderer.invoke("console:send-command", command),
      getConsoleState: () => ipcRenderer.invoke("console:get-state"),
      listTemplates: () => ipcRenderer.invoke("template:list"),
      loadTemplate: (templatePath) => ipcRenderer.invoke("template:load", templatePath),
      saveTemplate: (payload) => ipcRenderer.invoke("template:save", payload),
      deleteTemplate: (templatePath) => ipcRenderer.invoke("template:delete", templatePath),
      previewTemplate: (templatePath, params) => ipcRenderer.invoke("template:preview", templatePath, params),
      executeRun: (payload) => ipcRenderer.invoke("run:execute", payload),
      executeMock: (templatePath, params) => ipcRenderer.invoke("run:execute-mock", templatePath, params),
      onRunLog: (handler) => {
        const listener = (_event, payload) => handler(payload);
        ipcRenderer.on("run:log", listener);
        return () => ipcRenderer.removeListener("run:log", listener);
      },
      onRunDone: (handler) => {
        const listener = (_event, payload) => handler(payload);
        ipcRenderer.on("run:done", listener);
        return () => ipcRenderer.removeListener("run:done", listener);
      },
      onConsoleLog: (handler) => {
        const listener = (_event, payload) => handler(payload);
        ipcRenderer.on("console:log", listener);
        return () => ipcRenderer.removeListener("console:log", listener);
      },
      onConsoleState: (handler) => {
        const listener = (_event, payload) => handler(payload);
        ipcRenderer.on("console:state", listener);
        return () => ipcRenderer.removeListener("console:state", listener);
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Renderer bridge init failed: ${message}`);
  }
}
