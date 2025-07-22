// Import types from electron backend
interface ConnectionInfo {
  connected: boolean;
  originalIP: string;
  currentIP: string;
  leaseEndTime: Date;
  minutesRemaining: number;
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
  startSpeedTest: boolean;
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
    startSpeedTest: () => Promise<{ success: boolean }>;
    onSpeedTestProgress: (callback: (data: SpeedTestProgress) => void) => void;
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
