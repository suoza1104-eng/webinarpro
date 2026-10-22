// Teste de carga do Node + MySQL (Fase 4 do PLANO_OTIMIZACAO_ESCALA.md) - SO HOMOLOGACAO.
// Simula N alunos com o padrao real de requisicoes da sala, direto na porta do Node (sem Apache):
//   antigo: suporte a cada 4s pra todo mundo + presenca a cada 30s
//   novo:   presenca a cada 30s; so ~10% (quem conversou) consultam o suporte a cada 20s
//           e mandam 1 mensagem por minuto em media
// Uso: ALUNOS=1000 PADRAO=novo SEGUNDOS=60 node scripts/loadtest-hml.js
require('dotenv').config();
const http = require('http');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const ALUNOS = Number(process.env.ALUNOS || 500);
const PADRAO = process.env.PADRAO || 'novo';
const SEGUNDOS = Number(process.env.SEGUNDOS || 60);
const PORT = Number(process.env.PORT || 3999);
const SLUG = process.env.SLUG || 'hml-live';
const WEBINAR_ID = Number(process.env.WEBINAR_ID || 8);

if (!/_hml$/.test(process.env.DB_NAME || '')) { console.error('Recusado: so roda contra homologacao'); process.exit(1); }

const agent = new http.Agent({ keepAlive: true, maxSockets: 512 });
const lat = [];
let erros = 0, total = 0, status429 = 0;

function call(method, path, token, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const start = process.hrtime.bigint();
    const req = http.request({ host: '127.0.0.1', port: PORT, method, path, agent,
      headers: { Authorization: 'Bearer ' + token, ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}) } }, (res) => {
      res.resume();
      res.on('end', () => {
        total += 1;
        lat.push(Number(process.hrtime.bigint() - start) / 1e6);
        if (res.statusCode === 429) status429 += 1;
        else if (res.statusCode >= 400) erros += 1;
        resolve();
      });
    });
    req.on('error', () => { erros += 1; total += 1; resolve(); });
    req.setTimeout(10000, () => req.destroy());
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  // cria os leads de teste direto no banco de homologacao e gera os tokens
  const db = await mysql.createConnection({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  const run = Date.now();
  const values = Array.from({ length: ALUNOS }, (_, i) => [WEBINAR_ID, `Carga ${i}`, `carga${i}.${run}@teste.local`, '21999990000']);
  for (let i = 0; i < values.length; i += 500) {
    await db.query('INSERT INTO leads (webinar_id, nome, email, whatsapp) VALUES ?', [values.slice(i, i + 500)]);
  }
  const [leads] = await db.query('SELECT id FROM leads WHERE email LIKE ? ORDER BY id', [`%.${run}@teste.local`]);
  const tokens = leads.map((l) => jwt.sign({ leadId: l.id, webinarId: WEBINAR_ID }, process.env.JWT_SECRET, { expiresIn: '1h' }));

  const base = `/api/public/webinars/${SLUG}`;
  const fim = Date.now() + SEGUNDOS * 1000;
  const timers = [];
  tokens.forEach((t, i) => {
    const conversa = PADRAO === 'antigo' || i % 10 === 0;
    const supportMs = PADRAO === 'antigo' ? 4000 : 20000;
    const offset = Math.random() * 4000;
    timers.push(setTimeout(() => {
      call('POST', base + '/presence', t, { segundos: 600 });
      timers.push(setInterval(() => call('POST', base + '/presence', t, { segundos: 600 }), 30000));
      if (conversa) {
        timers.push(setInterval(() => call('GET', base + '/support-messages', t), supportMs));
        if (PADRAO === 'novo') timers.push(setInterval(() => call('POST', base + '/support-message', t, { mensagem: 'pergunta de carga' }), 60000 + Math.random() * 30000));
      }
    }, offset));
  });

  const probes = [];
  const probe = setInterval(async () => {
    const s = process.hrtime.bigint();
    await new Promise((r) => http.get({ host: '127.0.0.1', port: PORT, path: '/api/health', agent: false }, (res) => { res.resume(); res.on('end', r); }).on('error', r));
    probes.push(Number(process.hrtime.bigint() - s) / 1e6);
  }, 1000);

  await new Promise((r) => setTimeout(r, SEGUNDOS * 1000));
  timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
  clearInterval(probe);
  await new Promise((r) => setTimeout(r, 2000));

  const sorted = [...lat].sort((a, b) => a - b);
  const p = (q) => Math.round(sorted[Math.floor(q * (sorted.length - 1))] || 0);
  const ps = [...probes].sort((a, b) => a - b);
  console.log(JSON.stringify({
    alunos: ALUNOS, padrao: PADRAO, segundos: SEGUNDOS,
    requisicoes: total, reqPorSeg: Math.round(total / SEGUNDOS), erros, status429,
    latenciaMs: { p50: p(0.5), p95: p(0.95), p99: p(0.99), max: Math.round(sorted.at(-1) || 0) },
    healthProbeMs: { p50: Math.round(ps[Math.floor(ps.length / 2)] || 0), max: Math.round(ps.at(-1) || 0) },
  }));

  await db.query('DELETE FROM leads WHERE email LIKE ?', [`%.${run}@teste.local`]);
  await db.end();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(2); });
