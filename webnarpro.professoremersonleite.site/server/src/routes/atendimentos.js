const express = require('express');
const { z } = require('zod');
const pool = require('../db');
const { requireAuth } = require('../middlewares/auth');
const atendimentoSvc = require('../services/atendimento');
const sinoChannel = require('../services/sino-channel');

const router = express.Router();
router.use(requireAuth);

// Filtros do inbox. "Pendente" = conversa aberta em que o aluno escreveu por ultimo.
const FILTROS = {
  pendentes: "a.status <> 'encerrado' AND a.ultima_mensagem_remetente = 'lead'",
  ia: "a.status <> 'encerrado' AND a.modo = 'ia'",
  humano: "a.status <> 'encerrado' AND a.modo = 'humano' AND (a.atendente_id IS NOT NULL OR a.status = 'em_atendimento')",
  minhas: "a.status <> 'encerrado' AND a.atendente_id = ?",
  encerradas: "a.status = 'encerrado'",
  todas: "a.status <> 'encerrado'",
};

const LIST_COLUMNS = `
  a.id, a.status, a.modo, a.nao_lidas, a.total_mensagens_lead, a.respostas_ia,
  a.ultima_mensagem_texto AS ultima_mensagem, a.ultima_mensagem_remetente, a.ultima_mensagem_em,
  a.ultima_mensagem_lead_em, a.ultima_resposta_em, a.criado_em, a.atendente_id,
  DATE_FORMAT(a.atualizado_em, '%Y-%m-%d %H:%i:%s.%f') AS atualizado_em,
  l.id AS lead_id, l.nome AS lead_nome, l.email AS lead_email, l.whatsapp AS lead_whatsapp,
  w.id AS webinar_id, w.nome AS webinar_nome, u.nome AS atendente_nome`;

router.get('/', async (req, res) => {
  const search = (req.query.search || '').trim();
  const webinarId = req.query.webinar_id ? Number(req.query.webinar_id) : null;

  // Compatibilidade com a tela antiga (cartoes por status) enquanto o navegador nao recarrega
  if (req.query.status && !req.query.filtro) {
    const status = ['aberto', 'em_atendimento', 'encerrado'].includes(req.query.status) ? req.query.status : 'aberto';
    const params = [req.accountId, status];
    let sql = `SELECT ${LIST_COLUMNS} FROM atendimentos a JOIN leads l ON l.id = a.lead_id JOIN webinars w ON w.id = a.webinar_id
               LEFT JOIN users u ON u.id = a.atendente_id WHERE w.account_id = ? AND a.status = ?`;
    if (webinarId) { sql += ' AND w.id = ?'; params.push(webinarId); }
    if (req.query.mine === '1') { sql += ' AND a.atendente_id = ?'; params.push(req.userId); }
    if (search) { sql += ' AND l.nome LIKE ?'; params.push(`%${search}%`); }
    sql += ' ORDER BY a.ultima_mensagem_em DESC LIMIT 200';
    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  }

  const filtro = FILTROS[req.query.filtro] ? req.query.filtro : 'pendentes';
  const desde = req.query.desde ? String(req.query.desde) : null;
  const base = ['w.account_id = ?'];
  const baseParams = [req.accountId];
  if (webinarId) { base.push('w.id = ?'); baseParams.push(webinarId); }

  const [[agoraRow]] = await pool.query("SELECT DATE_FORMAT(NOW(3), '%Y-%m-%d %H:%i:%s.%f') AS agora");

  const where = [...base];
  const params = [...baseParams];
  if (desde) {
    // incremental: tudo que mudou desde o cursor, em qualquer filtro - o painel reaplica o filtro
    where.push('a.atualizado_em > ?');
    params.push(desde);
  } else {
    where.push(FILTROS[filtro]);
    if (filtro === 'minhas') params.push(req.userId);
  }
  if (search) {
    where.push('(l.nome LIKE ? OR l.email LIKE ? OR l.whatsapp LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search.replace(/\D/g, '') || search}%`);
  }
  const ordem = req.query.ordem === 'antigas'
    ? "CASE WHEN a.ultima_mensagem_remetente = 'lead' THEN 0 ELSE 1 END, a.ultima_mensagem_lead_em ASC"
    : req.query.ordem === 'mais_mensagens' ? 'a.total_mensagens_lead DESC' : 'a.ultima_mensagem_em DESC';
  const [itens] = await pool.query(
    `SELECT ${LIST_COLUMNS} FROM atendimentos a
     JOIN leads l ON l.id = a.lead_id JOIN webinars w ON w.id = a.webinar_id
     LEFT JOIN users u ON u.id = a.atendente_id
     WHERE ${where.join(' AND ')} ORDER BY ${ordem} LIMIT 300`,
    params,
  );

  const [[contadores]] = await pool.query(
    `SELECT
       SUM(${FILTROS.pendentes}) AS pendentes, SUM(${FILTROS.ia}) AS ia, SUM(${FILTROS.humano}) AS humano,
       SUM(a.status <> 'encerrado' AND a.atendente_id = ?) AS minhas, SUM(${FILTROS.encerradas}) AS encerradas,
       SUM(a.status <> 'encerrado' AND a.nao_lidas > 0) AS nao_lidas
     FROM atendimentos a JOIN webinars w ON w.id = a.webinar_id
     WHERE ${base.join(' AND ')}`,
    [req.userId, ...baseParams],
  );

  res.json({
    agora: agoraRow.agora,
    incremental: !!desde,
    itens,
    contadores: Object.fromEntries(Object.entries(contadores).map(([k, v]) => [k, Number(v) || 0])),
  });
});

// Contador pro menu e pro titulo da aba (todas as conversas da conta esperando resposta)
router.get('/pendentes-count', async (req, res) => {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS n FROM atendimentos a JOIN webinars w ON w.id = a.webinar_id
     WHERE w.account_id = ? AND ${FILTROS.pendentes}`,
    [req.accountId],
  );
  res.json({ pendentes: Number(row.n) });
});

async function getOwnedAtendimento(id, accountId) {
  const [rows] = await pool.query(
    `SELECT a.*, l.nome AS lead_nome, l.email AS lead_email, l.whatsapp AS lead_whatsapp,
            l.criado_em AS lead_cadastrado_em, l.comprou_em, l.valor_comprado_centavos,
            w.nome AS webinar_nome, w.slug AS webinar_slug, u.nome AS atendente_nome
     FROM atendimentos a
     JOIN webinars w ON w.id = a.webinar_id
     JOIN leads l ON l.id = a.lead_id
     LEFT JOIN users u ON u.id = a.atendente_id
     WHERE a.id = ? AND w.account_id = ? LIMIT 1`,
    [id, accountId],
  );
  return rows[0] || null;
}

async function userName(userId) {
  const [rows] = await pool.query('SELECT nome FROM users WHERE id = ? LIMIT 1', [userId]);
  return rows[0]?.nome || 'Equipe';
}

router.get('/:id/mensagens', async (req, res) => {
  const atendimento = await getOwnedAtendimento(req.params.id, req.accountId);
  if (!atendimento) return res.status(404).json({ error: 'Atendimento não encontrado' });

  const [rows] = await pool.query(
    'SELECT id, remetente, autor_nome, mensagem, criado_em FROM atendimento_mensagens WHERE atendimento_id = ? ORDER BY criado_em ASC, id ASC',
    [atendimento.id],
  );
  const [sessaoRows] = await pool.query(
    `SELECT entrou_em, max_segundos, chegou_pitch_em, chegou_oferta_em, clicou_compra_em, cliques_compra
     FROM view_sessions WHERE webinar_id = ? AND lead_id = ? AND is_replay = 0 LIMIT 1`,
    [atendimento.webinar_id, atendimento.lead_id],
  );
  const sessao = sessaoRows[0];
  const [[outras]] = await pool.query(
    'SELECT COUNT(*) AS n FROM leads WHERE email = ? AND webinar_id <> ?',
    [atendimento.lead_email, atendimento.webinar_id],
  );
  const cfg = await sinoChannel.getConfig(atendimento.webinar_id);

  res.json({
    atendimento,
    mensagens: rows,
    ficha: {
      sessao: sessao || null,
      outrasLives: Number(outras.n),
      sinoHabilitado: !!cfg?.habilitado,
    },
  });
});

router.post('/:id/lida', async (req, res) => {
  const atendimento = await getOwnedAtendimento(req.params.id, req.accountId);
  if (!atendimento) return res.status(404).json({ error: 'Atendimento não encontrado' });
  await atendimentoSvc.markRead(atendimento.id);
  res.json({ ok: true });
});

const replySchema = z.object({ mensagem: z.string().min(1).max(1000) });

router.post('/:id/mensagens', async (req, res) => {
  const parsed = replySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Mensagem inválida' });

  const atendimento = await getOwnedAtendimento(req.params.id, req.accountId);
  if (!atendimento) return res.status(404).json({ error: 'Atendimento não encontrado' });

  const nome = await userName(req.userId);
  await atendimentoSvc.addReply(atendimento.id, { remetente: 'suporte', autorNome: nome, mensagem: parsed.data.mensagem });
  await pool.query(
    "UPDATE atendimentos SET status = IF(status = 'encerrado', status, 'em_atendimento'), modo = 'humano', atendente_id = COALESCE(atendente_id, ?), nao_lidas = 0 WHERE id = ?",
    [req.userId, atendimento.id],
  );
  // Mantem o historico do Sino completo quando a conversa e de um webinar integrado
  sinoChannel.enqueueEvent(atendimento.webinar_id, 'resposta_equipe_webnar', {
    conversaId: `webnar-${atendimento.id}`, leadId: atendimento.lead_id, autor: nome, texto: parsed.data.mensagem,
  }).catch(() => {});
  res.status(201).json({ ok: true });
});

async function statusEvent(atendimento, status, por) {
  return sinoChannel.enqueueEvent(atendimento.webinar_id, 'status_atendimento', {
    conversaId: `webnar-${atendimento.id}`, leadId: atendimento.lead_id, status, por,
  }).catch(() => {});
}

router.post('/:id/atender', async (req, res) => {
  const atendimento = await getOwnedAtendimento(req.params.id, req.accountId);
  if (!atendimento) return res.status(404).json({ error: 'Atendimento não encontrado' });
  const nome = await userName(req.userId);
  await pool.query(
    "UPDATE atendimentos SET status = 'em_atendimento', modo = 'humano', atendente_id = ?, nao_lidas = 0 WHERE id = ?",
    [req.userId, atendimento.id],
  );
  if (atendimento.atendente_id !== req.userId) {
    await atendimentoSvc.addReply(atendimento.id, { remetente: 'sistema', autorNome: 'WebnarPRO', mensagem: `Atendimento assumido por ${nome}` });
    statusEvent(atendimento, 'assumido_webnarpro', nome);
  }
  res.json({ ok: true });
});

router.post('/:id/devolver-ia', async (req, res) => {
  const atendimento = await getOwnedAtendimento(req.params.id, req.accountId);
  if (!atendimento) return res.status(404).json({ error: 'Atendimento não encontrado' });
  const cfg = await sinoChannel.getConfig(atendimento.webinar_id);
  if (!cfg?.habilitado) return res.status(400).json({ error: 'Este webinar não está integrado com o Sino' });
  const nome = await userName(req.userId);
  await pool.query(
    "UPDATE atendimentos SET modo = 'ia', atendente_id = NULL, status = IF(status = 'encerrado', 'aberto', status) WHERE id = ?",
    [atendimento.id],
  );
  await atendimentoSvc.addReply(atendimento.id, { remetente: 'sistema', autorNome: 'WebnarPRO', mensagem: `${nome} devolveu a conversa para a IA` });
  statusEvent(atendimento, 'devolvido_ia', nome);
  res.json({ ok: true });
});

async function encerrar(req, res) {
  const atendimento = await getOwnedAtendimento(req.params.id, req.accountId);
  if (!atendimento) return res.status(404).json({ error: 'Atendimento não encontrado' });
  await pool.query("UPDATE atendimentos SET status = 'encerrado', nao_lidas = 0 WHERE id = ?", [atendimento.id]);
  statusEvent(atendimento, 'encerrado', await userName(req.userId));
  res.json({ ok: true });
}

router.post('/:id/dispensar', encerrar);
router.post('/:id/encerrar', encerrar);

module.exports = router;
