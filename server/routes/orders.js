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

// Public endpoints for previewing load & slots
router.get('/kitchen/load', getKitchenLoad);
router.post('/slots', getPickupSlots);

// Student endpoints
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

// Canteen management endpoints
router.get('/canteen/all', protect, authorize('canteen'), getCanteenOrders);
router.patch('/:id/status', protect, authorize('canteen'), updateOrderStatus);

module.exports = router;
