const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

// Helper to format date as YYYY-MM-DD in local time
function getLocalDateKey(dateObj) {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper for readable day name
function getReadableDay(dateObj) {
  const d = new Date(dateObj);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    dayName: days[d.getDay()],
    formatted: `${d.getDate()} ${months[d.getMonth()]} (${days[d.getDay()]})`,
  };
}

// @desc    Get canteen performance analytics with Day-Wise Meal trends & Student Info
// @route   GET /api/analytics
// @access  Private (Canteen)
exports.getCanteenAnalytics = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Fetch all orders with populated user details
    const allOrders = await Order.find({})
      .populate('user', 'name email studentId phone')
      .sort({ createdAt: -1 });

    const todayOrders = allOrders.filter(
      (o) => new Date(o.createdAt) >= todayStart
    );

    // Today's summary metrics
    let totalRevenueToday = 0;
    let completedCountToday = 0;
    let activeCountNow = 0;
    const statusCounts = { Placed: 0, Preparing: 0, Ready: 0, Collected: 0, Cancelled: 0 };
    const hourlyOrders = Array(24).fill(0);
    const itemSalesMap = {};

    for (const ord of todayOrders) {
      if (ord.status !== 'Cancelled') {
        totalRevenueToday += ord.total || 0;
      }

      if (['Placed', 'Preparing', 'Ready'].includes(ord.status)) {
        activeCountNow++;
      } else if (ord.status === 'Collected') {
        completedCountToday++;
      }

      if (statusCounts[ord.status] !== undefined) {
        statusCounts[ord.status]++;
      }

      const orderHour = new Date(ord.createdAt).getHours();
      hourlyOrders[orderHour]++;

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

    const topItemsToday = Object.values(itemSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Format peak hours for chart (9 AM to 6 PM)
    const peakHoursChart = [];
    for (let h = 9; h <= 18; h++) {
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? 'AM' : 'PM';
      peakHoursChart.push({
        hour: `${displayHour} ${ampm}`,
        orders: hourlyOrders[h] || 0,
      });
    }

    // -------------------------------------------------------------
    // FEATURE 1: Day-Wise Meal Sales Trends ("Kis din kon sa meal jyada sale hua")
    // -------------------------------------------------------------
    const dayGroups = {};

    for (const ord of allOrders) {
      if (ord.status === 'Cancelled') continue;
      const dateKey = getLocalDateKey(ord.createdAt);

      if (!dayGroups[dateKey]) {
        const { dayName, formatted } = getReadableDay(ord.createdAt);
        dayGroups[dateKey] = {
          dateKey,
          dayName,
          formattedDate: formatted,
          totalRevenue: 0,
          totalOrders: 0,
          dishSales: {},
        };
      }

      dayGroups[dateKey].totalRevenue += ord.total || 0;
      dayGroups[dateKey].totalOrders += 1;

      for (const it of ord.items) {
        if (!dayGroups[dateKey].dishSales[it.name]) {
          dayGroups[dateKey].dishSales[it.name] = {
            name: it.name,
            quantity: 0,
            revenue: 0,
            isVeg: it.isVeg,
          };
        }
        dayGroups[dateKey].dishSales[it.name].quantity += it.quantity;
        dayGroups[dateKey].dishSales[it.name].revenue += it.price * it.quantity;
      }
    }

    // Format day trends array sorted chronologically (latest first)
    const dailyMealTrends = Object.values(dayGroups)
      .map((day) => {
        const sortedDishes = Object.values(day.dishSales).sort(
          (a, b) => b.quantity - a.quantity
        );
        const topMeal = sortedDishes[0] || { name: 'None', quantity: 0, revenue: 0 };
        return {
          dateKey: day.dateKey,
          dayName: day.dayName,
          formattedDate: day.formattedDate,
          totalRevenue: day.totalRevenue,
          totalOrders: day.totalOrders,
          topMeal,
          top3Dishes: sortedDishes.slice(0, 3),
        };
      })
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey));

    // -------------------------------------------------------------
    // FEATURE 2: Per-Day Sales with Student Details
    // -------------------------------------------------------------
    const detailedStudentOrders = allOrders.map((ord) => {
      const itemsList = ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
      const totalQuantity = ord.items.reduce((sum, i) => sum + i.quantity, 0);
      const orderDate = new Date(ord.createdAt);

      return {
        _id: ord._id,
        orderNumber: ord.orderNumber,
        dateKey: getLocalDateKey(ord.createdAt),
        dateFormatted: orderDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        timeFormatted: orderDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        studentName: ord.user?.name || 'Walk-in Student',
        studentId: ord.user?.studentId || 'GIIT-CAMPUS',
        studentEmail: ord.user?.email || 'N/A',
        studentPhone: ord.user?.phone || 'N/A',
        itemsSummary: itemsList,
        totalQuantity,
        total: ord.total,
        pickupMode: ord.pickupMode === 'bell_sync' ? 'Bell-Sync' : 'Immediate ASAP',
        pickupSlot: ord.pickupSlot?.slotLabel || 'Express Counter',
        status: ord.status,
      };
    });

    res.status(200).json({
      success: true,
      analytics: {
        totalRevenue: totalRevenueToday,
        totalOrdersToday: todayOrders.length,
        activeOrdersNow: activeCountNow,
        completedOrdersToday: completedCountToday,
        statusCounts,
        topItems: topItemsToday,
        peakHoursChart,
        averageOrderValue:
          todayOrders.length > 0 ? Math.round(totalRevenueToday / todayOrders.length) : 0,
        dailyMealTrends,
        detailedStudentOrders,
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

// @desc    Export Sales & Student Orders to CSV/Excel
// @route   GET /api/analytics/export-csv
// @access  Private (Canteen)
exports.exportSalesCsv = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email studentId phone')
      .sort({ createdAt: -1 });

    // CSV Headers
    const headers = [
      'Order Token',
      'Date',
      'Time',
      'Student Name',
      'Roll / Student ID',
      'Email',
      'Phone',
      'Dishes Ordered',
      'Total Items Qty',
      'Total Amount (INR)',
      'Pickup Mode',
      'Pickup Slot',
      'Status',
    ];

    const escapeCsv = (str) => {
      if (!str) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = orders.map((ord) => {
      const orderDate = new Date(ord.createdAt);
      const itemsList = ord.items.map((i) => `${i.quantity}x ${i.name}`).join('; ');
      const totalQty = ord.items.reduce((sum, i) => sum + i.quantity, 0);

      return [
        escapeCsv(ord.orderNumber),
        escapeCsv(orderDate.toLocaleDateString('en-IN')),
        escapeCsv(orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
        escapeCsv(ord.user?.name || 'Student'),
        escapeCsv(ord.user?.studentId || 'GIIT-CAMPUS'),
        escapeCsv(ord.user?.email || 'N/A'),
        escapeCsv(ord.user?.phone || 'N/A'),
        escapeCsv(itemsList),
        totalQty,
        ord.total,
        escapeCsv(ord.pickupMode === 'bell_sync' ? 'Bell-Sync' : 'Immediate ASAP'),
        escapeCsv(ord.pickupSlot?.slotLabel || 'Express'),
        escapeCsv(ord.status),
      ].join(',');
    });

    // UTF-8 BOM so Excel opens with proper encoding
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="BreakBite_Canteen_Sales_Report_${new Date().toISOString().substring(0, 10)}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export sales report.',
      error: error.message,
    });
  }
};
