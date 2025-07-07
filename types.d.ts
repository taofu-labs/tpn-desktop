type EventPayloadMapping = {
  getCountries: Array<string>;
  setLeaseDuration: string;
  getLeaseDuration: string;
};

interface Window {
  electron: {
    getCountries: () => Promise<string>;
    selectCountry: (country: string) => Promise<string>;
    setLeaseDuration: (duration: string) => Promise<string>;
    connectToCountry: (country: string) => Promise<string>;
    getLeaseDuration: () => Promise<string>;
  };
}



