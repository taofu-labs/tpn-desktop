const electron = require("electron");

// Expose APIs to renderer process
electron.contextBridge.exposeInMainWorld("electron", {
  getCountries: async (): Promise<string[]> => {
    return await ipcInvoke('getCountries');
  },
  
  checkStatus: async (): Promise<StatusInfo> => {
    return await ipcInvoke('checkStatus');
  },
  
  connectToCountry: async (payload: ConnectionPayload): Promise<ConnectionInfo> => {
    return await ipcInvoke('connectToCountry', payload);
  },
  
  disconnect: async (): Promise<DisconnectInfo> => {
    return await ipcInvoke('disconnect');
  },

  cancel: async (): Promise<boolean> => {
    return await ipcInvoke('cancel');
  },

   startSpeedTest: async (): Promise<boolean> => {
    return await ipcInvoke('startSpeedTest');
  },
  
 onSpeedTestComplete: (callback: (results: SpeedTestResult) => void) => {
    electron.ipcRenderer.on('speedtest-complete', (_event: Electron.IpcRendererEvent, results: SpeedTestResult) => {
       callback(results);
    });
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


