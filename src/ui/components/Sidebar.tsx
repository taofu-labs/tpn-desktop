import React, { useState } from "react";
import { capitalizeWords } from "../utils/countryUtils";
import toast from "react-hot-toast";
import { leaseDurations } from "../utils/connection";
import { ConnectCard } from "./ConnectCard";
import { SelectCountry } from "./SelectCountry";
export interface SidebarProps {
  selectedCountry: {
    code: string;
    name: string;
    flag: string;
  } | null;
  setSelectedCountry: (
    country: { name: string; flag: string; code: string } | null
  ) => void;
  connected: boolean;
  setConnected: (connected: boolean) => void;
  setConnectionInfo: (info: ConnectionInfo) => void;
  countries: any;
  isInitializing: boolean;
  error: any;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedCountry,
  setSelectedCountry,
  connected,
  setConnected,
  setConnectionInfo,
  countries,
  isInitializing,
  error,
}) => {
  const [search, setSearch] = useState("");
  const [selectedLease, setSelectedLease] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const handleConnect = async () => {
    if (!selectedCountry || !selectedLease) return;

    setConnecting(true);

    const connectPromise = window.electron.connectToCountry({
      country: selectedCountry?.code,
      lease: +selectedLease,
    });

    toast.promise(connectPromise, {
      loading: `${
        canceling ? "Canceling connection to" : "Connecting to"
      } ${capitalizeWords(selectedCountry.name)}...`,
      success: (connectionInfo) => {
        if (connectionInfo.connected) {
          localStorage.setItem(
            "tpn-original-ip",
            JSON.stringify(connectionInfo.originalIP)
          );
          setConnected(true);
          setConnectionInfo(connectionInfo);
          setSelectedLease("");
          return `Connected to ${capitalizeWords(selectedCountry.name)}!`;
        } else {
          throw new Error("Connection failed");
        }
      },
      error: (error) => {
        console.error("Connection error:", error);
        let errorMessage = "Connection failed, Please try again.";

        if (error?.message) {
          // Remove Electron's IPC wrapper prefix
          const match = error.message.match(
            /Error invoking remote method '[^']+': Error: (.+)/
          );
          if (match) {
            errorMessage = match[1]; // This gets "Connection terminated"
          }
        }

        return errorMessage;
      },
    });

    try {
      const connectionInfo = await connectPromise;
      if (connectionInfo.connected) {
        setConnected(true);
        setConnectionInfo(connectionInfo);
        setSelectedLease("");
      }
    } catch (error) {
      console.error("Connection error:", error);
    } finally {
      setConnecting(false);
    }
  };

  const handleCancel = async () => {
    setConnecting(false);
    setCanceling(true);
    const cancelPromise = window.electron.cancel();

    toast.promise(cancelPromise, {
      loading: "Canceling connection...",
      success: (result: any) => {
        if (result.success) {
          setConnected(false);
          return "Successfully cancelled VPN connection";
        } else {
          throw new Error("Disconnect failed");
        }
      },
      // error: (error) => {
      //   console.error("Cancel error:", error);
      //   return `Failed to cancel: Please restart application.`;
      // },
    });

    try {
      const result: any = await cancelPromise;
      if (result.success) {
        setConnected(false);
      }
    } catch (error) {
      console.error("Cancel error:", error);
    } finally {
      setCanceling(false);
    }
  };

  const filteredCountries = countries.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="sidebar w-[280px] sm:w-[320px] min-w-[240px] sm:min-w-[260px] max-w-[300px] sm:max-w-[340px] flex flex-col gap-3 sm:gap-6">
      {/* Country Search & List Card */}
      <div className="bg-[#181A20] border border-blue-500 shadow-xl p-4 sm:p-6 min-h-[480px] sm:min-h-[520px] relative">
        {/* Corner dots */}
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
        {connected ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center h-full min-h-[480px] sm:min-h-[520px]">
            <div className="h-3 w-3 rounded-full bg-green-400 inline-block"></div>
            <span className="text-green-400 text-sm font-medium">
              Connected to VPN
            </span>
            <span className="text-gray-400 text-xs">
              Disconnect first to select a different country
            </span>
          </div>
        ) : (
          <SelectCountry
            search={search}
            setSearch={setSearch}
            filteredCountries={filteredCountries}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            isInitializing={isInitializing}
            error={error}
          />
        )}
      </div>
      {/* Selected Country & Connect Card (only show if selectedCountry, not connected, and not loading) */}
      {selectedCountry && !connected && countries.length > 0 && (
        <ConnectCard
          selectedCountry={selectedCountry}
          selectedLease={selectedLease}
          connecting={connecting}
          setSelectedLease={setSelectedLease}
          leaseDurations={leaseDurations}
          canceling={canceling}
          handleCancel={handleCancel}
          handleConnect={handleConnect}
        />
      )}
    </div>
  );
};

export default Sidebar;
