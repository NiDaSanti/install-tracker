import React, { useState, useEffect, useMemo } from 'react';
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
  WarningIcon,
  PowerIcon,
  CalendarIcon,
  LocationIcon,
  NoteIcon
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
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(min-width: 1200px)').matches;
  });

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(min-width: 1200px)');
    const handleChange = (event) => {
      setIsDesktop(event.matches);
    };

    handleChange(mediaQuery);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Safari fallback
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

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

  const analytics = useMemo(() => {
    const toNumeric = (value) => {
      const numberValue = Number.parseFloat(value);
      return Number.isFinite(numberValue) ? numberValue : 0;
    };

    const toTimestamp = (value) => {
      if (!value) {
        return 0;
      }
      const time = new Date(value).getTime();
      return Number.isFinite(time) ? time : 0;
    };

    if (!installations || installations.length === 0) {
      return {
        totalInstallations: 0,
        totalCapacity: 0,
        averageSystemSize: 0,
        installationsThisMonth: 0,
        installationsLast30Days: 0,
        uniqueStates: 0,
        notesCoverage: 0,
        coordinateCoverage: 0,
        latestInstallation: null,
        recentActivity: [],
        topStates: []
      };
    }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

    const sizes = installations.map((inst) => toNumeric(inst.systemSize));
    const validSizes = sizes.filter((size) => size > 0);
    const totalCapacity = validSizes.reduce((sum, value) => sum + value, 0);
    const averageSystemSize = validSizes.length > 0 ? totalCapacity / validSizes.length : 0;

    const installationsThisMonth = installations.filter((inst) => toTimestamp(inst.installDate) >= startOfMonth.getTime()).length;
    const installationsLast30Days = installations.filter((inst) => toTimestamp(inst.installDate) >= thirtyDaysAgo.getTime()).length;
    const installationsPrevious30Days = installations.filter((inst) => {
      const timestamp = toTimestamp(inst.installDate);
      return timestamp >= sixtyDaysAgo.getTime() && timestamp < thirtyDaysAgo.getTime();
    }).length;

    const coordinateCoverage = installations.filter(
      (inst) => Number.isFinite(Number(inst.latitude)) && Number.isFinite(Number(inst.longitude))
    ).length;

    const notesCoverage = installations.filter((inst) => inst.notes && inst.notes.trim().length > 0).length;

    const stateCounts = installations.reduce((acc, inst) => {
      const stateKey = inst.state ? inst.state.trim().toUpperCase() : '';
      if (!stateKey) {
        return acc;
      }
      acc[stateKey] = (acc[stateKey] || 0) + 1;
      return acc;
    }, {});

    const timelineSorted = [...installations].sort(
      (a, b) => toTimestamp(b.installDate) - toTimestamp(a.installDate)
    );

    const latestInstallation = timelineSorted.find((inst) => toTimestamp(inst.installDate) > 0) || null;
    const recentActivity = timelineSorted.slice(0, 4);

    const topStates = Object.entries(stateCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([state, count]) => ({
        state,
        count,
        share: count / installations.length
      }));

    return {
      totalInstallations: installations.length,
      totalCapacity,
      averageSystemSize,
      installationsThisMonth,
      installationsLast30Days,
      installationsPrevious30Days,
      uniqueStates: Object.keys(stateCounts).length,
      notesCoverage,
      coordinateCoverage,
      latestInstallation,
      recentActivity,
      topStates
    };
  }, [installations]);

  const formatKw = (value) =>
    `${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} kW`;
  const formatNumber = (value) => Number(value || 0).toLocaleString();
  const formatPercent = (value) => `${Math.round(value || 0)}%`;
  const formatSystemSizeLabel = (value) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    const label = String(value).trim();
    return label.toLowerCase().includes('kw') ? label : `${label} kW`;
  };
  const formatLocation = (city, state) => {
    const segments = [city, state].filter(Boolean);
    return segments.length > 0 ? segments.join(', ') : 'Location TBD';
  };

  const geocodedCoveragePercent = analytics.totalInstallations
    ? Math.round((analytics.coordinateCoverage / analytics.totalInstallations) * 100)
    : 0;
  const notesCoveragePercent = analytics.totalInstallations
    ? Math.round((analytics.notesCoverage / analytics.totalInstallations) * 100)
    : 0;
  const averageSystemSizeDisplay = Number(analytics.averageSystemSize || 0).toLocaleString(undefined, {
    maximumFractionDigits: 1
  });
  const installations30DayDelta = analytics.installationsLast30Days - (analytics.installationsPrevious30Days || 0);

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

      {isDesktop ? (
        <div className="command-center">
          <section className="data-section command-overview">
            <div className="section-heading">
              <div className="section-heading-icon">
                <MapIcon size={22} />
              </div>
              <div>
                <h2>Command Center</h2>
                <p className="section-subtitle">Live system telemetry across your install base</p>
              </div>
            </div>

            <div className="metrics-grid">
              <article className="metric-card">
                <div className="metric-card-header">
                  <ListIcon size={18} className="metric-icon" />
                  <span className="metric-label">Total Installations</span>
                </div>
                <div className="metric-value">{formatNumber(analytics.totalInstallations)}</div>
                <p className="metric-subtext">Across all tracked customers</p>
              </article>

              <article className="metric-card">
                <div className="metric-card-header">
                  <PowerIcon size={18} className="metric-icon" />
                  <span className="metric-label">Live Capacity</span>
                </div>
                <div className="metric-value">{formatKw(analytics.totalCapacity)}</div>
                <p className="metric-subtext">Aggregate generating potential</p>
              </article>

              <article className="metric-card">
                <div className="metric-card-header">
                  <CalendarIcon size={18} className="metric-icon" />
                  <span className="metric-label">Deployments 30 Days</span>
                </div>
                <div className="metric-value">{formatNumber(analytics.installationsLast30Days)}</div>
                <p className="metric-subtext">
                  {installations30DayDelta >= 0 ? '+' : ''}{formatNumber(installations30DayDelta)} vs prior 30 days
                </p>
              </article>

              <article className="metric-card">
                <div className="metric-card-header">
                  <NoteIcon size={18} className="metric-icon" />
                  <span className="metric-label">Operational Notes</span>
                </div>
                <div className="metric-value">{formatPercent(notesCoveragePercent)}</div>
                <p className="metric-subtext">Installs carrying field intelligence</p>
              </article>

              <article className="metric-card">
                <div className="metric-card-header">
                  <PowerIcon size={18} className="metric-icon" />
                  <span className="metric-label">Avg. System Size</span>
                </div>
                <div className="metric-value">{averageSystemSizeDisplay} kW</div>
                <p className="metric-subtext">Optimized array footprint</p>
              </article>

              <article className="metric-card">
                <div className="metric-card-header">
                  <LocationIcon size={18} className="metric-icon" />
                  <span className="metric-label">Mapped Coverage</span>
                </div>
                <div className="metric-value">{formatPercent(geocodedCoveragePercent)}</div>
                <p className="metric-subtext">{formatNumber(analytics.uniqueStates)} active regions</p>
              </article>
            </div>
          </section>

          <div className="command-grid">
            <section className="command-panel command-panel--wide">
              <div className="panel-heading">
                <div>
                  <h3>Installation Log</h3>
                  <p className="panel-subtitle">Comprehensive roster of active deployments</p>
                </div>
                <span className="panel-meta">{formatNumber(analytics.totalInstallations)} records</span>
              </div>
              <InstallationList
                installations={installations}
                onDelete={handleInstallationDeleted}
                onUpdate={handleInstallationUpdated}
              />
            </section>

            <section className="command-panel command-panel--map">
              <div className="panel-heading">
                <div>
                  <h3>Geospatial Intelligence</h3>
                  <p className="panel-subtitle">Situational awareness across the field</p>
                </div>
                <span className="panel-meta">{formatPercent(geocodedCoveragePercent)} mapped</span>
              </div>
              <InstallationMap installations={installations} theme={theme} />
            </section>

            <section className="command-panel command-panel--form">
              <div className="panel-heading">
                <div>
                  <h3>Rapid Deployment</h3>
                  <p className="panel-subtitle">Launch a new installation mission</p>
                </div>
                <span className="panel-meta">Realtime sync</span>
              </div>
              <InstallationForm onSubmit={handleInstallationAdded} />
            </section>

            <section className="command-panel command-panel--wide insights-panel">
              <div className="panel-heading">
                <div>
                  <h3>Operational Insights</h3>
                  <p className="panel-subtitle">Decision-ready intelligence</p>
                </div>
              </div>
              <div className="insights-grid">
                <article className="insight-card">
                  <h4>Latest Activation</h4>
                  {analytics.latestInstallation ? (
                    <>
                      <p className="insight-primary">{analytics.latestInstallation.homeownerName}</p>
                      <p className="insight-meta">
                        {formatLocation(
                          analytics.latestInstallation.city,
                          analytics.latestInstallation.state
                        )}
                      </p>
                      <p className="insight-timestamp">
                        {new Date(analytics.latestInstallation.installDate).toLocaleDateString(undefined, {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="insight-note">
                        {formatSystemSizeLabel(analytics.latestInstallation.systemSize)} array
                      </p>
                    </>
                  ) : (
                    <p className="insight-empty">Deployments will appear here once logged.</p>
                  )}
                </article>

                <article className="insight-card">
                  <h4>Regional Footprint</h4>
                  {analytics.topStates.length > 0 ? (
                    <ul className="state-list">
                      {analytics.topStates.map(({ state, count, share }) => (
                        <li key={state}>
                          <span className="state-name">{state}</span>
                          <span className="state-metrics">
                            {formatNumber(count)} <span className="state-divider">•</span> {formatPercent(share * 100)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="insight-empty">Regional telemetry will populate as installs roll in.</p>
                  )}
                </article>

                <article className="insight-card">
                  <h4>Recent Activity</h4>
                  {analytics.recentActivity.length > 0 ? (
                    <ul className="activity-feed">
                      {analytics.recentActivity.map((inst) => {
                        const eventDate = inst.installDate
                          ? new Date(inst.installDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'Scheduled';
                        const activityLocation = formatLocation(inst.city, inst.state);
                        return (
                          <li key={inst.id}>
                            <div className="activity-primary">{inst.homeownerName}</div>
                            <div className="activity-meta">
                              <span>{activityLocation}</span>
                              <span className="activity-separator">·</span>
                              <span>{eventDate}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="insight-empty">Log an installation to build mission history.</p>
                  )}
                </article>
              </div>
            </section>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}

export default App;
