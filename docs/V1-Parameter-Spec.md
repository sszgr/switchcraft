# SwitchCraft V1 Parameterized Spec (Implemented)

## Core design mapping

1. Serial connection module
- Port scan via transport `listPorts()`
- Configurable serial settings
- Connect/disconnect lifecycle in `ConsoleSession`

2. Terminal console module
- RX/TX timestamped logs
- Manual command sending via `sendRaw` and `sendCommand`
- Error text can be extended with simple regex matching in logger/UI layer

3. Session state machine
- Prompt detection: `driver.promptRegex`
- Pagination: `driver.paginationPatterns`
- Confirmation prompt: `[Y/N]` auto handling via settings
- Command completion: prompt + timeout

4. Device identification
- Post-connect version probing hooks in `index.ts`
- Driver registry in `drivers.ts`
- Supports manual driver selection

5. Template management (file-based)
- YAML format: `name/device/fields/script`
- Field types + validation rules implemented
- Script rendering supports placeholder and foreach expansion

6. Batch execution
- One template + one params object = final command list
- Preview can be added by exposing `renderScript` before run
- Execution control currently supports start/stop by process; pause/resume pending in GUI stage

7. Logging and audit
- Real-time runtime logs
- Export TXT + HTML
- Includes command stream and execution status

8. User settings
- `settings.json` covers serial defaults, timeout, intervals, log path, confirmation strategy

## Intentionally not included in this phase

- Electron GUI (renderer/main IPC)
- CSV/Excel import UI workflow
- Multi-device concurrent scheduling
- SSH transport
