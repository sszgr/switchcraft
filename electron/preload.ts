import { contextBridge, ipcRenderer } from "electron";

type LogItem = { level: string; message: string };

contextBridge.exposeInMainWorld("switchcraft", {
  getMeta: () => ipcRenderer.invoke("app:get-meta"),
  openExternal: (url: string) => ipcRenderer.invoke("app:open-external", url),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  setLocale: (locale: "zh-CN" | "en-US") => ipcRenderer.invoke("settings:set-locale", locale),
  listSerialPorts: () => ipcRenderer.invoke("serial:list-ports"),
  listDrivers: () => ipcRenderer.invoke("drivers:list"),
  listTemplates: () => ipcRenderer.invoke("template:list"),
  loadTemplate: (templatePath: string) => ipcRenderer.invoke("template:load", templatePath),
  saveTemplate: (payload: { path?: string; fileName?: string; yamlText: string }) =>
    ipcRenderer.invoke("template:save", payload),
  deleteTemplate: (templatePath: string) => ipcRenderer.invoke("template:delete", templatePath),
  previewTemplate: (templatePath: string, params: Record<string, unknown>) =>
    ipcRenderer.invoke("template:preview", templatePath, params),
  executeRun: (payload: {
    templatePath: string;
    params: Record<string, unknown>;
    mode: "mock" | "serial";
    portPath?: string;
    serial?: {
      baudRate?: number;
      dataBits?: 7 | 8;
      stopBits?: 1 | 2;
      parity?: "none" | "even" | "odd";
      flowControl?: "none" | "rtscts" | "xonxoff";
    };
    driverId?: string;
  }) => ipcRenderer.invoke("run:execute", payload),
  executeMock: (templatePath: string, params: Record<string, unknown>) =>
    ipcRenderer.invoke("run:execute-mock", templatePath, params),
  onRunLog: (handler: (item: LogItem) => void) => {
    const listener = (_event: unknown, payload: LogItem) => handler(payload);
    ipcRenderer.on("run:log", listener);
    return () => ipcRenderer.removeListener("run:log", listener);
  },
  onRunDone: (handler: (result: unknown) => void) => {
    const listener = (_event: unknown, payload: unknown) => handler(payload);
    ipcRenderer.on("run:done", listener);
    return () => ipcRenderer.removeListener("run:done", listener);
  }
});
