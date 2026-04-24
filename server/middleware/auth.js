const admin = require('../config/firebase');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // { uid, email, ... }

    // Attach MongoDB user
    const dbUser = await User.findOne({ uid: decoded.uid });
    if (dbUser) req.dbUser = dbUser;

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.dbUser || req.dbUser.role !== role) {
    return res.status(403).json({ message: `Access denied. ${role} role required.` });
  }
  next();
};

module.exports = { verifyToken, requireRole };
