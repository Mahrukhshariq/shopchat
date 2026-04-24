const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', verifyToken, async (req, res) => {
  const { role, displayName } = req.body;

  console.log('Register attempt:', { uid: req.user.uid, email: req.user.email, role, displayName });

  if (!['buyer', 'seller'].includes(role)) {
    return res.status(400).json({ message: 'Role must be buyer or seller' });
  }

  try {
    let user = await User.findOne({ uid: req.user.uid });
    if (user) {
      console.log('User already exists, returning existing:', user);
      return res.status(200).json({ message: 'User already exists', user });
    }

    user = await User.create({
      uid: req.user.uid,
      email: req.user.email,
      displayName: displayName || req.user.name || req.user.email.split('@')[0],
      photoURL: req.user.picture || '',
      role,
    });

    console.log('User created successfully:', user);
    res.status(201).json({ message: 'User registered', user });
  } catch (err) {
    console.error('Register error full details:', err);
    res.status(500).json({ message: err.message || 'Server error', error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;