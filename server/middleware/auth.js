import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

if (!JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Authentication requests will fail until it is configured.');
}

export function issueToken(user) {
  if (!JWT_SECRET) {
    throw new Error('JWT secret is not configured');
  }

  return jwt.sign(
    {
      id: user.id,
      username: user.username
    },
    JWT_SECRET,
    {
      expiresIn: TOKEN_EXPIRES_IN
    }
  );
}

export function authenticateToken(req, res, next) {
  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'Server is missing JWT configuration' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const [, token] = authHeader.split(' ');
  if (!token) {
    return res.status(401).json({ error: 'Invalid Authorization header format' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdminKey(req, res, next) {
  const expectedKey = process.env.ADMIN_API_KEY;
  if (!expectedKey) {
    return res.status(500).json({ error: 'Admin API key is not configured' });
  }

  const providedKey = req.headers['x-admin-key'];
  if (!providedKey || providedKey !== expectedKey) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
}
