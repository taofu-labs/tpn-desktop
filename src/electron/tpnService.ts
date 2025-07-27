import { connect, listCountries, checkStatus, disconnect, initialize_tpn, cancel} from './tpn-cli.js'
import type { ConnectionInfo, StatusInfo } from './tpn-cli.js'

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

  async connect(country: string = "any", lease?: number): Promise<ConnectionInfo>  {
    return await connect(country, lease)
  },

  async cancel(): Promise<boolean>  {
    return await cancel()
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
