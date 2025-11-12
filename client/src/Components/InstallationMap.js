import React, {useEffect, useMemo, useState} from 'react';
import {MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

// Create a beautiful custom icon with solar panel theme
const createCustomIcon = () => {
  const svgIcon = `
    <svg width="34" height="34" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <!-- Shadow circle -->
      <circle cx="20" cy="20" r="18" fill="#2c3e50" opacity="0.2"/>
      
      <!-- Main circle background (neon gradient) -->
      <circle cx="20" cy="20" r="16" fill="url(#gradient)" stroke="#071826" stroke-width="1.5"/>
      
      <!-- Gradient definition -->
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#00e5ff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8a2be2;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Solar panel icon -->
      <g transform="translate(20, 20)">
        <!-- Panel grid -->
        <rect x="-6" y="-6" width="12" height="12" fill="#071826" opacity="0.9" rx="1"/>
        <line x1="-6" y1="0" x2="6" y2="0" stroke="#00e5ff" stroke-width="0.5" opacity="0.6"/>
        <line x1="0" y1="-6" x2="0" y2="6" stroke="#00e5ff" stroke-width="0.5" opacity="0.6"/>
        
        <!-- Small sun dot -->
        <circle cx="0" cy="-8" r="1" fill="#ffd166" opacity="0.95"/>
      </g>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
  });
};

const customIcon = createCustomIcon();

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
              icon={customIcon}
            >
              <Popup className="custom-popup">
                <div className="popup-content">
                  <div className="popup-header">
                    <div className="popup-icon">☀️</div>
                    <h3>{installation.homeownerName}</h3>
                  </div>
                  
                  <div className="popup-body">
                    <div className="popup-section">
                      <div className="popup-label">📍 Location</div>
                      <div className="popup-value">
                        {installation.address}<br/>
                        {installation.city}, {installation.state} {installation.zip}
                      </div>
                    </div>
                    
                    <div className="popup-section">
                      <div className="popup-label">⚡ System Size</div>
                      <div className="popup-value">{installation.systemSize}</div>
                    </div>
                    
                    <div className="popup-section">
                      <div className="popup-label">📅 Install Date</div>
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
                        <div className="popup-label">📝 Notes</div>
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