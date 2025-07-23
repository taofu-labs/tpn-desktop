import React, { useState, useEffect } from "react";
import {
  codeToFlagEmoji,
  getCountryCodeByName,
  capitalizeWords,
} from "../utils/countryUtils";
import toast from "react-hot-toast";
import { leaseDurations } from "../utils/connection";
import { PuffLoader } from "react-spinners";
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
          <>
            <input
              type="text"
              placeholder="Country"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded bg-[#232733] border border-[#2A2E3D] text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
              <PuffLoader
                  size={50}
                  color="#ffffff"
                />
                <span className="text-gray-400 text-sm">
                  Loading countries...
                </span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                <div className="text-orange-400 text-sm font-medium">
                  Failed to load, will try again
                </div>
                <div className="text-gray-400 text-xs max-w-[200px]">
                  This is expected, retrying automatically...
                </div>
              </div>
            ) : filteredCountries.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No countries available.
              </div>
            ) : (
              <ul className="max-h-80 sm:max-h-96 overflow-y-auto custom-scrollbar">
                {filteredCountries.map((c, index) => (
                  <li
                    key={index}
                    className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded cursor-pointer mb-1 transition-colors text-sm sm:text-base ${
                      selectedCountry?.name === c.name
                        ? "bg-[#232F4B] text-blue-400"
                        : "hover:bg-[#232733]"
                    }`}
                    onClick={() => setSelectedCountry(c)}
                  >
                    <span className="text-lg sm:text-xl">{c.flag}</span>
                    <span className="font-medium">
                      {capitalizeWords(c.name)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      {/* Selected Country & Connect Card (only show if selectedCountry, not connected, and not loading) */}
      {selectedCountry && !connected && !loading && (
        <div className="bg-[#181A20] border border-blue-500 shadow-xl p-4 sm:p-6 relative">
          {/* Corner dots */}
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          <div className="mb-2 text-xs sm:text-sm text-gray-300 font-semibold">
            Selected Country
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl sm:text-2xl">{selectedCountry.flag}</span>
            <span className="font-bold text-base sm:text-lg">
              {capitalizeWords(selectedCountry.name)}
            </span>
          </div>
          <select
            className="w-full mb-4 px-3 py-2 rounded bg-[#232733] border border-[#2A2E3D] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            value={selectedLease}
            onChange={(e) => setSelectedLease(e.target.value)}
            disabled={connecting}
          >
            <option value="" disabled>
              Select lease duration
            </option>
            {leaseDurations.map((d, index) => (
              <option key={index} value={d.minute}>
                {d.time}
              </option>
            ))}
          </select>
          <button
            className="w-full py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs sm:text-sm tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={!selectedLease || connecting}
            onClick={handleConnect}
          >
            {connecting ? (
              <>
                <PuffLoader
                  size={50}
                  color="#ffffff"
                />
                CONNECTING...
              </>
            ) : (
              "CONNECT"
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
