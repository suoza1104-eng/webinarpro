// Vendas reais do webinar: a E4Pay avisa (webhook) quando uma compra e aprovada e aqui
// ligamos o comprador ao aluno cadastrado no webinar. Usado pela rota do webhook
// (routes/e4pay-webhook.js) e pelo script de recuperacao (scripts/backfill-vendas-e4pay.js).
const pool = require('../db');

// Uma compra conta pro webinar se acontecer de 1h antes do inicio (link aberto na sala de
// espera) ate 7 dias depois (Pix/boleto pagos depois, replay). Varios webinars usam o mesmo
// checkout, entao ganha o mais recente que ja tinha comecado na hora da compra.
const JANELA_ANTES_MS = 60 * 60 * 1000;
const JANELA_DEPOIS_MS = 7 * 24 * 60 * 60 * 1000;

const STATUS_POR_EVENTO = {
  compra_reembolsada: 'reembolsada',
  chargeback: 'chargeback',
  compra_cancelada: 'cancelada',
};

function slugDoCheckout(url) {
  const m = /#c\/([^?&#/]+)/.exec(url || '');
  return m ? decodeURIComponent(m[1]) : null;
}

function digitos(tel) {
  return String(tel || '').replace(/\D/g, '');
}

// Webinars cuja oferta aponta pro checkout da compra e cuja janela cobre o momento da compra
async function webinarsDoCheckout(checkoutSlug, pagoEm) {
  const [rows] = await pool.query(
    `SELECT w.id, w.data_inicio, oc.link_checkout
     FROM webinars w JOIN webinar_offer_config oc ON oc.webinar_id = w.id
     WHERE w.data_inicio IS NOT NULL AND w.data_inicio BETWEEN ? AND ?`,
    [new Date(pagoEm.getTime() - JANELA_DEPOIS_MS), new Date(pagoEm.getTime() + JANELA_ANTES_MS)],
  );
  return rows
    .filter((w) => slugDoCheckout(w.link_checkout) === checkoutSlug)
    .sort((a, b) => new Date(b.data_inicio) - new Date(a.data_inicio));
}

// Acha o aluno: primeiro pelo e-mail, depois pelos 8 ultimos digitos do WhatsApp (pega quem
// digitou um e-mail diferente no checkout). Percorre do webinar mais recente pro mais antigo.
async function acharAluno(webinarIds, email, telefone) {
  if (webinarIds.length === 0) return null;
  const ordem = (rows) => rows.sort((a, b) => webinarIds.indexOf(a.webinar_id) - webinarIds.indexOf(b.webinar_id))[0];

  if (email) {
    const [rows] = await pool.query(
      'SELECT id, webinar_id FROM leads WHERE webinar_id IN (?) AND email = ?',
      [webinarIds, email.trim()],
    );
    if (rows.length) return { ...ordem(rows), vinculo: 'email' };
  }
  const fim = digitos(telefone).slice(-8);
  if (fim.length === 8) {
    const [rows] = await pool.query(
      `SELECT id, webinar_id FROM leads
       WHERE webinar_id IN (?) AND whatsapp IS NOT NULL AND REGEXP_REPLACE(whatsapp, '[^0-9]', '') LIKE ?`,
      [webinarIds, `%${fim}`],
    );
    if (rows.length) return { ...ordem(rows), vinculo: 'telefone' };
  }
  return null;
}

// Mantem o resumo por aluno (leads.comprou_em / valor_comprado_centavos) igual as vendas aprovadas
async function recalcularAluno(leadId) {
  await pool.query(
    `UPDATE leads l
     LEFT JOIN (
       SELECT lead_id, MIN(pago_em) AS primeira, SUM(valor_centavos) AS total
       FROM webinar_vendas WHERE lead_id = ? AND status = 'aprovada' GROUP BY lead_id
     ) v ON v.lead_id = l.id
     SET l.comprou_em = v.primeira, l.valor_comprado_centavos = v.total
     WHERE l.id = ?`,
    [leadId, leadId],
  );
}

// Registra uma compra aprovada. Idempotente: a mesma transacao chegando de novo so atualiza.
// Retorna { registrada, motivo?, webinarId?, leadId? }.
async function registrarCompra({ transacaoId, checkoutSlug, email, telefone, valorCentavos, metodo, pagoEm }) {
  if (!transacaoId || !checkoutSlug) return { registrada: false, motivo: 'sem transacao ou checkout' };
  const webinars = await webinarsDoCheckout(checkoutSlug, pagoEm);
  if (webinars.length === 0) return { registrada: false, motivo: 'checkout fora de webinar' };
  const aluno = await acharAluno(webinars.map((w) => w.id), email, telefone);
  if (!aluno) return { registrada: false, motivo: 'comprador nao cadastrado no webinar' };

  await pool.query(
    `INSERT INTO webinar_vendas
       (webinar_id, lead_id, transacao_id, checkout_slug, email, valor_centavos, metodo, status, vinculo, pago_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'aprovada', ?, ?)
     ON DUPLICATE KEY UPDATE webinar_id = VALUES(webinar_id), lead_id = VALUES(lead_id),
       valor_centavos = VALUES(valor_centavos), metodo = VALUES(metodo), status = 'aprovada',
       vinculo = VALUES(vinculo), pago_em = VALUES(pago_em)`,
    [aluno.webinar_id, aluno.id, transacaoId, checkoutSlug, email || null, valorCentavos || 0, metodo || null, aluno.vinculo, pagoEm],
  );
  await recalcularAluno(aluno.id);
  return { registrada: true, webinarId: aluno.webinar_id, leadId: aluno.id };
}

// Reembolso/chargeback/cancelamento de uma venda ja registrada (nao apaga a linha)
async function estornarCompra(transacaoId, evento) {
  const status = STATUS_POR_EVENTO[evento];
  if (!transacaoId || !status) return { registrada: false, motivo: 'evento ignorado' };
  const [rows] = await pool.query('SELECT lead_id FROM webinar_vendas WHERE transacao_id = ?', [transacaoId]);
  if (rows.length === 0) return { registrada: false, motivo: 'venda nao era de webinar' };
  await pool.query('UPDATE webinar_vendas SET status = ? WHERE transacao_id = ?', [status, transacaoId]);
  await recalcularAluno(rows[0].lead_id);
  return { registrada: true, leadId: rows[0].lead_id };
}

module.exports = { registrarCompra, estornarCompra, STATUS_POR_EVENTO };
