import express from 'express';
import { createUser, verifyCredentials, listUsers } from '../utils/users.js';
import { issueToken, requireAdminKey } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await verifyCredentials(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = issueToken(user);
    return res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Unable to process login' });
  }
});

router.post('/users', requireAdminKey, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  try {
    const user = await createUser(username, password);
    return res.status(201).json({ user });
  } catch (error) {
    if (error.message === 'Username already exists') {
      return res.status(409).json({ error: error.message });
    }

    console.error('User creation error:', error);
    return res.status(500).json({ error: 'Unable to create user' });
  }
});

router.get('/users', requireAdminKey, async (_req, res) => {
  try {
    const users = await listUsers();
    return res.json({ users });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({ error: 'Unable to load users' });
  }
});

export default router;
