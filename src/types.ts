export type FieldType = "string" | "number" | "boolean" | "enum" | "list" | "textarea";

export interface TemplateField {
  key: string;
  type: FieldType;
  label: string;
  required?: boolean;
  default?: unknown;
  options?: string[];
  pattern?: string;
  min?: number;
  max?: number;
}

export interface CommandTemplate {
  name: string;
  device: string;
  description?: string;
  fields: TemplateField[];
  script: string[];
}

export interface DeviceDriver {
  id: string;
  vendor: string;
  promptRegex: RegExp;
  systemViewCommand: string;
  exitCommand: string;
  paginationPatterns: RegExp[];
  moreResponse: string;
}

export interface SerialSettings {
  baudRate: number;
  dataBits: 7 | 8;
  stopBits: 1 | 2;
  parity: "none" | "even" | "odd";
  flowControl: "none" | "rtscts" | "xonxoff";
}

export interface SshSettings {
  port: number;
  username: string;
  password: string;
  readyTimeoutMs: number;
}

export type ConsoleMode = "mock" | "serial" | "ssh";
export type ConnectionSettings = SerialSettings | SshSettings;

export interface AppSettings {
  serial: SerialSettings;
  ssh: SshSettings;
  defaultDriver?: string;
  sendIntervalMs: number;
  logDir: string;
  autoConfirmYN: boolean;
  commandTimeoutMs: number;
  autoReconnect: boolean;
  offlineMode: boolean;
  locale: "zh-CN" | "en-US";
}

export interface RunContext {
  template: CommandTemplate;
  params: Record<string, unknown>;
  driver: DeviceDriver;
}

export interface ExecutionResult {
  success: boolean;
  commands: string[];
  startedAt: string;
  endedAt: string;
  error?: string;
}
