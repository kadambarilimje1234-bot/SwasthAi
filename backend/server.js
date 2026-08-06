const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

dotenv.config();

// Import database connection
const connectDB = require('./src/config/database');

// Import routes
const authRoutes = require('./src/routs/authRoutes');
const patientRoutes = require('./src/routs/patientRoutes');
const vitalsRoutes = require('./src/routs/vitalsRoutes');
const predictionRoutes = require('./src/routs/predictionRoutes');

// Import middleware
const { errorHandler } = require('./src/middleware/errorHandler');
const { authenticate } = require('./src/middleware/auth');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// ============ CORS ============
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============ RATE LIMITING ============
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

// ============ MIDDLEWARE ============
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', limiter);

// ============ REQUEST LOGGING ============
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============ ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/patients', authenticate, patientRoutes);
app.use('/api/vitals', authenticate, vitalsRoutes);
app.use('/api/predict', authenticate, predictionRoutes);

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: states[dbState] || 'unknown',
    environment: process.env.NODE_ENV
  });
});

// ============ 404 HANDLER ============
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ============ ERROR HANDLER ============
app.use(errorHandler);

// ============ WEBSOCKET ============
io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);

  socket.on('join-ward', (ward) => {
    socket.join(`ward-${ward}`);
    console.log(`📋 Socket ${socket.id} joined ward: ${ward}`);
  });

  socket.on('join-patient', (patientId) => {
    socket.join(`patient-${patientId}`);
    console.log(`📋 Socket ${socket.id} joined patient: ${patientId}`);
  });

  socket.on('vitals-update', (data) => {
    io.to(`ward-${data.ward}`).emit('vitals-updated', data);
    io.to(`patient-${data.patientId}`).emit('patient-vitals-updated', data);
    io.emit('global-vitals-update', data);
  });

  socket.on('alert-triggered', (data) => {
    io.to(`ward-${data.ward}`).emit('new-alert', data);
    io.emit('global-alert', data);
  });

  socket.on('prediction-result', (data) => {
    io.to(`patient-${data.patientId}`).emit('prediction-received', data);
    io.emit('global-prediction', data);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

// ============ START SERVER ============
const startServer = async () => {
  try {
    await connectDB();
    
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔗 http://localhost:${PORT}`);
      console.log(`📡 WebSocket server ready`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

startServer();

// ============ GRACEFUL SHUTDOWN ============
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// ✅ YEH LINE IMPORTANT HAI - io export karo
module.exports = { io };