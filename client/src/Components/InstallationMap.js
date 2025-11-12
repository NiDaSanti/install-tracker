import React, {useEffect, useMemo, useState} from 'react';
import {MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LocationIcon, PowerIcon, CalendarIcon, NoteIcon, MapIcon } from '../Icons';

const STADIA_API_KEY = process.env.REACT_APP_STADIA_API_KEY;
const STAMEN_TONER_URL_BASE = 'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png';
const stamenTonerUrl = STADIA_API_KEY
  ? `${STAMEN_TONER_URL_BASE}?api_key=${STADIA_API_KEY}`
  : STAMEN_TONER_URL_BASE;

const TILE_STYLE_LIBRARY = {
  cartoPositron: {
    label: 'Carto Positron (Clean Light)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  },
  cartoDarkMatter: {
    label: 'Carto Dark Matter (Midnight)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  },
  stamenToner: {
    label: STADIA_API_KEY
      ? 'Stamen Toner (Blueprint)'
      : 'Stamen Toner (Blueprint - Stadia API key required)',
    url: stamenTonerUrl,
    attribution: 'Map tiles by <a href="https://stadiamaps.com/">Stadia Maps</a> & Stamen Design, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors.',
    subdomains: 'abcd',
    maxZoom: 20,
    requiresApiKey: true
  }
};

const iconCache = new Map();

const normalizeHex = (color) => {
  if (!color || typeof color !== 'string') {
    return '#00bff0';
  }
  const hex = color.trim();
  if (/^#([0-9a-fA-F]{3})$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  if (/^#([0-9a-fA-F]{6})$/.test(hex)) {
    return hex;
  }
  return '#00bff0';
};

const lightenHex = (hexColor, amount = 0.3) => {
  const hex = normalizeHex(hexColor).replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const mix = (component) => Math.round(component + (255 - component) * amount);

  const toHex = (component) => component.toString(16).padStart(2, '0');

  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
};

const createMarkerSvg = (accentColor) => {
  const lightColor = lightenHex(accentColor, 0.45);
  return `
    <svg width="34" height="34" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="rgba(12, 40, 78, 0.22)" />
      <circle cx="20" cy="20" r="16" fill="${lightColor}" stroke="${accentColor}" stroke-width="2" />
      <g transform="translate(20, 20)">
        <rect x="-6" y="-6" width="12" height="12" fill="rgba(7, 24, 38, 0.92)" rx="1.4" />
        <line x1="-6" y1="0" x2="6" y2="0" stroke="${accentColor}" stroke-width="0.6" opacity="0.7" />
        <line x1="0" y1="-6" x2="0" y2="6" stroke="${accentColor}" stroke-width="0.6" opacity="0.7" />
        <circle cx="0" cy="-7.6" r="1.2" fill="${accentColor}" />
      </g>
    </svg>
  `;
};

const getCustomIcon = (accentColor) => {
  const color = normalizeHex(accentColor);
  if (iconCache.has(color)) {
    return iconCache.get(color);
  }

  const svgIcon = createMarkerSvg(color);
  const icon = L.divIcon({
    html: svgIcon,
    className: 'custom-marker-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
  });

  iconCache.set(color, icon);
  return icon;
};

const InstallationMap = ({ installations, theme = 'light' }) => {
  const defaultCenter = [34.0522, -118.2437]; // Default to Los Angeles
  const defaultZoom = 10;
  const [styleKey, setStyleKey] = useState(() => (theme === 'dark' ? 'cartoDarkMatter' : 'cartoPositron'));

  useEffect(() => {
    setStyleKey(theme === 'dark' ? 'cartoDarkMatter' : 'cartoPositron');
  }, [theme]);

  const tileStyle = useMemo(() => {
    const selectedStyle = TILE_STYLE_LIBRARY[styleKey];
    if (!selectedStyle) {
      return TILE_STYLE_LIBRARY.cartoPositron;
    }

    if (selectedStyle.requiresApiKey && !STADIA_API_KEY) {
      return TILE_STYLE_LIBRARY.cartoPositron;
    }

    return selectedStyle;
  }, [styleKey]);

  const utilityLegendItems = useMemo(() => {
    const territoryMap = new Map();
    installations.forEach((inst) => {
      const territory = inst.utilityTerritory;
      if (territory?.code && !territoryMap.has(territory.code)) {
        territoryMap.set(territory.code, territory);
      }
    });
    return Array.from(territoryMap.values());
  }, [installations]);

  return (
    <div className="map-wrapper">
      <div className="map-style-toolbar">
        <label className="map-style-label" htmlFor="map-style-select">
          Map style
          <select
            id="map-style-select"
            className="map-style-select"
            value={styleKey}
            onChange={(event) => setStyleKey(event.target.value)}
          >
            {Object.entries(TILE_STYLE_LIBRARY).map(([key, style]) => {
              const optionDisabled = Boolean(style.requiresApiKey && !STADIA_API_KEY);
              return (
                <option key={key} value={key} disabled={optionDisabled}>
                  {style.label}
                </option>
              );
            })}
          </select>
        </label>
        {!STADIA_API_KEY && (
          <div className="map-style-hint">
            Add <code>REACT_APP_STADIA_API_KEY</code> to enable the blueprint layer.
          </div>
        )}
      </div>
      {utilityLegendItems.length > 0 && (
        <div className="utility-legend">
          {utilityLegendItems.map((territory) => (
            <span className="utility-legend-item" key={territory.code}>
              <span
                className="utility-legend-swatch"
                style={{ backgroundColor: territory.color }}
                aria-hidden="true"
              />
              <span className="utility-legend-label">{territory.name}</span>
            </span>
          ))}
        </div>
      )}
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="map-frame"
      >
        {/* Dynamic map tiles */}
        <TileLayer
          key={styleKey}
          url={tileStyle.url}
          attribution={tileStyle.attribution}
          maxZoom={tileStyle.maxZoom}
          subdomains={tileStyle.subdomains}
        />
      
        {/* Add markers for each installation */}
        {installations
          .filter(inst => inst.latitude && inst.longitude) // Only show if coordinates exist
          .map((installation) => (
            <Marker
              key={installation.id}
              position={[installation.latitude, installation.longitude]}
              icon={getCustomIcon(installation.utilityTerritory?.color)}
            >
              <Popup className="custom-popup">
                <div className="popup-content">
                  <div className="popup-header">
                    <div className="popup-icon" aria-hidden="true">
                      <PowerIcon size={20} />
                    </div>
                    <div className="popup-title">
                      <h3>{installation.homeownerName}</h3>
                      <p className="popup-subtitle">{installation.systemSize} system</p>
                    </div>
                  </div>
                  
                  <div className="popup-body">
                    <div className="popup-section">
                      <div className="popup-label">
                        <LocationIcon size={16} className="popup-label-icon" />
                        <span>Location</span>
                      </div>
                      <div className="popup-value">
                        {installation.address}<br/>
                        {installation.city}, {installation.state} {installation.zip}
                      </div>
                    </div>

                    {installation.utilityTerritory && (
                      <div className="popup-section">
                        <div className="popup-label">
                          <MapIcon size={16} className="popup-label-icon" />
                          <span>Utility Territory</span>
                        </div>
                        <div className="popup-value">{installation.utilityTerritory.name}</div>
                      </div>
                    )}
                    
                    <div className="popup-section">
                      <div className="popup-label">
                        <PowerIcon size={16} className="popup-label-icon" />
                        <span>System Size</span>
                      </div>
                      <div className="popup-value">{installation.systemSize}</div>
                    </div>
                    
                    <div className="popup-section">
                      <div className="popup-label">
                        <CalendarIcon size={16} className="popup-label-icon" />
                        <span>Install Date</span>
                      </div>
                      <div className="popup-value">
                        {new Date(installation.installDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    
                    {installation.notes && (
                      <div className="popup-section">
                        <div className="popup-label">
                          <NoteIcon size={16} className="popup-label-icon" />
                          <span>Notes</span>
                        </div>
                        <div className="popup-value">{installation.notes}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="popup-footer">
                    Installation ID: {installation.id}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
};

export default InstallationMap;