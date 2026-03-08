import path from "node:path";
import process from "node:process";
import { loadSettings, ensureLogDir } from "./config.js";
import { builtinDrivers, getDriverById, identifyDriverByBanner } from "./drivers.js";
import { ExecutionEngine } from "./executor.js";
import { RunLogger } from "./logger.js";
import { ConsoleSession } from "./session.js";
import { MockTransport } from "./serial/MockTransport.js";
import { NodeSerialTransport } from "./serial/NodeSerialTransport.js";
import { loadTemplate } from "./template.js";

interface CliArgs {
  templatePath: string;
  paramsPath: string;
  port?: string;
  driver?: string;
  useMock: boolean;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const settings = loadSettings();
  ensureLogDir(settings.logDir);

  const runId = `run-${new Date().toISOString().replaceAll(":", "-")}`;
  const logger = new RunLogger(settings.logDir, runId);

  const transport = args.useMock ? new MockTransport() : new NodeSerialTransport();

  const portPath = args.port ?? (await pickFirstPort(transport));
  if (!portPath) throw new Error("No serial port available. Use --mock or specify --port.");

  logger.log("INFO", `Using port: ${portPath}`);

  let driver = args.driver ? getDriverById(args.driver) : undefined;
  if (!driver && settings.defaultDriver) {
    driver = getDriverById(settings.defaultDriver);
  }
  if (!driver) driver = builtinDrivers[0];

  const session = new ConsoleSession(transport, driver, {
    autoConfirmYN: settings.autoConfirmYN,
    commandTimeoutMs: settings.commandTimeoutMs,
    sendIntervalMs: settings.sendIntervalMs
  });

  let rxSnapshot = "";
  session.on("rx", (chunk) => logger.log("RX", compact(chunk)));
  session.on("rx", (chunk) => {
    if (rxSnapshot.length < 8000) rxSnapshot += chunk;
  });
  session.on("tx", (chunk) => logger.log("TX", compact(chunk)));

  await session.connect(portPath, settings.serial);
  await session.sendCommand("");

  if (!args.driver) {
    await session.sendCommand("display version").catch(async () => {
      await session.sendCommand("show version");
    });
  }

  const detected = identifyDriverByBanner(rxSnapshot);
  if (detected && !args.driver) {
    driver = detected;
    logger.log("INFO", `Auto detected driver: ${driver.id}`);
  }

  const template = loadTemplate(path.resolve(args.templatePath));
  const params = await import(pathToFileUrl(path.resolve(args.paramsPath)));

  const engine = new ExecutionEngine(session, settings, logger);
  const result = await engine.runTemplate(template, normalizeDefaultExport(params), driver);

  logger.log("INFO", `Execution success: ${result.success}`);
  if (!result.success && result.error) {
    logger.log("ERROR", result.error);
  }

  await session.disconnect();
}

function compact(s: string): string {
  return s.replace(/\r/g, "\\r").replace(/\n/g, "\\n").trim();
}

function normalizeDefaultExport(moduleObj: Record<string, unknown>): Record<string, unknown> {
  const obj = (moduleObj.default ?? moduleObj) as Record<string, unknown>;
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    throw new Error("Params file must export a JSON object.");
  }
  return obj;
}

async function pickFirstPort(transport: { listPorts(): Promise<Array<{ path: string }>> }): Promise<string | undefined> {
  const ports = await transport.listPorts();
  return ports[0]?.path;
}

function parseArgs(argv: string[]): CliArgs {
  const map = new Map<string, string | boolean>();
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      map.set(key.slice(2), true);
      continue;
    }
    map.set(key.slice(2), next);
    i += 1;
  }

  const templatePath = String(map.get("template") ?? "templates/h3c-trunk.yml");
  const paramsPath = String(map.get("params") ?? "templates/demo-params.mjs");
  const port = map.get("port");
  const driver = map.get("driver");

  return {
    templatePath,
    paramsPath,
    port: typeof port === "string" ? port : undefined,
    driver: typeof driver === "string" ? driver : undefined,
    useMock: map.get("mock") === true
  };
}

function pathToFileUrl(filePath: string): string {
  const normalized = path.resolve(filePath).replace(/\\/g, "/");
  return `file://${normalized}`;
}

main().catch((err) => {
  const msg = err instanceof Error ? err.stack ?? err.message : String(err);
  process.stderr.write(`${msg}\n`);
  process.exitCode = 1;
});
