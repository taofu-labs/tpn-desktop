import React, { useState, useEffect } from "react";
import { capitalizeWords } from "../utils/countryUtils";
import toast from "react-hot-toast";
import { startSpeedMonitoring } from "../utils/networkUtils";
import { FiUpload, FiDownload } from "react-icons/fi";
import { PuffLoader } from "react-spinners";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css"; // Import base styles

interface ConnectedCardProps {
  country: { name: string; flag: string } | null;
  setConnected: (connected: boolean) => void;
  connectionInfo: ConnectionInfo | null;
}

const ConnectedCard: React.FC<ConnectedCardProps> = ({
  country,
  setConnected,
  connectionInfo,
}) => {
  const [disconnecting, setDisconnecting] = useState(false);
  const [networkSpeeds, setNetworkSpeeds] = useState({ up: 0, down: 0 });
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    const disconnectPromise = window.electron.disconnect();

    toast.promise(disconnectPromise, {
      loading: "Disconnecting from VPN...",
      success: (result) => {
        if (result.success) {
          setConnected(false);
          return "Successfully disconnected from VPN";
        } else {
          throw new Error("Disconnect failed");
        }
      },
      error: (error) => {
        console.error("Disconnect error:", error);
        return `Failed to disconnect: Please restart application.`;
      },
    });

    try {
      const result = await disconnectPromise;
      if (result.success) {
        setConnected(false);
      }
    } catch (error) {
      console.error("Disconnect error:", error);
    } finally {
      setDisconnecting(false);
    }
  };

  // Format lease time remaining
  const formatLeaseTime = () => {
    if (remainingSeconds <= 0) return "Disconnecting...";
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}M : ${seconds
      .toString()
      .padStart(2, "0")}S`;
  };

  // Initialize and update countdown timer
  useEffect(() => {
    if (connectionInfo?.minutesRemaining) {
      // Convert minutes to seconds and set initial value
      const totalSeconds = connectionInfo.minutesRemaining * 60;
      setRemainingSeconds(totalSeconds);

      // Set up countdown timer
      const timer = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setRemainingSeconds(0);
      setDisconnecting(true);
      const disconnectPromise = window.electron.disconnect();
      ß;
      localStorage.removeItem("tpn-connected-country");
      toast.promise(disconnectPromise, {
        loading: "Disconnecting from VPN...",
        success: (result) => {
          if (result.success) {
            setConnected(false);
            return "Successfully disconnected from VPN";
          } else {
            throw new Error("Disconnect failed");
          }
        },
        error: (error) => {
          console.error("Disconnect error:", error);
          return `Failed to disconnect: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
        },
      });
    }
  }, [connectionInfo?.minutesRemaining, setConnected]);

  // Start speed monitoring when component mounts
  useEffect(() => {
    if (connectionInfo?.connected) {
      setIsMeasuring(true);
      const stopMonitoring = startSpeedMonitoring((speeds) => {
        setNetworkSpeeds({ up: speeds.upload, down: speeds.download });
        setIsMeasuring(false);
      }, 5000); // Measure every 30 seconds

      return stopMonitoring;
    }
  }, [connectionInfo?.connected]);

  return (
    <div className="bg-[#181A20] border border-blue-500 shadow-xl p-4 sm:p-6 w-[280px] sm:w-[340px] flex flex-col gap-3 sm:gap-4 relative">
      {/* Corner dots */}
      <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
      {/* TPN logo and stats */}
      <div className="flex items-center gap-3">
        <img
          src="/src/ui/assets/tpn-logo.png"
          alt="TPN Logo"
          className="h-6 sm:h-8 w-auto"
        />
        <div className="ml-auto flex gap-2">
          <Tippy content="Upload Speed (Mbps)" placement="bottom">
            <span className="bg-[#232F4B] cursor-pointer text-blue-300 text-xs px-2 py-1 rounded font-mono flex items-center gap-1">
              <FiUpload className="w-3 h-3" />
              {isMeasuring ? "..." : `${networkSpeeds.up.toFixed(1)}M`}
            </span>
          </Tippy>
          <Tippy content="Download Speed (Mbps)" placement="bottom">
            <span className="bg-[#232F4B] text-blue-300 text-xs px-2 py-1 cursor-pointer rounded font-mono flex items-center gap-1">
              <FiDownload className="w-3 h-3" />
              {isMeasuring ? "..." : `${networkSpeeds.down.toFixed(1)}M`}
            </span>
          </Tippy>
        </div>
      </div>
      {/* Connected status */}
      <div className="flex items-center gap-2 mt-2">
        <span className="h-3 w-3 rounded-full bg-green-400 inline-block"></span>
        <span className="text-xs sm:text-sm text-gray-300">
          Currently connected to
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl sm:text-2xl">{country?.flag}</span>
        <span className="font-bold text-base sm:text-lg">
          {country?.name ? capitalizeWords(country.name) : ""}
        </span>
      </div>
      {/* IP Address */}
      {connectionInfo?.originalIP && (
        <div className="text-xs sm:text-sm text-gray-300 mb-2">
          Original IP: {connectionInfo.originalIP}
        </div>
      )}
      {connectionInfo?.currentIP && (
        <div className="text-xs sm:text-sm text-gray-300 mb-2">
          Current IP: {connectionInfo.currentIP}
        </div>
      )}
      {/* Lease time */}
      <div className="flex items-center gap-2 text-gray-300 text-xs sm:text-sm mb-2">
        <span>⏳ Lease time remaining</span>
      </div>
      <div className="text-lg sm:text-2xl font-mono text-blue-200 mb-2">
        {formatLeaseTime()}
      </div>
      {/* Disconnect button */}
      <button
        className="w-full py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs sm:text-sm tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        disabled={disconnecting}
        onClick={handleDisconnect}
      >
        {disconnecting ? (
          <>
            <PuffLoader size={30} color="#ffffff" />
            DISCONNECTING...
          </>
        ) : (
          "DISCONNECT NOW"
        )}
      </button>
    </div>
  );
};

export default ConnectedCard;
