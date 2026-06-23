import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import contentRoutes from './modules/content/content.routes';
import userRoutes from './modules/user/user.routes';
import historyRoutes from './modules/watchHistory/history.routes';
import watchlistRoutes from './modules/watchlist/watchlist.routes';
import subscriptionRoutes from './modules/subscription/subscription.routes';
import searchRoutes from './modules/search/search.routes';
import settingsRoutes from './modules/settings/settings.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import adminRoutes from './modules/admin/admin.routes';
import adminAuthRoutes from './modules/admin/admin.auth.routes';

const app = express();

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      (origin.startsWith('https://') && origin.includes('vercel.app'))
    ) {
      callback(null, origin || true);
    } else {
      callback(null, allowedOrigins[0]);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Profile-ID'],
}));

// Global rate limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Body parsing - raw for Stripe webhooks
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(morgan('combined'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'v19plus-api', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);

// Global error handler
app.use(errorHandler);

export default app;
