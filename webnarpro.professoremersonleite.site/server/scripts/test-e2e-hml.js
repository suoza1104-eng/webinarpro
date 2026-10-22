// Teste de ponta a ponta do backend contra a HOMOLOGACAO (porta 3999 + mock-sino na 3998).
// Nunca rodar contra producao: cria leads, mensagens e altera a configuracao do webinar.
//   BASE=http://127.0.0.1:3999 MOCK=http://127.0.0.1:3998 SLUG=hml-live WEBINAR_ID=8 node scripts/test-e2e-hml.js
const crypto = require('crypto');

const BASE = process.env.BASE || 'http://127.0.0.1:3999';
const MOCK = process.env.MOCK || 'http://127.0.0.1:3998';
const SLUG = process.env.SLUG || 'hml-live';
const WEBINAR_ID = Number(process.env.WEBINAR_ID || 8);
const SECRET = process.env.SECRET || 'hml-secret';
const ADMIN = { email: process.env.ADMIN_EMAIL || 'hml@teste.local', senha: process.env.ADMIN_SENHA || 'Hml@2026!' };

let falhas = 0;
let ok = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function check(cond, nome, extra) {
  if (cond) { ok += 1; console.log(`  ✔ ${nome}`); } else { falhas += 1; console.log(`  ✘ ${nome}`, extra !== undefined ? JSON.stringify(extra).slice(0, 400) : ''); }
}
async function req(method, path, { token, body, base = BASE, headers = {} } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers },
    body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data, headers: res.headers };
}
const mockLog = async () => (await req('GET', '/_log', { base: MOCK })).data;
async function waitFor(fn, timeoutMs, stepMs = 1000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) { const v = await fn(); if (v) return v; await sleep(stepMs); }
  return null;
}
async function registerLead(n) {
  const r = await req('POST', `/api/public/webinars/${SLUG}/register`, {
    body: { nome: `Aluno Teste ${n}`, email: `aluno${n}.${Date.now()}@teste.local`, whatsapp: '(21) 98888-77' + String(n).padStart(2, '0') },
  });
  return r.data?.token;
}

async function hmlDb() {
  require('dotenv').config();
  if (!/_hml$/.test(process.env.DB_NAME || '')) throw new Error('Recusado: o teste so mexe em banco de homologacao (_hml)');
  const mysql = require('mysql2/promise');
  return mysql.createConnection({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
}

(async () => {
  await req('POST', '/_reset', { base: MOCK });
  // estado limpo: sem conversas/leads de rodadas anteriores e live "comecando agora"
  const db = await hmlDb();
  await db.query('DELETE FROM leads WHERE webinar_id = ?', [WEBINAR_ID]);
  await db.query('DELETE FROM webnar_sino_outbox WHERE webinar_id = ?', [WEBINAR_ID]);
  await db.query('DELETE FROM webinar_sino_config WHERE webinar_id = ?', [WEBINAR_ID]);
  await db.query("DELETE FROM system_settings WHERE chave = 'segurar_chat_global'");
  await db.query('UPDATE webinars SET data_inicio = DATE_SUB(NOW(), INTERVAL 5 MINUTE) WHERE id = ?', [WEBINAR_ID]);
  await db.end();

  console.log('\n[1] Admin, prompts e config do Sino');
  const login = await req('POST', '/api/auth/login', { body: ADMIN });
  const admin = login.data?.accessToken;
  check(!!admin, 'login do admin');

  const agentes = await req('GET', '/api/webinar-sino/agents', { token: admin });
  check(agentes.data?.agentes?.length === 2, 'lista de agentes vem do Sino', agentes.data);

  const modelo = await req('GET', '/api/webinar-sino/prompt-modelo', { token: admin });
  check(modelo.data?.conteudo?.includes('PASSE PARA UM HUMANO'), 'prompt modelo disponível');
  const tpl = await req('POST', '/api/webinar-sino/prompts', { token: admin, body: { nome: 'Modelo teste', objetivo: 'venda', conteudo: 'Prompt X' } });
  check(tpl.status === 201, 'cria prompt na biblioteca');
  const upd = await req('PUT', `/api/webinar-sino/prompts/${tpl.data.id}`, { token: admin, body: { nome: 'Modelo teste 2', objetivo: 'venda', conteudo: 'Prompt Y' } });
  check(upd.status === 200, 'edita prompt');
  const lista = await req('GET', '/api/webinar-sino/prompts', { token: admin });
  check(lista.data.some((p) => p.nome === 'Modelo teste 2'), 'lista prompts');
  await req('DELETE', `/api/webinar-sino/prompts/${tpl.data.id}`, { token: admin });

  const semPrompt = await req('PUT', `/api/webinar-sino/${WEBINAR_ID}/config`, { token: admin, body: {
    habilitado: true, atuacao: 'ao_vivo', objetivo: 'venda', prompt: '', followupHabilitado: true, followupDias: '1,3',
    followupPublico: 'chat', limiteRespostasIa: 20, segurarChat: false,
  } });
  check(semPrompt.status === 400, 'não liga a integração sem prompt');

  const cfg = await req('PUT', `/api/webinar-sino/${WEBINAR_ID}/config`, { token: admin, body: {
    habilitado: true, atuacao: 'ao_vivo', objetivo: 'venda', prompt: 'Você é a assistente da live de teste.',
    agenteId: 'larissa', agenteNome: 'Larissa (Consultiva)', setorVenda: 'vendas', setorSuporte: 'suporte',
    followupHabilitado: true, followupDias: '1,3', followupTemplate1: 'webinar_d1', followupTemplate2: 'webinar_d3',
    followupPublico: 'chat', limiteRespostasIa: 20, segurarChat: false,
  } });
  check(cfg.status === 200 && cfg.data.contexto?.enfileirado, 'salva config e enfileira contexto', cfg.data);

  const ctx = await req('GET', `/api/webinar-sino/${WEBINAR_ID}/context`, { token: admin });
  check(ctx.data?.oferta?.precoOferta && ctx.data?.ia?.prompt, 'contexto automático tem oferta e prompt', ctx.data);

  const ctxRecebido = await waitFor(async () => (await mockLog()).find((l) => l.method === 'PUT' && l.path === `/api/channels/webnar/webinars/${WEBINAR_ID}`), 10000);
  check(ctxRecebido?.signed === true, 'Sino recebeu o contexto assinado (HMAC)', ctxRecebido);

  const cfgDeNovo = await req('PUT', `/api/webinar-sino/${WEBINAR_ID}/config`, { token: admin, body: {
    habilitado: true, atuacao: 'ao_vivo', objetivo: 'venda', prompt: 'Você é a assistente da live de teste.',
    agenteId: 'larissa', agenteNome: 'Larissa (Consultiva)', setorVenda: 'vendas', setorSuporte: 'suporte',
    followupHabilitado: true, followupDias: '1,3', followupTemplate1: 'webinar_d1', followupTemplate2: 'webinar_d3',
    followupPublico: 'chat', limiteRespostasIa: 20, segurarChat: false,
  } });
  check(cfgDeNovo.data.contexto?.enfileirado === false, 'mesmo contexto não é reenviado', cfgDeNovo.data);

  console.log('\n[2] Aluno: mensagens agrupadas, resposta da IA e idempotência');
  const aluno = await registerLead(1);
  check(!!aluno, 'aluno cadastrado');
  const room = await req('GET', `/api/public/webinars/${SLUG}/room`, { token: aluno });
  check(room.data?.sino?.habilitado === true && room.data?.sino?.continuarNoWhatsapp === true, '/room informa integração e continuidade no WhatsApp', room.data?.sino);
  const vazio = await req('GET', `/api/public/webinars/${SLUG}/support-messages`, { token: aluno });
  check(vazio.data?.temConversa === false, 'sem conversa antes de escrever');

  await req('POST', `/api/public/webinars/${SLUG}/support-message`, { token: aluno, body: { mensagem: 'Quanto custa a comunidade?' } });
  await sleep(2000);
  await req('POST', `/api/public/webinars/${SLUG}/support-message`, { token: aluno, body: { mensagem: 'e tem certificado?' } });

  const inbound = await waitFor(async () => (await mockLog()).find((l) => l.path === '/api/channels/webnar/inbound'), 20000);
  check(!!inbound, 'Sino recebeu a mensagem');
  check(inbound?.body?.texto === 'Quanto custa a comunidade?\ne tem certificado?', 'as 2 mensagens foram agrupadas numa só', inbound?.body?.texto);
  check(inbound?.body?.aluno?.whatsapp === '5521988887701', 'WhatsApp normalizado com 55', inbound?.body?.aluno);
  check(inbound?.signed === true, 'inbound assinado');
  const inbounds = (await mockLog()).filter((l) => l.path === '/api/channels/webnar/inbound').length;
  check(inbounds === 1, 'uma única chamada ao Sino para as 2 mensagens', inbounds);

  const respostas = await waitFor(async () => {
    const r = await req('GET', `/api/public/webinars/${SLUG}/support-messages`, { token: aluno });
    return r.data?.mensagens?.some((m) => m.remetente === 'ia') ? r.data.mensagens : null;
  }, 10000);
  const ias = (respostas || []).filter((m) => m.remetente === 'ia');
  check(ias.length === 1, 'resposta da IA chegou uma vez só (reenvio do Sino não duplicou)', respostas);
  check(ias[0]?.autor_nome === 'Larissa', 'resposta mostra o nome do agente', ias[0]);

  console.log('\n[3] Inbox do admin');
  const inbox = await req('GET', `/api/atendimentos?filtro=ia&webinar_id=${WEBINAR_ID}`, { token: admin });
  const item = inbox.data?.itens?.[0];
  check(item?.modo === 'ia' && item?.total_mensagens_lead === 2 && item?.nao_lidas === 2, 'conversa aparece em "IA respondendo" com 2 não lidas', item);
  check(inbox.data?.contadores?.ia >= 1, 'contadores por filtro', inbox.data?.contadores);
  const cursor = inbox.data.agora;
  const atId = item.id;
  const ficha = await req('GET', `/api/atendimentos/${atId}/mensagens`, { token: admin });
  check(ficha.data?.ficha?.sinoHabilitado === true && Array.isArray(ficha.data?.mensagens), 'ficha do aluno + mensagens', ficha.data?.ficha);
  await req('POST', `/api/atendimentos/${atId}/lida`, { token: admin });
  const incremental = await req('GET', `/api/atendimentos?filtro=ia&webinar_id=${WEBINAR_ID}&desde=${encodeURIComponent(cursor)}`, { token: admin });
  check(incremental.data?.incremental && incremental.data.itens.some((i) => i.id === atId && i.nao_lidas === 0), 'atualização incremental traz só o que mudou', incremental.data?.itens?.map((i) => [i.id, i.nao_lidas]));
  const pend = await req('GET', '/api/atendimentos/pendentes-count', { token: admin });
  check(typeof pend.data?.pendentes === 'number', 'contador de pendentes pro menu', pend.data);
  const compat = await req('GET', `/api/atendimentos?status=aberto&webinar_id=${WEBINAR_ID}`, { token: admin });
  check(Array.isArray(compat.data), 'compatibilidade com a tela antiga');

  console.log('\n[4] Passagem para humano no Sino');
  await req('POST', `/api/public/webinars/${SLUG}/support-message`, { token: aluno, body: { mensagem: 'quero falar com um humano' } });
  const humano = await waitFor(async () => {
    const r = await req('GET', `/api/public/webinars/${SLUG}/support-messages`, { token: aluno });
    return r.data?.mensagens?.find((m) => m.autor_nome === 'Priscila') ? r.data.mensagens : null;
  }, 20000);
  check(!!humano && humano.some((m) => m.remetente === 'sistema' && /assumido por Priscila/.test(m.mensagem)), 'status "assumido por humano" registrado', humano);
  const atHum = await req('GET', `/api/atendimentos/${atId}/mensagens`, { token: admin });
  check(atHum.data?.atendimento?.modo === 'humano', 'conversa passou para modo humano', atHum.data?.atendimento?.modo);

  console.log('\n[5] Ações do atendente do WebnarPRO');
  await req('POST', '/_reset', { base: MOCK });
  await req('POST', `/api/atendimentos/${atId}/atender`, { token: admin });
  await req('POST', `/api/atendimentos/${atId}/mensagens`, { token: admin, body: { mensagem: 'Oi, aqui é da equipe!' } });
  const evResp = await waitFor(async () => (await mockLog()).find((l) => l.path === '/api/channels/webnar/events' && l.body?.evento === 'resposta_equipe_webnar'), 10000);
  check(!!evResp, 'resposta do atendente vai pro histórico do Sino', evResp?.body);
  const msgAtendido = await req('POST', `/api/public/webinars/${SLUG}/support-message`, { token: aluno, body: { mensagem: 'obrigado pela ajuda, mas como acesso?' } });
  check(msgAtendido.status === 201, 'aluno responde');
  await sleep(9000);
  check(!(await mockLog()).some((l) => l.path === '/api/channels/webnar/inbound'), 'com humano do WebnarPRO atendendo, mensagem NÃO vai pro Sino');
  const dev = await req('POST', `/api/atendimentos/${atId}/devolver-ia`, { token: admin });
  check(dev.status === 200, 'devolver para a IA');
  const evDev = await waitFor(async () => (await mockLog()).find((l) => l.body?.evento === 'status_atendimento' && l.body?.status === 'devolvido_ia'), 10000);
  check(!!evDev, 'Sino avisado da devolução para a IA');

  console.log('\n[6] Segurar chat (retido) e liberação');
  await req('POST', '/_reset', { base: MOCK });
  const aluno2 = await registerLead(2);
  await req('GET', `/api/public/webinars/${SLUG}/room`, { token: aluno2 });
  await req('POST', '/api/admin/system/segurar-chat', { token: admin, body: { ligado: true } });
  const retida = await req('POST', `/api/public/webinars/${SLUG}/support-message`, { token: aluno2, body: { mensagem: 'como faço para pagar no pix?' } });
  check(/WhatsApp/.test(retida.data?.autoResposta || ''), 'chat retido devolve resposta automática local', retida.data);
  const retida2 = await req('POST', `/api/public/webinars/${SLUG}/support-message`, { token: aluno2, body: { mensagem: 'alguém?' } });
  check(!retida2.data?.autoResposta, 'resposta automática só uma vez por aluno', retida2.data);
  await sleep(9000);
  check(!(await mockLog()).some((l) => l.path === '/api/channels/webnar/inbound'), 'retido: nada vai pro Sino');
  await req('POST', '/api/admin/system/segurar-chat', { token: admin, body: { ligado: false } });
  const liberada = await waitFor(async () => (await mockLog()).find((l) => l.path === '/api/channels/webnar/inbound'), 15000);
  check(liberada?.body?.texto?.includes('como faço para pagar no pix?'), 'ao soltar, mensagens retidas são enviadas', liberada?.body?.texto);

  console.log('\n[7] Segurança do canal');
  const semAssinatura = await req('POST', '/api/integracao/sino/reply', { body: { replyId: 'x', conversaId: `webnar-${atId}`, texto: 'invasor', autor: { tipo: 'ia' } } });
  check(semAssinatura.status === 401, 'reply sem assinatura é recusado');
  const raw = JSON.stringify({ replyId: 'y', conversaId: `webnar-${atId}`, texto: 'velho', autor: { tipo: 'ia' } });
  const tsVelho = Math.floor(Date.now() / 1000) - 3600;
  const sigVelha = 'sha256=' + crypto.createHmac('sha256', SECRET).update(`${tsVelho}.${raw}`).digest('hex');
  const velho = await req('POST', '/api/integracao/sino/reply', { body: raw, headers: { 'x-sino-timestamp': String(tsVelho), 'x-sino-signature': sigVelha } });
  check(velho.status === 401, 'assinatura com carimbo de 1h atrás é recusada (anti-replay)');

  console.log('\n[8] Disjuntor: Sino pedindo pra segurar (503)');
  await req('POST', '/_reset', { base: MOCK });
  await req('POST', '/_mode', { base: MOCK, body: { mode: 'segurar' } });
  const aluno3 = await registerLead(3);
  await req('POST', `/api/public/webinars/${SLUG}/support-message`, { token: aluno3, body: { mensagem: 'tem garantia?' } });
  const recusada = await waitFor(async () => (await mockLog()).find((l) => l.path === '/api/channels/webnar/inbound' && l.mode === 'segurar'), 15000);
  check(!!recusada, 'Sino respondeu 503 (segurar)');
  await req('POST', '/_mode', { base: MOCK, body: { mode: 'ok' } });
  await sleep(20000);
  const duranteDisjuntor = (await mockLog()).filter((l) => l.path === '/api/channels/webnar/inbound').length;
  check(duranteDisjuntor === 1, 'com o disjuntor aberto, não insiste (1 tentativa em 20s)', duranteDisjuntor);
  console.log('    aguardando o disjuntor fechar (2 min)...');
  const entregue = await waitFor(async () => (await mockLog()).find((l) => l.path === '/api/channels/webnar/inbound' && l.mode === 'ok'), 150000, 5000);
  check(entregue?.body?.texto === 'tem garantia?', 'depois do disjuntor, a mensagem é entregue', entregue?.body);

  console.log('\n[9] Alertas / sininho');
  const status = await req('GET', '/api/admin/system/status', { token: admin });
  check(Array.isArray(status.data?.metricas) && status.data.metricas.length >= 30, 'status com todas as métricas', status.data?.metricas?.length);
  check(['verde', 'amarelo', 'vermelho'].includes(status.data?.estado), 'estado geral', status.data?.estado);
  const alunosMetric = status.data?.metricas?.find((m) => m.metrica === 'alunos_ao_vivo');
  check(alunosMetric && alunosMetric.valor !== null, 'métrica de alunos ao vivo calculada', alunosMetric);
  const nodeMetric = status.data?.metricas?.find((m) => m.metrica === 'node_db_probe_ms');
  check(nodeMetric && typeof nodeMetric.valor === 'number', 'métricas do Node calculadas', nodeMetric);
  const rules = await req('GET', '/api/admin/system/rules', { token: admin });
  check(rules.data?.length >= 30, 'regras listadas');
  const putRules = await req('PUT', '/api/admin/system/rules', { token: admin, body: [{ metrica: 'alunos_ao_vivo', amarelo: 600, vermelho: 900, habilitado: true }] });
  check(putRules.status === 200, 'altera limites');
  const rules2 = await req('GET', '/api/admin/system/rules', { token: admin });
  // os limites salvos entram na proxima avaliacao (1 min) - aqui conferimos so que foram gravados sem erro
  check(rules2.status === 200, 'regras relidas');
  await req('DELETE', '/api/admin/system/rules', { token: admin });
  const semCanal = await req('POST', '/api/admin/system/test-alert', { token: admin });
  check(semCanal.status === 400, 'teste de alerta sem canal avisa que falta canal');
  await req('PUT', '/api/admin/system/channels', { token: admin, body: [{ tipo: 'webhook', destino: `${MOCK}/webhooks/webnarpro`, nivel_minimo: 'amarelo', habilitado: true }] });
  const teste = await req('POST', '/api/admin/system/test-alert', { token: admin });
  check(teste.data?.enviados === 1, 'alerta de teste enviado ao canal', teste.data);
  const alerta = await waitFor(async () => (await mockLog()).find((l) => l.path === '/webhooks/webnarpro' && l.body?.evento === 'alerta_sistema'), 5000);
  check(alerta?.body?.teste === true && /\[TESTE\]/.test(alerta.body.texto), 'webhook recebeu o alerta', alerta?.body);
  await req('PUT', '/api/admin/system/channels', { token: admin, body: [] });
  const hist = await req('GET', '/api/admin/system/metrics?minutos=60', { token: admin });
  check(Array.isArray(hist.data) && hist.data.length >= 1, 'série histórica pros gráficos', hist.data?.length);

  console.log('\n[10] Cache de arquivos estáticos');
  const js = await req('GET', '/js/sala.js?v=26');
  check(/immutable/.test(js.headers.get('cache-control') || ''), 'js versionado com cache longo', js.headers.get('cache-control'));
  const sala = await fetch(`${BASE}/${SLUG}`);
  check(/no-cache/.test(sala.headers.get('cache-control') || ''), 'HTML da sala sem cache', sala.headers.get('cache-control'));

  console.log('\n[11] Fim da live -> resumo pro Sino');
  await req('POST', '/_reset', { base: MOCK });
  // o app verifica a cada minuto se alguma live terminou - aqui a gente "termina" a live de teste
  // movendo o inicio pro passado (so no banco de homologacao, lido do .env do servidor de hml)
  const conn = await hmlDb();
  await conn.query(
    `UPDATE webinars w LEFT JOIN videos v ON v.id = w.video_id
     SET w.data_inicio = DATE_SUB(NOW(), INTERVAL (COALESCE(v.duracao_segundos, 7200) + 1000) SECOND) WHERE w.id = ?`,
    [WEBINAR_ID],
  );
  await conn.end();
  const fim = await waitFor(async () => (await mockLog()).find((l) => l.body?.evento === 'fim_da_live'), 130000, 5000);
  check(!!fim, 'Sino recebeu fim_da_live');
  const a1 = fim?.body?.alunos?.find((a) => a.nome === 'Aluno Teste 1');
  check(a1 && a1.interagiuNoChat && a1.perguntas.includes('Quanto custa a comunidade?') && a1.whatsapp === '5521988887701', 'resumo traz perguntas, respostas e WhatsApp', a1);
  check(fim?.body?.alunos?.length === 3, 'só quem conversou no chat (3 alunos)', fim?.body?.alunos?.length);

  console.log(`\nResultado: ${ok} ok, ${falhas} falha(s)`);
  process.exit(falhas ? 1 : 0);
})().catch((err) => { console.error('ERRO NO TESTE:', err); process.exit(2); });
