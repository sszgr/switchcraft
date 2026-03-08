import fs from "node:fs";
import path from "node:path";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "RX" | "TX";

export class RunLogger {
  private readonly lines: string[] = [];

  constructor(private readonly dir: string, private readonly runId: string) {}

  log(level: LogLevel, message: string): void {
    const line = `${new Date().toISOString()} [${level}] ${message}`;
    this.lines.push(line);
    process.stdout.write(`${line}\n`);
  }

  saveTxt(): string {
    const file = path.join(this.dir, `${this.runId}.txt`);
    fs.writeFileSync(file, `${this.lines.join("\n")}\n`, "utf-8");
    return file;
  }

  saveHtml(): string {
    const body = this.lines
      .map((l) => l.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"))
      .join("<br/>\n");
    const html = `<!doctype html><html><head><meta charset=\"utf-8\"/><title>SwitchCraft Log</title></head><body><pre>${body}</pre></body></html>`;
    const file = path.join(this.dir, `${this.runId}.html`);
    fs.writeFileSync(file, html, "utf-8");
    return file;
  }
}
