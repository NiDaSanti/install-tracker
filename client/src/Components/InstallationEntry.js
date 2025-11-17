import React from 'react';
import InstallationForm from './InstallationForm';
import BulkUpload from './BulkUpload';
import { AddIcon, UploadIcon } from '../Icons';

const InstallationEntry = ({ onSingleSubmit, onBulkComplete }) => {
  const [mode, setMode] = React.useState('single');

  return (
    <div className="installation-entry">
      <div className="installation-entry__toggle" role="tablist" aria-label="Installation entry mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'single'}
          className={`installation-entry__toggle-button${mode === 'single' ? ' is-active' : ''}`}
          onClick={() => setMode('single')}
        >
          <AddIcon size={16} className="installation-entry__toggle-icon" />
          <span>Single entry</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'bulk'}
          className={`installation-entry__toggle-button${mode === 'bulk' ? ' is-active' : ''}`}
          onClick={() => setMode('bulk')}
        >
          <UploadIcon size={16} className="installation-entry__toggle-icon" />
          <span>Bulk upload</span>
        </button>
      </div>

      <div className="installation-entry__body">
        {mode === 'single' ? (
          <InstallationForm key="single" onSubmit={onSingleSubmit} />
        ) : (
          <BulkUpload key="bulk" onImportComplete={onBulkComplete} />
        )}
      </div>
    </div>
  );
};

export default InstallationEntry;
