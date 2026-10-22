const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleStockAvailability,
  deleteMenuItem,
} = require('../controllers/menuController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', getMenuItems);
router.get('/:id', getMenuItemById);

// Canteen-only routes
router.post('/', protect, authorize('canteen'), createMenuItem);
router.put('/:id', protect, authorize('canteen'), updateMenuItem);
router.patch('/:id/toggle-stock', protect, authorize('canteen'), toggleStockAvailability);
router.delete('/:id', protect, authorize('canteen'), deleteMenuItem);

module.exports = router;
