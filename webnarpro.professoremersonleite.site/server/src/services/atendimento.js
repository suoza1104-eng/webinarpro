// Grava mensagens de atendimento e mantem as colunas desnormalizadas de `atendimentos`
// (ultima mensagem, nao lidas, contadores) - e o que deixa a lista da Sala de Atendimento
// barata de montar mesmo com centenas de conversas abertas numa live.
const pool = require('../db');

async function findOrCreateAtendimento(webinarId, leadId, modoInicial = 'humano') {
  const [existing] = await pool.query(
    'SELECT id FROM atendimentos WHERE webinar_id = ? AND lead_id = ? LIMIT 1',
    [webinarId, leadId],
  );
  if (existing.length > 0) return existing[0].id;
  const [result] = await pool.query(
    'INSERT INTO atendimentos (webinar_id, lead_id, modo) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
    [webinarId, leadId, modoInicial],
  );
  return result.insertId;
}

// Mensagem do aluno: conta como nao lida e reabre a conversa se ela tinha sido encerrada.
async function addLeadMessage(atendimentoId, mensagem) {
  const [result] = await pool.query(
    "INSERT INTO atendimento_mensagens (atendimento_id, remetente, mensagem) VALUES (?, 'lead', ?)",
    [atendimentoId, mensagem],
  );
  await pool.query(
    `UPDATE atendimentos
     SET ultima_mensagem_em = NOW(), ultima_mensagem_lead_em = NOW(),
         ultima_mensagem_texto = ?, ultima_mensagem_remetente = 'lead',
         nao_lidas = nao_lidas + 1, total_mensagens_lead = total_mensagens_lead + 1,
         status = IF(status = 'encerrado', 'aberto', status)
     WHERE id = ?`,
    [mensagem, atendimentoId],
  );
  return result.insertId;
}

// Resposta (equipe, IA ou mensagem do sistema). Com externalId repetido nao duplica -
// devolve { duplicada: true } pra quem chamou (reenvio do Sino, por exemplo).
async function addReply(atendimentoId, { remetente, mensagem, autorNome = null, externalId = null }) {
  try {
    const [result] = await pool.query(
      'INSERT INTO atendimento_mensagens (atendimento_id, remetente, autor_nome, mensagem, external_id) VALUES (?, ?, ?, ?, ?)',
      [atendimentoId, remetente, autorNome, mensagem, externalId],
    );
    const contaComoResposta = remetente === 'suporte' || remetente === 'ia';
    await pool.query(
      `UPDATE atendimentos
       SET ultima_mensagem_em = NOW(), ultima_mensagem_texto = ?, ultima_mensagem_remetente = ?
           ${contaComoResposta ? ', ultima_resposta_em = NOW()' : ''}
           ${remetente === 'ia' ? ', respostas_ia = respostas_ia + 1' : ''}
       WHERE id = ?`,
      [mensagem, remetente, atendimentoId],
    );
    return { id: result.insertId, duplicada: false };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' && externalId) return { id: null, duplicada: true };
    throw err;
  }
}

async function markRead(atendimentoId) {
  await pool.query('UPDATE atendimentos SET nao_lidas = 0 WHERE id = ? AND nao_lidas > 0', [atendimentoId]);
}

module.exports = { findOrCreateAtendimento, addLeadMessage, addReply, markRead };
