
interface ElectronAPI {
    test: () => void;
  }
  
  declare global {
    interface Window {
      electron: ElectronAPI;
    }
  }
  