import React, { useState } from 'react';
import apiClient from '../apiClient';
import { EditIcon, TrashIcon, ListIcon } from '../Icons';

const ANNUAL_OUTPUT_PER_KW = 1350; // Rough annual production estimate per kW capacity.

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

const numberFormatter = new Intl.NumberFormat('en-US');

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return dateFormatter.format(parsed);
}

function getRelativeAge(value) {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();

  if (diffMs < 0) {
    const daysUntil = Math.round(Math.abs(diffMs) / 86_400_000);
    if (daysUntil === 0) {
      return 'Scheduled for today';
    }
    if (daysUntil === 1) {
      return 'Scheduled in 1 day';
    }
    return `Scheduled in ${daysUntil} days`;
  }

  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0) {
    return 'Completed today';
  }
  if (diffDays === 1) {
    return 'Completed 1 day ago';
  }
  if (diffDays < 7) {
    return `Completed ${diffDays} days ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) {
    return `Completed ${diffWeeks} wk${diffWeeks === 1 ? '' : 's'} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 24) {
    return `Completed ${diffMonths} mo${diffMonths === 1 ? '' : 's'} ago`;
  }

  const diffYears = Math.floor(diffDays / 365);
  return `Completed ${diffYears} yr${diffYears === 1 ? '' : 's'} ago`;
}

function getProductionEstimate(systemSize) {
  const numeric = Number(systemSize);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  return Math.round(numeric * ANNUAL_OUTPUT_PER_KW);
}

// Display all Installations
function InstallationList({ installations, onDelete, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Delete handler
  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/api/installations/${id}`);
      onDelete(id);
    } catch (error) {
      console.error("Failed to delete installation:", error);
      alert("Failed to delete installation.");
    }
  };

  // Start editing
  const handleEdit = (installation) => {
    setEditingId(installation.id);
    setEditForm({
      homeownerName: installation.homeownerName,
      address: installation.address,
      city: installation.city,
      state: installation.state,
      zip: installation.zip,
      systemSize: installation.systemSize,
      installDate: installation.installDate,
      notes: installation.notes
    });
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Save changes
  const handleSave = async (id) => {
    try {
      const response = await apiClient.put(`/api/installations/${id}`, editForm);
      onUpdate(response.data);
      setEditingId(null);
      setEditForm({});
      alert('Installation updated successfully!');
    } catch (error) {
      console.error('Error updating installation:', error);
      alert('Failed to update installation');
    }
  };

  // Update form field
  const handleFieldChange = (field, value) => {
    setEditForm({ ...editForm, [field]: value });
  };

  return (
    <section className="data-section">
      <div className="section-heading">
        <div className="section-heading-icon" aria-hidden="true">
          <ListIcon size={20} />
        </div>
        <div>
          <h2>Installation Records</h2>
          <p className="section-subtitle">{installations.length} active installation{installations.length === 1 ? '' : 's'} tracked</p>
        </div>
      </div>
      {installations.length === 0 ? (
        <p className="empty-state">No installations have been added yet.</p>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">Region</th>
                  <th scope="col">Utility</th>
                  <th scope="col">System</th>
                  <th scope="col">Lifecycle</th>
                  <th scope="col">Notes</th>
                  <th scope="col" className="actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {installations.map((installation) => {
                  const territory = installation.utilityTerritory;
                  const productionEstimate = getProductionEstimate(installation.systemSize);
                  const formattedDate = formatDate(installation.installDate);
                  const relativeAge = getRelativeAge(installation.installDate);
                  const isEditing = editingId === installation.id;

                  return (
                    <tr key={`${installation.id}-row`}>
                      {isEditing ? (
                        <>
                          <td data-label="Project">
                            <div className="edit-field-group">
                              <input
                                className="table-input"
                                value={editForm.homeownerName}
                                onChange={(e) => handleFieldChange('homeownerName', e.target.value)}
                                placeholder="Homeowner"
                              />
                              <input
                                className="table-input"
                                value={editForm.address}
                                onChange={(e) => handleFieldChange('address', e.target.value)}
                                placeholder="Street address"
                              />
                            </div>
                          </td>
                          <td data-label="Region">
                            <div className="edit-inline-grid">
                              <input
                                className="table-input"
                                value={editForm.city}
                                onChange={(e) => handleFieldChange('city', e.target.value)}
                                placeholder="City"
                              />
                              <input
                                className="table-input table-input--short"
                                value={editForm.state}
                                onChange={(e) => handleFieldChange('state', e.target.value)}
                                placeholder="State"
                                maxLength={2}
                              />
                              <input
                                className="table-input table-input--zip"
                                value={editForm.zip}
                                onChange={(e) => handleFieldChange('zip', e.target.value)}
                                placeholder="ZIP"
                              />
                            </div>
                          </td>
                          <td data-label="Utility" className="table-cell--readonly">
                            {territory?.name || '—'}
                          </td>
                          <td data-label="System">
                            <input
                              className="table-input"
                              type="number"
                              value={editForm.systemSize}
                              onChange={(e) => handleFieldChange('systemSize', e.target.value)}
                              placeholder="System size (kW)"
                            />
                          </td>
                          <td data-label="Lifecycle">
                            <input
                              className="table-input"
                              type="date"
                              value={editForm.installDate}
                              onChange={(e) => handleFieldChange('installDate', e.target.value)}
                            />
                          </td>
                          <td data-label="Notes">
                            <textarea
                              className="notes-textarea"
                              rows={3}
                              value={editForm.notes || ''}
                              onChange={(e) => handleFieldChange('notes', e.target.value)}
                              placeholder="Add context or follow-up steps"
                            />
                          </td>
                          <td data-label="Actions" className="actions-cell">
                            <div className="table-actions">
                              <button
                                type="button"
                                className="table-action table-action--primary"
                                onClick={() => handleSave(installation.id)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="table-action table-action--neutral"
                                onClick={handleCancel}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td data-label="Project">
                            <span className="cell-primary">{installation.homeownerName || '—'}</span>
                            <span className="cell-secondary">{installation.address || 'No street address'}</span>
                          </td>
                          <td data-label="Region">
                            <span className="cell-primary">
                              {installation.city && installation.state
                                ? `${installation.city}, ${installation.state}`
                                : '—'}
                            </span>
                            <span className="cell-secondary">{installation.zip || 'No postal code'}</span>
                          </td>
                          <td data-label="Utility">
                            {territory ? (
                              <span className="utility-chip" title={territory.name}>
                                <span
                                  className="utility-dot"
                                  style={{ backgroundColor: territory.color || '#4aa8ff' }}
                                  aria-hidden="true"
                                />
                                <span className="utility-label">{territory.name}</span>
                              </span>
                            ) : (
                              <span className="cell-secondary">—</span>
                            )}
                          </td>
                          <td data-label="System">
                            <span className="cell-primary">
                              {installation.systemSize ? `${installation.systemSize} kW` : '—'}
                            </span>
                            <span className="cell-secondary">
                              {productionEstimate
                                ? `≈ ${numberFormatter.format(productionEstimate)} kWh/yr`
                                : 'No output estimate'}
                            </span>
                          </td>
                          <td data-label="Lifecycle">
                            <span className="cell-primary">{formattedDate}</span>
                            {relativeAge && relativeAge !== '—' ? (
                              <span className="lifecycle-pill">{relativeAge}</span>
                            ) : (
                              <span className="cell-secondary">Schedule TBD</span>
                            )}
                          </td>
                          <td data-label="Notes">
                            <div className="notes-cell" title={installation.notes || ''}>
                              {installation.notes || '—'}
                            </div>
                          </td>
                          <td data-label="Actions" className="actions-cell">
                            <div className="table-actions">
                              <button
                                type="button"
                                className="table-action table-action--primary"
                                onClick={() => handleEdit(installation)}
                              >
                                <EditIcon size={16} className="table-action-icon" aria-hidden="true" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                className="table-action table-action--danger"
                                onClick={() => handleDelete(installation.id)}
                              >
                                <TrashIcon size={16} className="table-action-icon" aria-hidden="true" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="records-card-grid">
          {installations.map((installation) => {
            const territory = installation.utilityTerritory;
            const productionEstimate = getProductionEstimate(installation.systemSize);
            const formattedDate = formatDate(installation.installDate);
            const relativeAge = getRelativeAge(installation.installDate);
            const locationLine = [installation.city, installation.state].filter(Boolean).join(', ');
            const postal = installation.zip ? installation.zip : null;
            const isEditing = editingId === installation.id;

            if (isEditing) {
              return (
                <article className="record-card record-card--editing" key={`${installation.id}-card`}>
                  <header className="record-card-header">
                    <div className="record-card-icon" aria-hidden="true">
                      <ListIcon size={18} />
                    </div>
                    <div className="record-card-title-group">
                      <h3>Edit Installation</h3>
                      <p className="record-card-subtitle">Update homeowner and site details</p>
                    </div>
                  </header>

                  <div className="record-card-form">
                    <div className="record-card-field-group">
                      <label htmlFor={`homeowner-${installation.id}`}>Homeowner</label>
                      <input
                        id={`homeowner-${installation.id}`}
                        className="table-input"
                        value={editForm.homeownerName}
                        onChange={(e) => handleFieldChange('homeownerName', e.target.value)}
                        placeholder="Homeowner name"
                      />
                    </div>

                    <div className="record-card-field-group">
                      <label htmlFor={`address-${installation.id}`}>Street Address</label>
                      <input
                        id={`address-${installation.id}`}
                        className="table-input"
                        value={editForm.address}
                        onChange={(e) => handleFieldChange('address', e.target.value)}
                        placeholder="Street address"
                      />
                    </div>

                    <div className="record-card-field-row">
                      <div className="record-card-field-group">
                        <label htmlFor={`city-${installation.id}`}>City</label>
                        <input
                          id={`city-${installation.id}`}
                          className="table-input"
                          value={editForm.city}
                          onChange={(e) => handleFieldChange('city', e.target.value)}
                          placeholder="City"
                        />
                      </div>
                      <div className="record-card-field-group record-card-field-group--short">
                        <label htmlFor={`state-${installation.id}`}>State</label>
                        <input
                          id={`state-${installation.id}`}
                          className="table-input table-input--short"
                          value={editForm.state}
                          onChange={(e) => handleFieldChange('state', e.target.value)}
                          placeholder="ST"
                          maxLength={2}
                        />
                      </div>
                      <div className="record-card-field-group record-card-field-group--zip">
                        <label htmlFor={`zip-${installation.id}`}>ZIP</label>
                        <input
                          id={`zip-${installation.id}`}
                          className="table-input table-input--zip"
                          value={editForm.zip}
                          onChange={(e) => handleFieldChange('zip', e.target.value)}
                          placeholder="ZIP"
                        />
                      </div>
                    </div>

                    <div className="record-card-field-row">
                      <div className="record-card-field-group">
                        <label htmlFor={`size-${installation.id}`}>System Size (kW)</label>
                        <input
                          id={`size-${installation.id}`}
                          className="table-input"
                          type="number"
                          value={editForm.systemSize}
                          onChange={(e) => handleFieldChange('systemSize', e.target.value)}
                          placeholder="kW"
                        />
                      </div>
                      <div className="record-card-field-group">
                        <label htmlFor={`date-${installation.id}`}>Install Date</label>
                        <input
                          id={`date-${installation.id}`}
                          className="table-input"
                          type="date"
                          value={editForm.installDate}
                          onChange={(e) => handleFieldChange('installDate', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="record-card-field-group">
                      <label htmlFor={`notes-${installation.id}`}>Notes</label>
                      <textarea
                        id={`notes-${installation.id}`}
                        className="notes-textarea"
                        rows={4}
                        value={editForm.notes || ''}
                        onChange={(e) => handleFieldChange('notes', e.target.value)}
                        placeholder="Add context, follow-ups, or site notes"
                      />
                    </div>
                  </div>

                  <footer className="record-card-footer">
                    <div className="record-card-actions">
                      <button
                        type="button"
                        className="table-action table-action--primary"
                        onClick={() => handleSave(installation.id)}
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        className="table-action table-action--neutral"
                        onClick={handleCancel}
                      >
                        Cancel
                      </button>
                    </div>
                  </footer>
                </article>
              );
            }

            return (
              <article className="record-card" key={`${installation.id}-card`}>
                <header className="record-card-header">
                  <div className="record-card-icon" aria-hidden="true">
                    <ListIcon size={18} />
                  </div>
                  <div className="record-card-title-group">
                    <h3>{installation.homeownerName || 'Unnamed Installation'}</h3>
                    <p className="record-card-subtitle">
                      {locationLine || 'Location pending'}
                      {postal ? <span className="record-card-subtitle-dot"> • {postal}</span> : null}
                    </p>
                  </div>
                </header>

                <div className="record-card-tags">
                  {territory && (
                    <span className="record-card-chip record-card-chip--utility">
                      <span
                        className="record-card-chip-dot"
                        style={{ backgroundColor: territory.color || '#4aa8ff' }}
                        aria-hidden="true"
                      />
                      {territory.name}
                    </span>
                  )}
                  {installation.systemSize ? (
                    <span className="record-card-chip">
                      {installation.systemSize} kW
                    </span>
                  ) : null}
                  {productionEstimate ? (
                    <span className="record-card-chip record-card-chip--muted">
                      ≈ {numberFormatter.format(productionEstimate)} kWh/yr
                    </span>
                  ) : null}
                  <span className="record-card-chip">
                    {formattedDate}
                  </span>
                  <span className="record-card-chip record-card-chip--muted">{relativeAge}</span>
                </div>

                <dl className="record-card-details">
                  {installation.address && (
                    <div className="record-card-detail">
                      <dt>Address</dt>
                      <dd>{installation.address}</dd>
                    </div>
                  )}
                  {territory && (
                    <div className="record-card-detail">
                      <dt>Utility</dt>
                      <dd>{territory.name}</dd>
                    </div>
                  )}
                  {installation.notes && (
                    <div className="record-card-detail record-card-detail--notes">
                      <dt>Notes</dt>
                      <dd>{installation.notes}</dd>
                    </div>
                  )}
                </dl>

                <footer className="record-card-footer">
                  <span className="record-card-id">ID {installation.id}</span>
                  <div className="record-card-actions">
                    <button
                      type="button"
                      className="table-action table-action--primary"
                      onClick={() => handleEdit(installation)}
                    >
                      <EditIcon size={16} className="table-action-icon" aria-hidden="true" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="table-action table-action--danger"
                      onClick={() => handleDelete(installation.id)}
                    >
                      <TrashIcon size={16} className="table-action-icon" aria-hidden="true" />
                      <span>Delete</span>
                    </button>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
        </>
      )}
    </section>
  );
};

export default InstallationList;