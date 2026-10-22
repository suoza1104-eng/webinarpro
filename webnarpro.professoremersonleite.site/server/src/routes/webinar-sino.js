// Configuracao da integracao com o Sino por webinar (etapa "Sino / IA do chat" do assistente)
// e biblioteca de prompts reutilizaveis.
const express = require('express');
const { z } = require('zod');
const pool = require('../db');
const { requireAuth } = require('../middlewares/auth');
const sinoChannel = require('../services/sino-channel');

const router = express.Router();
router.use(requireAuth);

const PROMPT_MODELO = `Você é a assistente da equipe do Professor Emerson Leite atendendo o chat de uma aula ao vivo.

SOBRE A AULA
- Tema: [do que é a aula]
- Para quem é: [perfil de quem está assistindo]
- Objetivo da live: [ex.: apresentar a Comunidade FERA no final]

COMO RESPONDER
- Respostas curtas (até 3 frases), tom acolhedor e direto, sem enrolação.
- Dúvida sobre o conteúdo: responda e incentive a continuar assistindo.
- Dúvida sobre a oferta: use só os dados da oferta (preço, bônus, link). Nunca invente desconto, prazo ou condição.
- Problema técnico (áudio, vídeo, acesso): oriente a recarregar a página e, se não resolver, passe para o suporte.

NUNCA
- Prometer resultado financeiro ou garantia que não esteja na oferta.
- Pedir dados de cartão, senha ou documentos.
- Falar de preço antes do momento da oferta, se o aluno ainda não chegou nela.

PASSE PARA UM HUMANO QUANDO
- O aluno pedir para falar com uma pessoa.
- Houver problema de pagamento, cobrança ou reclamação.
- Você não tiver certeza da resposta.

OBJEÇÕES COMUNS E RESPOSTAS
- [objeção]: [resposta]`;

async function ownedWebinar(id, accountId) {
  const [rows] = await pool.query('SELECT id FROM webinars WHERE id = ? AND account_id = ? LIMIT 1', [id, accountId]);
  return rows[0]?.id || null;
}

router.get('/agents', async (req, res) => {
  res.json(await sinoChannel.listAgents());
});

router.get('/prompt-modelo', (req, res) => {
  res.json({ conteudo: PROMPT_MODELO });
});

// ---------- biblioteca de prompts ----------
router.get('/prompts', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, nome, objetivo, conteudo, atualizado_em FROM prompt_templates WHERE account_id = ? ORDER BY nome',
    [req.accountId],
  );
  res.json(rows);
});

const promptSchema = z.object({
  nome: z.string().min(1).max(120),
  objetivo: z.enum(['venda', 'captacao', 'conteudo', 'onboarding', 'outro']).default('venda'),
  conteudo: z.string().min(1).max(20000),
});

router.post('/prompts', async (req, res) => {
  const parsed = promptSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Preencha nome e conteúdo do prompt' });
  const [r] = await pool.query(
    'INSERT INTO prompt_templates (account_id, nome, objetivo, conteudo) VALUES (?, ?, ?, ?)',
    [req.accountId, parsed.data.nome, parsed.data.objetivo, parsed.data.conteudo],
  );
  res.status(201).json({ id: r.insertId });
});

router.put('/prompts/:id', async (req, res) => {
  const parsed = promptSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Preencha nome e conteúdo do prompt' });
  const [r] = await pool.query(
    'UPDATE prompt_templates SET nome = ?, objetivo = ?, conteudo = ? WHERE id = ? AND account_id = ?',
    [parsed.data.nome, parsed.data.objetivo, parsed.data.conteudo, req.params.id, req.accountId],
  );
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Prompt não encontrado' });
  res.json({ ok: true });
});

router.delete('/prompts/:id', async (req, res) => {
  await pool.query('DELETE FROM prompt_templates WHERE id = ? AND account_id = ?', [req.params.id, req.accountId]);
  res.json({ ok: true });
});

// ---------- config por webinar ----------
function configToJson(c) {
  return {
    habilitado: !!c?.habilitado,
    atuacao: c?.atuacao || 'ao_vivo',
    objetivo: c?.objetivo || 'venda',
    prompt: c?.prompt || '',
    agenteId: c?.agente_id || '',
    agenteNome: c?.agente_nome || '',
    setorVenda: c?.setor_venda || '',
    setorSuporte: c?.setor_suporte || '',
    followupHabilitado: c ? !!c.followup_habilitado : true,
    followupDias: c?.followup_dias || '1,3',
    followupTemplate1: c?.followup_template_1 || '',
    followupTemplate2: c?.followup_template_2 || '',
    followupPublico: c?.followup_publico || 'chat',
    limiteRespostasIa: c?.limite_respostas_ia ?? 20,
    segurarChat: !!c?.segurar_chat,
    contextoEnviadoEm: c?.contexto_enviado_em || null,
    fimLiveEnviadoPara: c?.fim_live_enviado_para || null,
  };
}

router.get('/:webinarId/config', async (req, res) => {
  const webinarId = await ownedWebinar(req.params.webinarId, req.accountId);
  if (!webinarId) return res.status(404).json({ error: 'Webinar não encontrado' });
  const cfg = await sinoChannel.getConfig(webinarId, { fresh: true });
  res.json(configToJson(cfg));
});

const configSchema = z.object({
  habilitado: z.boolean(),
  atuacao: z.enum(['ao_vivo', 'ao_vivo_replay']),
  objetivo: z.enum(['venda', 'captacao', 'conteudo', 'onboarding', 'outro']),
  prompt: z.string().max(20000).optional().default(''),
  agenteId: z.string().max(64).optional().default(''),
  agenteNome: z.string().max(120).optional().default(''),
  setorVenda: z.string().max(64).optional().default(''),
  setorSuporte: z.string().max(64).optional().default(''),
  followupHabilitado: z.boolean(),
  followupDias: z.string().regex(/^\d{1,2}(,\d{1,2}){0,2}$/, 'Dias do follow-up no formato 1,3'),
  followupTemplate1: z.string().max(120).optional().default(''),
  followupTemplate2: z.string().max(120).optional().default(''),
  followupPublico: z.enum(['chat', 'todos_presentes']),
  limiteRespostasIa: z.number().int().min(1).max(200),
  segurarChat: z.boolean(),
});

router.put('/:webinarId/config', async (req, res) => {
  const webinarId = await ownedWebinar(req.params.webinarId, req.accountId);
  if (!webinarId) return res.status(404).json({ error: 'Webinar não encontrado' });
  const parsed = configSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return res.status(400).json({ error: first?.message || 'Configuração inválida' });
  }
  const d = parsed.data;
  if (d.habilitado && !d.prompt.trim()) {
    return res.status(400).json({ error: 'Escreva o prompt do webinar antes de ligar a integração' });
  }
  await pool.query(
    `INSERT INTO webinar_sino_config
       (webinar_id, habilitado, atuacao, objetivo, prompt, agente_id, agente_nome, setor_venda, setor_suporte,
        followup_habilitado, followup_dias, followup_template_1, followup_template_2, followup_publico,
        limite_respostas_ia, segurar_chat)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE habilitado = VALUES(habilitado), atuacao = VALUES(atuacao), objetivo = VALUES(objetivo),
       prompt = VALUES(prompt), agente_id = VALUES(agente_id), agente_nome = VALUES(agente_nome),
       setor_venda = VALUES(setor_venda), setor_suporte = VALUES(setor_suporte),
       followup_habilitado = VALUES(followup_habilitado), followup_dias = VALUES(followup_dias),
       followup_template_1 = VALUES(followup_template_1), followup_template_2 = VALUES(followup_template_2),
       followup_publico = VALUES(followup_publico), limite_respostas_ia = VALUES(limite_respostas_ia),
       segurar_chat = VALUES(segurar_chat)`,
    [webinarId, d.habilitado ? 1 : 0, d.atuacao, d.objetivo, d.prompt, d.agenteId || null, d.agenteNome || null,
      d.setorVenda || null, d.setorSuporte || null, d.followupHabilitado ? 1 : 0, d.followupDias,
      d.followupTemplate1 || null, d.followupTemplate2 || null, d.followupPublico, d.limiteRespostasIa, d.segurarChat ? 1 : 0],
  );
  sinoChannel.invalidateConfig(webinarId);
  const ctx = await sinoChannel.enqueueContext(webinarId);
  res.json({ ok: true, contexto: ctx });
});

// Previa do contexto que vai pro Sino (montado automaticamente da configuracao do webinar)
router.get('/:webinarId/context', async (req, res) => {
  const webinarId = await ownedWebinar(req.params.webinarId, req.accountId);
  if (!webinarId) return res.status(404).json({ error: 'Webinar não encontrado' });
  res.json(await sinoChannel.buildContext(webinarId));
});

router.post('/:webinarId/segurar-chat', async (req, res) => {
  const webinarId = await ownedWebinar(req.params.webinarId, req.accountId);
  if (!webinarId) return res.status(404).json({ error: 'Webinar não encontrado' });
  const ligado = !!req.body?.ligado;
  await pool.query(
    'INSERT INTO webinar_sino_config (webinar_id, segurar_chat) VALUES (?, ?) ON DUPLICATE KEY UPDATE segurar_chat = VALUES(segurar_chat)',
    [webinarId, ligado ? 1 : 0],
  );
  sinoChannel.invalidateConfig(webinarId);
  res.json({ ok: true, segurarChat: ligado });
});

module.exports = router;
