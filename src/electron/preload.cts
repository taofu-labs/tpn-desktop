const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
  // TODO: Add methods to expose to the renderer process
  getCountries: () => ["Cameroon", "Nigeria"],
  selectCountry: (country: string) => console.log(country),
  setLeaseDuration: (duration: string) => console.log(duration),
  connectToCountry: (country: string) => console.log(country),
  getLeaseDuration: () => "5 Months"
});


function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key);
}

function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void
) {
  electron.ipcRenderer.on(key, (_: any, stats: any) => {
    callback(stats);
  });
}
