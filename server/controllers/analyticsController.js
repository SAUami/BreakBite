const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

// @desc    Get canteen performance analytics
// @route   GET /api/analytics
// @access  Private (Canteen)
exports.getCanteenAnalytics = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const orders = await Order.find({ createdAt: { $gte: todayStart } });

    let totalRevenue = 0;
    let completedCount = 0;
    let activeCount = 0;
    const statusCounts = { Placed: 0, Preparing: 0, Ready: 0, Collected: 0, Cancelled: 0 };
    const hourlyOrders = Array(24).fill(0);
    const itemSalesMap = {};

    for (const ord of orders) {
      if (ord.status !== 'Cancelled') {
        totalRevenue += ord.total || 0;
      }

      if (['Placed', 'Preparing', 'Ready'].includes(ord.status)) {
        activeCount++;
      } else if (ord.status === 'Collected') {
        completedCount++;
      }

      if (statusCounts[ord.status] !== undefined) {
        statusCounts[ord.status]++;
      }

      // Hour distribution
      const orderHour = new Date(ord.createdAt).getHours();
      hourlyOrders[orderHour]++;

      // Item counts
      for (const it of ord.items) {
        const key = it.name;
        if (!itemSalesMap[key]) {
          itemSalesMap[key] = {
            name: it.name,
            quantity: 0,
            revenue: 0,
            isVeg: it.isVeg,
          };
        }
        itemSalesMap[key].quantity += it.quantity;
        itemSalesMap[key].revenue += it.price * it.quantity;
      }
    }

    const topItems = Object.values(itemSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Format peak hours for chart (from 9 AM to 6 PM)
    const peakHoursChart = [];
    for (let h = 9; h <= 18; h++) {
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? 'AM' : 'PM';
      peakHoursChart.push({
        hour: `${displayHour} ${ampm}`,
        orders: hourlyOrders[h] || 0,
      });
    }

    res.status(200).json({
      success: true,
      analytics: {
        totalRevenue,
        totalOrdersToday: orders.length,
        activeOrdersNow: activeCount,
        completedOrdersToday: completedCount,
        statusCounts,
        topItems,
        peakHoursChart,
        averageOrderValue: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics.',
      error: error.message,
    });
  }
};
