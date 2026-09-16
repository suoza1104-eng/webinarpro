const express = require('express');
const { z } = require('zod');
const pool = require('../db');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();
router.use(requireAuth);

function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function uniqueSlug(accountId, base) {
  let slug = base;
  let n = 1;
  while (true) {
    const [rows] = await pool.query(
      'SELECT id FROM webinars WHERE account_id = ? AND slug = ? LIMIT 1',
      [accountId, slug],
    );
    if (rows.length === 0) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

// ETAPA 1 — criar rascunho
const createSchema = z.object({
  nome: z.string().min(1).max(150),
  titulo: z.string().max(255).optional(),
  slug: z.string().min(1).max(150).optional(),
  idioma: z.string().max(10).optional(),
  nome_apresentador: z.string().max(120).optional(),
  avatar_apresentador_url: z.string().url().max(500).optional(),
});

router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data = parsed.data;

  const baseSlug = slugify(data.slug || data.nome);
  const slug = await uniqueSlug(req.accountId, baseSlug);

  const [result] = await pool.query(
    `INSERT INTO webinars (account_id, nome, titulo, slug, idioma, nome_apresentador,
       avatar_apresentador_url, criado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.accountId,
      data.nome,
      data.titulo || null,
      slug,
      data.idioma || 'pt-BR',
      data.nome_apresentador || null,
      data.avatar_apresentador_url || null,
      req.userId,
    ],
  );

  res.status(201).json({ id: result.insertId, slug });
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM webinars WHERE id = ? AND account_id = ? LIMIT 1',
    [req.params.id, req.accountId],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Webinar não encontrado' });
  res.json(rows[0]);
});

router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, nome, titulo, slug, status, criado_em FROM webinars WHERE account_id = ? ORDER BY criado_em DESC',
    [req.accountId],
  );
  res.json(rows);
});

// ETAPA 2 (agendamento) + ETAPA 8 (audiência) — mesmo registro principal
const updateSchema = z.object({
  nome: z.string().min(1).max(150).optional(),
  titulo: z.string().max(255).optional(),
  idioma: z.string().max(10).optional(),
  nome_apresentador: z.string().max(120).optional(),
  avatar_apresentador_url: z.string().url().max(500).optional(),
  tipo_agendamento: z.enum(['unico', 'just_in_time']).optional(),
  repeticao_automatica: z.boolean().optional(),
  data_inicio: z.string().datetime().nullable().optional(),
  data_fim: z.string().datetime().nullable().optional(),
  fuso_horario: z.string().max(60).optional(),
  usar_sala_espera: z.boolean().optional(),
  tipo_audiencia: z.enum(['nenhuma', 'fixa', 'dinamica']).optional(),
});

const COLUMN_MAP = {
  nome: 'nome',
  titulo: 'titulo',
  idioma: 'idioma',
  nome_apresentador: 'nome_apresentador',
  avatar_apresentador_url: 'avatar_apresentador_url',
  tipo_agendamento: 'tipo_agendamento',
  repeticao_automatica: 'repeticao_automatica',
  data_inicio: 'data_inicio',
  data_fim: 'data_fim',
  fuso_horario: 'fuso_horario',
  usar_sala_espera: 'usar_sala_espera',
  tipo_audiencia: 'tipo_audiencia',
};

router.put('/:id', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data = parsed.data;

  const fields = Object.keys(data).filter((k) => COLUMN_MAP[k]);
  if (fields.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

  const setClause = fields.map((f) => `${COLUMN_MAP[f]} = ?`).join(', ');
  const values = fields.map((f) => (typeof data[f] === 'boolean' ? (data[f] ? 1 : 0) : data[f]));

  const [result] = await pool.query(
    `UPDATE webinars SET ${setClause} WHERE id = ? AND account_id = ?`,
    [...values, req.params.id, req.accountId],
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Webinar não encontrado' });

  res.json({ ok: true });
});

// ETAPA 12 — publicação
router.post('/:id/publish', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT slug FROM webinars WHERE id = ? AND account_id = ? LIMIT 1',
    [req.params.id, req.accountId],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Webinar não encontrado' });

  await pool.query('UPDATE webinars SET status = ? WHERE id = ? AND account_id = ?', [
    'ativo',
    req.params.id,
    req.accountId,
  ]);

  const [[account]] = await pool.query('SELECT subdominio FROM accounts WHERE id = ?', [req.accountId]);
  const baseDomain = process.env.APP_BASE_DOMAIN || 'webnarpro.com.br';
  const baseUrl = `https://${account.subdominio}.${baseDomain}/${rows[0].slug}`;

  res.json({
    salaPrincipal: baseUrl,
    magicLink: `${baseUrl}?magic=1`,
    replay: `${baseUrl}/replay`,
  });
});

// ETAPA 4 — associação do vídeo já enviado à biblioteca
const videoConfigSchema = z.object({
  video_id: z.number().int().positive().nullable().optional(),
  video_autoplay: z.boolean().optional(),
  video_fullscreen: z.boolean().optional(),
  ocultar_barra_progresso: z.boolean().optional(),
  bloquear_avanco_video: z.boolean().optional(),
});

router.put('/:id/video', async (req, res) => {
  const parsed = videoConfigSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data = parsed.data;

  if (data.video_id) {
    const [videoRows] = await pool.query(
      'SELECT id FROM videos WHERE id = ? AND account_id = ? LIMIT 1',
      [data.video_id, req.accountId],
    );
    if (videoRows.length === 0) return res.status(400).json({ error: 'Vídeo não encontrado nesta conta' });
  }

  const fieldMap = {
    video_id: 'video_id',
    video_autoplay: 'video_autoplay',
    video_fullscreen: 'video_fullscreen',
    ocultar_barra_progresso: 'ocultar_barra_progresso',
    bloquear_avanco_video: 'bloquear_avanco_video',
  };
  const fields = Object.keys(data).filter((k) => fieldMap[k]);
  if (fields.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

  const setClause = fields.map((f) => `${fieldMap[f]} = ?`).join(', ');
  const values = fields.map((f) => (typeof data[f] === 'boolean' ? (data[f] ? 1 : 0) : data[f]));

  const [result] = await pool.query(
    `UPDATE webinars SET ${setClause} WHERE id = ? AND account_id = ?`,
    [...values, req.params.id, req.accountId],
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Webinar não encontrado' });

  res.json({ ok: true });
});

module.exports = router;
