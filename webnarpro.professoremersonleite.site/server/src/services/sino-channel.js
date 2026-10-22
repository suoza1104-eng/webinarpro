// Canal "webnar" do Sino (Fase 6 do PLANO_OTIMIZACAO_ESCALA.md): o WebnarPRO funciona como
// um "numero" conectado no Sino que so recebe o publico dos webinars. As mensagens do chat vao
// pro Sino, a IA/equipe de la responde e a resposta volta por /api/integracao/sino/reply.
//
// Regras que este modulo garante:
//  - Nunca bloqueia o aluno: tudo passa por uma fila (webnar_sino_outbox) processada em
//    segundo plano. A sala nunca espera o Sino.
//  - So rede interna (SINO_CHANNEL_URL, padrao http://127.0.0.1:3710) - nao passa pelo Apache.
//  - O chat e secundario: no modo "retido" (sistema no vermelho, ou "segurar chat" ligado)
//    nada vai pro Sino em tempo real; no "economico" (amarelo) conversa de plateia nao e enviada.
//  - Disjuntor: Sino lento/fora/pedindo pra segurar -> para de enviar por 2 min e tenta de novo.
//  - Mensagens seguidas do mesmo aluno sao agrupadas numa tarefa so (6s, ou 15s no economico).
const crypto = require('crypto');
const pool = require('../db');
const { toSinoPhone, toBrtIso } = require('./sino');
const atendimentoSvc = require('./atendimento');

const BASE_URL = (process.env.SINO_CHANNEL_URL || 'http://127.0.0.1:3710').replace(/\/$/, '');
const CHANNEL_PATH = '/api/channels/webnar';
const TIMEOUT_MS = 10000;
const AGRUPAR_MS = { normal: 6000, economico: 15000 };
const DISJUNTOR_FALHAS = 5;
const DISJUNTOR_PAUSA_MS = 2 * 60 * 1000;
const MENSAGEM_VALIDA_MIN = 30; // depois disso nao adianta responder no chat - vai pro pos-live
const BACKOFF_SEGUNDOS = [10, 30, 60, 120, 300, 600];
const WORKER_MS = 3000;
const FIM_LIVE_CHECK_MS = 60000;
const LOTE_FIM_LIVE = 100;

function secret() {
  return process.env.SINO_CHANNEL_SECRET || process.env.SINO_WEBHOOK_SECRET || '';
}

function sign(timestamp, rawBody) {
  return 'sha256=' + crypto.createHmac('sha256', secret()).update(`${timestamp}.${rawBody}`).digest('hex');
}

// Valida chamadas do Sino pro WebnarPRO: assinatura HMAC do corpo + carimbo de tempo (5 min)
function verifySignature(req) {
  const ts = Number(req.headers['x-sino-timestamp']);
  const sig = String(req.headers['x-sino-signature'] || '');
  if (!secret() || !ts || !sig || !req.rawBody) return false;
  if (Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const expected = sign(ts, req.rawBody.toString('utf8'));
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---------- estado do disjuntor e estatisticas ----------
const breaker = { falhasSeguidas: 0, abertoAte: 0, motivo: null };
const tempos = [];

function breakerOpen() {
  return Date.now() < breaker.abertoAte;
}
function openBreaker(motivo) {
  breaker.abertoAte = Date.now() + DISJUNTOR_PAUSA_MS;
  breaker.motivo = motivo;
  breaker.falhasSeguidas = 0;
  console.error(`[sino-canal] disjuntor aberto por 2 min: ${motivo}`);
}

async function getStats() {
  const [[row]] = await pool.query(
    "SELECT COUNT(*) AS n FROM webnar_sino_outbox WHERE tipo = 'mensagem' AND status IN ('pendente', 'retido')",
  );
  const media = tempos.length ? Math.round(tempos.reduce((s, x) => s + x, 0) / tempos.length) : null;
  return { filaChat: Number(row.n), tempoRespostaMs: media, disjuntorAberto: breakerOpen(), motivoDisjuntor: breakerOpen() ? breaker.motivo : null };
}

async function callSino(method, path, body) {
  const raw = body == null ? '' : JSON.stringify(body);
  const ts = Math.floor(Date.now() / 1000);
  const start = Date.now();
  const res = await fetch(BASE_URL + CHANNEL_PATH + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-webnarpro-timestamp': String(ts),
      'x-webnarpro-signature': sign(ts, raw),
    },
    body: method === 'GET' ? undefined : raw,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  tempos.push(Date.now() - start);
  if (tempos.length > 20) tempos.shift();
  let data = null;
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}

// ---------- configuracao por webinar ----------
const cfgCache = new Map();
async function getConfig(webinarId, { fresh = false } = {}) {
  const hit = cfgCache.get(webinarId);
  if (!fresh && hit && Date.now() - hit.t < 30000) return hit.cfg;
  const [rows] = await pool.query('SELECT * FROM webinar_sino_config WHERE webinar_id = ? LIMIT 1', [webinarId]);
  const cfg = rows[0] || null;
  cfgCache.set(webinarId, { t: Date.now(), cfg });
  return cfg;
}
function invalidateConfig(webinarId) {
  cfgCache.delete(webinarId);
}

function chatMode() {
  return require('./alerts').getChatMode();
}

// Conversa de plateia ("top", "boa noite", emoji...) - nao precisa de IA pra responder
const PALAVRAS_RUIDO = new Set([
  'top', 'show', 'oi', 'ola', 'opa', 'eae', 'eai', 'salve', 'boa', 'noite', 'tarde', 'dia', 'bom', 'boanoite', 'boatarde', 'bomdia',
  'amem', 'amen', 'kkk', 'kkkk', 'kkkkk', 'rs', 'rsrs', 'haha', 'obrigado', 'obrigada', 'valeu', 'vlw', 'legal', 'massa',
  'otimo', 'otima', 'excelente', 'parabens', 'sim', 'ok', 'blz', 'beleza', 'presente', 'aqui', 'cheguei', 'to', 'estou',
  'professor', 'prof', 'emerson', 'muito', 'bem', 'demais', 'perfeito', 'show de bola', 'deus', 'abencoe', 'gratidao', 'tmj',
  'firmeza', 'top demais', 'sensacional', 'incrivel', 'boooa', 'bora', 'vamos', 'vamo', 'pessoal', 'galera', 'a', 'e', 'de', 'do', 'da',
]);
const PALAVRAS_DUVIDA = /\b(como|quanto|qual|quais|quando|onde|porque|por que|pode|posso|tem|funciona|preco|valor|pix|boleto|cartao|parcel|link|acesso|comprar|compra|pagar|pagamento|nao consigo|erro|ajuda|duvida|certificado|garantia|bonus|desconto|cupom)\b/;

function isNoise(texto) {
  const norm = String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (norm.includes('?')) return false;
  const limpo = norm.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!limpo) return true; // so emoji/pontuacao
  if (PALAVRAS_DUVIDA.test(limpo)) return false;
  const palavras = limpo.split(' ');
  if (palavras.length > 6) return false;
  return palavras.every((p) => PALAVRAS_RUIDO.has(p) || p.length <= 2 || /^k+$/.test(p) || /^(ha)+h?$/.test(p));
}

// ---------- contexto do webinar ----------
function formatCents(c) {
  if (c == null) return null;
  return (Number(c) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function addSeconds(date, s) {
  if (!date || s == null) return null;
  return toBrtIso(new Date(new Date(date).getTime() + Number(s) * 1000));
}

async function buildContext(webinarId) {
  const [[w]] = await pool.query(
    `SELECT w.id, w.slug, w.nome, w.titulo, w.nome_apresentador, w.data_inicio, w.status,
            v.duracao_segundos
     FROM webinars w LEFT JOIN videos v ON v.id = w.video_id WHERE w.id = ? LIMIT 1`,
    [webinarId],
  );
  if (!w) return null;
  const [offerRows] = await pool.query('SELECT * FROM webinar_offer_config WHERE webinar_id = ? LIMIT 1', [webinarId]);
  const o = offerRows[0];
  const cfg = await getConfig(webinarId, { fresh: true });
  const base = process.env.APP_PUBLIC_URL || 'https://webnarpro.professoremersonleite.site';

  return {
    webinar: {
      id: w.slug,
      webinarId: w.id,
      nome: w.nome,
      titulo: w.titulo,
      apresentador: w.nome_apresentador,
      dataInicio: toBrtIso(w.data_inicio),
      duracaoSegundos: w.duracao_segundos,
      linkSala: `${base}/${w.slug}`,
      status: w.status,
    },
    oferta: o && !o.oferta_desabilitada ? {
      produto: o.nome_oferta,
      titulo: o.titulo_oferta,
      precoOriginal: formatCents(o.preco_original_centavos),
      precoOferta: formatCents(o.preco_oferta_centavos),
      precoOfertaCentavos: o.preco_oferta_centavos,
      linkCheckout: o.link_checkout,
      modoCheckout: o.modo_checkout,
      inicioPitchSegundos: o.inicio_pitch_segundos,
      inicioOfertaSegundos: o.inicio_oferta_segundos,
      inicioPitchEm: addSeconds(w.data_inicio, o.inicio_pitch_segundos),
      inicioOfertaEm: addSeconds(w.data_inicio, o.inicio_oferta_segundos),
    } : null,
    ia: cfg ? {
      habilitado: !!cfg.habilitado,
      atuacao: cfg.atuacao,
      objetivo: cfg.objetivo,
      prompt: cfg.prompt || '',
      agente: cfg.agente_id ? { id: cfg.agente_id, nome: cfg.agente_nome } : null,
      setorVenda: cfg.setor_venda,
      setorSuporte: cfg.setor_suporte,
      limiteRespostasPorAluno: cfg.limite_respostas_ia,
    } : null,
    followup: cfg ? {
      habilitado: !!cfg.followup_habilitado,
      dias: String(cfg.followup_dias || '1,3').split(',').map((d) => Number(d)).filter(Boolean),
      templates: [cfg.followup_template_1, cfg.followup_template_2].filter(Boolean),
      publico: cfg.followup_publico,
      canalPreferido: 'oficial',
    } : null,
  };
}

async function enqueue(tipo, webinarId, payload, { atendimentoId = null, mensagemId = null, status = 'pendente', atrasoMs = 0 } = {}) {
  const [r] = await pool.query(
    `INSERT INTO webnar_sino_outbox (tipo, webinar_id, atendimento_id, mensagem_id, payload, status, proxima_tentativa_em)
     VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(3), INTERVAL ? MICROSECOND))`,
    [tipo, webinarId, atendimentoId, mensagemId, JSON.stringify(payload), status, atrasoMs * 1000],
  );
  return r.insertId;
}

// Manda o contexto pro Sino quando muda (publicacao, oferta, prompt). Mesmo conteudo nao reenvia.
async function enqueueContext(webinarId, { force = false } = {}) {
  const cfg = await getConfig(webinarId, { fresh: true });
  if (!cfg || !cfg.habilitado) return { enfileirado: false, motivo: 'integracao desligada' };
  const context = await buildContext(webinarId);
  if (!context) return { enfileirado: false, motivo: 'webinar nao encontrado' };
  const hash = crypto.createHash('sha256').update(JSON.stringify(context)).digest('hex');
  if (!force && hash === cfg.contexto_hash) return { enfileirado: false, motivo: 'contexto inalterado' };
  await pool.query(
    "UPDATE webnar_sino_outbox SET status = 'descartado' WHERE tipo = 'contexto' AND webinar_id = ? AND status = 'pendente'",
    [webinarId],
  );
  await enqueue('contexto', webinarId, { ...context, hash });
  await pool.query('UPDATE webinar_sino_config SET contexto_hash = ? WHERE webinar_id = ?', [hash, webinarId]);
  invalidateConfig(webinarId);
  return { enfileirado: true };
}

async function enqueueEvent(webinarId, evento, dados) {
  const cfg = await getConfig(webinarId);
  if (!cfg || !cfg.habilitado) return false;
  await enqueue('evento', webinarId, { evento, webinarId, ...dados, em: toBrtIso(new Date()) });
  return true;
}

// ---------- entrada: mensagem do aluno ----------
// Chamado depois de gravar a mensagem no WebnarPRO. Devolve { autoResposta } quando o chat
// esta retido (pra sala mostrar na hora, sem chamar o Sino).
async function onLeadMessage({ webinarId, leadId, atendimentoId, mensagemId, texto, isReplay }) {
  const cfg = await getConfig(webinarId);
  if (!cfg || !cfg.habilitado) return {};
  if (isReplay && cfg.atuacao !== 'ao_vivo_replay') return {};

  const [[at]] = await pool.query(
    'SELECT atendente_id, respostas_ia, auto_resposta_enviada FROM atendimentos WHERE id = ? LIMIT 1',
    [atendimentoId],
  );
  // Um humano do WebnarPRO assumiu essa conversa - ela fica aqui, nao vai pro Sino
  if (at?.atendente_id) return {};
  // Limite de respostas da IA por aluno atingido - passa pra equipe do WebnarPRO
  if (cfg.limite_respostas_ia && at && at.respostas_ia >= cfg.limite_respostas_ia) {
    await pool.query("UPDATE atendimentos SET modo = 'humano' WHERE id = ?", [atendimentoId]);
    return {};
  }

  await pool.query("UPDATE atendimentos SET modo = 'ia' WHERE id = ? AND atendente_id IS NULL", [atendimentoId]);
  const mode = cfg.segurar_chat ? 'retido' : chatMode();
  const [[lead]] = await pool.query('SELECT nome, email, whatsapp FROM leads WHERE id = ? LIMIT 1', [leadId]);
  const payload = { texto, enviadaEm: toBrtIso(new Date()), isReplay: !!isReplay };

  if (mode === 'retido') {
    await enqueue('mensagem', webinarId, payload, { atendimentoId, mensagemId, status: 'retido' });
    if (at && !at.auto_resposta_enviada) {
      const autoResposta = lead?.whatsapp
        ? 'Recebemos sua mensagem! Nossa equipe vai te responder pelo WhatsApp. 😉'
        : 'Recebemos sua mensagem! Nossa equipe já vai te responder por aqui.';
      await atendimentoSvc.addReply(atendimentoId, { remetente: 'sistema', autorNome: 'Equipe', mensagem: autoResposta });
      await pool.query('UPDATE atendimentos SET auto_resposta_enviada = 1 WHERE id = ?', [atendimentoId]);
      return { autoResposta };
    }
    return {};
  }
  if (mode === 'economico' && isNoise(texto)) return {};

  const atraso = AGRUPAR_MS[mode] || AGRUPAR_MS.normal;
  await enqueue('mensagem', webinarId, payload, { atendimentoId, mensagemId, atrasoMs: atraso });
  // empurra a janela de agrupamento das mensagens anteriores ainda nao enviadas desse aluno
  await pool.query(
    `UPDATE webnar_sino_outbox SET proxima_tentativa_em = DATE_ADD(NOW(3), INTERVAL ? MICROSECOND)
     WHERE atendimento_id = ? AND tipo = 'mensagem' AND status = 'pendente' AND tentativas = 0`,
    [atraso * 1000, atendimentoId],
  );
  return {};
}

// ---------- worker ----------
async function markFailure(ids, erro, { semContar = false } = {}) {
  if (ids.length === 0) return;
  const [rows] = await pool.query('SELECT id, tentativas FROM webnar_sino_outbox WHERE id IN (?)', [ids]);
  for (const row of rows) {
    const tentativas = semContar ? row.tentativas : row.tentativas + 1;
    if (tentativas >= BACKOFF_SEGUNDOS.length + 2) {
      await pool.query(
        "UPDATE webnar_sino_outbox SET status = 'falhou_definitivo', tentativas = ?, ultimo_erro = ? WHERE id = ?",
        [tentativas, String(erro).slice(0, 255), row.id],
      );
      continue;
    }
    const atraso = BACKOFF_SEGUNDOS[Math.min(tentativas, BACKOFF_SEGUNDOS.length - 1)];
    await pool.query(
      `UPDATE webnar_sino_outbox SET tentativas = ?, ultimo_erro = ?, proxima_tentativa_em = DATE_ADD(NOW(3), INTERVAL ? SECOND)
       WHERE id = ?`,
      [tentativas, String(erro).slice(0, 255), atraso, row.id],
    );
  }
}

async function send(method, path, body, ids) {
  try {
    const res = await callSino(method, path, body);
    if (res.ok) {
      breaker.falhasSeguidas = 0;
      await pool.query("UPDATE webnar_sino_outbox SET status = 'enviado', enviado_em = NOW() WHERE id IN (?)", [ids]);
      return true;
    }
    if (res.status === 429 || res.status === 503) {
      // Sino pediu pra segurar (raia webnar cheia) - nao e erro, so espera
      openBreaker(`Sino pediu pra segurar (HTTP ${res.status})`);
      await markFailure(ids, `HTTP ${res.status} (segurar)`, { semContar: true });
      return false;
    }
    breaker.falhasSeguidas += 1;
    await markFailure(ids, `HTTP ${res.status}`);
  } catch (err) {
    breaker.falhasSeguidas += 1;
    await markFailure(ids, err.name === 'TimeoutError' ? 'timeout (10s)' : err.message);
    if (err.name === 'TimeoutError') openBreaker('Sino demorou mais de 10s');
  }
  if (breaker.falhasSeguidas >= DISJUNTOR_FALHAS) openBreaker(`${DISJUNTOR_FALHAS} falhas seguidas`);
  return false;
}

async function contextReady(webinarId) {
  const cfg = await getConfig(webinarId);
  if (cfg?.contexto_enviado_em) return true;
  const [[pend]] = await pool.query(
    "SELECT COUNT(*) AS n FROM webnar_sino_outbox WHERE tipo = 'contexto' AND webinar_id = ? AND status = 'pendente'",
    [webinarId],
  );
  if (Number(pend.n) === 0) await enqueueContext(webinarId, { force: true });
  return false;
}

async function processContextsAndEvents() {
  const [rows] = await pool.query(
    `SELECT id, tipo, webinar_id, payload FROM webnar_sino_outbox
     WHERE status = 'pendente' AND tipo IN ('contexto', 'evento') AND proxima_tentativa_em <= NOW(3)
     ORDER BY FIELD(tipo, 'contexto', 'evento'), id LIMIT 10`,
  );
  for (const row of rows) {
    if (breakerOpen()) return;
    const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
    if (row.tipo === 'contexto') {
      const ok = await send('PUT', `/webinars/${row.webinar_id}`, payload, [row.id]);
      if (ok) {
        await pool.query(
          'UPDATE webinar_sino_config SET contexto_enviado_em = NOW() WHERE webinar_id = ? AND contexto_hash = ?',
          [row.webinar_id, payload.hash],
        );
        invalidateConfig(row.webinar_id);
      }
    } else {
      await send('POST', '/events', payload, [row.id]);
    }
  }
}

async function processMessages() {
  const mode = chatMode();
  if (mode === 'retido') return;

  // saiu do retido: libera o que foi segurado (se ainda for recente) e descarta o resto
  await pool.query(
    `UPDATE webnar_sino_outbox w JOIN webinar_sino_config c ON c.webinar_id = w.webinar_id
     SET w.status = IF(w.criado_em > DATE_SUB(NOW(), INTERVAL ? MINUTE), 'pendente', 'descartado'),
         w.proxima_tentativa_em = NOW(3)
     WHERE w.status = 'retido' AND c.segurar_chat = 0`,
    [MENSAGEM_VALIDA_MIN],
  );
  await pool.query(
    `UPDATE webnar_sino_outbox SET status = 'descartado', ultimo_erro = 'expirou antes de enviar (vai no resumo pos-live)'
     WHERE tipo = 'mensagem' AND status = 'pendente' AND criado_em < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    [MENSAGEM_VALIDA_MIN],
  );

  const [due] = await pool.query(
    `SELECT DISTINCT atendimento_id FROM webnar_sino_outbox
     WHERE tipo = 'mensagem' AND status = 'pendente' AND proxima_tentativa_em <= NOW(3) LIMIT 20`,
  );
  for (const { atendimento_id: atendimentoId } of due) {
    if (breakerOpen()) return;
    const [msgs] = await pool.query(
      `SELECT id, webinar_id, mensagem_id, payload FROM webnar_sino_outbox
       WHERE atendimento_id = ? AND tipo = 'mensagem' AND status = 'pendente' ORDER BY id`,
      [atendimentoId],
    );
    if (msgs.length === 0) continue;
    const webinarId = msgs[0].webinar_id;
    const cfg = await getConfig(webinarId);
    if (!cfg || !cfg.habilitado) {
      await pool.query("UPDATE webnar_sino_outbox SET status = 'descartado', ultimo_erro = 'integracao desligada' WHERE id IN (?)", [msgs.map((m) => m.id)]);
      continue;
    }
    if (cfg.segurar_chat) {
      await pool.query("UPDATE webnar_sino_outbox SET status = 'retido' WHERE id IN (?)", [msgs.map((m) => m.id)]);
      continue;
    }
    if (!(await contextReady(webinarId))) continue; // contexto vai antes; tenta no proximo ciclo

    const [[info]] = await pool.query(
      `SELECT a.lead_id, l.nome, l.email, l.whatsapp, l.comprou_em, w.slug,
              vs.max_segundos, vs.chegou_oferta_em, vs.clicou_compra_em
       FROM atendimentos a JOIN leads l ON l.id = a.lead_id JOIN webinars w ON w.id = a.webinar_id
       LEFT JOIN view_sessions vs ON vs.webinar_id = a.webinar_id AND vs.lead_id = a.lead_id AND vs.is_replay = 0
       WHERE a.id = ? LIMIT 1`,
      [atendimentoId],
    );
    const parsed = msgs.map((m) => (typeof m.payload === 'string' ? JSON.parse(m.payload) : m.payload));
    const body = {
      messageId: `webnar-${msgs.map((m) => m.mensagem_id || m.id).join('-')}`,
      webinarId,
      webinarSlug: info?.slug,
      conversaId: `webnar-${atendimentoId}`,
      sessao: parsed.some((p) => p.isReplay) ? 'replay' : 'ao_vivo',
      aluno: {
        leadId: info?.lead_id,
        nome: info?.nome,
        email: info?.email,
        whatsapp: toSinoPhone(info?.whatsapp),
      },
      texto: parsed.map((p) => p.texto).join('\n'),
      mensagens: parsed.map((p, i) => ({ id: msgs[i].mensagem_id, texto: p.texto, enviadaEm: p.enviadaEm })),
      momentoDoVideoSegundos: info?.max_segundos ?? null,
      sinais: {
        chegouNaOferta: !!info?.chegou_oferta_em,
        clicouComprar: !!info?.clicou_compra_em,
        comprou: !!info?.comprou_em,
      },
      modoDoSistema: mode,
    };
    await send('POST', '/inbound', body, msgs.map((m) => m.id));
  }
}

// ---------- fim da live: resumo por aluno pro Sino (lead + follow-up) ----------
async function processLiveEnds() {
  const [rows] = await pool.query(
    `SELECT c.webinar_id, c.followup_publico, w.data_inicio, w.slug, w.nome, COALESCE(v.duracao_segundos, 7200) AS duracao
     FROM webinar_sino_config c
     JOIN webinars w ON w.id = c.webinar_id
     LEFT JOIN videos v ON v.id = w.video_id
     WHERE c.habilitado = 1 AND w.data_inicio IS NOT NULL
       AND w.data_inicio > DATE_SUB(NOW(), INTERVAL 2 DAY)
       AND DATE_ADD(w.data_inicio, INTERVAL (COALESCE(v.duracao_segundos, 7200) + 900) SECOND) < NOW()
       AND (c.fim_live_enviado_para IS NULL OR c.fim_live_enviado_para <> w.data_inicio)`,
  );
  for (const r of rows) {
    const desde = new Date(new Date(r.data_inicio).getTime() - 2 * 3600 * 1000);
    const alunos = await buildLiveSummary(r.webinar_id, desde, r.followup_publico);
    for (let i = 0; i < alunos.length; i += LOTE_FIM_LIVE) {
      await enqueue('evento', r.webinar_id, {
        evento: 'fim_da_live',
        webinarId: r.webinar_id,
        webinar: { id: r.slug, nome: r.nome, dataInicio: toBrtIso(r.data_inicio) },
        lote: { numero: Math.floor(i / LOTE_FIM_LIVE) + 1, total: Math.ceil(alunos.length / LOTE_FIM_LIVE) },
        alunos: alunos.slice(i, i + LOTE_FIM_LIVE),
        em: toBrtIso(new Date()),
      });
    }
    await pool.query('UPDATE webinar_sino_config SET fim_live_enviado_para = ? WHERE webinar_id = ?', [r.data_inicio, r.webinar_id]);
    invalidateConfig(r.webinar_id);
    console.log(`[sino-canal] fim da live do webinar ${r.webinar_id}: ${alunos.length} alunos enviados pro pos-live`);
  }
}

async function buildLiveSummary(webinarId, desde, publico) {
  const [chatRows] = await pool.query(
    `SELECT a.id AS atendimento_id, a.lead_id FROM atendimentos a
     WHERE a.webinar_id = ? AND a.ultima_mensagem_lead_em >= ?`,
    [webinarId, desde],
  );
  const leadIds = new Set(chatRows.map((r) => r.lead_id));
  if (publico === 'todos_presentes') {
    const [presentes] = await pool.query(
      'SELECT lead_id FROM view_sessions WHERE webinar_id = ? AND is_replay = 0 AND entrou_em >= ?',
      [webinarId, desde],
    );
    presentes.forEach((p) => leadIds.add(p.lead_id));
  }
  if (leadIds.size === 0) return [];
  const ids = [...leadIds];
  const [leads] = await pool.query(
    `SELECT l.id, l.nome, l.email, l.whatsapp, l.comprou_em, l.valor_comprado_centavos,
            vs.max_segundos, vs.chegou_pitch_em, vs.chegou_oferta_em, vs.clicou_compra_em, vs.entrou_em
     FROM leads l
     LEFT JOIN view_sessions vs ON vs.webinar_id = l.webinar_id AND vs.lead_id = l.id AND vs.is_replay = 0
     WHERE l.id IN (?)`,
    [ids],
  );
  const atendimentoPorLead = Object.fromEntries(chatRows.map((r) => [r.lead_id, r.atendimento_id]));
  const atIds = chatRows.map((r) => r.atendimento_id);
  const msgsPorAt = {};
  if (atIds.length) {
    const [msgs] = await pool.query(
      `SELECT atendimento_id, remetente, autor_nome, mensagem, criado_em FROM atendimento_mensagens
       WHERE atendimento_id IN (?) AND criado_em >= ? ORDER BY criado_em`,
      [atIds, desde],
    );
    for (const m of msgs) (msgsPorAt[m.atendimento_id] ||= []).push(m);
  }
  return leads.map((l) => {
    const msgs = msgsPorAt[atendimentoPorLead[l.id]] || [];
    const ultima = msgs[msgs.length - 1];
    return {
      leadId: l.id,
      nome: l.nome,
      email: l.email,
      whatsapp: toSinoPhone(l.whatsapp),
      entrouEm: toBrtIso(l.entrou_em),
      tempoAssistidoSegundos: l.max_segundos ?? 0,
      chegouNoPitch: !!l.chegou_pitch_em,
      chegouNaOferta: !!l.chegou_oferta_em,
      clicouComprar: !!l.clicou_compra_em,
      comprou: !!l.comprou_em,
      valorCompradoCentavos: l.valor_comprado_centavos,
      interagiuNoChat: msgs.some((m) => m.remetente === 'lead'),
      perguntas: msgs.filter((m) => m.remetente === 'lead').slice(-20).map((m) => m.mensagem),
      respostas: msgs.filter((m) => m.remetente === 'ia' || m.remetente === 'suporte').slice(-20)
        .map((m) => ({ autor: m.autor_nome || (m.remetente === 'ia' ? 'IA' : 'Equipe'), texto: m.mensagem })),
      ficouSemResposta: !!ultima && ultima.remetente === 'lead',
    };
  });
}

let workerTimer = null;
let fimLiveTimer = null;
let rodando = false;
function startWorker() {
  if (workerTimer) return;
  workerTimer = setInterval(async () => {
    if (rodando || breakerOpen()) return;
    rodando = true;
    try {
      await processContextsAndEvents();
      await processMessages();
    } catch (err) {
      console.error('[sino-canal] erro no worker:', err.message);
    } finally {
      rodando = false;
    }
  }, WORKER_MS);
  fimLiveTimer = setInterval(() => {
    processLiveEnds().catch((err) => console.error('[sino-canal] erro no fim da live:', err.message));
  }, FIM_LIVE_CHECK_MS);
}

async function listAgents() {
  try {
    const res = await callSino('GET', '/agents');
    if (!res.ok) return { agentes: [], setores: [], erro: `Sino respondeu HTTP ${res.status}` };
    return { agentes: res.data?.agentes || [], setores: res.data?.setores || [], erro: null };
  } catch (err) {
    return { agentes: [], setores: [], erro: `Sino indisponível (${err.message})` };
  }
}

module.exports = {
  verifySignature, getStats, getConfig, invalidateConfig, buildContext, enqueueContext, enqueueEvent,
  onLeadMessage, startWorker, listAgents, isNoise, buildLiveSummary,
  _test: { processMessages, processContextsAndEvents, processLiveEnds, breaker, sign },
};
