const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const pool = require('../db');

const router = express.Router();

const loginLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10 });

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

router.post('/login', loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos' });
  const { email, senha } = parsed.data;

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

  const ok = await bcrypt.compare(senha, user.senha_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

  const accessToken = jwt.sign(
    { accountId: user.account_id, userId: user.id, tipo: user.tipo },
    process.env.JWT_SECRET,
    { expiresIn: '1h' },
  );
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' },
  );

  await pool.query('UPDATE users SET ultimo_login_em = NOW() WHERE id = ?', [user.id]);

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.json({
    accessToken,
    user: { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo },
  });
});

module.exports = router;
