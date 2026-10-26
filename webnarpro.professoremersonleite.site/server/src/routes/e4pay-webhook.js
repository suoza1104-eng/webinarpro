// Webhook da E4Pay (Admin > Webhooks, formato "e4pay"): registra as vendas reais do webinar.
// Autenticado pela assinatura HMAC do corpo (X-E4Pay-Signature: sha256=<hex>) com o segredo
// gerado pela E4Pay ao cadastrar o webhook, guardado aqui em E4PAY_WEBHOOK_SECRET.
// Responde 200 para eventos que nao interessam (senao a E4Pay fica retentando) e 500 so em
// erro nosso, pra E4Pay tentar de novo depois (1min, 5min, 30min).
const crypto = require('crypto');
const express = require('express');
const vendas = require('../services/vendas');

const router = express.Router();

function verifySignature(req) {
  const secret = process.env.E4PAY_WEBHOOK_SECRET;
  const header = String(req.headers['x-e4pay-signature'] || '');
  if (!secret || !req.rawBody || !header.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
  const received = header.slice(7);
  return received.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

router.post('/webhook', async (req, res) => {
  if (!verifySignature(req)) return res.status(401).json({ error: 'Assinatura inválida' });
  const { event, test, created_at: criadoEm, data } = req.body || {};
  const tx = data?.transaction;
  if (test) return res.json({ ok: true, teste: true });

  try {
    let resultado;
    if (event === 'compra_aprovada' && tx) {
      resultado = await vendas.registrarCompra({
        transacaoId: tx.id,
        checkoutSlug: data.checkout?.slug,
        email: data.customer?.email,
        telefone: data.customer?.phone,
        valorCentavos: Number(tx.amount) || 0,
        metodo: tx.payment_method,
        pagoEm: criadoEm ? new Date(criadoEm) : new Date(),
      });
    } else if (vendas.STATUS_POR_EVENTO[event] && tx) {
      resultado = await vendas.estornarCompra(tx.id, event);
    } else {
      resultado = { registrada: false, motivo: 'evento ignorado' };
    }
    req.log.info({ event, transacao: tx?.id, ...resultado }, 'webhook e4pay');
    res.json({ ok: true, ...resultado });
  } catch (err) {
    req.log.error(err, 'falha ao registrar venda da E4Pay');
    res.status(500).json({ error: 'Falha ao registrar venda' });
  }
});

module.exports = router;
