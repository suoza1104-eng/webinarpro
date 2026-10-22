// Sino simulado - SO PARA HOMOLOGACAO/TESTES. Implementa o contrato do canal "webnar"
// (secao 6.5/6.8 do PLANO_OTIMIZACAO_ESCALA.md) pra testar o WebnarPRO de ponta a ponta
// sem tocar no Sino real. Nunca rodar apontado pra producao.
//
//   MOCK_PORT=3998 WEBNAR_URL=http://127.0.0.1:3999 SECRET=... node scripts/mock-sino.js
//
// Comportamento: responde cada mensagem com uma "IA" depois de 1s; se o texto tiver "humano",
// manda o status assumido_humano e responde como humano. POST /_mode {mode} troca entre
// ok | lento (12s) | segurar (503). GET /_log devolve tudo o que recebeu.
const http = require('http');
const crypto = require('crypto');

const PORT = Number(process.env.MOCK_PORT || 3998);
const WEBNAR_URL = process.env.WEBNAR_URL || 'http://127.0.0.1:3999';
const SECRET = process.env.SECRET || 'hml-secret';
let mode = 'ok';
const log = [];

const sign = (ts, raw) => 'sha256=' + crypto.createHmac('sha256', SECRET).update(`${ts}.${raw}`).digest('hex');

function verify(req, raw) {
  const ts = req.headers['x-webnarpro-timestamp'];
  const sig = req.headers['x-webnarpro-signature'];
  return !!ts && sig === sign(ts, raw);
}

async function callback(path, body) {
  const raw = JSON.stringify(body);
  const ts = Math.floor(Date.now() / 1000);
  const res = await fetch(WEBNAR_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-sino-timestamp': String(ts), 'x-sino-signature': sign(ts, raw) },
    body: raw,
  });
  log.push({ dir: 'callback', path, status: res.status, body });
}

const server = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => { raw += c; });
  req.on('end', async () => {
    const send = (status, obj) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
    const url = req.url.split('?')[0];
    if (url === '/_log') return send(200, log);
    if (url === '/_reset') { log.length = 0; mode = 'ok'; return send(200, { ok: true }); }
    if (url === '/_mode') { mode = JSON.parse(raw || '{}').mode || 'ok'; return send(200, { mode }); }

    const body = raw ? JSON.parse(raw) : null;
    if (url === '/webhooks/webnarpro') { log.push({ dir: 'in', path: url, body }); return send(200, { ok: true }); }
    if (!url.startsWith('/api/channels/webnar')) return send(404, { error: 'not found' });
    const signed = verify(req, req.method === 'GET' ? '' : raw);
    log.push({ dir: 'in', method: req.method, path: url, signed, mode, body });
    if (!signed) return send(401, { error: 'assinatura invalida' });
    if (mode === 'segurar') return send(503, { error: 'raia webnar cheia' });
    if (mode === 'lento') await new Promise((r) => setTimeout(r, 12000));

    const sub = url.replace('/api/channels/webnar', '');
    if (req.method === 'GET' && sub === '/agents') {
      return send(200, {
        agentes: [{ id: 'larissa', nome: 'Larissa (Consultiva)' }, { id: 'webinar-bot', nome: 'Agente Webinars' }],
        setores: [{ id: 'vendas', nome: 'Vendas' }, { id: 'suporte', nome: 'Atendimento ao aluno' }],
      });
    }
    if (req.method === 'GET' && sub === '/health') return send(200, { ok: true, filaWebnar: 0 });
    if (req.method === 'PUT' && sub.startsWith('/webinars/')) return send(200, { ok: true });
    if (req.method === 'POST' && sub === '/events') return send(200, { ok: true });
    if (req.method === 'POST' && sub === '/inbound') {
      send(202, { ok: true });
      setTimeout(async () => {
        try {
          if (/humano/i.test(body.texto)) {
            await callback('/api/integracao/sino/status', { conversaId: body.conversaId, status: 'assumido_humano', por: 'Priscila', setor: 'Atendimento ao aluno' });
            await callback('/api/integracao/sino/reply', { replyId: `h-${body.messageId}`, conversaId: body.conversaId, texto: 'Oi! Aqui é a Priscila, já te ajudo.', autor: { tipo: 'humano', nome: 'Priscila' } });
          } else {
            const r = { replyId: `ia-${body.messageId}`, conversaId: body.conversaId, texto: `Resposta da IA para: ${body.texto}`, autor: { tipo: 'ia', nome: 'Larissa' } };
            await callback('/api/integracao/sino/reply', r);
            await callback('/api/integracao/sino/reply', r); // reenvio proposital: tem que ser idempotente
          }
        } catch (err) {
          log.push({ dir: 'callback-erro', erro: err.message });
        }
      }, 1000);
      return undefined;
    }
    return send(404, { error: 'rota desconhecida' });
  });
});

server.listen(PORT, '127.0.0.1', () => console.log(`mock-sino na porta ${PORT} -> ${WEBNAR_URL}`));
