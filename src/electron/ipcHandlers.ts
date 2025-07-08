import { ConnectionInfo, StatusInfo } from "./tpn-cli.js";
import { ipcMainHandler } from "./util.js";

export interface IpcServices {
  tpnService: {
    getCountries(): Promise<string[]>;
    connect(country?: string): Promise<ConnectionInfo>;
    checkStatus(): Promise<StatusInfo>;
    disconnect(): Promise<unknown>; // or whatever disconnect returns
  };
}

export function initializeIpcHandlers(services: IpcServices): void {
  ipcMainHandler("getCountries", async () => {
    return await services.tpnService.getCountries();
  });

  ipcMainHandler("connectToCountry", async (country?: string) => {
    return await services.tpnService.connect(country);
  });

  ipcMainHandler("checkStatus", async () => {
    return await services.tpnService.checkStatus();
  });

  ipcMainHandler("disconnect", async () => {
    return await services.tpnService.disconnect();
  });
}
