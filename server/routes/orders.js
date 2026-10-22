const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getCanteenOrders,
  updateOrderStatus,
  getKitchenLoad,
  getPickupSlots,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { orderLimiter } = require('../middleware/rateLimiter');

// Public endpoints for previewing load & slots
router.get('/kitchen/load', getKitchenLoad);
router.post('/slots', getPickupSlots);

// Student endpoints (Protected with orderLimiter to prevent double-charging or race conditions)
router.post('/', protect, orderLimiter, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

// Canteen management endpoints
router.get('/canteen/all', protect, authorize('canteen'), getCanteenOrders);
router.patch('/:id/status', protect, authorize('canteen'), updateOrderStatus);

module.exports = router;
