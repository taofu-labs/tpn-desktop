type EventPayloadMapping = {
  getCountries: Promise<string[]>;
  connectToCountry: Promise<ConnectionInfo>;
  checkStatus: Promise<string>;
  disconnect: string;
};

interface Window {
  electron: {
    getCountries: () => Promise<string[]>;
    connectToCountry: (country: string) => Promise<string>;
    checkStatus: () => Promise<string>;
    disconnect: () => Promise<string>;
  };
}



