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

    console.log('[Seed] Creating demo student & canteen accounts...');
    const studentUser1 = await User.create({
      name: 'Aarav Sharma',
      email: 'student@demo.com',
      password: 'password123',
      role: 'student',
      studentId: 'GIIT-2024-CS081',
      phone: '9876543210',
    });

    const studentUser2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@demo.com',
      password: 'password123',
      role: 'student',
      studentId: 'GIIT-2024-EC042',
      phone: '9876501234',
    });

    const studentUser3 = await User.create({
      name: 'Rohit Verma',
      email: 'rohit@demo.com',
      password: 'password123',
      role: 'student',
      studentId: 'GIIT-2024-ME019',
      phone: '9898981234',
    });

    const studentUser4 = await User.create({
      name: 'Ananya Singh',
      email: 'ananya@demo.com',
      password: 'password123',
      role: 'student',
      studentId: 'GIIT-2024-IT055',
      phone: '9811223344',
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

    console.log('[Seed] Generating realistic multi-day student orders for rich Day-Wise Analytics & Excel export...');
    const now = new Date();

    // Helper to calculate past date
    const daysAgo = (days, hours = 12, mins = 30) => {
      const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      d.setHours(hours, mins, 0, 0);
      return d;
    };

    // Find items by name
    const getItem = (name) => createdMenuItems.find((i) => i.name === name) || createdMenuItems[0];

    const historicalOrders = [
      // -------------------------------------------------------------
      // TODAY (Day 0) - Active Orders & Morning Completed
      // -------------------------------------------------------------
      {
        orderNumber: 'BB-101',
        user: studentUser1._id,
        items: [
          { menuItem: getItem('Crispy Samosa Pav')._id, name: 'Crispy Samosa Pav', price: 20, quantity: 2, isVeg: true, prepTimeMinutes: 4 },
          { menuItem: getItem('Adrak Masala Chai')._id, name: 'Adrak Masala Chai', price: 15, quantity: 1, isVeg: true, prepTimeMinutes: 3 },
        ],
        subtotal: 55,
        total: 55,
        status: 'Ready',
        pickupMode: 'bell_sync',
        pickupSlot: { slotTime: '10:15', slotLabel: '10:15 AM 🔔 Lecture 1 Break' },
        scheduledPickupTime: new Date(now.getTime() + 2 * 60 * 1000),
        fireTime: new Date(now.getTime() - 8 * 60 * 1000),
        estimatedReadyTime: new Date(now.getTime()),
        leaveNowTime: new Date(now.getTime() - 4 * 60 * 1000),
        walkingMinutes: 4,
        specialInstructions: 'Make the chai extra ginger / kadak please!',
        pickupToken: 'BB-101',
        qrCodeValue: `BREAKBITE:BB-101:${studentUser1._id}:55`,
        createdAt: new Date(now.getTime() - 15 * 60 * 1000),
      },
      {
        orderNumber: 'BB-102',
        user: studentUser2._id,
        items: [
          { menuItem: getItem('Paneer Tikka Kathi Roll')._id, name: 'Paneer Tikka Kathi Roll', price: 80, quantity: 1, isVeg: true, prepTimeMinutes: 8 },
          { menuItem: getItem('Thick Cold Coffee with Ice Cream')._id, name: 'Thick Cold Coffee with Ice Cream', price: 45, quantity: 1, isVeg: true, prepTimeMinutes: 4 },
        ],
        subtotal: 125,
        total: 125,
        status: 'Preparing',
        pickupMode: 'bell_sync',
        pickupSlot: { slotTime: '13:10', slotLabel: '1:10 PM 🔔 Recess / Lunch' },
        scheduledPickupTime: new Date(now.getTime() + 10 * 60 * 1000),
        fireTime: new Date(now.getTime() - 2 * 60 * 1000),
        estimatedReadyTime: new Date(now.getTime() + 7 * 60 * 1000),
        leaveNowTime: new Date(now.getTime() + 3 * 60 * 1000),
        walkingMinutes: 4,
        specialInstructions: 'Less ice in cold coffee.',
        pickupToken: 'BB-102',
        qrCodeValue: `BREAKBITE:BB-102:${studentUser2._id}:125`,
        createdAt: new Date(now.getTime() - 5 * 60 * 1000),
      },
      {
        orderNumber: 'BB-103',
        user: studentUser3._id,
        items: [
          { menuItem: getItem('Crispy Samosa Pav')._id, name: 'Crispy Samosa Pav', price: 20, quantity: 3, isVeg: true, prepTimeMinutes: 4 },
          { menuItem: getItem('Adrak Masala Chai')._id, name: 'Adrak Masala Chai', price: 15, quantity: 2, isVeg: true, prepTimeMinutes: 3 },
        ],
        subtotal: 90,
        total: 90,
        status: 'Collected',
        pickupMode: 'bell_sync',
        pickupSlot: { slotTime: '09:45', slotLabel: '9:45 AM Express' },
        scheduledPickupTime: new Date(now.getTime() - 40 * 60 * 1000),
        fireTime: new Date(now.getTime() - 46 * 60 * 1000),
        estimatedReadyTime: new Date(now.getTime() - 40 * 60 * 1000),
        leaveNowTime: new Date(now.getTime() - 44 * 60 * 1000),
        walkingMinutes: 4,
        specialInstructions: 'Extra green chutney.',
        pickupToken: 'BB-103',
        qrCodeValue: `BREAKBITE:BB-103:${studentUser3._id}:90`,
        createdAt: new Date(now.getTime() - 60 * 60 * 1000),
      },

      // -------------------------------------------------------------
      // YESTERDAY (Day 1) - Bestseller: Delhi Style Chole Bhature
      // -------------------------------------------------------------
      {
        orderNumber: 'BB-089',
        user: studentUser4._id,
        items: [
          { menuItem: getItem('Delhi Style Chole Bhature')._id, name: 'Delhi Style Chole Bhature', price: 75, quantity: 2, isVeg: true, prepTimeMinutes: 10 },
          { menuItem: getItem('Kesariya Mango Lassi')._id, name: 'Kesariya Mango Lassi', price: 40, quantity: 2, isVeg: true, prepTimeMinutes: 3 },
        ],
        subtotal: 230,
        total: 230,
        status: 'Collected',
        pickupMode: 'bell_sync',
        pickupSlot: { slotTime: '13:10', slotLabel: '1:10 PM 🔔 Recess / Lunch' },
        scheduledPickupTime: daysAgo(1, 13, 10),
        fireTime: daysAgo(1, 13, 0),
        estimatedReadyTime: daysAgo(1, 13, 10),
        leaveNowTime: daysAgo(1, 13, 6),
        walkingMinutes: 4,
        specialInstructions: 'Well puffed bhature with sliced onions.',
        pickupToken: 'BB-089',
        qrCodeValue: 'BREAKBITE:BB-089:230',
        createdAt: daysAgo(1, 12, 45),
      },
      {
        orderNumber: 'BB-090',
        user: studentUser1._id,
        items: [
          { menuItem: getItem('Delhi Style Chole Bhature')._id, name: 'Delhi Style Chole Bhature', price: 75, quantity: 1, isVeg: true, prepTimeMinutes: 10 },
        ],
        subtotal: 75,
        total: 75,
        status: 'Collected',
        pickupMode: 'bell_sync',
        pickupSlot: { slotTime: '13:15', slotLabel: '1:15 PM Lunch' },
        scheduledPickupTime: daysAgo(1, 13, 15),
        fireTime: daysAgo(1, 13, 5),
        estimatedReadyTime: daysAgo(1, 13, 15),
        leaveNowTime: daysAgo(1, 13, 11),
        walkingMinutes: 4,
        specialInstructions: '',
        pickupToken: 'BB-090',
        qrCodeValue: 'BREAKBITE:BB-090:75',
        createdAt: daysAgo(1, 12, 55),
      },
      {
        orderNumber: 'BB-091',
        user: studentUser2._id,
        items: [
          { menuItem: getItem('College Special Veg Maggi')._id, name: 'College Special Veg Maggi', price: 35, quantity: 2, isVeg: true, prepTimeMinutes: 5 },
          { menuItem: getItem('Thick Cold Coffee with Ice Cream')._id, name: 'Thick Cold Coffee with Ice Cream', price: 45, quantity: 1, isVeg: true, prepTimeMinutes: 4 },
        ],
        subtotal: 115,
        total: 115,
        status: 'Collected',
        pickupMode: 'asap',
        pickupSlot: { slotTime: '16:00', slotLabel: '4:00 PM Evening Snack' },
        scheduledPickupTime: daysAgo(1, 16, 5),
        fireTime: daysAgo(1, 16, 0),
        estimatedReadyTime: daysAgo(1, 16, 5),
        leaveNowTime: daysAgo(1, 16, 1),
        walkingMinutes: 4,
        specialInstructions: 'Spicy maggi.',
        pickupToken: 'BB-091',
        qrCodeValue: 'BREAKBITE:BB-091:115',
        createdAt: daysAgo(1, 15, 50),
      },

      // -------------------------------------------------------------
      // 2 DAYS AGO (Day 2) - Bestseller: Mumbai Butter Pav Bhaji
      // -------------------------------------------------------------
      {
        orderNumber: 'BB-075',
        user: studentUser3._id,
        items: [
          { menuItem: getItem('Mumbai Butter Pav Bhaji')._id, name: 'Mumbai Butter Pav Bhaji', price: 70, quantity: 2, isVeg: true, prepTimeMinutes: 8 },
          { menuItem: getItem('Warm Gulab Jamun (2 Pcs)')._id, name: 'Warm Gulab Jamun (2 Pcs)', price: 30, quantity: 1, isVeg: true, prepTimeMinutes: 2 },
        ],
        subtotal: 170,
        total: 170,
        status: 'Collected',
        pickupMode: 'bell_sync',
        pickupSlot: { slotTime: '13:10', slotLabel: '1:10 PM 🔔 Recess / Lunch' },
        scheduledPickupTime: daysAgo(2, 13, 10),
        fireTime: daysAgo(2, 13, 2),
        estimatedReadyTime: daysAgo(2, 13, 10),
        leaveNowTime: daysAgo(2, 13, 6),
        walkingMinutes: 4,
        specialInstructions: 'Butter tossed pav.',
        pickupToken: 'BB-075',
        qrCodeValue: 'BREAKBITE:BB-075:170',
        createdAt: daysAgo(2, 12, 50),
      },
      {
        orderNumber: 'BB-076',
        user: studentUser4._id,
        items: [
          { menuItem: getItem('Mumbai Butter Pav Bhaji')._id, name: 'Mumbai Butter Pav Bhaji', price: 70, quantity: 1, isVeg: true, prepTimeMinutes: 8 },
          { menuItem: getItem('Adrak Masala Chai')._id, name: 'Adrak Masala Chai', price: 15, quantity: 2, isVeg: true, prepTimeMinutes: 3 },
        ],
        subtotal: 100,
        total: 100,
        status: 'Collected',
        pickupMode: 'bell_sync',
        pickupSlot: { slotTime: '13:15', slotLabel: '1:15 PM' },
        scheduledPickupTime: daysAgo(2, 13, 15),
        fireTime: daysAgo(2, 13, 7),
        estimatedReadyTime: daysAgo(2, 13, 15),
        leaveNowTime: daysAgo(2, 13, 11),
        walkingMinutes: 4,
        specialInstructions: '',
        pickupToken: 'BB-076',
        qrCodeValue: 'BREAKBITE:BB-076:100',
        createdAt: daysAgo(2, 13, 0),
      },

      // -------------------------------------------------------------
      // 3 DAYS AGO (Day 3) - Bestseller: College Special Veg Maggi
      // -------------------------------------------------------------
      {
        orderNumber: 'BB-061',
        user: studentUser1._id,
        items: [
          { menuItem: getItem('College Special Veg Maggi')._id, name: 'College Special Veg Maggi', price: 35, quantity: 3, isVeg: true, prepTimeMinutes: 5 },
          { menuItem: getItem('South Indian Filter Coffee')._id, name: 'South Indian Filter Coffee', price: 20, quantity: 2, isVeg: true, prepTimeMinutes: 3 },
        ],
        subtotal: 145,
        total: 145,
        status: 'Collected',
        pickupMode: 'bell_sync',
        pickupSlot: { slotTime: '15:30', slotLabel: '3:30 PM 🔔 Afternoon Tea' },
        scheduledPickupTime: daysAgo(3, 15, 30),
        fireTime: daysAgo(3, 15, 24),
        estimatedReadyTime: daysAgo(3, 15, 30),
        leaveNowTime: daysAgo(3, 15, 26),
        walkingMinutes: 4,
        specialInstructions: 'Extra cheese on maggi please.',
        pickupToken: 'BB-061',
        qrCodeValue: 'BREAKBITE:BB-061:145',
        createdAt: daysAgo(3, 15, 10),
      },
    ];

    await Order.insertMany(historicalOrders);

    console.log('[Seed] Database successfully seeded with 16 items, 4 students, 1 canteen admin, and 9 multi-day orders!');
    console.log('--- DEMO CREDENTIALS ---');
    console.log('Student 1: student@demo.com / password123 (Aarav Sharma)');
    console.log('Student 2: priya@demo.com / password123 (Priya Patel)');
    console.log('Student 3: rohit@demo.com / password123 (Rohit Verma)');
    console.log('Student 4: ananya@demo.com / password123 (Ananya Singh)');
    console.log('Canteen Staff: canteen@demo.com / password123');
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
