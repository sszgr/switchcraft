import type { SerialSettings } from "../types.js";
import type { SerialTransport } from "../session.js";

export class NodeSerialTransport implements SerialTransport {
  private dataListener: ((chunk: string) => void) | undefined;
  private closeListener: (() => void) | undefined;

  private port: {
    write(data: string): void;
    close(cb: (err?: Error | null) => void): void;
    on(event: "data", listener: (data: Buffer) => void): void;
    on(event: "close", listener: () => void): void;
  } | null = null;

  async open(path: string, settings: SerialSettings): Promise<void> {
    const serialport = await loadSerialPort();
    if (!serialport?.SerialPort) {
      throw new Error("Package 'serialport' is not installed. Use MockTransport or install serialport.");
    }

    const { SerialPort } = serialport;
    const port = new SerialPort({
      path,
      baudRate: settings.baudRate,
      dataBits: settings.dataBits,
      stopBits: settings.stopBits,
      parity: settings.parity,
      rtscts: settings.flowControl === "rtscts",
      xon: settings.flowControl === "xonxoff",
      xoff: settings.flowControl === "xonxoff",
      autoOpen: false
    });

    await new Promise<void>((resolve, reject) => {
      port.open((err: Error | null | undefined) => (err ? reject(err) : resolve()));
    });

    port.on("data", (buf: Buffer) => this.dataListener?.(buf.toString("utf-8")));
    port.on("close", () => this.closeListener?.());
    this.port = port;
  }

  async write(data: string): Promise<void> {
    if (!this.port) throw new Error("Serial port not open.");
    this.port.write(data);
  }

  async close(): Promise<void> {
    if (!this.port) return;
    const current = this.port;
    this.port = null;
    await new Promise<void>((resolve, reject) => {
      current.close((err) => (err ? reject(err) : resolve()));
    });
  }

  async listPorts(): Promise<Array<{ path: string; manufacturer?: string }>> {
    const serialport = await loadSerialPort();
    if (!serialport?.SerialPort) return [];
    const ports = await serialport.SerialPort.list();
    return ports.map((p: { path: string; manufacturer?: string }) => ({
      path: p.path,
      manufacturer: p.manufacturer
    }));
  }

  onData(listener: (chunk: string) => void): void {
    this.dataListener = listener;
  }

  onClose(listener: () => void): void {
    this.closeListener = listener;
  }
}

async function loadSerialPort(): Promise<{ SerialPort?: any } | undefined> {
  try {
    const importer = new Function("return import('serialport')") as () => Promise<{ SerialPort?: any }>;
    return await importer();
  } catch {
    return undefined;
  }
}
