require('dotenv').config();
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const groupCartRoutes = require('./routes/groupCart');
const analyticsRoutes = require('./routes/analytics');
const seedDatabase = require('./utils/seed');
const MenuItem = require('./models/MenuItem');

const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow mobile apps, postman, or matching origins
      if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for hackathon testing
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

// Attach io instance to express app so controllers can access it via req.app.get('io')
app.set('io', io);

// Socket.io Real-time Event Handlers
io.on('connection', (socket) => {
  console.log(`[Socket] New connection established: ${socket.id}`);

  // Join canteen kitchen room
  socket.on('join:canteen', () => {
    socket.join('canteen-room');
    console.log(`[Socket] ${socket.id} joined canteen-room`);
  });

  // Join individual order room for live tracking
  socket.on('join:order', (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(`[Socket] ${socket.id} joined tracking for order:${orderId}`);
  });

  // Join user's personal updates channel
  socket.on('join:user', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`[Socket] ${socket.id} joined user channel:${userId}`);
  });

  // Join group cart collaborative room
  socket.on('join:group_cart', (cartCode) => {
    socket.join(`group:${cartCode}`);
    console.log(`[Socket] ${socket.id} joined group cart:${cartCode}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/group-cart', groupCartRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'BreakBite Canteen Backend',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting',
    timestamp: new Date().toISOString(),
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.send('BreakBite API is running smoothly. Visit /api/health for system status.');
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Database Connection with In-Memory fallback for zero-friction hackathon demo
const PORT = process.env.PORT || 5000;

async function startDatabase() {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/breakbite';

  try {
    console.log(`[Database] Attempting connection to MongoDB: ${primaryUri}`);
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('[Database] Connected to primary MongoDB successfully!');

    // Check if database needs initial seeding
    const itemCount = await MenuItem.countDocuments();
    if (itemCount === 0) {
      console.log('[Database] Empty database detected. Auto-seeding initial canteen menu & accounts...');
      await seedDatabase();
    }
  } catch (primaryErr) {
    console.warn(`[Database Warning] Could not connect to primary MongoDB (${primaryErr.message}).`);
    console.log('[Database] Launching seamless In-Memory MongoDB Server for 100% offline hackathon support...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      console.log(`[Database] In-Memory MongoDB instance ready at: ${memUri}`);

      await mongoose.connect(memUri);
      console.log('[Database] Connected to In-Memory MongoDB!');
      console.log('[Database] Auto-seeding Indian canteen menu and demo credentials...');
      await seedDatabase();
    } catch (memErr) {
      console.error('[Database Fatal] Failed to initialize in-memory database:', memErr);
    }
  }
}

// Start Server
async function startServer() {
  await startDatabase();
  server.listen(PORT, () => {
    console.log(`
=============================================================
  BREAKBITE DIGITAL CANTEEN BACKEND (Bell-Sync Enabled)
  Status:  Running on http://localhost:${PORT}
  Time:    ${new Date().toLocaleTimeString()}
=============================================================
    `);
  });
}

startServer();
