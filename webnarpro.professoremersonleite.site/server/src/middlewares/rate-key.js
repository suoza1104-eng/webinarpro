// Chave dos rate limits: o token de quem chama (aluno ou admin) quando houver, senao o IP.
// Operadora de celular coloca muitos alunos atras do mesmo IP (CGNAT) - limitando por IP,
// alunos diferentes dividiam a mesma cota e levavam 429 na live (visto em 21/10/2026).
const crypto = require('crypto');

function leadRateKey(req) {
  const header = req.headers.authorization || '';
  const token = (header.startsWith('Bearer ') ? header.slice(7) : null) || req.body?.token || null;
  if (token) return 't:' + crypto.createHash('sha1').update(token).digest('base64');
  return 'ip:' + req.ip;
}

module.exports = { leadRateKey };
