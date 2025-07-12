import { ConnectionInfo, StatusInfo } from "./tpn-cli.js";

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
    connect(country?: string): Promise<ConnectionInfo>;
    checkStatus(): Promise<StatusInfo>;
    disconnect(): Promise<DisconnectInfo>;
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
