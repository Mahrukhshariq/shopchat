const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/auth');

// POST /api/orders — buyer places order from cart
router.post('/', verifyToken, requireRole('buyer'), async (req, res) => {
  try {
    const { shippingAddress } = req.body;
    const cart = await Cart.findOne({ buyerUid: req.user.uid }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Group items by seller
    const sellerMap = {};
    for (const item of cart.items) {
      const { product, quantity } = item;
      if (!product.isAvailable || product.stock < quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      const sid = product.sellerUid;
      if (!sellerMap[sid]) sellerMap[sid] = { sellerId: product.seller, items: [] };
      sellerMap[sid].items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity,
      });
    }

    const orders = [];
    for (const [sellerUid, data] of Object.entries(sellerMap)) {
      const total = data.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const order = await Order.create({
        buyer: req.dbUser._id,
        buyerUid: req.user.uid,
        seller: data.sellerId,
        sellerUid,
        items: data.items,
        totalAmount: total,
        shippingAddress: shippingAddress || '',
      });

      // Decrement stock
      for (const item of data.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }
      orders.push(order);
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    res.status(201).json({ message: 'Order placed', orders });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/orders/my — buyer's orders
router.get('/my', verifyToken, requireRole('buyer'), async (req, res) => {
  try {
    const orders = await Order.find({ buyerUid: req.user.uid })
      .populate('seller', 'displayName email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/orders/seller — seller's received orders
router.get('/seller', verifyToken, requireRole('seller'), async (req, res) => {
  try {
    const orders = await Order.find({ sellerUid: req.user.uid })
      .populate('buyer', 'displayName email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/orders/:id/status — seller updates order status
router.put('/:id/status', verifyToken, requireRole('seller'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findOne({ _id: req.params.id, sellerUid: req.user.uid });
    if (!order) return res.status(404).json({ message: 'Order not found or unauthorized' });

    order.status = status;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
