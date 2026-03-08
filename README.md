# SwitchCraft

**English** | [中文](./README.zh-CN.md)

SwitchCraft is an Electron desktop client for network-console automation.  
It combines a GUI workflow (template editing, parameter input, preview, run) with a reusable execution core.

## Features

- Electron desktop GUI for template-based execution
- YAML template management: list, create, edit, save, delete
- Auto-generated runtime parameter forms from template fields
- Command preview before execution
- Serial and mock execution modes
- Device driver abstraction (`h3c-comware`, etc.)
- Execution logs and startup diagnostics
- Offline-first guard in Electron main process

## Tech Stack

- Node.js + TypeScript
- Electron
- `js-yaml`
- `serialport` (for real COM ports)

## Quick Start

```bash
npm install
npm run build
npm start
```

## Scripts

- `npm run build`: compile TypeScript to `dist/`
- `npm start`: run Electron app (build runs first via `prestart`)
- `npm run dist:win`: build Windows NSIS installer
- `npm run dist:win-portable`: build Windows portable package
- `npm run cli`: run core CLI from `dist/src/index.js`

## Real Serial Usage

After build/start, open **Execution Center** and click **Refresh Ports** to probe local COM ports.

CLI example:

```bash
npm run cli -- --port COM3 --driver h3c-comware --template templates/h3c-trunk.yml --params templates/demo-params.mjs
```

Mock mode example:

```bash
npm run cli -- --mock
```

## Configuration

Default runtime settings are stored in:

- Windows: `%APPDATA%/SwitchCraft/settings.json`
- Linux/macOS: Electron `userData` path

Common options:

- `locale`
- `offlineMode`
- serial defaults (`baudRate`, `dataBits`, `stopBits`, `parity`, `flowControl`)

## Startup Diagnostics

Startup timing is written to:

- `<userData>/logs/startup-timing.log`

Use this file to locate startup bottlenecks outside the app process (for example, antivirus scan delay before process start).

## Project Structure

- `electron/main.ts`: Electron main process and IPC handlers
- `electron/preload.ts`: renderer bridge
- `renderer/index.html`: GUI layout
- `renderer/app.js`: GUI state and interactions
- `src/session.ts`: console session state machine
- `src/template.ts`: template parse/validate/render
- `src/executor.ts`: execution engine
