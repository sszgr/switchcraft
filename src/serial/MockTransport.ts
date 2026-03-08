import type { SerialSettings } from "../types.js";
import type { SerialTransport } from "../session.js";

const EOL = "\r\n";
const fakePorts = [{ path: "COM1", manufacturer: "MockLab" }];

type ViewMode = "user" | "config" | "interface" | "vlan";
type LinkMode = "access" | "trunk";

interface IfConfig {
  shutdown: boolean;
  description: string;
  mode: LinkMode;
  accessVlan: number;
  trunkVlans: Set<number>;
}

interface MockState {
  hostname: string;
  view: ViewMode;
  currentInterface: string;
  currentVlan: number | null;
  vlans: Map<number, string>;
  interfaces: Map<string, IfConfig>;
}

function createInterfaceDefaults(): Map<string, IfConfig> {
  const map = new Map<string, IfConfig>();
  for (let i = 1; i <= 4; i += 1) {
    map.set(`eth${i}`, {
      shutdown: i === 4,
      description: "",
      mode: "access",
      accessVlan: 1,
      trunkVlans: new Set([1])
    });
  }
  return map;
}

export class MockTransport implements SerialTransport {
  private dataListener: ((chunk: string) => void) | undefined;
  private closeListener: (() => void) | undefined;
  private opened = false;
  private inputBuffer = "";
  private lastCharWasCR = false;
  private readonly state: MockState = {
    hostname: "MockCore",
    view: "user",
    currentInterface: "",
    currentVlan: null,
    vlans: new Map<number, string>([[1, "default"]]),
    interfaces: createInterfaceDefaults()
  };

  async open(_path: string, _settings: SerialSettings): Promise<void> {
    this.opened = true;
    this.inputBuffer = "";
    this.lastCharWasCR = false;
    this.state.hostname = "MockCore";
    this.state.view = "user";
    this.state.currentInterface = "";
    this.state.currentVlan = null;
    this.state.vlans = new Map<number, string>([[1, "default"]]);
    this.state.interfaces = createInterfaceDefaults();
    this.emitLine("");
    this.emitLine("MockOS Network Simulator 1.0.0");
    this.emitLine("Copyright (c) 2026 SwitchCraft MockLab");
    this.emitLine("Type ? for available commands.");
    this.emitPrompt();
  }

  async write(data: string): Promise<void> {
    if (!this.opened) throw new Error("Mock serial is not open.");
    for (const ch of data) {
      if (ch === "\r") {
        this.lastCharWasCR = true;
        this.emit(EOL);
        this.handleLine(this.inputBuffer);
        this.inputBuffer = "";
        continue;
      }
      if (ch === "\n") {
        if (this.lastCharWasCR) {
          this.lastCharWasCR = false;
          continue;
        }
        this.emit(EOL);
        this.handleLine(this.inputBuffer);
        this.inputBuffer = "";
        continue;
      }
      this.lastCharWasCR = false;

      if (ch === "\u0003") {
        this.inputBuffer = "";
        this.emit("^C");
        this.emit(EOL);
        this.emitPrompt();
        continue;
      }

      if (ch === "\u0008" || ch === "\u007f") {
        if (this.inputBuffer.length > 0) {
          this.inputBuffer = this.inputBuffer.slice(0, -1);
          this.emit("\b \b");
        }
        continue;
      }

      if (ch >= " ") {
        this.inputBuffer += ch;
        this.emit(ch);
      }
    }
  }

  async close(): Promise<void> {
    this.opened = false;
    this.inputBuffer = "";
    this.closeListener?.();
  }

  async listPorts(): Promise<Array<{ path: string; manufacturer?: string }>> {
    return fakePorts;
  }

  onData(listener: (chunk: string) => void): void {
    this.dataListener = listener;
  }

  onClose(listener: () => void): void {
    this.closeListener = listener;
  }

  private handleLine(raw: string): void {
    const cmd = normalize(raw);
    if (!cmd) {
      this.emitPrompt();
      return;
    }

    if (/^(help|\?)$/i.test(cmd)) {
      this.emit(this.helpByView());
      this.emitPrompt();
      return;
    }

    if (/^(return)$/i.test(cmd)) {
      this.state.view = "user";
      this.state.currentInterface = "";
      this.state.currentVlan = null;
      this.emitPrompt();
      return;
    }

    if (/^(quit|exit)$/i.test(cmd)) {
      if (this.state.view === "interface" || this.state.view === "vlan") {
        this.state.view = "config";
      } else if (this.state.view === "config") {
        this.state.view = "user";
      } else {
        this.emitLine("Mock session stays online. Use Disconnect in UI to close it.");
      }
      this.state.currentInterface = "";
      this.state.currentVlan = null;
      this.emitPrompt();
      return;
    }

    switch (this.state.view) {
      case "user":
        this.handleUserCommand(cmd, raw);
        return;
      case "config":
        this.handleConfigCommand(cmd, raw);
        return;
      case "interface":
        this.handleInterfaceCommand(cmd, raw);
        return;
      case "vlan":
        this.handleVlanCommand(cmd, raw);
        return;
      default:
        this.emit(this.unknownCommand(raw));
        this.emitPrompt();
    }
  }

  private handleUserCommand(cmd: string, raw: string): void {
    if (/^(enter-config|configure|configure terminal|system-view)$/i.test(cmd)) {
      this.state.view = "config";
      this.emitLine("Entering config mode. Use return to go back.");
      this.emitPrompt();
      return;
    }

    if (/^(show version|display version)$/i.test(cmd)) {
      this.emit(this.showVersion());
      this.emitPrompt();
      return;
    }

    if (/^(show system|display device)$/i.test(cmd)) {
      this.emit(this.showSystem());
      this.emitPrompt();
      return;
    }

    if (/^(show interfaces brief|display ip interface brief)$/i.test(cmd)) {
      this.emit(this.showInterfacesBrief());
      this.emitPrompt();
      return;
    }

    if (/^(show running-config|display current-configuration)$/i.test(cmd)) {
      this.emit(this.showRunningConfig());
      this.emitPrompt();
      return;
    }

    if (/^(save|commit)$/i.test(cmd)) {
      this.emitLine("Mock configuration checkpoint complete.");
      this.emitPrompt();
      return;
    }

    if (/^ping\s+\S+$/i.test(cmd)) {
      const ip = cmd.split(/\s+/)[1];
      this.emitLine(`PING ${ip}: 56 data bytes, 5 packets transmitted, 5 received, 0% loss.`);
      this.emitPrompt();
      return;
    }

    this.emit(this.unknownCommand(raw));
    this.emitPrompt();
  }

  private handleConfigCommand(cmd: string, raw: string): void {
    const hostnameMatch = /^(hostname|sysname)\s+(.+)$/i.exec(cmd);
    if (hostnameMatch) {
      this.state.hostname = sanitizeToken(hostnameMatch[2]) || this.state.hostname;
      this.emitPrompt();
      return;
    }

    const vlanMatch = /^vlan\s+(\d{1,4})$/i.exec(cmd);
    if (vlanMatch) {
      const vlan = Number(vlanMatch[1]);
      if (!validVlan(vlan)) {
        this.emitLine("% VLAN ID out of range (1-4094).");
        this.emitPrompt();
        return;
      }
      if (!this.state.vlans.has(vlan)) this.state.vlans.set(vlan, `vlan-${vlan}`);
      this.state.view = "vlan";
      this.state.currentVlan = vlan;
      this.emitPrompt();
      return;
    }

    const ifaceMatch = /^(iface|interface)\s+(.+)$/i.exec(cmd);
    if (ifaceMatch) {
      const iface = ifaceMatch[2].trim();
      const config = this.state.interfaces.get(iface) ?? defaultIfConfig();
      this.state.interfaces.set(iface, config);
      this.state.view = "interface";
      this.state.currentInterface = iface;
      this.emitPrompt();
      return;
    }

    if (/^(show version|display version)$/i.test(cmd)) {
      this.emit(this.showVersion());
      this.emitPrompt();
      return;
    }

    if (/^(show system|display device)$/i.test(cmd)) {
      this.emit(this.showSystem());
      this.emitPrompt();
      return;
    }

    if (/^(show interfaces brief|display ip interface brief)$/i.test(cmd)) {
      this.emit(this.showInterfacesBrief());
      this.emitPrompt();
      return;
    }

    if (/^(show running-config|display current-configuration)$/i.test(cmd)) {
      this.emit(this.showRunningConfig());
      this.emitPrompt();
      return;
    }

    if (/^(show this|display this)$/i.test(cmd)) {
      this.emitLine(`hostname ${this.state.hostname}`);
      this.emitPrompt();
      return;
    }

    if (/^(save|commit)$/i.test(cmd)) {
      this.emitLine("Mock configuration checkpoint complete.");
      this.emitPrompt();
      return;
    }

    this.emit(this.unknownCommand(raw));
    this.emitPrompt();
  }

  private handleVlanCommand(cmd: string, raw: string): void {
    const vlan = this.state.currentVlan;
    if (!vlan) {
      this.state.view = "config";
      this.emitPrompt();
      return;
    }

    const nameMatch = /^name\s+(.+)$/i.exec(cmd);
    if (nameMatch) {
      this.state.vlans.set(vlan, nameMatch[1].trim());
      this.emitPrompt();
      return;
    }

    if (/^(no name|undo name)$/i.test(cmd)) {
      this.state.vlans.set(vlan, `vlan-${vlan}`);
      this.emitPrompt();
      return;
    }

    if (/^(show this|display this)$/i.test(cmd)) {
      const name = this.state.vlans.get(vlan) ?? `vlan-${vlan}`;
      this.emitLine(`vlan ${vlan}`);
      this.emitLine(` name ${name}`);
      this.emitPrompt();
      return;
    }

    this.emit(this.unknownCommand(raw));
    this.emitPrompt();
  }

  private handleInterfaceCommand(cmd: string, raw: string): void {
    const iface = this.state.currentInterface;
    if (!iface) {
      this.state.view = "config";
      this.emitPrompt();
      return;
    }
    const ifConfig = this.state.interfaces.get(iface) ?? defaultIfConfig();
    this.state.interfaces.set(iface, ifConfig);

    const descriptionMatch = /^description\s+(.+)$/i.exec(cmd);
    if (descriptionMatch) {
      ifConfig.description = descriptionMatch[1].trim();
      this.emitPrompt();
      return;
    }

    if (/^(no description|undo description)$/i.test(cmd)) {
      ifConfig.description = "";
      this.emitPrompt();
      return;
    }

    if (/^shutdown$/i.test(cmd)) {
      ifConfig.shutdown = true;
      this.emitLine(`Interface ${iface} is administratively down.`);
      this.emitPrompt();
      return;
    }

    if (/^(no shutdown|undo shutdown)$/i.test(cmd)) {
      ifConfig.shutdown = false;
      this.emitLine(`Interface ${iface} is up.`);
      this.emitPrompt();
      return;
    }

    const modeMatch = /^(mode|port link-mode|port link-type)\s+(access|trunk)$/i.exec(cmd);
    if (modeMatch) {
      ifConfig.mode = modeMatch[2].toLowerCase() as LinkMode;
      if (ifConfig.mode === "trunk" && ifConfig.trunkVlans.size === 0) ifConfig.trunkVlans = new Set([1]);
      this.emitPrompt();
      return;
    }

    const accessVlanMatch = /^(access-vlan|port access vlan|port default vlan)\s+(\d{1,4})$/i.exec(cmd);
    if (accessVlanMatch) {
      const vlan = Number(accessVlanMatch[2]);
      if (!validVlan(vlan)) {
        this.emitLine("% VLAN ID out of range (1-4094).");
        this.emitPrompt();
        return;
      }
      ifConfig.mode = "access";
      ifConfig.accessVlan = vlan;
      if (!this.state.vlans.has(vlan)) this.state.vlans.set(vlan, `vlan-${vlan}`);
      this.emitPrompt();
      return;
    }

    if (/^(undo port trunk permit vlan|no trunk-vlans)$/i.test(cmd)) {
      ifConfig.mode = "trunk";
      ifConfig.trunkVlans = new Set([1]);
      this.emitPrompt();
      return;
    }

    const trunkMatch = /^(trunk-vlans|port trunk permit vlan)\s+(.+)$/i.exec(cmd);
    if (trunkMatch) {
      const vlanList = parseVlanList(trunkMatch[2]);
      if (!vlanList) {
        this.emit(this.unknownCommand(raw));
        this.emitPrompt();
        return;
      }
      ifConfig.mode = "trunk";
      ifConfig.trunkVlans = new Set(vlanList);
      for (const vlan of vlanList) {
        if (!this.state.vlans.has(vlan)) this.state.vlans.set(vlan, `vlan-${vlan}`);
      }
      this.emitPrompt();
      return;
    }

    if (/^(show this|display this)$/i.test(cmd)) {
      this.emit(this.showInterfaceConfig(iface, ifConfig));
      this.emitPrompt();
      return;
    }

    this.emit(this.unknownCommand(raw));
    this.emitPrompt();
  }

  private showVersion(): string {
    return (
      `MockOS Software, Version 1.0.0${EOL}` +
      `Runtime profile: Virtual Switch Core${EOL}` +
      `System name: ${this.state.hostname}${EOL}`
    );
  }

  private showSystem(): string {
    return (
      `System: ${this.state.hostname}${EOL}` +
      `Model: MockSwitch-48G${EOL}` +
      `Memory: 1024 MB${EOL}` +
      `Ports: ${this.state.interfaces.size}${EOL}`
    );
  }

  private showInterfacesBrief(): string {
    const lines: string[] = ["Interface        Admin  Link   Mode    VLAN"];
    for (const [name, cfg] of this.state.interfaces.entries()) {
      const admin = cfg.shutdown ? "down " : "up   ";
      const link = cfg.shutdown ? "down " : "up   ";
      const vlanInfo = cfg.mode === "access" ? String(cfg.accessVlan) : `t:${formatVlans(cfg.trunkVlans)}`;
      lines.push(`${padRight(name, 15)} ${admin}  ${link}  ${padRight(cfg.mode, 6)}  ${vlanInfo}`);
    }
    return `${lines.join(EOL)}${EOL}`;
  }

  private showRunningConfig(): string {
    const lines: string[] = [];
    lines.push(`# Mock running-config`);
    lines.push(`hostname ${this.state.hostname}`);
    for (const [vlan, name] of Array.from(this.state.vlans.entries()).sort(([a], [b]) => a - b)) {
      if (vlan === 1 && name === "default") continue;
      lines.push(`vlan ${vlan}`);
      lines.push(` name ${name}`);
      lines.push(` exit`);
    }
    for (const [name, cfg] of this.state.interfaces.entries()) {
      lines.push(`interface ${name}`);
      if (cfg.description) lines.push(` description ${cfg.description}`);
      lines.push(cfg.shutdown ? " shutdown" : " no shutdown");
      lines.push(` mode ${cfg.mode}`);
      if (cfg.mode === "access") {
        lines.push(` access-vlan ${cfg.accessVlan}`);
      } else {
        lines.push(` trunk-vlans ${formatVlans(cfg.trunkVlans)}`);
      }
      lines.push(` exit`);
    }
    lines.push(`end`);
    return `${lines.join(EOL)}${EOL}`;
  }

  private showInterfaceConfig(name: string, cfg: IfConfig): string {
    const lines = [`interface ${name}`];
    if (cfg.description) lines.push(` description ${cfg.description}`);
    lines.push(cfg.shutdown ? " shutdown" : " no shutdown");
    lines.push(` mode ${cfg.mode}`);
    if (cfg.mode === "access") {
      lines.push(` access-vlan ${cfg.accessVlan}`);
    } else {
      lines.push(` trunk-vlans ${formatVlans(cfg.trunkVlans)}`);
    }
    return `${lines.join(EOL)}${EOL}`;
  }

  private helpByView(): string {
    if (this.state.view === "user") {
      return [
        "User mode commands:",
        "  enter-config | configure terminal",
        "  show version | show system",
        "  show interfaces brief",
        "  show running-config",
        "  ping <ip>",
        "  save",
        "  quit"
      ].join(EOL) + EOL;
    }
    if (this.state.view === "config") {
      return [
        "Config mode commands:",
        "  hostname <name>",
        "  vlan <id>",
        "  interface <name>",
        "  show running-config",
        "  show interfaces brief",
        "  save",
        "  return | quit"
      ].join(EOL) + EOL;
    }
    if (this.state.view === "vlan") {
      return ["VLAN mode commands:", "  name <text>", "  no name", "  show this", "  quit"].join(EOL) + EOL;
    }
    return [
      "Interface mode commands:",
      "  description <text> | no description",
      "  shutdown | no shutdown",
      "  mode access|trunk",
      "  access-vlan <id>",
      "  trunk-vlans <id-list>",
      "  show this",
      "  quit"
    ].join(EOL) + EOL;
  }

  private unknownCommand(raw: string): string {
    const cmd = raw.trim();
    return `${cmd}${EOL} ^${EOL}% MockOS parser: unknown command.${EOL}`;
  }

  private emit(chunk: string): void {
    this.dataListener?.(chunk);
  }

  private emitLine(line: string): void {
    this.emit(`${line}${EOL}`);
  }

  private emitPrompt(): void {
    const host = sanitizeToken(this.state.hostname) || "MockCore";
    if (this.state.view === "user") {
      this.emit(`<${host}> `);
      return;
    }
    if (this.state.view === "config") {
      this.emit(`[${host}] `);
      return;
    }
    if (this.state.view === "interface") {
      const ifaceToken = sanitizeToken(this.state.currentInterface) || "if";
      this.emit(`[${host}-if-${ifaceToken}] `);
      return;
    }
    const vlan = this.state.currentVlan ?? 0;
    this.emit(`[${host}-vlan-${vlan}] `);
  }
}

function normalize(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

function sanitizeToken(input: string): string {
  return input.trim().replace(/[^\w.-]/g, "-");
}

function validVlan(vlan: number): boolean {
  return Number.isInteger(vlan) && vlan >= 1 && vlan <= 4094;
}

function parseVlanList(raw: string): number[] | null {
  const tokens = raw
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (tokens.length === 0) return null;
  const parsed: number[] = [];
  for (const token of tokens) {
    if (!/^\d+$/.test(token)) return null;
    const vlan = Number(token);
    if (!validVlan(vlan)) return null;
    parsed.push(vlan);
  }
  return Array.from(new Set(parsed)).sort((a, b) => a - b);
}

function formatVlans(vlans: Set<number>): string {
  return Array.from(vlans).sort((a, b) => a - b).join(",");
}

function padRight(input: string, width: number): string {
  if (input.length >= width) return input;
  return `${input}${" ".repeat(width - input.length)}`;
}

function defaultIfConfig(): IfConfig {
  return {
    shutdown: false,
    description: "",
    mode: "access",
    accessVlan: 1,
    trunkVlans: new Set([1])
  };
}
