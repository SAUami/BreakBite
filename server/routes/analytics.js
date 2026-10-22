const express = require('express');
const router = express.Router();
const { getCanteenAnalytics, exportSalesCsv } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.get('/', protect, authorize('canteen'), getCanteenAnalytics);
router.get('/export-csv', protect, authorize('canteen'), exportSalesCsv);

module.exports = router;
