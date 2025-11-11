import React, {useState, useEffect} from 'react';
import axios from 'axios';
import './App.css';
import InstallationList from './Components/InstallationList';
import InstallationForm from './Components/InstallationForm';
import InstallationMap from './Components/InstallationMap';

function App() {
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('form');
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const storedTheme = window.localStorage.getItem('install-tracker-theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  });

  // Fetch installation from backend API
  const fetchInstallations = async () => {
    try {
      const response = await axios.get('/api/installations');
      setInstallations(response.data);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchInstallations();
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-theme', theme);
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('install-tracker-theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const isDarkTheme = theme === 'dark';

  const handleInstallationAdded = (newInstallation) => {
    setInstallations([...installations, newInstallation]);
  };

  const handleInstallationDeleted = (deletedId) => {
    setInstallations(installations.filter(inst => inst.id !== deletedId));
  }

  const handleInstallationUpdated = (updatedInstallation) => {
    setInstallations(installations.map(inst => 
      inst.id === updatedInstallation.id ? updatedInstallation : inst));
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading installations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>⚠️ Error</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-top">
          <div className="header-main">
            <h1>🏠 Installation Tracker</h1>
            <p className="subtitle">Manage and track your installations</p>
          </div>
          <button
            type="button"
            className="theme-toggle-button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDarkTheme ? 'light' : 'dark'} mode`}
          >
            <span className="theme-toggle-icon">{isDarkTheme ? '☀️' : '🌙'}</span>
            {isDarkTheme ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>

      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            ➕ Add Installation
          </button>
          <button 
            className={`tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            📋 Installations List ({installations.length})
          </button>
          <button 
            className={`tab ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            🗺️ Map View
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'form' && (
            <div className="tab-panel">
              <InstallationForm onSubmit={handleInstallationAdded} />
            </div>
          )}

          {activeTab === 'list' && (
            <div className="tab-panel">
              <InstallationList 
                installations={installations} 
                onDelete={handleInstallationDeleted}
                onUpdate={handleInstallationUpdated}
              />
            </div>
          )}

          {activeTab === 'map' && (
            <div className="tab-panel map-panel">
              <InstallationMap installations={installations} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
