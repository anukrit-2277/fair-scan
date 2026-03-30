const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { env } = require('./config');
const { errorHandler, AppError } = require('./middleware');
const routes = require('./routes');

const app = express();

// --------------- Security & parsing ---------------
app.use(helmet());
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --------------- Logging ---------------
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --------------- Rate limiting ---------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, error: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// --------------- Routes ---------------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1', routes);

// --------------- 404 fallback ---------------
app.all('/{*splat}', (req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// --------------- Global error handler ---------------
app.use(errorHandler);

module.exports = app;
