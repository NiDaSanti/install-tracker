import React from 'react';
import axios from 'axios';
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
      alert(`Could not find coordinates for address. Please check the location.`);
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
      const response = await axios.post('/api/installations', newInstallation);
      
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
      
      alert('Installation added successfully!');
    } catch (error) {
      console.error('Error creating installation:', error);
      alert('Failed to add installation. Please try again.');
    }
  };


  return (
    <form onSubmit={handleSubmit}>
      <h2>Add New Installation</h2>
      
      <div className="form-grid full-width">
        <div>
          <label>Homeowner Name:</label>
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
          <label>Street Address:</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
        <div>
          <label>City:</label>
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
          <label>State:</label>
          <input
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Zip Code:</label>
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
          <label>System Size (kW):</label>
          <input
            type="number"
            step="0.1"
            value={systemSize}
            onChange={(e) => setSystemSize(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Install Date:</label>
          <input
            type="date"
            value={installDate}
            onChange={(e) => setInstallDate(e.target.value)}
          />
        </div>
      </div>

      <div className="form-grid full-width">
        <div>
          <label>Notes:</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <button type="submit">Add Installation</button>
    </form>
  );
};

export default InstallationForm;  