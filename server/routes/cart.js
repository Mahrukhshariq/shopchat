const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/cart
router.get('/', verifyToken, requireRole('buyer'), async (req, res) => {
  try {
    const cart = await Cart.findOne({ buyerUid: req.user.uid }).populate('items.product');
    res.json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/cart/add
router.post('/add', verifyToken, requireRole('buyer'), async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isAvailable) {
      return res.status(404).json({ message: 'Product not available' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ buyerUid: req.user.uid });
    if (!cart) {
      cart = new Cart({ buyer: req.dbUser._id, buyerUid: req.user.uid, items: [] });
    }

    const existingItem = cart.items.find((i) => i.product.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    await cart.populate('items.product');
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/cart/update/:productId
router.put('/update/:productId', verifyToken, requireRole('buyer'), async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ buyerUid: req.user.uid });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.find((i) => i.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ message: 'Item not in cart' });

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.product');
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/cart/remove/:productId
router.delete('/remove/:productId', verifyToken, requireRole('buyer'), async (req, res) => {
  try {
    const cart = await Cart.findOne({ buyerUid: req.user.uid });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
    await cart.save();
    await cart.populate('items.product');
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
