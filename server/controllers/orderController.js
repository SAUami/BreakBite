const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const slotEngine = require('../utils/slotEngine');

// @desc    Place a new order with Bell-Sync slot engine
// @route   POST /api/orders
// @access  Private (Student)
exports.createOrder = async (req, res) => {
  try {
    const { items, pickupMode, requestedPickupTime, walkingMinutes, specialInstructions, isGroupOrder, groupCartId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Please add items to place an order.',
      });
    }

    // Validate items and recalculate subtotal
    let subtotal = 0;
    const validatedItems = [];

    for (const cartItem of items) {
      const dbItem = await MenuItem.findById(cartItem.menuItem || cartItem._id || cartItem.id);
      if (!dbItem) {
        return res.status(400).json({
          success: false,
          message: `Item not found in canteen database: ${cartItem.name}`,
        });
      }

      if (!dbItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Sorry, "${dbItem.name}" just went out of stock! Please remove or replace it.`,
        });
      }

      const qty = Number(cartItem.quantity) || 1;
      const itemTotal = dbItem.price * qty;
      subtotal += itemTotal;

      validatedItems.push({
        menuItem: dbItem._id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: qty,
        isVeg: dbItem.isVeg,
        prepTimeMinutes: dbItem.prepTimeMinutes || 5,
      });

      // Increment today's popularity count
      await MenuItem.findByIdAndUpdate(dbItem._id, { $inc: { orderCountToday: qty } });
    }

    const convenienceFee = 0; // Free campus ordering
    const total = subtotal + convenienceFee;

    // Run Bell-Sync Slot Engine
    const schedule = await slotEngine.scheduleOrder({
      items: validatedItems,
      pickupMode: pickupMode || 'asap',
      requestedPickupTime,
      walkingMinutes: Number(walkingMinutes) || slotEngine.DEFAULT_WALK_MINUTES,
    });

    const orderNumber = slotEngine.generateOrderNumber();
    const pickupToken = orderNumber;
    const qrCodeValue = `BREAKBITE:${orderNumber}:${req.user.id}:${total}:${schedule.scheduledPickupTime.toISOString()}`;

    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      items: validatedItems,
      subtotal,
      convenienceFee,
      total,
      status: 'Placed',
      pickupMode: pickupMode || 'asap',
      pickupSlot: {
        slotTime: schedule.slotTime,
        slotLabel: schedule.slotLabel,
      },
      scheduledPickupTime: schedule.scheduledPickupTime,
      fireTime: schedule.fireTime,
      estimatedReadyTime: schedule.estimatedReadyTime,
      leaveNowTime: schedule.leaveNowTime,
      walkingMinutes: schedule.walkingMinutes,
      specialInstructions: specialInstructions || '',
      pickupToken,
      qrCodeValue,
      isGroupOrder: Boolean(isGroupOrder),
      groupCartId: groupCartId || null,
      statusHistory: [
        {
          status: 'Placed',
          timestamp: new Date(),
          note: `Order registered via ${pickupMode === 'bell_sync' ? 'Bell-Sync Scheduled' : 'ASAP Express'}.`,
        },
      ],
    });

    // Populate user details for real-time canteen card
    const populatedOrder = await Order.findById(order._id).populate('user', 'name email phone studentId');

    // Notify canteen via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to('canteen-room').emit('order:new', populatedOrder);
      // Emit live kitchen load update
      const updatedLoad = await slotEngine.getKitchenLoadMetric();
      io.emit('load:update', updatedLoad);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully with Bell-Sync schedule!',
      order: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to place order.',
      error: error.message,
    });
  }
};

// @desc    Get user's own orders
// @route   GET /api/orders/my-orders
// @access  Private (Student)
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.menuItem', 'name image isVeg');

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your orders.',
    });
  }
};

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone studentId')
      .populate('items.menuItem', 'name image isVeg prepTimeMinutes');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Role check: either the user who placed it or canteen staff
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'canteen') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order.',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details.',
    });
  }
};

// @desc    Get all orders for canteen dashboard with filter & sort by fireTime
// @route   GET /api/orders/canteen/all
// @access  Private (Canteen)
exports.getCanteenOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    // Orders sorted by status priority and fireTime
    const orders = await Order.find(filter)
      .populate('user', 'name email phone studentId')
      .sort({ fireTime: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch canteen orders.',
    });
  }
};

// @desc    Update order status (Canteen)
// @route   PATCH /api/orders/:id/status
// @access  Private (Canteen)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['Placed', 'Preparing', 'Ready', 'Collected', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id).populate('user', 'name email phone studentId');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status} by canteen staff.`,
    });

    await order.save();

    // Broadcast status change via Socket.io
    const io = req.app.get('io');
    if (io) {
      // Broadcast to all canteen operators
      io.to('canteen-room').emit('order:status_changed', order);
      // Broadcast to specific order room or user
      io.to(`order:${order._id}`).emit('order:status_update', order);
      io.to(`user:${order.user._id}`).emit('order:user_update', order);

      // Recalculate kitchen load
      const updatedLoad = await slotEngine.getKitchenLoadMetric();
      io.emit('load:update', updatedLoad);
    }

    res.status(200).json({
      success: true,
      message: `Order #${order.orderNumber} status changed to ${status}.`,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order status.',
      error: error.message,
    });
  }
};

// @desc    Get live kitchen load metric
// @route   GET /api/orders/kitchen/load
// @access  Public
exports.getKitchenLoad = async (req, res) => {
  try {
    const load = await slotEngine.getKitchenLoadMetric();
    res.status(200).json({
      success: true,
      load,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch kitchen load.',
    });
  }
};

// @desc    Get available Bell-Sync slots
// @route   POST /api/orders/slots
// @access  Public
exports.getPickupSlots = async (req, res) => {
  try {
    const { items } = req.body;
    const slotsData = await slotEngine.generateAvailableSlots(items || []);

    res.status(200).json({
      success: true,
      data: slotsData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate pickup slots.',
    });
  }
};
