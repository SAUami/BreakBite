const MenuItem = require('../models/MenuItem');

// @desc    Get all menu items with search, category & veg filter
// @route   GET /api/menu
// @access  Public
exports.getMenuItems = async (req, res) => {
  try {
    const { category, search, vegOnly, availableOnly } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (vegOnly === 'true') {
      filter.isVeg = true;
    }

    if (availableOnly === 'true') {
      filter.isAvailable = true;
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    const items = await MenuItem.find(filter).sort({ isAvailable: -1, orderCountToday: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu items.',
      error: error.message,
    });
  }
};

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
exports.getMenuItemById = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.',
      });
    }

    res.status(200).json({
      success: true,
      item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu item.',
    });
  }
};

// @desc    Create new menu item (Canteen only)
// @route   POST /api/menu
// @access  Private (Canteen)
exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, image, isVeg, prepTimeMinutes, tags, isPopular } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, price, and category.',
      });
    }

    const newItem = await MenuItem.create({
      name,
      description: description || '',
      price: Number(price),
      category,
      image: image || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
      isVeg: isVeg !== undefined ? Boolean(isVeg) : true,
      isAvailable: true,
      prepTimeMinutes: Number(prepTimeMinutes) || 5,
      tags: tags || [],
      isPopular: Boolean(isPopular),
    });

    // Notify all connected clients via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('menu:item_added', newItem);
    }

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully.',
      item: newItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create menu item.',
      error: error.message,
    });
  }
};

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private (Canteen)
exports.updateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.',
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('menu:item_updated', item);
    }

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully.',
      item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update menu item.',
      error: error.message,
    });
  }
};

// @desc    Toggle item stock availability
// @route   PATCH /api/menu/:id/toggle-stock
// @access  Private (Canteen)
exports.toggleStockAvailability = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.',
      });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('menu:stock_toggled', {
        id: item._id,
        isAvailable: item.isAvailable,
        name: item.name,
      });
    }

    res.status(200).json({
      success: true,
      message: `${item.name} marked as ${item.isAvailable ? 'In Stock' : 'Out of Stock'}.`,
      item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle stock status.',
    });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private (Canteen)
exports.deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.',
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('menu:item_deleted', { id: req.params.id });
    }

    res.status(200).json({
      success: true,
      message: 'Item removed from canteen menu.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete menu item.',
    });
  }
};
