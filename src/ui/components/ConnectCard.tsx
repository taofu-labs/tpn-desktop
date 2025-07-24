import { capitalizeWords } from "../utils/countryUtils";
import { PuffLoader } from "react-spinners";

interface Country {
  name: string;
  flag: string;
};
interface Duration {
  time: string,
  minute: number
}
interface ConnectCountryProps {
  selectedLease: string;
  connecting: boolean;
  setSelectedLease: (payload: string) => void;
  canceling: boolean;
  selectedCountry: Country;
  handleConnect: () => void;
  leaseDurations: Duration[];
};

export const ConnectCard: React.FC<ConnectCountryProps> = ({
  selectedCountry,
  selectedLease,
  connecting,
  setSelectedLease,
  leaseDurations,
  canceling,
  handleConnect,
}) => {
  return (
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
        {leaseDurations.map((d: any, index: number) => (
          <option key={index} value={d.minute}>
            {d.time}
          </option>
        ))}
      </select>
      <div className="flex gap-3">
        <button
          className="w-full py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs sm:text-sm tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={!selectedLease || connecting}
          onClick={handleConnect}
        >
          {connecting ? (
            <small className="flex">
              <PuffLoader size={20} color="#ffffff" />
              CONNECTING...
            </small>
          ) : (
            "CONNECT"
          )}
        </button>
        <button
          className="w-full py-2 rounded bg-black hover:bg-red-500 text-white font-bold text-xs sm:text-sm tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={!selectedLease || !connecting || canceling}
        >
          {canceling ? (
            <small className="flex">
              <PuffLoader size={20} color="#ffffff" />
              CANCELING...
            </small>
          ) : (
            "CANCEL"
          )}
        </button>
      </div>
    </div>
  );
};
