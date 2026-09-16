const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const pool = require('../db');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

const loginLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10 });

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
  lembrar: z.boolean().optional(),
});

function signAccessToken(user) {
  return jwt.sign(
    { accountId: user.account_id, userId: user.id, tipo: user.tipo },
    process.env.JWT_SECRET,
    { expiresIn: '1h' },
  );
}

function setRefreshCookie(res, userId, lembrar) {
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  };
  if (lembrar) cookieOpts.maxAge = 30 * 24 * 60 * 60 * 1000;
  res.cookie('refresh_token', refreshToken, cookieOpts);
}

router.post('/login', loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos' });
  const { email, senha, lembrar } = parsed.data;

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

  const ok = await bcrypt.compare(senha, user.senha_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

  await pool.query('UPDATE users SET ultimo_login_em = NOW() WHERE id = ?', [user.id]);

  setRefreshCookie(res, user.id, !!lembrar);
  res.json({
    accessToken: signAccessToken(user),
    user: { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo },
  });
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ error: 'Sem sessão para renovar' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ error: 'Sessão expirada' });
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [payload.userId]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });

  res.json({
    accessToken: signAccessToken(user),
    user: { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo },
  });
});

router.post('/logout', (req, res) => {
  res.clearCookie('refresh_token', { path: '/api/auth' });
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, nome, email, tipo FROM users WHERE id = ? LIMIT 1',
    [req.userId],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(rows[0]);
});

const passwordSchema = z.object({
  senhaAtual: z.string().min(1),
  novaSenha: z.string().min(8, 'A nova senha precisa ter pelo menos 8 caracteres'),
});

router.put('/password', requireAuth, async (req, res) => {
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || 'Dados inválidos';
    return res.status(400).json({ error: msg });
  }
  const { senhaAtual, novaSenha } = parsed.data;

  const [rows] = await pool.query('SELECT senha_hash FROM users WHERE id = ? LIMIT 1', [req.userId]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

  const ok = await bcrypt.compare(senhaAtual, user.senha_hash);
  if (!ok) return res.status(401).json({ error: 'Senha atual incorreta' });

  const hash = await bcrypt.hash(novaSenha, 10);
  await pool.query('UPDATE users SET senha_hash = ? WHERE id = ?', [hash, req.userId]);
  res.json({ ok: true });
});

module.exports = router;
