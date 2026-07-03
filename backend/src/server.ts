import 'dotenv/config';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import { logger } from './utils/logger';
import { verifyAccessToken } from './utils/jwt';
import { getGoogleConfigStatus } from './config/google';
import './modules/video-process/video-process.worker'; // Initialize FFmpeg worker

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    const payload = verifyAccessToken(token as string);
    (socket as any).userId = payload.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = (socket as any).userId;
  socket.join(`user:${userId}`);
  logger.info(`Socket connected: user ${userId}`);

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: user ${userId}`);
  });
});

// Make io accessible to routes
app.set('io', io);

server.listen(PORT, () => {
  logger.info(`🚀 V19+ Backend running on port ${PORT}`);
  logger.info(`📡 Socket.io ready`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  const google = getGoogleConfigStatus();
  if (!google.configured) {
    logger.warn('⚠️  Google OAuth not configured — set GOOGLE_CLIENT_ID in backend/.env');
  } else if (!google.hasClientSecret) {
    logger.warn('⚠️  GOOGLE_CLIENT_SECRET missing — redirect sign-in will not work until added');
  } else {
    logger.info(`🔐 Google OAuth ready (redirect: ${google.redirectUri})`);
  }
});

export { io };
export default server;
