require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const compression  = require('compression');
const path         = require('path');

const { testConnection } = require('./src/config/database');
const logger             = require('./src/utils/logger');
const { errorHandler }   = require('./src/utils/response');
const rateLimiter        = require('./src/middleware/rateLimit.middleware');

// Routes
const authRoutes         = require('./src/routes/auth.routes');
const rmRoutes           = require('./src/routes/rm.routes');
const agentRoutes        = require('./src/routes/agent.routes');
const policyRoutes       = require('./src/routes/policy.routes');
const commissionRoutes   = require('./src/routes/commission.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const dashboardRoutes    = require('./src/routes/dashboard.routes');
const appRoutes          = require('./src/routes/app/index');

const app  = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin:      process.env.CLIENT_URL || '*',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting on all API routes
app.use('/api', rateLimiter);

// API routes
app.use('/api/auth',          authRoutes);
app.use('/api/rms',           rmRoutes);
app.use('/api/agents',        agentRoutes);
app.use('/api/policies',      policyRoutes);
app.use('/api/commissions',   commissionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard',     dashboardRoutes);

// Agent Mobile App routes
app.use('/api/app',           appRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler
app.use(errorHandler);

// Start server
async function start() {
  await testConnection();
  app.listen(PORT, () => logger.info(`OOK Travel API running on port ${PORT}`));
}

start().catch(err => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
