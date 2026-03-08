const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('switchcraft', {
  getMeta: () => ipcRenderer.invoke('app:get-meta'),
  openExternal: (url) => ipcRenderer.invoke('app:open-external', url),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setLocale: (locale) => ipcRenderer.invoke('settings:set-locale', locale),
  listSerialPorts: () => ipcRenderer.invoke('serial:list-ports'),
  listDrivers: () => ipcRenderer.invoke('drivers:list'),
  listTemplates: () => ipcRenderer.invoke('template:list'),
  loadTemplate: (templatePath) => ipcRenderer.invoke('template:load', templatePath),
  saveTemplate: (payload) => ipcRenderer.invoke('template:save', payload),
  deleteTemplate: (templatePath) => ipcRenderer.invoke('template:delete', templatePath),
  previewTemplate: (templatePath, params) => ipcRenderer.invoke('template:preview', templatePath, params),
  executeRun: (payload) => ipcRenderer.invoke('run:execute', payload),
  executeMock: (templatePath, params) => ipcRenderer.invoke('run:execute-mock', templatePath, params),
  onRunLog: (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on('run:log', listener);
    return () => ipcRenderer.removeListener('run:log', listener);
  },
  onRunDone: (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on('run:done', listener);
    return () => ipcRenderer.removeListener('run:done', listener);
  }
});
