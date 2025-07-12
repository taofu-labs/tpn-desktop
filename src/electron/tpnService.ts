import { connect, listCountries, checkStatus, disconnect, ConnectionInfo, StatusInfo, initialize_tpn } from './tpn-cli.js'

interface DisconnectInfo {
  success: boolean;
  previousIP?: string;
  newIP?: string;
  message?: string;
}



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

  async disconnect(): Promise<DisconnectInfo> {
    await disconnect();
    // Return DisconnectInfo format
    return {
      success: true,
      message: "Disconnected successfully"
    };
  }

}
