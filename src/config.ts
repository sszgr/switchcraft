import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { AppSettings } from "./types.js";

const defaultLogDir = path.join(os.homedir(), "switchcraft-logs");

export const defaultSettings: AppSettings = {
  serial: {
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: "none",
    flowControl: "none"
  },
  sendIntervalMs: 50,
  logDir: defaultLogDir,
  autoConfirmYN: false,
  commandTimeoutMs: 5000,
  autoReconnect: false,
  offlineMode: true,
  locale: "en-US"
};

export function loadSettings(filePath = "settings.json"): AppSettings {
  if (!fs.existsSync(filePath)) return defaultSettings;
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Partial<AppSettings>;
  return {
    ...defaultSettings,
    ...raw,
    serial: {
      ...defaultSettings.serial,
      ...(raw.serial ?? {})
    }
  };
}

export function ensureLogDir(logDir: string): void {
  fs.mkdirSync(logDir, { recursive: true });
}
