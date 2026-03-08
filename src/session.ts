import { EventEmitter } from "node:events";
import type { DeviceDriver, SerialSettings } from "./types.js";

export interface SerialTransport {
  open(path: string, settings: SerialSettings): Promise<void>;
  write(data: string): Promise<void>;
  close(): Promise<void>;
  listPorts(): Promise<Array<{ path: string; manufacturer?: string }>>;
  onData(listener: (chunk: string) => void): void;
  onClose(listener: () => void): void;
}

export interface SessionOptions {
  autoConfirmYN: boolean;
  commandTimeoutMs: number;
  sendIntervalMs: number;
}

export class ConsoleSession extends EventEmitter {
  private buffer = "";
  private connected = false;
  private interactiveTxBuffer = "";

  constructor(
    private readonly transport: SerialTransport,
    private readonly driver: DeviceDriver,
    private readonly options: SessionOptions
  ) {
    super();
    this.transport.onData((chunk) => {
      this.buffer += chunk;
      this.emit("rx", chunk);
      this.handleBuiltins(chunk);
    });
    this.transport.onClose(() => {
      this.connected = false;
      this.emit("close");
    });
  }

  async connect(portPath: string, settings: SerialSettings): Promise<void> {
    await this.transport.open(portPath, settings);
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    await this.transport.close();
    this.connected = false;
    this.interactiveTxBuffer = "";
  }

  async sendRaw(command: string): Promise<void> {
    await this.transport.write(command);
    this.emit("tx", command);
  }

  async sendCommand(command: string): Promise<void> {
    if (!this.connected) throw new Error("Session is not connected.");
    this.buffer = "";
    await this.sendRaw(`${command}\r\n`);
    await this.waitForPrompt();
    await sleep(this.options.sendIntervalMs);
  }

  async sendInteractive(command: string): Promise<void> {
    if (!this.connected) throw new Error("Session is not connected.");
    await this.transport.write(command);
    this.recordInteractiveTx(command);
  }

  private async waitForPrompt(): Promise<void> {
    const timeout = this.options.commandTimeoutMs;
    const started = Date.now();

    while (Date.now() - started < timeout) {
      if (this.driver.promptRegex.test(this.buffer)) return;
      await sleep(30);
    }

    throw new Error(`Command timeout after ${timeout}ms.`);
  }

  private handleBuiltins(chunk: string): void {
    for (const pattern of this.driver.paginationPatterns) {
      if (pattern.test(chunk)) {
        void this.sendRaw(this.driver.moreResponse);
      }
    }

    if (this.options.autoConfirmYN && /\[Y\/N\]|\(Y\/N\)/i.test(chunk)) {
      void this.sendRaw("Y\r\n");
    }
  }

  private recordInteractiveTx(chunk: string): void {
    for (const ch of chunk) {
      if (ch === "\r" || ch === "\n") {
        this.emit("tx", this.interactiveTxBuffer);
        this.interactiveTxBuffer = "";
        continue;
      }
      if (ch === "\u0008" || ch === "\u007f") {
        if (this.interactiveTxBuffer.length > 0) {
          this.interactiveTxBuffer = this.interactiveTxBuffer.slice(0, -1);
        }
        continue;
      }
      if (ch >= " ") {
        this.interactiveTxBuffer += ch;
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
