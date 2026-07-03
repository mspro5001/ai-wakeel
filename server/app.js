const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { Server } = require('socket.io');
const config = require('./config');
const { initDatabase, db } = require('./database');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.nodeEnv === 'production' ? false : '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const rootDir = path.join(__dirname, '..');

for (const dir of Object.values(config.paths)) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

initDatabase().catch(err => { logger.error('APP', `DB init failed: ${err.message}`); process.exit(1); });

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: config.nodeEnv === 'production' ? (process.env.CLIENT_URL || true) : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.info('HTTP', msg.trim()) },
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
});
app.use('/api/auth/', authLimiter);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.paths.videos);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'video/mp4', 'video/mkv', 'video/avi', 'video/webm', 'video/quicktime',
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'application/zip', 'text/plain',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

app.use((req, res, next) => {
  req.upload = upload;
  req.io = io;
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    environment: config.nodeEnv,
  });
});

const routeModules = ['auth', 'tasks', 'videos', 'telegram', 'email', 'dashboard', 'rewards', 'agents'];
for (const name of routeModules) {
  try {
    const routePath = path.join(__dirname, 'routes', name);
    if (fs.existsSync(routePath + '.js') || fs.existsSync(path.join(routePath, 'index.js'))) {
      const router = require(routePath);
      app.use(`/api/${name}`, router);
      logger.info('ROUTES', `Registered /api/${name}`);
    } else {
      logger.warn('ROUTES', `Route file for "${name}" not found at ${routePath}, skipping`);
    }
  } catch (err) {
    logger.error('ROUTES', `Failed to load route "${name}": ${err.message}`);
  }
}

if (config.nodeEnv === 'production') {
  const clientDist = path.join(rootDir, 'client', 'dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(clientDist, 'index.html'));
      }
    });
    logger.info('APP', `Serving static files from ${clientDist}`);
  } else {
    logger.warn('APP', `Client dist not found at ${clientDist}, static serving disabled`);
  }
}

global.io = io;

io.on('connection', (socket) => {
  logger.info('SOCKET', `Client connected: ${socket.id}`);

  socket.on('join', (room) => {
    if (typeof room === 'string') {
      socket.join(room);
      logger.debug('SOCKET', `Socket ${socket.id} joined room: ${room}`);
    }
  });

  socket.on('leave', (room) => {
    if (typeof room === 'string') {
      socket.leave(room);
    }
  });

  socket.on('disconnect', (reason) => {
    logger.info('SOCKET', `Client disconnected: ${socket.id} (${reason})`);
  });
});

try {
  const scheduler = require('./modules/scheduler/cron');
  scheduler.start(io);
  logger.info('SCHEDULER', 'Cron jobs initialized');
} catch (err) {
  logger.warn('SCHEDULER', `Scheduler module not available: ${err.message}`);
}

try {
  const telegram = require('./modules/telegram/bot');
  telegram.init();
  logger.info('TELEGRAM', 'Telegram bot initialized');
} catch (err) {
  logger.warn('TELEGRAM', `Telegram bot not available: ${err.message}`);
}

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.error('MULTER', err.message);
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request entity too large' });
  }
  logger.error('APP', `Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    error: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
});

server.listen(config.port, () => {
  logger.info('APP', `Server running on port ${config.port} in ${config.nodeEnv} mode`);
  console.log(`\n  🚀 Server listening on http://localhost:${config.port}\n`);
});

function gracefulShutdown(signal) {
  logger.info('APP', `${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('APP', 'HTTP server closed');
    try {
      const { flush } = require('./database');
      flush();
    } catch (e) {
      logger.error('APP', `Error closing database: ${e.message}`);
    }
    io.close();
    logger.info('APP', 'Shutdown complete');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('APP', 'Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('uncaughtException', (err) => {
  if (err.code === 'EPIPE') return;
  logger.error('APP', `Uncaught exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error('APP', `Unhandled rejection: ${reason}`);
});
