import React from 'react';
import {MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Create a beautiful custom icon with solar panel theme
const createCustomIcon = () => {
  const svgIcon = `
    <svg width="34" height="34" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <!-- Shadow circle -->
      <circle cx="20" cy="20" r="18" fill="#2c3e50" opacity="0.2"/>
      
      <!-- Main circle background -->
      <circle cx="20" cy="20" r="16" fill="#3498db"/>
      <circle cx="20" cy="20" r="16" fill="url(#gradient)" stroke="#2c3e50" stroke-width="2"/>
      
      <!-- Gradient definition -->
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3498db;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2980b9;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Solar panel icon -->
      <g transform="translate(20, 20)">
        <!-- Panel grid -->
        <rect x="-6" y="-6" width="12" height="12" fill="white" opacity="0.9" rx="1"/>
        <line x1="-6" y1="0" x2="6" y2="0" stroke="#2c3e50" stroke-width="0.5"/>
        <line x1="0" y1="-6" x2="0" y2="6" stroke="#2c3e50" stroke-width="0.5"/>
        
        <!-- Sun rays -->
        <circle cx="0" cy="-8" r="1" fill="#f39c12"/>
        <line x1="0" y1="-10" x2="0" y2="-12" stroke="#f39c12" stroke-width="1" stroke-linecap="round"/>
        <line x1="-2" y1="-9" x2="-3.5" y2="-10.5" stroke="#f39c12" stroke-width="1" stroke-linecap="round"/>
        <line x1="2" y1="-9" x2="3.5" y2="-10.5" stroke="#f39c12" stroke-width="1" stroke-linecap="round"/>
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

const InstallationMap = ({ installations }) => {
  const defaultCenter = [34.0522, -118.2437]; // Default to Los Angeles
  const defaultZoom = 10;

  return(
  <div style={{ height: '600px', width: '100%' }}>
    <MapContainer 
      center={defaultCenter} 
      zoom={defaultZoom} 
      style={{ height: '100%', width: '100%' }}
    >
      {/* OpenStreetMap - Colorful, detailed map style */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
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
        ))
      }
    </MapContainer>
  </div>
  );
};

export default InstallationMap;