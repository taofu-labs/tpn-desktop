/// <reference types="vite/client" />

import type { CountryData } from "../electron/tpn-cli.js"

interface ElectronAPI {
  openExternal: (url: string) => Promise<void>;
  getCountries: () => Promise<CountryData[]>;
  checkStatus: () => Promise<StatusInfo>;
  connectToCountry: (payload: ConnectionPayload) => Promise<ConnectionInfo>;
  disconnect: () => Promise<DisconnectInfo>;
  cancel: () => Promise<boolean>;
  startSpeedTest: () => Promise<boolean>;
  onSpeedTestComplete: (callback: (results: SpeedTestResult) => void) => void;
  onConnectionStatus: (callback: (status: ConnectionStatus) => void) => void;
}

interface Window {
  electron: ElectronAPI;
}
