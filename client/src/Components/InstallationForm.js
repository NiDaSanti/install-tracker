import React from 'react';
import apiClient from '../apiClient';
import {geocodeAddress} from '../utils/geocode'

const InstallationForm = ({ onSubmit }) => {
  const [homeownerName, setHomeownerName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [city, setCity] = React.useState('');
  const [state, setState] = React.useState('');
  const [zip, setZip] = React.useState('');
  const [systemSize, setSystemSize] = React.useState('');
  const [installDate, setInstallDate] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Combine address fields for geocoding
    const fullAddress = `${address}, ${city}, ${state} ${zip}`;
    const geocodeResult = await geocodeAddress(fullAddress);

    if (!geocodeResult.success) {
      alert('Could not verify that address. Please check it.');
      // You can choose to continue anyway or return here
      // return;
    }
    
    try {
      const newInstallation = {
        homeownerName,
        address,
        city,
        state,
        zip,
        systemSize,
        installDate,
        notes,
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude
      };
      
      // Send POST request to backend API
  const response = await apiClient.post('/api/installations', newInstallation);
      
      console.log('Installation created:', response.data);
      
      // Call parent callback if provided
      if (onSubmit) {
        onSubmit(response.data);
      }
      
      // Clear form
      setHomeownerName('');
      setAddress('');
      setCity('');
      setState('');
      setZip('');
      setSystemSize('');
      setInstallDate('');
      setNotes('');
      
      alert('Installation saved.');
    } catch (error) {
      console.error('Error creating installation:', error);
      alert('Could not add installation. Try again.');
    }
  };


  return (
    <form onSubmit={handleSubmit}>
      <h2>Add installation</h2>
      
      <div className="form-grid full-width">
        <div>
          <label>Homeowner name</label>
          <input
            type="text"
            value={homeownerName}
            onChange={(e) => setHomeownerName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label>Street address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
        <div>
          <label>City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label>State</label>
          <input
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
          />
        </div>
        <div>
          <label>ZIP code</label>
          <input
            type="text"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label>System size (kW)</label>
          <input
            type="number"
            step="0.1"
            value={systemSize}
            onChange={(e) => setSystemSize(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Install date</label>
          <input
            type="date"
            value={installDate}
            onChange={(e) => setInstallDate(e.target.value)}
          />
        </div>
      </div>

      <div className="form-grid full-width">
        <div>
          <label>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <button type="submit">Save installation</button>
    </form>
  );
};

export default InstallationForm;  