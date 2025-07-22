import { app, BrowserWindow, dialog, nativeImage } from "electron";
import path from "path";
import { isDev } from "./util.js";
import { alert, log } from "./helpers.js";
import { getPreloadPath, getAssetPath } from "./pathResolver.js";
import { initialize_tpn } from "./tpn-cli.js";
import { initializeIpcHandlers } from "./ipcHandlers.js";
import { tpnService } from "./tpnService.js";
import updater from "electron-updater";
import { getNetworkspeed } from "./network.js"
const { autoUpdater } = updater;

const state = {
    mainWindow: null as BrowserWindow | null,
}

/* ///////////////////////////////
// Event listeners
// /////////////////////////////*/
app.whenReady().then(async () => {
   state.mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    show: false,
    icon: isDev() ? path.join(getAssetPath(), '/app-icon.png') : undefined,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });
  

   state.mainWindow.webContents.on("did-finish-load", () => {
    log("Window finished loading");
  });

   try {
    await initialize_tpn();

    initializeIpcHandlers({
      tpnService,
      getMainWindow: () => {
        if (!state.mainWindow) {
          throw new Error("Main window is not initialized");
        }
        return state.mainWindow;
      },
      getNetworkspeed
    },
  );

     state.mainWindow.show(); // Show after TPN is ready
  } catch (error) {
    console.error("Failed to initialize TPN:", error);
  }
  if (isDev()) {
     state.mainWindow.loadURL("http://localhost:5123");
  } else {
     state.mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
    autoUpdater.checkForUpdatesAndNotify();
  }
 
});

// Set dock icon in dev mode on macOS
if (isDev() && process.platform === 'darwin' && app.dock) {
  app.dock.setIcon(nativeImage.createFromPath(path.join(getAssetPath(), 'app-icon.png')));
}

// Ensure VPN disconnects when app closes
app.on("before-quit", async () => {
  try {
    // Optionally, you can check if connected before disconnecting
    await tpnService.disconnect();
  } catch (err) {
    console.error("Error disconnecting VPN on quit:", err);
  }
});

// Auto Updater Events
autoUpdater.on("update-available", () => {
  dialog.showMessageBox({
    type: "info",
    title: "Update Available",
    message: "A new update is being downloaded.",
  });
});

autoUpdater.on("update-downloaded", () => {
  dialog
    .showMessageBox({
      type: "info",
      title: "Update Ready",
      message: "An update is ready. Restart now?",
      buttons: ["Restart", "Later"],
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
});

autoUpdater.on("error", (err: Error) => {
  console.error("AutoUpdater error:", err);
});

/* ///////////////////////////////
// Global config
// /////////////////////////////*/

if (isDev()) {
  if (app.dock) app.dock.show();
} else {
  if (app.dock) app.dock.hide();
}

/* ///////////////////////////////
// Debugging
// /////////////////////////////*/
const debug = false;
if (debug) {
  app.whenReady().then(async () => {
    await alert(__dirname);

    await alert(Object.keys(process.env).join("\n"));

    const { HOME, PATH, USER } = process.env;
    await alert(`HOME: ${HOME}\n\nPATH: ${PATH}\n\nUSER: ${USER}`);
  });
}
