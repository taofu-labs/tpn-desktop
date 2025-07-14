import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { countryData } from "./countryData";
import { serverIcon, connectedIcon } from "./utils/mapUtils";

interface Country {
  name: string;
  flag: string;
}

interface MapViewProps {
  connectedCountry: Country | null;
}

const ResponsiveMap: React.FC<MapViewProps> = ({ connectedCountry }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 480);
      setIsTablet(window.innerWidth <= 768 && window.innerWidth > 480);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
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
    dragging: false,
    touchZoom: false,
    keyboard: false,
    zoomControl: false,
  };

  const connectedCountryData = connectedCountry
    ? countryData.find(
        c => c.name.toLowerCase() === connectedCountry.name.toLowerCase()
      )
    : null;

  return (
    <MapContainer
      id="map"
      className="responsive-map"
      {...mapOptions}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        // @ts-expect-error react-leaflet v5 does not type noWrap or bounds, but Leaflet supports them
        noWrap={true}
        bounds={[[-90, -180], [90, 180]]}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        // @ts-expect-error react-leaflet v5 does not type noWrap or bounds, but Leaflet supports them
        noWrap={true}
        bounds={[[-90, -180], [90, 180]]}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        opacity={0}
      />

      {countryData.map((country) => (
        connectedCountryData && country.code === connectedCountryData.code ? null : (
          <Marker
            key={country.code}
            position={[country.lat, country.lng]}
            // @ts-expect-error react-leaflet v5 does not type icon prop
            icon={serverIcon}
          >
            <Tooltip>{country.name} {String.fromCodePoint(...[...country.code].map(c => 0x1f1e6 - 65 + c.charCodeAt(0)))}</Tooltip>
          </Marker>
        )
      ))}
      {/* Special marker for connected country */}
      {connectedCountryData && (
        <Marker
          key={connectedCountryData.code + "-connected"}
          position={[connectedCountryData.lat, connectedCountryData.lng]}
          // @ts-expect-error react-leaflet v5 does not type icon prop
          icon={connectedIcon}
        >
          <Tooltip>
            <span className="font-bold text-blue-400">Connected: </span>
            {connectedCountryData.name} {String.fromCodePoint(...[...connectedCountryData.code].map(c => 0x1f1e6 - 65 + c.charCodeAt(0)))}
          </Tooltip>
        </Marker>
      )}
    </MapContainer>
  );
};

const MapView: React.FC<MapViewProps> = (props) => <ResponsiveMap {...props} />;

export default MapView;
