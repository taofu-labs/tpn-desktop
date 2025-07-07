import { connect, listCountries, checkStatus, disconnect, ConnectionInfo, StatusInfo, initialize_tpn } from './tpn-cli.js'



export const tpnService = {
   async initializeTpn(): Promise<void> {
    await initialize_tpn()
  },
  async getCountries(): Promise<string[]> {
    return await listCountries()
  },

  async connect(country?: string): Promise<ConnectionInfo>  {
    return await connect(country)
  },

  async checkStatus(): Promise<StatusInfo> {
    return await checkStatus();
  },

  async disconnect() {
    return await disconnect();
  }

}
