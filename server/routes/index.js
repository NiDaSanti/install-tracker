import express from 'express';
import installationsRouter from './installations.js';

const router = express.Router();

// Test route
router.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Mount installations routes
router.use('/installations', installationsRouter);

export default router;
