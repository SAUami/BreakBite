const express = require('express');
const router = express.Router();
const { getCanteenAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', protect, authorize('canteen'), getCanteenAnalytics);

module.exports = router;
