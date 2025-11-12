import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILENAME = process.env.INSTALLATIONS_DATA_FILE
  || (process.env.NODE_ENV === 'production'
    ? 'installations.production.json'
    : 'installations.development.json');
const DATA_FILE = path.join(__dirname, '../data', DATA_FILENAME);

// Helper function to read installations from file
async function readInstallations() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
      return [];
    }
    throw err;
  }
}

// Helper function to find installation by ID
async function findInstallationById(id) {
  const installations = await readInstallations();
  return installations.find(installation => installation.id === id);
}

// Add new installation
async function addInstallation(installation) {
  const installations = await readInstallations();
  installations.push(installation);
  await fs.writeFile(DATA_FILE, JSON.stringify(installations, null, 2));
  return installation;
}

// Update installation data

async function updateInstallation(id, updatedData) {
  const installations = await readInstallations();
  const index = installations.findIndex(installation => installation.id === id);
  if (index === -1) {
    throw new Error('Installation not found.');
  }

  installations[index] = { ...installations[index], ...updatedData };
  await fs.writeFile(DATA_FILE, JSON.stringify(installations, null, 2));
  return installations[index];
}

// Delete installation data
async function deleteInstallation(id) {
  const installations = await readInstallations();
  const index = installations.findIndex(installation => installation.id === id);
  if (index === -1) {
    throw new Error('Installation not found.');
  }

  installations.splice(index, 1);
  await fs.writeFile(DATA_FILE, JSON.stringify(installations, null, 2));
  return true;
}

// GET all installations
router.get('/', async (req, res) => {
  try {
    const installations = await readInstallations();
    res.json(installations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single installation by ID
router.get('/:id', async (req, res) => {
  try {
    const installation = await findInstallationById(req.params.id);
    if (!installation) {
      return res.status(404).json({ error: 'Installation not found' });
    }
    res.json(installation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new installation
router.post('/', async (req, res) => {
  try {
    // Validation
    const { homeownerName, address, city, state, zip, systemSize } = req.body;
    
    if (!homeownerName || !address || !city || !state || !zip || !systemSize) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (homeownerName.length < 2) {
      return res.status(400).json({ error: 'Homeowner name must be at least 2 characters' });
    }

    if (isNaN(parseFloat(systemSize)) || parseFloat(systemSize) <= 0) {
      return res.status(400).json({ error: 'System size must be a positive number' });
    }

    const newInstallation = {
      id: Date.now().toString(),
      homeownerName: homeownerName.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
      systemSize: systemSize,
      installDate: req.body.installDate,
      notes: req.body.notes ? req.body.notes.trim() : '',
      latitude: req.body.latitude || null,
      longitude: req.body.longitude || null,
      createdAt: new Date().toISOString()
    };
    const added = await addInstallation(newInstallation);
    res.status(201).json(added);
  } catch (error) {
    console.error('Error creating installation:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update installation
router.put('/:id', async (req, res) => {
  try {
    const updated = await updateInstallation(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// DELETE installation
router.delete('/:id', async (req, res) => {
  try {
    await deleteInstallation(req.params.id);
    res.json({ message: 'Installation deleted successfully' });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

export default router;