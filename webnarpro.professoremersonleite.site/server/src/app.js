const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');
const path = require('path');

const logger = require('./logger');
const pool = require('./db');
const authRouter = require('./routes/auth');
const webinarsRouter = require('./routes/webinars');
const videosRouter = require('./routes/videos');
const publicRouter = require('./routes/public');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'script-src': ["'self'", 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net'],
      'connect-src': ["'self'", 'https://video.bunnycdn.com', 'https://*.b-cdn.net'],
      'media-src': ["'self'", 'https://*.b-cdn.net', 'blob:'],
      'img-src': ["'self'", 'data:', 'https://*.b-cdn.net'],
    },
  },
}));
app.use(cors({
  origin: (process.env.CORS_ORIGIN || '').split(',').filter(Boolean),
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(pinoHttp({ logger }));

const globalLimiter = rateLimit({ windowMs: 60 * 1000, limit: 100 });
app.use(globalLimiter);

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'up' });
  } catch (err) {
    req.log.error(err, 'health check failed');
    res.status(500).json({ status: 'error', db: 'down' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/webinars', webinarsRouter);
app.use('/api/videos', videosRouter);
app.use('/api/public', publicRouter);

app.use(express.static(path.join(__dirname, '..', '..', 'public')));

app.get(['/:slug', '/:slug/replay'], (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'sala.html'));
});

app.use((err, req, res, next) => {
  req.log?.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno' });
});

module.exports = app;
