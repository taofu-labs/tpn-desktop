const electron = require("electron")


// Expose APIs to renderer process
electron.contextBridge.exposeInMainWorld("electron", {
  openExternal: async (url: string): Promise<void> => {
    return await ipcInvoke("openExternal", url);
  },

  getCountries: async (): Promise<string[]> => {
    return await ipcInvoke("getCountries");
  },

  checkStatus: async (): Promise<StatusInfo> => {
    return await ipcInvoke("checkStatus");
  },

  connectToCountry: async (
    payload: ConnectionPayload
  ): Promise<ConnectionInfo> => {
    return await ipcInvoke("connectToCountry", payload);
  },

  disconnect: async (): Promise<DisconnectInfo> => {
    return await ipcInvoke("disconnect");
  },

  cancel: async (): Promise<boolean> => {
    return await ipcInvoke("cancel");
  },

  startSpeedTest: async (): Promise<boolean> => {
    return await ipcInvoke("startSpeedTest");
  },

  onSpeedTestComplete: (callback: (results: SpeedTestResult) => void) => {
    electron.ipcRenderer.on(
      "speedtest-complete",
      (_event: Electron.IpcRendererEvent, results: SpeedTestResult) => {
        callback(results);
      }
    );
  },

  onConnectionStatus: (callback: (status: any) => void) => {
    electron.ipcRenderer.on(
      "connection-status",
      (_event: Electron.IpcRendererEvent, status: ConnectionStatus) => {
        callback(status);
      }
    );
  },
});

// Generic IPC invoke function
function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key,
  ...args: any[]
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key, ...args);
}

interface SpeedTestResult {
  download: number;
  upload: number;
  ping: number;
}
