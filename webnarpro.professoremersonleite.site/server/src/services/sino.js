// Empurra eventos da sala ao vivo pro webhook do sino (automacao de WhatsApp), em
// tempo real: entrou, progresso (a cada ~5min), chegou na oferta, clicou no botao.
// Nunca bloqueia quem esta na sala esperando essa chamada terminar - e sempre
// "fire and forget" (chamado sem await no route handler) e falha silenciosa
// (so loga), exatamente como pedido pelo sino.

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

async function sendEvent(evento, { webinarId: webinarSlug, webinarNome, dataInicio, leadId, nome, email, whatsapp, em, segundosAssistidos }) {
  const url = process.env.SINO_WEBHOOK_URL;
  const secret = process.env.SINO_WEBHOOK_SECRET;
  if (!url || !secret) return; // integracao ainda nao configurada - nao quebra nada, so nao envia

  const payload = {
    evento,
    webinar: { id: webinarSlug, nome: webinarNome || undefined, data_inicio: toBrtIso(dataInicio) || undefined },
    aluno: { id: leadId, nome: nome || undefined, email: email || undefined, whatsapp: toSinoPhone(whatsapp) || undefined },
    em: toBrtIso(em || new Date()),
  };
  if (segundosAssistidos != null) payload.segundos_assistidos = segundosAssistidos;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-webnarpro-secret': secret },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`[sino] webhook respondeu HTTP ${res.status} pro evento "${evento}" do lead ${leadId}`);
    }
  } catch (err) {
    console.error(`[sino] falha ao enviar evento "${evento}" do lead ${leadId}: ${err.message}`);
  }
}

module.exports = { sendEvent, toSinoPhone, toBrtIso };
