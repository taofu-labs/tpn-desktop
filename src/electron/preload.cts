const electron = require("electron");

// Expose APIs to renderer process
electron.contextBridge.exposeInMainWorld("electron", {
  getCountries: async (): Promise<string[]> => {
    return await ipcInvoke('getCountries');
  },
  
  checkStatus: async (): Promise<StatusInfo> => {
    return await ipcInvoke('checkStatus');
  },
  
  connectToCountry: async (country: string): Promise<ConnectionInfo> => {
    return await ipcInvoke('connectToCountry', country);
  },
  
  disconnect: async (): Promise<DisconnectInfo> => {
    return await ipcInvoke('disconnect');
  },
});

// Generic IPC invoke function
function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key,
  payload?: any
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key, payload);
}


