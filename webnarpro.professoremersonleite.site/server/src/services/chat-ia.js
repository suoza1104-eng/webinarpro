// IA do chat da sala, direto na OpenAI (sem passar pelo Sino). Responde as duvidas dos alunos
// como "Equipe", na conversa privada do aluno (atendimentos), so pra webinars com
// webinar_chat_ia_config.habilitado = 1.
//
// Regras:
//  - Espera o aluno ficar `espera_segundos` (padrao 120s) sem mandar nada novo e responde tudo
//    de uma vez, numa mensagem so, comecando pelo primeiro nome dele.
//  - Triagem com modelo barato decide se responde (resposta a pergunta do professor, relato
//    solto etc. ficam sem resposta). Duvida simples: responde o mesmo modelo barato; venda,
//    objecao e duvida tecnica: modelo melhor.
//  - Humano assumiu a conversa (atendente_id) ou respondeu por ultimo: a IA nao entra.
//  - Precisa de pessoa (pagamento sem cartao, problema na compra...): a IA responde, pausa a
//    conversa (ia_pausada) e devolve pra "Pendentes" no painel.
//  - Chat retido (sistema no vermelho / "segurar chat"): nao responde nada.
const pool = require('../db');
const atendimentoSvc = require('./atendimento');
const PROMPTS = require('./chat-ia-prompt');

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const WORKER_MS = 5000;
const LOTE = 12;
const PARALELO = 4;
const TIMEOUT_MS = 30000;
const MAX_IDADE_MIN = 30; // mensagem mais velha que isso nao vale mais responder no chat
const HISTORICO_MSGS = 16;
const MAX_TENTATIVAS = 3;

let timer = null;
let rodando = false;
const falhas = new Map(); // atendimentoId -> { tentativas, ate }

function primeiroNome(nome) {
  const p = String(nome || '').trim().split(/\s+/)[0] || '';
  if (!p || p.length < 2 || /\d|@/.test(p)) return '';
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}

function fmtMin(seg) {
  const s = Math.max(0, Math.floor(seg));
  return `${Math.floor(s / 3600)}h${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`;
}

async function chamarOpenAI({ modelo, mensagens, json = false, maxTokens = 400 }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY ausente');
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelo,
      messages: mensagens,
      temperature: json ? 0 : 0.4,
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}: ${body?.error?.message || ''}`.slice(0, 300));
  return { texto: body.choices?.[0]?.message?.content?.trim() || '', tokens: body.usage?.total_tokens || 0 };
}

// Momento da aula pelo relogio (a live e sincronizada com o inicio do webinar); fora da janela
// da live usa o quanto o aluno ja assistiu (replay).
function momentoDaAula(ctx) {
  const desdeInicio = ctx.data_inicio ? (Date.now() - new Date(ctx.data_inicio).getTime()) / 1000 : null;
  const aoVivo = desdeInicio != null && desdeInicio >= 0 && desdeInicio <= 4 * 3600;
  const segundo = aoVivo ? desdeInicio : Number(ctx.max_segundos || 0);
  const ofertaJaAbriu = ctx.inicio_oferta_segundos != null && segundo >= ctx.inicio_oferta_segundos;
  const pitchJaComecou = ctx.inicio_pitch_segundos != null && segundo >= ctx.inicio_pitch_segundos;
  return { aoVivo, segundo, ofertaJaAbriu, pitchJaComecou };
}

function montarConversa(historico, novasIds, nome) {
  return historico.map((m) => {
    const quem = m.remetente === 'lead' ? `ALUNO${nome ? ` (${nome})` : ''}` : 'EQUIPE';
    const marca = novasIds.has(m.id) ? ' [NOVA]' : '';
    return `${quem}${marca}: ${String(m.mensagem).slice(0, 600)}`;
  }).join('\n');
}

async function carregarContexto(atendimentoId) {
  const [[ctx]] = await pool.query(
    `SELECT a.id, a.webinar_id, a.lead_id, a.ia_processado_ate_msg_id, l.nome AS lead_nome,
            w.nome AS webinar_nome, w.data_inicio, oc.inicio_pitch_segundos, oc.inicio_oferta_segundos, oc.link_checkout,
            (SELECT MAX(vs.max_segundos) FROM view_sessions vs WHERE vs.webinar_id = a.webinar_id AND vs.lead_id = a.lead_id) AS max_segundos
     FROM atendimentos a
     JOIN leads l ON l.id = a.lead_id
     JOIN webinars w ON w.id = a.webinar_id
     LEFT JOIN webinar_offer_config oc ON oc.webinar_id = a.webinar_id
     WHERE a.id = ? LIMIT 1`,
    [atendimentoId],
  );
  const [desc] = await pool.query(
    'SELECT id, remetente, mensagem FROM atendimento_mensagens WHERE atendimento_id = ? ORDER BY id DESC LIMIT ?',
    [atendimentoId, HISTORICO_MSGS],
  );
  return { ctx, historico: desc.reverse() };
}

async function registrar(log) {
  await pool.query(
    `INSERT INTO chat_ia_log (webinar_id, atendimento_id, ate_msg_id, mensagens, responder, categoria, complexidade,
       passar_equipe, motivo, modelo, resposta, tokens, ms, erro)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [log.webinarId, log.atendimentoId, log.ateMsgId, log.mensagens || null, log.responder ? 1 : 0, log.categoria || null,
      log.complexidade || null, log.passarEquipe ? 1 : 0, (log.motivo || '').slice(0, 255) || null, log.modelo || null,
      log.resposta || null, log.tokens || null, log.ms || null, log.erro ? String(log.erro).slice(0, 500) : null],
  ).catch((err) => console.error('[chat-ia] falha ao gravar log:', err.message));
}

// Decide e (se for o caso) gera a resposta. Nao grava nada - usado pelo worker e pela simulacao.
async function decidirResposta({ ctx, historico, novas, cfg }) {
  const nome = primeiroNome(ctx.lead_nome);
  const novasIds = new Set(novas.map((m) => m.id));
  const momento = momentoDaAula(ctx);
  const conversa = montarConversa(historico, novasIds, nome);
  const situacao = [
    `MOMENTO DA AULA: ${momento.aoVivo ? 'ao vivo' : 'replay/fora do horário'}, em ${fmtMin(momento.segundo)} de aula.`,
    `Apresentação do FERA ${momento.pitchJaComecou ? 'JÁ COMEÇOU' : 'ainda não começou'}; oferta/botão de compra ${momento.ofertaJaAbriu ? 'JÁ APARECEU na tela' : 'AINDA NÃO apareceu'}.`,
    `Primeiro nome do aluno: ${nome || '(sem nome - não use nome)'}.`,
  ].join('\n');

  let tokens = 0;
  const triagemBruta = await chamarOpenAI({
    modelo: cfg.modelo_triagem,
    json: true,
    maxTokens: 120,
    mensagens: [
      { role: 'system', content: PROMPTS.TRIAGEM },
      { role: 'user', content: `${situacao}\n\nCONVERSA (mensagens marcadas [NOVA] são as que precisam de decisão):\n${conversa}` },
    ],
  });
  tokens += triagemBruta.tokens;
  let triagem;
  try { triagem = JSON.parse(triagemBruta.texto); } catch { throw new Error('triagem sem JSON: ' + triagemBruta.texto.slice(0, 120)); }

  const out = {
    responder: !!triagem.responder,
    categoria: triagem.categoria,
    complexidade: triagem.complexidade === 'elaborada' ? 'elaborada' : 'simples',
    passarEquipe: !!triagem.passar_equipe,
    motivo: triagem.motivo,
    nome,
    tokens,
    resposta: null,
    modelo: cfg.modelo_triagem,
  };
  if (!out.responder) return out;

  out.modelo = out.complexidade === 'elaborada' ? cfg.modelo_resposta : cfg.modelo_triagem;
  const promptBase = (cfg.prompt || PROMPTS.RESPOSTA).replace('{LINK_CHECKOUT}', ctx.link_checkout || 'clique no botão da tela');
  const gerada = await chamarOpenAI({
    modelo: out.modelo,
    maxTokens: 350,
    mensagens: [
      { role: 'system', content: promptBase },
      {
        role: 'user',
        content: `${situacao}\nTipo de dúvida (triagem): ${out.categoria}.${out.passarEquipe ? ' Precisa de uma pessoa da equipe: responda o que puder e diga que a equipe vai falar com ele no WhatsApp.' : ''}\n\nCONVERSA:\n${conversa}\n\nEscreva só a mensagem da Equipe para o aluno, respondendo as mensagens [NOVA].`,
      },
    ],
  });
  out.tokens += gerada.tokens;
  let texto = gerada.texto.replace(/^["']|["']$/g, '').replace(/^equipe:\s*/i, '').trim();
  // o nome tem que estar logo no comeco ("Ana, ..." ou "Boa noite, Ana! ...")
  if (nome && !texto.slice(0, 25).toLowerCase().includes(nome.toLowerCase())) texto = `${nome}, ${texto.charAt(0).toLowerCase()}${texto.slice(1)}`;
  out.resposta = texto.slice(0, 1000);
  return out;
}

async function processarAtendimento(cand) {
  const inicio = Date.now();
  const { ctx, historico } = await carregarContexto(cand.id);
  if (!ctx) return;
  const processadoAte = Number(ctx.ia_processado_ate_msg_id || 0);
  const novas = historico.filter((m) => m.remetente === 'lead' && Number(m.id) > processadoAte);
  if (novas.length === 0) return;
  const ateMsgId = Math.max(...novas.map((m) => Number(m.id)));

  // marca como analisado antes de chamar a OpenAI: o mesmo lote nunca e respondido duas vezes
  const [claim] = await pool.query(
    'UPDATE atendimentos SET ia_processado_ate_msg_id = ? WHERE id = ? AND COALESCE(ia_processado_ate_msg_id, 0) = ?',
    [ateMsgId, cand.id, processadoAte],
  );
  if (!claim.affectedRows) return;

  const textoNovas = novas.map((m) => m.mensagem).join(' | ').slice(0, 2000);
  try {
    const r = await decidirResposta({ ctx, historico, novas, cfg: cand });
    // aluno/equipe mexeu na conversa enquanto a IA pensava? descarta (o proximo ciclo pega)
    const [[agora]] = await pool.query(
      `SELECT a.atendente_id, a.ia_pausada,
              (SELECT MAX(id) FROM atendimento_mensagens WHERE atendimento_id = a.id) AS ultima_id,
              (SELECT remetente FROM atendimento_mensagens WHERE atendimento_id = a.id ORDER BY id DESC LIMIT 1) AS ultima_rem
       FROM atendimentos a WHERE a.id = ?`,
      [cand.id],
    );
    if (agora.atendente_id || agora.ia_pausada || (agora.ultima_rem !== 'lead')) {
      await registrar({ webinarId: ctx.webinar_id, atendimentoId: cand.id, ateMsgId, mensagens: textoNovas, ...r, responder: false, motivo: 'equipe assumiu durante a análise', ms: Date.now() - inicio });
      return;
    }
    if (Number(agora.ultima_id) > ateMsgId) {
      // chegou mensagem nova do aluno: devolve pro proximo ciclo analisar tudo junto
      await pool.query('UPDATE atendimentos SET ia_processado_ate_msg_id = ? WHERE id = ? AND ia_processado_ate_msg_id = ?', [processadoAte || null, cand.id, ateMsgId]);
      return;
    }

    if (r.responder && r.resposta) {
      await atendimentoSvc.addReply(cand.id, { remetente: 'ia', autorNome: 'Equipe', mensagem: r.resposta });
      if (r.passarEquipe) {
        // volta pra "Pendentes" do painel e a IA para de responder esse aluno
        await pool.query(
          "UPDATE atendimentos SET ia_pausada = 1, modo = 'humano', ultima_mensagem_remetente = 'lead', nao_lidas = nao_lidas + 1 WHERE id = ?",
          [cand.id],
        );
      } else {
        await pool.query("UPDATE atendimentos SET modo = 'ia', nao_lidas = 0 WHERE id = ? AND atendente_id IS NULL", [cand.id]);
      }
    }
    falhas.delete(cand.id);
    await registrar({ webinarId: ctx.webinar_id, atendimentoId: cand.id, ateMsgId, mensagens: textoNovas, ...r, ms: Date.now() - inicio });
  } catch (err) {
    const f = falhas.get(cand.id) || { tentativas: 0 };
    f.tentativas += 1;
    f.ate = Date.now() + 15000 * f.tentativas;
    falhas.set(cand.id, f);
    if (f.tentativas < MAX_TENTATIVAS) {
      // devolve o lote pra tentar de novo daqui a pouco
      await pool.query('UPDATE atendimentos SET ia_processado_ate_msg_id = ? WHERE id = ? AND ia_processado_ate_msg_id = ?', [processadoAte || null, cand.id, ateMsgId]);
    } else {
      falhas.delete(cand.id);
    }
    await registrar({ webinarId: ctx.webinar_id, atendimentoId: cand.id, ateMsgId, mensagens: textoNovas, erro: err.message, ms: Date.now() - inicio });
    console.error(`[chat-ia] atendimento ${cand.id}: ${err.message}`);
  }
}

async function tick() {
  if (!process.env.OPENAI_API_KEY) return;
  if (require('./alerts').getChatMode() === 'retido') return; // chat e secundario: segurado, nada sai
  const [cands] = await pool.query(
    `SELECT a.id, c.modelo_triagem, c.modelo_resposta, c.prompt
     FROM atendimentos a
     JOIN webinar_chat_ia_config c ON c.webinar_id = a.webinar_id AND c.habilitado = 1
     WHERE a.atendente_id IS NULL AND a.ia_pausada = 0 AND a.status <> 'encerrado'
       AND a.ultima_mensagem_remetente = 'lead'
       AND a.ultima_mensagem_lead_em <= NOW() - INTERVAL c.espera_segundos SECOND
       AND a.ultima_mensagem_lead_em >= NOW() - INTERVAL ? MINUTE
       AND a.respostas_ia < c.limite_respostas_por_aluno
       AND EXISTS (SELECT 1 FROM atendimento_mensagens m
                   WHERE m.atendimento_id = a.id AND m.remetente = 'lead' AND m.id > COALESCE(a.ia_processado_ate_msg_id, 0))
     ORDER BY a.ultima_mensagem_lead_em ASC
     LIMIT ?`,
    [MAX_IDADE_MIN, LOTE],
  );
  const prontos = cands.filter((c) => !(falhas.get(c.id)?.ate > Date.now()));
  for (let i = 0; i < prontos.length; i += PARALELO) {
    await Promise.all(prontos.slice(i, i + PARALELO).map((c) => processarAtendimento(c)));
  }
}

function startWorker() {
  if (timer) return;
  timer = setInterval(() => {
    if (rodando) return;
    rodando = true;
    tick().catch((err) => console.error('[chat-ia] erro no ciclo:', err.message)).finally(() => { rodando = false; });
  }, WORKER_MS);
}

module.exports = { startWorker, decidirResposta, carregarContexto, primeiroNome };
