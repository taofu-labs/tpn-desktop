import { BrowserWindow } from "electron";
import type { ConnectionInfo, ConnectionStatus, StatusInfo } from "./tpn-cli.js";
const { openExternal } = await import('./tpn-cli.js');


interface DisconnectInfo {
  success: boolean;
  previousIP?: string;
  newIP?: string;
  message?: string;
}
import { ipcMainHandler } from "./util.js";

export interface IpcServices {
  tpnService: {
    getCountries(): Promise<string[]>;
    connect(country: string, lease?: number): Promise<ConnectionInfo>;
    checkStatus(): Promise<StatusInfo>;
    disconnect(): Promise<DisconnectInfo>;
    cancel(): Promise<boolean>;
    checkConnection(): Promise<ConnectionStatus>
  },
  getMainWindow(): BrowserWindow;
  getNetworkspeed(): Promise<any>;
}

// const runSpeedTest = async () => {  
//   try {  
//     await speedTest({  
//       acceptLicense: true,  
//       progress: (event: any) => {  
//         switch (event.type) {  
//           case 'download':  
//             const downloadSpeed = event.download.bandwidth; // bytes/sec  
//             // Update your UI with download speed  
//             break;  
//           case 'upload':  
//             const uploadSpeed = event.upload.bandwidth; // bytes/sec  
//             // Update your UI with upload speed  
//             break;  
//         }  
//       }  
//     });  
//   } catch (err: any) {  
    
//     console.error(err.message);  
//   }  
// };

export function initializeIpcHandlers(services: IpcServices): void {
  ipcMainHandler("openExternal", async (...args: any[]) => {
    const url = args[0];
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }
    return await openExternal(url);
  });

  ipcMainHandler("getCountries", async () => {
    return await services.tpnService.getCountries();
  });

  ipcMainHandler("connectToCountry", async (...args: any[]) => {
    return await services.tpnService.connect(args[0].country, args[0].lease);
  });

  ipcMainHandler("checkStatus", async () => {
    return await services.tpnService.checkStatus();
  });

  ipcMainHandler("disconnect", async () => {
    return await services.tpnService.disconnect();
  });

  ipcMainHandler("cancel", async () => {
    return await services.tpnService.cancel();
  });

   ipcMainHandler("getNetworkInfo", async () => {
    return await services.tpnService.disconnect();
  });

  ipcMainHandler("startSpeedTest", async () => {
    const mainWindow = services.getMainWindow();
     try {  
    // const result = await speedTest({  
    //   acceptLicense: true,  
    //   progress: (event: any) => {  
    //     // Send real-time updates to React UI  
    //     console.log("events", event)
    //     mainWindow.webContents.send('speedtest-progress', event);  
    //   }  
    // });  
    return true;

  } catch (err: any) {  
    mainWindow.webContents.send('speedtest-error', err.message);  
    throw err; 
  } 
    
  });

  ipcMainHandler("checkInternetConnection", async () => {
    return await services.tpnService.checkConnection();
  });
  
}
