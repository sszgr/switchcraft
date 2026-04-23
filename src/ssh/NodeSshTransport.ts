import type { ConnectionSettings, SshSettings } from "../types.js";
import type { ConsoleTransport } from "../session.js";

type SshClient = {
  connect(config: Record<string, unknown>): void;
  on(event: "ready", listener: () => void): void;
  on(event: "error", listener: (error: Error) => void): void;
  on(event: "close", listener: () => void): void;
  on(event: "end", listener: () => void): void;
  on(
    event: "keyboard-interactive",
    listener: (
      name: string,
      instructions: string,
      instructionsLang: string,
      prompts: Array<{ prompt: string; echo: boolean }>,
      finish: (answers: string[]) => void
    ) => void
  ): void;
  shell(
    windowOptions: Record<string, unknown>,
    callback: (error: Error | undefined, stream: SshStream) => void
  ): void;
  end(): void;
};

type SshStream = {
  write(data: string): void;
  end(): void;
  on(event: "data", listener: (data: Buffer) => void): void;
  on(event: "close", listener: () => void): void;
};

export class NodeSshTransport implements ConsoleTransport {
  private dataListener: ((chunk: string) => void) | undefined;
  private closeListener: (() => void) | undefined;
  private client: SshClient | null = null;
  private stream: SshStream | null = null;
  private emittedClose = false;

  async open(target: string, settings: ConnectionSettings): Promise<void> {
    const ssh = settings as SshSettings;
    const ssh2 = await loadSsh2();
    if (!ssh2?.Client) {
      throw new Error("Package 'ssh2' is not installed. Install ssh2 to use SSH mode.");
    }
    if (!target.trim()) {
      throw new Error("SSH host is required.");
    }
    if (!ssh.username.trim()) {
      throw new Error("SSH username is required.");
    }

    const client = new ssh2.Client() as SshClient;
    this.client = client;
    this.stream = null;
    this.emittedClose = false;

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finishResolve = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const finishReject = (error: Error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };
      const notifyClosed = () => {
        if (this.emittedClose) return;
        this.emittedClose = true;
        this.closeListener?.();
      };

      client.on("keyboard-interactive", (_name, _instructions, _lang, prompts, finish) => {
        if (prompts.length > 0) {
          finish(prompts.map(() => ssh.password));
        } else {
          finish([]);
        }
      });
      client.on("ready", () => {
        client.shell({ term: "vt100", rows: 40, cols: 120 }, (error, stream) => {
          if (error) {
            finishReject(error);
            return;
          }
          this.stream = stream;
          stream.on("data", (data: Buffer) => this.dataListener?.(data.toString("utf-8")));
          stream.on("close", () => notifyClosed());
          finishResolve();
        });
      });
      client.on("error", (error) => finishReject(error));
      client.on("close", () => notifyClosed());
      client.on("end", () => notifyClosed());
      client.connect({
        host: target.trim(),
        port: ssh.port,
        username: ssh.username,
        password: ssh.password,
        readyTimeout: ssh.readyTimeoutMs,
        tryKeyboard: true
      });
    });
  }

  async write(data: string): Promise<void> {
    if (!this.stream) throw new Error("SSH shell is not open.");
    this.stream.write(data);
  }

  async close(): Promise<void> {
    this.stream?.end();
    this.stream = null;
    this.client?.end();
    this.client = null;
  }

  async listPorts(): Promise<Array<{ path: string; manufacturer?: string }>> {
    return [];
  }

  onData(listener: (chunk: string) => void): void {
    this.dataListener = listener;
  }

  onClose(listener: () => void): void {
    this.closeListener = listener;
  }
}

async function loadSsh2(): Promise<{ Client?: new () => SshClient } | undefined> {
  try {
    const importer = new Function("return import('ssh2')") as () => Promise<{ Client?: new () => SshClient }>;
    return await importer();
  } catch {
    return undefined;
  }
}
