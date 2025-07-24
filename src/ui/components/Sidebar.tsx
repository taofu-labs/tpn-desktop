import React, { useState, useEffect } from "react";
import {
  codeToFlagEmoji,
  getCountryCodeByName,
  capitalizeWords,
  getCodes,
} from "../utils/countryUtils";
import toast from "react-hot-toast";
import { leaseDurations } from "../utils/connection";
import { ConnectCard } from "./ConnectCard";
import { SelectCountry } from "./SelectCountry";
export interface SidebarProps {
  selectedCountry: { name: string; flag: string } | null;
  setSelectedCountry: (country: { name: string; flag: string } | null) => void;
  connected: boolean;
  setConnected: (connected: boolean) => void;
  setConnectionInfo: (info: ConnectionInfo) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedCountry,
  setSelectedCountry,
  connected,
  setConnected,
  setConnectionInfo,
}) => {
  const [search, setSearch] = useState("");
  const [selectedLease, setSelectedLease] = useState("");
  const [countries, setCountries] = useState<{ name: string; flag: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    let retryTimeout: NodeJS.Timeout | null = null;
    let cancelled = false;

    async function fetchCountries() {
      setLoading(true);
      setError(false);
      try {
        if (window.electron && window.electron.getCountries) {
          const countryNames = await window.electron.getCountries();
          if (Array.isArray(countryNames) && countryNames.length > 0) {
            setCountries(
              countryNames.map((name: string) => {
                const code = getCountryCodeByName(name);
                return {
                  name,
                  flag: code ? codeToFlagEmoji(code) : "🏳️",
                };
              })
            );
            setLoading(false);
            return;
          } else {
            setCountries([]);
          }
        } else {
          setCountries([]);
        }
      } catch {
        setError(true);
        setCountries([]);
      }

      if (!cancelled) {
        retryTimeout = setTimeout(fetchCountries, 2000);
      }

      setLoading(false);
    }

    // Initial fetch on load
    fetchCountries();

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []); // ← Only runs on mount

  useEffect(() => {
    if (loading) return;
    const intervalId = setInterval(() => {
      if (window.electron && window.electron.getCountries) {
        window.electron
          .getCountries()
          .then((countryNames) => {
            if (Array.isArray(countryNames) && countryNames.length > 0) {
              setCountries(
                countryNames.map((name: string) => {
                  const code = getCountryCodeByName(name);
                  return {
                    name,
                    flag: code ? codeToFlagEmoji(code) : "🏳️",
                  };
                })
              );
            }
          })
          .catch(() => {
            // Optional: silent catch for background polling
          });
      }
    }, 600000); // every 10 minutes

    return () => clearInterval(intervalId);
  }, []); // ← Also runs on mount, but sets up background polling

  const handleConnect = async () => {
    if (!selectedCountry || !selectedLease) return;

    setConnecting(true);

    const connectPromise = window.electron.connectToCountry({
      country: selectedCountry?.name,
      lease: +selectedLease,
    });

    toast.promise(connectPromise, {
      loading: `Connecting to ${capitalizeWords(selectedCountry.name)}...`,
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
        return `Failed to connect: Please try agian.`;
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

  const filteredCountries = countries.filter((c) =>
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
            loading={loading}
            setSearch={setSearch}
            error={error}
            filteredCountries={filteredCountries}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
          />
        )}
      </div>
      {/* Selected Country & Connect Card (only show if selectedCountry, not connected, and not loading) */}
      {selectedCountry && !connected && !loading && (
        <ConnectCard
          selectedCountry={selectedCountry}
          selectedLease={selectedLease}
          connecting={connecting}
          setSelectedLease={setSelectedLease}
          leaseDurations={leaseDurations}
          canceling={canceling}
          handleConnect={handleConnect}
        />
      )}
    </div>
  );
};

export default Sidebar;
