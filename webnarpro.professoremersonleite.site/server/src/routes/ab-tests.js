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
      'SELECT id FROM ab_tests WHERE account_id = ? AND slug = ? LIMIT 1',
      [accountId, slug],
    );
    if (rows.length === 0) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

const ROTULOS = ['A', 'B', 'C', 'D', 'E', 'F'];

const variantSchema = z.object({
  webinar_id: z.number().int().positive(),
  peso: z.number().int().min(1).max(100).default(50),
});

const upsertSchema = z.object({
  nome: z.string().min(1).max(150),
  slug: z.string().min(1).max(150).optional(),
  status: z.enum(['rascunho', 'ativo', 'finalizado']).optional(),
  variants: z.array(variantSchema).min(2, 'Escolha pelo menos 2 variantes').max(6),
});

async function replaceVariants(connection, abTestId, accountId, variants) {
  for (const v of variants) {
    const [webRows] = await connection.query(
      'SELECT id FROM webinars WHERE id = ? AND account_id = ? LIMIT 1',
      [v.webinar_id, accountId],
    );
    if (webRows.length === 0) throw Object.assign(new Error('Webinar inválido em uma das variantes'), { status: 400 });
  }
  await connection.query('DELETE FROM ab_test_variants WHERE ab_test_id = ?', [abTestId]);
  for (let i = 0; i < variants.length; i++) {
    await connection.query(
      'INSERT INTO ab_test_variants (ab_test_id, webinar_id, rotulo, peso) VALUES (?, ?, ?, ?)',
      [abTestId, variants[i].webinar_id, ROTULOS[i] || String(i + 1), variants[i].peso],
    );
  }
}

router.get('/', async (req, res) => {
  const [tests] = await pool.query(
    'SELECT id, nome, slug, status, criado_em FROM ab_tests WHERE account_id = ? ORDER BY criado_em DESC',
    [req.accountId],
  );
  const [variants] = await pool.query(
    `SELECT v.ab_test_id, v.rotulo, v.peso, w.nome AS webinar_nome
     FROM ab_test_variants v
     JOIN webinars w ON w.id = v.webinar_id
     WHERE v.ab_test_id IN (?)`,
    [tests.length ? tests.map((t) => t.id) : [0]],
  );
  const byTest = {};
  for (const v of variants) {
    (byTest[v.ab_test_id] = byTest[v.ab_test_id] || []).push(v);
  }
  res.json(tests.map((t) => ({ ...t, variants: byTest[t.id] || [] })));
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM ab_tests WHERE id = ? AND account_id = ? LIMIT 1',
    [req.params.id, req.accountId],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Teste A/B não encontrado' });
  const [variants] = await pool.query(
    `SELECT v.id, v.webinar_id, v.rotulo, v.peso, w.nome AS webinar_nome, w.slug AS webinar_slug
     FROM ab_test_variants v JOIN webinars w ON w.id = v.webinar_id
     WHERE v.ab_test_id = ? ORDER BY v.rotulo`,
    [rows[0].id],
  );
  res.json({ ...rows[0], variants });
});

router.post('/', async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' });
  const data = parsed.data;

  const baseSlug = slugify(data.slug || data.nome);
  const slug = await uniqueSlug(req.accountId, baseSlug);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      'INSERT INTO ab_tests (account_id, nome, slug, status) VALUES (?, ?, ?, ?)',
      [req.accountId, data.nome, slug, data.status || 'ativo'],
    );
    await replaceVariants(connection, result.insertId, req.accountId, data.variants);
    await connection.commit();
    res.status(201).json({ id: result.insertId, slug });
  } catch (err) {
    await connection.rollback();
    res.status(err.status || 500).json({ error: err.message || 'Erro ao criar Teste A/B' });
  } finally {
    connection.release();
  }
});

router.put('/:id', async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' });
  const data = parsed.data;

  const [owned] = await pool.query(
    'SELECT id, slug FROM ab_tests WHERE id = ? AND account_id = ? LIMIT 1',
    [req.params.id, req.accountId],
  );
  if (owned.length === 0) return res.status(404).json({ error: 'Teste A/B não encontrado' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      'UPDATE ab_tests SET nome = ?, status = ? WHERE id = ? AND account_id = ?',
      [data.nome, data.status || 'ativo', req.params.id, req.accountId],
    );
    await replaceVariants(connection, req.params.id, req.accountId, data.variants);
    await connection.commit();
    res.json({ ok: true });
  } catch (err) {
    await connection.rollback();
    res.status(err.status || 500).json({ error: err.message || 'Erro ao salvar Teste A/B' });
  } finally {
    connection.release();
  }
});

router.delete('/:id', async (req, res) => {
  const [result] = await pool.query(
    'DELETE FROM ab_tests WHERE id = ? AND account_id = ?',
    [req.params.id, req.accountId],
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Teste A/B não encontrado' });
  res.json({ ok: true });
});

router.get('/:id/results', async (req, res) => {
  const [tests] = await pool.query(
    'SELECT id, nome FROM ab_tests WHERE id = ? AND account_id = ? LIMIT 1',
    [req.params.id, req.accountId],
  );
  if (tests.length === 0) return res.status(404).json({ error: 'Teste A/B não encontrado' });

  const [variants] = await pool.query(
    `SELECT v.id, v.webinar_id, v.rotulo, v.peso, w.nome AS webinar_nome, w.slug AS webinar_slug
     FROM ab_test_variants v JOIN webinars w ON w.id = v.webinar_id
     WHERE v.ab_test_id = ? ORDER BY v.rotulo`,
    [req.params.id],
  );

  const results = [];
  for (const v of variants) {
    const [[{ exposicoes }]] = await pool.query(
      'SELECT COUNT(*) AS exposicoes FROM ab_test_assignments WHERE variant_id = ?',
      [v.id],
    );
    const [[{ leads }]] = await pool.query(
      'SELECT COUNT(*) AS leads FROM ab_test_assignments WHERE variant_id = ? AND lead_id IS NOT NULL',
      [v.id],
    );
    const [[stats]] = await pool.query(
      `SELECT COUNT(*) AS visualizacoes, COALESCE(AVG(vs.ultimo_marco_pct), 0) AS mediaAssistida,
              SUM(CASE WHEN vs.ultimo_marco_pct >= 100 THEN 1 ELSE 0 END) AS completos
       FROM ab_test_assignments a
       JOIN view_sessions vs ON vs.lead_id = a.lead_id AND vs.webinar_id = ?
       WHERE a.variant_id = ?`,
      [v.webinar_id, v.id],
    );

    const taxaCadastro = exposicoes > 0 ? (leads / exposicoes) * 100 : 0;
    const taxaConclusao = stats.visualizacoes > 0 ? (stats.completos / stats.visualizacoes) * 100 : 0;

    results.push({
      variantId: v.id,
      rotulo: v.rotulo,
      webinarNome: v.webinar_nome,
      webinarSlug: v.webinar_slug,
      peso: v.peso,
      exposicoes,
      leads,
      taxaCadastro: Number(taxaCadastro.toFixed(1)),
      mediaAssistidaPct: Number(Number(stats.mediaAssistida).toFixed(1)),
      taxaConclusao: Number(taxaConclusao.toFixed(1)),
    });
  }

  let winnerId = null;
  const withData = results.filter((r) => r.exposicoes > 0);
  if (withData.length > 0) {
    withData.sort((a, b) => b.taxaConclusao - a.taxaConclusao || b.leads - a.leads);
    winnerId = withData[0].variantId;
  }

  res.json({ testeNome: tests[0].nome, winnerId, results });
});

module.exports = router;
