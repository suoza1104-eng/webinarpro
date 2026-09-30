const express = require('express');
const { z } = require('zod');
const pool = require('../db');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();
router.use(requireAuth);

// Lista de conversas — filtra por status e, opcionalmente, só as minhas
router.get('/', async (req, res) => {
  const status = ['aberto', 'em_atendimento', 'encerrado'].includes(req.query.status) ? req.query.status : 'aberto';
  const mine = req.query.mine === '1';
  const search = (req.query.search || '').trim();

  const params = [req.accountId, status];
  let sql = `
    SELECT a.id, a.status, a.ultima_mensagem_em, a.criado_em,
           l.id AS lead_id, l.nome AS lead_nome, l.email AS lead_email, l.whatsapp AS lead_whatsapp,
           w.id AS webinar_id, w.nome AS webinar_nome,
           u.nome AS atendente_nome,
           (SELECT mensagem FROM atendimento_mensagens m WHERE m.atendimento_id = a.id ORDER BY m.criado_em DESC LIMIT 1) AS ultima_mensagem,
           (SELECT COUNT(*) FROM atendimento_mensagens m WHERE m.atendimento_id = a.id AND m.remetente = 'lead') AS total_mensagens_lead
    FROM atendimentos a
    JOIN leads l ON l.id = a.lead_id
    JOIN webinars w ON w.id = a.webinar_id
    LEFT JOIN users u ON u.id = a.atendente_id
    WHERE w.account_id = ? AND a.status = ?
  `;
  if (mine) {
    sql += ' AND a.atendente_id = ?';
    params.push(req.userId);
  }
  if (search) {
    sql += ' AND l.nome LIKE ?';
    params.push(`%${search}%`);
  }
  sql += ' ORDER BY a.ultima_mensagem_em DESC LIMIT 200';

  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

async function getOwnedAtendimento(id, accountId) {
  const [rows] = await pool.query(
    `SELECT a.*, l.nome AS lead_nome, l.email AS lead_email, l.whatsapp AS lead_whatsapp,
            w.nome AS webinar_nome
     FROM atendimentos a
     JOIN webinars w ON w.id = a.webinar_id
     JOIN leads l ON l.id = a.lead_id
     WHERE a.id = ? AND w.account_id = ? LIMIT 1`,
    [id, accountId],
  );
  return rows[0] || null;
}

router.get('/:id/mensagens', async (req, res) => {
  const atendimento = await getOwnedAtendimento(req.params.id, req.accountId);
  if (!atendimento) return res.status(404).json({ error: 'Atendimento não encontrado' });

  const [rows] = await pool.query(
    'SELECT id, remetente, mensagem, criado_em FROM atendimento_mensagens WHERE atendimento_id = ? ORDER BY criado_em ASC',
    [atendimento.id],
  );
  res.json({ atendimento, mensagens: rows });
});

const replySchema = z.object({ mensagem: z.string().min(1).max(1000) });

router.post('/:id/mensagens', async (req, res) => {
  const parsed = replySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Mensagem inválida' });

  const atendimento = await getOwnedAtendimento(req.params.id, req.accountId);
  if (!atendimento) return res.status(404).json({ error: 'Atendimento não encontrado' });

  await pool.query(
    "INSERT INTO atendimento_mensagens (atendimento_id, remetente, mensagem) VALUES (?, 'suporte', ?)",
    [atendimento.id, parsed.data.mensagem],
  );
  await pool.query(
    "UPDATE atendimentos SET ultima_mensagem_em = NOW(), status = IF(status = 'aberto', 'em_atendimento', status), atendente_id = COALESCE(atendente_id, ?) WHERE id = ?",
    [req.userId, atendimento.id],
  );
  res.status(201).json({ ok: true });
});

router.post('/:id/atender', async (req, res) => {
  const atendimento = await getOwnedAtendimento(req.params.id, req.accountId);
  if (!atendimento) return res.status(404).json({ error: 'Atendimento não encontrado' });
  await pool.query(
    "UPDATE atendimentos SET status = 'em_atendimento', atendente_id = ? WHERE id = ?",
    [req.userId, atendimento.id],
  );
  res.json({ ok: true });
});

router.post('/:id/dispensar', async (req, res) => {
  const atendimento = await getOwnedAtendimento(req.params.id, req.accountId);
  if (!atendimento) return res.status(404).json({ error: 'Atendimento não encontrado' });
  await pool.query("UPDATE atendimentos SET status = 'encerrado' WHERE id = ?", [atendimento.id]);
  res.json({ ok: true });
});

router.post('/:id/encerrar', async (req, res) => {
  const atendimento = await getOwnedAtendimento(req.params.id, req.accountId);
  if (!atendimento) return res.status(404).json({ error: 'Atendimento não encontrado' });
  await pool.query("UPDATE atendimentos SET status = 'encerrado' WHERE id = ?", [atendimento.id]);
  res.json({ ok: true });
});

module.exports = router;
