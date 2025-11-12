import React, { useState } from 'react';
import apiClient from '../apiClient';
import { EditIcon, TrashIcon, ListIcon } from '../Icons';

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
        <div className="table-wrapper">
          <table className="records-table">
          <thead>
            <tr>
              <th>Homeowner Name</th>
              <th>Address</th>
              <th>City</th>
              <th>State</th>
              <th>Utility</th>
              <th>Zip</th>
              <th>System Size</th>
              <th>Install Date</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {installations.map((installation) => (
              <tr key={installation.id}>
                {editingId === installation.id ? (
                  // EDITING MODE - Show input fields
                  <>
                    <td data-label="Homeowner Name">
                      <input
                        value={editForm.homeownerName}
                        onChange={(e) => handleFieldChange('homeownerName', e.target.value)}
                      />
                    </td>
                    <td data-label="Address">
                      <input
                        value={editForm.address}
                        onChange={(e) => handleFieldChange('address', e.target.value)}
                      />
                    </td>
                    <td data-label="City">
                      <input
                        value={editForm.city}
                        onChange={(e) => handleFieldChange('city', e.target.value)}
                      />
                    </td>
                    <td data-label="State">
                      <input
                        value={editForm.state}
                        onChange={(e) => handleFieldChange('state', e.target.value)}
                      />
                    </td>
                    <td data-label="Utility" className="table-cell--readonly">
                      {installation.utilityTerritory?.name || '—'}
                    </td>
                    <td data-label="Zip">
                      <input
                        value={editForm.zip}
                        onChange={(e) => handleFieldChange('zip', e.target.value)}
                      />
                    </td>
                    <td data-label="System Size">
                      <input
                        type="number"
                        value={editForm.systemSize}
                        onChange={(e) => handleFieldChange('systemSize', e.target.value)}
                      />
                    </td>
                    <td data-label="Install Date">
                      <input
                        type="date"
                        value={editForm.installDate}
                        onChange={(e) => handleFieldChange('installDate', e.target.value)}
                      />
                    </td>
                    <td data-label="Notes">
                      <input
                        value={editForm.notes}
                        onChange={(e) => handleFieldChange('notes', e.target.value)}
                      />
                    </td>
                    <td data-label="Actions">
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
                    </td>
                  </>
                ) : (
                  // NORMAL MODE - Show regular data
                  <>
                    <td data-label="Homeowner Name">{installation.homeownerName}</td>
                    <td data-label="Address">{installation.address}</td>
                    <td data-label="City">{installation.city}</td>
                    <td data-label="State">{installation.state}</td>
                    <td data-label="Utility">{installation.utilityTerritory?.name || '—'}</td>
                    <td data-label="Zip">{installation.zip}</td>
                    <td data-label="System Size">{installation.systemSize} kW</td>
                    <td data-label="Install Date">{installation.installDate}</td>
                    <td data-label="Notes">{installation.notes || '—'}</td>
                    <td data-label="Actions">
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
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default InstallationList;