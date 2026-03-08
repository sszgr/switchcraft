export {};

declare global {
  interface Window {
    switchcraft: {
      getMeta: () => Promise<{
        name: string;
        version: string;
        electronVersion: string;
        root: string;
        locale: "zh-CN" | "en-US";
      }>;
      openExternal: (url: string) => Promise<{ ok: boolean }>;
      getSettings: () => Promise<{
        locale: "zh-CN" | "en-US";
        serial: {
          baudRate: number;
          dataBits: 7 | 8;
          stopBits: 1 | 2;
          parity: "none" | "even" | "odd";
          flowControl: "none" | "rtscts" | "xonxoff";
        };
        defaultDriver?: string;
      }>;
      setLocale: (locale: "zh-CN" | "en-US") => Promise<unknown>;
      listSerialPorts: () => Promise<Array<{ path: string; manufacturer?: string }>>;
      listDrivers: () => Promise<Array<{ id: string; vendor: string }>>;
      listTemplates: () => Promise<Array<{ name: string; path: string }>>;
      loadTemplate: (templatePath: string) => Promise<{
        path: string;
        fileName: string;
        yamlText: string;
        template: {
          name: string;
          device: string;
          description?: string;
          fields: Array<{
            key: string;
            type: string;
            label: string;
            default?: unknown;
            required?: boolean;
            options?: string[];
          }>;
          script: string[];
        };
      }>;
      saveTemplate: (payload: { path?: string; fileName?: string; yamlText: string }) => Promise<{
        path: string;
        fileName: string;
      }>;
      deleteTemplate: (templatePath: string) => Promise<{ ok: true }>;
      previewTemplate: (templatePath: string, params: Record<string, unknown>) => Promise<{ commands: string[] }>;
      executeRun: (payload: {
        templatePath: string;
        params: Record<string, unknown>;
        mode: "mock" | "serial";
        portPath?: string;
        serial?: {
          baudRate?: number;
          dataBits?: 7 | 8;
          stopBits?: 1 | 2;
          parity?: "none" | "even" | "odd";
          flowControl?: "none" | "rtscts" | "xonxoff";
        };
        driverId?: string;
      }) => Promise<unknown>;
      executeMock: (templatePath: string, params: Record<string, unknown>) => Promise<unknown>;
      onRunLog: (handler: (item: { level: string; message: string }) => void) => () => void;
      onRunDone: (handler: (result: unknown) => void) => () => void;
    };
  }
}
