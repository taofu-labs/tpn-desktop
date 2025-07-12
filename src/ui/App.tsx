import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import MapView from './MapView';
import ConnectedCard from './components/ConnectedCard';

interface Country {
  name: string;
  flag: string;
}

function App() {
  const [connected, setConnected] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);


  useEffect(() => {
    try {
      const savedCountry = localStorage.getItem('tpn-connected-country');
      if (savedCountry) {
        const country = JSON.parse(savedCountry);
        setSelectedCountry(country);
      }
    } catch (error) {
      console.error('Error loading saved country:', error);
    }
  }, []);


  useEffect(() => {
    if (selectedCountry) {
      localStorage.setItem('tpn-connected-country', JSON.stringify(selectedCountry));
    } else {
      localStorage.removeItem('tpn-connected-country');
    }
  }, [selectedCountry]);

  // Periodically check connection status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await window.electron.checkStatus();
        setConnected(status.connected);
        if (status.connected && status.leaseEndTime && status.minutesRemaining !== undefined) {
          // Convert StatusInfo to ConnectionInfo
          const connectionInfo: ConnectionInfo = {
            connected: status.connected,
            currentIP: status.currentIP,
            leaseEndTime: status.leaseEndTime,
            minutesRemaining: status.minutesRemaining
          };
          setConnectionInfo(connectionInfo);
        } else {
          setConnectionInfo(null);
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    };

    // Check status immediately
    checkStatus();

    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, []); 

  return (
    <div className="app-bg min-h-screen min-w-screen bg-[#232733] text-white flex flex-col">

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#181A20',
            color: '#ffffff',
            border: '1px solid #2A2E3D',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      
      {/* Top Bar */}
      <div className="top-bar w-full h-12 flex items-center justify-between px-4 sm:px-6 bg-[#181A20] border-b border-[#2A2E3D] z-20">
        <div></div>
        <div className="text-base sm:text-lg font-medium">Tao Private Network</div>
        <div className={`font-semibold text-xs sm:text-sm ${connected ? 'text-green-400' : 'text-red-400'}`}>{connected ? 'CONNECTED' : 'NOT CONNECTED'}</div>
      </div>

      <div className="relative flex-1">
        <div className="absolute inset-0 z-0">
          <MapView connectedCountry={connected ? selectedCountry : null} />
        </div>

        <div className="absolute top-3 sm:top-6 left-3 sm:left-6 z-10 flex flex-col gap-3 sm:gap-6">
          <Sidebar
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            connected={connected}
            setConnected={setConnected}
            setConnectionInfo={setConnectionInfo}
          />
        </div>

        {connected && selectedCountry ? (
          <div className="absolute top-3 sm:top-6 right-3 sm:right-8 z-20 flex items-center gap-2">
            <ConnectedCard 
              country={selectedCountry} 
              setConnected={setConnected} 
              connectionInfo={connectionInfo}
            />
          </div>
        ) : (
          <div className="absolute top-3 sm:top-6 right-3 sm:right-8 z-20 flex items-center gap-2">
            <div className="bg-[#181A20] px-3 sm:px-4 py-2 flex items-center gap-2 border border-blue-500 relative">
              {/* Corner dots */}
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
              <img src="/src/ui/assets/tpn-logo.png" alt="TPN Logo" className="h-6 sm:h-8 w-auto" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
