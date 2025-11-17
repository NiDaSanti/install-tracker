import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENVIRONMENT_NAME = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const PER_USER_STORAGE = process.env.INSTALLATIONS_PER_USER !== 'false';
const SHARED_DATA_FILENAME = process.env.INSTALLATIONS_DATA_FILE || `installations.${ENVIRONMENT_NAME}.json`;
const SHARED_DATA_FILE = path.join(__dirname, '../data', SHARED_DATA_FILENAME);
const PER_USER_DATA_DIR = process.env.INSTALLATIONS_DATA_DIR
  ? path.resolve(process.env.INSTALLATIONS_DATA_DIR)
  : path.join(__dirname, '../data/installations');

function sanitizeUsername(username = '') {
  return username
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '-');
}

function getDataFileForUser(user) {
  if (!PER_USER_STORAGE || !user || !user.username) {
    return SHARED_DATA_FILE;
  }

  const safeUsername = sanitizeUsername(user.username);
  return path.join(PER_USER_DATA_DIR, `${safeUsername}.${ENVIRONMENT_NAME}.json`);
}

async function readInstallations(filePath, user) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      if (PER_USER_STORAGE && user && filePath !== SHARED_DATA_FILE) {
        try {
          const sharedRaw = await fs.readFile(SHARED_DATA_FILE, 'utf-8');
          const sharedInstallations = JSON.parse(sharedRaw);
          const owned = sharedInstallations.filter((installation) => (
            installation.ownerId === user.id || installation.ownerUsername === user.username
          ));
          await fs.writeFile(filePath, JSON.stringify(owned, null, 2));
          return owned;
        } catch (sharedError) {
          if (sharedError.code !== 'ENOENT') {
            console.warn('Unable to seed per-user installations:', sharedError);
          }
        }
      }

      await fs.writeFile(filePath, JSON.stringify([], null, 2));
      return [];
    }
    throw err;
  }
}

async function writeInstallations(filePath, installations) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(installations, null, 2));
}

async function findInstallationById(id, filePath, user) {
  const installations = await readInstallations(filePath, user);
  return installations.find((installation) => installation.id === id);
}

async function addInstallation(installation, filePath, user) {
  const installations = await readInstallations(filePath, user);
  installations.push(installation);
  await writeInstallations(filePath, installations);
  return installation;
}

async function updateInstallation(id, updatedData, filePath, user) {
  const installations = await readInstallations(filePath, user);
  const index = installations.findIndex((installation) => installation.id === id);
  if (index === -1) {
    throw new Error('Installation not found.');
  }

  installations[index] = {
    ...installations[index],
    ...updatedData,
    ownerId: installations[index].ownerId,
    ownerUsername: installations[index].ownerUsername,
    updatedAt: new Date().toISOString()
  };
  await writeInstallations(filePath, installations);
  return installations[index];
}

async function deleteInstallation(id, filePath, user) {
  const installations = await readInstallations(filePath, user);
  const index = installations.findIndex((installation) => installation.id === id);
  if (index === -1) {
    throw new Error('Installation not found.');
  }

  installations.splice(index, 1);
  await writeInstallations(filePath, installations);
  return true;
}

function buildInstallationPayload(raw = {}, user) {
  const homeownerName = raw.homeownerName ? String(raw.homeownerName).trim() : '';
  const address = raw.address ? String(raw.address).trim() : '';
  const city = raw.city ? String(raw.city).trim() : '';
  const state = raw.state ? String(raw.state).trim().toUpperCase() : '';
  const zip = raw.zip ? String(raw.zip).trim() : '';
  const systemSize = raw.systemSize;

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

  const numericSystemSize = Number.parseFloat(systemSize);
  if (!Number.isFinite(numericSystemSize) || numericSystemSize <= 0) {
    errors.push('System size must be a positive number');
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    installation: {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
      homeownerName,
      address,
      city,
      state,
      zip,
      systemSize: numericSystemSize,
      installDate: raw.installDate ? String(raw.installDate).trim() : null,
      notes: raw.notes ? String(raw.notes).trim() : '',
      latitude: raw.latitude ?? null,
      longitude: raw.longitude ?? null,
      createdAt: new Date().toISOString(),
      ownerId: user?.id || null,
      ownerUsername: user?.username || null
    }
  };
}

// GET all installations
router.get('/', async (req, res) => {
  try {
    const dataFile = getDataFileForUser(req.user);
    const installations = await readInstallations(dataFile, req.user);
    res.json(installations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single installation by ID
router.get('/:id', async (req, res) => {
  try {
    const dataFile = getDataFileForUser(req.user);
    const installation = await findInstallationById(req.params.id, dataFile, req.user);
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
    const { installation, errors } = buildInstallationPayload(req.body, req.user);

    if (errors) {
      return res.status(400).json({ error: errors.join(', ') });
    }

    const dataFile = getDataFileForUser(req.user);
    const added = await addInstallation(installation, dataFile, req.user);
    res.status(201).json(added);
  } catch (error) {
    console.error('Error creating installation:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST bulk create installations
router.post('/bulk', async (req, res) => {
  try {
    const incoming = Array.isArray(req.body.installations) ? req.body.installations : [];

    if (incoming.length === 0) {
      return res.status(400).json({ error: 'No installations provided for bulk upload' });
    }

    const results = incoming.map((item, index) => {
      const payload = buildInstallationPayload(item, req.user);
      if (payload.errors) {
        return {
          index,
          errors: payload.errors
        };
      }
      return {
        index,
        installation: payload.installation
      };
    });

    const failures = results.filter((entry) => entry.errors);
    if (failures.length > 0) {
      return res.status(400).json({
        error: 'Some rows contain invalid data',
        failures
      });
    }

    const dataFile = getDataFileForUser(req.user);
    const existing = await readInstallations(dataFile, req.user);
    const installationsToAdd = results.map((entry) => entry.installation);
    const updated = [...existing, ...installationsToAdd];
    await writeInstallations(dataFile, updated);

    res.status(201).json({
      added: installationsToAdd.length,
      installations: installationsToAdd
    });
  } catch (error) {
    console.error('Error performing bulk installation upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update installation
router.put('/:id', async (req, res) => {
  try {
    const dataFile = getDataFileForUser(req.user);
    const updated = await updateInstallation(req.params.id, req.body, dataFile, req.user);
    res.json(updated);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// DELETE installation
router.delete('/:id', async (req, res) => {
  try {
    const dataFile = getDataFileForUser(req.user);
    await deleteInstallation(req.params.id, dataFile, req.user);
    res.json({ message: 'Installation deleted successfully' });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

export default router;
