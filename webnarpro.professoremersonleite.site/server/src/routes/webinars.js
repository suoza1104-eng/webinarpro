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
async function getOwnedWebinarId(webinarId, accountId, db = pool) {
  const [rows] = await db.query(
    'SELECT id FROM webinars WHERE id = ? AND account_id = ? LIMIT 1',
    [webinarId, accountId],
  );
  return rows.length > 0 ? rows[0].id : null;
}

function boolToTinyInt(value) {
  return value ? 1 : 0;
}

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
  audiencia_min_participantes: z.number().int().nonnegative().optional(),
  audiencia_max_participantes: z.number().int().nonnegative().optional(),
  mostrar_botao_ao_vivo: z.boolean().optional(),
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
  audiencia_min_participantes: 'audiencia_min_participantes',
  audiencia_max_participantes: 'audiencia_max_participantes',
  mostrar_botao_ao_vivo: 'mostrar_botao_ao_vivo',
};

router.put('/:id', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data = parsed.data;

  const fields = Object.keys(data).filter((k) => COLUMN_MAP[k]);
  if (fields.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

  const setClause = fields.map((f) => `${COLUMN_MAP[f]} = ?`).join(', ');
  const values = fields.map((f) => {
    if (typeof data[f] === 'boolean') return data[f] ? 1 : 0;
    if ((f === 'data_inicio' || f === 'data_fim') && data[f]) return new Date(data[f]);
    return data[f];
  });

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
  modo_youtube: z.boolean().optional(),
  modo_youtube_bloqueio_segundo: z.number().int().nonnegative().nullable().optional(),
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
    modo_youtube: 'modo_youtube',
    modo_youtube_bloqueio_segundo: 'modo_youtube_bloqueio_segundo',
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

const loginConfigSchema = z.object({
  logo_url: z.string().url().max(500).nullable().optional(),
  exibir_barra_progresso: z.boolean().optional(),
  progresso_inicial: z.number().int().min(0).max(100).optional(),
  pedir_whatsapp: z.boolean().optional(),
  pedir_empresa: z.boolean().optional(),
  titulo_botao: z.string().min(1).max(60).optional(),
  cor_botao: z.string().max(9).optional(),
  cor_texto_botao: z.string().max(9).optional(),
});

router.put('/:id/login-config', async (req, res) => {
  const parsed = loginConfigSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const webinarId = await getOwnedWebinarId(req.params.id, req.accountId);
  if (!webinarId) return res.status(404).json({ error: 'Webinar nÃ£o encontrado' });
  const data = parsed.data;

  await pool.query(
    `INSERT INTO webinar_login_config
      (webinar_id, logo_url, exibir_barra_progresso, progresso_inicial, pedir_whatsapp, pedir_empresa, titulo_botao, cor_botao, cor_texto_botao)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      logo_url = VALUES(logo_url),
      exibir_barra_progresso = VALUES(exibir_barra_progresso),
      progresso_inicial = VALUES(progresso_inicial),
      pedir_whatsapp = VALUES(pedir_whatsapp),
      pedir_empresa = VALUES(pedir_empresa),
      titulo_botao = VALUES(titulo_botao),
      cor_botao = VALUES(cor_botao),
      cor_texto_botao = VALUES(cor_texto_botao)`,
    [
      webinarId,
      data.logo_url || null,
      boolToTinyInt(data.exibir_barra_progresso ?? true),
      data.progresso_inicial ?? 0,
      boolToTinyInt(data.pedir_whatsapp ?? true),
      boolToTinyInt(data.pedir_empresa ?? false),
      data.titulo_botao || 'Entrar na Aula',
      data.cor_botao || '#1F9D57',
      data.cor_texto_botao || '#FFFFFF',
    ],
  );

  res.json({ ok: true });
});

const offerConfigSchema = z.object({
  nome_oferta: z.string().min(1).max(150),
  titulo_oferta: z.string().max(255).nullable().optional(),
  preco_original_centavos: z.number().int().nonnegative().nullable().optional(),
  preco_oferta_centavos: z.number().int().nonnegative(),
  texto_botao: z.string().min(1).max(80).optional(),
  cor_botao: z.string().max(9).optional(),
  layout_temporizador: z.enum(['classico', 'rotulos', 'urgente']).optional(),
  temporizador_segundos: z.number().int().nonnegative().optional(),
  imagem_desktop_url: z.string().url().max(500).nullable().optional(),
  imagem_mobile_url: z.string().url().max(500).nullable().optional(),
  inicio_pitch_segundos: z.number().int().nonnegative().nullable().optional(),
  inicio_oferta_segundos: z.number().int().nonnegative().nullable().optional(),
  fim_oferta_segundos: z.number().int().nonnegative().nullable().optional(),
  link_checkout: z.string().max(500).optional(),
  repassar_utms: z.boolean().optional(),
  oferta_desabilitada: z.boolean().optional(),
  sorteio_habilitado: z.boolean().optional(),
});

router.put('/:id/offer-config', async (req, res) => {
  const parsed = offerConfigSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const webinarId = await getOwnedWebinarId(req.params.id, req.accountId);
  if (!webinarId) return res.status(404).json({ error: 'Webinar nÃ£o encontrado' });
  const data = parsed.data;

  await pool.query(
    `INSERT INTO webinar_offer_config
      (webinar_id, nome_oferta, titulo_oferta, preco_original_centavos, preco_oferta_centavos, texto_botao, cor_botao,
       layout_temporizador, temporizador_segundos, imagem_desktop_url, imagem_mobile_url, inicio_pitch_segundos,
       inicio_oferta_segundos, fim_oferta_segundos, link_checkout, repassar_utms, oferta_desabilitada, sorteio_habilitado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      nome_oferta = VALUES(nome_oferta),
      titulo_oferta = VALUES(titulo_oferta),
      preco_original_centavos = VALUES(preco_original_centavos),
      preco_oferta_centavos = VALUES(preco_oferta_centavos),
      texto_botao = VALUES(texto_botao),
      cor_botao = VALUES(cor_botao),
      layout_temporizador = VALUES(layout_temporizador),
      temporizador_segundos = VALUES(temporizador_segundos),
      imagem_desktop_url = VALUES(imagem_desktop_url),
      imagem_mobile_url = VALUES(imagem_mobile_url),
      inicio_pitch_segundos = VALUES(inicio_pitch_segundos),
      inicio_oferta_segundos = VALUES(inicio_oferta_segundos),
      fim_oferta_segundos = VALUES(fim_oferta_segundos),
      link_checkout = VALUES(link_checkout),
      repassar_utms = VALUES(repassar_utms),
      oferta_desabilitada = VALUES(oferta_desabilitada),
      sorteio_habilitado = VALUES(sorteio_habilitado)`,
    [
      webinarId,
      data.nome_oferta,
      data.titulo_oferta || null,
      data.preco_original_centavos ?? null,
      data.preco_oferta_centavos,
      data.texto_botao || 'inscreva-se aqui',
      data.cor_botao || '#D93B3B',
      data.layout_temporizador || 'classico',
      data.temporizador_segundos ?? 300,
      data.imagem_desktop_url || null,
      data.imagem_mobile_url || null,
      data.inicio_pitch_segundos ?? null,
      data.inicio_oferta_segundos ?? null,
      data.fim_oferta_segundos ?? null,
      data.link_checkout || '',
      boolToTinyInt(data.repassar_utms ?? false),
      boolToTinyInt(data.oferta_desabilitada ?? false),
      boolToTinyInt(data.sorteio_habilitado ?? false),
    ],
  );

  res.json({ ok: true });
});

const chatMessagesSchema = z.object({
  messages: z.array(z.object({
    segundo_exibicao: z.number().int().nonnegative(),
    nome_exibido: z.string().min(1).max(80),
    mensagem: z.string().min(1).max(500),
    eh_suporte: z.boolean().optional(),
  })).max(500),
});

router.put('/:id/chat-messages', async (req, res) => {
  const parsed = chatMessagesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const webinarId = await getOwnedWebinarId(req.params.id, req.accountId, connection);
    if (!webinarId) {
      await connection.rollback();
      return res.status(404).json({ error: 'Webinar nÃ£o encontrado' });
    }
    await connection.query('DELETE FROM webinar_chat_messages WHERE webinar_id = ?', [webinarId]);
    for (const [idx, msg] of parsed.data.messages.entries()) {
      await connection.query(
        `INSERT INTO webinar_chat_messages (webinar_id, segundo_exibicao, nome_exibido, mensagem, eh_suporte, ordem)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [webinarId, msg.segundo_exibicao, msg.nome_exibido, msg.mensagem, boolToTinyInt(msg.eh_suporte ?? false), idx],
      );
    }
    await connection.commit();
    res.json({ ok: true });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

const salesNotificationsSchema = z.object({
  sales: z.array(z.object({
    segundo_exibicao: z.number().int().nonnegative(),
    nome_exibido: z.string().min(1).max(80),
    titulo_notificacao: z.string().min(1).max(120).optional(),
  })).max(500),
});

router.put('/:id/sales-notifications', async (req, res) => {
  const parsed = salesNotificationsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const webinarId = await getOwnedWebinarId(req.params.id, req.accountId, connection);
    if (!webinarId) {
      await connection.rollback();
      return res.status(404).json({ error: 'Webinar nÃ£o encontrado' });
    }
    await connection.query('DELETE FROM webinar_sales_notifications WHERE webinar_id = ?', [webinarId]);
    for (const sale of parsed.data.sales) {
      await connection.query(
        `INSERT INTO webinar_sales_notifications (webinar_id, segundo_exibicao, nome_exibido, titulo_notificacao)
         VALUES (?, ?, ?, ?)`,
        [webinarId, sale.segundo_exibicao, sale.nome_exibido, sale.titulo_notificacao || 'Venda confirmada!'],
      );
    }
    await connection.commit();
    res.json({ ok: true });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

const chatbotKeywordsSchema = z.object({
  keywords: z.array(z.object({
    remetente_exibido: z.string().min(1).max(80),
    palavra_chave: z.string().min(1).max(120),
    resposta_automatica: z.string().min(1).max(500),
    delay_segundos: z.number().int().nonnegative().optional(),
    imagem_url: z.string().url().max(500).nullable().optional(),
  })).max(500),
});

router.put('/:id/chatbot-keywords', async (req, res) => {
  const parsed = chatbotKeywordsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const webinarId = await getOwnedWebinarId(req.params.id, req.accountId, connection);
    if (!webinarId) {
      await connection.rollback();
      return res.status(404).json({ error: 'Webinar nÃ£o encontrado' });
    }
    await connection.query('DELETE FROM webinar_chatbot_keywords WHERE webinar_id = ?', [webinarId]);
    for (const keyword of parsed.data.keywords) {
      await connection.query(
        `INSERT INTO webinar_chatbot_keywords (webinar_id, remetente_exibido, palavra_chave, resposta_automatica, delay_segundos, imagem_url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          webinarId,
          keyword.remetente_exibido,
          keyword.palavra_chave,
          keyword.resposta_automatica,
          keyword.delay_segundos ?? 5,
          keyword.imagem_url || null,
        ],
      );
    }
    await connection.commit();
    res.json({ ok: true });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

// DUPLICAR WEBINAR
router.post('/:id/duplicate', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT * FROM webinars WHERE id = ? AND account_id = ? LIMIT 1',
      [req.params.id, req.accountId]
    );
    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Webinar não encontrado' });
    }

    const orig = rows[0];
    const newName = `${orig.nome} (Cópia)`;
    const baseSlug = slugify(orig.slug || newName);
    const newSlug = await uniqueSlug(req.accountId, baseSlug);

    const [dupResult] = await connection.query(
      `INSERT INTO webinars (
        account_id, nome, titulo, slug, idioma, nome_apresentador, avatar_apresentador_url,
        tipo_agendamento, repeticao_automatica, data_inicio, data_fim, fuso_horario,
        usar_sala_espera, video_id, video_autoplay, video_fullscreen, ocultar_barra_progresso,
        bloquear_avanco_video, modo_youtube, modo_youtube_bloqueio_segundo, tipo_audiencia,
        audiencia_min_participantes, audiencia_max_participantes, mostrar_botao_ao_vivo,
        status, criado_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.accountId, newName, orig.titulo, newSlug, orig.idioma, orig.nome_apresentador,
        orig.avatar_apresentador_url, orig.tipo_agendamento, orig.repeticao_automatica,
        orig.data_inicio, orig.data_fim, orig.fuso_horario, orig.usar_sala_espera,
        orig.video_id, orig.video_autoplay, orig.video_fullscreen, orig.ocultar_barra_progresso,
        orig.bloquear_avanco_video, orig.modo_youtube, orig.modo_youtube_bloqueio_segundo,
        orig.tipo_audiencia, orig.audiencia_min_participantes, orig.audiencia_max_participantes,
        orig.mostrar_botao_ao_vivo, 'rascunho', req.userId
      ]
    );

    const newId = dupResult.insertId;

    // Copiar webinar_login_config
    const [loginRows] = await connection.query(
      'SELECT * FROM webinar_login_config WHERE webinar_id = ? LIMIT 1',
      [orig.id]
    );
    if (loginRows.length > 0) {
      const l = loginRows[0];
      await connection.query(
        `INSERT INTO webinar_login_config (webinar_id, logo_url, exibir_barra_progresso, progresso_inicial, pedir_whatsapp, pedir_empresa, titulo_botao, cor_botao, cor_texto_botao)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, l.logo_url, l.exibir_barra_progresso, l.progresso_inicial, l.pedir_whatsapp, l.pedir_empresa, l.titulo_botao, l.cor_botao, l.cor_texto_botao]
      );
    }

    // Copiar webinar_offer_config
    const [offerRows] = await connection.query(
      'SELECT * FROM webinar_offer_config WHERE webinar_id = ? LIMIT 1',
      [orig.id]
    );
    if (offerRows.length > 0) {
      const o = offerRows[0];
      await connection.query(
        `INSERT INTO webinar_offer_config (webinar_id, nome_oferta, titulo_oferta, preco_original_centavos, preco_oferta_centavos, texto_botao, cor_botao, layout_temporizador, temporizador_segundos, imagem_desktop_url, imagem_mobile_url, inicio_pitch_segundos, inicio_oferta_segundos, fim_oferta_segundos, link_checkout, repassar_utms, oferta_desabilitada, sorteio_habilitado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, o.nome_oferta, o.titulo_oferta, o.preco_original_centavos, o.preco_oferta_centavos, o.texto_botao, o.cor_botao, o.layout_temporizador, o.temporizador_segundos, o.imagem_desktop_url, o.imagem_mobile_url, o.inicio_pitch_segundos, o.inicio_oferta_segundos, o.fim_oferta_segundos, o.link_checkout, o.repassar_utms, o.oferta_desabilitada, o.sorteio_habilitado]
      );
    }

    // Copiar webinar_chat_messages
    const [chatRows] = await connection.query(
      'SELECT segundo_exibicao, nome_exibido, mensagem, eh_suporte, ordem FROM webinar_chat_messages WHERE webinar_id = ?',
      [orig.id]
    );
    for (const msg of chatRows) {
      await connection.query(
        `INSERT INTO webinar_chat_messages (webinar_id, segundo_exibicao, nome_exibido, mensagem, eh_suporte, ordem)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newId, msg.segundo_exibicao, msg.nome_exibido, msg.mensagem, msg.eh_suporte, msg.ordem]
      );
    }

    // Copiar webinar_sales_notifications
    const [salesRows] = await connection.query(
      'SELECT segundo_exibicao, nome_exibido, titulo_notificacao FROM webinar_sales_notifications WHERE webinar_id = ?',
      [orig.id]
    );
    for (const sale of salesRows) {
      await connection.query(
        `INSERT INTO webinar_sales_notifications (webinar_id, segundo_exibicao, nome_exibido, titulo_notificacao)
         VALUES (?, ?, ?, ?)`,
        [newId, sale.segundo_exibicao, sale.nome_exibido, sale.titulo_notificacao]
      );
    }

    // Copiar webinar_chatbot_keywords
    const [kwRows] = await connection.query(
      'SELECT remetente_exibido, palavra_chave, resposta_automatica, delay_segundos, imagem_url FROM webinar_chatbot_keywords WHERE webinar_id = ?',
      [orig.id]
    );
    for (const kw of kwRows) {
      await connection.query(
        `INSERT INTO webinar_chatbot_keywords (webinar_id, remetente_exibido, palavra_chave, resposta_automatica, delay_segundos, imagem_url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newId, kw.remetente_exibido, kw.palavra_chave, kw.resposta_automatica, kw.delay_segundos, kw.imagem_url]
      );
    }

    await connection.commit();
    connection.release();

    res.status(201).json({ id: newId, slug: newSlug, nome: newName });
  } catch (err) {
    await connection.rollback();
    connection.release();
    req.log?.error(err, 'Erro ao duplicar webinar');
    res.status(500).json({ error: 'Erro ao duplicar webinar: ' + err.message });
  }
});

// EXCLUIR WEBINAR
router.delete('/:id', async (req, res) => {
  const [result] = await pool.query(
    'DELETE FROM webinars WHERE id = ? AND account_id = ?',
    [req.params.id, req.accountId]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Webinar não encontrado' });
  res.json({ ok: true });
});

module.exports = router;
