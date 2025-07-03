const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
  // TODO: Add methods to expose to the renderer process
  test: () => console.log("test"),
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
