// Import types from electron backend
interface ConnectionInfo {
  connected: boolean;
  originalIP: string;
  currentIP: string;
  leaseEndTime: Date;
  minutesRemaining: number;
}
interface ConnectionStatus {
  isOnline: boolean;
  lastChecked: Date;
  latency?: number;
}

interface StatusInfo {
  connected: boolean;
  currentIP: string;
  leaseEndTime?: Date;
  minutesRemaining?: number;
}

interface DisconnectInfo {
  success: boolean;
  previousIP?: string;
  newIP?: string;
  message?: string;
}

type EventPayloadMapping = {
  getCountries: string[];
  connectToCountry: ConnectionInfo;
  checkStatus: StatusInfo;
  disconnect: DisconnectInfo;
  cancel: boolean;
  startSpeedTest: boolean;
  checkInternetConnection: ConnectionStatus;
  openExternal: any;
};

type ConnectionPayload = {
  country: string;
  lease: number;
};
interface Window {
  electron: {
    getCountries: () => Promise<string[]>;
    connectToCountry: (payload: ConnectionPayload) => Promise<ConnectionInfo>;
    checkStatus: () => Promise<StatusInfo>;
    disconnect: () => Promise<DisconnectInfo>;
    cancel:() => Promise<boolean>;
    startSpeedTest: () => Promise<{ success: boolean }>;
    onSpeedTestProgress: (callback: (data: SpeedTestProgress) => void) => void;
    onConnectionStatus: (callback: (status: ConnectionStatus) => void) => void;
    openExternal: (url: string) => any;
  };
}

// Leaflet module declaration
declare module "leaflet" {
  export interface DivIconOptions {
    className?: string;
    html?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
    popupAnchor?: [number, number];
  }

  export class DivIcon {
    constructor(options: DivIconOptions);
  }

  export const divIcon: (options: DivIconOptions) => DivIcon;
}
