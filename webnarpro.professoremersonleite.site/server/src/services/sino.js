// Empurra eventos da sala ao vivo pro webhook do sino (automacao de WhatsApp), em
// tempo real: entrou, progresso (a cada ~5min), chegou na oferta, clicou no botao.
// Nunca bloqueia quem esta na sala esperando essa chamada terminar - e sempre
// "fire and forget" (chamado sem await no route handler) e, se falhar (timeout ou
// HTTP de erro), cai numa fila de reenvio (sino_webhook_outbox) processada em
// segundo plano com backoff, pra nenhum evento se perder de verdade.
const pool = require('../db');

function toSinoPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 12 || digits.length === 13) {
    if (digits.startsWith('55')) return digits;
  }
  if (digits.length === 10 || digits.length === 11) return '55' + digits;
  return digits;
}

// America/Sao_Paulo e sempre -03:00 (Brasil nao usa mais horario de verao) - formata
// manualmente em vez de depender de Intl/timezone do SO, que no servidor roda em UTC.
function toBrtIso(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const local = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T`
    + `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}-03:00`;
}

function buildPayload(evento, { webinarId: webinarSlug, webinarNome, dataInicio, leadId, nome, email, whatsapp, em, segundosAssistidos }) {
  const payload = {
    evento,
    webinar: { id: webinarSlug, nome: webinarNome || undefined, data_inicio: toBrtIso(dataInicio) || undefined },
    aluno: { id: leadId, nome: nome || undefined, email: email || undefined, whatsapp: toSinoPhone(whatsapp) || undefined },
    em: toBrtIso(em || new Date()),
  };
  if (segundosAssistidos != null) payload.segundos_assistidos = segundosAssistidos;
  return payload;
}

async function postToSino(payload) {
  const url = process.env.SINO_WEBHOOK_URL;
  const secret = process.env.SINO_WEBHOOK_SECRET;
  if (!url || !secret) return { ok: false, skip: true };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webnarpro-secret': secret },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });
  return { ok: res.ok, status: res.status };
}

// Backoff crescente: 1min, 5min, 15min, 30min, depois de hora em hora ate 8 tentativas.
const BACKOFF_SECONDS = [60, 300, 900, 1800, 3600, 3600, 3600, 3600];
const MAX_TENTATIVAS = BACKOFF_SECONDS.length;

async function enqueueRetry(evento, payload, erro) {
  try {
    await pool.query(
      `INSERT INTO sino_webhook_outbox (evento, payload, tentativas, status, proxima_tentativa_em, ultimo_erro)
       VALUES (?, ?, 0, 'pendente', DATE_ADD(NOW(), INTERVAL ? SECOND), ?)`,
      [evento, JSON.stringify(payload), BACKOFF_SECONDS[0], String(erro).slice(0, 255)],
    );
  } catch (err) {
    console.error(`[sino] falha ao gravar evento "${evento}" na fila de reenvio: ${err.message}`);
  }
}

async function sendEvent(evento, data) {
  if (!process.env.SINO_WEBHOOK_URL || !process.env.SINO_WEBHOOK_SECRET) return; // integracao nao configurada

  const payload = buildPayload(evento, data);
  try {
    const result = await postToSino(payload);
    if (!result.ok) {
      console.error(`[sino] webhook respondeu HTTP ${result.status} pro evento "${evento}" do lead ${data.leadId} - enfileirando reenvio`);
      await enqueueRetry(evento, payload, `HTTP ${result.status}`);
    }
  } catch (err) {
    console.error(`[sino] falha ao enviar evento "${evento}" do lead ${data.leadId}: ${err.message} - enfileirando reenvio`);
    await enqueueRetry(evento, payload, err.message);
  }
}

// Roda periodicamente (chamado pelo server.js). Pega um lote de eventos pendentes
// cuja hora de retentativa ja chegou e tenta reenviar, com backoff crescente a cada
// nova falha, ate desistir depois de MAX_TENTATIVAS.
async function processOutboxBatch() {
  if (!process.env.SINO_WEBHOOK_URL || !process.env.SINO_WEBHOOK_SECRET) return;

  const [rows] = await pool.query(
    `SELECT id, evento, payload, tentativas FROM sino_webhook_outbox
     WHERE status = 'pendente' AND proxima_tentativa_em <= NOW()
     ORDER BY criado_em ASC LIMIT 20`,
  );
  if (rows.length === 0) return;

  for (const row of rows) {
    const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
    try {
      const result = await postToSino(payload);
      if (result.ok) {
        await pool.query("UPDATE sino_webhook_outbox SET status = 'enviado', enviado_em = NOW() WHERE id = ?", [row.id]);
        continue;
      }
      await registrarFalhaReenvio(row, `HTTP ${result.status}`);
    } catch (err) {
      await registrarFalhaReenvio(row, err.message);
    }
  }
}

async function registrarFalhaReenvio(row, erro) {
  const novasTentativas = row.tentativas + 1;
  if (novasTentativas >= MAX_TENTATIVAS) {
    await pool.query(
      "UPDATE sino_webhook_outbox SET status = 'falhou_definitivo', tentativas = ?, ultimo_erro = ? WHERE id = ?",
      [novasTentativas, String(erro).slice(0, 255), row.id],
    );
    console.error(`[sino] evento "${row.evento}" (fila #${row.id}) desistiu apos ${novasTentativas} tentativas: ${erro}`);
    return;
  }
  const atraso = BACKOFF_SECONDS[novasTentativas] || BACKOFF_SECONDS[BACKOFF_SECONDS.length - 1];
  await pool.query(
    `UPDATE sino_webhook_outbox
     SET tentativas = ?, proxima_tentativa_em = DATE_ADD(NOW(), INTERVAL ? SECOND), ultimo_erro = ?
     WHERE id = ?`,
    [novasTentativas, atraso, String(erro).slice(0, 255), row.id],
  );
}

let workerTimer = null;
function startOutboxWorker() {
  if (workerTimer) return;
  workerTimer = setInterval(() => {
    processOutboxBatch().catch((err) => console.error('[sino] erro no worker da fila de reenvio:', err.message));
  }, 30000);
}

module.exports = { sendEvent, toSinoPhone, toBrtIso, startOutboxWorker, processOutboxBatch };
