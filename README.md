# SwitchCraft

**English** | [中文](./README.zh-CN.md)

<p align="center">
  <img src="./docs/readme/icon.png" alt="SwitchCraft icon" width="96" />
</p>

SwitchCraft is an Electron desktop client for network-console automation.
It combines a GUI workflow for template editing, parameter input, command preview, and execution with a reusable automation core.

## Overview

SwitchCraft is designed for engineers who need a repeatable desktop workflow for console-side network changes.
You can prepare YAML-based command templates, fill runtime parameters in the UI, preview rendered commands before execution, and run them through serial or mock transport.

## Screenshots

### Template Workspace

![SwitchCraft template workspace](./docs/readme/screenshot-template-workspace.png)

### Execution Center

![SwitchCraft execution center](./docs/readme/screenshot-execution-center.png)

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

## License

Apache License 2.0. See [LICENSE](./LICENSE).

## Quick Start

```bash
npm install
npm run build
npm start
```

## Image Assets For This README

Place the README images in:

- `docs/readme/icon.png`
- `docs/readme/screenshot-template-workspace.png`
- `docs/readme/screenshot-execution-center.png`

You can replace them with files of the same names later, and the README will render them automatically.

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
