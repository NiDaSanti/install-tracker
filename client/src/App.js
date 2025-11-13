import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ExpandIcon,
  CloseIcon,
  WarningIcon,
  PowerIcon,
  CalendarIcon,
  LocationIcon,
  NoteIcon
} from './Icons';
import { getToken, setToken as storeToken, clearToken as eraseToken } from './auth';
import { resolveUtilityTerritory } from './utils/utilityTerritories';

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
  const DASHBOARD_MEDIA_QUERY = '(min-width: 820px)';
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(DASHBOARD_MEDIA_QUERY).matches;
  });
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const modalRef = useRef(null);

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

  const mediaQuery = window.matchMedia(DASHBOARD_MEDIA_QUERY);
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

  useEffect(() => {
    if (typeof document === 'undefined' || !isMapModalOpen) {
      return undefined;
    }

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isMapModalOpen]);

  const openMapModal = () => {
    setIsMapModalOpen(true);
  };

  const closeMapModal = () => {
    setIsMapModalOpen(false);
  };

  useEffect(() => {
    if (!isMapModalOpen || typeof window === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMapModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMapModalOpen]);

  useEffect(() => {
    if (!isMapModalOpen || !modalRef.current) {
      return undefined;
    }

    const node = modalRef.current;
    try {
      node.focus({ preventScroll: true });
    } catch (focusError) {
      node.focus();
    }

    return undefined;
  }, [isMapModalOpen]);

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
    setIsMapModalOpen(false);
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      eraseToken();
      setAuthToken(null);
      setCurrentUser(null);
      setInstallations([]);
      setError(null);
      setIsMapModalOpen(false);
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

  const installationsWithTerritory = useMemo(
    () =>
      installations.map((installation) => ({
        ...installation,
        utilityTerritory: resolveUtilityTerritory(installation)
      })),
    [installations]
  );

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

    if (!installationsWithTerritory || installationsWithTerritory.length === 0) {
      return {
        totalInstallations: 0,
        totalCapacity: 0,
        averageSystemSize: 0,
        installationsThisMonth: 0,
        installationsLast30Days: 0,
        installationsPrevious30Days: 0,
        uniqueStates: 0,
        notesCoverage: 0,
        coordinateCoverage: 0,
        latestInstallation: null,
        recentActivity: [],
        topStates: [],
        utilityDistribution: [],
        topUtility: null
      };
    }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

    const sizes = installationsWithTerritory.map((inst) => toNumeric(inst.systemSize));
    const validSizes = sizes.filter((size) => size > 0);
    const totalCapacity = validSizes.reduce((sum, value) => sum + value, 0);
    const averageSystemSize = validSizes.length > 0 ? totalCapacity / validSizes.length : 0;

    const installationsThisMonth = installationsWithTerritory.filter((inst) => toTimestamp(inst.installDate) >= startOfMonth.getTime()).length;
    const installationsLast30Days = installationsWithTerritory.filter((inst) => toTimestamp(inst.installDate) >= thirtyDaysAgo.getTime()).length;
    const installationsPrevious30Days = installationsWithTerritory.filter((inst) => {
      const timestamp = toTimestamp(inst.installDate);
      return timestamp >= sixtyDaysAgo.getTime() && timestamp < thirtyDaysAgo.getTime();
    }).length;

    const coordinateCoverage = installationsWithTerritory.filter(
      (inst) => Number.isFinite(Number(inst.latitude)) && Number.isFinite(Number(inst.longitude))
    ).length;

    const notesCoverage = installationsWithTerritory.filter((inst) => inst.notes && inst.notes.trim().length > 0).length;

    const stateCounts = installationsWithTerritory.reduce((acc, inst) => {
      const stateKey = inst.state ? inst.state.trim().toUpperCase() : '';
      if (!stateKey) {
        return acc;
      }
      acc[stateKey] = (acc[stateKey] || 0) + 1;
      return acc;
    }, {});

    const timelineSorted = [...installationsWithTerritory].sort(
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
        share: count / installationsWithTerritory.length
      }));

    const utilityCounts = installationsWithTerritory.reduce((acc, inst) => {
      const territory = inst.utilityTerritory;
      const code = territory?.code || 'UNMAPPED';
      if (!acc[code]) {
        acc[code] = {
          code,
          name: territory?.name || 'Unmapped Utility',
          color: territory?.color || '#8a9fb2',
          count: 0
        };
      }
      acc[code].count += 1;
      return acc;
    }, {});

    const utilityDistribution = Object.values(utilityCounts)
      .sort((a, b) => b.count - a.count)
      .map((entry) => ({
        ...entry,
        share: entry.count / installationsWithTerritory.length
      }));

    const topUtility = utilityDistribution[0] || null;

    return {
      totalInstallations: installationsWithTerritory.length,
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
      topStates,
      utilityDistribution,
      topUtility
    };
  }, [installationsWithTerritory]);

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
  const currentYear = new Date().getFullYear();

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
    <div className="app-shell">
      <div className="app-container" id="top">
        <header className="app-header">
        <div className="header-top">
          <div className="header-main">
            <div className="app-title">
              <LogoIcon size={34} className="app-title-icon" />
              <div className="app-title-text">
                <h1>Installation Tracker</h1>
                <p className="subtitle">Overview of all installations</p>
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
                <h2>Dashboard Overview</h2>
                <p className="section-subtitle">Key numbers at a glance</p>
              </div>
            </div>

            <div className="metrics-grid">
              <article className="metric-card">
                <div className="metric-card-header">
                  <ListIcon size={18} className="metric-icon" />
                  <span className="metric-label">Total installs</span>
                </div>
                <div className="metric-value">{formatNumber(analytics.totalInstallations)}</div>
                <p className="metric-subtext">All recorded jobs</p>
              </article>

              <article className="metric-card">
                <div className="metric-card-header">
                  <PowerIcon size={18} className="metric-icon" />
                  <span className="metric-label">Total capacity</span>
                </div>
                <div className="metric-value">{formatKw(analytics.totalCapacity)}</div>
                <p className="metric-subtext">Combined system size</p>
              </article>

              <article className="metric-card">
                <div className="metric-card-header">
                  <CalendarIcon size={18} className="metric-icon" />
                  <span className="metric-label">Installs last 30 days</span>
                </div>
                <div className="metric-value">{formatNumber(analytics.installationsLast30Days)}</div>
                <p className="metric-subtext">
                  {installations30DayDelta >= 0 ? '+' : ''}{formatNumber(installations30DayDelta)} vs previous 30 days
                </p>
              </article>

              <article className="metric-card">
                <div className="metric-card-header">
                  <NoteIcon size={18} className="metric-icon" />
                  <span className="metric-label">Installations with notes</span>
                </div>
                <div className="metric-value">{formatPercent(notesCoveragePercent)}</div>
                <p className="metric-subtext">Jobs that include notes</p>
              </article>

              <article className="metric-card">
                <div className="metric-card-header">
                  <PowerIcon size={18} className="metric-icon" />
                  <span className="metric-label">Average system size</span>
                </div>
                <div className="metric-value">{averageSystemSizeDisplay} kW</div>
                <p className="metric-subtext">Average size across all jobs</p>
              </article>

              <article className="metric-card">
                <div className="metric-card-header">
                  <LocationIcon size={18} className="metric-icon" />
                  <span className="metric-label">Installations with map data</span>
                </div>
                <div className="metric-value">{formatPercent(geocodedCoveragePercent)}</div>
                <p className="metric-subtext">{formatNumber(analytics.uniqueStates)} states with installs</p>
              </article>

              <article className="metric-card">
                <div className="metric-card-header">
                  <MapIcon size={18} className="metric-icon" />
                  <span className="metric-label">Most common utility</span>
                </div>
                <div className="metric-value metric-value--compact">
                  {analytics.topUtility ? analytics.topUtility.name : '—'}
                </div>
                <p className="metric-subtext">
                  {analytics.topUtility
                    ? `${formatPercent(analytics.topUtility.share * 100)} of installs`
                    : 'Utility data appears when available'}
                </p>
              </article>
            </div>
          </section>

          <div className="command-grid">
            <section className="command-panel command-panel--wide">
              <div className="panel-heading">
                <div>
                  <h3>Installation list</h3>
                  <p className="panel-subtitle">All installations in one place</p>
                </div>
                <span className="panel-meta">{formatNumber(analytics.totalInstallations)} records</span>
              </div>
              <InstallationList
                installations={installationsWithTerritory}
                onDelete={handleInstallationDeleted}
                onUpdate={handleInstallationUpdated}
              />
            </section>

            <section className="command-panel command-panel--map">
              <div className="panel-heading">
                <div>
                  <h3>Installations map</h3>
                  <p className="panel-subtitle">See every install on the map</p>
                </div>
                <div className="panel-actions">
                  <button
                    type="button"
                    className="panel-action-button"
                    onClick={openMapModal}
                  >
                    <ExpandIcon className="button-icon" size={16} />
                    <span>Open full map</span>
                  </button>
                  <span className="panel-meta">{formatPercent(geocodedCoveragePercent)} mapped</span>
                </div>
              </div>
              <InstallationMap installations={installationsWithTerritory} theme={theme} />
            </section>

            <section className="command-panel command-panel--form">
              <div className="panel-heading">
                <div>
                  <h3>Add installation</h3>
                  <p className="panel-subtitle">Enter a new installation</p>
                </div>
                <span className="panel-meta">Saves automatically</span>
              </div>
              <InstallationForm onSubmit={handleInstallationAdded} />
            </section>

            <section className="command-panel command-panel--wide insights-panel">
              <div className="panel-heading">
                <div>
                  <h3>Insights</h3>
                  <p className="panel-subtitle">Recent highlights</p>
                </div>
              </div>
              <div className="insights-grid">
                <article className="insight-card">
                  <h4>Latest installation</h4>
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
                        {formatSystemSizeLabel(analytics.latestInstallation.systemSize)} system
                      </p>
                    </>
                  ) : (
                    <p className="insight-empty">Add an installation to see it here.</p>
                  )}
                </article>

                <article className="insight-card">
                  <h4>Top states</h4>
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
                    <p className="insight-empty">State data appears once installs are added.</p>
                  )}
                </article>

                <article className="insight-card">
                  <h4>Recent activity</h4>
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
                    <p className="insight-empty">Add an installation to see recent activity.</p>
                  )}
                </article>

                <article className="insight-card">
                  <h4>Utilities</h4>
                  {analytics.utilityDistribution.length > 0 ? (
                    <ul className="utility-list">
                      {analytics.utilityDistribution.map((entry) => (
                        <li key={entry.code}>
                          <span
                            className="utility-swatch"
                            style={{ backgroundColor: entry.color }}
                            aria-hidden="true"
                          />
                          <div className="utility-details">
                            <span className="utility-name">{entry.name}</span>
                            <span className="utility-metrics">
                              {formatNumber(entry.count)} installs
                              <span className="utility-divider">•</span>
                              {formatPercent(entry.share * 100)} coverage
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="insight-empty">Utility data shows once installs include utility info.</p>
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
              <span className="tab-label">Add installation</span>
            </button>
            <button
              className={`tab ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              <ListIcon className="tab-icon" size={18} />
              <span className="tab-label">Installation list ({installations.length})</span>
            </button>
            <button
              className={`tab ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
            >
              <MapIcon className="tab-icon" size={18} />
              <span className="tab-label">Map</span>
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
                  installations={installationsWithTerritory}
                  onDelete={handleInstallationDeleted}
                  onUpdate={handleInstallationUpdated}
                />
              </div>
            )}

            {activeTab === 'map' && (
              <div className="tab-panel map-panel">
                <div className="map-panel-actions">
                  <button
                    type="button"
                    className="panel-action-button"
                    onClick={openMapModal}
                  >
                    <ExpandIcon className="button-icon" size={16} />
                    <span>Open full map</span>
                  </button>
                  <span className="panel-meta">{formatPercent(geocodedCoveragePercent)} mapped</span>
                </div>
                <InstallationMap installations={installationsWithTerritory} theme={theme} />
              </div>
            )}
            </div>
          </div>
        )}
      </div>

      {isMapModalOpen && (
        <div className="map-modal">
          <div className="map-modal__backdrop" onClick={closeMapModal} />
          <div
            className="map-modal__content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-modal-title"
            aria-describedby="map-modal-description"
            ref={modalRef}
            tabIndex={-1}
          >
            <header className="map-modal__header">
              <div className="map-modal__title-block">
                <h2 className="map-modal__title" id="map-modal-title">Map view</h2>
                <p className="map-modal__subtitle" id="map-modal-description">
                  Large map showing every installation
                </p>
              </div>
              <div className="panel-actions map-modal__actions">
                <span className="panel-meta">{formatPercent(geocodedCoveragePercent)} mapped</span>
                <button
                  type="button"
                  className="panel-action-button panel-action-button--ghost map-modal__close"
                  onClick={closeMapModal}
                >
                  <CloseIcon className="button-icon" size={16} />
                  <span>Close</span>
                </button>
              </div>
            </header>
            <div className="map-modal__body">
              <InstallationMap
                key={`modal-${theme}`}
                installations={installationsWithTerritory}
                theme={theme}
                variant="expanded"
              />
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <div className="app-footer-inner">
          <div className="app-footer-brand">
            <LogoIcon size={32} className="app-footer-logo" aria-hidden="true" />
            <div className="app-footer-text">
              <span className="app-footer-title">Installation Tracker</span>
              <span className="app-footer-subtitle">Simple tracking for every install</span>
            </div>
          </div>
          <div className="app-footer-meta">
            <span className="app-footer-badge">Tracking since {currentYear}</span>
            <nav className="app-footer-nav" aria-label="Footer links">
              <a href="#top" className="app-footer-link">Back to top</a>
              <a href="mailto:ops@solarcommand.io" className="app-footer-link">ops@solarcommand.io</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
