import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILENAME = process.env.USERS_DATA_FILE
  || (process.env.NODE_ENV === 'production'
    ? 'users.production.json'
    : 'users.development.json');
const DATA_FILE = path.join(__dirname, '../data', DATA_FILENAME);

const STATIC_USER_USERNAME_PATTERN = /^AUTH_USER_(\d+)_USERNAME$/i;

function buildStaticUsersFromEnv() {
  const usersByName = new Map();

  for (const [key, value] of Object.entries(process.env)) {
    const match = key.match(STATIC_USER_USERNAME_PATTERN);
    if (!match) {
      continue;
    }

    const index = match[1];
    const username = (value || '').trim();
    const passwordEnvKey = `AUTH_USER_${index}_PASSWORD`;
    const password = process.env[passwordEnvKey];

    if (!username) {
      console.warn(`Environment variable ${key} is set but empty; skipping static user.`);
      continue;
    }

    if (!password) {
      console.warn(`Environment variable ${passwordEnvKey} is missing for static user ${username}; skipping.`);
      continue;
    }

    if (usersByName.has(username.toLowerCase())) {
      console.warn(`Duplicate static user detected for username "${username}"; later definition will be ignored.`);
      continue;
    }

    try {
      const passwordHash = bcrypt.hashSync(password, 10);
      const createdAt = new Date().toISOString();
      usersByName.set(username.toLowerCase(), {
        id: `env-${index}`,
        username,
        passwordHash,
        createdAt,
        source: 'env'
      });
    } catch (error) {
      console.error(`Unable to process static user ${username}:`, error);
    }
  }

  return usersByName;
}

const STATIC_USERS = buildStaticUsersFromEnv();

async function ensureFile() {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
  }
}

async function readUsers() {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

async function writeUsers(users) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2));
}

export async function findUserByUsername(username) {
  const staticUser = STATIC_USERS.get(username.toLowerCase());
  if (staticUser) {
    return staticUser;
  }

  const users = await readUsers();
  return users.find(user => user.username.toLowerCase() === username.toLowerCase()) || null;
}

export async function createUser(username, password) {
  const existing = await findUserByUsername(username);
  if (existing) {
    throw new Error('Username already exists');
  }

  const users = await readUsers();
  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    id,
    username,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  await writeUsers(users);
  return { id: newUser.id, username: newUser.username };
}

export async function verifyCredentials(username, password) {
  const user = await findUserByUsername(username);
  if (!user) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return { id: user.id, username: user.username };
}

export async function listUsers() {
  const users = await readUsers();
  const staticUsers = Array.from(STATIC_USERS.values()).map(({ passwordHash, source, ...rest }) => ({
    ...rest,
    managedByEnv: true
  }));

  const fileUsers = users.map(({ passwordHash, ...rest }) => rest);

  return [...staticUsers, ...fileUsers];
}
