import type { AppSettings, CommandTemplate, DeviceDriver, ExecutionResult } from "./types.js";
import type { ConsoleSession } from "./session.js";
import { RunLogger } from "./logger.js";
import { renderScript, validateParams } from "./template.js";

export class ExecutionEngine {
  constructor(
    private readonly session: ConsoleSession,
    private readonly settings: AppSettings,
    private readonly logger: RunLogger
  ) {}

  async runTemplate(
    template: CommandTemplate,
    params: Record<string, unknown>,
    _driver: DeviceDriver
  ): Promise<ExecutionResult> {
    const started = new Date().toISOString();

    try {
      validateParams(template.fields, params);
      const commands = renderScript(template.script, params);

      this.logger.log("INFO", `Template: ${template.name}`);
      this.logger.log("INFO", `Command count: ${commands.length}`);

      for (const cmd of commands) {
        this.logger.log("TX", cmd);
        await this.session.sendCommand(cmd);
      }

      const ended = new Date().toISOString();
      return {
        success: true,
        commands,
        startedAt: started,
        endedAt: ended
      };
    } catch (error) {
      const ended = new Date().toISOString();
      const message = error instanceof Error ? error.message : String(error);
      this.logger.log("ERROR", message);
      return {
        success: false,
        commands: [],
        startedAt: started,
        endedAt: ended,
        error: message
      };
    } finally {
      this.logger.saveTxt();
      this.logger.saveHtml();
      void this.settings;
    }
  }
}
