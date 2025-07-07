import { ipcMain, shell } from "electron"
import { ConnectionInfo, StatusInfo } from "./tpn-cli.js"


export interface IpcServices {
  tpnService: {
    getCountries(): Promise<string[]>
    connect(country?: string): Promise<ConnectionInfo>
    checkStatus(): Promise<StatusInfo>
    disconnect(): Promise<any> // or whatever disconnect returns
  }

}

export function initializeIpcHandlers(services: IpcServices): void {
ipcMain.handle("getCountries", async () => {
  return await  services.tpnService.getCountries();
})
}