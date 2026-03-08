import fs from "node:fs";
import yaml from "js-yaml";
import type { CommandTemplate, TemplateField } from "./types.js";

export function loadTemplate(filePath: string): CommandTemplate {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = yaml.load(raw) as CommandTemplate & { script: unknown[] };
  const normalized: CommandTemplate = {
    ...parsed,
    script: normalizeScript(parsed.script)
  };
  validateTemplate(normalized);
  return normalized;
}

function validateTemplate(tpl: CommandTemplate): void {
  if (!tpl.name || !tpl.device || !Array.isArray(tpl.fields) || !Array.isArray(tpl.script)) {
    throw new Error("Invalid template: required keys are name, device, fields, script.");
  }
  for (const f of tpl.fields) {
    if (!f.key || !f.type || !f.label) {
      throw new Error(`Invalid field in template: ${JSON.stringify(f)}`);
    }
  }
}

export function validateParams(fields: TemplateField[], params: Record<string, unknown>): void {
  for (const field of fields) {
    const value = params[field.key] ?? field.default;

    if (field.required && (value === undefined || value === null || value === "")) {
      throw new Error(`Field '${field.key}' is required.`);
    }
    if (value === undefined || value === null) continue;

    switch (field.type) {
      case "string":
      case "textarea": {
        if (typeof value !== "string") throw new Error(`Field '${field.key}' must be string.`);
        if (field.pattern && !(new RegExp(field.pattern).test(value))) {
          throw new Error(`Field '${field.key}' does not match pattern.`);
        }
        break;
      }
      case "number": {
        if (typeof value !== "number") throw new Error(`Field '${field.key}' must be number.`);
        if (field.min !== undefined && value < field.min) throw new Error(`Field '${field.key}' < min.`);
        if (field.max !== undefined && value > field.max) throw new Error(`Field '${field.key}' > max.`);
        break;
      }
      case "boolean": {
        if (typeof value !== "boolean") throw new Error(`Field '${field.key}' must be boolean.`);
        break;
      }
      case "enum": {
        if (typeof value !== "string") throw new Error(`Field '${field.key}' must be string enum.`);
        if (!field.options?.includes(value)) throw new Error(`Field '${field.key}' is not in enum options.`);
        break;
      }
      case "list": {
        if (!Array.isArray(value)) throw new Error(`Field '${field.key}' must be list.`);
        break;
      }
      default:
        throw new Error(`Unknown field type '${String((field as { type: unknown }).type)}'.`);
    }
  }
}

export function renderScript(script: string[], params: Record<string, unknown>): string[] {
  const lines: string[] = [];

  for (let i = 0; i < script.length; i += 1) {
    const line = script[i]?.trimEnd() ?? "";
    const foreach = line.match(/^foreach\s+(\w+)\s+in\s+(\w+):$/);

    if (foreach) {
      const [, itemName, listName] = foreach;
      const source = params[listName];
      if (!Array.isArray(source)) {
        throw new Error(`foreach source '${listName}' is not list.`);
      }

      const block: string[] = [];
      i += 1;
      while (i < script.length && script[i].startsWith("  ")) {
        block.push(script[i].slice(2));
        i += 1;
      }
      i -= 1;

      for (const item of source) {
        const scoped = { ...params, [itemName]: item };
        for (const blockLine of block) {
          lines.push(interpolate(blockLine, scoped));
        }
      }
      continue;
    }

    lines.push(interpolate(line, params));
  }

  return lines.filter((l) => l.trim().length > 0);
}

function normalizeScript(raw: unknown[] | undefined): string[] {
  if (!Array.isArray(raw)) return [];
  const lines: string[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      lines.push(item);
      continue;
    }
    if (item && typeof item === "object") {
      const entries = Object.entries(item);
      if (entries.length === 1) {
        const [k, v] = entries[0];
        if (v === null) {
          lines.push(`${k}:`);
          continue;
        }
      }
    }
    throw new Error(`Invalid script line: ${JSON.stringify(item)}`);
  }
  return lines;
}

function interpolate(line: string, params: Record<string, unknown>): string {
  return line.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) => {
    const v = params[key];
    if (v === undefined || v === null) return "";
    if (Array.isArray(v)) return v.join(",");
    return String(v);
  });
}
