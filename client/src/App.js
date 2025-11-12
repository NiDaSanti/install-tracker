import React, { useState, useEffect } from 'react';
import apiClient from './apiClient';
import './App.css';
import InstallationList from './Components/InstallationList';
import InstallationForm from './Components/InstallationForm';
import InstallationMap from './Components/InstallationMap';
import Login from './Components/Login';
import {
  LogoIcon,
  SunIcon,
  MoonIcon,
  LogoutIcon,
  AddIcon,
  ListIcon,
  MapIcon,
  WarningIcon
} from './Icons';
import { getToken, setToken as storeToken, clearToken as eraseToken } from './auth';

function App() {
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const [authToken, setAuthToken] = useState(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return getToken();
  });

  const [currentUser, setCurrentUser] = useState(null);

  const fetchInstallations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/installations');
      setInstallations(response.data);
      setError(null);
    } catch (err) {
      if (err?.response?.status === 401) {
        setError(null);
        return;
      }
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authToken) {
      setInstallations([]);
      setError(null);
      setLoading(false);
      return;
    }

    fetchInstallations();
  }, [authToken]);

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

  const handleLoginSuccess = (token, user) => {
    storeToken(token);
    setAuthToken(token);
    setCurrentUser(user ?? null);
    setError(null);
  };

  const handleLogout = () => {
    eraseToken();
    setAuthToken(null);
    setCurrentUser(null);
    setInstallations([]);
    setError(null);
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      eraseToken();
      setAuthToken(null);
      setCurrentUser(null);
      setInstallations([]);
      setError(null);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('install-tracker:unauthorized', handleUnauthorized);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('install-tracker:unauthorized', handleUnauthorized);
      }
    };
  }, []);

  const handleInstallationAdded = (newInstallation) => {
    setInstallations((prev) => [...prev, newInstallation]);
  };

  const handleInstallationDeleted = (deletedId) => {
    setInstallations((prev) => prev.filter((inst) => inst.id !== deletedId));
  };

  const handleInstallationUpdated = (updatedInstallation) => {
    setInstallations((prev) =>
      prev.map((inst) => (inst.id === updatedInstallation.id ? updatedInstallation : inst))
    );
  };

  if (!authToken) {
    return (
      <div className="auth-screen">
        <Login onSuccess={handleLoginSuccess} />
      </div>
    );
  }

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
        <WarningIcon className="status-icon" size={68} />
        <h2>Something went wrong</h2>
        <p>{error.message || 'We were unable to load your installations. Please try again.'}</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-top">
          <div className="header-main">
            <div className="app-title">
              <LogoIcon size={34} className="app-title-icon" />
              <div className="app-title-text">
                <h1>Installation Tracker</h1>
                <p className="subtitle">Operational visibility for every install</p>
              </div>
            </div>
          </div>
          <div className="header-actions">
            {currentUser && (
              <p className="user-info">
                <span className="user-indicator" aria-hidden="true" />
                <span>Signed in as </span>
                <span className="username">{currentUser.username}</span>
              </p>
            )}
            <button
              type="button"
              className="theme-toggle-button"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDarkTheme ? 'light' : 'dark'} mode`}
            >
              {isDarkTheme ? (
                <SunIcon className="button-icon" size={18} />
              ) : (
                <MoonIcon className="button-icon" size={18} />
              )}
              <span>{isDarkTheme ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button
              type="button"
              className="theme-toggle-button sign-out-button"
              onClick={handleLogout}
            >
              <LogoutIcon className="button-icon" size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            <AddIcon className="tab-icon" size={18} />
            <span className="tab-label">New Installation</span>
          </button>
          <button 
            className={`tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            <ListIcon className="tab-icon" size={18} />
            <span className="tab-label">Installation Log ({installations.length})</span>
          </button>
          <button 
            className={`tab ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            <MapIcon className="tab-icon" size={18} />
            <span className="tab-label">Map Overview</span>
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
              <InstallationMap installations={installations} theme={theme} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
