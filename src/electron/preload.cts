const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
  // TODO: Add methods to expose to the renderer process
  test: () => console.log("test"),
});
