import { PuffLoader } from "react-spinners";
import { capitalizeWords } from "../utils/countryUtils";

interface Country {
  name: string;
  flag: string;
};

interface SelectCountryProps  {
  search: string;
  loading: boolean;
  setSearch: (payload: string) => void;
  error: boolean;
  filteredCountries: Country[];
  selectedCountry: Country | null ;
  setSelectedCountry: (payload: Country) => void;
};

export const SelectCountry: React.FC<SelectCountryProps> = ({
  search,
  loading,
  setSearch,
  error,
  filteredCountries,
  selectedCountry,
  setSelectedCountry,
}) => {
  return (
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
          <PuffLoader size={50} color="#ffffff" />
          <span className="text-gray-400 text-sm">Loading countries...</span>
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
          {filteredCountries.map((c: any, index: number) => (
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
              <span className="font-medium">{capitalizeWords(c.name)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};
