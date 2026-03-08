import type { DeviceDriver } from "./types.js";

export const builtinDrivers: DeviceDriver[] = [
  {
    id: "h3c-comware",
    vendor: "H3C",
    promptRegex: /<[\w.-]+>|\[[\w.-]+\]/,
    systemViewCommand: "system-view",
    exitCommand: "return",
    paginationPatterns: [/--More--/, /---- More ----/],
    moreResponse: " "
  },
  {
    id: "huawei-vrp",
    vendor: "Huawei",
    promptRegex: /<[\w.-]+>|\[[\w.-]+\]/,
    systemViewCommand: "system-view",
    exitCommand: "return",
    paginationPatterns: [/---- More ----/, /--More--/],
    moreResponse: " "
  },
  {
    id: "cisco-ios",
    vendor: "Cisco",
    promptRegex: /[\w.-]+[>#]/,
    systemViewCommand: "configure terminal",
    exitCommand: "end",
    paginationPatterns: [/--More--/, /\s*More\s*:/],
    moreResponse: " "
  }
];

export function identifyDriverByBanner(text: string): DeviceDriver | undefined {
  const lower = text.toLowerCase();
  if (lower.includes("h3c")) return builtinDrivers.find((d) => d.id === "h3c-comware");
  if (lower.includes("huawei")) return builtinDrivers.find((d) => d.id === "huawei-vrp");
  if (lower.includes("cisco")) return builtinDrivers.find((d) => d.id === "cisco-ios");
  return undefined;
}

export function getDriverById(id: string): DeviceDriver | undefined {
  return builtinDrivers.find((d) => d.id === id);
}
