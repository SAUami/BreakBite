const GroupCart = require('../models/GroupCart');
const MenuItem = require('../models/MenuItem');

// Helper to generate 6-character code
const generateCartCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'BB-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// @desc    Create a new Group Cart
// @route   POST /api/group-cart
// @access  Private
exports.createGroupCart = async (req, res) => {
  try {
    const { title } = req.body;
    let code = generateCartCode();

    // Check collision
    let existing = await GroupCart.findOne({ code });
    while (existing) {
      code = generateCartCode();
      existing = await GroupCart.findOne({ code });
    }

    const groupCart = await GroupCart.create({
      code,
      title: title || 'Campus Squad Cart',
      host: req.user._id,
      hostName: req.user.name,
      members: [
        {
          user: req.user._id,
          name: req.user.name,
        },
      ],
      items: [],
      status: 'open',
    });

    res.status(201).json({
      success: true,
      message: 'Group Cart created! Share this code with friends.',
      cart: groupCart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create group cart.',
      error: error.message,
    });
  }
};

// @desc    Get group cart by code or ID
// @route   GET /api/group-cart/:code
// @access  Public / Private
exports.getGroupCartByCode = async (req, res) => {
  try {
    const groupCart = await GroupCart.findOne({ code: req.params.code.toUpperCase() })
      .populate('items.menuItem', 'name price image isVeg');

    if (!groupCart) {
      return res.status(404).json({
        success: false,
        message: 'Group Cart not found with this code.',
      });
    }

    // Compute bill per member for split preview
    const memberTotals = {};
    let grandTotal = 0;

    for (const it of groupCart.items) {
      const uId = it.user ? it.user.toString() : 'guest';
      const uName = it.userName || 'Friend';
      const cost = it.price * it.quantity;
      grandTotal += cost;

      if (!memberTotals[uId]) {
        memberTotals[uId] = { userName: uName, itemsCount: 0, amount: 0 };
      }
      memberTotals[uId].itemsCount += it.quantity;
      memberTotals[uId].amount += cost;
    }

    res.status(200).json({
      success: true,
      cart: groupCart,
      grandTotal,
      splits: Object.values(memberTotals),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group cart.',
    });
  }
};

// @desc    Join a group cart
// @route   POST /api/group-cart/:code/join
// @access  Private
exports.joinGroupCart = async (req, res) => {
  try {
    const groupCart = await GroupCart.findOne({ code: req.params.code.toUpperCase() });

    if (!groupCart) {
      return res.status(404).json({
        success: false,
        message: 'Group Cart not found.',
      });
    }

    if (groupCart.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This group cart is already locked or ordered.',
      });
    }

    const alreadyMember = groupCart.members.some(
      (m) => m.user && m.user.toString() === req.user._id.toString()
    );

    if (!alreadyMember) {
      groupCart.members.push({
        user: req.user._id,
        name: req.user.name,
      });
      await groupCart.save();

      const io = req.app.get('io');
      if (io) {
        io.to(`group:${groupCart.code}`).emit('group:member_joined', {
          name: req.user.name,
          membersCount: groupCart.members.length,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Joined ${groupCart.title}!`,
      cart: groupCart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to join group cart.',
    });
  }
};

// @desc    Add item to group cart
// @route   POST /api/group-cart/:code/items
// @access  Private
exports.addItemToGroupCart = async (req, res) => {
  try {
    const { menuItemId, quantity } = req.body;
    const groupCart = await GroupCart.findOne({ code: req.params.code.toUpperCase() });

    if (!groupCart) {
      return res.status(404).json({
        success: false,
        message: 'Group Cart not found.',
      });
    }

    if (groupCart.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Group cart is locked.',
      });
    }

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.',
      });
    }

    const qty = Number(quantity) || 1;

    // Check if user already added this exact item
    const existingIndex = groupCart.items.findIndex(
      (it) => it.menuItem.toString() === menuItemId && it.user.toString() === req.user._id.toString()
    );

    if (existingIndex > -1) {
      groupCart.items[existingIndex].quantity += qty;
    } else {
      groupCart.items.push({
        user: req.user._id,
        userName: req.user.name,
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: qty,
        isVeg: menuItem.isVeg,
        prepTimeMinutes: menuItem.prepTimeMinutes,
      });
    }

    await groupCart.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`group:${groupCart.code}`).emit('group:cart_updated', groupCart);
    }

    res.status(200).json({
      success: true,
      message: `Added ${menuItem.name} to squad cart!`,
      cart: groupCart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add item to group cart.',
    });
  }
};

// @desc    Remove item from group cart
// @route   DELETE /api/group-cart/:code/items/:itemId
// @access  Private
exports.removeItemFromGroupCart = async (req, res) => {
  try {
    const groupCart = await GroupCart.findOne({ code: req.params.code.toUpperCase() });
    if (!groupCart) {
      return res.status(404).json({
        success: false,
        message: 'Group Cart not found.',
      });
    }

    groupCart.items = groupCart.items.filter(
      (it) => it._id.toString() !== req.params.itemId
    );

    await groupCart.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`group:${groupCart.code}`).emit('group:cart_updated', groupCart);
    }

    res.status(200).json({
      success: true,
      message: 'Item removed from group cart.',
      cart: groupCart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove item.',
    });
  }
};
