require('dotenv').config();
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const groupCartRoutes = require('./routes/groupCart');
const analyticsRoutes = require('./routes/analytics');
const seedDatabase = require('./utils/seed');
const MenuItem = require('./models/MenuItem');
const { apiLimiter } = require('./middleware/rateLimiter');

// Process Crash Defense: Never let an unhandled error take down the Node process!
process.on('uncaughtException', (err) => {
  console.error('[HIGH-RESILIENCE SHIELD] Uncaught Exception caught safely:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[HIGH-RESILIENCE SHIELD] Unhandled Promise Rejection safely intercepted:', reason);
});

const app = express();
const server = http.createServer(app);

// Security Headers against XSS, clickjacking, MIME sniffing
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible CDN & dev scripts
    crossOriginEmbedderPolicy: false,
  })
);

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

// Strict Body Limit to prevent memory exhaustion / payload bombs
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply Global Rate Limiting across all API routes to protect against traffic surges & DDoS
app.use('/api', apiLimiter);

// Initialize Socket.io with heartbeat & performance buffers
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
  pingTimeout: 30000,
  pingInterval: 25000,
});

// Attach io instance to express app so controllers can access it via req.app.get('io')
app.set('io', io);

// Socket.io Real-time Event Handlers with room validation
io.on('connection', (socket) => {
  // Join canteen kitchen room
  socket.on('join:canteen', () => {
    socket.join('canteen-room');
  });

  // Join individual order room for live tracking
  socket.on('join:order', (orderId) => {
    if (orderId && typeof orderId === 'string') {
      socket.join(`order:${orderId}`);
    }
  });

  // Join user's personal updates channel
  socket.on('join:user', (userId) => {
    if (userId && typeof userId === 'string') {
      socket.join(`user:${userId}`);
    }
  });

  // Join group cart collaborative room
  socket.on('join:group_cart', (cartCode) => {
    if (cartCode && typeof cartCode === 'string') {
      socket.join(`group:${cartCode}`);
    }
  });

  socket.on('error', (err) => {
    console.warn('[Socket Shield] Handled socket client error:', err.message);
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/group-cart', groupCartRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint (Used by Render / Load balancers for automatic zero-downtime health monitoring)
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Healthy (Connected)' : 'Reconnecting';
  res.status(200).json({
    status: 'OK',
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'BreakBite High-Availability Canteen Backend',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.send('BreakBite High-Availability API is running smoothly. Visit /api/health for system status.');
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Robust Centralized Error Handling Middleware (Never leaks stack traces in production)
app.use((err, req, res, next) => {
  console.error('[Server Error Handler]:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error. Please retry in a few moments.',
  });
});

// Database Connection with High-Concurrency Pool & Auto-reconnect
const PORT = process.env.PORT || 5000;

// High-performance mongoose connection pool options
const mongooseOptions = {
  maxPoolSize: 50, // Allows 50 concurrent active DB operations
  minPoolSize: 5,  // Keeps 5 warmed connections ready for instant response
  serverSelectionTimeoutMS: 4000,
  socketTimeoutMS: 45000,
};

async function startDatabase() {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/breakbite';

  try {
    console.log(`[Database] Attempting connection to MongoDB: ${primaryUri}`);
    await mongoose.connect(primaryUri, mongooseOptions);
    console.log('[Database] Connected to primary MongoDB successfully with connection pooling!');

    // Check if database needs initial seeding
    const itemCount = await MenuItem.countDocuments();
    if (itemCount === 0) {
      console.log('[Database] Empty database detected. Auto-seeding initial canteen menu & accounts...');
      await seedDatabase();
    }
  } catch (primaryErr) {
    console.warn(`[Database Warning] Primary MongoDB not reachable (${primaryErr.message}).`);
    console.log('[Database] Launching High-Speed In-Memory MongoDB Server for 100% offline hackathon support...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      console.log(`[Database] In-Memory MongoDB instance ready at: ${memUri}`);

      await mongoose.connect(memUri, mongooseOptions);
      console.log('[Database] Connected to In-Memory MongoDB!');
      console.log('[Database] Auto-seeding Indian canteen menu and demo credentials...');
      await seedDatabase();
    } catch (memErr) {
      console.error('[Database Fatal] Failed to initialize in-memory database:', memErr);
    }
  }
}

// Graceful Shutdown Handler: Closes all sockets and connections cleanly
const gracefulShutdown = () => {
  console.log('\n[Shutdown Signal Received] Closing server and database connections cleanly...');
  server.close(async () => {
    console.log('[HTTP Server Closed]');
    await mongoose.connection.close(false);
    console.log('[Mongoose Connection Closed Cleanly]');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start Server
async function startServer() {
  await startDatabase();
  server.listen(PORT, () => {
    console.log(`
=============================================================
  BREAKBITE HIGH-RESILIENCE CANTEEN BACKEND (Crash-Proof)
  Status:  Running on http://localhost:${PORT}
  Defense: Rate-Limiting Active • Helmet Security Active
  Pool:    50 Concurrent Connections • Auto-Crash Shield Active
=============================================================
    `);
  });
}

startServer();
