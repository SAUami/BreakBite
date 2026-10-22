const express = require('express');
const router = express.Router();
const {
  createGroupCart,
  getGroupCartByCode,
  joinGroupCart,
  addItemToGroupCart,
  removeItemFromGroupCart,
} = require('../controllers/groupCartController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createGroupCart);
router.get('/:code', getGroupCartByCode);
router.post('/:code/join', protect, joinGroupCart);
router.post('/:code/items', protect, addItemToGroupCart);
router.delete('/:code/items/:itemId', protect, removeItemFromGroupCart);

module.exports = router;
