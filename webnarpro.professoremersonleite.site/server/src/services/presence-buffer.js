// Presenca em lote: cada aluno manda um ping a cada 30s. Gravar um por um vira ~100 upserts
// por segundo em view_sessions com 3.000 alunos, e eles disputam trava no banco (no teste de
// carga de 22/10 o p95 da presenca foi a 4,4s). Aqui os pings ficam em memoria (so o maior
// segundo de cada aluno) e vao pro banco num INSERT de varias linhas a cada 2s.
// A contagem de "ao vivo" usa janela de 70s, entao 2s de atraso nao aparecem em lugar nenhum.
const pool = require('../db');

const FLUSH_MS = 2000;
const LOTE = 500;
let pending = new Map();
let timer = null;
let flushing = false;

function add(webinarId, leadId, isReplay, segundos) {
  const key = `${webinarId}:${leadId}:${isReplay}`;
  const prev = pending.get(key);
  if (!prev || segundos > prev[3]) pending.set(key, [webinarId, leadId, isReplay, segundos]);
}

async function flush() {
  if (flushing || pending.size === 0) return;
  flushing = true;
  const batch = pending;
  pending = new Map();
  // ordem fixa das chaves evita deadlock entre dois lotes concorrentes
  const rows = [...batch.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  try {
    for (let i = 0; i < rows.length; i += LOTE) {
      await pool.query(
        `INSERT INTO view_sessions (webinar_id, lead_id, is_replay, max_segundos) VALUES ?
         ON DUPLICATE KEY UPDATE max_segundos = GREATEST(max_segundos, VALUES(max_segundos)), atualizado_em = CURRENT_TIMESTAMP`,
        [rows.slice(i, i + LOTE)],
      );
    }
  } catch (err) {
    console.error(`[presenca] falha ao gravar lote de ${rows.length}: ${err.message} - tenta de novo no proximo ciclo`);
    for (const r of rows) add(r[0], r[1], r[2], r[3]);
  } finally {
    flushing = false;
  }
}

function start() {
  if (timer) return;
  timer = setInterval(() => { flush().catch(() => {}); }, FLUSH_MS);
  // pm2 restart manda SIGINT/SIGTERM: grava o que estiver pendente antes de sair
  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.once(sig, () => {
      clearInterval(timer);
      flush().finally(() => process.exit(0));
    });
  }
}

module.exports = { add, flush, start };
