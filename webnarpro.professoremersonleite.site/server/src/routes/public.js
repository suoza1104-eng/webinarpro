const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const pool = require('../db');
const { requireLeadAuth } = require('../middlewares/auth');
const bunny = require('../services/bunny');

const router = express.Router();

// 7a — dados públicos da sala (antes do cadastro do lead)
router.get('/webinars/:slug', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT w.titulo, w.nome_apresentador, w.avatar_apresentador_url, w.status,
            w.data_inicio, w.data_fim, w.fuso_horario, w.usar_sala_espera
     FROM webinars w
     WHERE w.slug = ? LIMIT 1`,
    [req.params.slug],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Webinar não encontrado' });

  const w = rows[0];
  const [loginConfigRows] = await pool.query(
    `SELECT lc.* FROM webinar_login_config lc
     JOIN webinars w ON w.id = lc.webinar_id
     WHERE w.slug = ? LIMIT 1`,
    [req.params.slug],
  );

  res.json({
    titulo: w.titulo,
    nomeApresentador: w.nome_apresentador,
    avatarApresentadorUrl: w.avatar_apresentador_url,
    status: w.status,
    dataInicio: w.data_inicio,
    dataFim: w.data_fim,
    fusoHorario: w.fuso_horario,
    usarSalaEspera: !!w.usar_sala_espera,
    loginConfig: loginConfigRows[0] || null,
  });
});

// 7b — registro do lead
const registerLimiter = rateLimit({ windowMs: 60 * 1000, limit: 5 });

const registerSchema = z.object({
  nome: z.string().min(1).max(150),
  email: z.string().email().max(160),
  whatsapp: z.string().max(30).optional(),
  empresa: z.string().max(150).optional(),
});

router.post('/webinars/:slug/register', registerLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data = parsed.data;

  const [webinarRows] = await pool.query('SELECT id FROM webinars WHERE slug = ? LIMIT 1', [req.params.slug]);
  if (webinarRows.length === 0) return res.status(404).json({ error: 'Webinar não encontrado' });
  const webinarId = webinarRows[0].id;

  const ip = req.ip;
  await pool.query(
    `INSERT INTO leads (webinar_id, nome, email, whatsapp, empresa, ip_cadastro)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE nome = VALUES(nome), whatsapp = VALUES(whatsapp), empresa = VALUES(empresa)`,
    [webinarId, data.nome, data.email, data.whatsapp || null, data.empresa || null, ip],
  );

  const [leadRows] = await pool.query(
    'SELECT id FROM leads WHERE webinar_id = ? AND email = ? LIMIT 1',
    [webinarId, data.email],
  );
  const leadId = leadRows[0].id;

  const token = jwt.sign({ leadId, webinarId }, process.env.JWT_SECRET, { expiresIn: '6h' });
  res.status(201).json({ token, leadId });
});

// 7c — dados da sala (vídeo + chat/vendas simulados)
router.get('/webinars/:slug/room', requireLeadAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT w.id, w.status, w.video_id, w.video_autoplay, w.video_fullscreen,
            w.ocultar_barra_progresso, w.bloquear_avanco_video,
            w.modo_youtube, w.modo_youtube_bloqueio_segundo,
            w.data_inicio, w.data_fim, w.fuso_horario, w.usar_sala_espera
     FROM webinars w WHERE w.slug = ? LIMIT 1`,
    [req.params.slug],
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Webinar não encontrado' });
  const w = rows[0];

  if (w.id !== req.webinarId) return res.status(403).json({ error: 'Token não pertence a este webinar' });

  let video = null;
  if (w.video_id) {
    const [videoRows] = await pool.query(
      'SELECT bunny_video_id, status_processamento, duracao_segundos FROM videos WHERE id = ? LIMIT 1',
      [w.video_id],
    );
    if (videoRows.length > 0 && videoRows[0].bunny_video_id) {
      video = {
        url: bunny.playbackUrl(videoRows[0].bunny_video_id),
        status: videoRows[0].status_processamento,
        duracaoSegundos: videoRows[0].duracao_segundos,
        autoplay: !!w.video_autoplay,
        fullscreen: !!w.video_fullscreen,
        ocultarBarraProgresso: !!w.ocultar_barra_progresso,
        bloquearAvancoVideo: !!w.bloquear_avanco_video,
        modoYoutube: !!w.modo_youtube,
        bloqueioSegundo: w.modo_youtube_bloqueio_segundo,
      };
    }
  }

  const [chatMessages] = await pool.query(
    `SELECT segundo_exibicao AS segundoExibicao, nome_exibido AS nomeExibido, mensagem, eh_suporte AS ehSuporte
     FROM webinar_chat_messages WHERE webinar_id = ? ORDER BY segundo_exibicao, ordem`,
    [w.id],
  );
  const [salesNotifications] = await pool.query(
    `SELECT segundo_exibicao AS segundoExibicao, nome_exibido AS nomeExibido, titulo_notificacao AS tituloNotificacao
     FROM webinar_sales_notifications WHERE webinar_id = ? ORDER BY segundo_exibicao`,
    [w.id],
  );

  res.json({
    status: w.status,
    dataInicio: w.data_inicio,
    dataFim: w.data_fim,
    fusoHorario: w.fuso_horario,
    usarSalaEspera: !!w.usar_sala_espera,
    video,
    chatMessages,
    salesNotifications,
  });
});

// 7d — chatbot por palavra-chave
router.post('/webinars/:slug/chat-lookup', requireLeadAuth, async (req, res) => {
  const texto = (req.body?.texto || '').toString().toLowerCase();
  if (!texto) return res.json({ match: false });

  const [webinarRows] = await pool.query('SELECT id FROM webinars WHERE slug = ? LIMIT 1', [req.params.slug]);
  if (webinarRows.length === 0) return res.status(404).json({ error: 'Webinar não encontrado' });

  const [keywords] = await pool.query(
    'SELECT palavra_chave, resposta_automatica, delay_segundos FROM webinar_chatbot_keywords WHERE webinar_id = ?',
    [webinarRows[0].id],
  );
  const found = keywords.find((k) => texto.includes(k.palavra_chave.toLowerCase()));
  if (!found) return res.json({ match: false });

  res.json({ match: true, resposta: found.resposta_automatica, delaySegundos: found.delay_segundos });
});

// 7e — heartbeat de progresso (marcos 0/25/50/75/100)
const heartbeatLimiter = rateLimit({ windowMs: 60 * 1000, limit: 6 });

router.post('/webinars/:slug/heartbeat', heartbeatLimiter, requireLeadAuth, async (req, res) => {
  const marco = Number(req.body?.marco);
  if (![0, 25, 50, 75, 100].includes(marco)) return res.status(400).json({ error: 'Marco inválido' });

  await pool.query(
    `INSERT INTO view_sessions (webinar_id, lead_id, ultimo_marco_pct)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE ultimo_marco_pct = GREATEST(ultimo_marco_pct, VALUES(ultimo_marco_pct))`,
    [req.webinarId, req.leadId, marco],
  );

  res.json({ ok: true });
});

module.exports = router;
