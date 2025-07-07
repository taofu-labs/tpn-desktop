import { connect, listCountries, checkStatus, disconnect, ConnectionInfo, StatusInfo } from './tpn-cli.js'



export const tpnService = {
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
