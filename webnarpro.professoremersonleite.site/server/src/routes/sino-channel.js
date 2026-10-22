// Entrada do canal "webnar": o Sino devolve aqui as respostas (IA ou humano de la) e as
// mudancas de status da conversa. Autenticado por assinatura HMAC do corpo
// (x-sino-timestamp + x-sino-signature, ver services/sino-channel.js), so pela rede interna.
const express = require('express');
const { z } = require('zod');
const pool = require('../db');
const sinoChannel = require('../services/sino-channel');
const atendimentoSvc = require('../services/atendimento');

const router = express.Router();

router.use((req, res, next) => {
  if (!sinoChannel.verifySignature(req)) return res.status(401).json({ error: 'Assinatura inválida' });
  next();
});

// conversaId = "webnar-<atendimentoId>" (mandado no inbound); aceita tambem webinarId + leadId
async function resolveAtendimento({ conversaId, webinarId, leadId }) {
  const m = /^webnar-(\d+)$/.exec(String(conversaId || ''));
  if (m) {
    const [rows] = await pool.query('SELECT id, webinar_id FROM atendimentos WHERE id = ? LIMIT 1', [Number(m[1])]);
    if (rows[0]) return rows[0];
  }
  if (webinarId && leadId) {
    const id = await atendimentoSvc.findOrCreateAtendimento(Number(webinarId), Number(leadId), 'ia');
    return { id, webinar_id: Number(webinarId) };
  }
  return null;
}

const replySchema = z.object({
  replyId: z.string().min(1).max(80),
  conversaId: z.string().max(80).optional(),
  webinarId: z.union([z.number(), z.string()]).optional(),
  leadId: z.union([z.number(), z.string()]).optional(),
  texto: z.string().min(1).max(4000),
  autor: z.object({ tipo: z.enum(['ia', 'humano']), nome: z.string().max(120).optional() }),
  setor: z.string().max(64).optional(),
});

router.post('/reply', async (req, res) => {
  const parsed = replySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;
  const at = await resolveAtendimento(d);
  if (!at) return res.status(404).json({ error: 'Conversa não encontrada' });

  // mensagens longas viram mais de um balao no chat (a coluna guarda ate 1000 caracteres)
  const partes = d.texto.match(/[\s\S]{1,1000}/g) || [];
  let duplicada = false;
  for (let i = 0; i < partes.length; i += 1) {
    const r = await atendimentoSvc.addReply(at.id, {
      remetente: d.autor.tipo === 'ia' ? 'ia' : 'suporte',
      autorNome: d.autor.nome || 'Equipe',
      mensagem: partes[i],
      externalId: partes.length > 1 ? `${d.replyId}#${i}` : d.replyId,
    });
    if (r.duplicada) duplicada = true;
  }
  if (!duplicada) {
    await pool.query(
      "UPDATE atendimentos SET modo = ?, status = IF(status = 'aberto', 'em_atendimento', status) WHERE id = ?",
      [d.autor.tipo === 'ia' ? 'ia' : 'humano', at.id],
    );
  }
  res.json({ ok: true, duplicada });
});

const statusSchema = z.object({
  conversaId: z.string().max(80).optional(),
  webinarId: z.union([z.number(), z.string()]).optional(),
  leadId: z.union([z.number(), z.string()]).optional(),
  status: z.enum(['assumido_humano', 'devolvido_ia', 'encerrado']),
  por: z.string().max(120).optional(),
  setor: z.string().max(64).optional(),
});

router.post('/status', async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const d = parsed.data;
  const at = await resolveAtendimento(d);
  if (!at) return res.status(404).json({ error: 'Conversa não encontrada' });

  const textos = {
    assumido_humano: `Atendimento assumido por ${d.por || 'equipe'} no Sino${d.setor ? ` (${d.setor})` : ''} · IA pausada`,
    devolvido_ia: `${d.por || 'A equipe'} devolveu a conversa para a IA`,
    encerrado: `Conversa encerrada no Sino${d.por ? ` por ${d.por}` : ''}`,
  };
  await atendimentoSvc.addReply(at.id, { remetente: 'sistema', autorNome: 'Sino', mensagem: textos[d.status] });
  if (d.status === 'assumido_humano') {
    await pool.query("UPDATE atendimentos SET modo = 'humano', status = 'em_atendimento' WHERE id = ?", [at.id]);
  } else if (d.status === 'devolvido_ia') {
    await pool.query("UPDATE atendimentos SET modo = 'ia', status = IF(status = 'encerrado', 'aberto', status) WHERE id = ?", [at.id]);
  } else {
    await pool.query("UPDATE atendimentos SET status = 'encerrado' WHERE id = ?", [at.id]);
  }
  res.json({ ok: true });
});

module.exports = router;
