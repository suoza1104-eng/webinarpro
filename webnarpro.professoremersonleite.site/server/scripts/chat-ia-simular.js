// Simula a IA do chat em conversas reais de lives passadas, sem gravar nada (so le o banco e
// chama a OpenAI). Pra cada conversa, pega o primeiro "lote" de mensagens do aluno (mensagens
// com menos de 2 min entre si) e mostra a decisao da triagem e a resposta que seria enviada.
// Uso: node scripts/chat-ia-simular.js <webinarId> [quantidade=20] [filtro-regex] [webinarId-do-prompt]
// (o ultimo argumento usa o "Prompt do webinar" de outro webinar, ex.: testar o prompt da proxima aula
// nas conversas da aula passada)
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../src/db');
const { decidirResposta, carregarContexto } = require('../src/services/chat-ia');

const [webinarId, qtd = '20', filtro = '', webinarPrompt] = process.argv.slice(2);
const cfg = { modelo_triagem: 'gpt-4.1-mini', modelo_resposta: 'gpt-4.1', prompt: null, conhecimento: null };

(async () => {
  const [[s]] = await pool.query('SELECT prompt FROM webinar_sino_config WHERE webinar_id = ?', [webinarPrompt || webinarId]);
  cfg.conhecimento = s?.prompt || null;
  console.log(`conhecimento: ${cfg.conhecimento ? `prompt do painel (webinar ${webinarPrompt || webinarId})` : 'padrão do código'}`);
  const [ats] = await pool.query(
    `SELECT a.id FROM atendimentos a
     WHERE a.webinar_id = ? AND EXISTS (SELECT 1 FROM atendimento_mensagens m WHERE m.atendimento_id = a.id AND m.remetente = 'lead' AND m.mensagem REGEXP ?)
     ORDER BY RAND() LIMIT ?`,
    [webinarId, filtro || '.', Number(qtd)],
  );
  for (const { id } of ats) {
    const { ctx } = await carregarContexto(id);
    const [msgs] = await pool.query('SELECT id, remetente, mensagem, criado_em FROM atendimento_mensagens WHERE atendimento_id = ? ORDER BY id', [id]);
    const leads = msgs.filter((m) => m.remetente === 'lead');
    let ini = filtro ? Math.max(0, leads.findIndex((m) => new RegExp(filtro, 'i').test(m.mensagem))) : 0;
    const lote = [leads[ini]];
    for (let i = ini + 1; i < leads.length && new Date(leads[i].criado_em) - new Date(lote[lote.length - 1].criado_em) < 120000; i += 1) lote.push(leads[i]);
    const ultimo = lote[lote.length - 1];
    const historico = msgs.filter((m) => m.id <= ultimo.id).slice(-16);
    // "volta no tempo": a IA ve o momento da aula em que o aluno mandou a mensagem
    const desvio = Date.now() - new Date(ultimo.criado_em).getTime();
    const ctxSim = { ...ctx, data_inicio: new Date(new Date(ctx.data_inicio).getTime() + desvio) };
    try {
      const r = await decidirResposta({ ctx: ctxSim, historico, novas: lote, cfg });
      console.log(`\n#${id} [${new Date(ultimo.criado_em).toTimeString().slice(0, 5)}] ALUNO: ${lote.map((m) => m.mensagem).join(' | ')}`);
      console.log(`   -> ${r.responder ? 'RESPONDE' : 'ignora'} · ${r.categoria} · ${r.complexidade}${r.passarEquipe ? ' · PASSA PRA EQUIPE' : ''} · ${r.modelo} · ${r.motivo}`);
      if (r.resposta) console.log(`   EQUIPE: ${r.resposta}`);
    } catch (err) {
      console.log(`\n#${id} ERRO: ${err.message}`);
    }
  }
  await pool.end();
})();
