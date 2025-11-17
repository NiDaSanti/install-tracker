import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function usage() {
  console.error('Usage: npm run bulk:prepare -- <input.csv> [output.json]');
}

const [, , inputArg, outputArg] = process.argv;

if (!inputArg) {
  usage();
  process.exit(1);
}

const inputPath = path.resolve(__dirname, '..', inputArg);
const outputPath = path.resolve(__dirname, '..', outputArg || 'payload.json');

if (!fs.existsSync(inputPath)) {
  console.error(`Input CSV not found: ${inputPath}`);
  process.exit(1);
}

const csvText = fs.readFileSync(inputPath, 'utf-8');
const rows = parse(csvText, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

const installations = rows.map((row, index) => {
  const toNumber = (value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  return {
    homeownerName: row.homeownerName || row.HomeownerName || row.homeowner || row.Homeowner || null,
    address: row.address || row.Address || null,
    city: row.city || row.City || null,
    state: row.state || row.State || null,
    zip: row.zip || row.Zip || row.zipcode || row.ZipCode || null,
    systemSize: toNumber(row.systemSize ?? row.SystemSize ?? row.system_kw ?? row.System_kW),
    installDate: row.installDate || row.InstallDate || undefined,
    notes: row.notes || row.Notes || undefined,
    latitude: toNumber(row.latitude ?? row.Latitude),
    longitude: toNumber(row.longitude ?? row.Longitude),
    _row: index + 2
  };
});

const invalid = installations.filter((item) => {
  return !item.homeownerName || !item.address || !item.city || !item.state || !item.zip || !item.systemSize;
});

if (invalid.length > 0) {
  console.error('Validation failed for the following rows (row numbers reflect CSV line numbers):');
  invalid.forEach((item) => {
    console.error(`Row ${item._row}: missing required fields`);
  });
  process.exit(1);
}

const payload = {
  installations: installations.map(({ _row, ...rest }) => rest)
};

fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
console.log(`Wrote ${payload.installations.length} installations to ${outputPath}`);
