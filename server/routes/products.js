const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/products — browse all (buyer/public), supports ?search=&category=
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = { isAvailable: true };

    if (search) query.$text = { $search: search };
    if (category) query.category = category;

    const products = await Product.find(query)
      .populate('seller', 'displayName email')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/products/my — seller's own products
router.get('/my', verifyToken, requireRole('seller'), async (req, res) => {
  try {
    const products = await Product.find({ sellerUid: req.user.uid }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'displayName email');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/products — seller adds product
router.post('/', verifyToken, requireRole('seller'), async (req, res) => {
  try {
    const { name, description, price, stock, category, images } = req.body;
    const product = await Product.create({
      seller: req.dbUser._id,
      sellerUid: req.user.uid,
      name,
      description,
      price,
      stock,
      category,
      images: images || [],
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/products/:id — seller updates product
router.put('/:id', verifyToken, requireRole('seller'), async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, sellerUid: req.user.uid });
    if (!product) return res.status(404).json({ message: 'Product not found or unauthorized' });

    const updates = ['name', 'description', 'price', 'stock', 'category', 'images', 'isAvailable'];
    updates.forEach((field) => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/products/:id — seller deletes product
router.delete('/:id', verifyToken, requireRole('seller'), async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, sellerUid: req.user.uid });
    if (!product) return res.status(404).json({ message: 'Product not found or unauthorized' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
