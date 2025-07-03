import { app, BrowserWindow } from "electron";
import path from "path";
import { isDev } from "./util.js";
import { alert } from "./helpers.js";
import { getPreloadPath } from "./pathResolver.js";
import { initialize_tpn } from "./tpn-cli.js";

// import { updateElectronApp } from 'update-electron-app'

// // Enable auto-updates
// updateElectronApp( {
//     logger: {
//         log: ( ...data ) => log.info( '[ update-electron-app ]', ...data )
//     }
// } )

/* ///////////////////////////////
// Event listeners
// /////////////////////////////*/
app.whenReady().then(async () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
     show: false,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });
  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
  }
   try {  
    await initialize_tpn();  
    mainWindow.show(); // Show after TPN is ready  
  } catch (error) {  
    console.error('Failed to initialize TPN:', error);  
  } 
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
if (debug)
  app.whenReady().then(async () => {
    await alert(__dirname);

    await alert(Object.keys(process.env).join("\n"));

    const { HOME, PATH, USER } = process.env;
    await alert(`HOME: ${HOME}\n\nPATH: ${PATH}\n\nUSER: ${USER}`);
  });
