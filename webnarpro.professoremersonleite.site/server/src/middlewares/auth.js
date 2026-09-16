const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token ausente' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.accountId || !payload.userId) throw new Error('Token não é de administrador');
    req.accountId = payload.accountId;
    req.userId = payload.userId;
    req.userTipo = payload.tipo;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

function requireLeadAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token ausente' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.leadId || !payload.webinarId) throw new Error('Token não é de lead');
    req.leadId = payload.leadId;
    req.webinarId = payload.webinarId;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = { requireAuth, requireLeadAuth };
