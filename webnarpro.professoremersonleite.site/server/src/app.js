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
const abTestsRouter = require('./routes/ab-tests');
const atendimentosRouter = require('./routes/atendimentos');
const uploadsRouter = require('./routes/uploads');
const fs = require('fs');

const app = express();

fs.mkdirSync(path.join(__dirname, '..', 'uploads'), { recursive: true });

app.set('trust proxy', 1);

app.use(helmet({
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'script-src': ["'self'", 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net'],
      'script-src-attr': ["'unsafe-inline'"],
      'connect-src': ["'self'", 'https://video.bunnycdn.com', 'https://*.b-cdn.net'],
      'media-src': ["'self'", 'https://*.b-cdn.net', 'blob:'],
      'worker-src': ["'self'", 'blob:'],
      'img-src': ["'self'", 'data:', 'https://*.b-cdn.net', 'https:'],
      'frame-src': ["'self'", 'https://e4pay.professoremersonleite.site'],
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
app.use('/api/ab-tests', abTestsRouter);
app.use('/api/atendimentos', atendimentosRouter);
app.use('/api/uploads', uploadsRouter);

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.static(path.join(__dirname, '..', '..', 'public')));

function pickVariant(variants) {
  const totalWeight = variants.reduce((sum, v) => sum + v.peso, 0) || 1;
  let r = Math.random() * totalWeight;
  for (const v of variants) {
    if (r < v.peso) return v;
    r -= v.peso;
  }
  return variants[variants.length - 1];
}

app.get(['/:slug', '/:slug/replay'], async (req, res) => {
  const suffix = req.path.endsWith('/replay') ? '/replay' : '';
  const [tests] = await pool.query(
    "SELECT id FROM ab_tests WHERE slug = ? AND status = 'ativo' LIMIT 1",
    [req.params.slug],
  );

  if (tests.length > 0) {
    const testId = tests[0].id;
    const [variants] = await pool.query(
      `SELECT v.id, v.peso, w.slug AS webinar_slug
       FROM ab_test_variants v JOIN webinars w ON w.id = v.webinar_id
       WHERE v.ab_test_id = ?`,
      [testId],
    );
    if (variants.length > 0) {
      const cookieName = `ab_${testId}`;
      const savedVariantId = req.cookies?.[cookieName] ? Number(req.cookies[cookieName]) : null;
      let variant = variants.find((v) => v.id === savedVariantId);

      if (!variant) {
        variant = pickVariant(variants);
        res.cookie(cookieName, String(variant.id), {
          maxAge: 90 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
        const [assignResult] = await pool.query(
          'INSERT INTO ab_test_assignments (variant_id) VALUES (?)',
          [variant.id],
        );
        return res.redirect(302, `/${variant.webinar_slug}${suffix}?ab_assignment=${assignResult.insertId}`);
      }
      return res.redirect(302, `/${variant.webinar_slug}${suffix}`);
    }
  }

  res.sendFile(path.join(__dirname, '..', '..', 'public', 'sala.html'));
});

app.use((err, req, res, next) => {
  req.log?.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno' });
});

module.exports = app;
