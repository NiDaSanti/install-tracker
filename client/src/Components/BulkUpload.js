import React from 'react';
import Papa from 'papaparse';
import apiClient from '../apiClient';
import { UploadIcon, WarningIcon } from '../Icons';

const FIELD_ALIASES = {
  homeownerName: ['homeownername', 'homeowner name', 'homeowner', 'name'],
  address: ['address', 'street', 'street address'],
  city: ['city', 'town'],
  state: ['state', 'state/province', 'province', 'region'],
  zip: ['zip', 'zipcode', 'zip code', 'postal', 'postalcode', 'postal code'],
  systemSize: ['systemsize', 'system size', 'system_kw', 'system kw', 'system (kw)', 'kw', 'capacity'],
  installDate: ['installdate', 'install date', 'date', 'install'],
  notes: ['notes', 'note', 'comments', 'comment'],
  latitude: ['latitude', 'lat'],
  longitude: ['longitude', 'lng', 'lon', 'long']
};

const FIELD_LABELS = {
  homeownerName: 'Homeowner name',
  address: 'Street address',
  city: 'City',
  state: 'State',
  zip: 'ZIP',
  systemSize: 'System size'
};

const REQUIRED_FIELDS = ['homeownerName', 'address', 'city', 'state', 'zip', 'systemSize'];

const MAX_ERRORS_DISPLAYED = 6;

function normalizeRow(rawRow, rowNumber) {
  const normalizedEntries = Object.entries(rawRow || {}).reduce((acc, [key, value]) => {
    if (!key) {
      return acc;
    }

    const normalizedKey = String(key).trim().toLowerCase();
    acc[normalizedKey] = typeof value === 'string' ? value.trim() : value;
    return acc;
  }, {});

  const isRowEmpty = Object.values(normalizedEntries).every((value) => {
    if (value === undefined || value === null) {
      return true;
    }

    const stringValue = String(value).trim();
    return stringValue.length === 0;
  });

  if (isRowEmpty) {
    return { isEmpty: true };
  }

  const pick = (fieldKey) => {
    const keys = FIELD_ALIASES[fieldKey] || [];
    for (const candidate of keys) {
      if (Object.prototype.hasOwnProperty.call(normalizedEntries, candidate)) {
        const value = normalizedEntries[candidate];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          return String(value).trim();
        }
      }
    }
    return '';
  };

  const homeownerName = pick('homeownerName');
  const address = pick('address');
  const city = pick('city');
  const state = pick('state').toUpperCase();
  const zip = pick('zip');
  const systemSizeRaw = pick('systemSize');
  const installDate = pick('installDate');
  const notes = pick('notes');
  const latitudeRaw = pick('latitude');
  const longitudeRaw = pick('longitude');

  const errors = [];

  if (!homeownerName || homeownerName.length < 2) {
    errors.push('Homeowner name must be at least 2 characters');
  }

  if (!address) {
    errors.push('Street address is required');
  }

  if (!city) {
    errors.push('City is required');
  }

  if (!state) {
    errors.push('State is required');
  }

  if (!zip) {
    errors.push('ZIP is required');
  }

  const systemSize = Number.parseFloat(systemSizeRaw);
  if (!Number.isFinite(systemSize) || systemSize <= 0) {
    errors.push('System size must be a positive number');
  }

  let latitude = null;
  if (latitudeRaw) {
    const parsedLatitude = Number.parseFloat(latitudeRaw);
    if (Number.isFinite(parsedLatitude)) {
      latitude = parsedLatitude;
    } else {
      errors.push('Latitude must be numeric');
    }
  }

  let longitude = null;
  if (longitudeRaw) {
    const parsedLongitude = Number.parseFloat(longitudeRaw);
    if (Number.isFinite(parsedLongitude)) {
      longitude = parsedLongitude;
    } else {
      errors.push('Longitude must be numeric');
    }
  }

  return {
    isEmpty: false,
    errors,
    row: {
      rowNumber,
      homeownerName,
      address,
      city,
      state,
      zip,
      systemSize,
      installDate: installDate || null,
      notes: notes || '',
      latitude,
      longitude
    }
  };
}

function detectMissingHeaders(headers) {
  if (!headers || headers.length === 0) {
    return REQUIRED_FIELDS.map((field) => FIELD_LABELS[field]);
  }

  const headerSet = new Set(headers.map((header) => String(header || '').trim().toLowerCase()));
  return REQUIRED_FIELDS.filter((field) => {
    const aliases = FIELD_ALIASES[field] || [];
    return !aliases.some((alias) => headerSet.has(alias));
  }).map((field) => FIELD_LABELS[field]);
}

const BulkUpload = ({ onImportComplete }) => {
  const fileInputRef = React.useRef(null);
  const [fileName, setFileName] = React.useState('');
  const [parsing, setParsing] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [validRows, setValidRows] = React.useState([]);
  const [validationErrors, setValidationErrors] = React.useState([]);
  const [parsingErrors, setParsingErrors] = React.useState([]);
  const [serverFailures, setServerFailures] = React.useState([]);
  const [statusMessage, setStatusMessage] = React.useState(null);

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetState = () => {
    setFileName('');
    setValidRows([]);
    setValidationErrors([]);
    setParsingErrors([]);
    setServerFailures([]);
  setStatusMessage(null);
    resetFileInput();
  };

  const handleFileSelect = (event) => {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    setParsing(true);
    setFileName(file.name);
  setStatusMessage(null);
    setParsingErrors([]);
    setValidationErrors([]);
    setServerFailures([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const { data, meta, errors: parserErrors } = results;

        if (parserErrors && parserErrors.length > 0) {
          setParsingErrors(parserErrors.map((err) => err.message));
          setValidRows([]);
          setParsing(false);
          return;
        }

        const missingHeaders = detectMissingHeaders(meta?.fields || []);
        if (missingHeaders.length > 0) {
          setParsingErrors([
            `The CSV is missing required columns: ${missingHeaders.join(', ')}. Please use the provided template or add these headers.`
          ]);
          setValidRows([]);
          setParsing(false);
          return;
        }

        const collectedRows = [];
        const collectedErrors = [];

        data.forEach((row, index) => {
          const rowNumber = index + 2; // account for header row
          const result = normalizeRow(row, rowNumber);

          if (result.isEmpty) {
            return;
          }

          if (result.errors.length > 0) {
            collectedErrors.push({
              rowNumber,
              messages: result.errors
            });
            return;
          }

          collectedRows.push(result.row);
        });

        if (collectedRows.length === 0) {
          setParsingErrors([
            collectedErrors.length > 0
              ? 'Every row has validation issues. Fix the highlighted rows and try again.'
              : 'No installations were found in the CSV. Add rows and try again.'
          ]);
          setValidRows([]);
          setValidationErrors(collectedErrors);
          setParsing(false);
          return;
        }

        setValidRows(collectedRows);
        setValidationErrors(collectedErrors);
        setParsing(false);
      },
      error: (error) => {
        setParsingErrors([error?.message || 'Unable to read CSV file.']);
        setValidRows([]);
        setParsing(false);
      }
    });
  };

  const handleUpload = async () => {
    if (validRows.length === 0 || validationErrors.length > 0) {
      return;
    }

    setUploading(true);
    setStatusMessage(null);
    setServerFailures([]);

    try {
      const payload = {
        installations: validRows.map(({ rowNumber, ...row }) => ({
          ...row,
          notes: row.notes || '',
          installDate: row.installDate || null,
          latitude: row.latitude ?? null,
          longitude: row.longitude ?? null
        }))
      };

      const response = await apiClient.post('/api/installations/bulk', payload);
      const { added, installations } = response.data || {};

      setStatusMessage({
        type: 'success',
        text:
          added && added > 0
            ? `Successfully added ${added} installation${added === 1 ? '' : 's'}.`
            : 'Bulk upload completed.'
      });

      setServerFailures([]);
      setValidRows([]);
      setValidationErrors([]);
      setParsingErrors([]);
      resetFileInput();
      setFileName('');

      if (onImportComplete) {
        onImportComplete(Array.isArray(installations) ? installations : []);
      }
    } catch (error) {
      const { response } = error || {};
      const failureList = response?.data?.failures || [];
      setServerFailures(Array.isArray(failureList) ? failureList : []);

      const message =
        response?.data?.error ||
        error?.message ||
        'Bulk upload failed. Please try again.';

      setStatusMessage({ type: 'error', text: message });
    } finally {
      setUploading(false);
    }
  };

  const disableUploadButton =
    parsing ||
    uploading ||
    validRows.length === 0 ||
    validationErrors.length > 0;

  return (
    <div className="bulk-upload">
      <p className="bulk-upload__intro">
        Upload a CSV with up to 150 installations. Use the template to match the required columns, review any
        highlighted issues, then send everything to the tracker in one step.
      </p>

      <div className="bulk-upload__actions">
        <button
          type="button"
          className="panel-action-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={parsing || uploading}
        >
          <UploadIcon size={18} className="bulk-upload__icon" />
          <span>{parsing ? 'Reading CSV…' : 'Select CSV'}</span>
        </button>
        <a
          className="panel-action-button panel-action-button--ghost"
          href="/templates/installations-template.csv"
          download
        >
          Download template
        </a>
        {fileName && (
          <button
            type="button"
            className="panel-action-button panel-action-button--ghost bulk-upload__reset"
            onClick={resetState}
            disabled={parsing || uploading}
          >
            Clear file
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="bulk-upload__file-input"
          onChange={handleFileSelect}
          aria-hidden="true"
        />
      </div>

      {fileName && (
        <div className="bulk-upload__file-chip" role="status">
          <span className="bulk-upload__file-name">{fileName}</span>
          <span className="bulk-upload__file-meta">{validRows.length} ready</span>
          {validationErrors.length > 0 && (
            <span className="bulk-upload__file-meta bulk-upload__file-meta--warning">
              {validationErrors.length} row{validationErrors.length === 1 ? '' : 's'} need attention
            </span>
          )}
        </div>
      )}

      {statusMessage && (
        <div
          className={`bulk-upload__message bulk-upload__message--${statusMessage.type}`}
          role="alert"
        >
          {statusMessage.text}
        </div>
      )}

      {parsingErrors.length > 0 && (
        <div className="bulk-upload__callout" role="alert">
          <WarningIcon size={20} className="bulk-upload__callout-icon" />
          <div>
            <p className="bulk-upload__callout-title">Fix the CSV headers</p>
            <ul className="bulk-upload__callout-list">
              {parsingErrors.slice(0, MAX_ERRORS_DISPLAYED).map((message, index) => (
                <li key={`parse-error-${index}`}>{message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="bulk-upload__callout" role="alert">
          <WarningIcon size={20} className="bulk-upload__callout-icon" />
          <div>
            <p className="bulk-upload__callout-title">Please fix these rows before uploading</p>
            <ul className="bulk-upload__callout-list">
              {validationErrors.slice(0, MAX_ERRORS_DISPLAYED).map((entry) => (
                <li key={`validation-error-${entry.rowNumber}`}>
                  Row {entry.rowNumber}: {entry.messages.join(', ')}
                </li>
              ))}
              {validationErrors.length > MAX_ERRORS_DISPLAYED && (
                <li>…and {validationErrors.length - MAX_ERRORS_DISPLAYED} more rows.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {serverFailures.length > 0 && (
        <div className="bulk-upload__callout" role="alert">
          <WarningIcon size={20} className="bulk-upload__callout-icon" />
          <div>
            <p className="bulk-upload__callout-title">The server rejected some rows</p>
            <ul className="bulk-upload__callout-list">
              {serverFailures.slice(0, MAX_ERRORS_DISPLAYED).map((entry) => (
                <li key={`server-failure-${entry.index}`}>
                  Row {entry.index + 1}: {entry.errors.join(', ')}
                </li>
              ))}
              {serverFailures.length > MAX_ERRORS_DISPLAYED && (
                <li>…and {serverFailures.length - MAX_ERRORS_DISPLAYED} more rows.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      <div className="bulk-upload__footer">
        <div className="bulk-upload__summary">
          <span className="bulk-upload__summary-count">{validRows.length}</span>
          <span className="bulk-upload__summary-label">
            valid row{validRows.length === 1 ? '' : 's'} ready to import
          </span>
        </div>
        <button
          type="button"
          className="bulk-upload__submit"
          onClick={handleUpload}
          disabled={disableUploadButton}
        >
          {uploading ? 'Uploading…' : `Upload ${validRows.length || ''} installation${validRows.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
};

export default BulkUpload;
