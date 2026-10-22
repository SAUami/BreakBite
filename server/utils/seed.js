require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const GroupCart = require('../models/GroupCart');

const sampleMenuItems = [
  {
    name: 'Crispy Samosa Pav',
    description: 'Golden spiced potato samosa stuffed in fresh pav with sweet tamarind & fiery garlic-green chutney.',
    price: 20,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    prepTimeMinutes: 4,
    rating: 4.8,
    tags: ['Bestseller', 'Campus Favorite', 'Quick'],
    isPopular: true,
  },
  {
    name: 'Adrak Masala Chai',
    description: 'Freshly brewed strong milk tea infused with crushed ginger, cardamom, and aromatic spices.',
    price: 15,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    prepTimeMinutes: 3,
    rating: 4.9,
    tags: ['Hot', 'Exam Fuel', 'Must Try'],
    isPopular: true,
  },
  {
    name: 'College Special Veg Maggi',
    description: 'Double noodles cooked with sauteed onions, capsicum, sweet corn, and canteen secret masala.',
    price: 35,
    category: 'Quick Bites',
    image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    prepTimeMinutes: 5,
    rating: 4.9,
    tags: ['Legendary', 'Cheesy Option', 'Spicy'],
    isPopular: true,
  },
  {
    name: 'Delhi Style Chole Bhature',
    description: 'Two fluffy balloon bhature served with rich pindi chole, pickled onions, and mint chutney.',
    price: 75,
    category: 'Meals',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    prepTimeMinutes: 10,
    rating: 4.7,
    tags: ['Heavy Lunch', 'Weekend Vibe'],
    isPopular: true,
  },
  {
    name: 'Paneer Tikka Kathi Roll',
    description: 'Smoky grilled paneer cubes wrapped in layered paratha with mint mayo, capsicum, and chaat spices.',
    price: 80,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    prepTimeMinutes: 8,
    rating: 4.8,
    tags: ['High Protein', 'Bestseller'],
    isPopular: true,
  },
  {
    name: 'Mumbai Butter Pav Bhaji',
    description: 'Mashed vegetable curry topped with a dollop of butter, served with two toasted soft pavs.',
    price: 70,
    category: 'Meals',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    prepTimeMinutes: 8,
    rating: 4.7,
    tags: ['Cheesy Pav Available', 'Classic'],
    isPopular: false,
  },
  {
    name: 'Thick Cold Coffee with Ice Cream',
    description: 'Chilled rich blended coffee poured over a scoop of vanilla ice cream with cocoa dusting.',
    price: 45,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    prepTimeMinutes: 4,
    rating: 4.9,
    tags: ['Chilled', 'Bestseller', 'Sweet Tooth'],
    isPopular: true,
  },
  {
    name: 'Veg Cheese Grilled Sandwich',
    description: 'Triple layered sandwich stuffed with cucumber, tomato, cheese, potato, and green chutney.',
    price: 55,
    category: 'Quick Bites',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    prepTimeMinutes: 6,
    rating: 4.6,
    tags: ['Cheesy', 'Crispy'],
    isPopular: false,
  },
  {
    name: 'Crispy Aloo Tikki Burger',
    description: 'Herb potato patty inside toasted sesame buns with iceberg lettuce and tandoori spread.',
    price: 45,
    category: 'Quick Bites',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    prepTimeMinutes: 6,
    rating: 4.5,
    tags: ['Quick Grab', 'Crunchy'],
    isPopular: false,
  },
  {
    name: 'Warm Gulab Jamun (2 Pcs)',
    description: 'Soft melt-in-mouth milk solids soaked in rose and saffron scented cardamom sugar syrup.',
    price: 30,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    prepTimeMinutes: 2,
    rating: 4.8,
    tags: ['Sweet Treat', 'Instant'],
    isPopular: false,
  },
  {
    name: 'South Indian Filter Coffee',
    description: 'Authentic decoction brew frothed with hot creamy milk in a traditional brass tumbler style.',
    price: 20,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    prepTimeMinutes: 3,
    rating: 4.7,
    tags: ['Authentic', 'Aromatic'],
    isPopular: false,
  },
  {
    name: 'Homestyle Rajma Chawal Bowl',
    description: 'Slow-simmered Punjabi red kidney beans in thick tomato gravy served over steamed basmati rice.',
    price: 65,
    category: 'Meals',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    prepTimeMinutes: 5,
    rating: 4.8,
    tags: ['Comfort Food', 'Healthy'],
    isPopular: true,
  },
  {
    name: 'Irani Bun Maska with Jam',
    description: 'Warm soft bakery bun generously layered with Amul butter and mixed fruit jam.',
    price: 30,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    prepTimeMinutes: 3,
    rating: 4.6,
    tags: ['Chai Companion', 'Light'],
    isPopular: false,
  },
  {
    name: 'Kesariya Mango Lassi',
    description: 'Thick churned sweet yogurt blended with Alphonso mango pulp and saffron strands.',
    price: 40,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    prepTimeMinutes: 3,
    rating: 4.8,
    tags: ['Refreshing', 'Summer Special'],
    isPopular: false,
  },
  {
    name: 'Smoky Chicken Tikka Roll',
    description: 'Succulent spiced chicken breast chunks roasted in tandoor masala and rolled with onion rings.',
    price: 90,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80',
    isVeg: false,
    isAvailable: true,
    prepTimeMinutes: 8,
    rating: 4.9,
    tags: ['Non-Veg', 'High Protein', 'Spicy'],
    isPopular: true,
  },
  {
    name: 'Deluxe Shahi Paneer Thali',
    description: 'Royal shahi paneer, dal fry, 3 butter rotis, jeera rice, salad, papad, and gulab jamun.',
    price: 110,
    category: 'Meals',
    image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    prepTimeMinutes: 12,
    rating: 4.8,
    tags: ['Full Meal', 'Grand Combo'],
    isPopular: false,
  },
];

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/breakbite';
    console.log(`[Seed] Connecting to MongoDB: ${mongoUri}`);

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 4000,
      });
    }

    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({});
    await MenuItem.deleteMany({});
    await Order.deleteMany({});
    await GroupCart.deleteMany({});

    console.log('[Seed] Creating demo user accounts...');
    const studentUser = await User.create({
      name: 'Aarav Sharma',
      email: 'student@demo.com',
      password: 'password123',
      role: 'student',
      studentId: 'GIIT-2024-CS081',
      phone: '9876543210',
    });

    const canteenUser = await User.create({
      name: 'Chef Rajesh Sharma (Canteen Admin)',
      email: 'canteen@demo.com',
      password: 'password123',
      role: 'canteen',
      studentId: 'STAFF-KITCHEN-01',
      phone: '9812345678',
    });

    console.log('[Seed] Inserting 16 delicious Indian canteen menu items...');
    const createdMenuItems = await MenuItem.insertMany(sampleMenuItems);

    console.log('[Seed] Generating initial demo orders to showcase live Bell-Sync & kitchen load...');
    const now = new Date();

    // Order 1: Ready for pickup (placed 12 mins ago, ready now)
    const order1Items = [
      {
        menuItem: createdMenuItems[0]._id, // Samosa Pav
        name: createdMenuItems[0].name,
        price: createdMenuItems[0].price,
        quantity: 2,
        isVeg: true,
        prepTimeMinutes: 4,
      },
      {
        menuItem: createdMenuItems[1]._id, // Chai
        name: createdMenuItems[1].name,
        price: createdMenuItems[1].price,
        quantity: 1,
        isVeg: true,
        prepTimeMinutes: 3,
      },
    ];
    const order1Subtotal = 20 * 2 + 15;

    await Order.create({
      orderNumber: 'BB-101',
      user: studentUser._id,
      items: order1Items,
      subtotal: order1Subtotal,
      convenienceFee: 0,
      total: order1Subtotal,
      status: 'Ready',
      pickupMode: 'bell_sync',
      pickupSlot: {
        slotTime: now.toTimeString().substring(0, 5),
        slotLabel: `${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 🔔 Class End`,
      },
      scheduledPickupTime: new Date(now.getTime() + 2 * 60 * 1000),
      fireTime: new Date(now.getTime() - 8 * 60 * 1000),
      estimatedReadyTime: new Date(now.getTime()),
      leaveNowTime: new Date(now.getTime() - 4 * 60 * 1000),
      walkingMinutes: 4,
      specialInstructions: 'Make the chai extra ginger / kadak please!',
      pickupToken: 'BB-101',
      qrCodeValue: `BREAKBITE:BB-101:${studentUser._id}:${order1Subtotal}`,
      statusHistory: [
        { status: 'Placed', timestamp: new Date(now.getTime() - 15 * 60 * 1000), note: 'Order registered.' },
        { status: 'Preparing', timestamp: new Date(now.getTime() - 8 * 60 * 1000), note: 'Chai and Samosas frying in pan.' },
        { status: 'Ready', timestamp: new Date(now.getTime() - 1 * 60 * 1000), note: 'Ready at Counter 2.' },
      ],
    });

    // Order 2: Preparing (fajita roll & cold coffee)
    const order2Items = [
      {
        menuItem: createdMenuItems[4]._id, // Paneer Roll
        name: createdMenuItems[4].name,
        price: createdMenuItems[4].price,
        quantity: 1,
        isVeg: true,
        prepTimeMinutes: 8,
      },
      {
        menuItem: createdMenuItems[6]._id, // Cold Coffee
        name: createdMenuItems[6].name,
        price: createdMenuItems[6].price,
        quantity: 1,
        isVeg: true,
        prepTimeMinutes: 4,
      },
    ];
    const order2Subtotal = 80 + 45;

    await Order.create({
      orderNumber: 'BB-102',
      user: studentUser._id,
      items: order2Items,
      subtotal: order2Subtotal,
      convenienceFee: 0,
      total: order2Subtotal,
      status: 'Preparing',
      pickupMode: 'bell_sync',
      pickupSlot: {
        slotTime: '13:10',
        slotLabel: '1:10 PM 🔔 Recess / Lunch',
      },
      scheduledPickupTime: new Date(now.getTime() + 10 * 60 * 1000),
      fireTime: new Date(now.getTime() - 2 * 60 * 1000),
      estimatedReadyTime: new Date(now.getTime() + 7 * 60 * 1000),
      leaveNowTime: new Date(now.getTime() + 3 * 60 * 1000),
      walkingMinutes: 4,
      specialInstructions: 'Less ice in cold coffee.',
      pickupToken: 'BB-102',
      qrCodeValue: `BREAKBITE:BB-102:${studentUser._id}:${order2Subtotal}`,
      statusHistory: [
        { status: 'Placed', timestamp: new Date(now.getTime() - 5 * 60 * 1000), note: 'Order scheduled.' },
        { status: 'Preparing', timestamp: new Date(now.getTime() - 2 * 60 * 1000), note: 'Chef fired roll onto tawa.' },
      ],
    });

    console.log('[Seed] Database successfully seeded with 16 items, 2 demo users, and 2 active orders!');
    console.log('--- DEMO CREDENTIALS ---');
    console.log('Student Account: student@demo.com / password123');
    console.log('Canteen Account: canteen@demo.com / password123');
    console.log('------------------------');

    return { success: true };
  } catch (err) {
    console.error('[Seed Error]:', err);
    throw err;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedDatabase;
