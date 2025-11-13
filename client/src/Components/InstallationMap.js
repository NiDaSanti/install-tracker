import React, {useEffect, useMemo, useState} from 'react';
import {MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LocationIcon, PowerIcon, CalendarIcon, NoteIcon, MapIcon } from '../Icons';

const ANNUAL_OUTPUT_PER_KW = 1350;

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

const numberFormatter = new Intl.NumberFormat('en-US');

const formatInstallDate = (value) => {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return dateFormatter.format(parsed);
};

const getRelativeAge = (value) => {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();

  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffDays <= 0) {
    return 'Just completed';
  }

  if (diffDays === 1) {
    return '1 day ago';
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 9) {
    return `${diffWeeks} wk${diffWeeks === 1 ? '' : 's'} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 24) {
    return `${diffMonths} mo${diffMonths === 1 ? '' : 's'} ago`;
  }

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} yr${diffYears === 1 ? '' : 's'} ago`;
};

const getProductionEstimate = (systemSize) => {
  const numeric = Number(systemSize);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  return Math.round(numeric * ANNUAL_OUTPUT_PER_KW);
};

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
              <Popup className="installation-popup" offset={[0, -12]}>
                {(() => {
                  const productionEstimate = getProductionEstimate(installation.systemSize);
                  const formattedDate = formatInstallDate(installation.installDate);
                  const relativeAge = getRelativeAge(installation.installDate);
                  const territory = installation.utilityTerritory;
                  const locationLine = [installation.city, installation.state].filter(Boolean).join(', ');
                  const postalLine = installation.zip ? `• ${installation.zip}` : '';

                  return (
                    <div className="popup-card">
                      <header className="popup-card-header">
                        <div className="popup-card-icon" aria-hidden="true">
                          <PowerIcon size={18} />
                        </div>
                        <div className="popup-card-title-group">
                          <h3 className="popup-card-title">{installation.homeownerName || 'Unnamed install'}</h3>
                          <p className="popup-card-subtitle">{locationLine || 'Location pending'} {postalLine}</p>
                        </div>
                      </header>

                      <div className="popup-card-stats">
                        {territory && (
                          <span className="popup-chip popup-chip--utility">
                            <span className="popup-chip-dot" style={{ backgroundColor: territory.color || '#4aa8ff' }} aria-hidden="true" />
                            {territory.name}
                          </span>
                        )}
                        {installation.systemSize && (
                          <span className="popup-chip">
                            <PowerIcon size={14} aria-hidden="true" />
                            {installation.systemSize} kW
                          </span>
                        )}
                        <span className="popup-chip">
                          <CalendarIcon size={14} aria-hidden="true" />
                          {formattedDate}
                        </span>
                        <span className="popup-chip popup-chip--muted">{relativeAge}</span>
                      </div>

                      <dl className="popup-card-details">
                        {installation.address && (
                          <div className="popup-detail-row">
                            <dt>
                              <LocationIcon size={14} className="popup-detail-icon" aria-hidden="true" />
                              Address
                            </dt>
                            <dd>
                              {installation.address}
                            </dd>
                          </div>
                        )}
                        {productionEstimate && (
                          <div className="popup-detail-row">
                            <dt>
                              <PowerIcon size={14} className="popup-detail-icon" aria-hidden="true" />
                              Est. output
                            </dt>
                            <dd>
                              ≈ {numberFormatter.format(productionEstimate)} kWh/yr
                            </dd>
                          </div>
                        )}
                        {territory && (
                          <div className="popup-detail-row">
                            <dt>
                              <MapIcon size={14} className="popup-detail-icon" aria-hidden="true" />
                              Territory
                            </dt>
                            <dd>{territory.name}</dd>
                          </div>
                        )}
                        {installation.notes && (
                          <div className="popup-detail-row popup-detail-row--notes">
                            <dt>
                              <NoteIcon size={14} className="popup-detail-icon" aria-hidden="true" />
                              Notes
                            </dt>
                            <dd>{installation.notes}</dd>
                          </div>
                        )}
                      </dl>

                      <footer className="popup-card-footer">
                        <span className="popup-id-label">ID</span>
                        <span className="popup-id-value">{installation.id}</span>
                      </footer>
                    </div>
                  );
                })()}
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
};

export default InstallationMap;