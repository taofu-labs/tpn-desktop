import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { countryData } from "./countryData";
import { serverIcon, selectedIcon, connectedIcon } from "./utils/mapUtils";
import { codeToFlagEmoji, getCountryCodeByName } from "./utils/countryUtils";

interface Country {
  name: string;
  flag: string;
  code: string;
}

interface MapViewProps {
  connectedCountry: Country | null;
  selectedCountry?: Country | null;
  setSelectedCountry: any | null; // New prop for selected count
  connected: boolean;
  countries: any[];
}

// Component to handle map zoom animations
const MapController: React.FC<{
  selectedCountry: Country | null;
  connectedCountry: Country | null;
  setSelectedCountry: any | null;
  supportedCountries: any[];
}> = ({ selectedCountry, connectedCountry, supportedCountries }) => {
  const map = useMap();
  const lastSelectedCountry = useRef<string | null>(null);
  const normalizeCountryName = (name: string) => name.toLowerCase();

  useEffect(() => {
    if (
      selectedCountry &&
      selectedCountry.name !== lastSelectedCountry.current
    ) {
      const countryDataItem = supportedCountries.find(
        (c) =>
          c.name.toLowerCase() === normalizeCountryName(selectedCountry.name)
      );

      if (countryDataItem) {
        lastSelectedCountry.current = selectedCountry.name;

        // Smooth zoom animation to the selected country
        map.flyTo(
          [countryDataItem.lat, countryDataItem.lng],
          6, // Zoom level for country view
          {
            duration: 1.5, // Animation duration in seconds
            easeLinearity: 0.25,
            noMoveStart: false,
          }
        );
      }
    } else if (!selectedCountry && connectedCountry) {
      // If no country is selected but we're connected, zoom to connected country
      const countryDataItem = supportedCountries.find(
        (c) => c.name.toLowerCase() === connectedCountry.name.toLowerCase()
      );

      if (countryDataItem) {
        map.flyTo([countryDataItem.lat, countryDataItem.lng], 6, {
          duration: 1.5,
          easeLinearity: 0.25,
          noMoveStart: false,
        });
      }
    } else if (!selectedCountry && !connectedCountry) {
      // Reset to default view when nothing is selected
      lastSelectedCountry.current = null;
      const getCenter = (): [number, number] => {
        const isMobile = window.innerWidth <= 480;
        const isTablet = window.innerWidth <= 768 && window.innerWidth > 480;
        if (isMobile) return [30, 0];
        if (isTablet) return [25, 0];
        return [20, 0];
      };

      const getZoomLevel = () => {
        const isMobile = window.innerWidth <= 480;
        const isTablet = window.innerWidth <= 768 && window.innerWidth > 480;
        if (isMobile) return 2;
        if (isTablet) return 2.5;
        return 3;
      };

      map.flyTo(getCenter(), getZoomLevel(), {
        duration: 1.5,
        easeLinearity: 0.25,
        noMoveStart: false,
      });
    }
  }, [selectedCountry, connectedCountry, map]);
  return null; // This component doesn't render anything
};

const ResponsiveMap: React.FC<MapViewProps> = ({
  connectedCountry,
  selectedCountry,
  setSelectedCountry,
  connected,
  countries,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Filter countryData to only supported countries
  function filterSupportedCountriesByCode() {
    const filterCode = countries.map((c) => c.code.toLowerCase());

    return countryData.filter((country) =>
      filterCode.includes(country.code.toLowerCase())
    );
  }
  const supportedCountries = filterSupportedCountriesByCode();

  const selectCountry = (country: any) => {
    const countryCode = getCountryCodeByName(country.name);
    const countryFlag = codeToFlagEmoji(String(countryCode));
    setSelectedCountry({ name: country.name, flag: countryFlag });
  };

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 480);
      setIsTablet(window.innerWidth <= 768 && window.innerWidth > 480);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const getZoomLevel = () => {
    if (isMobile) return 2;
    if (isTablet) return 2.5;
    return 3;
  };

  const getCenter = (): [number, number] => {
    if (isMobile) return [30, 0];
    if (isTablet) return [25, 0];
    return [20, 0];
  };

  const mapOptions = {
    center: getCenter(),
    zoom: getZoomLevel(),
    scrollWheelZoom: false,
    doubleClickZoom: false,
    dragging: connected ? false : true,
    touchZoom: true,
    keyboard: false,
    zoomControl: false,
  };

  const connectedCountryData = connectedCountry
    ? supportedCountries.find(
        (c) => c.name.toLowerCase() === connectedCountry.name.toLowerCase()
      )
    : null;

  const selectedCountryData = selectedCountry
    ? supportedCountries.find(
        (c) => c.name.toLowerCase() === selectedCountry.name.toLowerCase()
      )
    : null;

  return (
    <MapContainer
      id="map"
      className="responsive-map"
      {...mapOptions}
      // Note: preferCanvas and keepBuffer are not supported in react-leaflet v5
      // Leaflet will cache tiles as the user interacts for smooth zoom
    >
      <MapController
        selectedCountry={selectedCountry || null}
        connectedCountry={connectedCountry}
        setSelectedCountry={setSelectedCountry}
        supportedCountries={supportedCountries}
      />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        // @ts-expect-error react-leaflet v5 does not type noWrap or bounds, but Leaflet supports them
        noWrap={true}
        bounds={[
          [-90, -180],
          [90, 180],
        ]}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        // @ts-expect-error react-leaflet v5 does not type noWrap or bounds, but Leaflet supports them
        noWrap={true}
        bounds={[
          [-90, -180],
          [90, 180],
        ]}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        opacity={0}
      />

      {supportedCountries.map((country, index) => {
        // Skip if this is the connected country (it has its own special marker)
        if (
          connectedCountryData &&
          country.code === connectedCountryData.code
        ) {
          return null;
        }

        // Skip if this is the selected country (it has its own special marker)
        if (selectedCountryData && country.code === selectedCountryData.code) {
          return null;
        }
        return (
          <Marker
            key={index}
            position={[country.lat, country.lng]}
            // @ts-expect-error react-leaflet v5 does not type icon prop
            icon={serverIcon}
            eventHandlers={{
              click: () => {
                if (connected) return;
                selectCountry(country);
                // You can also trigger a popup, route, or state update here
              },
            }}
          >
            <Tooltip>
              {country.name}{" "}
              {String.fromCodePoint(
                ...[...country.code].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0))
              )}
            </Tooltip>
          </Marker>
        );
      })}

      {/* Special marker for selected country (gold glow) */}
      {selectedCountryData && !connectedCountryData && (
        <Marker
          key={selectedCountryData.code + "-selected"}
          position={[selectedCountryData.lat, selectedCountryData.lng]}
          // @ts-expect-error react-leaflet v5 does not type icon prop

          icon={selectedIcon}
        >
          <Tooltip>
            <span className="font-bold text-yellow-400">Selected: </span>
            {selectedCountryData.name}{" "}
            {String.fromCodePoint(
              ...[...selectedCountryData.code].map(
                (c) => 0x1f1e6 - 65 + c.charCodeAt(0)
              )
            )}
          </Tooltip>
        </Marker>
      )}

      {/* Special marker for connected country (green glow) */}
      {connectedCountryData && (
        <Marker
          key={connectedCountryData.code + "-connected"}
          position={[connectedCountryData.lat, connectedCountryData.lng]}
          // @ts-expect-error react-leaflet v5 does not type icon prop
          icon={connectedIcon}
        >
          <Tooltip>
            <span className="font-bold text-blue-400">Connected: </span>
            {connectedCountryData.name}{" "}
            {String.fromCodePoint(
              ...[...connectedCountryData.code].map(
                (c) => 0x1f1e6 - 65 + c.charCodeAt(0)
              )
            )}
          </Tooltip>
        </Marker>
      )}
    </MapContainer>
  );
};

const MapView: React.FC<MapViewProps> = (props) => <ResponsiveMap {...props} />;

export default MapView;
