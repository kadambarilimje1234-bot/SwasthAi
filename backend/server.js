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

const connectDB = require('./src/config/database');

const authRoutes = require('./src/routs/authRoutes');
const patientRoutes = require('./src/routs/patientRoutes');
const vitalsRoutes = require('./src/routs/vitalsRoutes');
const predictionRoutes = require('./src/routs/predictionRoutes');
const timelineRoutes = require('./src/routs/timelineRoutes');

const { errorHandler } = require('./src/middleware/errorHandler');
const { authenticate } = require('./src/middleware/auth');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['https://swasthai-0sa8.onrender.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(cors({
  origin: ['https://swasthai-0sa8.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', limiter);

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', authenticate, patientRoutes);
app.use('/api/vitals', authenticate, vitalsRoutes);
app.use('/api/predict', authenticate, predictionRoutes);
app.use('/api/timeline', authenticate, timelineRoutes);

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

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use(errorHandler);

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

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { io };