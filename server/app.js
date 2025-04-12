import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import errorHandler from './utils/errorHandler.js';
import todoRoutes from './routes/todos.js';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { verifyToken, refreshToken, logout, verify } from './controllers/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(compression());
app.use(mongoSanitize());

// Security middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://todo-app-dnd.up.railway.app']
    : ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  trustProxy: process.env.NODE_ENV === 'production', // Trust Railway's proxy
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.'
    });
  }
});
app.use('/api/', limiter);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// Add a basic health check route at the root
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Add verify endpoint
app.get('/api/auth/verify', verifyToken, verify);

// Add JWT refresh route before other routes
app.post('/api/auth/refresh', refreshToken);

// Add logout route
app.post('/api/auth/logout', logout);

// API Routes with JWT verification
app.use('/api/todos', verifyToken, todoRoutes);
app.use('/api/categories', verifyToken, categoryRoutes);

// Auth routes (no verification needed)
app.use('/api/auth', authRoutes);

// Static file serving - Place this after API routes
if (process.env.NODE_ENV === 'production') {
  const staticPath = join(__dirname, '../client/dist');
  app.use(express.static(staticPath));
  
  // Simple catch-all route
  app.get('/*', (req, res) => {
    res.sendFile(join(staticPath, 'index.html'));
  });
}

// Error handling
app.use(errorHandler);

export default app;
