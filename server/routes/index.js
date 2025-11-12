import express from 'express';
import installationsRouter from './installations.js';
import authRouter from './auth.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Test route
router.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Authentication routes
router.use('/auth', authRouter);

// Mount installations routes (protected)
router.use('/installations', authenticateToken, installationsRouter);

export default router;
