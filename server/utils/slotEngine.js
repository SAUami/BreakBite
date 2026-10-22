const Order = require('../models/Order');

const DEFAULT_WALK_MINUTES = parseInt(process.env.CAMPUS_WALK_MINUTES, 10) || 4;
const MAX_ORDERS_PER_SLOT = parseInt(process.env.MAX_ORDERS_PER_SLOT, 10) || 5;
const KITCHEN_CAPACITY_MINUTES = parseInt(process.env.KITCHEN_CAPACITY_PREP_MINUTES, 10) || 40;

/**
 * Calculates realistic preparation time for a list of items
 * Takes parallel prep into account: max item prep time + fractional add-ons
 */
function calculateOrderPrepTime(items = []) {
  if (!items || items.length === 0) return 5;

  let maxSinglePrep = 0;
  let totalAddonMinutes = 0;

  for (const item of items) {
    const itemPrep = item.prepTimeMinutes || 5;
    const qty = item.quantity || 1;
    if (itemPrep > maxSinglePrep) {
      maxSinglePrep = itemPrep;
    }
    // Each additional item or quantity adds a small concurrent prep delta
    totalAddonMinutes += (itemPrep * 0.25) * (qty);
  }

  const estimated = Math.round(maxSinglePrep + totalAddonMinutes * 0.5);
  // Cap between 4 and 25 minutes
  return Math.min(Math.max(estimated, 4), 25);
}

/**
 * Round a Date object to the nearest 5-minute window
 */
function roundToNearest5Minutes(date) {
  const coeff = 1000 * 60 * 5;
  return new Date(Math.ceil(date.getTime() / coeff) * coeff);
}

/**
 * Get current live kitchen load metric (Low / Medium / High)
 */
async function getKitchenLoadMetric() {
  const activeOrders = await Order.find({
    status: { $in: ['Placed', 'Preparing'] },
  }).lean();

  let activePrepMinutes = 0;
  for (const order of activeOrders) {
    for (const it of order.items) {
      activePrepMinutes += (it.prepTimeMinutes || 4) * (it.quantity || 1);
    }
  }

  // Active cooking concurrent capacity threshold
  const loadPercentage = Math.min(
    100,
    Math.round((activePrepMinutes / KITCHEN_CAPACITY_MINUTES) * 100)
  );

  let level = 'Low';
  let message = 'Kitchen operating at smooth pace. Instant turnaround.';
  let badgeColor = 'emerald';

  if (loadPercentage >= 75) {
    level = 'High';
    message = 'High rush spike detected! Slot pacing & Bell-Sync actively smoothing line.';
    badgeColor = 'rose';
  } else if (loadPercentage >= 40) {
    level = 'Medium';
    message = 'Moderate counter activity. Bell-Sync recommended for zero-wait.';
    badgeColor = 'amber';
  }

  return {
    percentage: loadPercentage,
    level,
    message,
    badgeColor,
    activeOrdersCount: activeOrders.length,
    activePrepMinutes,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Calculates schedule for an order: fireTime, estimatedReadyTime, leaveNowTime
 */
async function scheduleOrder({ items, pickupMode, requestedPickupTime, walkingMinutes = DEFAULT_WALK_MINUTES }) {
  const now = new Date();
  const prepTimeMinutes = calculateOrderPrepTime(items);

  let scheduledPickup;
  let slotLabel;

  if (pickupMode === 'bell_sync' && requestedPickupTime) {
    scheduledPickup = new Date(requestedPickupTime);
    // If invalid or in past, fallback to earliest possible
    if (isNaN(scheduledPickup.getTime()) || scheduledPickup.getTime() < now.getTime() + prepTimeMinutes * 60 * 1000) {
      scheduledPickup = new Date(now.getTime() + (prepTimeMinutes + 2) * 60 * 1000);
      slotLabel = 'Fastest Available Slot';
    } else {
      slotLabel = scheduledPickup.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  } else {
    // ASAP mode: ready in prepTimeMinutes from now
    scheduledPickup = new Date(now.getTime() + prepTimeMinutes * 60 * 1000);
    slotLabel = 'Immediate (ASAP)';
  }

  // Round scheduled pickup to 5-minute slot
  scheduledPickup = roundToNearest5Minutes(scheduledPickup);

  // Check slot capacity (max orders per 5-min slot)
  const slotStart = new Date(scheduledPickup.getTime() - 2.5 * 60 * 1000);
  const slotEnd = new Date(scheduledPickup.getTime() + 2.5 * 60 * 1000);

  const existingCount = await Order.countDocuments({
    scheduledPickupTime: { $gte: slotStart, $lte: slotEnd },
    status: { $nin: ['Collected', 'Cancelled'] },
  });

  // If slot is full, push forward to next 5-min slot
  if (existingCount >= MAX_ORDERS_PER_SLOT) {
    scheduledPickup = new Date(scheduledPickup.getTime() + 5 * 60 * 1000);
    slotLabel = `${scheduledPickup.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Shifted: Prev slot full)`;
  }

  // Fire time: when kitchen should drop the food on pan/fryer
  const fireTimeMs = scheduledPickup.getTime() - prepTimeMinutes * 60 * 1000;
  const fireTime = new Date(Math.max(now.getTime(), fireTimeMs));

  // Estimated ready is the scheduled pickup time
  const estimatedReadyTime = new Date(scheduledPickup.getTime());

  // Leave now time: ready time minus walk time
  const leaveNowTime = new Date(estimatedReadyTime.getTime() - walkingMinutes * 60 * 1000);

  return {
    scheduledPickupTime: scheduledPickup,
    fireTime,
    estimatedReadyTime,
    leaveNowTime,
    prepTimeMinutes,
    walkingMinutes,
    slotLabel,
    slotTime: scheduledPickup.toTimeString().substring(0, 5),
  };
}

/**
 * Generate smart pickup slots for the next 3 hours
 * Including college bell times (e.g., lecture breaks)
 */
async function generateAvailableSlots(items = []) {
  const prepTimeMinutes = calculateOrderPrepTime(items);
  const now = new Date();
  const slots = [];

  // College preset bell periods (GIIT schedule)
  const collegeBells = [
    { label: 'Lecture 1 Break (10:15 AM)', hour: 10, minute: 15 },
    { label: 'Lecture 2 Break (11:10 AM)', hour: 11, minute: 10 },
    { label: 'Recess / Lunch (1:10 PM)', hour: 13, minute: 10 },
    { label: 'Afternoon Tea (3:30 PM)', hour: 15, minute: 30 },
    { label: 'Day End / Hostel (4:45 PM)', hour: 16, minute: 45 },
  ];

  // Start from earliest possible ready time (rounded up to 5 min)
  const earliestReady = roundToNearest5Minutes(
    new Date(now.getTime() + (prepTimeMinutes + 2) * 60 * 1000)
  );

  // Generate regular 5-minute interval slots for the next 2 hours
  for (let offset = 0; offset <= 120; offset += 5) {
    const slotDate = new Date(earliestReady.getTime() + offset * 60 * 1000);

    const slotStart = new Date(slotDate.getTime() - 2.5 * 60 * 1000);
    const slotEnd = new Date(slotDate.getTime() + 2.5 * 60 * 1000);

    const ordersInSlot = await Order.countDocuments({
      scheduledPickupTime: { $gte: slotStart, $lte: slotEnd },
      status: { $nin: ['Collected', 'Cancelled'] },
    });

    const isAvailable = ordersInSlot < MAX_ORDERS_PER_SLOT;
    const timeStr = slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Check if this slot aligns with a college bell
    const matchingBell = collegeBells.find(
      (b) => Math.abs((b.hour * 60 + b.minute) - (slotDate.getHours() * 60 + slotDate.getMinutes())) <= 5
    );

    slots.push({
      isoTime: slotDate.toISOString(),
      timeFormatted: timeStr,
      label: matchingBell ? `${timeStr} 🔔 ${matchingBell.label}` : `${timeStr}`,
      isBellSyncPreset: !!matchingBell,
      available: isAvailable,
      ordersInSlot,
      remainingCapacity: Math.max(0, MAX_ORDERS_PER_SLOT - ordersInSlot),
      estPrepMinutes: prepTimeMinutes,
    });
  }

  return {
    earliestPickupTime: earliestReady.toISOString(),
    prepTimeMinutes,
    maxPerSlot: MAX_ORDERS_PER_SLOT,
    slots,
  };
}

/**
 * Generate a pickup token like #BB-104
 */
function generateOrderNumber() {
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `BB-${randomNum}`;
}

module.exports = {
  calculateOrderPrepTime,
  getKitchenLoadMetric,
  scheduleOrder,
  generateAvailableSlots,
  generateOrderNumber,
  DEFAULT_WALK_MINUTES,
};
