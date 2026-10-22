// API do sininho de alertas do sistema (canto inferior direito do painel) - so administradores.
const express = require('express');
const { z } = require('zod');
const pool = require('../db');
const { requireAuth } = require('../middlewares/auth');
const alerts = require('../services/alerts');

const router = express.Router();
router.use(requireAuth);
router.use((req, res, next) => {
  if (req.userTipo !== 'administrador') return res.status(403).json({ error: 'Apenas administradores' });
  next();
});

router.get('/status', async (req, res) => {
  res.json(await alerts.getStatus());
});

// Serie historica pros mini graficos - ultimos N minutos (padrao 60, max 24h)
router.get('/metrics', async (req, res) => {
  const minutos = Math.min(1440, Math.max(5, Number(req.query.minutos) || 60));
  const [rows] = await pool.query(
    `SELECT coletado_em, estado, payload FROM system_metric_snapshots
     WHERE coletado_em > DATE_SUB(NOW(), INTERVAL ? MINUTE) ORDER BY coletado_em`,
    [minutos],
  );
  res.json(rows.map((r) => {
    const p = typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload;
    return { em: r.coletado_em, estado: r.estado, valores: p.values || {} };
  }));
});

router.get('/alerts', async (req, res) => {
  const dias = Math.min(180, Math.max(1, Number(req.query.dias) || 7));
  const params = [dias];
  let sql = `SELECT e.id, e.metrica, e.nivel, e.valor, e.limite, e.iniciado_em, e.encerrado_em,
                    e.reconhecido_em, e.silenciado_ate, u.nome AS reconhecido_por_nome
             FROM system_alert_events e LEFT JOIN users u ON u.id = e.reconhecido_por
             WHERE e.iniciado_em > DATE_SUB(NOW(), INTERVAL ? DAY)`;
  if (req.query.metrica) { sql += ' AND e.metrica = ?'; params.push(String(req.query.metrica)); }
  sql += ' ORDER BY e.iniciado_em DESC LIMIT 500';
  const [rows] = await pool.query(sql, params);
  res.json(rows.map((r) => ({
    ...r,
    label: alerts.RULES_BY_KEY[r.metrica]?.label || r.metrica,
    unidade: alerts.RULES_BY_KEY[r.metrica]?.unidade || '',
  })));
});

router.post('/alerts/:id/ack', async (req, res) => {
  await pool.query(
    'UPDATE system_alert_events SET reconhecido_por = ?, reconhecido_em = NOW() WHERE id = ?',
    [req.userId, req.params.id],
  );
  res.json({ ok: true });
});

const silenceSchema = z.object({ minutos: z.number().int().min(5).max(24 * 60) });
router.post('/alerts/:id/silence', async (req, res) => {
  const parsed = silenceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Informe os minutos (5 a 1440)' });
  await pool.query(
    'UPDATE system_alert_events SET silenciado_ate = DATE_ADD(NOW(), INTERVAL ? MINUTE), reconhecido_por = COALESCE(reconhecido_por, ?), reconhecido_em = COALESCE(reconhecido_em, NOW()) WHERE id = ?',
    [parsed.data.minutos, req.userId, req.params.id],
  );
  res.json({ ok: true });
});

router.get('/rules', async (req, res) => {
  const status = await alerts.getStatus();
  res.json(alerts.DEFAULT_RULES.map((d) => {
    const atual = status.metricas.find((m) => m.metrica === d.metrica) || {};
    return {
      metrica: d.metrica, grupo: d.grupo, label: d.label, unidade: d.unidade, direcao: d.direcao || 'acima',
      padraoAmarelo: d.amarelo, padraoVermelho: d.vermelho,
      amarelo: atual.amarelo ?? d.amarelo, vermelho: atual.vermelho ?? d.vermelho,
      habilitado: atual.habilitado ?? true,
    };
  }));
});

const rulesSchema = z.array(z.object({
  metrica: z.string().max(60),
  amarelo: z.number().nullable(),
  vermelho: z.number().nullable(),
  habilitado: z.boolean(),
}));
router.put('/rules', async (req, res) => {
  const parsed = rulesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Regras inválidas' });
  for (const r of parsed.data) {
    if (!alerts.RULES_BY_KEY[r.metrica]) continue;
    await pool.query(
      `INSERT INTO system_alert_rules (metrica, limite_amarelo, limite_vermelho, habilitado) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE limite_amarelo = VALUES(limite_amarelo), limite_vermelho = VALUES(limite_vermelho), habilitado = VALUES(habilitado)`,
      [r.metrica, r.amarelo, r.vermelho, r.habilitado ? 1 : 0],
    );
  }
  res.json({ ok: true });
});

router.delete('/rules', async (req, res) => {
  await pool.query('DELETE FROM system_alert_rules');
  res.json({ ok: true });
});

router.get('/channels', async (req, res) => {
  const [rows] = await pool.query('SELECT id, tipo, destino, nivel_minimo, habilitado FROM system_alert_channels ORDER BY id');
  res.json({ canais: rows, sinoConfigurado: !!process.env.SINO_WEBHOOK_URL });
});

const channelsSchema = z.array(z.object({
  tipo: z.enum(['sino', 'webhook']),
  destino: z.string().url().max(500).nullable().optional(),
  nivel_minimo: z.enum(['amarelo', 'vermelho']),
  habilitado: z.boolean(),
}));
router.put('/channels', async (req, res) => {
  const parsed = channelsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Canais inválidos (o webhook precisa de uma URL completa)' });
  if (parsed.data.some((c) => c.tipo === 'webhook' && !c.destino)) {
    return res.status(400).json({ error: 'Informe a URL do webhook' });
  }
  await pool.query('DELETE FROM system_alert_channels');
  for (const c of parsed.data) {
    await pool.query(
      'INSERT INTO system_alert_channels (tipo, destino, nivel_minimo, habilitado) VALUES (?, ?, ?, ?)',
      [c.tipo, c.tipo === 'webhook' ? c.destino : null, c.nivel_minimo, c.habilitado ? 1 : 0],
    );
  }
  res.json({ ok: true });
});

router.post('/test-alert', async (req, res) => {
  const status = await alerts.getStatus();
  const result = await alerts.notify(status.estado === 'verde' ? 'amarelo' : status.estado, status.alertas, { teste: true });
  if (result.canais === 0) return res.status(400).json({ error: 'Nenhum canal de notificação habilitado' });
  res.json(result);
});

router.post('/segurar-chat', async (req, res) => {
  await alerts.setSegurarChatGlobal(!!req.body?.ligado);
  res.json({ ok: true, chatMode: alerts.getChatMode() });
});

module.exports = router;
